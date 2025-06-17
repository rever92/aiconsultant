import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
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

      // Según la documentación, con response_format: 'text', la respuesta es directamente el string
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

// Función para dividir audio en segmentos por tiempo
async function splitAudioByTime(audioPath: string, durationSeconds: number, maxSizeMB: number): Promise<{
  segments: string[];
  segmentDurations: number[];
}> {
  const audioConfig = await getBestAudioCodec();
  
  // Calcular duración aproximada por segmento basada en el tamaño máximo
  // Estimación: 1 minuto de audio mono 16kHz 64kbps ≈ 0.5MB
  const estimatedMBPerMinute = 0.5;
  const maxMinutesPerSegment = (maxSizeMB * 0.9) / estimatedMBPerMinute; // 90% del límite por seguridad
  const maxSecondsPerSegment = Math.floor(maxMinutesPerSegment * 60);
  
  console.log(`Dividiendo audio en segmentos de máximo ${maxSecondsPerSegment} segundos`);
  
  const segments: string[] = [];
  const segmentDurations: number[] = [];
  let currentTime = 0;
  let segmentIndex = 0;

  while (currentTime < durationSeconds) {
    const remainingTime = durationSeconds - currentTime;
    const segmentDuration = Math.min(maxSecondsPerSegment, remainingTime);
    
    const segmentPath = join(tmpdir(), `segment_${Date.now()}_${segmentIndex}.${audioConfig.extension}`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .setStartTime(currentTime)
        .setDuration(segmentDuration)
        .output(segmentPath)
        .audioCodec(audioConfig.codec)
        .audioChannels(1)
        .audioFrequency(16000)
        .audioBitrate('64k')
        .format(audioConfig.format)
        .on('end', () => {
          console.log(`Segmento ${segmentIndex} creado: ${segmentDuration}s`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error creando segmento ${segmentIndex}:`, err);
          reject(err);
        })
        .run();
    });

    segments.push(segmentPath);
    segmentDurations.push(segmentDuration);
    currentTime += segmentDuration;
    segmentIndex++;
  }

  return { segments, segmentDurations };
}

export async function POST(request: NextRequest) {
  const segmentPaths: string[] = []; // Para limpiar al final
  
  try {
    console.log('Iniciando transcripción con división automática...');
    
    const data = await request.formData();
    const audioPath = data.get('audioPath') as string;
    const audioSize = parseFloat(data.get('audioSize') as string);
    const duration = parseFloat(data.get('duration') as string);
    const fileName = data.get('fileName') as string;
    const maxSizeMB = parseFloat(data.get('maxSize') as string);

    if (!audioPath || !audioSize || !duration || !fileName || !maxSizeMB) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos para la división y transcripción.' 
      }, { status: 400 });
    }

    // Verificar que el archivo de audio original existe
    if (!existsSync(audioPath)) {
      return NextResponse.json({ 
        error: 'El archivo de audio original no existe o ha expirado.' 
      }, { status: 404 });
    }

    console.log(`Audio: ${audioSize}MB, Duración: ${duration}min, Límite: ${maxSizeMB}MB`);

    // Si el archivo es pequeño, transcribir directamente
    if (audioSize <= maxSizeMB) {
      console.log('Archivo pequeño, transcripción directa...');
      
      const audioBuffer = await readFile(audioPath);
      const extension = fileName.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'mp3' ? 'audio/mp3' : 
                      extension === 'm4a' ? 'audio/m4a' : 'audio/wav';

      const audioFile = new File([audioBuffer], fileName, { type: mimeType });
      const transcription = await transcribeWithRetry(groq, audioFile);

      console.log(`Transcripción simple completada: ${transcription.length} caracteres`);
      console.log(`Primeros 200 caracteres: "${transcription.substring(0, 200)}..."`);

      // Limpiar archivo original
      await unlink(audioPath).catch(() => {});

      const responseData = {
        transcription: transcription,
        segments: 1,
        totalDuration: duration,
        message: 'Transcripción completada exitosamente'
      };

      console.log('📤 Enviando respuesta al frontend (simple):', {
        hasTranscription: !!responseData.transcription,
        transcriptionLength: responseData.transcription?.length || 0,
        segments: responseData.segments
      });

      return NextResponse.json(responseData);
    }

    // Archivo grande: dividir en segmentos
    console.log('Archivo grande, dividiendo en segmentos...');
    
    const durationSeconds = duration * 60;
    const { segments, segmentDurations } = await splitAudioByTime(audioPath, durationSeconds, maxSizeMB);
    segmentPaths.push(...segments);
    
    console.log(`Audio dividido en ${segments.length} segmentos`);

    // Transcribir cada segmento con manejo de errores parciales
    const transcriptions: (string | null)[] = new Array(segments.length).fill(null);
    const failedSegments: number[] = [];
    const audioConfig = await getBestAudioCodec();
    
    for (let i = 0; i < segments.length; i++) {
      try {
        console.log(`Transcribiendo segmento ${i + 1}/${segments.length}...`);
        
        // Verificar tamaño del segmento
        const segmentBuffer = await readFile(segments[i]);
        const segmentSizeMB = segmentBuffer.length / (1024 * 1024);
        console.log(`Segmento ${i + 1}: ${segmentSizeMB.toFixed(2)}MB`);
        
        if (segmentSizeMB > maxSizeMB) {
          throw new Error(`Segmento ${i + 1} aún es muy grande: ${segmentSizeMB.toFixed(2)}MB`);
        }

        const mimeType = audioConfig.extension === 'mp3' ? 'audio/mp3' : 
                        audioConfig.extension === 'm4a' ? 'audio/m4a' : 'audio/wav';
        
        const segmentFile = new File([segmentBuffer], `segment_${i + 1}.${audioConfig.extension}`, {
          type: mimeType
        });

        const segmentTranscription = await transcribeWithRetry(groq, segmentFile);
        transcriptions[i] = segmentTranscription;
        
        console.log(`✅ Segmento ${i + 1}/${segments.length} completado`);
        
      } catch (segmentError) {
        console.error(`❌ Error transcribiendo segmento ${i + 1}:`, segmentError);
        transcriptions[i] = null;
        failedSegments.push(i);
        
        // No lanzar error inmediatamente, continuar con otros segmentos
        console.log(`⏭️ Continuando con segmento ${i + 2}...`);
      }
    }

    // Verificar si hay segmentos completados exitosamente
    const successfulSegments = transcriptions.filter(t => t !== null).length;
    console.log(`📊 Resumen: ${successfulSegments}/${segments.length} segmentos completados`);
    
    if (successfulSegments === 0) {
      // Si ningún segmento fue exitoso, lanzar error
      throw new Error('Ningún segmento pudo ser transcripto. Revisa tu conexión a internet y la API de Groq.');
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
            return `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}] ❌ ERROR: Este segmento falló durante la transcripción`;
          }
          return `❌ ERROR: Segmento ${index + 1} falló durante la transcripción`;
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

    console.log(`Transcripción parcial completada: ${successfulSegments}/${segments.length} segmentos`);
    console.log(`Longitud de transcripción final: ${fullTranscription.length} caracteres`);
    console.log(`Primeros 200 caracteres: "${fullTranscription.substring(0, 200)}..."`);

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
      message: isPartialSuccess 
        ? `Transcripción parcialmente completada: ${successfulSegments}/${segments.length} segmentos exitosos`
        : `Transcripción completada exitosamente (${segments.length} segmentos procesados)`
    };

    console.log('📤 Enviando respuesta al frontend:', {
      hasTranscription: !!responseData.transcription,
      transcriptionLength: responseData.transcription?.length || 0,
      segments: responseData.segments,
      message: responseData.message
    });

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error en la transcripción dividida:', error);
    
    // Limpiar archivos en caso de error
    const cleanupPromises = segmentPaths.map(path => unlink(path).catch(() => {}));
    await Promise.all(cleanupPromises);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en la transcripción dividida: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Configuración de ruta para archivos grandes y procesamiento largo
export const maxDuration = 300; // 5 minutos para procesar múltiples segmentos 