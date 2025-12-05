'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  Wallet,
  Stethoscope,
  User,
  Clock,
  CreditCard,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { getDepartments, Department } from '@/lib/api/departments.service';
import { getDoctorsByDepartment, Staff } from '@/lib/api/staff.service';
import { getAvailableSlots, TimeSlot } from '@/lib/api/availability.service';
import { appointmentsService } from '@/lib/api/appointments.service';
import { billingService } from '@/modules/billing/services/billing.service';
import { DepartmentSelector } from '@/components/appointments/DepartmentSelector';
import { DoctorSelector } from '@/components/appointments/DoctorSelector';
import { DateTimePicker } from '@/components/appointments/DateTimePicker';
import { ConfirmationStep } from '@/components/appointments/ConfirmationStep';
import { format, addDays, startOfWeek } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';
import { cn, formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Book Appointment Page - 4 Steps (Refactored)
 * 1. Chọn chuyên khoa
 * 2. Chọn bác sĩ
 * 3. Chọn thời gian (Ngày & Giờ)
 * 4. Xác nhận & Thanh toán
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
  const walletPatientId = user?.internalPatientId || user?.patientId || user?.id || null;
  const {
    account: walletAccount,
    isLoading: isWalletLoading,
    error: walletError,
    reload: reloadWallet,
  } = useWallet(walletPatientId);

  const waitForInvoiceId = useCallback(
    async (appointmentId: string, attempts = 6, delayMs = 800) => {
      if (!walletPatientId) return null;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        try {
          const invoices = await billingService.getPatientInvoices(walletPatientId);
          const targetInvoice = invoices.find((invoice) => invoice.appointmentId === appointmentId);
          if (targetInvoice) {
            return targetInvoice.id;
          }
        } catch (error) {
          console.error(
            '[BookAppointment] Failed to fetch invoices while waiting for invoiceId:',
            error
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return null;
    },
    [walletPatientId]
  );

  // Steps
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for back

  // Step 1: Department
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  // Step 2: Doctor
  const [doctors, setDoctors] = useState<Staff[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Staff | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Step 3: Date & Time
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Step 4: Additional info
  const [reason, setReason] = useState('');
  const [appointmentType, setAppointmentType] = useState<'CONSULTATION' | 'FOLLOW_UP'>(
    'CONSULTATION'
  );
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'wallet'>('online');

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

  const consultationFee = selectedDoctor?.consultationFee || 0;

  async function handleSubmit() {
    if (!user?.patientId || !selectedDoctor || !selectedDate || !selectedTime) {
      if (!user?.patientId) {
        toast.error('Không tìm thấy thông tin bệnh nhân. Vui lòng cập nhật hồ sơ cá nhân.');
        return;
      }
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      setConflictInfo(null);

      let appointmentTime =
        selectedTime.formattedTime || format(new Date(selectedTime.startTime), 'HH:mm:ss');
      if (appointmentTime.length === 5) {
        appointmentTime = `${appointmentTime}:00`;
      }

      const response = await appointmentsService.schedule({
        patientId: user.patientId,
        doctorId: selectedDoctor.staffId,
        appointmentDate: format(selectedDate, 'yyyy-MM-dd'),
        appointmentTime,
        appointmentType,
        reason: reason || 'Khám bệnh',
        consultationFee: selectedDoctor.consultationFee || 500000,
      });

      toast.success('Đặt lịch thành công!');

      const wantsWalletPayment = paymentMethod === 'wallet';
      if (wantsWalletPayment) {
        let targetInvoiceId = response.invoiceId;
        if (!targetInvoiceId) {
          toast.loading('Đang tìm hóa đơn để trừ ví...', { id: 'wallet-invoice-wait' });
          targetInvoiceId = await waitForInvoiceId(response.appointmentId);
          toast.dismiss('wallet-invoice-wait');
        }

        if (!walletAccount) {
          toast.error('Không tìm thấy thông tin ví. Vui lòng chọn phương thức khác.');
        } else if (walletAccount.balance < consultationFee) {
          toast.error('Số dư ví không đủ để thanh toán lịch hẹn này.');
        } else if (!targetInvoiceId) {
          toast.error('Không tìm thấy hóa đơn để trừ ví. Vui lòng thanh toán trực tuyến.');
        } else {
          try {
            await billingService.payInvoiceWithWallet(targetInvoiceId, {
              description: `Thanh toán lịch hẹn ${response.appointmentId} bằng ví`,
            });
            toast.success('Đã thanh toán bằng ví. Lịch hẹn được xác nhận.');
            await reloadWallet?.();
            router.push(`/patient/appointments/${response.appointmentId}`);
            return;
          } catch (walletPaymentError) {
            console.error('Wallet payment failed:', walletPaymentError);
            const message =
              (walletPaymentError as any)?.response?.data?.message ||
              (walletPaymentError as Error)?.message ||
              'Thanh toán ví thất bại. Vui lòng thử lại hoặc chọn phương thức khác.';
            toast.error(message);
          }
        }
      }

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
        setStep(3); // Go back to Time selection
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
      setStep(4); // Go to Confirmation
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
    if (step === 3 && (!selectedDate || !selectedTime)) {
      toast.error('Vui lòng chọn ngày và giờ khám');
      return;
    }
    setDirection(1);
    setStep(step + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep(step - 1);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : -20,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 20 : -20,
      opacity: 0,
    }),
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Đặt lịch khám</h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Đặt lịch khám nhanh chóng, tiện lợi với đội ngũ bác sĩ chuyên khoa hàng đầu
          </p>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10" />
          <div className="flex justify-between max-w-3xl mx-auto px-4">
            <StepIndicator number={1} title="Chuyên khoa" active={step === 1} completed={step > 1} />
            <StepIndicator number={2} title="Bác sĩ" active={step === 2} completed={step > 2} />
            <StepIndicator number={3} title="Thời gian" active={step === 3} completed={step > 3} />
            <StepIndicator number={4} title="Xác nhận" active={step === 4} completed={false} />
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[500px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Step 1: Choose Department */}
              {step === 1 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <DepartmentSelector
                    departments={departments}
                    selectedDepartment={selectedDepartment}
                    onSelect={(dept) => {
                      setSelectedDepartment(dept);
                      // Optional: Auto advance? No, let user confirm visually first
                    }}
                    loading={loadingDepartments}
                  />
                  <div className="flex justify-end pt-8 mt-4 border-t border-slate-100">
                    <Button
                      onClick={handleNext}
                      disabled={!selectedDepartment}
                      className="px-8 h-12 rounded-xl text-base font-medium shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      Tiếp tục
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Doctor */}
              {step === 2 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                  <DoctorSelector
                    doctors={doctors}
                    selectedDoctor={selectedDoctor}
                    onSelect={setSelectedDoctor}
                    loading={loadingDoctors}
                  />
                  <div className="flex justify-between pt-8 mt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={handleBack} className="h-12 px-6 rounded-xl hover:bg-slate-100">
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Quay lại
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!selectedDoctor}
                      className="px-8 h-12 rounded-xl text-base font-medium shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      Tiếp tục
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Choose Date & Time */}
              {step === 3 && (
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
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

                  {conflictInfo && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-red-100 rounded-full">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <p className="font-bold text-red-800 text-lg">
                              {conflictInfo.message || 'Bác sĩ đã có lịch hẹn tại thời điểm này.'}
                            </p>
                            <p className="text-red-600 mt-1">
                              Vui lòng chọn khung giờ khác hoặc dùng một trong các gợi ý dưới đây.
                            </p>
                          </div>
                          {conflictInfo.suggestions && conflictInfo.suggestions.length > 0 ? (
                            <div className="grid gap-3 md:grid-cols-2">
                              {conflictInfo.suggestions.slice(0, 4).map((suggestion, index) => (
                                <button
                                  key={`${suggestion.startTime}-${index}`}
                                  type="button"
                                  onClick={() => handleSuggestionSelect(suggestion)}
                                  className="flex flex-col rounded-xl border border-red-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-red-400 hover:shadow-md"
                                >
                                  <span className="font-bold text-gray-900 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-red-500" />
                                    {format(new Date(suggestion.startTime), 'HH:mm')} -{' '}
                                    {format(new Date(suggestion.endTime), 'HH:mm')}
                                  </span>
                                  {suggestion.reason && (
                                    <span className="text-xs text-gray-500 mt-1">{suggestion.reason}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600 italic">
                              Không có gợi ý tự động. Vui lòng chọn khung giờ khác.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-8 mt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={handleBack} className="h-12 px-6 rounded-xl hover:bg-slate-100">
                      <ChevronLeft className="mr-2 h-5 w-5" />
                      Quay lại
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!selectedDate || !selectedTime}
                      className="px-8 h-12 rounded-xl text-base font-medium shadow-lg shadow-emerald-500/20 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      Xem xác nhận
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && selectedDepartment && selectedDoctor && selectedDate && selectedTime && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Form & Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
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
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                      <PaymentMethodSelector
                        walletAccount={walletAccount}
                        isWalletLoading={isWalletLoading}
                        walletError={walletError}
                        selectedMethod={paymentMethod}
                        onSelect={setPaymentMethod}
                        consultationFee={consultationFee}
                      />
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="ghost" onClick={handleBack} disabled={submitting} className="h-12 px-6 rounded-xl hover:bg-slate-100">
                        <ChevronLeft className="mr-2 h-5 w-5" />
                        Quay lại
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Sticky Summary */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-6 space-y-6">
                      <div className="bg-white rounded-3xl p-6 shadow-lg shadow-emerald-900/5 border border-emerald-100 overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

                        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-emerald-600" />
                          Tóm tắt lịch hẹn
                        </h3>

                        <div className="space-y-6 relative z-10">
                          {/* Doctor Info */}
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                              {selectedDoctor.personalInfo?.fullName?.split(' ').pop()?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-slate-500 font-medium">Bác sĩ phụ trách</p>
                              <p className="font-bold text-slate-900 text-base">
                                BS. {selectedDoctor.personalInfo?.fullName}
                              </p>
                              <p className="text-sm text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-1">
                                {selectedDepartment.nameVi}
                              </p>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100" />

                          {/* Time Info */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-5 w-5 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Ngày khám</p>
                                <p className="font-semibold text-slate-900">
                                  {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Clock className="h-5 w-5 text-slate-400" />
                              <div>
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Giờ khám</p>
                                <p className="font-semibold text-slate-900">
                                  {selectedTime.formattedTime || format(new Date(selectedTime.startTime), 'HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="h-px bg-slate-100" />

                          {/* Price */}
                          <div className="flex items-end justify-between">
                            <p className="text-slate-600 font-medium">Tổng phí khám</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatCurrency(consultationFee)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-emerald-600/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Đang xử lý...
                          </>
                        ) : (
                          <>
                            Xác nhận đặt lịch
                            <Check className="ml-2 h-5 w-5" />
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-center text-gray-400">
                        Bằng việc xác nhận, bạn đồng ý với quy định đặt lịch của chúng tôi.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
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
    <div className="flex flex-col items-center relative z-10">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${active
          ? 'border-emerald-600 bg-emerald-600 text-white scale-110 shadow-lg shadow-emerald-500/30'
          : completed
            ? 'border-emerald-600 bg-white text-emerald-600'
            : 'border-slate-200 bg-white text-slate-300'
          }`}
      >
        {completed ? <Check className="h-5 w-5" /> : number}
      </div>
      <span
        className={`mt-2 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${active ? 'text-emerald-700' : completed ? 'text-emerald-600' : 'text-slate-400'
          }`}
      >
        {title}
      </span>
    </div>
  );
}

interface PaymentMethodSelectorProps {
  walletAccount: { balance: number; currency: string } | null;
  isWalletLoading: boolean;
  walletError: string | null;
  selectedMethod: 'online' | 'wallet';
  onSelect: (method: 'online' | 'wallet') => void;
  consultationFee: number;
}

function PaymentMethodSelector({
  walletAccount,
  isWalletLoading,
  walletError,
  selectedMethod,
  onSelect,
  consultationFee,
}: PaymentMethodSelectorProps) {
  const walletBalance = walletAccount?.balance ?? 0;
  const walletCurrency = walletAccount?.currency ?? 'VND';
  const walletDisabled =
    Boolean(walletError) || isWalletLoading || walletBalance < consultationFee || !walletAccount;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Phương thức thanh toán</h2>
          <p className="text-sm text-slate-500">Chọn cách bạn muốn thanh toán cho lịch hẹn này</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PaymentMethodOption
          title="Thanh toán trực tuyến"
          description="Thanh toán qua PayOS/VNPAY. Nhận liên kết thanh toán ngay sau khi đặt lịch."
          selected={selectedMethod === 'online'}
          onClick={() => onSelect('online')}
          icon={<CreditCard className="h-6 w-6 text-teal-600" />}
        />
        <PaymentMethodOption
          title="Dùng số dư ví"
          description={
            walletAccount
              ? `Số dư: ${formatCurrency(walletBalance)}`
              : 'Yêu cầu tài khoản ví đang hoạt động'
          }
          selected={selectedMethod === 'wallet'}
          onClick={() => !walletDisabled && onSelect('wallet')}
          disabled={walletDisabled}
          icon={<Wallet className="h-6 w-6 text-emerald-600" />}
          extraInfo={
            !walletAccount
              ? 'Không tìm thấy ví'
              : walletBalance < consultationFee
                ? 'Số dư không đủ'
                : undefined
          }
        />
      </div>
      {walletError && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
          Không thể tải thông tin ví: {walletError}. Bạn có thể chọn thanh toán trực tuyến thay thế.
        </p>
      )}
    </div>
  );
}

interface PaymentMethodOptionProps {
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
  extraInfo?: string;
}

function PaymentMethodOption({
  title,
  description,
  selected,
  disabled,
  onClick,
  icon,
  extraInfo,
}: PaymentMethodOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex flex-col p-6 rounded-2xl border-2 text-left transition-all duration-200 outline-none',
        selected
          ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-1 ring-emerald-600'
          : 'border-slate-100 bg-white hover:border-emerald-200 hover:shadow-lg hover:-translate-y-0.5',
        disabled && 'cursor-not-allowed opacity-60 hover:border-slate-100 hover:shadow-none hover:translate-y-0 bg-slate-50'
      )}
    >
      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl transition-colors ${selected ? 'bg-emerald-100' : 'bg-slate-100'}`}>
          {icon}
        </div>
        <div>
          <p className={`font-bold text-lg ${selected ? 'text-emerald-900' : 'text-slate-900'}`}>{title}</p>
        </div>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">{description}</p>

      {extraInfo && <p className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md inline-block mb-2">{extraInfo}</p>}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/50 w-full">
        <span className={`text-sm font-semibold ${selected ? 'text-emerald-600' : 'text-slate-400'}`}>
          {selected ? 'Đang chọn' : disabled ? 'Không khả dụng' : 'Chọn phương thức này'}
        </span>
        {selected && (
          <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}
