'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, hasValidSupabase } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface User {
  id: string;
  email: string;
  role: 'professor' | 'admin';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (preferredRole?: 'admin' | 'professor') => Promise<void>;
  loginLocal: (name: string, email: string, role: 'admin' | 'professor') => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  isLocalMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isLocalMode = !hasValidSupabase;

  useEffect(() => {
    if (hasValidSupabase) {
      // Use Supabase auth
      supabase.auth.getSession().then(({ data: { session } }: any) => {
        validateSession(session?.user ?? null);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
        validateSession(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      // Local mode: check localStorage for saved session
      const savedUser = localStorage.getItem('localAuthUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('localAuthUser');
        }
      }
      setLoading(false);
    }
  }, []);

  const validateSession = async (currentUser: SupabaseUser | null) => {
    if (currentUser) {
      if (currentUser.email?.endsWith('@neu.edu.ph')) {
        const preferredRole = localStorage.getItem('preferredRole');
        let role: 'professor' | 'admin' = 'professor';

        if (preferredRole === 'admin') {
          role = 'admin';
        } else {
          role = (currentUser.email.startsWith('admin') || currentUser.email === 'example@neu.edu.ph') ? 'admin' : 'professor';
        }

        setUser({
          id: currentUser.id,
          email: currentUser.email,
          role: role,
          name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0]
        });
        setError(null);
      } else {
        await supabase.auth.signOut();
        setUser(null);
        setError('Access Restricted: Only @neu.edu.ph emails are allowed.');
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const loginWithGoogle = async (preferredRole?: 'admin' | 'professor') => {
    setError(null);

    if (!hasValidSupabase) {
      setError('Supabase is not configured. Please use Local Login instead, or configure valid Supabase credentials in .env.local');
      return;
    }

    if (preferredRole) {
      localStorage.setItem('preferredRole', preferredRole);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      console.error('Login error:', error);
      setError(error.message);
    }
  };

  const loginLocal = (name: string, email: string, role: 'admin' | 'professor') => {
    setError(null);
    const localUser: User = {
      id: `local-${Date.now()}`,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@neu.edu.ph`,
      role,
      name,
    };
    setUser(localUser);
    localStorage.setItem('localAuthUser', JSON.stringify(localUser));
  };

  const logout = async () => {
    if (hasValidSupabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('localAuthUser');
    localStorage.removeItem('preferredRole');
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginLocal, logout, isAuthenticated: !!user, error, isLocalMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (undefined === context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
