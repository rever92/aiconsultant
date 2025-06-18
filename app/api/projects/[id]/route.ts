import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    console.log('Fetching project:', projectId);

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID es requerido' }, { status: 400 });
    }

    // Obtener proyecto específico
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      console.error('Project not found:', error);
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    console.log('Project found:', project.name);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    return NextResponse.json({ error: 'Error obteniendo proyecto' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID es requerido' }, { status: 400 });
    }

    // Actualizar proyecto
    const { data: project, error } = await supabase
      .from('projects')
      .update({
        name: body.name,
        description: body.description,
        status: body.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'Error actualizando proyecto' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID es requerido' }, { status: 400 });
    }

    // Eliminar proyecto (CASCADE eliminará áreas, transcripciones, etc.)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Proyecto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Error eliminando proyecto' }, { status: 500 });
  }
} 