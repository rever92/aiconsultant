import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import Groq from 'groq-sdk';
import { getBestAudioCodec } from '@/lib/ffmpeg-config';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Función para transcribir con reintentos automáticos
async function transcribeWithRetry(groqClient: Groq, audioFile: File, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Intento de transcripción ${attempt}/${maxRetries}...`);
      
      const transcription = await groqClient.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3-turbo',
        language: 'es', // Español
        response_format: 'text',
        temperature: 0.0
      });

      console.log('🎙️ Respuesta cruda de Groq - tipo:', typeof transcription);
      console.log('🎙️ Es string?', typeof transcription === 'string');
      console.log('🎙️ Contenido:', String(transcription).substring(0, 100) + '...');

      const result = typeof transcription === 'string' ? transcription : (transcription as any).text;
      console.log('🎙️ Resultado final length:', result?.length || 0);
      return result;
    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Reintentando en ${delay/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Máximo número de reintentos alcanzado');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando reintento de segmentos fallidos...');
    
    const data = await request.formData();
    const failedSegmentsData = data.get('failedSegments') as string;
    const originalTranscription = data.get('originalTranscription') as string;
    const maxSizeMB = parseFloat(data.get('maxSize') as string);

    if (!failedSegmentsData || !originalTranscription) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos para el reintento de segmentos.' 
      }, { status: 400 });
    }

    const failedSegments = JSON.parse(failedSegmentsData);
    console.log(`Reintentando ${failedSegments.length} segmentos fallidos`);

    const audioConfig = await getBestAudioCodec();
    const retryResults: { [key: number]: string } = {};
    const stillFailedSegments: any[] = [];

    // Reintentar cada segmento fallido
    for (const segment of failedSegments) {
      try {
        console.log(`🔄 Reintentando segmento ${segment.segmentNumber}...`);
        
        // Verificar que el archivo del segmento existe
        if (!existsSync(segment.path)) {
          console.error(`❌ Archivo del segmento ${segment.segmentNumber} no encontrado`);
          stillFailedSegments.push(segment);
          continue;
        }

        // Leer y verificar tamaño del segmento
        const segmentBuffer = await readFile(segment.path);
        const segmentSizeMB = segmentBuffer.length / (1024 * 1024);
        console.log(`Segmento ${segment.segmentNumber}: ${segmentSizeMB.toFixed(2)}MB`);
        
        if (segmentSizeMB > maxSizeMB) {
          console.error(`❌ Segmento ${segment.segmentNumber} muy grande: ${segmentSizeMB.toFixed(2)}MB`);
          stillFailedSegments.push({
            ...segment,
            error: `Tamaño muy grande: ${segmentSizeMB.toFixed(2)}MB > ${maxSizeMB}MB`
          });
          continue;
        }

        const mimeType = audioConfig.extension === 'mp3' ? 'audio/mp3' : 
                        audioConfig.extension === 'm4a' ? 'audio/m4a' : 'audio/wav';
        
        const segmentFile = new File([segmentBuffer], `retry_segment_${segment.segmentNumber}.${audioConfig.extension}`, {
          type: mimeType
        });

        const segmentTranscription = await transcribeWithRetry(groq, segmentFile);
        retryResults[segment.index] = segmentTranscription;
        
        console.log(`✅ Segmento ${segment.segmentNumber} reintentado exitosamente`);
        
        // Limpiar archivo del segmento exitoso
        await unlink(segment.path).catch(() => {});
        
      } catch (segmentError) {
        console.error(`❌ Error reintentando segmento ${segment.segmentNumber}:`, segmentError);
        stillFailedSegments.push({
          ...segment,
          error: segmentError instanceof Error ? segmentError.message : 'Error desconocido'
        });
      }
    }

    // Combinar transcripción original con nuevos resultados
    const originalLines = originalTranscription.split('\n\n');
    const updatedLines = originalLines.map((line, index) => {
      if (retryResults[index]) {
        // Reemplazar línea de error con nueva transcripción
        const isTimestamped = line.includes('[') && line.includes(']');
        if (isTimestamped) {
          const timestamp = line.match(/\[(\d{2}:\d{2})\]/)?.[0] || '';
          return `${timestamp} ${retryResults[index]}`;
        }
        return retryResults[index];
      }
      return line;
    });

    const updatedTranscription = updatedLines.join('\n\n');
    const totalRetried = Object.keys(retryResults).length;
    const allFixed = stillFailedSegments.length === 0;

    console.log(`🎯 Resultado del reintento: ${totalRetried}/${failedSegments.length} segmentos recuperados`);

    // Limpiar archivos de segmentos aún fallidos si no hay más reintentos
    if (allFixed) {
      const cleanupPromises = stillFailedSegments.map(seg => 
        unlink(seg.path).catch(() => {})
      );
      await Promise.all(cleanupPromises);
    }

    return NextResponse.json({
      transcription: updatedTranscription,
      retriedSegments: totalRetried,
      stillFailedSegments,
      allFixed,
      message: allFixed 
        ? `¡Todos los segmentos recuperados exitosamente! (${totalRetried} segmentos reintentados)`
        : `${totalRetried} segmentos recuperados, ${stillFailedSegments.length} aún con problemas`
    });

  } catch (error) {
    console.error('Error en el reintento de segmentos:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en el reintento: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const maxDuration = 120; // 2 minutos para reintentos 