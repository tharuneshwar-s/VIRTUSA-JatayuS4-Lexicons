import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/supabase';
import GoogleCalendarService from '@/services/GoogleCalendar/GoogleCalendarService';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    // 1. Get the appointment details before cancelling
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        provider:providers(provider_name, provider_address, provider_phone),
        service:services(service_name),
        user:users(google_access_token, google_refresh_token)
      `)
      .eq('appointment_id', appointmentId)
      .single();


    if (fetchError || !appointment) {
      console.error('Error fetching appointment details:', fetchError);
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // 2. Update appointment status in Supabase
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('appointment_id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment status:', updateError);
      return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 });
    }

    // 3. Delete Google Calendar event
    if (appointment.google_calendar_event_id) {
      const googleCalendarService = new GoogleCalendarService();

      if (appointment.user.google_access_token && appointment.user.google_refresh_token) {
        googleCalendarService.setAccessToken(appointment.user.google_access_token, appointment.user.google_refresh_token);
        await googleCalendarService.deleteEvent(appointment.google_calendar_event_id);
      }
    }

    // 4. Send cancellation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-cancellation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointment.appointment_id,
          patientEmail: appointment.patient_email,
          patientName: appointment.patient_name,
          providerName: appointment.provider.provider_name,
          serviceName: appointment.service.service_name,
          appointmentDate: appointment.appointment_date,
          appointmentTime: appointment.appointment_time,
          appointmentPeriod: appointment.appointment_period,
          providerAddress: appointment.provider.provider_address,
          providerPhone: appointment.provider.provider_phone,
        }),
      });
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Do not fail the request if email fails
    }

    return NextResponse.json({ success: true, message: 'Appointment cancelled successfully' });
  } catch (error: any) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
