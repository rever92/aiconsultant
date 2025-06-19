import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from '@/lib/gemini/client';
import { ANALYSIS_AS_IS_PROMPT, buildPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/[id]/analysis-as-is - Obtener análisis AS IS del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Obteniendo análisis AS IS para proyecto:', projectId);

    const { data: analysis, error } = await supabase
      .from('analysis_as_is')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error obteniendo análisis AS IS:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Análisis AS IS obtenido:', !!analysis?.[0]);
    return NextResponse.json(analysis?.[0] || null);
  } catch (error) {
    console.error('Error en GET analysis-as-is:', error);
    return NextResponse.json(
      { error: 'Error obteniendo análisis AS IS' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/analysis-as-is - Generar análisis AS IS con IA
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Generando análisis AS IS para proyecto:', projectId);

    // 1. Obtener información del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error obteniendo proyecto:', projectError);
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // 2. Obtener todo el conocimiento consolidado del proyecto
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select(`
        id,
        name,
        description,
        consolidated_knowledge (
          content,
          validated,
          original_sources_count
        )
      `)
      .eq('project_id', projectId);

    if (areasError) {
      console.error('Error obteniendo áreas:', areasError);
      return NextResponse.json({ error: 'Error obteniendo conocimiento consolidado' }, { status: 500 });
    }

    // 3. Verificar que hay conocimiento consolidado suficiente
    const consolidatedAreas = areas?.filter(area => area.consolidated_knowledge && area.consolidated_knowledge.length > 0) || [];
    
    if (consolidatedAreas.length === 0) {
      return NextResponse.json(
        { error: 'No hay conocimiento consolidado disponible. Complete el Paso 1 primero.' },
        { status: 400 }
      );
    }

    // 4. Preparar el conocimiento consolidado para el prompt
    const consolidatedKnowledge = consolidatedAreas.map(area => {
      const consolidated = area.consolidated_knowledge[0];
      return `## ÁREA: ${area.name}\n\n${consolidated.content}\n\n`;
    }).join('\n');

    // 5. Generar análisis AS IS con IA
    const prompt = buildPrompt(ANALYSIS_AS_IS_PROMPT, {
      projectName: project.name,
      projectDescription: project.description || 'Sin descripción disponible',
      consolidatedKnowledge: consolidatedKnowledge
    });

    console.log('Generando análisis AS IS con IA...');
    const analysisContent = await generateContent(prompt);

    if (!analysisContent || analysisContent.trim() === '') {
      return NextResponse.json(
        { error: 'No se pudo generar el análisis AS IS' },
        { status: 500 }
      );
    }

    // 6. Parsear el contenido generado para extraer las secciones
    const sections = parseAnalysisAsIs(analysisContent);

    // 7. Determinar la próxima versión
    const { data: existingAnalysis } = await supabase
      .from('analysis_as_is')
      .select('version')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = (existingAnalysis?.[0]?.version || 0) + 1;

    // 8. Guardar en la base de datos
    const { data: newAnalysis, error: insertError } = await supabase
      .from('analysis_as_is')
      .insert({
        project_id: projectId,
        strategy_governance: sections.strategy_governance,
        processes_operations: sections.processes_operations,
        technology_infrastructure: sections.technology_infrastructure,
        data_information: sections.data_information,
        people_culture: sections.people_culture,
        customer_experience: sections.customer_experience,
        conclusions: sections.conclusions,
        ai_generated: true,
        validated: false,
        version: nextVersion
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error guardando análisis AS IS:', insertError);
      return NextResponse.json({ error: 'Error guardando análisis AS IS' }, { status: 500 });
    }

    // 9. Crear versión en historial
    await supabase
      .from('analysis_as_is_versions')
      .insert({
        analysis_id: newAnalysis.id,
        version: nextVersion,
        strategy_governance: sections.strategy_governance,
        processes_operations: sections.processes_operations,
        technology_infrastructure: sections.technology_infrastructure,
        data_information: sections.data_information,
        people_culture: sections.people_culture,
        customer_experience: sections.customer_experience,
        conclusions: sections.conclusions,
        change_summary: 'Análisis AS IS generado por IA',
        created_by_user: false
      });

    console.log('Análisis AS IS generado y guardado exitosamente');
    return NextResponse.json(newAnalysis);

  } catch (error) {
    console.error('Error generando análisis AS IS:', error);
    return NextResponse.json(
      { error: 'Error generando análisis AS IS' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/analysis-as-is - Actualizar análisis AS IS
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    console.log('Actualizando análisis AS IS para proyecto:', projectId);

    // 1. Obtener análisis actual
    const { data: currentAnalysis, error: getCurrentError } = await supabase
      .from('analysis_as_is')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (getCurrentError || !currentAnalysis) {
      console.error('Error obteniendo análisis actual:', getCurrentError);
      return NextResponse.json({ error: 'Análisis AS IS no encontrado' }, { status: 404 });
    }

    // 2. Determinar si hay cambios significativos para crear nueva versión
    const hasSignificantChanges = (
      body.strategy_governance !== currentAnalysis.strategy_governance ||
      body.processes_operations !== currentAnalysis.processes_operations ||
      body.technology_infrastructure !== currentAnalysis.technology_infrastructure ||
      body.data_information !== currentAnalysis.data_information ||
      body.people_culture !== currentAnalysis.people_culture ||
      body.customer_experience !== currentAnalysis.customer_experience ||
      body.conclusions !== currentAnalysis.conclusions
    );

    let updatedAnalysis;

    if (hasSignificantChanges) {
      // 3. Crear nueva versión
      const nextVersion = currentAnalysis.version + 1;

      const { data: newVersionAnalysis, error: insertError } = await supabase
        .from('analysis_as_is')
        .insert({
          project_id: projectId,
          strategy_governance: body.strategy_governance,
          processes_operations: body.processes_operations,
          technology_infrastructure: body.technology_infrastructure,
          data_information: body.data_information,
          people_culture: body.people_culture,
          customer_experience: body.customer_experience,
          conclusions: body.conclusions,
          ai_generated: false,
          validated: body.validated || false,
          version: nextVersion
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creando nueva versión:', insertError);
        return NextResponse.json({ error: 'Error actualizando análisis AS IS' }, { status: 500 });
      }

      // 4. Crear entrada en historial
      await supabase
        .from('analysis_as_is_versions')
        .insert({
          analysis_id: newVersionAnalysis.id,
          version: nextVersion,
          strategy_governance: body.strategy_governance,
          processes_operations: body.processes_operations,
          technology_infrastructure: body.technology_infrastructure,
          data_information: body.data_information,
          people_culture: body.people_culture,
          customer_experience: body.customer_experience,
          conclusions: body.conclusions,
          change_summary: body.change_summary || 'Análisis editado por usuario',
          created_by_user: true
        });

      updatedAnalysis = newVersionAnalysis;
    } else {
      // 5. Solo actualizar validación si no hay cambios significativos
      const { data: updated, error: updateError } = await supabase
        .from('analysis_as_is')
        .update({ validated: body.validated })
        .eq('id', currentAnalysis.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error actualizando validación:', updateError);
        return NextResponse.json({ error: 'Error actualizando análisis AS IS' }, { status: 500 });
      }

      updatedAnalysis = updated;
    }

    console.log('Análisis AS IS actualizado exitosamente');
    return NextResponse.json(updatedAnalysis);

  } catch (error) {
    console.error('Error actualizando análisis AS IS:', error);
    return NextResponse.json(
      { error: 'Error actualizando análisis AS IS' },
      { status: 500 }
    );
  }
}

// Función auxiliar para parsear el contenido del análisis AS IS
function parseAnalysisAsIs(content: string) {
  const sections = {
    strategy_governance: '',
    processes_operations: '',
    technology_infrastructure: '',
    data_information: '',
    people_culture: '',
    customer_experience: '',
    conclusions: ''
  };

  try {
    // Dividir por secciones usando patrones de títulos
    const patterns = [
      { key: 'strategy_governance', regex: /##\s*1\.\s*ESTRATEGIA Y GOBIERNO([\s\S]*?)(?=##\s*2\.|$)/i },
      { key: 'processes_operations', regex: /##\s*2\.\s*PROCESOS Y OPERACIONES([\s\S]*?)(?=##\s*3\.|$)/i },
      { key: 'technology_infrastructure', regex: /##\s*3\.\s*TECNOLOGÍA E INFRAESTRUCTURA([\s\S]*?)(?=##\s*4\.|$)/i },
      { key: 'data_information', regex: /##\s*4\.\s*DATOS E INFORMACIÓN([\s\S]*?)(?=##\s*5\.|$)/i },
      { key: 'people_culture', regex: /##\s*5\.\s*PERSONAS Y CULTURA([\s\S]*?)(?=##\s*6\.|$)/i },
      { key: 'customer_experience', regex: /##\s*6\.\s*EXPERIENCIA DEL CLIENTE([\s\S]*?)(?=##\s*CONCLUSIONES|$)/i },
      { key: 'conclusions', regex: /##\s*CONCLUSIONES GENERALES([\s\S]*?)$/i }
    ];

    patterns.forEach(({ key, regex }) => {
      const match = content.match(regex);
      if (match && match[1]) {
        sections[key as keyof typeof sections] = match[1].trim();
      }
    });

    // Si no se pudieron parsear las secciones, usar todo el contenido como conclusiones
    if (Object.values(sections).every(section => section === '')) {
      sections.conclusions = content;
    }

  } catch (error) {
    console.error('Error parseando análisis AS IS:', error);
    sections.conclusions = content; // Fallback
  }

  return sections;
}