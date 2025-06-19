import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from '@/lib/gemini/client';
import { CONSOLIDATE_AREA_KNOWLEDGE_PROMPT, buildPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const areaId = params.id;
    
    if (!areaId) {
      return NextResponse.json({ error: 'Area ID es requerido' }, { status: 400 });
    }

    console.log('Consolidando conocimiento para área:', areaId);

    // 1. Obtener información del área y proyecto
    const { data: area, error: areaError } = await supabase
      .from('areas')
      .select(`
        *,
        projects (
          id,
          name,
          description
        )
      `)
      .eq('id', areaId)
      .single();

    if (areaError || !area) {
      console.error('Error obteniendo área:', areaError);
      return NextResponse.json({ error: 'Área no encontrada' }, { status: 404 });
    }

    // 2. Obtener todo el conocimiento asignado a esta área
    const { data: knowledgeData, error: knowledgeError } = await supabase
      .from('knowledge_areas')
      .select(`
        knowledge (
          id,
          title,
          content,
          source_type,
          notes,
          uploaded_at
        )
      `)
      .eq('area_id', areaId);

    if (knowledgeError) {
      console.error('Error obteniendo conocimiento:', knowledgeError);
      return NextResponse.json({ error: 'Error obteniendo conocimiento' }, { status: 500 });
    }

    // 3. Verificar que hay conocimiento para consolidar
    const knowledge = knowledgeData?.map(k => k.knowledge).filter(Boolean) || [];
    
    if (knowledge.length === 0) {
      return NextResponse.json({ 
        error: 'No hay conocimiento asignado a esta área para consolidar' 
      }, { status: 400 });
    }

    console.log(`Encontradas ${knowledge.length} fuentes de conocimiento para consolidar`);

    // 4. Verificar si ya existe conocimiento consolidado para esta área
    const { data: existingConsolidated, error: existingError } = await supabase
      .from('consolidated_knowledge')
      .select('*')
      .eq('area_id', areaId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error verificando conocimiento consolidado existente:', existingError);
      return NextResponse.json({ error: 'Error verificando datos existentes' }, { status: 500 });
    }

    // 5. Preparar las fuentes de conocimiento para el prompt
    const knowledgeSources = knowledge.map((k: any, index: number) => `
**FUENTE ${index + 1}: ${k.title}**
Tipo: ${k.source_type === 'upload' ? 'Archivo subido' : 'Contenido manual'}
Fecha: ${new Date(k.uploaded_at).toLocaleDateString('es-ES')}
${k.notes ? `Notas: ${k.notes}` : ''}

CONTENIDO:
${k.content}

---
    `).join('\n');

    // 6. Construir el prompt para Gemini
    const prompt = buildPrompt(CONSOLIDATE_AREA_KNOWLEDGE_PROMPT, {
      areaName: area.name,
      areaDescription: area.description || 'Sin descripción específica',
      projectName: area.projects?.name || 'Proyecto sin nombre',
      knowledgeSources: knowledgeSources
    });

    console.log('Enviando prompt a Gemini para consolidación...');

    // 7. Generar contenido consolidado con Gemini
    const consolidatedContent = await generateContent(prompt);

    if (!consolidatedContent) {
      return NextResponse.json({ error: 'Error generando contenido consolidado' }, { status: 500 });
    }

    // 8. Guardar o actualizar el conocimiento consolidado
    let consolidatedKnowledge;
    
    if (existingConsolidated) {
      // Actualizar existente
      const { data: updated, error: updateError } = await supabase
        .from('consolidated_knowledge')
        .update({
          content: consolidatedContent,
          original_sources_count: knowledge.length,
          validated: false, // Reset validation cuando se actualiza
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConsolidated.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando conocimiento consolidado:', updateError);
        return NextResponse.json({ error: 'Error actualizando conocimiento consolidado' }, { status: 500 });
      }

      consolidatedKnowledge = updated;
      console.log('Conocimiento consolidado actualizado:', existingConsolidated.id);
    } else {
      // Crear nuevo
      const { data: created, error: createError } = await supabase
        .from('consolidated_knowledge')
        .insert({
          area_id: areaId,
          content: consolidatedContent,
          original_sources_count: knowledge.length,
          ai_generated: true,
          validated: false
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creando conocimiento consolidado:', createError);
        return NextResponse.json({ error: 'Error guardando conocimiento consolidado' }, { status: 500 });
      }

      consolidatedKnowledge = created;
      console.log('Conocimiento consolidado creado:', created.id);
    }

    // 9. Devolver resultado
    const response = {
      success: true,
      consolidated_knowledge: consolidatedKnowledge,
      area: {
        id: area.id,
        name: area.name,
        description: area.description
      },
      original_sources_count: knowledge.length,
      action: existingConsolidated ? 'updated' : 'created'
    };

    console.log('Consolidación completada exitosamente');
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error en consolidación de conocimiento:', error);
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
} 