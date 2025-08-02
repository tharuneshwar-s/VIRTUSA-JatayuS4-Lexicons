import { formatCurrency } from '@/lib/utils';
import { google } from 'googleapis';

export interface CalendarEvent {
  summary: string;
  description: string;
  location: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface AppointmentDetails {
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  providerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentPeriod: string;
  providerAddress: string;
  providerPhone?: string;
  notes?: string;
  estimatedCost?: number;
  insurancePlan?: string;
  timeZone?: string; // Optional, defaults to 'America/New_York'
}

class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: any;

  constructor() {
    // Initialize with Google OAuth credentials for token refresh
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      // The redirect URI should match what's configured in Supabase
      process.env.SUPABASE_URL ? `${process.env.SUPABASE_URL}/auth/v1/callback` : undefined
    );
    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Set access token for the authenticated user
   * Now works with Supabase provider tokens from unified OAuth
   */
  setAccessToken(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Create a calendar event for an appointment
   */
  async createAppointmentEvent(appointmentDetails: AppointmentDetails, timeZone?: string): Promise<any> {
    try {
      // Use dynamic time zone if not provided
      const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      // Debug: Log the current credentials
      const credentials = this.oauth2Client.credentials;
      // console.log('OAuth2 credentials set:', !!credentials?.access_token);

      // Convert appointment date and time to proper datetime format
      const { dateTime: startDateTime, endDateTime } = this.formatAppointmentDateTime(
        appointmentDetails.appointmentDate,
        appointmentDetails.appointmentTime,
        appointmentDetails.appointmentPeriod,
        tz
      );

      // console.log('Formatted dates:', { startDateTime, endDateTime });

      const event: CalendarEvent = {
        summary: `Medical Appointment - ${appointmentDetails.serviceName}`,
        description: this.buildEventDescription(appointmentDetails),
        location: appointmentDetails.providerAddress,
        start: {
          dateTime: startDateTime,
          timeZone: tz,
        },
        end: {
          dateTime: endDateTime,
          timeZone: tz,
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 120 }, // 2 hours before
            { method: 'popup', minutes: 60 },  // 1 hour before
            { method: 'popup', minutes: 30 },  // 30 minutes before
          ],
        },
      };

      // console.log('Calendar event object:', JSON.stringify(event, null, 2));

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        // Temporarily remove sendUpdates to test
        // sendUpdates: 'all', // Send email invitations to attendees
      });

      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        event: response.data,
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating calendar event',
      };
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateAppointmentEvent(eventId: string, appointmentDetails: AppointmentDetails, timeZone?: string): Promise<any> {
    try {
      const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const { dateTime: startDateTime, endDateTime } = this.formatAppointmentDateTime(
        appointmentDetails.appointmentDate,
        appointmentDetails.appointmentTime,
        appointmentDetails.appointmentPeriod,
        tz
      );

      const event: CalendarEvent = {
        summary: `Medical Appointment - ${appointmentDetails.serviceName}`,
        description: this.buildEventDescription(appointmentDetails),
        location: appointmentDetails.providerAddress,
        start: {
          dateTime: startDateTime,
          timeZone: tz,
        },
        end: {
          dateTime: endDateTime,
          timeZone: tz,
        },
        attendees: [
          {
            email: appointmentDetails.patientEmail,
            displayName: appointmentDetails.patientName,
          },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 120 }, // 2 hours before
            { method: 'popup', minutes: 60 },  // 1 hour before
            { method: 'popup', minutes: 30 },  // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink,
        event: response.data,
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error updating calendar event',
      };
    }
  }

  /**
   * Get authorization URL for Google OAuth
   */
  getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokens(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return {
        success: true,
        tokens,
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error getting tokens',
      };
    }
  }

  /**
   * Format appointment date and time for Google Calendar
   */
  private formatAppointmentDateTime(
    date: string,
    time: string,
    period: string,
    timeZone?: string
  ): {
    dateTime: string;
    endDateTime: string;
  } {
    try {
      // Use dynamic time zone if not provided
      const tz = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      // Parse the time and period
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;

      // Convert to 24-hour format
      if (period === 'PM' && hours < 12) {
        hour24 = hours + 12;
      } else if (period === 'AM' && hours === 12) {
        hour24 = 0;
      }

      // Use the timeZone parameter for logging (for future use with libraries like luxon/moment-timezone)
      const dateStr = date.includes('T') ? date.split('T')[0] : date;
      const timeStr = `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      const fullDateTimeStr = `${dateStr}T${timeStr}`;
      // console.log('Building datetime from:', { date, time, period, dateStr, timeStr, fullDateTimeStr, tz });

      // For now, this is still local time, but the event will use the correct timeZone field
      const startDate = new Date(fullDateTimeStr);

      // Validate the date
      if (isNaN(startDate.getTime())) {
        throw new Error(`Invalid date created from: ${fullDateTimeStr}`);
      }

      // Create end datetime (assuming 1-hour appointments)
      const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // Add 1 hour

      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();
      // console.log('Final datetime values:', { startISO, endISO, tz });

      return {
        dateTime: startISO,
        endDateTime: endISO,
      };
    } catch (error) {
      console.error('Error formatting appointment datetime:', error);
      throw new Error(`Failed to format appointment datetime: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build event description with appointment details
   */
  private buildEventDescription(details: AppointmentDetails): string {
    let description = `Medical Appointment Details:\n\n`;
    description += `Provider: ${details.providerName}\n`;
    description += `Service: ${details.serviceName}\n`;
    description += `Patient: ${details.patientName}\n`;
    description += `Date: ${details.appointmentDate}\n`;
    description += `Time: ${details.appointmentTime} ${details.appointmentPeriod}\n`;
    description += `Location: ${details.providerAddress}\n`;
    
    if (details.providerPhone) {
      description += `Phone: ${details.providerPhone}\n`;
    }
    
    if (details.insurancePlan) {
      description += `Insurance: ${details.insurancePlan}\n`;
    }
    
    if (details.estimatedCost) {
      description += `Estimated Cost: ${formatCurrency(details.estimatedCost)}\n`;
    }
    
    if (details.notes) {
      description += `\nNotes: ${details.notes}\n`;
    }
    
    description += `\nAppointment ID: ${details.appointmentId}\n`;
    description += `\nThis appointment was booked through PriceAI.`;
    
    return description;
  }

  /**
   * Test calendar access to verify authentication
   */
  async testCalendarAccess(): Promise<any> {
    try {
      // console.log('Testing calendar access...');
      const response = await this.calendar.calendars.get({
        calendarId: 'primary',
      });
      
      // console.log('Calendar access successful:', response.data.summary);
      return {
        success: true,
        calendar: response.data,
      };
    } catch (error) {
      console.error('Calendar access test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<any> {
    try {
      // console.log('Attempting to refresh access token...');
      
      if (!this.oauth2Client.credentials?.refresh_token) {
        return {
          success: false,
          error: 'No refresh token available',
        };
      }

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      if (credentials.access_token) {
        // Update the oauth2Client with new credentials
        this.oauth2Client.setCredentials(credentials);
        
        // console.log('Access token refreshed successfully');
        return {
          success: true,
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token, // May be updated
        };
      } else {
        return {
          success: false,
          error: 'No access token returned from refresh',
        };
      }
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown refresh error',
      };
    }
  }

  /**
   * Delete a calendar event by eventId
   */
  async deleteEvent(eventId: string): Promise<any> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId,
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export default GoogleCalendarService;
