import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/projects/[id]/advance-step - Avanzar al siguiente paso del proyecto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();
    const { completedStep } = body;

    if (!completedStep || ![1, 2, 3, 4].includes(completedStep)) {
      return NextResponse.json(
        { error: 'Paso completado inválido. Debe ser 1, 2, 3 o 4.' },
        { status: 400 }
      );
    }

    console.log(`Avanzando proyecto ${projectId} desde paso ${completedStep}`);

    // 1. Obtener proyecto actual
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error obteniendo proyecto:', projectError);
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // 2. Validar que el paso se puede completar
    const validationResult = await validateStepCompletion(projectId, completedStep);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.message },
        { status: 400 }
      );
    }

    // 3. Marcar paso como completado y avanzar si corresponde
    const updateData: any = {};
    
    switch (completedStep) {
      case 1:
        updateData.step_1_completed = true;
        if (project.current_step <= 1) {
          updateData.current_step = 2;
        }
        break;
      case 2:
        updateData.step_2_completed = true;
        if (project.current_step <= 2) {
          updateData.current_step = 3;
        }
        break;
      case 3:
        updateData.step_3_completed = true;
        if (project.current_step <= 3) {
          updateData.current_step = 4;
        }
        break;
      case 4:
        updateData.step_4_completed = true;
        // No hay siguiente paso, se queda en 4
        break;
    }

    // 4. Actualizar proyecto
    const { data: updatedProject, error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando proyecto:', updateError);
      return NextResponse.json({ error: 'Error avanzando paso del proyecto' }, { status: 500 });
    }

    console.log(`Proyecto ${projectId} avanzado exitosamente. Paso actual: ${updatedProject.current_step}`);
    return NextResponse.json(updatedProject);

  } catch (error) {
    console.error('Error avanzando paso del proyecto:', error);
    return NextResponse.json(
      { error: 'Error avanzando paso del proyecto' },
      { status: 500 }
    );
  }
}

// Función para validar que un paso se puede completar
async function validateStepCompletion(projectId: string, step: number) {
  try {
    switch (step) {
      case 1:
        // Validar que hay al menos un área con conocimiento consolidado
        const { data: areas, error: areasError } = await supabase
          .from('areas')
          .select(`
            id,
            name,
            consolidated_knowledge (id)
          `)
          .eq('project_id', projectId);

        if (areasError) {
          return { isValid: false, message: 'Error validando conocimiento consolidado' };
        }

        const areasWithKnowledge = areas?.filter(area => 
          area.consolidated_knowledge && area.consolidated_knowledge.length > 0
        ) || [];

        if (areasWithKnowledge.length === 0) {
          return { isValid: false, message: 'Debe consolidar el conocimiento de al menos una área para completar el Paso 1' };
        }

        return { isValid: true, message: 'Paso 1 válido' };

      case 2:
        // Validar que hay análisis AS IS validado
        const { data: analysis, error: analysisError } = await supabase
          .from('analysis_as_is')
          .select('validated')
          .eq('project_id', projectId)
          .eq('validated', true)
          .limit(1);

        if (analysisError) {
          return { isValid: false, message: 'Error validando análisis AS IS' };
        }

        if (!analysis || analysis.length === 0) {
          return { isValid: false, message: 'Debe generar y validar el análisis AS IS para completar el Paso 2' };
        }

        return { isValid: true, message: 'Paso 2 válido' };

      case 3:
        // Validar que hay al menos una recomendación aprobada
        const { data: recommendations, error: recError } = await supabase
          .from('project_recommendations')
          .select('status')
          .eq('project_id', projectId)
          .eq('status', 'accepted')
          .limit(1);

        if (recError) {
          return { isValid: false, message: 'Error validando recomendaciones' };
        }

        if (!recommendations || recommendations.length === 0) {
          return { isValid: false, message: 'Debe aprobar al menos una recomendación para completar el Paso 3' };
        }

        return { isValid: true, message: 'Paso 3 válido' };

      case 4:
        // Validar que hay al menos una ficha de proyecto validada
        const { data: sheets, error: sheetsError } = await supabase
          .from('project_sheets')
          .select('validated')
          .eq('project_id', projectId)
          .eq('validated', true)
          .limit(1);

        if (sheetsError) {
          return { isValid: false, message: 'Error validando fichas de proyecto' };
        }

        if (!sheets || sheets.length === 0) {
          return { isValid: false, message: 'Debe validar al menos una ficha de proyecto para completar el Paso 4' };
        }

        return { isValid: true, message: 'Paso 4 válido' };

      default:
        return { isValid: false, message: 'Paso inválido' };
    }
  } catch (error) {
    console.error('Error validando paso:', error);
    return { isValid: false, message: 'Error interno validando paso' };
  }
} 