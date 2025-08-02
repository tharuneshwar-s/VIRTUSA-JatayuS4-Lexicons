'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/supabase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                
        if (sessionError) {
          console.error("Session check - Error getting session:", sessionError);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
                    
          if (userError) {
            console.error("Session check - Error getting user:", userError);
            setUser(null);
          } else if (userData?.user) {
            setUser(userData.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setLoading(false);
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            // console.log("Auth state changed - Event:", event);
            // console.log("Auth state changed - Session:", session);
            
            if (session?.user) {
              // console.log("Auth state changed - Setting user:", session.user);
              setUser(session.user);
            } else {
              // console.log("Auth state changed - Clearing user");
              setUser(null);
            }
          }
        );
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Unexpected error checking session:", error);
        setUser(null);
        setLoading(false);
      }
    };
    
    checkSession();
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      // console.log("Signing out user");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }
      
      // console.log("User signed out successfully");
      setUser(null);
    } catch (error) {
      console.error("Unexpected error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
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