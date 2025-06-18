import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Iniciando eliminación de conocimiento:', params.id);

    const supabase = createServerSupabaseClient();
    
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Error de autenticación:', authError);
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener información del conocimiento antes de eliminarlo
    const { data: knowledge, error: fetchError } = await supabase
      .from('knowledge')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      console.error('Error obteniendo conocimiento:', fetchError);
      return NextResponse.json({ error: 'Conocimiento no encontrado' }, { status: 404 });
    }

    console.log('Conocimiento encontrado:', knowledge);

    // Eliminar asignaciones de áreas primero (por la foreign key)
    const { error: areasError } = await supabase
      .from('knowledge_areas')
      .delete()
      .eq('knowledge_id', params.id);

    if (areasError) {
      console.error('Error eliminando asignaciones de áreas:', areasError);
      return NextResponse.json({ error: 'Error eliminando asignaciones de áreas' }, { status: 500 });
    }

    console.log('Asignaciones de áreas eliminadas');

    // Eliminar el conocimiento de la base de datos
    const { error: deleteError } = await supabase
      .from('knowledge')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error eliminando conocimiento:', deleteError);
      return NextResponse.json({ error: 'Error eliminando conocimiento' }, { status: 500 });
    }

    console.log('Conocimiento eliminado de la base de datos');

    // Si es un archivo subido, intentar eliminarlo del sistema de archivos
    if (knowledge.source_type === 'upload' && knowledge.file_name) {
      try {
        // Construir la ruta del archivo temporal
        // Nota: En producción, esto debería usar un storage como S3, pero para desarrollo local usamos archivos temporales
        const tempDir = path.join(process.cwd(), 'temp');
        const possiblePaths = [
          path.join(tempDir, knowledge.file_name),
          path.join(tempDir, `${knowledge.id}_${knowledge.file_name}`),
          path.join(tempDir, `knowledge_${knowledge.id}.txt`),
          path.join(tempDir, `knowledge_${knowledge.id}.docx`)
        ];

        let fileDeleted = false;
        for (const filePath of possiblePaths) {
          if (existsSync(filePath)) {
            await unlink(filePath);
            console.log('Archivo eliminado:', filePath);
            fileDeleted = true;
            break;
          }
        }

        if (!fileDeleted) {
          console.log('No se encontró archivo físico para eliminar (puede ser normal si ya expiró)');
        }
      } catch (fileError) {
        console.error('Error eliminando archivo físico:', fileError);
        // No fallar la operación completa por esto, ya que el archivo puede no existir
      }
    }

    return NextResponse.json({ 
      message: 'Conocimiento eliminado exitosamente',
      id: params.id 
    });

  } catch (error) {
    console.error('Error en eliminación de conocimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 