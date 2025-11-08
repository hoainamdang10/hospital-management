'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import { getAvailableSlots, TimeSlot } from '@/lib/api/availability.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { format, parseISO, addDays, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';

/**
 * Reschedule Appointment Page
 * Route: /patient/appointments/:id/reschedule
 */
export default function RescheduleAppointmentPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<AppointmentReadModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Date & Time selection
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (appointmentId) {
      loadAppointment();
    }
  }, [appointmentId]);

  useEffect(() => {
    if (appointment && selectedDate) {
      loadAvailableSlots(appointment.doctorId, selectedDate);
    }
  }, [appointment, selectedDate]);

  async function loadAppointment() {
    try {
      setLoading(true);
      const data = await appointmentsService.getById(appointmentId);
      setAppointment(data);
      
      // Pre-select current date
      const currentDate = parseISO(data.appointmentDate);
      setSelectedDate(currentDate);
    } catch (error) {
      console.error('Error loading appointment:', error);
      toast.error('Không thể tải thông tin lịch hẹn');
      router.push('/patient/appointments');
    } finally {
      setLoading(false);
    }
  }

  async function loadAvailableSlots(doctorId: string, date: Date) {
    try {
      setLoadingSlots(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await getAvailableSlots(doctorId, dateStr, 30);
      
      if (response.success) {
        setAvailableSlots(response.data.slots);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      toast.error('Không thể tải lịch trống');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit() {
    if (!appointment || !selectedDate || !selectedTime) {
      toast.error('Vui lòng chọn ngày và giờ khám mới');
      return;
    }

    try {
      setSubmitting(true);
      await appointmentsService.reschedule(appointment.id, {
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        appointmentTime: selectedTime.startTime,
        reason: reason || 'Đổi lịch hẹn',
      });

      toast.success('Đổi lịch hẹn thành công!');
      router.push(`/patient/appointments/${appointment.id}`);
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      toast.error('Đổi lịch thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải thông tin...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!appointment) {
    return null;
  }

  const currentDate = parseISO(appointment.appointmentDate);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/patient/appointments/${appointment.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đổi lịch hẹn</h1>
            <p className="text-gray-600 mt-1">Chọn ngày và giờ khám mới</p>
          </div>
        </div>

        {/* Current Appointment Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-3">Thông tin lịch hẹn hiện tại</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-blue-600">Bác sĩ</p>
              <p className="font-semibold text-blue-900">BS. {appointment.doctorName}</p>
            </div>
            <div>
              <p className="text-blue-600">Ngày khám</p>
              <p className="font-semibold text-blue-900 capitalize">
                {format(currentDate, 'dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
            <div>
              <p className="text-blue-600">Giờ khám</p>
              <p className="font-semibold text-blue-900">{appointment.appointmentTime}</p>
            </div>
          </div>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-xl border p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Chọn ngày khám mới</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              const isPast = day < today && !isToday;

              return (
                <button
                  key={index}
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast}
                  className={`flex flex-col items-center rounded-xl p-4 transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : isToday
                      ? 'bg-blue-50 text-blue-600 border-2 border-blue-200'
                      : isPast
                      ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                  }`}
                >
                  <span className="text-xs font-medium mb-1 uppercase">
                    {format(day, 'EEE', { locale: vi })}
                  </span>
                  <span className="text-2xl font-bold">{format(day, 'd')}</span>
                  <span className="text-xs mt-1">
                    {format(day, 'MMM', { locale: vi })}
                  </span>
                  {isToday && !isSelected && (
                    <span className="text-xs mt-1 font-medium">Hôm nay</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Chọn giờ khám mới</h3>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-gray-600">Đang tải lịch trống...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">Không có lịch trống trong ngày này</p>
                <p className="text-sm text-gray-400 mt-2">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {availableSlots.map((slot, index) => {
                  const isSelected = selectedTime?.startTime === slot.startTime;
                  const isAvailable = slot.isAvailable;

                  return (
                    <button
                      key={index}
                      onClick={() => isAvailable && setSelectedTime(slot)}
                      disabled={!isAvailable}
                      className={`p-4 rounded-xl border-2 transition-all font-medium ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-md scale-105'
                          : isAvailable
                          ? 'border-gray-200 hover:border-primary hover:bg-primary-50 hover:scale-105'
                          : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-lg">{slot.startTime}</div>
                      {!isAvailable && (
                        <div className="text-xs mt-1">Đã đầy</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        {selectedDate && selectedTime && (
          <div className="bg-white rounded-xl border p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Lý do đổi lịch <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-300 p-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
              placeholder="Nhập lý do đổi lịch hẹn..."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between gap-4">
          <Link href={`/patient/appointments/${appointment.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Hủy bỏ
            </Button>
          </Link>
          <Button
            onClick={handleSubmit}
            disabled={!selectedDate || !selectedTime || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Xác nhận đổi lịch
              </>
            )}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
