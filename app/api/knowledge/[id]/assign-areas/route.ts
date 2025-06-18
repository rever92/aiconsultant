import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST /api/knowledge/[id]/assign-areas - Assign areas to knowledge
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const knowledgeId = params.id;
    const { areaIds } = await request.json();

    if (!knowledgeId) {
      return NextResponse.json(
        { error: 'ID de conocimiento requerido' },
        { status: 400 }
      );
    }

    if (!Array.isArray(areaIds)) {
      return NextResponse.json(
        { error: 'areaIds debe ser un array' },
        { status: 400 }
      );
    }

    console.log('Assigning areas to knowledge:', knowledgeId, 'areas:', areaIds);

    // Verificar que el conocimiento existe
    const { data: knowledge, error: knowledgeError } = await supabase
      .from('knowledge')
      .select('id')
      .eq('id', knowledgeId)
      .single();

    if (knowledgeError || !knowledge) {
      return NextResponse.json(
        { error: 'Conocimiento no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar asignaciones existentes
    const { error: deleteError } = await supabase
      .from('knowledge_areas')
      .delete()
      .eq('knowledge_id', knowledgeId);

    if (deleteError) {
      console.error('Error deleting existing assignments:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Crear nuevas asignaciones
    if (areaIds.length > 0) {
      const assignments = areaIds.map(areaId => ({
        knowledge_id: knowledgeId,
        area_id: areaId
      }));

      const { error: insertError } = await supabase
        .from('knowledge_areas')
        .insert(assignments);

      if (insertError) {
        console.error('Error creating new assignments:', insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
    }

    console.log('Areas assigned successfully');
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error assigning areas:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error asignando áreas' },
      { status: 500 }
    );
  }
} 