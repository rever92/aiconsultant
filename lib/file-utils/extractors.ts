// Nota: Para desarrollo inicial, solo manejamos .txt
// Agregar mammoth y pdf-parse después de instalar dependencias

import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export async function extractTextContent(
  buffer: Buffer, 
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  console.log(`📄 Extrayendo contenido de archivo: ${fileName} (${extension})`);
  
  try {
    switch (extension) {
      case 'txt':
        const content = buffer.toString('utf-8');
        console.log(`✅ Contenido extraído: ${content.length} caracteres`);
        return content;
        
      case 'docx':
        const docxResult = await mammoth.extractRawText({ buffer });
        return docxResult.value;
        
      case 'pdf':
        const pdfResult = await pdfParse(buffer);
        return pdfResult.text;
        
      default:
        throw new Error(`Tipo de archivo no soportado: ${extension}`);
    }
  } catch (error) {
    console.error(`❌ Error extrayendo contenido de ${fileName}:`, error);
    throw new Error(`Error procesando archivo ${fileName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// Función de validación de archivos
export const ALLOWED_MIME_TYPES = [
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/pdf'
];

export const ALLOWED_EXTENSIONS = ['txt', 'docx', 'pdf'];

export function validateFileType(file: File): { isValid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
  
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: 'Tipo MIME no válido para el archivo.'
    };
  }
  
  return { isValid: true };
}

export function validateFileSize(file: File, maxSizeMB: number = 10): { isValid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `El archivo es demasiado grande. Máximo ${maxSizeMB}MB permitido.`
    };
  }
  
  return { isValid: true };
}

export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Función helper para detectar la codificación del archivo
export function detectEncoding(buffer: Buffer): string {
  // Detectar BOM UTF-8
  if (buffer.length >= 3 && 
      buffer[0] === 0xEF && 
      buffer[1] === 0xBB && 
      buffer[2] === 0xBF) {
    return 'utf-8-bom';
  }
  
  // Detectar BOM UTF-16
  if (buffer.length >= 2) {
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      return 'utf-16le';
    }
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) {
      return 'utf-16be';
    }
  }
  
  // Por defecto asumir UTF-8
  return 'utf-8';
}

// Función para limpiar contenido extraído
export function cleanExtractedContent(content: string): string {
  return content
    // Remover caracteres de control excepto saltos de línea y tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalizar saltos de línea
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remover líneas vacías múltiples
    .replace(/\n{3,}/g, '\n\n')
    // Trimear espacios al inicio y final
    .trim();
} 