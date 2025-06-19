import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const areaId = params.id;
    
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 });
    }

    console.log('Obteniendo conocimiento consolidado para área:', areaId);

    // Obtener conocimiento consolidado con información del área
    const { data: consolidatedData, error } = await supabase
      .from('consolidated_knowledge')
      .select(`
        *,
        areas (
          id,
          name,
          description,
          color,
          projects (
            id,
            name,
            description
          )
        )
      `)
      .eq('area_id', areaId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró conocimiento consolidado
        return NextResponse.json({ 
          consolidated_knowledge: null,
          message: 'No hay conocimiento consolidado para esta área'
        });
      }
      console.error('Error obteniendo conocimiento consolidado:', error);
      return NextResponse.json({ error: 'Error obteniendo conocimiento consolidado' }, { status: 500 });
    }

    // Obtener estadísticas del conocimiento original
    const { data: knowledgeStats, error: statsError } = await supabase
      .from('knowledge_areas')
      .select(`
        knowledge (
          id,
          title,
          source_type,
          uploaded_at
        )
      `)
      .eq('area_id', areaId);

    if (statsError) {
      console.warn('Error obteniendo estadísticas de conocimiento:', statsError);
    }

    const originalSources = knowledgeStats?.map(k => k.knowledge).filter(Boolean) || [];

    const response = {
      consolidated_knowledge: consolidatedData,
      area: consolidatedData.areas,
      original_sources: originalSources,
      stats: {
        original_sources_count: originalSources.length,
        last_updated: consolidatedData.updated_at,
        is_validated: consolidatedData.validated,
        content_length: consolidatedData.content.length
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en obtención de conocimiento consolidado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const areaId = params.id;
    const body = await request.json();
    
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 });
    }

    console.log('Actualizando conocimiento consolidado para área:', areaId);

    // Verificar que existe conocimiento consolidado para esta área
    const { data: existing, error: existingError } = await supabase
      .from('consolidated_knowledge')
      .select('id')
      .eq('area_id', areaId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ 
        error: 'No existe conocimiento consolidado para esta área' 
      }, { status: 404 });
    }

    // Actualizar el conocimiento consolidado
    const { data: updated, error: updateError } = await supabase
      .from('consolidated_knowledge')
      .update({
        content: body.content,
        validated: body.validated || false,
        updated_at: new Date().toISOString()
      })
      .eq('area_id', areaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando conocimiento consolidado:', updateError);
      return NextResponse.json({ error: 'Error actualizando conocimiento consolidado' }, { status: 500 });
    }

    console.log('Conocimiento consolidado actualizado exitosamente');
    return NextResponse.json({
      success: true,
      consolidated_knowledge: updated
    });

  } catch (error) {
    console.error('Error en actualización de conocimiento consolidado:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 