import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId es requerido' }, { status: 400 });
    }

    console.log('Iniciando eliminación masiva de conocimiento para proyecto:', projectId);

    const supabase = createServerSupabaseClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todo el conocimiento del proyecto antes de eliminarlo
    const { data: knowledgeList, error: fetchError } = await supabase
      .from('knowledge')
      .select('*')
      .eq('project_id', projectId);

    if (fetchError) {
      console.error('Error obteniendo conocimiento:', fetchError);
      return NextResponse.json({ error: 'Error obteniendo conocimiento del proyecto' }, { status: 500 });
    }

    if (!knowledgeList || knowledgeList.length === 0) {
      return NextResponse.json({ 
        message: 'No hay conocimiento para eliminar en este proyecto',
        deletedCount: 0 
      });
    }

    console.log(`Encontrados ${knowledgeList.length} elementos de conocimiento para eliminar`);

    // Eliminar todas las asignaciones de áreas primero
    const knowledgeIds = knowledgeList.map(k => k.id);
    const { error: areasError } = await supabase
      .from('knowledge_areas')
      .delete()
      .in('knowledge_id', knowledgeIds);

    if (areasError) {
      console.error('Error eliminando asignaciones de áreas:', areasError);
      return NextResponse.json({ error: 'Error eliminando asignaciones de áreas' }, { status: 500 });
    }

    console.log('Asignaciones de áreas eliminadas');

    // Eliminar todo el conocimiento del proyecto
    const { error: deleteError } = await supabase
      .from('knowledge')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error eliminando conocimiento:', deleteError);
      return NextResponse.json({ error: 'Error eliminando conocimiento' }, { status: 500 });
    }

    console.log('Conocimiento eliminado de la base de datos');

    // Intentar eliminar archivos físicos
    let filesDeleted = 0;
    const tempDir = path.join(process.cwd(), 'temp');

    for (const knowledge of knowledgeList) {
      if (knowledge.source_type === 'upload' && knowledge.file_name) {
        try {
          const possiblePaths = [
            path.join(tempDir, knowledge.file_name),
            path.join(tempDir, `${knowledge.id}_${knowledge.file_name}`),
            path.join(tempDir, `knowledge_${knowledge.id}.txt`),
            path.join(tempDir, `knowledge_${knowledge.id}.docx`)
          ];

          for (const filePath of possiblePaths) {
            if (existsSync(filePath)) {
              await unlink(filePath);
              console.log('Archivo eliminado:', filePath);
              filesDeleted++;
              break;
            }
          }
        } catch (fileError) {
          console.error(`Error eliminando archivo de ${knowledge.title}:`, fileError);
          // Continuar con el siguiente archivo
        }
      }
    }

    return NextResponse.json({ 
      message: `Eliminados ${knowledgeList.length} elementos de conocimiento exitosamente`,
      deletedCount: knowledgeList.length,
      filesDeleted: filesDeleted
    });

  } catch (error) {
    console.error('Error en eliminación masiva de conocimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 