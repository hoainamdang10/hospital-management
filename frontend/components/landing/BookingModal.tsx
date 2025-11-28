'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingSchema, type BookingFormData } from '@/lib/schemas/booking';
import { useScheduleAppointment } from '@/lib/hooks/useAppointments';
import { getAvailableSlots, type TimeSlot } from '@/lib/api/availability.service';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoctor?: {
    id: string;
    name: string;
    hospital: string;
  } | null;
}

export function BookingModal({ isOpen, onClose, selectedDoctor }: BookingModalProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const scheduleAppointment = useScheduleAppointment();
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      doctorId: selectedDoctor?.id || '',
    },
  });

  const watchedDate = watch('date');
  const watchedDoctorId = watch('doctorId');

  async function loadSlots() {
    try {
      const providerId = watchedDoctorId || selectedDoctor?.id;
      if (!providerId || !watchedDate) {
        setSlots([]);
        return;
      }
      const resp = await getAvailableSlots(providerId, watchedDate, 30);
      setSlots(resp?.data?.availableSlots || []);
    } catch (error) {
      console.error('Error loading slots', error);
      setSlots([]);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    loadSlots();
  }, [isOpen, watchedDoctorId, watchedDate, selectedDoctor?.id]);

  const onSubmit = async (data: BookingFormData) => {
    try {
      // Transform form data to API format
      const appointmentData = {
        patientId: 'GUEST-' + Date.now(), // Temporary for guest booking
        doctorId: data.doctorId || 'DOC-DEFAULT', // Default doctor if not selected
        appointmentDate: data.date,
        appointmentTime: data.timeSlot + ':00', // Convert HH:mm to HH:mm:ss
        durationMinutes: 30,
        type: 'CONSULTATION' as const,
        priority: 'NORMAL' as const,
        reason: data.notes || 'Booking from landing page',
        consultationFee: 200000, // Default fee
        createdBy: 'landing-page',
      };

      await scheduleAppointment.mutateAsync(appointmentData);
      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      // Error is handled by the hook
      console.error('Booking error:', error);
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Success State */}
          {isSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
              >
                <Check className="h-10 w-10 text-green-600" />
              </motion.div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">Đặt lịch thành công!</h3>
              <p className="text-gray-600">
                Chúng tôi sẽ liên hệ với bạn để xác nhận lịch hẹn qua email và SMS.
              </p>
            </motion.div>
          ) : (
            <>
              <h2 className="mb-6 text-2xl font-bold text-gray-900">Đặt lịch khám</h2>

              {selectedDoctor && (
                <div className="mb-6 rounded-xl bg-primary-50 p-4">
                  <p className="text-sm font-medium text-primary-700">Bác sĩ đã chọn</p>
                  <p className="text-lg font-bold text-primary-900">{selectedDoctor.name}</p>
                  <p className="text-sm text-primary-600">{selectedDoctor.hospital}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Họ tên */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('patientName')}
                      type="text"
                      placeholder="Nguyễn Văn A"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {errors.patientName && (
                      <p className="mt-1 text-sm text-red-500">{errors.patientName.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="example@email.com"
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="0912345678"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {/* Ngày khám */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Ngày khám <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register('date')}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>
                    )}
                  </div>

                  {/* Khung giờ */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Khung giờ <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('timeSlot')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Chọn giờ</option>
                      {slots.map((slot) => (
                        <option key={`${slot.startTime}-${slot.endTime}`} value={slot.startTime} disabled={!slot.isAvailable}>
                          {slot.startTime} - {slot.endTime} {slot.isAvailable ? '' : '(Hết)'}
                        </option>
                      ))}
                    </select>
                    {errors.timeSlot && (
                      <p className="mt-1 text-sm text-red-500">{errors.timeSlot.message}</p>
                    )}
                  </div>
                </div>

                {/* Ghi chú */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    {...register('notes')}
                    rows={3}
                    placeholder="Triệu chứng hoặc ghi chú đặc biệt..."
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Điều khoản */}
                <div className="flex items-start gap-2">
                  <input
                    {...register('acceptTerms')}
                    type="checkbox"
                    id="terms"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600">
                    Tôi đồng ý với{' '}
                    <a href="/terms" className="text-primary hover:underline" target="_blank">
                      điều khoản dịch vụ
                    </a>{' '}
                    và{' '}
                    <a href="/privacy" className="text-primary hover:underline" target="_blank">
                      chính sách bảo mật
                    </a>
                  </label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                    disabled={scheduleAppointment.isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={scheduleAppointment.isPending}
                  >
                    {scheduleAppointment.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Xác nhận đặt lịch'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
