'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the current session after OAuth callback
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setError(`Authentication failed: ${sessionError.message}`);
          setTimeout(() => router.replace('/auth/login'), 2000);
          return;
        }

        console.log("Session data after OAuth callback:", sessionData);

        const user = sessionData?.session?.user;
        const providerToken = sessionData?.session?.provider_token;
        const providerRefreshToken = sessionData?.session?.refresh_token;
        
        if (!user) {
          console.error('No user found in session');
          setError('Authentication failed: No user found');
          setTimeout(() => router.replace('/auth/login'), 2000);
          return;
        }

        console.log('Authentication successful for user:', user.id);

        // Store Google Calendar tokens if available
        if (providerToken) {
          console.log('Storing Google Calendar tokens...');
          try {
            const { error: updateError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
                google_access_token: providerToken,
                google_refresh_token: providerRefreshToken,
                google_calendar_enabled: true,
                updated_at: new Date().toISOString(),
              });

            if (updateError) {
              console.error('Error storing Google Calendar tokens:', updateError);
              // Don't fail the login if we can't store calendar tokens
            } else {
              console.log('Google Calendar automatically connected!');
            }
          } catch (calendarError) {
            console.error('Failed to store calendar tokens:', calendarError);
            // Don't fail the login if calendar setup fails
          }
        } else {
          // Still create/update user record without calendar tokens
          try {
            const { error: updateError } = await supabase
              .from('users')
              .upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
                updated_at: new Date().toISOString(),
              });

            if (updateError) {
              console.error('Error updating user record:', updateError);
            }
          } catch (userError) {
            console.error('Failed to update user record:', userError);
          }
        }

        // Redirect to home page
        router.replace('/');
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setError(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setTimeout(() => router.replace('/auth/login'), 2000);
      }
    };
    
    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-priceai-blue to-priceai-lightgreen animate-fade-in">
      <div className="bg-white/90 p-10 rounded-priceai shadow-glass w-full max-w-md flex flex-col items-center border border-priceai-blue">
        {error ? (
          <>
            <svg className="w-20 h-20 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-lg font-semibold text-red-600 mb-2">Authentication Error</div>
            <div className="text-sm text-priceai-gray text-center">{error}</div>
            <div className="mt-4 text-sm text-priceai-gray text-center">Redirecting you back to login...</div>
          </>
        ) : (
          <>
            <svg className="w-20 h-20" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
            </svg>
            <div className="text-lg font-semibold text-priceai-dark mb-2">Signing you in...</div>
            <div className="text-sm text-priceai-gray text-center">Please wait while we complete your sign in process.</div>
          </>
        )}
      </div>
    </div>
  );
}
