// Versión simplificada temporal - solo .txt hasta instalar dependencias

export async function extractTextContent(
  buffer: Buffer, 
  fileName: string
): Promise<string> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  try {
    switch (extension) {
      case 'txt':
        return buffer.toString('utf-8');
        
      case 'docx':
        throw new Error('Los archivos DOCX requieren la dependencia mammoth. Ejecuta: npm install mammoth');
        
      case 'pdf':
        throw new Error('Los archivos PDF requieren la dependencia pdf-parse. Ejecuta: npm install pdf-parse');
        
      default:
        throw new Error(`Tipo de archivo no soportado: ${extension}. Solo .txt está disponible temporalmente.`);
    }
  } catch (error) {
    console.error(`Error extracting content from ${fileName}:`, error);
    throw new Error(`Error procesando archivo ${fileName}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

export const ALLOWED_MIME_TYPES = [
  'text/plain',
  // Comentados hasta instalar dependencias
  // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // 'application/pdf'
];

export const ALLOWED_EXTENSIONS = ['txt']; // Solo txt por ahora

export function validateFileType(file: File): { isValid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Solo se aceptan: ${ALLOWED_EXTENSIONS.join(', ')} (temporalmente hasta instalar dependencias)`
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