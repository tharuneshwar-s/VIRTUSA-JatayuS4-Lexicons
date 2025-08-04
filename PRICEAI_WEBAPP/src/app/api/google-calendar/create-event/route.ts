import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/services/GoogleCalendar/GoogleCalendarService';
import { createClient } from '@/lib/supabase/server';

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

    // Fetch user's Google Calendar tokens from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_calendar_enabled')
      .eq('id', appointmentDetails.userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch user Google Calendar credentials',
        },
        { status: 500 }
      );
    }

    if (!userData.google_access_token || !userData.google_refresh_token) {
      // console.log('User does not have Google Calendar tokens stored');
      return NextResponse.json(
        {
          success: false,
          error: 'Google Calendar not connected. Please connect your Google account first.',
          requiresReauth: true,
        },
        { status: 401 }
      );
    }


    // Create calendar event
    const googleCalendarService = new GoogleCalendarService();
    googleCalendarService.setAccessToken(
      userData.google_access_token,
      userData.google_refresh_token
    );

    let eventResult = await googleCalendarService.createAppointmentEvent(appointmentDetails);

    // Handle invalid_grant error by attempting token refresh
    if (!eventResult.success && eventResult.error && (eventResult.error.includes('invalid_grant') || eventResult.error.includes('invalid credential'))) {
      // console.log('\n\n\nReceived invalid token error, attempting token refresh...');
      
      try {
        const refreshResult = await googleCalendarService.refreshAccessToken();

        // console.log('Token refresh result:', refreshResult);
        if (refreshResult.success && refreshResult.accessToken) {
          // console.log('Access token refreshed, retrying event creation...');
          
          // Update the new tokens in the database
          const { error: updateTokenError } = await supabase
            .from('users')
            .update({
              google_access_token: refreshResult.accessToken,
              google_refresh_token: refreshResult.refreshToken || userData.google_refresh_token,
              updated_at: new Date().toISOString()
            })
            .eq('id', appointmentDetails.userId);

          if (updateTokenError) {
            console.error('Error updating tokens in database:', updateTokenError);
          } else {
            // console.log('Tokens updated successfully in database');
          }
          
          // Set the new token and retry
          googleCalendarService.setAccessToken(
            refreshResult.accessToken,
            refreshResult.refreshToken || userData.google_refresh_token
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