'use client';

import { createContext, useContext, useState } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Mock user para desarrollo
  const [user] = useState<User | null>({
    id: 'demo-user',
    email: 'demo@demo.com'
  });
  const [loading] = useState(false);

  const signIn = async (email: string, password: string) => {
    console.log('Mock signIn:', email);
    // Mock implementation
  };

  const signUp = async (email: string, password: string) => {
    console.log('Mock signUp:', email);
    // Mock implementation
  };

  const signOut = async () => {
    console.log('Mock signOut');
    // Mock implementation
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
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