import { NextRequest, NextResponse } from 'next/server';
import GoogleCalendarService from '@/services/GoogleCalendar/GoogleCalendarService';
import { supabase } from '@/lib/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, appointmentId } = await request.json();
    
    if (!userId || !appointmentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId or appointmentId',
      }, { status: 400 });
    }

    // Get appointment to find event ID
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('google_calendar_event_id')
      .eq('appointment_id', appointmentId)
      .single();

    if (appointmentError || !appointment?.google_calendar_event_id) {
      return NextResponse.json({
        success: false,
        error: 'No calendar event found for this appointment',
      }, { status: 404 });
    }

    // Get user's Google Calendar tokens
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('google_access_token, google_refresh_token, google_calendar_enabled')
      .eq('id', userId)
      .single();

    if (userError || !user?.google_calendar_enabled || !user?.google_access_token) {
      return NextResponse.json({
        success: false,
        error: 'Google Calendar not connected or enabled',
      }, { status: 401 });
    }

    // Initialize calendar service
    const googleCalendarService = new GoogleCalendarService();
    googleCalendarService.setAccessToken(user.google_access_token, user.google_refresh_token);

    // Try to delete the event
    const deleteResult = await googleCalendarService.deleteEvent(appointment.google_calendar_event_id);
    
    if (!deleteResult.success) {
      return NextResponse.json({
        success: false,
        error: deleteResult.error || 'Failed to delete calendar event',
      }, { status: 500 });
    }

    // Clear the event ID from the appointment record
    await supabase
      .from('appointments')
      .update({
        google_calendar_event_id: null,
        google_calendar_event_link: null,
        updated_at: new Date().toISOString(),
      })
      .eq('appointment_id', appointmentId);

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
