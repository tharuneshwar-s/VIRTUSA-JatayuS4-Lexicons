'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Separator } from '../ui/separator';
import { Calendar, Clock, User, Phone, Mail, FileText, CreditCard, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { supabase } from '@/lib/supabase/supabase';
import { formatCurrency, getCurrentDateTime, getCurrentTimeZone, isAtLeastHoursAhead, getAvailableTimeSlots, getCurrentDateString } from '@/lib/utils';
import { openGoogleCalendar, downloadICSFile } from '@/lib/calendar';
import {createClient} from '@/lib/supabase/client'

interface AppointmentBookingProps {
  provider: any;
  service: any;
  isOpen: boolean;
  isSelfPay: any;
  onClose: () => void;
}

const AppointmentBooking: React.FC<AppointmentBookingProps> = ({
  provider,
  service,
  isOpen,
  isSelfPay,
  onClose
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    appointmentDate: '',
    appointmentTime: '',
    appointmentPeriod: 'AM', // new field for AM/PM
    appointmentType: 'CONSULTATION',
    patientName: user?.user_metadata?.full_name || '',
    patientPhone: '',
    patientEmail: user?.email || '',
    notes: '',
    insuranceId: null,
    selectedInsurancePlan: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availableInsurancePlans, setAvailableInsurancePlans] = useState<any[]>([]);
  const [insuranceLoading, setInsuranceLoading] = useState(false);


  const [bookedAppointmentData, setBookedAppointmentData] = useState<any>(null);

  const bookInAdvance: number = 1; // Require 1 hour advance booking

  const appointmentTypes = [
    { label: 'Consultation', value: 'CONSULTATION' },
    { label: 'Procedure', value: 'PROCEDURE' },
    { label: 'Follow-up', value: 'FOLLOW_UP' },
    { label: 'Emergency', value: 'EMERGENCY' }
  ];

  // Get available slots and periods based on selected date
  const { availableSlots, availablePeriods } = useMemo(() => {
    return getAvailableTimeSlots(formData.appointmentDate, bookInAdvance);
  }, [formData.appointmentDate, bookInAdvance]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  // Fetch available insurance plans for the provider/service
  useEffect(() => {
    if (isOpen && provider?.provider_id && service?.service_id) {

      fetchAvailableInsurancePlans();
    }

  }, [isOpen, provider?.provider_id, service?.service_id]);


  const fetchAvailableInsurancePlans = async () => {
    setInsuranceLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_REST_API_URL || '';
      const apiPrefix = process.env.NEXT_PUBLIC_REST_API_PREFIX || '';
      const apiVersion = process.env.NEXT_PUBLIC_REST_API_VERSION || '';
      const baseUrl = `${apiUrl}${apiPrefix}/${apiVersion}/insurance/provider-service-insurance/${provider.provider_id}/${service.service_id}`;
      const url = new URL(baseUrl, window.location.origin);
      url.searchParams.append('provider_id', provider.provider_id);
      url.searchParams.append('service_id', service.service_id);

      console.log('Fetching insurance plans from:', url.toString());

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.warn(`API request failed with status ${response.status}`);
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw insurance data:', data);

      const processedPlans = data.map((plan: any) => {
        const parsedBenefits = plan.insurance_benefits
          ? plan.insurance_benefits.split(',').map((b: string) => b.trim())
          : [];

        return {
          id: plan.insurance_id,
          insuranceName: plan.insurance_name,
          insurancePlan: plan.insurance_plan,
          insurance_benefits: parsedBenefits,
          inNetwork: plan?.in_network,
          negotiatedPrice: plan?.negotiated_price,
          standardPrice: plan?.standard_price,
          insuranceId: plan.insurance_id,
          // Keep the benefits field for backward compatibility
          benefits: parsedBenefits
        };
      });

      console.log('Processed insurance plans:', processedPlans);
      setAvailableInsurancePlans(processedPlans);
    } catch (error) {
      console.error('Error fetching insurance plans:', error);
      // Set some mock data for testing if API fails
      const mockPlans = [
        {
          id: 'mock-1',
          insuranceName: 'Blue Cross Blue Shield',
          insurancePlan: 'PPO Standard',
          inNetwork: true,
          negotiatedPrice: provider.standardCharge ? provider.standardCharge * 0.8 : 5000,
          standardPrice: provider.standardCharge || 6000,
          benefits: ['Coverage for consultations', 'Prescription coverage', 'Emergency services']
        },
        {
          id: 'mock-2',
          insuranceName: 'Aetna Health',
          insurancePlan: 'HMO Basic',
          inNetwork: true,
          negotiatedPrice: provider.standardCharge ? provider.standardCharge * 0.75 : 4500,
          standardPrice: provider.standardCharge || 6000,
          benefits: ['Preventive care', 'Specialist referrals', 'Lab tests']
        },
        {
          id: 'mock-3',
          insuranceName: 'United Healthcare',
          insurancePlan: 'Choice Plus',
          inNetwork: false,
          negotiatedPrice: provider.standardCharge ? provider.standardCharge * 0.9 : 5500,
          standardPrice: provider.standardCharge || 6000,
          benefits: ['Nationwide coverage', 'Mental health services']
        }
      ];
      console.log('Using mock insurance plans for testing');
      setAvailableInsurancePlans(mockPlans);
    } finally {
      setInsuranceLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.appointmentDate) {
      setError('Please select an appointment date');
      return false;
    }
    if (!formData.appointmentTime) {
      setError('Please select an appointment time');
      return false;
    }
    if (!formData.appointmentPeriod) {
      setError('Please select AM or PM');
      return false;
    }

    // Validate business hours (9 AM to 5 PM only)
    const selectedHour = parseInt(formData.appointmentTime.split(':')[0], 10);
    const selectedMinute = parseInt(formData.appointmentTime.split(':')[1], 10);
    let hour24 = selectedHour;
    
    if (formData.appointmentPeriod === 'PM' && selectedHour !== 12) {
      hour24 = selectedHour + 12;
    } else if (formData.appointmentPeriod === 'AM' && selectedHour === 12) {
      hour24 = 0;
    }
    
    const totalMinutes = hour24 * 60 + selectedMinute;
    
    // Business hours: 9:00 AM (540 minutes) to 5:00 PM (1020 minutes)
    if (totalMinutes < 540 || totalMinutes > 1020) {
      setError('Appointments are only available between 9:00 AM and 5:00 PM');
      return false;
    }

    // Additional validation: No appointments after 5:00 PM or before 9:00 AM
    if (formData.appointmentPeriod === 'AM' && selectedHour < 9) {
      setError('Morning appointments start at 9:00 AM');
      return false;
    }
    
    if (formData.appointmentPeriod === 'PM' && (selectedHour > 5 || (selectedHour === 5 && selectedMinute > 0))) {
      setError('Evening appointments end at 5:00 PM');
      return false;
    }
    // Ensure booking is at least 5 hours in advance
    if (!isAtLeastHoursAhead(
      formData.appointmentDate,
      formData.appointmentTime,
      formData.appointmentPeriod,
      bookInAdvance
    )) {
      const tz = getCurrentTimeZone();
      const currentTime = getCurrentDateTime();
      const timeStr = currentTime.toLocaleTimeString('en-US', { 
        timeZone: tz, 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      setError(
        `Please book appointments at least ${bookInAdvance} hours in advance. Current time: ${timeStr} (${tz})`
      );
      return false;
    }
    if (!formData.patientName.trim()) {
      setError('Please enter patient name');
      return false;
    }
    if (!formData.patientEmail.trim()) {
      setError('Please enter patient email');
      return false;
    }
    // Validate with current date and time
    const now = getCurrentDateTime();
    const selectedDate = new Date(formData.appointmentDate + 'T' +
      (formData.appointmentTime.length === 5 ? formData.appointmentTime : '00:00') + ':00');
    let hour = parseInt(formData.appointmentTime.split(':')[0], 10);
    let period = formData.appointmentPeriod;
    if (period !== 'AM' && period !== 'PM') {
      setError('Please select AM or PM');
      return false;
    }
    if (period === 'PM' && hour < 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    selectedDate.setHours(hour);
    selectedDate.setMinutes(parseInt(formData.appointmentTime.split(':')[1], 10));
    if (selectedDate < now) {
      setError('Please select a future date and time');
      return false;
    }

    // Validate AM/PM for same-day bookings
    const timeZone = getCurrentTimeZone();
    const todayStr = now.toLocaleString('en-IN', { timeZone }).split(',')[0];
    const currentHour = now.getHours();
    const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
    if (formData.appointmentDate === todayStr) {
      // Cannot book morning slots after PM has started
      if (formData.appointmentPeriod === 'AM' && currentPeriod === 'PM') {
        setError('Morning slots have passed for today');
        return false;
      }
    }

    return true;
  };

  const handleBookAppointment = async () => {
    if (!user) {
      setError('Please login to book an appointment');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    console.log("Booking...")
    try {
      let estimatedCost = null;
      let selectedPlan: any = null;
      if (formData.insuranceId) {
        selectedPlan = availableInsurancePlans.find(plan => plan.id === formData.insuranceId);
        estimatedCost = selectedPlan?.negotiatedPrice || provider.negotiateCharge || provider.standardCharge;
      }
      else {
        estimatedCost = provider.standardCharge || 0;
      }
      


      const { data, error: dbError } = await supabase
        .from('appointments')
        .insert({
          user_id: user.id,
          provider_id: provider.provider_id,
          service_id: service.service_id,
          appointment_date: formData.appointmentDate,
          appointment_time: formData.appointmentTime,
          appointment_period: formData.appointmentPeriod,
          appointment_type: formData.appointmentType,
          patient_name: formData.patientName,
          patient_phone: formData.patientPhone,
          patient_email: formData.patientEmail,
          notes: formData.notes,
          insurance_id: formData.insuranceId,
          insurance_plan_name: selectedPlan?.insuranceName || null,
          insurance_plan_type: selectedPlan?.insurancePlan || null,
          estimated_cost: estimatedCost,
          status: 'PENDING',
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Send confirmation email
      try {
        await fetch('/api/send-appointment-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            appointmentId: data.appointment_id,
            patientEmail: formData.patientEmail,
            patientName: formData.patientName,
            providerName: provider.providerName,
            serviceName: service.service_name,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
            appointmentPeriod: formData.appointmentPeriod,
            insurancePlan: selectedPlan ? `${selectedPlan.insuranceName} - ${selectedPlan.insurancePlan}` : 'Self Pay',
            estimatedCost: estimatedCost,
            providerAddress: provider.providerAddress,
            providerPhone: provider.providerPhone
          })
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the booking if email fails
      }

      // Sync with Google Calendar if enabled
      try {
        const calendarResponse = await fetch('/api/google-calendar/create-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            appointmentId: data.appointment_id,
            patientName: formData.patientName,
            patientEmail: formData.patientEmail,
            providerName: provider.providerName,
            serviceName: service.service_name,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
            appointmentPeriod: formData.appointmentPeriod,
            providerAddress: provider.providerAddress,
            providerPhone: provider.providerPhone,
            notes: formData.notes,
            estimatedCost: estimatedCost,
            insurancePlan: selectedPlan ? `${selectedPlan.insuranceName} - ${selectedPlan.insurancePlan}` : 'Self Pay'
          })
        });

        if (!calendarResponse.ok) {
          const errorData = await calendarResponse.json();
          if (errorData.requiresReauth) {
            console.warn('Google Calendar requires re-authentication:', errorData.error);
            // You could show a notification to the user here about calendar sync failure
            // and provide a link to reconnect their Google account
          } else {
            console.error('Calendar sync failed:', errorData.error);
          }
        } else {
          const calendarData = await calendarResponse.json();
          console.log('Calendar event created successfully:', calendarData);
        }
      } catch (calendarError) {
        console.error('Failed to sync with Google Calendar:', calendarError);
        // Don't fail the booking if calendar sync fails
      }

      setSuccess(true);
      setBookedAppointmentData({
        appointmentId: data.appointment_id,
        patientName: formData.patientName,
        providerName: provider.providerName,
        serviceName: service.service_name,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.appointmentTime,
        appointmentPeriod: formData.appointmentPeriod,
        providerAddress: provider.providerAddress,
        patientEmail: formData.patientEmail
      });
    
  
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setBookedAppointmentData(null);
        setFormData({
          appointmentDate: '',
          appointmentTime: '',
          appointmentPeriod: 'AM',
          appointmentType: 'CONSULTATION',
          patientName: user?.user_metadata?.full_name || '',
          patientPhone: '',
          patientEmail: user?.email || '',
          notes: '',
          insuranceId: null,
          selectedInsurancePlan: null
        });
      }, 1500);

    } catch (error: any) {
      console.error('Error booking appointment:', error);
      setError(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reset time and period if current selections are no longer valid
  useEffect(() => {
    if (formData.appointmentDate) {
      // Reset time if not available
      if (formData.appointmentTime && !availableSlots.includes(formData.appointmentTime)) {
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
      }
      // Reset period if not available
      if (formData.appointmentPeriod && !availablePeriods.includes(formData.appointmentPeriod as 'AM' | 'PM')) {
        setFormData(prev => ({ ...prev, appointmentPeriod: availablePeriods[0] || 'AM' }));
      }
    }
  }, [availableSlots, availablePeriods, formData.appointmentDate, formData.appointmentTime, formData.appointmentPeriod]);

  if (!isOpen) return null;


  console.log("Insurance Id: ", formData.insuranceId);
  console.log("Insurance Plan: ", formData.selectedInsurancePlan);
  
  return (
    <div className="fixed inset-0 bg-black/60 z-[2147483647] flex items-center justify-center p-4" style={{ pointerEvents: 'auto' }}>
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white relative shadow-2xl z-[2147483647]">
        <CardHeader className="bg-gradient-to-r sticky top-0 left-0 from-priceai-blue z-[1] to-priceai-lightblue text-white">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5" />
              Book Appointment
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {!user ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto text-priceai-orange mb-4" />
              <h3 className="text-xl font-semibold text-priceai-dark mb-2">
                Login Required
              </h3>
              <p className="text-priceai-gray mb-4">
                Please login to book an appointment
              </p>
              <Button
                onClick={() => window.location.href = '/auth/login'}
                className="bg-priceai-blue hover:bg-priceai-lightblue"
              >
                Login to Continue
              </Button>
            </div>
          ) : success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-priceai-green/20 rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-priceai-green" />
              </div>
              <h3 className="text-xl font-semibold text-priceai-dark mb-2">
                Appointment Booked Successfully!
              </h3>
              <p className="text-priceai-gray mb-6">
                A confirmation email has been sent to {formData.patientEmail}
              </p>
              
           
            </div>
          ) : (
            <>
              {/* Provider & Service Info */}
              <div className="bg-priceai-lightgray/30 p-4 rounded-lg">
                <h3 className="font-semibold text-priceai-dark mb-2">{provider.providerName}</h3>
                <p className="text-sm text-priceai-gray mb-1">{provider.providerAddress}</p>
                <div className="flex items-center gap-4">
                  <Badge className="bg-priceai-blue/20 text-priceai-blue">
                    {service.service_name}
                  </Badge>
                 
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Appointment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-priceai-dark mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Appointment Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.appointmentDate}
                    onChange={(e) => handleInputChange('appointmentDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-priceai-dark mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Appointment Time *
                  </label>
                  <div className="flex gap-2">
                    <Select
                      options={availableSlots.map((time: string) => ({ label: time, value: time }))}
                      value={formData.appointmentTime}
                      onChange={(value) => handleInputChange('appointmentTime', value)}
                      placeholder={formData.appointmentDate ? "Select time" : "Select date first"}
                    />
                    <Select
                      options={availablePeriods.map((period: string) => ({ label: period, value: period }))}
                      value={formData.appointmentPeriod}
                      onChange={(value) => handleInputChange('appointmentPeriod', value)}
                      placeholder="AM/PM"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-priceai-dark mb-2">
                  Appointment Type *
                </label>
                <Select
                  options={appointmentTypes}
                  value={formData.appointmentType}
                  onChange={(value) => handleInputChange('appointmentType', value)}
                  placeholder="Select appointment type"
                />
              </div>

              <Separator />

              {/* Patient Information */}
              <h3 className="text-lg font-semibold text-priceai-dark">Patient Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-priceai-dark mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Patient Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    placeholder="Enter patient name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-priceai-dark mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.patientPhone}
                    onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-priceai-dark mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-priceai-dark mb-2">
                  <FileText className="w-4 h-4 inline mr-1" />
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional information or special requirements"
                  className="w-full p-3 border border-priceai-gray/50 outline-none rounded-lg focus:ring-2 focus:ring-priceai-blue focus:border-transparent"
                  rows={3}
                />
              </div>

              <Separator />

              {/* Insurance Plan Selection */}
              <div>
                <h3 className="text-lg font-semibold text-priceai-dark mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 inline mr-2" />
                  Insurance Plan & Payment Method
                </h3>

                {insuranceLoading ? (
                  <div className="flex items-center gap-2 text-sm text-priceai-gray p-4 bg-priceai-lightgray/20 rounded-lg">
                    <div className="animate-spin w-4 h-4 border-2 border-priceai-blue border-t-transparent rounded-full" />
                    Loading available insurance plans for {provider.providerName}...
                  </div>
                ) : (
                  <div className="space-y-3">
                         {/* Disclaimer */}
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm ">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-blue-800">
                          <strong>Important Disclaimer:</strong> Bring your insurance ID or member number to get, apply for, or use insurance benefits and pricing. Please confirm all costs with the provider before treatment as prices may vary based on actual services provided.
                        </div>
                      </div>
                    </div>
                    {/* Available Insurance Plans - Show these first and prominently */}
                    {availableInsurancePlans.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-priceai-dark">Available Insurance Plans for this Provider:</div>
                          <Badge className="bg-green-100 text-green-800">
                            {availableInsurancePlans.length} plan{availableInsurancePlans.length > 1 ? 's' : ''} available
                          </Badge>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {availableInsurancePlans.map((plan) => (
                            <Card 
                              key={plan.id} 
                              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                                formData.insuranceId === plan.id 
                                  ? 'ring-2 ring-priceai-blue bg-blue-50/50' 
                                  : 'hover:border-priceai-blue/40'
                              }`}
                              onClick={() => handleInputChange('insuranceId', plan.id)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="radio"
                                    name="insurance"
                                    value={plan.id}
                                    checked={formData.insuranceId === plan.id}
                                    onChange={() => handleInputChange('insuranceId', plan.id)}
                                    className="w-4 h-4 mt-1 text-priceai-blue border-priceai-gray/50 focus:ring-priceai-blue"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-semibold text-priceai-dark text-base">{plan.insuranceName}</div>
                                      <Badge variant={plan.inNetwork ? "default" : "secondary"} className="text-xs">
                                        {plan.inNetwork ? "✓ In-Network" : "⚠ Out-of-Network"}
                                      </Badge>
                                    </div>

                                    <div className="text-sm text-priceai-gray mb-3">
                                      <strong>Plan:</strong> {plan.insurancePlan}
                                    </div>

                                    <div className="space-y-2 mb-3">
                                      {plan.negotiatedPrice && (
                                        <div className="text-lg font-bold text-priceai-green">
                                          {formatCurrency(plan.negotiatedPrice)}
                                          <span className="text-xs font-normal text-priceai-gray ml-1">(Your cost)</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-2">
                                        {plan.standardPrice && plan.negotiatedPrice && plan.standardPrice > plan.negotiatedPrice && (
                                          <>
                                            <div className="text-sm text-priceai-gray line-through">
                                              {formatCurrency(plan.standardPrice)}
                                            </div>
                                            <Badge className="bg-green-100 text-green-800 text-xs">
                                              Save {formatCurrency(plan.standardPrice - plan.negotiatedPrice)}
                                            </Badge>
                                          </>
                                        )}
                                      </div>
                                    </div>

                                    {plan.benefits && plan.benefits.length > 0 && (
                                      <div className="text-xs text-priceai-gray bg-priceai-lightgray/20 p-2 rounded">
                                        <strong>Benefits:</strong> {plan.benefits.slice(0, 3).join(', ')}
                                        {plan.benefits.length > 3 && ` +${plan.benefits.length - 3} more`}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Self Pay Option - Show as alternative */}
                    <Card 
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                        formData.insuranceId === null 
                          ? 'ring-2 ring-priceai-orange bg-orange-50/50' 
                          : 'hover:border-priceai-orange/40'
                      }`}
                      onClick={() => handleInputChange('insuranceId', null)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="insurance"
                            value="self-pay"
                            checked={formData.insuranceId === null}
                            onChange={() => handleInputChange('insuranceId', null)}
                            className="w-4 h-4 text-priceai-orange border-priceai-gray/50 focus:ring-priceai-orange"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-priceai-dark flex items-center gap-2 mb-2">
                              Self Pay
                              <Badge variant="outline" className="text-xs">No Insurance</Badge>
                            </div>
                            <div className="text-sm text-priceai-gray mb-2">
                              Pay directly without insurance coverage
                            </div>
                            {(provider.standardCharge || service.standard_price) && (
                              <div className="text-lg font-bold text-priceai-orange">
                                {formatCurrency(provider.standardCharge || service.standard_price || 0)}
                                <span className="text-xs font-normal text-priceai-gray ml-2">Standard Rate</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                   
                 

                    {/* Show message if no insurance plans available */}
                    {availableInsurancePlans.length === 0 && (
                      <div className="text-sm text-priceai-gray bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                          <strong>No insurance plans found</strong>
                        </div>
                        This provider may not have insurance contracts for the selected service, or the insurance data is still being updated. You can still book with self-pay option.
                      </div>
                    )}
                  </div>
                )}
              </div>

            </>
          )}
        </CardContent>

        {user && !success && (
          <CardFooter className="bg-white border-t-[1px] border-t-priceai-gray/30 sticky pt-4 bottom-0 shadow-lg flex justify-center items-center">
            {/* Action Buttons */}
            <>
              <div className="flex items-center gap-4 w-full">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 w-full"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault();
                    handleBookAppointment();
                  }}
                  disabled={loading}
                  className="flex-1 bg-priceai-blue hover:bg-priceai-lightblue w-full"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Booking...
                    </span>
                  ) : (
                    'Book Appointment'
                  )}
                </Button>
              </div>
            </>
          </CardFooter>
        )}
      </Card>
      

    </div>
  );
};

export default AppointmentBooking;
