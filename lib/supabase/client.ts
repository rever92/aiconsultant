'use client';

import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

// Cliente de Supabase para el lado del cliente
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Configuración del backend MongoDB
const API_BASE = 'http://localhost:5000/api';

// Función para obtener el token del localStorage
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

// Función para hacer fetch autenticado al backend MongoDB
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    // Obtener token del localStorage
    const token = getToken();

    if (!token) {
      console.error('No token found');
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    // Determinar si la URL es para el backend MongoDB o para las APIs de Next.js
    const isMongoBackend = !url.startsWith('/api/') && !url.startsWith('http://localhost:3000/api/');
    const finalUrl = isMongoBackend ? `${API_BASE}${url}` : url;

    // Headers por defecto
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

    console.log('Making authenticated request to:', finalUrl);

    const response = await fetch(finalUrl, {
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

      console.error(`Request failed for ${finalUrl}:`, errorMessage);
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }

    return response;
  } catch (error) {
    console.error('authenticatedFetch error:', error);
    throw error;
  }
}

// Función para hacer fetch autenticado específicamente al backend MongoDB
export async function authenticatedFetchMongo(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  try {
    const token = getToken();

    if (!token) {
      console.error('No token found');
      throw new Error('No hay sesión activa. Por favor inicia sesión.');
    }

    const url = `${API_BASE}${endpoint}`;

    // Headers por defecto
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
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

    console.log('Making authenticated request to MongoDB backend:', url);

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
    console.error('authenticatedFetchMongo error:', error);
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