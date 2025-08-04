import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDistance = (distance: any) => {
  if (!distance) return "Distance unavailable";
  return distance < 10 ? `${distance.toFixed(1)} miles away` : `${Math.round(distance)} miles away`;
};

// Time utility functions
export function getCurrentDateTime(): Date {
  return new Date();
}

export function getCurrentTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get current time in 12-hour format with AM/PM
 */
export function getCurrentTime12Hour(): { time: string; period: 'AM' | 'PM'; hour24: number; minute: number } {
  const now = new Date();
  const hour24 = now.getHours();
  const minute = now.getMinutes();
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const time = `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  return { time, period, hour24, minute };
}

/**
 * Convert 12-hour time to 24-hour format
 */
export function convertTo24Hour(time12: string, period: 'AM' | 'PM'): number {
  let [hour, minute] = time12.split(':').map(Number);
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute; // Return total minutes for easy comparison
}

/**
 * Checks if the selected appointment is at least a given number of hours ahead of now.
 * @param appointmentDate - Date string in YYYY-MM-DD format
 * @param appointmentTime - Time string in HH:mm format
 * @param appointmentPeriod - 'AM' or 'PM'
 * @param hoursAhead - Number of hours ahead required
 * @returns boolean
 */
export function isAtLeastHoursAhead(
  appointmentDate: string,
  appointmentTime: string,
  appointmentPeriod: string,
  hoursAhead: number
): boolean {
  const now = new Date();
  let [hour, minute] = appointmentTime.split(':').map(Number);
  // Convert to 24-hour clock
  if (appointmentPeriod === 'PM' && hour < 12) hour += 12;
  if (appointmentPeriod === 'AM' && hour === 12) hour = 0;
  const apptDate = new Date(appointmentDate);
  apptDate.setHours(hour, minute, 0, 0);
  const diffMs = apptDate.getTime() - now.getTime();
  return diffMs >= hoursAhead * 3600000;
}

/**
 * Get available time slots based on current time and selected date
 */
export function getAvailableTimeSlots(selectedDate: string, hoursAhead: number = 5): {
  availableSlots: string[];
  availablePeriods: ('AM' | 'PM')[];
} {
  // Business hours: 9 AM to 5 PM only
  const allSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '01:00', '01:30', '02:00', '02:30',
    '03:00', '03:30', '04:00', '04:30', '05:00'
  ];
  
  const currentDate = getCurrentDateString();
  const currentTime = getCurrentTime12Hour();
  
  // If not today, return slots within business hours (9 AM to 5 PM)
  if (selectedDate !== currentDate) {
    const businessHourSlots: string[] = [];
    const businessHourPeriods: Set<'AM' | 'PM'> = new Set();
    
    allSlots.forEach(slot => {
      // Check AM period (9:00 AM to 11:30 AM)
      if (slot >= '09:00' && slot <= '11:30') {
        businessHourSlots.push(slot);
        businessHourPeriods.add('AM');
      }
      
      // Check PM period (12:00 PM to 5:00 PM)
      if (slot >= '12:00' || (slot >= '01:00' && slot <= '05:00')) {
        businessHourSlots.push(slot);
        businessHourPeriods.add('PM');
      }
    });
    
    return {
      availableSlots: Array.from(new Set(businessHourSlots)),
      availablePeriods: Array.from(businessHourPeriods)
    };
  }
  
  // For today, filter based on current time + hours ahead
  const currentTotalMinutes = currentTime.hour24 * 60 + currentTime.minute;
  const requiredMinutes = currentTotalMinutes + (hoursAhead * 60);
  const requiredHour24 = Math.floor(requiredMinutes / 60);
  const requiredMinute = requiredMinutes % 60;
  
  const availableSlots: string[] = [];
  const availablePeriods: Set<'AM' | 'PM'> = new Set();
  
  allSlots.forEach(slot => {
    // Determine valid periods for each slot based on business hours (9 AM to 5 PM)
    const validPeriods: ('AM' | 'PM')[] = [];
    
    // Check AM period (9:00 AM to 11:30 AM)
    if (slot >= '09:00' && slot <= '11:30') {
      validPeriods.push('AM');
    }
    
    // Check PM period (12:00 PM to 5:00 PM)
    if (slot >= '12:00' || (slot >= '01:00' && slot <= '05:00')) {
      validPeriods.push('PM');
    }
    
    // For today, check if slots are at least hoursAhead from now
    validPeriods.forEach(period => {
      const slotMinutes = convertTo24Hour(slot, period);
      const slotHour24 = Math.floor(slotMinutes / 60);
      
      // Additional business hours validation: only 9 AM (540 min) to 5 PM (1020 min)
      if (slotMinutes >= 540 && slotMinutes <= 1020) {
        // Check if this slot is at least hoursAhead from now
        if (slotMinutes >= requiredMinutes) {
          availableSlots.push(slot);
          availablePeriods.add(period);
        }
      }
    });
  });
  
  // Remove duplicates from slots
  const uniqueSlots = Array.from(new Set(availableSlots));
  
  return {
    availableSlots: uniqueSlots,
    availablePeriods: Array.from(availablePeriods)
  };
}

