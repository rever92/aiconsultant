import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '../types/database';

export function createServerSupabaseClient(useServiceRole = false) {
  const cookieStore = cookies();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = useServiceRole 
    ? process.env.SUPABASE_SERVICE_ROLE_KEY! 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // El set de cookies puede fallar en algunos contextos
            console.warn('Failed to set cookie:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // El remove de cookies puede fallar en algunos contextos
            console.warn('Failed to remove cookie:', error);
          }
        },
      },
    }
  );
}

// Función alternativa más robusta para APIs
export async function getAuthenticatedUser(request?: Request) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Si hay request, intentar obtener el token del header Authorization
    if (request) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user && !error) {
          return { user, error: null };
        }
      }
    }
    
    // Fallback: usar cookies
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    console.error('Error getting authenticated user:', error);
    return { user: null, error };
  }
} 