'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Calendar, Clock, ArrowLeft, Loader2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { appointmentsService } from '@/lib/api/appointments.service';
import {
  getAvailableSlots,
  getProviderSchedule,
  ProviderSchedule,
  TimeSlot,
} from '@/lib/api/availability.service';
import { AppointmentReadModel } from '@/lib/types/appointments';
import { format, parseISO, addDays, startOfWeek, differenceInMinutes } from 'date-fns';
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
  const [reason, setReason] = useState('Đổi lịch hẹn');
  const [policyInfo, setPolicyInfo] = useState<{
    feeApplied: boolean;
    amount: number;
    hoursNotice: number;
  } | null>(null);
  const [providerSchedule, setProviderSchedule] = useState<ProviderSchedule | null>(null);
  const defaultWorkingDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

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

  // Nếu chọn phải ngày bác sĩ không làm, reset slots/time
  useEffect(() => {
    if (selectedDate && !isWorkingDay(selectedDate)) {
      setSelectedTime(null);
      setAvailableSlots([]);
    }
  }, [selectedDate, providerSchedule]);

  async function loadAppointment() {
    try {
      setLoading(true);
      const data = await appointmentsService.getById(appointmentId);
      setAppointment(data);
      try {
        const schedule = await getProviderSchedule(data.doctorId);
        if (schedule?.success) {
          const normalizedWorkingDays =
            schedule.data?.workingDays?.map((day) => day.toUpperCase?.() ?? day) ??
            defaultWorkingDays;
          setProviderSchedule({
            ...schedule.data,
            workingDays: normalizedWorkingDays,
          });
        }
      } catch (err) {
        // Nếu API schedule chưa có, fallback Mon-Fri để ẩn slot cuối tuần
        setProviderSchedule({
          providerId: data.doctorId,
          workingDays: defaultWorkingDays,
          workingHours: { start: '08:00', end: '17:00' },
        });
      }

      // Pre-select current date
      const currentDate = parseISO(data.appointmentDate);
      setSelectedDate(currentDate);

      // Precompute reschedule policy based on notice window
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      const minutesNotice = differenceInMinutes(appointmentDateTime, new Date());
      const hoursNotice = Math.max(0, Math.round((minutesNotice / 60) * 100) / 100);

      let feeApplied = false;
      let amount = 0;

      if (hoursNotice < 24 && hoursNotice >= 4) {
        feeApplied = true;
        amount = 30000;
      } else if (hoursNotice < 4) {
        feeApplied = true;
        amount = 50000;
      }

      setPolicyInfo({ feeApplied, amount, hoursNotice });
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
        // API responses may return `availableSlots` or `slots` depending on endpoint
        const slots = response.data?.availableSlots ?? response.data?.slots ?? [];

        // Chuẩn hóa time hiển thị từ appointmentTime/formattedTime để tránh lệch timezone
        const normalizedSlots = slots.map((slot) => {
          const appointmentTime =
            (slot as any).appointmentTime ?? (slot as any).formattedTime ?? null;
          // Nếu startTime là ISO, lấy phần HH:mm:ss để tránh chuyển đổi timezone khi submit
          const iso = (slot as any).startTime;
          const isoTime =
            typeof iso === 'string' && iso.includes('T')
              ? iso.split('T')[1]?.split('.')[0]?.split('Z')[0]
              : undefined;
          const normalizedTime = appointmentTime || isoTime;
          return {
            ...slot,
            appointmentTime: normalizedTime,
          };
        });

        // Chỉ giữ slot cách nhau 60 phút (minute = 0) dựa trên appointmentTime (chuỗi HH:mm:ss)
        const hourlySlots = normalizedSlots.filter((slot) => {
          const timeStr = slot.appointmentTime ?? slot.startTime;
          const minute = Number(timeStr?.split(':')[1] ?? 0);
          return minute === 0;
        });

        setAvailableSlots(hourlySlots);
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
      const targetId =
        (appointment as any).appointment_id || (appointment as any).appointmentId || appointment.id;
      // Ưu tiên appointmentTime đã chuẩn hóa HH:mm:ss; nếu ISO thì tách HH:mm:ss để không shift timezone
      const slotTime =
        selectedTime.appointmentTime ||
        (typeof selectedTime.startTime === 'string' && selectedTime.startTime.includes('T')
          ? selectedTime.startTime.split('T')[1]?.split('.')[0]?.split('Z')[0]
          : selectedTime.startTime);
      await appointmentsService.reschedule(targetId, {
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        appointmentTime: slotTime,
        reason: reason || 'Đổi lịch hẹn',
      });

      toast.success('Đổi lịch hẹn thành công!');
      if (policyInfo?.feeApplied) {
        toast.info(
          `Phí đổi lịch dự kiến: ${policyInfo.amount.toLocaleString('vi-VN')} ₫ sẽ được áp dụng`
        );
      }
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
  const dayKey = (date: Date) =>
    ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];
  const isWorkingDay = (date: Date | null) =>
    !date ? true : (providerSchedule?.workingDays ?? defaultWorkingDays).includes(dayKey(date));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
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
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={`/patient/appointments/${appointment.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Đổi lịch hẹn</h1>
            <p className="mt-1 text-gray-600">Chọn ngày và giờ khám mới</p>
          </div>
        </div>

        {/* Current Appointment Info */}
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6">
          <h3 className="mb-3 font-semibold text-blue-900">Thông tin lịch hẹn hiện tại</h3>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
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

        {/* Policy info */}
        {policyInfo && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mt-0.5 text-amber-500">
              <Info className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-amber-800">Chính sách đổi lịch</p>
              <p className="mt-1 text-sm text-amber-700">
                Thời gian báo trước: ~{policyInfo.hoursNotice.toFixed(1)} giờ.
                {policyInfo.feeApplied
                  ? ` Phí đổi lịch dự kiến: ${policyInfo.amount.toLocaleString('vi-VN')} ₫.`
                  : ' Miễn phí đổi lịch cho khung giờ này.'}
              </p>
              {policyInfo.feeApplied && (
                <p className="mt-1 text-sm text-amber-600">
                  Phí sẽ được lập hóa đơn sau khi bạn xác nhận đổi lịch.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="space-y-6 rounded-xl border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Chọn ngày khám mới</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart(addDays(weekStart, -7))}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              <button
                onClick={() => setWeekStart(addDays(weekStart, 7))}
                className="rounded-lg p-2 transition-colors hover:bg-gray-100"
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day, index) => {
              const isSelected =
                selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
              const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              const isPast = day < today && !isToday;
              const working = isWorkingDay(day);

              return (
                <button
                  key={index}
                  onClick={() => !isPast && working && setSelectedDate(day)}
                  disabled={isPast || !working}
                  className={`flex flex-col items-center rounded-xl p-4 transition-all ${
                    isSelected
                      ? 'bg-primary scale-105 text-white shadow-lg'
                      : isToday
                        ? 'border-2 border-blue-200 bg-blue-50 text-blue-600'
                        : isPast
                          ? 'cursor-not-allowed bg-gray-50 text-gray-300'
                          : working
                            ? 'bg-gray-50 text-gray-700 hover:scale-105 hover:bg-gray-100'
                            : 'cursor-not-allowed bg-gray-50 text-gray-300'
                  }`}
                >
                  <span className="mb-1 text-xs font-medium uppercase">
                    {format(day, 'EEE', { locale: vi })}
                  </span>
                  <span className="text-2xl font-bold">{format(day, 'd')}</span>
                  <span className="mt-1 text-xs">{format(day, 'MMM', { locale: vi })}</span>
                  {isToday && !isSelected && (
                    <span className="mt-1 text-xs font-medium">Hôm nay</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-6 rounded-xl border bg-white p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Chọn giờ khám mới</h3>
            </div>

            {loadingSlots ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-primary h-8 w-8 animate-spin" />
                <span className="ml-3 text-gray-600">Đang tải lịch trống...</span>
              </div>
            ) : !isWorkingDay(selectedDate) ? (
              <div className="rounded-xl bg-gray-50 py-12 text-center">
                <p className="text-gray-500">Bác sĩ không làm việc ngày này</p>
                <p className="mt-2 text-sm text-gray-400">Vui lòng chọn ngày khác</p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="rounded-xl bg-gray-50 py-12 text-center">
                <p className="text-gray-500">Không có lịch trống trong ngày này</p>
                <p className="mt-2 text-sm text-gray-400">Vui lòng chọn ngày khác</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
                {availableSlots.map((slot, index) => {
                  const isSelected = selectedTime?.startTime === slot.startTime;
                  const isAvailable = slot.isAvailable;
                  const displayStart =
                    slot.appointmentTime?.slice(0, 5) ??
                    slot.formattedTime ??
                    format(new Date(slot.startTime), 'HH:mm');

                  return (
                    <button
                      key={index}
                      onClick={() => isAvailable && setSelectedTime(slot)}
                      disabled={!isAvailable}
                      className={`rounded-xl border-2 p-4 font-medium transition-all ${
                        isSelected
                          ? 'border-primary bg-primary scale-105 text-white shadow-md'
                          : isAvailable
                            ? 'hover:border-primary hover:bg-primary-50 border-gray-200 hover:scale-105'
                            : 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-300'
                      }`}
                    >
                      <div className="text-lg">{displayStart}</div>
                      {!isAvailable && <div className="mt-1 text-xs">Đã đầy</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Reason */}
        {selectedDate && selectedTime && (
          <div className="space-y-4 rounded-xl border bg-white p-6">
            <label className="block text-sm font-medium text-gray-700">
              Lý do đổi lịch <span className="text-gray-400">(Tùy chọn)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="focus:border-primary focus:ring-primary-100 w-full rounded-xl border border-gray-300 p-4 focus:ring-2 focus:outline-none"
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
          <Button onClick={handleSubmit} disabled={!selectedDate || !selectedTime || submitting}>
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
