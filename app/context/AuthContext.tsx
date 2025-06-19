'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Simple admin check - if user exists, check their admin status
        if (session?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('is_admin')
              .eq('auth_id', session.user.id)
              .single();
            
            if (!error && userData && userData.is_admin === true) {
              setIsAdmin(true);
            }
          } catch (err) {
            // Silently fail admin check
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(false);
      
      // Check admin status for new session
      if (session?.user) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('auth_id', session.user.id)
            .single();
          
          if (!error && userData && userData.is_admin === true) {
            setIsAdmin(true);
          }
        } catch (err) {
          // Silently fail admin check
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) throw error;

    // Create a record in the users table
    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          auth_id: data.user.id,
          email: data.user.email,
          is_admin: false,
          created_at: new Date().toISOString(),
        });
      
      if (userError) {
        console.error('Error creating user record:', userError);
        throw new Error('Failed to create user record');
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsAdmin(false); // Reset admin status on logout
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 