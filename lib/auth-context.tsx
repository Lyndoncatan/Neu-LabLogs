'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
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
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateSession(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      validateSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const validateSession = async (currentUser: SupabaseUser | null) => {
    if (currentUser) {
      if (currentUser.email?.endsWith('@neu.edu.ph')) {
        // Map Supabase user to App User
        // Defaulting to 'professor' role unless email starts with 'admin'
        // This is a simple heuristic for the demo.
        // Check for preferred role from login (for demo purposes)
        const preferredRole = localStorage.getItem('preferredRole');
        let role: 'professor' | 'admin' = 'professor';

        if (preferredRole === 'admin') {
          role = 'admin';
        } else {
          role = (currentUser.email.startsWith('admin') || currentUser.email === 'example@neu.edu.ph') ? 'admin' : 'professor';
        }

        // Clear preferred role after use so it doesn't persist forever if they switch back
        // localStorage.removeItem('preferredRole'); // Optional: keep it for session persistence

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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, isAuthenticated: !!user, error }}>
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
