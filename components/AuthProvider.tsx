'use client';

import { createContext, useContext, useState, useEffect } from 'react';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'consultor';
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'consultor';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isConsultor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuración del backend
const API_BASE = 'http://localhost:5000/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener el token del localStorage
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  // Función para guardar el token en localStorage
  const saveToken = (token: string, refreshToken?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  };

  // Función para limpiar tokens
  const clearTokens = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  // Función para hacer peticiones autenticadas
  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    };

    return fetch(url, config);
  };

  // Cargar perfil de usuario
  const loadUserProfile = async (): Promise<User | null> => {
    try {
      console.log('🔍 loadUserProfile: Cargando perfil de usuario...');
      
      const response = await authenticatedFetch(`${API_BASE}/auth/me`);

      if (!response.ok) {
        if (response.status === 401) {
          // Token inválido, limpiar y logout
          clearTokens();
          setUser(null);
          setProfile(null);
          setSession(null);
          return null;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ loadUserProfile: Perfil cargado exitosamente:', data.user);
      return data.user;
    } catch (error) {
      console.error('❌ loadUserProfile: Error loading user profile:', error);
      return null;
    }
  };

  // Refrescar perfil del usuario actual
  const refreshProfile = async () => {
    const userProfile = await loadUserProfile();
    if (userProfile) {
      setUser(userProfile);
      setProfile(userProfile);
      setSession({ user: userProfile });
    }
  };

  // Verificar autenticación al cargar
  useEffect(() => {
    const initAuth = async () => {
      console.log('🔄 AuthProvider: Inicializando autenticación...');
      
      const token = getToken();
      if (!token) {
        console.log('🚫 AuthProvider: No hay token, usuario no autenticado');
        setLoading(false);
        return;
      }

      console.log('🔍 AuthProvider: Token encontrado, verificando validez...');
      const userProfile = await loadUserProfile();
      
      if (userProfile) {
        console.log('✅ AuthProvider: Usuario autenticado correctamente');
        setUser(userProfile);
        setProfile(userProfile);
        setSession({ user: userProfile });
      } else {
        console.log('❌ AuthProvider: Token inválido, limpiando sesión');
        clearTokens();
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Función de login
  const signIn = async (email: string, password: string) => {
    console.log('🚀 signIn: Iniciando login para email:', email);
    setLoading(true);
    
    try {
      console.log('🔐 signIn: Enviando credenciales al backend...');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      console.log('📥 signIn: Respuesta del backend:', {
        ok: response.ok,
        status: response.status,
        hasData: !!data,
        hasUser: !!data.user,
        hasToken: !!data.token
      });

      if (!response.ok) {
        if (response.status === 403 && data.code === 'PENDING_APPROVAL') {
          // Error específico para usuarios pendientes de aprobación
          throw new Error(data.error);
        }
        throw new Error(data.error || 'Error de conexión');
      }

      if (!data.token || !data.user) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Guardar tokens
      saveToken(data.token, data.refreshToken);

      // Actualizar estado
      setUser(data.user);
      setProfile(data.user);
      setSession({ user: data.user });

      console.log('✅ signIn: Login exitoso');
    } catch (error) {
      console.error('❌ signIn: Error en login:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      // Si requiere aprobación, no hacer auto-login
      if (data.requiresApproval) {
        // El usuario se registró exitosamente pero necesita aprobación
        // No guardamos tokens ni actualizamos estado
        return;
      }

      // Auto-login después del registro exitoso (solo si está aprobado)
      if (data.token && data.user) {
        saveToken(data.token, data.refreshToken);
        setUser(data.user);
        setProfile(data.user);
        setSession({ user: data.user });
      }

    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Función de logout
  const signOut = async () => {
    setLoading(true);
    
    try {
      // Intentar logout en el backend
      const token = getToken();
      if (token) {
        await authenticatedFetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Error en logout del backend:', error);
      // Continuar con logout local aunque falle el backend
    } finally {
      // Limpiar estado local siempre
      clearTokens();
      setUser(null);
      setProfile(null);
      setSession(null);
      setLoading(false);
    }
  };

  // Verificar si el usuario es admin
  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  // Verificar si el usuario es consultor
  const isConsultor = (): boolean => {
    return user?.role === 'consultor';
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    isAdmin,
    isConsultor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 