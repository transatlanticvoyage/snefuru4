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
    // Check active sessions and sets the user
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        
        // Fetch is_admin status if user is logged in
        if (session?.user) {
          try {
            const { data: userData, error } = await supabase
              .from('users')
              .select('is_admin')
              .eq('auth_id', session.user.id)
              .single();
            
            if (!error && userData && userData.is_admin !== undefined) {
              setIsAdmin(userData.is_admin || false);
            } else {
              // Column doesn't exist yet or user not found - default to false
              setIsAdmin(false);
            }
          } catch (error) {
            // If there's any error (like column not existing), default to false
            console.warn('Could not fetch admin status (column may not exist yet):', error);
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      
      // Fetch is_admin status when auth state changes
      if (session?.user) {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('auth_id', session.user.id)
            .single();
          
          if (!error && userData && userData.is_admin !== undefined) {
            setIsAdmin(userData.is_admin || false);
          } else {
            // Column doesn't exist yet or user not found - default to false
            setIsAdmin(false);
          }
        } catch (error) {
          // If there's any error (like column not existing), default to false
          console.warn('Could not fetch admin status (column may not exist yet):', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
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
      try {
        const insertData: any = {
          auth_id: data.user.id,
          email: data.user.email,
          created_at: new Date().toISOString(),
        };
        
        // Only add is_admin if the column exists (after migration)
        try {
          // Test if is_admin column exists by trying to select it
          await supabase
            .from('users')
            .select('is_admin')
            .limit(1);
          
          // If no error, column exists, so include it
          insertData.is_admin = false;
        } catch (columnError) {
          // Column doesn't exist yet, skip it
          console.warn('is_admin column not yet available, skipping');
        }
        
        const { error: userError } = await supabase
          .from('users')
          .insert(insertData);
        
        if (userError) {
          console.error('Error creating user record:', userError);
          throw new Error('Failed to create user record');
        }
      } catch (error) {
        console.error('Error in user record creation:', error);
        // Don't throw here as this might be due to the column not existing yet
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Fetch is_admin status after successful sign in
    if (data.user) {
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('auth_id', data.user.id)
          .single();
        
        if (!userError && userData && userData.is_admin !== undefined) {
          setIsAdmin(userData.is_admin || false);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.warn('Could not fetch admin status on sign in:', error);
        setIsAdmin(false);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setIsAdmin(false);
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