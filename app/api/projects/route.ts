import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching projects...');

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Projects fetched successfully:', projects?.length || 0);
    return NextResponse.json(projects || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Creating project with data:', body);

    // Validar datos requeridos
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        description: body.description || null,
        status: 'DRAFT',
        user_id: 'demo-user', // Usar ID temporal por ahora
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Crear área "Global" automáticamente
    const { error: areaError } = await supabase
      .from('areas')
      .insert({
        name: 'Global',
        description: 'Conocimiento general del proyecto',
        color: '#6B7280',
        project_id: project.id
      });

    if (areaError) {
      console.warn('Warning: Could not create Global area:', areaError);
      // No fallar la creación del proyecto por esto
    }

    console.log('Project created successfully with Global area:', project.id);
    return NextResponse.json(project);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 