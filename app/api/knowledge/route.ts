import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { requireAuth, createServerSupabaseClient } from '@/lib/supabase/server';
import { validateFileType, validateFileSize } from '@/lib/file-utils/extractors';

// Helper function to save knowledge file
async function saveKnowledgeFile(file: File, projectId: string) {
  try {
    await fs.mkdir('uploads/knowledge', { recursive: true });
    await fs.mkdir(`uploads/knowledge/${projectId}`, { recursive: true });

    const fileExtension = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(process.cwd(), 'uploads', 'knowledge', projectId, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    return {
      filePath,
      fileName,
      fileId: fileName.replace(fileExtension, '')
    };
  } catch (error) {
    console.error('Error saving file:', error);
    throw new Error('Error guardando archivo');
  }
}

// Helper function to extract text content
async function extractTextContent(buffer: Buffer, fileName: string): Promise<string> {
  try {
    const fileExtension = path.extname(fileName).toLowerCase();

    if (fileExtension === '.txt') {
      return buffer.toString('utf-8');
    } else if (fileExtension === '.docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else {
      throw new Error(`Tipo de archivo no soportado: ${fileExtension}`);
    }
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Error extrayendo contenido del archivo');
  }
}

// GET /api/knowledge - Get knowledge for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId es requerido' }, { status: 400 });
    }

    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const supabase = createServerSupabaseClient();

    // Verificar permisos del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Verificar permisos: admin, dueño o con permisos
    const isAdmin = user.profile?.role === 'admin';
    const isOwner = project.user_id === user.id;

    let hasPermission = false;
    if (!isAdmin && !isOwner) {
      const { data: permissions } = await supabase
        .from('project_permissions')
        .select('permission_type')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      hasPermission = !!permissions;
    }

    if (!isAdmin && !isOwner && !hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este proyecto' },
        { status: 403 }
      );
    }

    // Obtener conocimiento del proyecto con áreas asignadas
    const { data: knowledge, error } = await supabase
      .from('knowledge')
      .select(`
        *,
        knowledge_areas (
          area_id,
          areas (
            id,
            name,
            color
          )
        )
      `)
      .eq('project_id', projectId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching knowledge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(knowledge || []);
  } catch (error) {
    console.error('Error en GET /api/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST /api/knowledge - Create new knowledge (file upload or manual)
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando POST a /api/knowledge');

    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const supabase = createServerSupabaseClient();

    // Determinar si es FormData (archivo) o JSON (manual)
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    if (isFormData) {
      // Manejo de subida de archivo
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const projectId = formData.get('projectId') as string;
      const title = formData.get('title') as string;

      if (!file || !projectId) {
        return NextResponse.json({ error: 'File y projectId son requeridos' }, { status: 400 });
      }

      // Verificar permisos del proyecto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id, name')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
      }

      // Verificar permisos de edición
      const isAdmin = user.profile?.role === 'admin';
      const isOwner = project.user_id === user.id;

      let hasEditPermission = false;
      if (!isAdmin && !isOwner) {
        const { data: permissions } = await supabase
          .from('project_permissions')
          .select('permission_type')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .in('permission_type', ['edit', 'admin'])
          .maybeSingle();

        hasEditPermission = !!permissions;
      }

      if (!isAdmin && !isOwner && !hasEditPermission) {
        return NextResponse.json(
          { error: 'No tienes permisos para añadir conocimiento a este proyecto' },
          { status: 403 }
        );
      }

      // Validar archivo
      const validationResult = validateFileType(file);
      if (!validationResult.isValid) {
        return NextResponse.json({ error: validationResult.error }, { status: 400 });
      }

      const sizeValidation = validateFileSize(file, 10);
      if (!sizeValidation.isValid) {
        return NextResponse.json({ error: sizeValidation.error }, { status: 400 });
      }

      // Guardar archivo y extraer contenido
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await extractTextContent(buffer, file.name);

      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'No se pudo extraer contenido del archivo' },
          { status: 400 }
        );
      }

      // Guardar archivo físico
      const savedFile = await saveKnowledgeFile(file, projectId);

      // Crear registro en la base de datos
      const { data: knowledge, error: insertError } = await supabase
        .from('knowledge')
        .insert({
          project_id: projectId,
          title: title || file.name,
          file_name: savedFile.fileName,
          file_size: file.size,
          content: content.trim(),
          source_type: 'upload'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error insertando conocimiento:', insertError);
        return NextResponse.json({ error: 'Error guardando conocimiento' }, { status: 500 });
      }

      console.log('Conocimiento creado exitosamente:', knowledge.id);
      return NextResponse.json(knowledge);

    } else {
      // Manejo de conocimiento manual
      const body = await request.json();
      const { title, content, notes, projectId, areaId } = body;

      if (!title || !content || !projectId) {
        return NextResponse.json(
          { error: 'Title, content y projectId son requeridos' },
          { status: 400 }
        );
      }

      // Verificar permisos del proyecto (mismo código que arriba)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, user_id, name')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
      }

      const isAdmin = user.profile?.role === 'admin';
      const isOwner = project.user_id === user.id;

      let hasEditPermission = false;
      if (!isAdmin && !isOwner) {
        const { data: permissions } = await supabase
          .from('project_permissions')
          .select('permission_type')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .in('permission_type', ['edit', 'admin'])
          .maybeSingle();

        hasEditPermission = !!permissions;
      }

      if (!isAdmin && !isOwner && !hasEditPermission) {
        return NextResponse.json(
          { error: 'No tienes permisos para añadir conocimiento a este proyecto' },
          { status: 403 }
        );
      }

      // Crear conocimiento manual
      const { data: knowledge, error: insertError } = await supabase
        .from('knowledge')
        .insert({
          project_id: projectId,
          title: title.trim(),
          content: content.trim(),
          notes: notes?.trim() || null,
          source_type: 'manual'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error insertando conocimiento manual:', insertError);
        return NextResponse.json({ error: 'Error guardando conocimiento' }, { status: 500 });
      }

      // Si se especificó un área, asignarla
      if (areaId) {
        const { error: areaError } = await supabase
          .from('knowledge_areas')
          .insert({
            knowledge_id: knowledge.id,
            area_id: areaId
          });

        if (areaError) {
          console.warn('Advertencia: No se pudo asignar área automáticamente:', areaError);
        }
      }

      console.log('Conocimiento manual creado exitosamente:', knowledge.id);
      return NextResponse.json(knowledge);
    }

  } catch (error) {
    console.error('Error en POST /api/knowledge:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 