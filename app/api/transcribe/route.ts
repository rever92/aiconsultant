import { NextRequest, NextResponse } from 'next/server';
import { unlink, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import Groq from 'groq-sdk';

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

      return transcription.text;
    } catch (error) {
      console.error(`Error en intento ${attempt}:`, error);
      
      if (attempt === maxRetries) {
        // Si es el último intento, lanzar el error
        throw error;
      }
      
      // Esperar antes del siguiente intento (backoff exponencial)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Reintentando en ${delay/1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Máximo número de reintentos alcanzado');
}

export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando transcripción de audio previamente convertido...');
    
    const data = await request.formData();
    const audioId = data.get('audioId') as string;
    const audioPath = data.get('audioPath') as string;
    const fileName = data.get('fileName') as string;

    if (!audioId || !audioPath || !fileName) {
      console.error('Faltan datos requeridos para la transcripción');
      return NextResponse.json({ 
        error: 'Faltan datos requeridos. Debe convertir el video a audio primero.' 
      }, { status: 400 });
    }

    console.log(`Transcribiendo audio: ${fileName} (ID: ${audioId})`);

    // Verificar que el archivo de audio existe
    if (!existsSync(audioPath)) {
      console.error('Archivo de audio no encontrado:', audioPath);
      return NextResponse.json({ 
        error: 'El archivo de audio ha expirado o no existe. Vuelve a convertir el video.' 
      }, { status: 404 });
    }

    try {
      // Leer el archivo de audio
      console.log('Leyendo archivo de audio para transcripción...');
      const audioBuffer = await readFile(audioPath);
      
      console.log(`Tamaño del audio: ${(audioBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
      
      // Determinar el tipo MIME basado en la extensión del archivo
      const extension = fileName.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'mp3' ? 'audio/mp3' : 
                      extension === 'm4a' ? 'audio/m4a' : 'audio/wav';

      // Crear un objeto File para Groq
      console.log('Enviando audio a Groq para transcripción...');
      const audioFile = new File([audioBuffer], fileName, {
        type: mimeType
      });

      // Transcribir con Groq con reintentos
      const transcription = await transcribeWithRetry(groq, audioFile);

      console.log('Transcripción completada exitosamente');

      // Limpiar archivo temporal de audio después de la transcripción exitosa
      await unlink(audioPath).catch(err => 
        console.error('Error eliminando audio temporal:', err)
      );

      return NextResponse.json({
        transcription: transcription,
        message: 'Transcripción completada exitosamente',
        audioId: audioId
      });

    } catch (processingError) {
      console.error('Error procesando transcripción:', processingError);
      
      // En caso de error, mantener el archivo por si el usuario quiere reintentar
      // Solo eliminarlo si es un error definitivo
      if (processingError instanceof Error && processingError.message.includes('file format')) {
        await unlink(audioPath).catch(() => {});
      }

      throw processingError;
    }

  } catch (error) {
    console.error('Error en la API de transcripción:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en la transcripción: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Configuración de ruta para archivos grandes
export const maxDuration = 60; 