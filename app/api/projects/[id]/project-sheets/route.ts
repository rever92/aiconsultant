import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from '@/lib/gemini/client';
import { GENERATE_PROJECT_SHEETS_PROMPT, buildPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/[id]/project-sheets - Obtener fichas de proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Obteniendo fichas de proyecto para:', projectId);

    const { data: projectSheets, error } = await supabase
      .from('project_sheets')
      .select(`
        *,
        project_recommendations (
          id,
          title,
          category,
          priority,
          status
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo fichas de proyecto:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Fichas de proyecto obtenidas:', projectSheets?.length || 0);
    return NextResponse.json(projectSheets || []);
  } catch (error) {
    console.error('Error en GET project-sheets:', error);
    return NextResponse.json(
      { error: 'Error obteniendo fichas de proyecto' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/project-sheets - Generar fichas detalladas para recomendaciones aprobadas
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Generando fichas de proyecto para:', projectId);

    // 1. Obtener recomendaciones aprobadas
    const { data: recommendations, error: recError } = await supabase
      .from('project_recommendations')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', 'accepted')
      .order('priority', { ascending: false });

    if (recError) {
      console.error('Error obteniendo recomendaciones:', recError);
      return NextResponse.json({ error: 'Error obteniendo recomendaciones aprobadas' }, { status: 500 });
    }

    if (!recommendations || recommendations.length === 0) {
      return NextResponse.json(
        { error: 'No hay recomendaciones aprobadas disponibles. Complete y apruebe el Paso 3 primero.' },
        { status: 400 }
      );
    }

    // 2. Obtener áreas del proyecto
    const { data: areas, error: areasError } = await supabase
      .from('areas')
      .select('id, name, description')
      .eq('project_id', projectId);

    if (areasError) {
      console.error('Error obteniendo áreas:', areasError);
      return NextResponse.json({ error: 'Error obteniendo áreas del proyecto' }, { status: 500 });
    }

    // 3. Obtener análisis AS IS para contexto
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis_as_is')
      .select('*')
      .eq('project_id', projectId)
      .order('version', { ascending: false })
      .limit(1);

    if (analysisError) {
      console.error('Error obteniendo análisis AS IS:', analysisError);
      return NextResponse.json({ error: 'Error obteniendo análisis AS IS' }, { status: 500 });
    }

    // 4. Limpiar fichas anteriores generadas por IA
    await supabase
      .from('project_sheets')
      .delete()
      .eq('project_id', projectId)
      .in('recommendation_id', recommendations.map(r => r.id));

    // 5. Generar ficha para cada recomendación aprobada
    const generatedSheets = [];

    for (const recommendation of recommendations) {
      try {
        console.log(`Generando ficha para: ${recommendation.title}`);

        // Preparar datos para el prompt
        const areasInfo = areas?.map(a => `- ${a.name}: ${a.description || 'Sin descripción'}`).join('\n') || '';
        const analysisInfo = analysis?.[0] ? formatAnalysisForContext(analysis[0]) : 'No disponible';

        const prompt = buildPrompt(GENERATE_PROJECT_SHEETS_PROMPT, {
          recommendation: formatRecommendationForPrompt(recommendation),
          areas: areasInfo,
          analysisAsIs: analysisInfo
        });

        console.log('Generando ficha de proyecto con IA...');
        const sheetContent = await generateContent(prompt);

        if (!sheetContent || sheetContent.trim() === '') {
          console.warn(`No se pudo generar ficha para: ${recommendation.title}`);
          continue;
        }

        // Parsear el contenido generado
        const parsedSheet = parseProjectSheet(sheetContent, recommendation);

        // Insertar ficha en la base de datos
        const { data: insertedSheet, error: insertError } = await supabase
          .from('project_sheets')
          .insert({
            recommendation_id: recommendation.id,
            project_id: projectId,
            title: parsedSheet.title,
            description: parsedSheet.description,
            expected_benefits: parsedSheet.expected_benefits,
            strategic_objectives: parsedSheet.strategic_objectives,
            human_resources: parsedSheet.human_resources,
            technological_resources: parsedSheet.technological_resources,
            estimated_investment: parsedSheet.estimated_investment,
            estimated_duration: parsedSheet.estimated_duration,
            involved_areas: parsedSheet.involved_areas,
            validated: false
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error insertando ficha para ${recommendation.title}:`, insertError);
          continue;
        }

        generatedSheets.push(insertedSheet);

      } catch (error) {
        console.error(`Error generando ficha para ${recommendation.title}:`, error);
        continue;
      }
    }

    if (generatedSheets.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron generar fichas de proyecto' },
        { status: 500 }
      );
    }

    console.log('Fichas de proyecto generadas exitosamente:', generatedSheets.length);
    return NextResponse.json(generatedSheets);

  } catch (error) {
    console.error('Error generando fichas de proyecto:', error);
    return NextResponse.json(
      { error: 'Error generando fichas de proyecto' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/project-sheets - Actualizar fichas de proyecto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { projectSheets } = body;

    if (!Array.isArray(projectSheets)) {
      return NextResponse.json({ error: 'Se esperaba un array de fichas de proyecto' }, { status: 400 });
    }

    console.log('Actualizando fichas de proyecto para:', projectId);

    // Actualizar cada ficha
    const updatePromises = projectSheets.map(async (sheet: any) => {
      if (!sheet.id) return null;

      const { data, error } = await supabase
        .from('project_sheets')
        .update({
          title: sheet.title,
          description: sheet.description,
          expected_benefits: sheet.expected_benefits,
          strategic_objectives: sheet.strategic_objectives,
          human_resources: sheet.human_resources,
          technological_resources: sheet.technological_resources,
          estimated_investment: sheet.estimated_investment,
          estimated_duration: sheet.estimated_duration,
          involved_areas: sheet.involved_areas,
          validated: sheet.validated
        })
        .eq('id', sheet.id)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        console.error(`Error actualizando ficha ${sheet.id}:`, error);
        return null;
      }

      return data;
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(Boolean);

    console.log('Fichas de proyecto actualizadas:', successfulUpdates.length);
    return NextResponse.json(successfulUpdates);

  } catch (error) {
    console.error('Error actualizando fichas de proyecto:', error);
    return NextResponse.json(
      { error: 'Error actualizando fichas de proyecto' },
      { status: 500 }
    );
  }
}

// Función auxiliar para formatear recomendación para el prompt
function formatRecommendationForPrompt(recommendation: any): string {
  return `
**Título:** ${recommendation.title}
**Categoría:** ${recommendation.category}
**Prioridad:** ${recommendation.priority}/10

**Descripción:**
${recommendation.description}

**Justificación:**
${recommendation.justification}
  `.trim();
}

// Función auxiliar para formatear análisis AS IS para contexto
function formatAnalysisForContext(analysis: any): string {
  const sections = [
    { title: 'Estrategia y Gobierno', content: analysis.strategy_governance },
    { title: 'Procesos y Operaciones', content: analysis.processes_operations },
    { title: 'Tecnología e Infraestructura', content: analysis.technology_infrastructure },
    { title: 'Datos e Información', content: analysis.data_information },
    { title: 'Personas y Cultura', content: analysis.people_culture },
    { title: 'Experiencia del Cliente', content: analysis.customer_experience },
    { title: 'Conclusiones', content: analysis.conclusions }
  ];

  return sections
    .filter(section => section.content && section.content.trim() !== '')
    .map(section => `**${section.title}:**\n${section.content.substring(0, 500)}${section.content.length > 500 ? '...' : ''}`)
    .join('\n\n');
}

// Función auxiliar para parsear la ficha de proyecto generada
function parseProjectSheet(content: string, recommendation: any) {
  const sheet = {
    title: recommendation.title,
    description: '',
    expected_benefits: '',
    strategic_objectives: '',
    human_resources: '',
    technological_resources: '',
    estimated_investment: null as number | null,
    estimated_duration: null as number | null,
    involved_areas: '[]'
  };

  try {
    // Patrones para extraer secciones
    const patterns = {
      title: /(?:\*\*)?(?:TÍTULO|Título)(?:\*\*)?[:\s]*(.+?)(?=\n|$)/i,
      description: /(?:\*\*)?(?:DESCRIPCIÓN|Descripción)(?:\*\*)?[:\s]*([\s\S]*?)(?=##|$)/i,
      expected_benefits: /(?:\*\*)?(?:BENEFICIOS|Beneficios)(?:\*\*)?[:\s]*([\s\S]*?)(?=##|$)/i,
      strategic_objectives: /(?:\*\*)?(?:OBJETIVOS|Objetivos)(?:\*\*)?[:\s]*([\s\S]*?)(?=##|$)/i,
      human_resources: /(?:\*\*)?(?:RECURSOS HUMANOS|Recursos Humanos)(?:\*\*)?[:\s]*([\s\S]*?)(?=##|$)/i,
      technological_resources: /(?:\*\*)?(?:RECURSOS TECNOLÓGICOS|Recursos Tecnológicos)(?:\*\*)?[:\s]*([\s\S]*?)(?=##|$)/i,
      estimated_investment: /(?:inversión|investment|€|euro).*?(\d+(?:,\d+)?(?:\.\d+)?)/i,
      estimated_duration: /(?:duración|duration|días|meses|months).*?(\d+)/i
    };

    // Extraer cada sección
    Object.entries(patterns).forEach(([key, regex]) => {
      const match = content.match(regex);
      if (match && match[1]) {
        const value = match[1].trim();
        
        if (key === 'estimated_investment') {
          // Extraer número de inversión
          const numMatch = value.match(/(\d+(?:,\d+)?(?:\.\d+)?)/);
          if (numMatch) {
            sheet.estimated_investment = parseFloat(numMatch[1].replace(',', ''));
          }
        } else if (key === 'estimated_duration') {
          // Extraer duración en días
          const numMatch = value.match(/(\d+)/);
          if (numMatch) {
            let duration = parseInt(numMatch[1]);
            // Si está en meses, convertir a días
            if (value.toLowerCase().includes('mes')) {
              duration = duration * 30;
            }
            sheet.estimated_duration = duration;
          }
        } else {
          sheet[key as keyof typeof sheet] = value as any;
        }
      }
    });

    // Si no se extrajo título, usar el de la recomendación
    if (!sheet.title || sheet.title.trim() === '') {
      sheet.title = recommendation.title;
    }

    // Si no se extrajo descripción, usar la descripción de la recomendación
    if (!sheet.description || sheet.description.trim() === '') {
      sheet.description = recommendation.description;
    }

    // Intentar extraer áreas involucradas (simplificado)
    const areasMatch = content.match(/(?:áreas|areas).*?involucradas?.*?:(.*?)(?=##|$)/is);
    if (areasMatch) {
      try {
        // Intentar extraer nombres de áreas mencionadas
        const areasText = areasMatch[1];
        const mentionedAreas = areasText.match(/\b[A-Z][a-zA-Z\s]+(?=\s|,|\.|\n|$)/g) || [];
        if (mentionedAreas.length > 0) {
          sheet.involved_areas = JSON.stringify(mentionedAreas.slice(0, 5)); // Máximo 5 áreas
        }
      } catch (error) {
        console.warn('Error parseando áreas involucradas:', error);
      }
    }

  } catch (error) {
    console.error('Error parseando ficha de proyecto:', error);
    // Usar valores por defecto de la recomendación
    sheet.description = recommendation.description;
  }

  return sheet;
}