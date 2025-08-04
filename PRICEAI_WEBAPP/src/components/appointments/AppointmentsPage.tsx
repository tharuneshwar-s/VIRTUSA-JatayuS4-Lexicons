'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { formatCurrency } from '@/lib/utils';
import { openGoogleCalendar, downloadICSFile } from '@/lib/calendar';
import appointmentService from '@/services/appointments/AppointmentService';

interface Appointment {
  appointment_id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_period: string;
  appointment_type: string;
  status: string;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
  notes: string;
  estimated_cost: number;
  insurance_id: string | null;
  insurance_plan_name: string | null;
  insurance_plan_type: string | null;
  created_at: string;
  updated_at: string;
  providers: {
    provider_name: string;
    provider_address: string;
    provider_phone: string;
    provider_city: string;
    provider_state: string;
  };
  services: {
    service_name: string;
    service_category: string;
  };
}

const AppointmentsPage = () => {
  const { user, loading: authLoading } = useAuth();

  const supabase = createClientComponentClient();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const appointmentsPerPage = 5;

  const statusOptions = [
    { label: 'All Appointments', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Confirmed', value: 'CONFIRMED' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  const sortOptions = [
    { label: 'Newest First', value: 'date_desc' },
    { label: 'Oldest First', value: 'date_asc' },
    { label: 'Status', value: 'status' },
    { label: 'Provider Name', value: 'provider' }
  ];

  useEffect(() => {
  

    fetchAppointments();
    updateExpiredAppointments();
  }, [user, authLoading]);

  const updateExpiredAppointments = async () => {
    if (!user) return;

    try {
      // Get current date and time
      const now = new Date();
      const currentDate = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);

      // Update appointments that are past their scheduled time
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'COMPLETED' })
        .eq('user_id', user.id)
        .in('status', ['PENDING', 'CONFIRMED'])
        .or(`appointment_date.lt.${currentDate},and(appointment_date.eq.${currentDate},appointment_time.lt.${currentTime})`);

      if (error) {
        console.error('Error updating expired appointments:', error);
      }
    } catch (error) {
      console.error('Error in updateExpiredAppointments:', error);
    }
  };

  const fetchAppointments = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          providers(provider_name, provider_address, provider_phone, provider_city, provider_state),
          services(service_name, service_category)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setAppointments(data || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      setError(error.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setCancellingAppointmentId(appointmentId);

    try {
      const success = await appointmentService.cancelAppointment(appointmentId);

      if (success) {
        console.log('Appointment cancelled successfully:', appointmentId);
        window.location.reload(); // Reload to reflect changes
      } else {
        throw new Error('Failed to cancel appointment');
      }
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
    } finally {
      setCancellingAppointmentId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      CONFIRMED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      NO_SHOW: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredAndSortedAppointments = appointments
    .filter(appointment => {
      const matchesSearch = searchTerm === '' ||
        appointment.providers.provider_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.services.service_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date_asc':
          return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime();
        case 'date_desc':
          return new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'provider':
          return a.providers.provider_name.localeCompare(b.providers.provider_name);
        default:
          return 0;
      }
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedAppointments.length / appointmentsPerPage);
  const startIndex = (currentPage - 1) * appointmentsPerPage;
  const paginatedAppointments = filteredAndSortedAppointments.slice(startIndex, startIndex + appointmentsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sizer">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-priceai-dark">My Appointments</h1>
          <p className="text-priceai-gray text-sm mt-1">Manage your healthcare appointments</p>
        </div>

        {/* Summary Stats at Top */}
        {appointments.length > 0 && (
          <Card className="mb-4">
            <CardContent className="p-3">
              <div className="grid grid-cols-5 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-priceai-blue">{appointments.length}</div>
                  <div className="text-xs text-priceai-gray">Total</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-600">
                    {appointments.filter(a => a.status === 'PENDING').length}
                  </div>
                  <div className="text-xs text-priceai-gray">Pending</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {appointments.filter(a => a.status === 'CONFIRMED').length}
                  </div>
                  <div className="text-xs text-priceai-gray">Confirmed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {appointments.filter(a => a.status === 'COMPLETED').length}
                  </div>
                  <div className="text-xs text-priceai-gray">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {appointments.filter(a => a.status === 'CANCELLED').length}
                  </div>
                  <div className="text-xs text-priceai-gray">Cancelled</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compact Filters and Search */}
        <Card className="mb-4">
          <CardContent className="p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Input
                type="text"
                placeholder="Search providers or services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm h-12"
              />
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                className="text-sm h-12"

              />
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                className="text-sm h-12"

              />

            </div>
          </CardContent>
        </Card>

        {(authLoading || loading) ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-priceai-blue border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-priceai-gray">
              {authLoading ? 'Loading user...' : 'Loading appointments...'}
            </p>
          </div>
        ) : !authLoading && !user ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-xl font-semibold text-priceai-dark mb-2">Authentication Required</h3>
              <p className="text-priceai-gray mb-4">Please sign in to view your appointments.</p>
              <Button onClick={() => window.location.href = '/auth/login'}>Sign In</Button>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center">
              <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-priceai-dark mb-2">Error Loading Appointments</h3>
              <p className="text-priceai-gray mb-4">{error}</p>
              <Button onClick={fetchAppointments}>Try Again</Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="w-16 h-16 mx-auto text-priceai-gray mb-4" />
              <h3 className="text-xl font-semibold text-priceai-dark mb-2">
                {appointments.length === 0 ? 'No Appointments Yet' : 'No Matching Appointments'}
              </h3>
              <p className="text-priceai-gray mb-4">
                {appointments.length === 0
                  ? 'Book your first appointment to get started with your healthcare journey.'
                  : 'Try adjusting your search criteria to find the appointments you\'re looking for.'
                }
              </p>
              {appointments.length === 0 && (
                <Button onClick={() => window.location.href = '/'}>
                  Browse Providers
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedAppointments.map((appointment) => (
                <Card key={appointment.appointment_id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-priceai-dark">
                              {appointment.providers.provider_name}
                            </h3>
                            <p className="text-priceai-gray text-sm">{appointment.services.service_name}</p>
                          </div>
                          {getStatusBadge(appointment.status)}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                          {/* Date & Time */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-priceai-blue flex-shrink-0" />
                            <div>
                              <div className="font-medium">
                                {new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-priceai-gray">
                                {appointment.appointment_time} {appointment.appointment_period}
                              </div>
                            </div>
                          </div>

                          {/* Location with Full Address */}
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-priceai-blue flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium">{appointment.providers.provider_address}</div>
                              <div className="text-priceai-gray">{appointment.providers.provider_city}, {appointment.providers.provider_state}</div>
                              {appointment.providers.provider_phone && (
                                <div className="flex items-center gap-1 text-priceai-gray">
                                  <Phone className="w-3 h-3" />
                                  <span>{appointment.providers.provider_phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Payment & Cost */}
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-priceai-blue flex-shrink-0" />
                            <div>
                              {appointment.insurance_plan_name ? (
                                <div>
                                  <div className="font-medium">{appointment.insurance_plan_name}</div>
                                  <div className="text-priceai-gray text-xs">{appointment.insurance_plan_type}</div>
                                </div>
                              ) : (
                                <div className="font-medium text-priceai-orange">Self Pay</div>
                              )}
                              {appointment.estimated_cost && (
                                <div className="font-semibold text-priceai-green">
                                  {formatCurrency(appointment.estimated_cost)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {appointment.notes && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-priceai-gray">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-xs text-priceai-gray text-right">
                          <div>#{appointment.appointment_id.slice(0, 8).toUpperCase()}</div>
                          <div>{appointment.appointment_type.replace('_', ' ')}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Calendar Actions for upcoming appointments */}
                          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openGoogleCalendar({
                                  appointmentId: appointment.appointment_id,
                                  patientName: appointment.patient_name,
                                  providerName: appointment.providers.provider_name,
                                  serviceName: appointment.services.service_name,
                                  appointmentDate: appointment.appointment_date,
                                  appointmentTime: appointment.appointment_time,
                                  appointmentPeriod: appointment.appointment_period,
                                  providerAddress: appointment.providers.provider_address,
                                  patientEmail: appointment.patient_email
                                })}
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                title="Add to Google Calendar"
                              >
                                <Calendar className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadICSFile({
                                  appointmentId: appointment.appointment_id,
                                  patientName: appointment.patient_name,
                                  providerName: appointment.providers.provider_name,
                                  serviceName: appointment.services.service_name,
                                  appointmentDate: appointment.appointment_date,
                                  appointmentTime: appointment.appointment_time,
                                  appointmentPeriod: appointment.appointment_period,
                                  providerAddress: appointment.providers.provider_address,
                                  patientEmail: appointment.patient_email
                                })}
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                title="Download .ics file"
                              >
                                📅
                              </Button>
                            </>
                          )}

                          {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                handleCancelAppointment(appointment.appointment_id)
                              }}
                              disabled={cancellingAppointmentId === appointment.appointment_id}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              {cancellingAppointmentId === appointment.appointment_id ? (
                                <span className="flex items-center gap-2">
                                  <div className="animate-spin w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full" />
                                  Cancelling...
                                </span>
                              ) : (
                                'Cancel'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="mt-4">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-priceai-gray">
                      Showing {startIndex + 1} to {Math.min(startIndex + appointmentsPerPage, filteredAndSortedAppointments.length)} of {filteredAndSortedAppointments.length} appointments
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                      >
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className={`h-8 w-8 p-0 ${currentPage === page ? 'bg-priceai-blue' : ''}`}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;