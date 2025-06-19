import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import path from 'path';
import fs from 'fs/promises';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const knowledgeId = params.id;
    console.log('Iniciando eliminación de conocimiento:', knowledgeId);

    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      console.error('Error de autenticación:', authResult.error);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const supabase = createServerSupabaseClient();

    // Obtener el conocimiento para verificar permisos del proyecto
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge')
      .select(`
        *,
        projects!inner (
          id,
          user_id,
          name
        )
      `)
      .eq('id', knowledgeId)
      .single();

    if (knowledgeError || !knowledge) {
      console.error('Conocimiento no encontrado:', knowledgeError);
      return NextResponse.json({ error: 'Conocimiento no encontrado' }, { status: 404 });
    }

    const project = knowledge.projects;

    // Verificar permisos: 
    // 1. Es admin
    // 2. Es dueño del proyecto
    // 3. Tiene permisos de edición en el proyecto
    const isAdmin = user.profile?.role === 'admin';
    const isOwner = project.user_id === user.id;

    let hasEditPermission = false;
    if (!isAdmin && !isOwner) {
      const { data: permissions } = await supabase
        .from('project_permissions')
        .select('permission_type')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .in('permission_type', ['edit', 'admin'])
        .maybeSingle();

      hasEditPermission = !!permissions;
    }

    if (!isAdmin && !isOwner && !hasEditPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este conocimiento' },
        { status: 403 }
      );
    }

    // Eliminar asignaciones de áreas primero
    const { error: areasError } = await supabase
      .from('knowledge_areas')
      .delete()
      .eq('knowledge_id', knowledgeId);

    if (areasError) {
      console.error('Error eliminando asignaciones de áreas:', areasError);
      return NextResponse.json({ error: 'Error eliminando asignaciones' }, { status: 500 });
    }

    // Si tiene archivo, eliminarlo del sistema de archivos
    if (knowledge.file_name) {
      try {
        const filePath = path.join(process.cwd(), 'uploads', 'knowledge', project.id, knowledge.file_name);
        await fs.unlink(filePath);
        console.log('Archivo eliminado:', filePath);
      } catch (fileError) {
        console.warn('Advertencia: No se pudo eliminar el archivo:', fileError);
        // No fallar la operación si el archivo no se puede eliminar
      }
    }

    // Eliminar el registro de conocimiento
    const { error: deleteError } = await supabase
      .from('knowledge')
      .delete()
      .eq('id', knowledgeId);

    if (deleteError) {
      console.error('Error eliminando conocimiento:', deleteError);
      return NextResponse.json({ error: 'Error eliminando conocimiento' }, { status: 500 });
    }

    console.log('Conocimiento eliminado exitosamente:', knowledgeId);
    return NextResponse.json({ 
      message: 'Conocimiento eliminado exitosamente',
      id: knowledgeId
    });

  } catch (error) {
    console.error('Error en DELETE /api/knowledge/[id]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 