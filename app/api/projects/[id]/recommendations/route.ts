import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContent } from '@/lib/gemini/client';
import { GENERATE_RECOMMENDATIONS_PROMPT, buildPrompt } from '@/lib/prompts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/projects/[id]/recommendations - Obtener recomendaciones del proyecto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Obteniendo recomendaciones para proyecto:', projectId);

    const { data: recommendations, error } = await supabase
      .from('project_recommendations')
      .select('*')
      .eq('project_id', projectId)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error obteniendo recomendaciones:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Recomendaciones obtenidas:', recommendations?.length || 0);
    return NextResponse.json(recommendations || []);
  } catch (error) {
    console.error('Error en GET recommendations:', error);
    return NextResponse.json(
      { error: 'Error obteniendo recomendaciones' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/recommendations - Generar recomendaciones con IA
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    console.log('Generando recomendaciones para proyecto:', projectId);

    // 1. Obtener análisis AS IS validado del proyecto
    const { data: analysis, error: analysisError } = await supabase
      .from('analysis_as_is')
      .select('*')
      .eq('project_id', projectId)
      .eq('validated', true)
      .order('version', { ascending: false })
      .limit(1);

    if (analysisError) {
      console.error('Error obteniendo análisis AS IS:', analysisError);
      return NextResponse.json({ error: 'Error obteniendo análisis AS IS' }, { status: 500 });
    }

    if (!analysis || analysis.length === 0) {
      return NextResponse.json(
        { error: 'No hay análisis AS IS validado disponible. Complete y valide el Paso 2 primero.' },
        { status: 400 }
      );
    }

    const currentAnalysis = analysis[0];

    // 2. Preparar el análisis AS IS completo para el prompt
    const analysisText = formatAnalysisForPrompt(currentAnalysis);

    // 3. Generar recomendaciones con IA
    const prompt = buildPrompt(GENERATE_RECOMMENDATIONS_PROMPT, {
      analysisAsIs: analysisText
    });

    console.log('Generando recomendaciones con IA...');
    const recommendationsContent = await generateContent(prompt);

    if (!recommendationsContent || recommendationsContent.trim() === '') {
      return NextResponse.json(
        { error: 'No se pudo generar las recomendaciones' },
        { status: 500 }
      );
    }

    // 4. Parsear las recomendaciones generadas
    const recommendations = parseRecommendations(recommendationsContent);

    if (recommendations.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron parsear las recomendaciones generadas' },
        { status: 500 }
      );
    }

    // 5. Limpiar recomendaciones anteriores generadas por IA
    await supabase
      .from('project_recommendations')
      .delete()
      .eq('project_id', projectId)
      .eq('ai_generated', true);

    // 6. Insertar nuevas recomendaciones
    const recommendationsToInsert = recommendations.map(rec => ({
      project_id: projectId,
      title: rec.title,
      description: rec.description,
      justification: rec.justification,
      category: rec.category,
      priority: rec.priority,
      status: 'proposed' as const,
      ai_generated: true,
      validated: false
    }));

    const { data: insertedRecommendations, error: insertError } = await supabase
      .from('project_recommendations')
      .insert(recommendationsToInsert)
      .select();

    if (insertError) {
      console.error('Error insertando recomendaciones:', insertError);
      return NextResponse.json({ error: 'Error guardando recomendaciones' }, { status: 500 });
    }

    console.log('Recomendaciones generadas y guardadas exitosamente:', insertedRecommendations?.length);
    return NextResponse.json(insertedRecommendations);

  } catch (error) {
    console.error('Error generando recomendaciones:', error);
    return NextResponse.json(
      { error: 'Error generando recomendaciones' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/recommendations - Actualizar múltiples recomendaciones
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { recommendations } = body;

    if (!Array.isArray(recommendations)) {
      return NextResponse.json({ error: 'Se esperaba un array de recomendaciones' }, { status: 400 });
    }

    console.log('Actualizando recomendaciones para proyecto:', projectId);

    // Actualizar cada recomendación
    const updatePromises = recommendations.map(async (rec: any) => {
      if (!rec.id) return null;

      const { data, error } = await supabase
        .from('project_recommendations')
        .update({
          title: rec.title,
          description: rec.description,
          justification: rec.justification,
          category: rec.category,
          priority: rec.priority,
          status: rec.status,
          validated: rec.validated
        })
        .eq('id', rec.id)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        console.error(`Error actualizando recomendación ${rec.id}:`, error);
        return null;
      }

      return data;
    });

    const results = await Promise.all(updatePromises);
    const successfulUpdates = results.filter(Boolean);

    console.log('Recomendaciones actualizadas:', successfulUpdates.length);
    return NextResponse.json(successfulUpdates);

  } catch (error) {
    console.error('Error actualizando recomendaciones:', error);
    return NextResponse.json(
      { error: 'Error actualizando recomendaciones' },
      { status: 500 }
    );
  }
}

// Función auxiliar para formatear el análisis AS IS para el prompt
function formatAnalysisForPrompt(analysis: any): string {
  const sections = [
    { title: '1. ESTRATEGIA Y GOBIERNO', content: analysis.strategy_governance },
    { title: '2. PROCESOS Y OPERACIONES', content: analysis.processes_operations },
    { title: '3. TECNOLOGÍA E INFRAESTRUCTURA', content: analysis.technology_infrastructure },
    { title: '4. DATOS E INFORMACIÓN', content: analysis.data_information },
    { title: '5. PERSONAS Y CULTURA', content: analysis.people_culture },
    { title: '6. EXPERIENCIA DEL CLIENTE', content: analysis.customer_experience },
    { title: 'CONCLUSIONES GENERALES', content: analysis.conclusions }
  ];

  return sections
    .filter(section => section.content && section.content.trim() !== '')
    .map(section => `## ${section.title}\n\n${section.content}\n\n`)
    .join('');
}

// Función auxiliar para parsear las recomendaciones generadas
function parseRecommendations(content: string) {
  const recommendations: any[] = [];
  
  try {
    // Dividir por recomendaciones usando patrones de título
    const recommendationBlocks = content.split(/(?=\*\*Título:\*\*|\*\*TÍTULO:\*\*|#{1,3}\s*\*\*[^*]+\*\*)/i)
      .filter(block => block.trim() !== '');

    recommendationBlocks.forEach(block => {
      const rec = parseRecommendationBlock(block);
      if (rec && rec.title && rec.description && rec.justification) {
        recommendations.push(rec);
      }
    });

    // Si no se parsearon bien, intentar método alternativo
    if (recommendations.length === 0) {
      const alternativeRecs = parseRecommendationsAlternative(content);
      recommendations.push(...alternativeRecs);
    }

  } catch (error) {
    console.error('Error parseando recomendaciones:', error);
  }

  return recommendations;
}

// Función auxiliar para parsear un bloque de recomendación individual
function parseRecommendationBlock(block: string) {
  const patterns = {
    title: /\*\*Título:\*\*\s*(.+?)(?=\n|\*\*)/i,
    category: /\*\*Categoría:\*\*\s*(.+?)(?=\n|\*\*)/i,
    priority: /\*\*Prioridad:\*\*\s*(\d+)/i,
    description: /\*\*Descripción:\*\*\s*([\s\S]*?)(?=\*\*Justificación:\*\*)/i,
    justification: /\*\*Justificación:\*\*\s*([\s\S]*?)(?=\*\*Título:\*\*|$)/i
  };

  const rec: any = {};

  // Extraer cada campo
  Object.entries(patterns).forEach(([key, regex]) => {
    const match = block.match(regex);
    if (match && match[1]) {
      rec[key] = match[1].trim();
    }
  });

  // Mapear categoría a valores válidos
  if (rec.category) {
    const categoryMap: { [key: string]: string } = {
      'tecnológico': 'technological',
      'tecnologico': 'technological',
      'technological': 'technological',
      'formativo': 'training',
      'training': 'training',
      'cultural': 'cultural',
      'culturales': 'cultural',
      'metodológico': 'methodological',
      'metodologico': 'methodological',
      'methodological': 'methodological'
    };

    rec.category = categoryMap[rec.category.toLowerCase()] || 'technological';
  }

  // Convertir prioridad a número
  if (rec.priority) {
    rec.priority = Math.min(Math.max(parseInt(rec.priority), 1), 10);
  } else {
    rec.priority = 5; // Prioridad por defecto
  }

  return rec;
}

// Método alternativo de parseo si el principal falla
function parseRecommendationsAlternative(content: string) {
  const recommendations: any[] = [];
  
  // Dividir por líneas y buscar patrones
  const lines = content.split('\n');
  let currentRec: any = {};
  let collectingDescription = false;
  let collectingJustification = false;

  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('Título:') || trimmedLine.includes('TÍTULO:')) {
      // Guardar recomendación anterior si existe
      if (currentRec.title && currentRec.description && currentRec.justification) {
        recommendations.push({ ...currentRec });
      }
      
      // Iniciar nueva recomendación
      currentRec = {
        title: extractValue(trimmedLine),
        category: 'technological',
        priority: 5
      };
      collectingDescription = false;
      collectingJustification = false;
    } else if (trimmedLine.includes('Categoría:') || trimmedLine.includes('CATEGORÍA:')) {
      currentRec.category = extractValue(trimmedLine) || 'technological';
    } else if (trimmedLine.includes('Prioridad:') || trimmedLine.includes('PRIORIDAD:')) {
      const priority = extractValue(trimmedLine);
      currentRec.priority = priority ? parseInt(priority) : 5;
    } else if (trimmedLine.includes('Descripción:') || trimmedLine.includes('DESCRIPCIÓN:')) {
      currentRec.description = extractValue(trimmedLine) || '';
      collectingDescription = true;
      collectingJustification = false;
    } else if (trimmedLine.includes('Justificación:') || trimmedLine.includes('JUSTIFICACIÓN:')) {
      currentRec.justification = extractValue(trimmedLine) || '';
      collectingDescription = false;
      collectingJustification = true;
    } else if (collectingDescription && trimmedLine !== '') {
      currentRec.description = (currentRec.description || '') + ' ' + trimmedLine;
    } else if (collectingJustification && trimmedLine !== '') {
      currentRec.justification = (currentRec.justification || '') + ' ' + trimmedLine;
    }
  });

  // Guardar última recomendación
  if (currentRec.title && currentRec.description && currentRec.justification) {
    recommendations.push(currentRec);
  }

  return recommendations;
}

// Función auxiliar para extraer valor después de los dos puntos
function extractValue(line: string): string {
  const parts = line.split(':');
  if (parts.length > 1) {
    return parts.slice(1).join(':').replace(/\*\*/g, '').trim();
  }
  return '';
}