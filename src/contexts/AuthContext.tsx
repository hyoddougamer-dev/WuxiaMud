// ============================================
// AUTH CONTEXT - 凌云道 (Língyún Dào)
// Global authentication state management
// ============================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, UserProfile } from '../services/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Carrega sessão ao iniciar
  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // Timeout de 5 segundos para evitar ficar preso
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as { data: { session: Session | null } };
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          loadUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Em caso de erro, continua sem sessão (mostra login)
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    initAuth();

    // Escuta mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Carrega perfil do utilizador
  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Login
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message };
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to sign in' };
    }
  };

  // Registo
  const signUp = async (email: string, password: string, username: string) => {
    try {
      // 1. Cria conta
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          }
        }
      });

      if (error) return { error: error.message };

      // Profile is automatically created by database trigger (handle_new_user)
      // Character slots are created when user creates characters

      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to sign up' };
    }
  };

  // Logout
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Recuperar password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) return { error: error.message };
      return {};
    } catch (error: any) {
      return { error: error.message || 'Failed to reset password' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
