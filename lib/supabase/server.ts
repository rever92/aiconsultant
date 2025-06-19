import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { Database } from '../types/database';

// Crear cliente de Supabase para el servidor
export function createServerSupabaseClient(useServiceRole = false) {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  const client = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  return client;
}

// Función para obtener el usuario autenticado en el servidor
export async function getAuthenticatedUser(request?: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Si es una Request de Next.js, obtener el token del header Authorization
    if (request) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error) {
          console.error('Error de autenticación:', error);
          return null;
        }
        
        return user;
      }
    }

    // Fallback: obtener usuario de la sesión normal
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error obteniendo usuario:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error en getAuthenticatedUser:', error);
    return null;
  }
}

// Función para obtener el perfil de usuario con rol
export async function getUserProfile(userId: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en getUserProfile:', error);
    return null;
  }
}

// Función para verificar si un usuario puede editar un proyecto
export async function canUserEditProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Usar la función SQL que creamos
    const { data, error } = await supabase.rpc('can_edit_project', {
      project_uuid: projectId,
      user_uuid: userId
    });
    
    if (error) {
      console.error('Error verificando permisos de edición:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error en canUserEditProject:', error);
    return false;
  }
}

// Función para verificar si un usuario puede ver un proyecto
export async function canUserViewProject(userId: string, projectId: string): Promise<boolean> {
  try {
    const supabase = createServerSupabaseClient();
    
    // Usar la función SQL que creamos
    const { data, error } = await supabase.rpc('can_view_project', {
      project_uuid: projectId,
      user_uuid: userId
    });
    
    if (error) {
      console.error('Error verificando permisos de visualización:', error);
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Error en canUserViewProject:', error);
    return false;
  }
}

// Función para verificar si un usuario es admin
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId);
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Error verificando si es admin:', error);
    return false;
  }
}

// Middleware de autenticación para APIs
export async function requireAuth(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  
  if (!user) {
    return {
      error: 'No autorizado',
      status: 401,
      user: null
    };
  }

  const profile = await getUserProfile(user.id);
  
  return {
    error: null,
    status: 200,
    user: { ...user, profile }
  };
}

// Middleware para verificar permisos de proyecto
export async function requireProjectAccess(request: NextRequest, projectId: string, requireEdit = false) {
  const authResult = await requireAuth(request);
  
  if (authResult.error || !authResult.user) {
    return authResult;
  }

  const userId = authResult.user.id;
  const hasAccess = requireEdit 
    ? await canUserEditProject(userId, projectId)
    : await canUserViewProject(userId, projectId);

  if (!hasAccess) {
    return {
      error: 'No tienes permisos para acceder a este proyecto',
      status: 403,
      user: null
    };
  }

  return {
    error: null,
    status: 200,
    user: authResult.user
  };
} 