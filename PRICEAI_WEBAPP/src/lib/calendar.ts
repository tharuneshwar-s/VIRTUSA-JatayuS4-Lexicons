// Google Calendar utility functions
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
  // Format date and time for Google Calendar
  const date = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
  
  // Convert to 24-hour format
  let hour24 = hours;
  if (appointment.appointmentPeriod === 'PM' && hours < 12) {
    hour24 = hours + 12;
  } else if (appointment.appointmentPeriod === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  date.setHours(hour24, minutes, 0, 0);
  
  // End time (1 hour after start)
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 1);
  
  // Format for Google Calendar URL
  const startTime = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const eventDetails = {
    title: `${appointment.serviceName} - ${appointment.providerName}`,
    details: `Healthcare Appointment Details:
    
Provider: ${appointment.providerName}
Service: ${appointment.serviceName}
Patient: ${appointment.patientName}
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
  const date = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
  
  // Convert to 24-hour format
  let hour24 = hours;
  if (appointment.appointmentPeriod === 'PM' && hours < 12) {
    hour24 = hours + 12;
  } else if (appointment.appointmentPeriod === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  date.setHours(hour24, minutes, 0, 0);
  
  // End time (1 hour after start)
  const endDate = new Date(date);
  endDate.setHours(endDate.getHours() + 1);
  
  // Format for ICS (UTC)
  const startTime = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const createdTime = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PriceAI Healthcare//Appointment//EN
BEGIN:VEVENT
UID:${appointment.appointmentId}@priceai.healthcare
DTSTAMP:${createdTime}Z
DTSTART:${startTime}Z
DTEND:${endTime}Z
SUMMARY:${appointment.serviceName} - ${appointment.providerName}
DESCRIPTION:Healthcare Appointment Details:\\n\\nProvider: ${appointment.providerName}\\nService: ${appointment.serviceName}\\nPatient: ${appointment.patientName}\\nLocation: ${appointment.providerAddress}\\nAppointment ID: ${appointment.appointmentId}\\n\\nPlease arrive 15 minutes early for check-in.\\nBring your insurance card and ID.\\n\\nThis appointment was booked through PriceAI Healthcare Platform.
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
