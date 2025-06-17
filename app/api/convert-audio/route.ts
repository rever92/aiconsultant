import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import ffmpeg from 'fluent-ffmpeg';
import { checkFfmpegInstallation, getBestAudioCodec } from '@/lib/ffmpeg-config';

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando conversión de video a audio...');
    
    // Verificar que FFmpeg esté disponible
    const ffmpegAvailable = await checkFfmpegInstallation();
    if (!ffmpegAvailable) {
      return NextResponse.json(
        { error: 'FFmpeg no está instalado o no está disponible en el sistema' },
        { status: 500 }
      );
    }
    
    const data = await request.formData();
    const file = data.get('video') as File;

    if (!file) {
      console.error('No se recibió archivo');
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });
    }

    if (!file.type.includes('video/mp4')) {
      console.error('Tipo de archivo no válido:', file.type);
      return NextResponse.json({ error: 'Solo se permiten archivos MP4' }, { status: 400 });
    }

    console.log(`Procesando archivo: ${file.name}, tamaño: ${file.size} bytes`);

    // Verificar tamaño del video (límite flexible para procesamiento)
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Tamaño del video: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 1000) { // 1GB límite para video de entrada
      return NextResponse.json(
        { error: `El video es demasiado grande (${fileSizeMB.toFixed(1)}MB). Máximo: 1GB. Considera comprimirlo.` },
        { status: 400 }
      );
    }

    // Obtener el mejor codec disponible
    const audioConfig = await getBestAudioCodec();
    console.log(`Usando codec de audio: ${audioConfig.codec} (${audioConfig.format})`);

    // Generar nombres únicos para los archivos temporales
    const timestamp = Date.now();
    const videoPath = join(tmpdir(), `video_${timestamp}.mp4`);
    const audioPath = join(tmpdir(), `audio_${timestamp}.${audioConfig.extension}`);

    try {
      // Guardar el video temporal
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(videoPath, buffer);
      console.log('Video guardado temporalmente en:', videoPath);

      // Extraer información del video primero
      console.log('Analizando información del video...');
      const videoInfo = await new Promise<any>((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
          if (err) {
            reject(err);
          } else {
            resolve(metadata);
          }
        });
      });

      const duration = videoInfo.format?.duration || 0;
      const durationMinutes = Math.round(duration / 60 * 100) / 100;

      console.log(`Duración del video: ${durationMinutes} minutos`);

      // Extraer audio usando ffmpeg con configuración optimizada para Groq
      console.log('Extrayendo audio del video...');
      await new Promise<void>((resolve, reject) => {
        const ffmpegCommand = ffmpeg(videoPath)
          .output(audioPath)
          .audioCodec(audioConfig.codec)
          .audioChannels(1) // Mono para reducir tamaño
          .audioFrequency(16000) // 16kHz óptimo para Whisper
          .audioBitrate('64k'); // Bitrate bajo para reducir tamaño del archivo

        // Configuración específica por codec
        if (audioConfig.codec === 'libmp3lame') {
          ffmpegCommand.format('mp3');
        } else if (audioConfig.codec === 'aac') {
          ffmpegCommand.format('adts');
        } else {
          // WAV por defecto
          ffmpegCommand.format('wav');
        }

        ffmpegCommand
          .on('progress', (progress) => {
            console.log(`Progreso de conversión: ${Math.round(progress.percent || 0)}%`);
          })
          .on('end', () => {
            console.log('Audio extraído exitosamente');
            resolve();
          })
          .on('error', (err) => {
            console.error('Error extrayendo audio:', err);
            reject(err);
          })
          .run();
      });

      // Verificar el archivo de audio extraído
      console.log('Verificando archivo de audio extraído...');
      const audioBuffer = await readFile(audioPath);
      const audioSizeMB = audioBuffer.length / (1024 * 1024);
      
      console.log(`Tamaño del audio extraído: ${audioSizeMB.toFixed(2)} MB`);
      
      // Detectar tier basado en si la clave parece ser de desarrollo o producción
      const apiKey = process.env.GROQ_API_KEY || '';
      const isDevTier = apiKey.includes('dev') || process.env.GROQ_TIER === 'dev';
      const GROQ_MAX_SIZE_MB = isDevTier ? 100 : 25; // Tier gratuito: 25MB, Tier desarrollador: 100MB
      
      console.log(`Límite de Groq API: ${GROQ_MAX_SIZE_MB}MB`);

      // Crear un identificador único para este audio procesado
      const audioId = `audio_${timestamp}`;

      // Limpiar el video temporal (ya no lo necesitamos)
      await unlink(videoPath).catch(err => console.error('Error eliminando video temporal:', err));

      const response = {
        audioId,
        fileName: `${file.name.replace('.mp4', '')}.${audioConfig.extension}`,
        audioSize: parseFloat(audioSizeMB.toFixed(2)),
        maxSize: GROQ_MAX_SIZE_MB,
        duration: parseFloat(durationMinutes.toFixed(2)),
        codec: audioConfig.codec,
        format: audioConfig.format,
        canTranscribe: audioSizeMB <= GROQ_MAX_SIZE_MB,
        audioPath: audioPath, // Solo para el servidor, no se envía al cliente
        originalVideoSize: parseFloat(fileSizeMB.toFixed(2))
      };

      if (audioSizeMB <= GROQ_MAX_SIZE_MB) {
        console.log('✅ Audio listo para transcripción');
        return NextResponse.json({
          ...response,
          message: 'Audio extraído exitosamente. Listo para transcribir.'
        });
      } else {
        // No eliminar el audio inmediatamente - lo mantenemos para división automática
        console.log('⚠️ Audio demasiado grande para transcripción simple');
        
        // Calcular cuántos segmentos necesitaríamos
        const estimatedSegments = Math.ceil(audioSizeMB / (GROQ_MAX_SIZE_MB * 0.9));
        const segmentDurationMinutes = Math.round(durationMinutes / estimatedSegments * 100) / 100;
        
        return NextResponse.json({
          ...response,
          message: 'Audio extraído, pero requiere división para transcripción.',
          canSplit: true,
          estimatedSegments,
          segmentDuration: segmentDurationMinutes,
          suggestions: [
            `Se dividirá automáticamente en ${estimatedSegments} segmentos de ~${segmentDurationMinutes}min cada uno`,
            'La transcripción incluirá marcadores de tiempo si hay más de 3 segmentos',
            'El proceso tomará más tiempo pero será completamente automático',
            'Alternativamente, puedes comprimir el video manualmente para reducir el tamaño'
          ]
        });
      }

    } catch (processingError) {
      console.error('Error procesando archivo:', processingError);
      
      // Limpiar archivos temporales en caso de error
      await Promise.all([
        unlink(videoPath).catch(() => {}),
        unlink(audioPath).catch(() => {})
      ]);

      throw processingError;
    }

  } catch (error) {
    console.error('Error en la API de conversión:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error procesando el archivo: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Configuración de ruta para archivos grandes
export const maxDuration = 60; 