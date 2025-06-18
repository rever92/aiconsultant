import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId es requerido' }, { status: 400 });
    }

    console.log('Fetching areas for project:', projectId);

    // Obtener áreas del proyecto
    const { data: areas, error } = await supabase
      .from('areas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching areas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Areas fetched successfully:', areas?.length || 0);
    return NextResponse.json(areas || []);
  } catch (error) {
    console.error('Error getting areas:', error);
    return NextResponse.json({ error: 'Error obteniendo áreas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar datos requeridos
    if (!body.name || !body.project_id) {
      return NextResponse.json({ 
        error: 'Name y project_id son requeridos' 
      }, { status: 400 });
    }

    console.log('Creating area:', body.name, 'for project:', body.project_id);

    // Crear área
    const { data: area, error } = await supabase
      .from('areas')
      .insert({
        name: body.name,
        description: body.description || null,
        color: body.color || '#3B82F6',
        project_id: body.project_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating area:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Area created successfully:', area.id);
    return NextResponse.json(area);
  } catch (error) {
    console.error('Error creating area:', error);
    return NextResponse.json({ error: 'Error creando área' }, { status: 500 });
  }
} 