import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching projects...');

    // Obtener usuario autenticado
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Usar service role para bypassar RLS
    const supabase = createServerSupabaseClient(true); // true = usar service role
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
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
    console.log('🚀 POST /api/projects - Iniciando...');
    
    // Obtener usuario autenticado
    const user = await getAuthenticatedUser(request);
    console.log('👤 Usuario obtenido:', {
      user: user ? {
        id: user.id,
        email: user.email,
        aud: user.aud
      } : null
    });
    
    if (!user) {
      console.log('❌ No hay usuario autenticado');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('📥 Body recibido:', body);
    console.log('🔑 User ID que se va a usar:', user.id);

    // Validar datos requeridos
    if (!body.name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Usar service role para bypassar RLS en operaciones del servidor
    const supabase = createServerSupabaseClient(true); // true = usar service role
    
    const projectData = {
      name: body.name,
      description: body.description || null,
      status: 'DRAFT' as const,
      user_id: user.id,
    };
    
    console.log('📝 Datos del proyecto a insertar:', projectData);
    
    const { data: project, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando proyecto:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('✅ Proyecto creado exitosamente:', project);

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
      console.warn('⚠️ Warning: Could not create Global area:', areaError);
      // No fallar la creación del proyecto por esto
    }

    console.log('🎉 Project created successfully with Global area:', project.id);
    return NextResponse.json(project);
  } catch (error) {
    console.error('💥 API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 