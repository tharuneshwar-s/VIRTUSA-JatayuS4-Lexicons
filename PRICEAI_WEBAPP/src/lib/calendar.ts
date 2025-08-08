// Google Calendar utility functions
import { createAppointmentDateTime } from './utils';

interface CalendarEvent {
  appointmentId: string;
  patientName: string;
  providerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentPeriod: string;
  providerAddress: string;
  patientEmail: string;
}

export const createGoogleCalendarEvent = (appointment: CalendarEvent) => {
  // Create appointment datetime using utility function
  const appointmentDate = createAppointmentDateTime(
    appointment.appointmentDate,
    appointment.appointmentTime,
    appointment.appointmentPeriod as 'AM' | 'PM'
  );
  
  // End time (1 hour after start)
  const endDate = new Date(appointmentDate);
  endDate.setHours(endDate.getHours() + 1);
  
  // Format for Google Calendar URL - use local date/time format
  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };
  
  const startTime = formatDateForCalendar(appointmentDate);
  const endTime = formatDateForCalendar(endDate);
  
  const eventDetails = {
    title: `${appointment.serviceName} - ${appointment.providerName}`,
    details: `Healthcare Appointment Details:
    
Provider: ${appointment.providerName}
Service: ${appointment.serviceName}
Patient: ${appointment.patientName}
Date: ${appointment.appointmentDate}
Time: ${appointment.appointmentTime} ${appointment.appointmentPeriod}
Location: ${appointment.providerAddress}
Appointment ID: ${appointment.appointmentId}

Please arrive 15 minutes early for check-in.
Bring your insurance card and ID.

This appointment was booked through PriceAI Healthcare Platform.`,
    location: appointment.providerAddress,
    startTime,
    endTime
  };
  
  // Create Google Calendar URL
  const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
  googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
  googleCalendarUrl.searchParams.set('text', eventDetails.title);
  googleCalendarUrl.searchParams.set('dates', `${eventDetails.startTime}/${eventDetails.endTime}`);
  googleCalendarUrl.searchParams.set('details', eventDetails.details);
  googleCalendarUrl.searchParams.set('location', eventDetails.location);
  googleCalendarUrl.searchParams.set('sf', 'true');
  googleCalendarUrl.searchParams.set('output', 'xml');
  
  return googleCalendarUrl.toString();
};

export const openGoogleCalendar = (appointment: CalendarEvent) => {
  const calendarUrl = createGoogleCalendarEvent(appointment);
  window.open(calendarUrl, '_blank');
};

// Create .ics file for download (works with all calendar apps)
export const createICSFile = (appointment: CalendarEvent): string => {
  // Create appointment datetime using utility function
  const appointmentDate = createAppointmentDateTime(
    appointment.appointmentDate,
    appointment.appointmentTime,
    appointment.appointmentPeriod as 'AM' | 'PM'
  );
  
  // End time (1 hour after start)
  const endDate = new Date(appointmentDate);
  endDate.setHours(endDate.getHours() + 1);
  
  // Format for ICS - use local time format (DTSTART without Z suffix means local time)
  const formatDateForICS = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}`;
  };
  
  const startTime = formatDateForICS(appointmentDate);
  const endTime = formatDateForICS(endDate);
  const createdTime = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PriceAI Healthcare//Appointment//EN
BEGIN:VEVENT
UID:${appointment.appointmentId}@priceai.healthcare
DTSTAMP:${createdTime}Z
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${appointment.serviceName} - ${appointment.providerName}
DESCRIPTION:Healthcare Appointment Details:\\n\\nProvider: ${appointment.providerName}\\nService: ${appointment.serviceName}\\nPatient: ${appointment.patientName}\\nDate: ${appointment.appointmentDate}\\nTime: ${appointment.appointmentTime} ${appointment.appointmentPeriod}\\nLocation: ${appointment.providerAddress}\\nAppointment ID: ${appointment.appointmentId}\\n\\nPlease arrive 15 minutes early for check-in.\\nBring your insurance card and ID.\\n\\nThis appointment was booked through PriceAI Healthcare Platform.
LOCATION:${appointment.providerAddress}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
DESCRIPTION:Healthcare Appointment Reminder
ACTION:DISPLAY
END:VALARM
BEGIN:VALARM
TRIGGER:-PT24H
DESCRIPTION:Healthcare Appointment Tomorrow
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
};

export const downloadICSFile = (appointment: CalendarEvent) => {
  const icsContent = createICSFile(appointment);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `appointment-${appointment.appointmentId.slice(0, 8)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};
