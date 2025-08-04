'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/supabase';
import { AuthService } from '@/services/auth/AuthService';

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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        ////console.log("Checking session on AuthContext mount:", session);

        // Check for session, access token, and refresh token validity
        if (sessionError || !session || !session.access_token || !session.refresh_token) {
     

          await supabase.auth.signOut();
          //console.log("Invalid session detected, signing out...");

          setUser(null);
          setLoading(false);
          return;
        }

        // Session is valid, proceed with user validation
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError) {
          console.error("Session check - Error getting user:", userError);
          setUser(null);
        } else if (userData?.user) {
          // Process the existing session
          //console.log("Valid user session found:", userData.user.id);
          await AuthService.handleUserSession(session);
          setUser(userData.user);
        } else {
          setUser(null);
        }

        setLoading(false);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            // console.log("Auth state changed - Event:", event);

            if (session?.user) {
              // console.log("Auth state changed - Processing user session:", session.user.id);

              // Process user session and update database on every login/session change
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await AuthService.handleUserSession(session);
              }

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
      // // console.log("Signing out user");
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Error signing out:", error);
        throw error;
      }

      // // console.log("User signed out successfully");
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