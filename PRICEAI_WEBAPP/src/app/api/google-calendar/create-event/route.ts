import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/services/GoogleCalendar/GoogleCalendarService';
import { supabase } from '@/lib/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const appointmentDetails = await request.json();

    if (!appointmentDetails.userId || !appointmentDetails.appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing user ID or appointment ID',
        },
        { status: 400 }
      );
    }

    // Get user's Google Calendar tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_calendar_enabled')
      .eq('id', appointmentDetails.userId)
      .single();

    if (userError || !user?.google_calendar_enabled || !user?.google_access_token) {
      console.log('Calendar access check:', {
        userError: !!userError,
        calendarEnabled: user?.google_calendar_enabled,
        hasAccessToken: !!user?.google_access_token,
        hasRefreshToken: !!user?.google_refresh_token,
      });
      return NextResponse.json({
        success: false,
        error: 'Google Calendar not connected or enabled',
        requiresAuth: true,
      });
    }

    console.log('User calendar tokens found:', {
      userId: appointmentDetails.userId,
      hasAccessToken: !!user.google_access_token,
      hasRefreshToken: !!user.google_refresh_token,
      calendarEnabled: user.google_calendar_enabled,
    });

    // Create calendar event
    const googleCalendarService = new GoogleCalendarService();
    googleCalendarService.setAccessToken(
      user.google_access_token,
      user.google_refresh_token
    );

    // // Test calendar access first and handle token refresh
    // console.log('Testing calendar access...');
    // const accessTest = await googleCalendarService.testCalendarAccess();
    // if (!accessTest.success) {
    //   console.error('Calendar access test failed:', accessTest.error);
      
    //   // If we have a refresh token, try to refresh the access token
    //   if (user.google_refresh_token) {
    //     console.log('Attempting to refresh access token...');
    //     try {
    //       const refreshResult = await googleCalendarService.refreshAccessToken();
    //       if (refreshResult.success && refreshResult.accessToken) {
    //         // Update the user's access token in the database
    //         const { error: updateError } = await supabase
    //           .from('users')
    //           .update({
    //             google_access_token: refreshResult.accessToken,
    //             updated_at: new Date().toISOString(),
    //           })
    //           .eq('id', appointmentDetails.userId);

    //         if (updateError) {
    //           console.error('Error updating refreshed access token:', updateError);
    //         } else {
    //           console.log('Access token refreshed successfully');
    //           // Set the new token and retry
    //           googleCalendarService.setAccessToken(
    //             refreshResult.accessToken,
    //             user.google_refresh_token
    //           );
    //         }
    //       } else {
    //         console.error('Failed to refresh access token:', refreshResult.error);
    //         return NextResponse.json(
    //           {
    //             success: false,
    //             error: 'Google Calendar authentication expired. Please reconnect your Google account.',
    //             requiresReauth: true,
    //           },
    //           { status: 401 }
    //         );
    //       }
    //     } catch (refreshError) {
    //       console.error('Error during token refresh:', refreshError);
    //       return NextResponse.json(
    //         {
    //           success: false,
    //           error: 'Google Calendar authentication expired. Please reconnect your Google account.',
    //           requiresReauth: true,
    //         },
    //         { status: 401 }
    //       );
    //     }
    //   } else {
    //     // No refresh token available, user needs to re-authenticate
    //     return NextResponse.json(
    //       {
    //         success: false,
    //         error: 'Google Calendar authentication expired. Please reconnect your Google account.',
    //         requiresReauth: true,
    //       },
    //       { status: 401 }
    //     );
    //   }
    // }

    console.log('Calendar access verified, creating event...');

    let eventResult = await googleCalendarService.createAppointmentEvent(appointmentDetails);

    // Handle invalid_grant error by attempting token refresh
    if (!eventResult.success && eventResult.error && eventResult.error.includes('invalid_grant')) {
      console.log('Received invalid_grant error, attempting token refresh...');
      
      if (user.google_refresh_token) {
        try {
          const refreshResult = await googleCalendarService.refreshAccessToken();
          if (refreshResult.success && refreshResult.accessToken) {
            // Update the user's access token in the database
            const { error: updateError } = await supabase
              .from('users')
              .update({
                google_access_token: refreshResult.accessToken,
                updated_at: new Date().toISOString(),
              })
              .eq('id', appointmentDetails.userId);

            if (!updateError) {
              console.log('Access token refreshed, retrying event creation...');
              // Set the new token and retry
              googleCalendarService.setAccessToken(
                refreshResult.accessToken,
                user.google_refresh_token
              );
              
              // Retry event creation
              eventResult = await googleCalendarService.createAppointmentEvent(appointmentDetails);
            }
          }
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError);
        }
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
