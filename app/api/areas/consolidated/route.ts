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

    console.log('Fetching consolidated knowledge for project:', projectId);

    // Obtener conocimiento consolidado por área para el proyecto
    const { data: consolidatedKnowledge, error } = await supabase
      .from('consolidated_knowledge')
      .select(`
        *,
        areas!inner (
          id,
          name,
          color,
          project_id
        )
      `)
      .eq('areas.project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching consolidated knowledge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Consolidated knowledge fetched successfully:', consolidatedKnowledge?.length || 0);
    return NextResponse.json(consolidatedKnowledge || []);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 