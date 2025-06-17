import ffmpeg from 'fluent-ffmpeg';
import { platform } from 'os';

// Configuración de FFmpeg dependiendo del sistema operativo
export function configureFfmpeg() {
  const currentPlatform = platform();
  
  try {
    // En Windows, intentar detectar ffmpeg automáticamente
    if (currentPlatform === 'win32') {
      // FFmpeg debería estar en el PATH del sistema
      // Si no está, el usuario necesita instalarlo manualmente
      console.log('Sistema Windows detectado. Asegúrate de que FFmpeg esté en el PATH del sistema.');
    }
    
    // Para desarrollo local, puedes especificar rutas personalizadas aquí
    // ffmpeg.setFfmpegPath('/ruta/a/ffmpeg');
    // ffmpeg.setFfprobePath('/ruta/a/ffprobe');
    
    return true;
  } catch (error) {
    console.error('Error configurando FFmpeg:', error);
    return false;
  }
}

// Función para verificar que FFmpeg está disponible
export async function checkFfmpegInstallation(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      ffmpeg.getAvailableFormats((err, formats) => {
        if (err) {
          console.error('FFmpeg no está disponible:', err.message);
          resolve(false);
        } else {
          console.log('FFmpeg está correctamente instalado y disponible');
          // Verificar que los formatos de audio necesarios están disponibles
          const hasWav = formats && Object.keys(formats).includes('wav');
          if (!hasWav) {
            console.warn('Formato WAV no disponible, pero FFmpeg está instalado');
          }
          resolve(true);
        }
      });
    } catch (error) {
      console.error('Error verificando FFmpeg:', error);
      resolve(false);
    }
  });
}

// Función para obtener el mejor codec de audio disponible
export async function getBestAudioCodec(): Promise<{codec: string, format: string, extension: string}> {
  return new Promise((resolve) => {
    try {
      ffmpeg.getAvailableCodecs((err, codecs) => {
        if (err || !codecs) {
          // Fallback a WAV PCM que debería estar siempre disponible
          resolve({ codec: 'pcm_s16le', format: 'wav', extension: 'wav' });
          return;
        }

        // Prioridad de codecs: MP3 > AAC > WAV
        if (codecs['libmp3lame'] && codecs['libmp3lame'].canEncode) {
          resolve({ codec: 'libmp3lame', format: 'mp3', extension: 'mp3' });
        } else if (codecs['aac'] && codecs['aac'].canEncode) {
          resolve({ codec: 'aac', format: 'adts', extension: 'm4a' });
        } else {
          // Fallback a WAV PCM
          resolve({ codec: 'pcm_s16le', format: 'wav', extension: 'wav' });
        }
      });
    } catch (error) {
      console.error('Error obteniendo codecs:', error);
      resolve({ codec: 'pcm_s16le', format: 'wav', extension: 'wav' });
    }
  });
}

// Configurar FFmpeg al importar el módulo
configureFfmpeg(); 