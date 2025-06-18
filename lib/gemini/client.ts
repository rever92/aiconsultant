import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function generateContent(prompt: string): Promise<string> {
  try {
    console.log('🧠 Enviando prompt a Gemini...');
    console.log('📝 Longitud del prompt:', prompt.length);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Respuesta de Gemini recibida');
    console.log('📄 Longitud de respuesta:', text.length);
    
    return text;
  } catch (error) {
    console.error('❌ Error llamando a Gemini:', error);
    throw new Error(`Error en Gemini: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export async function generateContentWithRetry(
  prompt: string, 
  maxRetries = 3, 
  delayMs = 1000
): Promise<string> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} con Gemini`);
      return await generateContent(prompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Error desconocido');
      console.warn(`⚠️ Intento ${attempt} falló:`, lastError.message);
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Backoff exponencial
        console.log(`⏳ Esperando ${delay}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Máximo número de reintentos alcanzado');
} 