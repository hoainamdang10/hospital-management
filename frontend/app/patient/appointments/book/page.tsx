'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, ChevronRight, ChevronLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { getDepartments, Department } from '@/lib/api/departments.service';
import { getDoctorsByDepartment, Staff } from '@/lib/api/staff.service';
import { getAvailableSlots, TimeSlot } from '@/lib/api/availability.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { DepartmentSelector } from '@/components/appointments/DepartmentSelector';
import { DoctorSelector } from '@/components/appointments/DoctorSelector';
import { DateTimePicker } from '@/components/appointments/DateTimePicker';
import { ConfirmationStep } from '@/components/appointments/ConfirmationStep';
import { format, addDays, startOfWeek } from 'date-fns';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

/**
 * Book Appointment Page - 5 Steps
 * 1. Chọn chuyên khoa
 * 2. Chọn bác sĩ
 * 3. Chọn ngày
 * 4. Chọn giờ
 * 5. Xác nhận
 */
type ConflictSuggestion = {
  startTime: string;
  endTime: string;
  doctorId: string;
  confidence?: number;
  reason?: string;
};

type ConflictInfo = {
  message?: string;
  suggestions: ConflictSuggestion[];
};

export default function BookAppointmentPage() {
  const router = useRouter();
  const { user } = useAuth();

  // Steps
  const [step, setStep] = useState(1);

  // Step 1: Department
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Step 2: Doctor
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Staff | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Step 3 & 4: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Step 5: Additional info
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState<'CONSULTATION' | 'FOLLOW_UP'>(
    'CONSULTATION'
  );

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [conflictInfo, setConflictInfo] = useState<ConflictInfo | null>(null);

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);

  // Load doctors when department selected
  useEffect(() => {
    if (selectedDepartment) {
      loadDoctors(selectedDepartment.id);
    }
  }, [selectedDepartment]);

  // Load slots when doctor and date selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      loadAvailableSlots(selectedDoctor.staffId, selectedDate);
    }
  }, [selectedDoctor, selectedDate]);

  async function loadDepartments() {
    try {
      setLoadingDepartments(true);
      const allDepartments = await getDepartments();
      // Show all active departments
      const activeDepts = allDepartments.filter((d) => d.isActive);
      setDepartments(activeDepts);
    } catch (error) {
      console.error('Error loading departments:', error);
      toast.error('Không thể tải danh sách khoa');
    } finally {
      setLoadingDepartments(false);
    }
  }

  async function loadDoctors(departmentId: string) {
    try {
      setLoadingDoctors(true);
      const doctorsList = await getDoctorsByDepartment(departmentId, 20);
      setDoctors(doctorsList);

      if (doctorsList.length === 0) {
        toast.info('Chưa có bác sĩ trong khoa này');
      }
    } catch (error) {
      console.error('Error loading doctors:', error);
      toast.error('Không thể tải danh sách bác sĩ');
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }

  async function loadAvailableSlots(doctorId: string, date: Date) {
    try {
      setLoadingSlots(true);
      const dateStr = format(date, 'yyyy-MM-dd');
      const response = await getAvailableSlots(doctorId, dateStr, 30);

      if (response.success) {
        setAvailableSlots(response.data.availableSlots);
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
    console.log('[BookAppointment] handleSubmit called', {
      user,
      hasPatientId: !!user?.patientId,
      patientId: user?.patientId,
      userId: user?.userId,
      role: user?.role,
    });

    if (!user?.patientId || !selectedDoctor || !selectedDate || !selectedTime) {
      if (!user?.patientId) {
        console.error('[BookAppointment] Missing patientId!', { user });
        toast.error('Không tìm thấy thông tin bệnh nhân. Vui lòng cập nhật hồ sơ cá nhân.');
        return;
      }
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      setConflictInfo(null);

      // Ensure time format is HH:MM:SS
      let appointmentTime =
        selectedTime.formattedTime || format(new Date(selectedTime.startTime), 'HH:mm:ss');
      // Add seconds if missing (09:00 -> 09:00:00)
      if (appointmentTime.length === 5) {
        appointmentTime = `${appointmentTime}:00`;
      }

      const response = await appointmentsService.schedule({
        patientId: user.patientId, // PAT-202511-XXX format
        doctorId: selectedDoctor.staffId,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        appointmentTime,
        appointmentType,
        reason: reason || 'Khám bệnh',
        consultationFee: selectedDoctor.consultationFee || 500000,
      });

      toast.success('Đặt lịch thành công!');

      // Redirect to payment pending page with payment link info
      const params = new URLSearchParams({
        appointmentId: response.appointmentId,
      });

      if (response.paymentLink) {
        params.append('paymentLink', response.paymentLink);
      }

      if (response.invoiceId) {
        params.append('invoiceId', response.invoiceId);
      }

      if (response.appointment?.paymentDeadline) {
        params.append('paymentDeadline', response.appointment.paymentDeadline);
      }

      router.push(`/patient/appointments/payment-pending?${params.toString()}`);
    } catch (error) {
      console.error('Error booking appointment:', error);
      const axiosError = error as AxiosError<any>;
      const apiError = axiosError.response?.data;

      if (apiError?.errors?.includes('DOUBLE_BOOKING_DETECTED')) {
        setConflictInfo({
          message: apiError?.conflictInfo?.message || apiError?.message,
          suggestions: apiError?.conflictInfo?.suggestions || [],
        });
        setStep(4);
        toast.error(apiError?.message || 'Bác sĩ đã có lịch vào thời gian này.');
        return;
      }

      toast.error(apiError?.message || 'Đặt lịch thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleSuggestionSelect(suggestion: ConflictSuggestion) {
    try {
      const start = new Date(suggestion.startTime);
      const end = new Date(suggestion.endTime);

      if (suggestion.doctorId && selectedDoctor?.staffId !== suggestion.doctorId) {
        const suggestedDoctor = doctors.find((doc) => doc.staffId === suggestion.doctorId);
        if (suggestedDoctor) {
          setSelectedDoctor(suggestedDoctor);
        }
      }

      setSelectedDate(start);
      setSelectedTime({
        startTime: format(start, 'HH:mm:ss'),
        endTime: format(end, 'HH:mm:ss'),
        isAvailable: true,
      });
      setConflictInfo(null);
      setStep(5);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      toast.error('Không thể áp dụng gợi ý. Vui lòng chọn thời gian khác.');
    }
  }

  const handleNext = () => {
    if (step === 1 && !selectedDepartment) {
      toast.error('Vui lòng chọn chuyên khoa');
      return;
    }
    if (step === 2 && !selectedDoctor) {
      toast.error('Vui lòng chọn bác sĩ');
      return;
    }
    if (step === 3 && !selectedDate) {
      toast.error('Vui lòng chọn ngày khám');
      return;
    }
    if (step === 4 && !selectedTime) {
      toast.error('Vui lòng chọn giờ khám');
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Đặt lịch khám</h1>
          <p className="mt-2 text-gray-600">Chọn chuyên khoa, bác sĩ và thời gian phù hợp</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          <StepIndicator number={1} title="Chuyên khoa" active={step === 1} completed={step > 1} />
          <div className="mx-2 h-0.5 flex-1 bg-gray-200" />
          <StepIndicator number={2} title="Bác sĩ" active={step === 2} completed={step > 2} />
          <div className="mx-2 h-0.5 flex-1 bg-gray-200" />
          <StepIndicator number={3} title="Ngày khám" active={step === 3} completed={step > 3} />
          <div className="mx-2 h-0.5 flex-1 bg-gray-200" />
          <StepIndicator number={4} title="Giờ khám" active={step === 4} completed={step > 4} />
          <div className="mx-2 h-0.5 flex-1 bg-gray-200" />
          <StepIndicator number={5} title="Xác nhận" active={step === 5} completed={false} />
        </div>

        {/* Content */}
        <div className="min-h-[500px] rounded-2xl border bg-white p-8 shadow-sm">
          {/* Step 1: Choose Department */}
          {step === 1 && (
            <>
              <DepartmentSelector
                departments={departments}
                selectedDepartment={selectedDepartment}
                onSelect={setSelectedDepartment}
                loading={loadingDepartments}
              />
              <div className="flex justify-end pt-6">
                <Button onClick={handleNext} disabled={!selectedDepartment}>
                  Tiếp tục
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Choose Doctor */}
          {step === 2 && (
            <>
              <DoctorSelector
                doctors={doctors}
                selectedDoctor={selectedDoctor}
                onSelect={setSelectedDoctor}
                loading={loadingDoctors}
              />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button onClick={handleNext} disabled={!selectedDoctor}>
                  Tiếp tục
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {/* Step 3 & 4: Choose Date & Time */}
          {(step === 3 || step === 4) && (
            <>
              <DateTimePicker
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                availableSlots={availableSlots}
                onSelectDate={setSelectedDate}
                onSelectTime={setSelectedTime}
                loading={loadingSlots}
                weekStart={weekStart}
                onPrevWeek={() => setWeekStart(addDays(weekStart, -7))}
                onNextWeek={() => setWeekStart(addDays(weekStart, 7))}
              />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button onClick={handleNext} disabled={step === 3 ? !selectedDate : !selectedTime}>
                  {step === 4 ? 'Xem xác nhận' : 'Tiếp tục'}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {conflictInfo && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="font-semibold text-red-700">
                          {conflictInfo.message || 'Bác sĩ đã có lịch hẹn tại thời điểm này.'}
                        </p>
                        <p className="text-sm text-red-600">
                          Vui lòng chọn khung giờ khác hoặc dùng một trong các gợi ý dưới đây.
                        </p>
                      </div>
                      {conflictInfo.suggestions && conflictInfo.suggestions.length > 0 ? (
                        <div className="grid gap-2 md:grid-cols-2">
                          {conflictInfo.suggestions.slice(0, 4).map((suggestion, index) => (
                            <button
                              key={`${suggestion.startTime}-${index}`}
                              type="button"
                              onClick={() => handleSuggestionSelect(suggestion)}
                              className="flex flex-col rounded-md border border-red-100 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:border-red-300"
                            >
                              <span className="font-semibold text-gray-900">
                                {format(new Date(suggestion.startTime), 'HH:mm')} -{' '}
                                {format(new Date(suggestion.endTime), 'HH:mm')}
                              </span>
                              {suggestion.reason && (
                                <span className="text-xs text-gray-500">{suggestion.reason}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Không có gợi ý tự động. Vui lòng chọn khung giờ khác.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && selectedDepartment && selectedDoctor && selectedDate && selectedTime && (
            <>
              <ConfirmationStep
                department={selectedDepartment}
                doctor={selectedDoctor}
                date={selectedDate}
                time={selectedTime}
                reason={reason}
                appointmentType={appointmentType}
                onReasonChange={setReason}
                onTypeChange={setAppointmentType}
              />
              <div className="flex justify-between pt-6">
                <Button variant="outline" onClick={handleBack} disabled={submitting}>
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đặt lịch...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Xác nhận đặt lịch
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Step Indicator Component
function StepIndicator({
  number,
  title,
  active,
  completed,
}: {
  number: number;
  title: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-all ${active
            ? 'border-primary bg-primary scale-110 text-white'
            : completed
              ? 'border-primary bg-primary text-white'
              : 'border-gray-300 bg-white text-gray-500'
          }`}
      >
        {completed ? <Check className="h-5 w-5" /> : number}
      </div>
      <span className={`mt-2 text-xs font-medium ${active ? 'text-primary' : 'text-gray-600'}`}>
        {title}
      </span>
    </div>
  );
}
