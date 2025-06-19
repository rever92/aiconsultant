import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId es requerido' }, { status: 400 });
    }

    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const supabase = createServerSupabaseClient();

    // Verificar permisos del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Verificar permisos: admin, dueño o con permisos
    const isAdmin = user.profile?.role === 'admin';
    const isOwner = project.user_id === user.id;

    let hasPermission = false;
    if (!isAdmin && !isOwner) {
      const { data: permissions } = await supabase
        .from('project_permissions')
        .select('permission_type')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      hasPermission = !!permissions;
    }

    if (!isAdmin && !isOwner && !hasPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para ver este proyecto' },
        { status: 403 }
      );
    }

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

    return NextResponse.json(areas || []);
  } catch (error) {
    console.error('Error en GET /api/areas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await requireAuth(request);
    if (authResult.error || !authResult.user) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const user = authResult.user;
    const supabase = createServerSupabaseClient();

    const body = await request.json();
    const { name, description, color, projectId } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Nombre y projectId son requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos del proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, user_id, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }

    // Verificar permisos de edición
    const isAdmin = user.profile?.role === 'admin';
    const isOwner = project.user_id === user.id;

    let hasEditPermission = false;
    if (!isAdmin && !isOwner) {
      const { data: permissions } = await supabase
        .from('project_permissions')
        .select('permission_type')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .in('permission_type', ['edit', 'admin'])
        .maybeSingle();

      hasEditPermission = !!permissions;
    }

    if (!isAdmin && !isOwner && !hasEditPermission) {
      return NextResponse.json(
        { error: 'No tienes permisos para crear áreas en este proyecto' },
        { status: 403 }
      );
    }

    // Crear área
    const { data: area, error: insertError } = await supabase
      .from('areas')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        project_id: projectId
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando área:', insertError);
      return NextResponse.json({ error: 'Error creando área' }, { status: 500 });
    }

    console.log('Área creada exitosamente:', area.id);
    return NextResponse.json(area);
  } catch (error) {
    console.error('Error en POST /api/areas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 