import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOADS_BASE_DIR = path.join(process.cwd(), 'uploads');
const TRANSCRIPTIONS_DIR = path.join(UPLOADS_BASE_DIR, 'transcriptions');

export async function ensureDirectoriesExist() {
  try {
    await fs.access(UPLOADS_BASE_DIR);
  } catch {
    await fs.mkdir(UPLOADS_BASE_DIR, { recursive: true });
  }

  try {
    await fs.access(TRANSCRIPTIONS_DIR);
  } catch {
    await fs.mkdir(TRANSCRIPTIONS_DIR, { recursive: true });
  }
}

export async function saveTranscriptionFile(
  file: File, 
  projectId: string
): Promise<{ filePath: string; fileName: string; fileId: string }> {
  await ensureDirectoriesExist();
  
  const fileId = uuidv4();
  const extension = file.name.split('.').pop();
  const sanitizedOriginalName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_');
  
  const fileName = `${fileId}_${sanitizedOriginalName}`;
  const filePath = path.join(TRANSCRIPTIONS_DIR, `${projectId}_${fileName}`);
  
  // Leer el archivo y convertir a buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Guardar archivo
  await fs.writeFile(filePath, buffer);
  
  // Retornar paths relativos para la base de datos
  return {
    filePath: `uploads/transcriptions/${projectId}_${fileName}`,
    fileName: sanitizedOriginalName,
    fileId
  };
}

export async function readTranscriptionFile(filePath: string): Promise<Buffer> {
  const fullPath = path.join(process.cwd(), filePath);
  return await fs.readFile(fullPath);
}

export async function deleteTranscriptionFile(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), filePath);
  try {
    await fs.unlink(fullPath);
    console.log(`File deleted: ${filePath}`);
  } catch (error) {
    console.warn(`Could not delete file: ${filePath}`, error);
  }
}

export function getFileStats(file: File) {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    sizeMB: Number((file.size / (1024 * 1024)).toFixed(2)),
    extension: file.name.split('.').pop()?.toLowerCase()
  };
}

export async function listTranscriptionFiles(projectId?: string): Promise<string[]> {
  try {
    await ensureDirectoriesExist();
    const files = await fs.readdir(TRANSCRIPTIONS_DIR);
    
    if (projectId) {
      return files.filter(file => file.startsWith(`${projectId}_`));
    }
    
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}

export async function getFileSystemStats(filePath: string): Promise<{
  size: number;
  created: Date;
  modified: Date;
} | null> {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const stats = await fs.stat(fullPath);
    
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    console.warn(`Could not get file stats: ${filePath}`, error);
    return null;
  }
} 