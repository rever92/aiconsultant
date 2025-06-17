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
      console.log('Archivo subido exitosamente:', uploadUrl);

      // Configurar parámetros de transcripción
      const params = {
        audio: uploadUrl,
        speech_model: 'universal' as const, // Modelo universal como solicitado
        language_code: 'es' as const, // Español
      };

      console.log('Iniciando transcripción con AssemblyAI...');
      const transcript = await client.transcripts.transcribe(params);

      if (transcript.status === 'error') {
        throw new Error(`Error de AssemblyAI: ${transcript.error}`);
      }

      if (!transcript.text) {
        throw new Error('No se pudo obtener el texto de la transcripción');
      }

      console.log('🎙️ Transcripción AssemblyAI completada exitosamente');
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
    console.log('Iniciando transcripción con AssemblyAI...');
    
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

    console.log(`Transcribiendo con AssemblyAI: ${fileName} (ID: ${audioId})`);

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

      // Transcribir con AssemblyAI
      const transcription = await transcribeWithAssemblyAI(audioBuffer, fileName);

      console.log('Transcripción AssemblyAI completada exitosamente');

      // Limpiar archivo temporal de audio después de la transcripción exitosa
      await unlink(audioPath).catch(err => 
        console.error('Error eliminando audio temporal:', err)
      );

      return NextResponse.json({
        transcription: transcription,
        message: 'Transcripción con AssemblyAI completada exitosamente',
        audioId: audioId,
        provider: 'assemblyai'
      });

    } catch (processingError) {
      console.error('Error procesando transcripción con AssemblyAI:', processingError);
      
      // En caso de error, mantener el archivo por si el usuario quiere reintentar
      // Solo eliminarlo si es un error definitivo
      if (processingError instanceof Error && processingError.message.includes('file format')) {
        await unlink(audioPath).catch(() => {});
      }

      throw processingError;
    }

  } catch (error) {
    console.error('Error en la API de transcripción AssemblyAI:', error);
    
    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: `Error en la transcripción con AssemblyAI: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Configuración de ruta para archivos grandes
export const maxDuration = 120; // 2 minutos 