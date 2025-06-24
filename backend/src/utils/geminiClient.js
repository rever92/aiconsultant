const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateContent(prompt) {
  try {
    console.log('🧠 Iniciando generación de contenido con Gemini...');
    
    // Usar el modelo Gemini 2.5 Pro (el más avanzado)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Generar contenido
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Contenido generado exitosamente');
    return text;
    
  } catch (error) {
    console.error('❌ Error generando contenido con Gemini:', error);
    throw new Error(`Error de Gemini: ${error.message}`);
  }
}

async function generateContentWithRetry(prompt, maxRetries = 3, delayMs = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${maxRetries} de generación con Gemini`);
      return await generateContent(prompt);
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} falló:`, error.message);
      
      if (attempt < maxRetries) {
        console.log(`⏳ Esperando ${delayMs}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Backoff exponencial
      }
    }
  }
  
  throw lastError;
}

module.exports = {
  generateContent,
  generateContentWithRetry
}; 