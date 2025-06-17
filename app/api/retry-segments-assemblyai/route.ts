import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { AssemblyAI } from 'assemblyai';

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY,
});

// Función para transcribir con AssemblyAI con reintentos automáticos
async function transcribeWithAssemblyAI(audioBuffer: Buffer, fileName: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AssemblyAI - Intento de transcripción ${attempt}/${maxRetries}...`);
      
      // Subir el archivo a AssemblyAI
      console.log('Subiendo archivo a AssemblyAI...');
      const uploadUrl = await client.files.upload(audioBuffer);
      console.log('Archivo subido exitosamente');

      // Configurar parámetros de transcripción
      const params = {
        audio: uploadUrl,
        speech_model: 'universal' as const,
        language_code: 'es' as const,
      };

      console.log('Iniciando transcripción con AssemblyAI...');
      const transcript = await client.transcripts.transcribe(params);

      if (transcript.status === 'error') {
        throw new Error(`Error de AssemblyAI: ${transcript.error}`);
      }

      if (!transcript.text) {
        throw new Error('No se pudo obtener el texto de la transcripción');
      }

      console.log('🎙️ Transcripción AssemblyAI completada');
      console.log('🎙️ Longitud del resultado:', transcript.text.length);
      
      return transcript.text;
    } catch (error) {
      console.error(`Error en intento ${attempt} con AssemblyAI:`, error);
      
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
    console.log('Iniciando reintento de segmentos fallidos con AssemblyAI...');
    
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
    console.log(`Reintentando ${failedSegments.length} segmentos fallidos con AssemblyAI`);

    const retryResults: { [key: number]: string } = {};
    const stillFailedSegments: any[] = [];

    // Reintentar cada segmento fallido
    for (const segment of failedSegments) {
      try {
        console.log(`🔄 Reintentando segmento ${segment.segmentNumber} con AssemblyAI...`);
        
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
        
        // AssemblyAI puede manejar archivos más grandes
        if (segmentSizeMB > 200) {
          console.error(`❌ Segmento ${segment.segmentNumber} muy grande: ${segmentSizeMB.toFixed(2)}MB`);
          stillFailedSegments.push({
            ...segment,
            error: `Tamaño muy grande: ${segmentSizeMB.toFixed(2)}MB > 200MB`
          });
          continue;
        }

        const segmentTranscription = await transcribeWithAssemblyAI(segmentBuffer, `retry_segment_${segment.segmentNumber}.audio`);
        retryResults[segment.index] = segmentTranscription;
        
        console.log(`✅ Segmento ${segment.segmentNumber} reintentado exitosamente con AssemblyAI`);
        
        // Limpiar archivo del segmento exitoso
        await unlink(segment.path).catch(() => {});
        
      } catch (segmentError) {
        console.error(`❌ Error reintentando segmento ${segment.segmentNumber} con AssemblyAI:`, segmentError);
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

    console.log(`🎯 Resultado del reintento AssemblyAI: ${totalRetried}/${failedSegments.length} segmentos recuperados`);

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
      provider: 'assemblyai',
      message: allFixed 
        ? `¡Todos los segmentos recuperados exitosamente con AssemblyAI! (${totalRetried} segmentos reintentados)`
        : `${totalRetried} segmentos recuperados con AssemblyAI, ${stillFailedSegments.length} aún con problemas`
    });

  } catch (error) {
    console.error('Error en el reintento de segmentos con AssemblyAI:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en el reintento con AssemblyAI: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const maxDuration = 150; // 2.5 minutos para reintentos 