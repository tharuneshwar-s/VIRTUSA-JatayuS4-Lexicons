import { supabase } from '@/lib/supabase/supabase';
import { User, Session } from '@supabase/supabase-js';

export interface AuthServiceResult {
  success: boolean;
  error?: string;
  user?: User;
}

export class AuthService {
  /**
   * Handles user session and database synchronization after authentication
   * This function should be called on every successful login/session establishment
   */
  static async handleUserSession(session: Session): Promise<AuthServiceResult> {
    try {
      const user = session.user;
      const providerToken = session.access_token;
      const providerRefreshToken = session.refresh_token;

      if (!user) {
        console.error('No user found in session');
        return {
          success: false,
          error: 'No user found in session'
        };
      }

      // console.log('Processing user session for user:', user.id);

      // Store Google Calendar tokens if available
      if (providerToken) {
        // console.log('Storing Google Calendar tokens...');
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
            // console.log('Google Calendar automatically connected!');
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
          } else {
            // console.log('User record updated successfully');
          }
        } catch (userError) {
          console.error('Failed to update user record:', userError);
        }
      }

      return {
        success: true,
        user: user
      };
    } catch (error) {
      console.error('Unexpected error in handleUserSession:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets the current session and processes it
   */
  static async getCurrentSessionAndProcess(): Promise<AuthServiceResult> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return {
          success: false,
          error: `Authentication failed: ${sessionError.message}`
        };
      }

      if (!sessionData.session) {
        return {
          success: false,
          error: 'No active session found'
        };
      }

      return await AuthService.handleUserSession(sessionData.session);
    } catch (error) {
      console.error('Unexpected error in getCurrentSessionAndProcess:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validates and refreshes tokens if needed
   */
  static async validateAndRefreshTokens(user: User): Promise<void> {
    try {
      // Check if we have Google tokens that might need refreshing
      const { data: userData, error } = await supabase
        .from('users')
        .select('google_access_token, google_refresh_token, google_calendar_enabled')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user data for token validation:', error);
        return;
      }

      if (userData?.google_access_token && userData?.google_calendar_enabled) {
        // You can add token validation logic here if needed
        // console.log('Google Calendar tokens are available for user:', user.id);
      }
    } catch (error) {
      console.error('Error validating tokens:', error);
    }
  }
}
