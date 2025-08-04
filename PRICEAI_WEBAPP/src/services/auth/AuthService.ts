import { supabase } from "@/lib/supabase/supabase";
import { User, Session } from "@supabase/supabase-js";

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
      const providerToken = session.provider_token;
      const providerRefreshToken = session.refresh_token;

      if (!user) {
        console.error("No user found in session");
        return {
          success: false,
          error: "No user found in session",
        };
      }
      // Store Google Calendar tokens if available
      if (providerToken) {
        // console.log("Storing Google Calendar tokens...");
        try {
          // check if user already exists in the database
          const { data: existingUser, error: existingUserError } =
            await supabase.from("users").select("*").eq("id", user.id).single();

          if (existingUserError) {
            console.error("Error checking existing user:", existingUserError);
          }

          if (existingUser) {
            // console.log("User already exists, updating tokens...");

            const { error: updateError } = await supabase
              .from("users")
              .update({
                google_access_token: providerToken,
                google_refresh_token: providerRefreshToken,
                google_calendar_enabled: true,
              })
              .eq("id", user.id);
          } else {
            const { error: updateError } = await supabase
              .from("users")
              .upsert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.user_metadata?.name,
                avatar_url: user.user_metadata?.avatar_url,
                google_access_token: providerToken,
                google_refresh_token: providerRefreshToken,
                google_calendar_enabled: true,
              })
              .eq("id", user.id);
            if (updateError) {
              console.error(
                "Error storing Google Calendar tokens:",
                updateError
              );
            }
          }
        } catch (calendarError) {
          console.error("Failed to store calendar tokens:", calendarError);
          // Don't fail the login if calendar setup fails
        }
      } else {
        // Still create/update user record without calendar tokens
        try {
          const { error: updateError } = await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            updated_at: new Date().toISOString(),
          });

          if (updateError) {
            console.error("Error updating user record:", updateError);
          } else {
            // console.log('User record updated successfully');
          }
        } catch (userError) {
          console.error("Failed to update user record:", userError);
        }
      }

      return {
        success: true,
        user: user,
      };
    } catch (error) {
      console.error("Unexpected error in handleUserSession:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Gets the current session and processes it
   */
  static async getCurrentSessionAndProcess(): Promise<AuthServiceResult> {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return {
          success: false,
          error: `Authentication failed: ${sessionError.message}`,
        };
      }

      if (!sessionData.session) {
        return {
          success: false,
          error: "No active session found",
        };
      }

      return await AuthService.handleUserSession(sessionData.session);
    } catch (error) {
      console.error("Unexpected error in getCurrentSessionAndProcess:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
