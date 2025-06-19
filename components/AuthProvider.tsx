'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// Cliente de Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'consultor';
  created_at: string;
  updated_at: string;
}

interface User extends SupabaseUser {
  profile?: UserProfile;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAdmin: () => boolean;
  isConsultor: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar perfil de usuario
  const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('🔍 loadUserProfile: Intentando cargar perfil para userId:', userId);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ loadUserProfile: Error loading user profile:', error);
        console.error('❌ loadUserProfile: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        return null;
      }

      console.log('✅ loadUserProfile: Perfil cargado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ loadUserProfile: Exception loading user profile:', error);
      return null;
    }
  };

  // Refrescar perfil del usuario actual
  const refreshProfile = async () => {
    if (!user?.id) return;
    
    const userProfile = await loadUserProfile(user.id);
    setProfile(userProfile);
    
    if (userProfile && user) {
      setUser({ ...user, profile: userProfile });
    }
  };

  // Manejar cambios de sesión
  const handleAuthStateChange = async (event: string, session: Session | null) => {
    console.log('🔄 handleAuthStateChange: Evento:', event, 'Session:', !!session);
    
    setSession(session);
    
    if (session?.user) {
      console.log('👤 handleAuthStateChange: Usuario encontrado en sesión:', session.user.id);
      console.log('📧 handleAuthStateChange: Email del usuario:', session.user.email);
      
      const userProfile = await loadUserProfile(session.user.id);
      const userWithProfile = { ...session.user, profile: userProfile || undefined };
      
      console.log('🔗 handleAuthStateChange: Usuario con perfil configurado:', {
        hasUser: !!userWithProfile,
        hasProfile: !!userProfile,
        userId: userWithProfile.id,
        profileRole: userProfile?.role
      });
      
      setUser(userWithProfile);
      setProfile(userProfile);
    } else {
      console.log('🚫 handleAuthStateChange: No hay sesión, limpiando estado');
      setUser(null);
      setProfile(null);
    }
    
    console.log('✅ handleAuthStateChange: Finalizando, setLoading(false)');
    setLoading(false);
  };

  // Configurar listener de autenticación
  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthStateChange('INITIAL_SESSION', session);
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription?.unsubscribe();
  }, []);

  // Función de login
  const signIn = async (email: string, password: string) => {
    console.log('🚀 signIn: Iniciando login para email:', email);
    setLoading(true);
    
    try {
      console.log('🔐 signIn: Llamando a supabase.auth.signInWithPassword...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('📥 signIn: Respuesta de Supabase:', {
        hasData: !!data,
        hasError: !!error,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        errorMessage: error?.message
      });

      if (error) {
        console.error('❌ signIn: Error de Supabase:', error);
        throw new Error(error.message);
      }

      if (!data.session) {
        console.error('❌ signIn: No se recibió sesión en la respuesta');
        throw new Error('No se pudo iniciar sesión');
      }

      console.log('✅ signIn: Login exitoso, esperando handleAuthStateChange...');
      // El handleAuthStateChange se encargará de cargar el perfil
    } catch (error) {
      console.error('❌ signIn: Exception en signIn:', error);
      setLoading(false);
      throw error;
    }
  };

  // Función de registro
  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('Error en el registro');
      }

      // Si el usuario se creó exitosamente pero necesita confirmación de email
      if (!data.session) {
        throw new Error('Revisa tu email para confirmar tu cuenta antes de iniciar sesión.');
      }

    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  // Función de logout
  const signOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      // Limpiar estado local
      setUser(null);
      setProfile(null);
      setSession(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario es admin
  const isAdmin = (): boolean => {
    return profile?.role === 'admin';
  };

  // Verificar si el usuario es consultor
  const isConsultor = (): boolean => {
    return profile?.role === 'consultor';
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