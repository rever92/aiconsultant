import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { getBestAudioCodec } from '@/lib/ffmpeg-config';
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

// Función para dividir audio en segmentos
async function splitAudio(audioPath: string, duration: number, maxSizeMB: number): Promise<{ segments: string[], segmentDurations: number[] }> {
  console.log(`Dividiendo audio de ${duration} minutos en segmentos...`);
  
  // AssemblyAI puede manejar archivos más grandes que Groq
  // Usar un límite conservador de 100MB por segmento (AssemblyAI maneja hasta 200MB+)
  const targetSegmentMinutes = maxSizeMB > 50 ? 60 : 45; // Segmentos más largos para AssemblyAI
  const segmentDurationSeconds = targetSegmentMinutes * 60;
  
  const numberOfSegments = Math.ceil((duration * 60) / segmentDurationSeconds);
  console.log(`Creando ${numberOfSegments} segmentos de ~${targetSegmentMinutes} minutos cada uno`);
  
  const segments: string[] = [];
  const segmentDurations: number[] = [];
  const audioConfig = await getBestAudioCodec();
  
  for (let i = 0; i < numberOfSegments; i++) {
    const startTime = i * segmentDurationSeconds;
    const remainingDuration = (duration * 60) - startTime;
    const currentSegmentDuration = Math.min(segmentDurationSeconds, remainingDuration);
    
    const segmentPath = join(tmpdir(), `segment_${i + 1}_${Date.now()}.${audioConfig.extension}`);
    
    console.log(`Segmento ${i + 1} creado: ${Math.round(currentSegmentDuration)}s`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .seekInput(startTime)
        .duration(currentSegmentDuration)
        .audioCodec(audioConfig.codec)
        .audioFrequency(16000)
        .audioChannels(1)
        .audioBitrate('64k')
        .format(audioConfig.format)
        .output(segmentPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });
    
    segments.push(segmentPath);
    segmentDurations.push(currentSegmentDuration);
  }
  
  console.log(`Audio dividido en ${segments.length} segmentos`);
  return { segments, segmentDurations };
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando transcripción dividida con AssemblyAI...');
    
    const data = await request.formData();
    const audioPath = data.get('audioPath') as string;
    const audioSize = parseFloat(data.get('audioSize') as string);
    const duration = parseFloat(data.get('duration') as string);
    const fileName = data.get('fileName') as string;
    const maxSizeMB = parseFloat(data.get('maxSize') as string);

    if (!audioPath || !audioSize || !duration || !fileName) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos para la transcripción dividida.' 
      }, { status: 400 });
    }

    console.log(`Archivo: ${fileName}, Tamaño: ${audioSize}MB, Duración: ${duration}min`);

    // Verificar que el archivo existe
    if (!existsSync(audioPath)) {
      return NextResponse.json({ 
        error: 'El archivo de audio no existe. Vuelve a convertir el video.' 
      }, { status: 404 });
    }

    // Dividir el audio en segmentos
    const { segments, segmentDurations } = await splitAudio(audioPath, duration, maxSizeMB);
    const segmentPaths = segments;

    // Transcribir cada segmento con manejo de errores parciales
    const transcriptions: (string | null)[] = new Array(segments.length).fill(null);
    const failedSegments: number[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      try {
        console.log(`Transcribiendo segmento ${i + 1}/${segments.length} con AssemblyAI...`);
        
        // Verificar tamaño del segmento
        const segmentBuffer = await readFile(segments[i]);
        const segmentSizeMB = segmentBuffer.length / (1024 * 1024);
        console.log(`Segmento ${i + 1}: ${segmentSizeMB.toFixed(2)}MB`);
        
        // AssemblyAI puede manejar archivos mucho más grandes que Groq
        if (segmentSizeMB > 200) { // Límite muy conservador para AssemblyAI
          throw new Error(`Segmento ${i + 1} aún es muy grande: ${segmentSizeMB.toFixed(2)}MB`);
        }

        const segmentTranscription = await transcribeWithAssemblyAI(segmentBuffer, `segment_${i + 1}.${fileName.split('.').pop()}`);
        transcriptions[i] = segmentTranscription;
        
        console.log(`✅ Segmento ${i + 1}/${segments.length} completado con AssemblyAI`);
        
      } catch (segmentError) {
        console.error(`❌ Error transcribiendo segmento ${i + 1} con AssemblyAI:`, segmentError);
        transcriptions[i] = null;
        failedSegments.push(i);
        
        console.log(`⏭️ Continuando con segmento ${i + 2}...`);
      }
    }

    // Verificar si hay segmentos completados exitosamente
    const successfulSegments = transcriptions.filter(t => t !== null).length;
    console.log(`📊 Resumen AssemblyAI: ${successfulSegments}/${segments.length} segmentos completados`);
    
    if (successfulSegments === 0) {
      throw new Error('Ningún segmento pudo ser transcripto con AssemblyAI. Revisa tu conexión a internet y la API key.');
    }

    // Combinar transcripciones exitosas y marcar segmentos fallidos
    const fullTranscription = transcriptions
      .map((text, index) => {
        if (text === null) {
          // Segmento fallido - agregar marcador
          if (segments.length > 3) {
            const startTime = segmentDurations.slice(0, index).reduce((sum, dur) => sum + dur, 0);
            const minutes = Math.floor(startTime / 60);
            const seconds = Math.floor(startTime % 60);
            return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}] ❌ ERROR: Este segmento falló durante la transcripción con AssemblyAI`;
          }
          return `❌ ERROR: Segmento ${index + 1} falló durante la transcripción con AssemblyAI`;
        }
        
        // Segmento exitoso - agregar marcadores de tiempo si es necesario
        if (segments.length > 3) {
          const startTime = segmentDurations.slice(0, index).reduce((sum, dur) => sum + dur, 0);
          const minutes = Math.floor(startTime / 60);
          const seconds = Math.floor(startTime % 60);
          return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}] ${text}`;
        }
        return text;
      })
      .join('\n\n');

    console.log(`Transcripción AssemblyAI parcial completada: ${successfulSegments}/${segments.length} segmentos`);
    console.log(`Longitud de transcripción final: ${fullTranscription.length} caracteres`);

    // Solo limpiar archivos de segmentos exitosos (mantener los fallidos para reintento)
    const cleanupPromises = [
      unlink(audioPath).catch(() => {}), // Limpiar audio original
      ...segmentPaths
        .filter((_, index) => transcriptions[index] !== null) // Solo segmentos exitosos
        .map(path => unlink(path).catch(() => {}))
    ];
    await Promise.all(cleanupPromises);

    // Preparar respuesta con información de recuperación
    const isPartialSuccess = failedSegments.length > 0;
    const responseData = {
      transcription: fullTranscription,
      segments: segments.length,
      successfulSegments,
      failedSegments: failedSegments.map(i => ({
        index: i,
        segmentNumber: i + 1,
        path: segmentPaths[i],
        duration: Math.round(segmentDurations[i] / 60 * 100) / 100
      })),
      totalDuration: duration,
      segmentDurations: segmentDurations.map(dur => Math.round(dur / 60 * 100) / 100),
      isPartialSuccess,
      provider: 'assemblyai',
      message: isPartialSuccess 
        ? `Transcripción parcialmente completada con AssemblyAI: ${successfulSegments}/${segments.length} segmentos exitosos`
        : `Transcripción completada exitosamente con AssemblyAI (${segments.length} segmentos procesados)`
    };

    console.log('🎯 Respuesta AssemblyAI preparada:', {
      segments: responseData.segments,
      successful: responseData.successfulSegments,
      failed: responseData.failedSegments.length,
      provider: responseData.provider
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error en la transcripción dividida con AssemblyAI:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en la transcripción dividida con AssemblyAI: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export const maxDuration = 180; // 3 minutos para AssemblyAI (pueden ser segmentos más largos) 