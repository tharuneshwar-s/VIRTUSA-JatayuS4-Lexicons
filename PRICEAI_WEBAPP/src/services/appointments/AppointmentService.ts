import { supabase } from "@/lib/supabase/supabase";

export interface AppointmentData {
  user_id: string;
  provider_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_period: string;
  appointment_type: string;
  patient_name: string;
  patient_phone?: string | null;
  patient_email: string;
  notes?: string | null;
  insurance_id?: string | null;
  insurance_plan_name?: string | null;
  insurance_plan_type?: string | null;
  estimated_cost?: number | null;
  status: string;
}

export interface AppointmentResponse {
  appointment_id: string;
  user_id: string;
  provider_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_period: string;
  appointment_type: string;
  patient_name: string;
  patient_phone?: string | null;
  patient_email: string;
  notes?: string | null;
  insurance_id?: string | null;
  insurance_plan_name?: string | null;
  insurance_plan_type?: string | null;
  estimated_cost?: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

class AppointmentService {
  /**
   * Create a new appointment
   */
  async createAppointment(
    appointmentData: AppointmentData
  ): Promise<any> {
    try {
      console.log(
        "[AppointmentService] Creating appointment with data:",
        appointmentData
      );

      // Call the API endpoint instead of direct Supabase call
      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...appointmentData, sync_with_calendar: true}),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[AppointmentService] API error:', result);
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
      }

      if (!result.success || !result.data) {
        throw new Error('Invalid response from appointment creation API');
      }

      console.log(
        "[AppointmentService] Appointment created successfully:",
        result.data
      );
      return result.data;
    } catch (error: any) {
      console.error("[AppointmentService] Error creating appointment:", error);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(
    appointmentId: string
  ): Promise<AppointmentResponse | null> {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (error) {
        console.error(
          "[AppointmentService] Error fetching appointment:",
          error
        );
        return null;
      }

      return data as AppointmentResponse;
    } catch (error) {
      console.error("[AppointmentService] Error fetching appointment:", error);
      return null;
    }
  }

  /**
   * Get appointments for a user
   */
  async getUserAppointments(userId: string): Promise<AppointmentResponse[]> {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("user_id", userId)
        .order("appointment_date", { ascending: true });

      if (error) {
        console.error(
          "[AppointmentService] Error fetching user appointments:",
          error
        );
        return [];
      }

      return data as AppointmentResponse[];
    } catch (error) {
      console.error(
        "[AppointmentService] Error fetching user appointments:",
        error
      );
      return [];
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: string,
    status: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("appointments")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("appointment_id", appointmentId);

      if (error) {
        console.error(
          "[AppointmentService] Error updating appointment status:",
          error
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        "[AppointmentService] Error updating appointment status:",
        error
      );
      return false;
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId: string): Promise<boolean> {
    return this.updateAppointmentStatus(appointmentId, "CANCELLED");
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;
