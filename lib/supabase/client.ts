'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Cliente de Supabase para el lado del cliente
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Función para hacer fetch autenticado
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Obtener sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error(`Error de sesión: ${sessionError.message}`);
    }

    if (!session?.access_token) {
      console.error('No session or access token found');
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    // Headers por defecto
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    };

    // Combinar headers
    const headers = {
      ...defaultHeaders,
      ...options.headers,
    };

    // Eliminar Content-Type si es FormData
    if (options.body instanceof FormData) {
      delete (headers as any)['Content-Type'];
    }

    console.log('Making authenticated request to:', url);
    console.log('With headers:', headers);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorText;
      } catch {
        errorMessage = errorText;
      }

      console.error(`Request failed for ${url}:`, errorMessage);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    return response;
  } catch (error) {
    console.error('authenticatedFetch error:', error);
    throw error;
  }
}

// Función para obtener el usuario actual
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Función para verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Hook personalizado para usar autenticación (deprecated, usar useAuth de AuthProvider)
export function useAuth() {
  console.warn('useAuth from client.ts is deprecated. Use useAuth from AuthProvider instead.');
  return {
    user: null,
    loading: false,
    signIn: async () => {},
    signUp: async () => {},
    signOut: async () => {},
  };
} 