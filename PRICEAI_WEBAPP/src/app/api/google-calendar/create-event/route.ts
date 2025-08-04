import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/services/GoogleCalendar/GoogleCalendarService';
import { createClient } from '@/lib/supabase/server';
import { supabase } from '../../../../lib/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const appointmentDetails = await request.json();

    const supabase = await createClient();

    if (!appointmentDetails.userId || !appointmentDetails.appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing user ID or appointment ID',
        },
        { status: 400 }
      );
    }

    // Get user's session to access Google Calendar tokens
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    console.log("Session data on create event:", session);

    if (sessionError || !session || !session.access_token || !session.refresh_token) {
      console.log('Calendar access check:', {
        sessionError: sessionError,
        hasSession: session,
        hasAccessToken: session?.access_token,
        hasRefreshToken: session?.refresh_token,
      });
      return NextResponse.json({
        success: false,
        error: 'Google Calendar not connected or session expired',
        requiresAuth: true,
      });
    }

    console.log('User calendar tokens found from session:', {
      userId: appointmentDetails.userId,
      hasAccessToken: !!session.access_token,
      hasRefreshToken: !!session.refresh_token,
    });

    // Create calendar event
    const googleCalendarService = new GoogleCalendarService();
    googleCalendarService.setAccessToken(
      session.access_token,
      session.refresh_token
    );

    let eventResult = await googleCalendarService.createAppointmentEvent(appointmentDetails);

    // Handle invalid_grant error by attempting token refresh
    if (!eventResult.success && eventResult.error && (eventResult.error.includes('invalid_grant') || eventResult.error.includes('invalid credential'))) {
      console.log('Received invalid token error, attempting token refresh...');
      
      try {
        const refreshResult = await googleCalendarService.refreshAccessToken();
        if (refreshResult.success && refreshResult.accessToken) {
          console.log('Access token refreshed, retrying event creation...');
          
          // Set the new token and retry
          googleCalendarService.setAccessToken(
            refreshResult.accessToken,
            session.refresh_token
          );
          
          // Retry event creation
          eventResult = await googleCalendarService.createAppointmentEvent(appointmentDetails);
        } else {
          console.error('Failed to refresh access token:', refreshResult.error);
          return NextResponse.json(
            {
              success: false,
              error: 'Google Calendar authentication expired. Please reconnect your Google account.',
              requiresReauth: true,
            },
            { status: 401 }
          );
        }
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError);
        return NextResponse.json(
          {
            success: false,
            error: 'Google Calendar authentication expired. Please reconnect your Google account.',
            requiresReauth: true,
          },
          { status: 401 }
        );
      }
    }

    if (!eventResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: eventResult.error,
        },
        { status: 500 }
      );
    }

    // Store Google Calendar event ID in appointment record
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        google_calendar_event_id: eventResult.eventId,
        google_calendar_event_link: eventResult.eventLink,
        updated_at: new Date().toISOString(),
      })
      .eq('appointment_id', appointmentDetails.appointmentId);

    if (updateError) {
      console.error('Error updating appointment with calendar event ID:', updateError);
      // Don't fail the request if we can't store the event ID
    }

    return NextResponse.json({
      success: true,
      eventId: eventResult.eventId,
      eventLink: eventResult.eventLink,
      message: 'Calendar event created successfully',
    });
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create calendar event',
      },
      { status: 500 }
    );
  }
}
