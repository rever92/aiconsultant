import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper function to save knowledge file
async function saveKnowledgeFile(file: File, projectId: string) {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'knowledge');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const fileId = uuidv4();
    const extension = file.name.split('.').pop();
    const fileName = `${projectId}_${fileId}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    await fs.writeFile(filePath, buffer);
    
    return {
      filePath: `uploads/knowledge/${fileName}`,
      fileName: file.name
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Error guardando archivo');
  }
}

// Helper function to extract text content
async function extractTextContent(file: File): Promise<string> {
  try {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (extension === 'txt') {
      return buffer.toString('utf-8');
    } else if (extension === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    throw new Error('Solo se soportan archivos .txt y .docx');
  } catch (error) {
    console.error('Error extracting content:', error);
    if (error instanceof Error) {
      throw new Error(`Error extrayendo contenido: ${error.message}`);
    }
    throw new Error('Error extrayendo contenido del archivo');
  }
}

// GET /api/knowledge - Get knowledge for a project
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId es requerido' },
        { status: 400 }
      );
    }

    console.log('Fetching knowledge for project:', projectId);

    // Obtener conocimiento del proyecto con áreas asignadas
    const { data: knowledge, error } = await supabase
      .from('knowledge')
      .select(`
        *,
        knowledge_areas(
          area_id,
          areas(id, name, color)
        )
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Knowledge fetched successfully:', knowledge?.length || 0);
    return NextResponse.json(knowledge || []);
  } catch (error) {
    console.error('Error getting knowledge:', error);
    return NextResponse.json(
      { error: 'Error obteniendo conocimiento' },
      { status: 500 }
    );
  }
}

// POST /api/knowledge - Create new knowledge (file upload or manual)
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/knowledge - Iniciando procesamiento...');
    
    const contentType = request.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      // Conocimiento manual (texto pegado)
      const body = await request.json();
      const { title, content, projectId, notes, areaId } = body;

      if (!title || !content || !projectId) {
        return NextResponse.json(
          { error: 'Title, content y projectId son requeridos' },
          { status: 400 }
        );
      }

      console.log('Creating manual knowledge:', title, 'for project:', projectId);

      // Guardar conocimiento manual en base de datos
      const { data: knowledge, error: dbError } = await supabase
        .from('knowledge')
        .insert({
          title,
          content: content.trim(),
          source_type: 'manual',
          notes: notes || null,
          project_id: projectId,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating manual knowledge:', dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      // Si se especifica un área, asignarla automáticamente
      if (areaId) {
        const { error: areaError } = await supabase
          .from('knowledge_areas')
          .insert({
            knowledge_id: knowledge.id,
            area_id: areaId
          });

        if (areaError) {
          console.warn('Error assigning area to knowledge:', areaError);
        }
      }

      console.log('Manual knowledge created successfully:', knowledge.id);
      return NextResponse.json({
        ...knowledge,
        knowledge_areas: areaId ? [{ area_id: areaId }] : []
      });

    } else {
      // Conocimiento por archivo (FormData)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const projectId = formData.get('projectId') as string;
      const title = formData.get('title') as string;

      if (!file || !projectId) {
        return NextResponse.json(
          { error: 'Archivo y projectId son requeridos' },
          { status: 400 }
        );
      }

      console.log('Creating file knowledge:', title || file.name, 'for project:', projectId);

      // Validate file type - supporting .txt and .docx
      const allowedTypes = [
        'text/plain', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['txt', 'docx'];
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension || '')) {
        console.error('Tipo de archivo no válido:', {
          fileName: file.name,
          mimeType: file.type,
          extension: fileExtension
        });
        return NextResponse.json(
          { error: `Solo se permiten archivos .txt y .docx. Recibido: ${file.type} (${fileExtension})` },
          { status: 400 }
        );
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande (máximo 10MB)' },
          { status: 400 }
        );
      }

      // Save file and extract content
      const { filePath, fileName } = await saveKnowledgeFile(file, projectId);
      const content = await extractTextContent(file);

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'El archivo está vacío o no contiene texto extraíble' },
          { status: 400 }
        );
      }

      // Guardar en base de datos
      const { data: knowledge, error: dbError } = await supabase
        .from('knowledge')
        .insert({
          title: title || file.name,
          file_name: fileName,
          file_size: file.size,
          content,
          source_type: 'upload',
          project_id: projectId,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating file knowledge:', dbError);
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }

      console.log('File knowledge created successfully:', knowledge.id);
      return NextResponse.json({
        ...knowledge,
        knowledge_areas: []
      });
    }
  } catch (error) {
    console.error('Error creating knowledge:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error creando conocimiento' },
      { status: 500 }
    );
  }
} 