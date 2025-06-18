import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Crear cliente de Supabase
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Función para hacer peticiones autenticadas
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Por ahora, hacer fetch normal sin autenticación estricta
    // TODO: Restaurar autenticación cuando esté completamente configurada
    
    console.log('Making authenticated request to:', url);
    
    // Preparar headers sin sobrescribir Content-Type si es FormData
    const headers: Record<string, string> = {};
    
    // Solo establecer Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Añadir otros headers personalizados
    if (options.headers) {
      Object.assign(headers, options.headers);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Log del estado de respuesta para debugging
    console.log(`Response status for ${url}:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Request failed for ${url}:`, errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response;
  } catch (error) {
    console.error('authenticatedFetch error:', error);
    throw error;
  }
}

// Función auxiliar para obtener el usuario actual
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return null;
  }
}

// Función auxiliar para verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

// Hook temporal para autenticación (mock)
export function useAuth() {
  return {
    user: { id: 'demo-user', email: 'demo@demo.com' },
    loading: false,
    signOut: () => console.log('SignOut called')
  };
} 