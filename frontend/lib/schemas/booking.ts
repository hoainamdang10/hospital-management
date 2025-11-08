import { z } from 'zod';

export const bookingSchema = z.object({
  patientName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại phải có ít nhất 9 ký tự'),
  doctorId: z.string().optional(),
  specialty: z.string().optional(),
  location: z.string().optional(),
  date: z.string().min(1, 'Vui lòng chọn ngày khám'),
  timeSlot: z.string().min(1, 'Vui lòng chọn giờ khám'),
  notes: z.string().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'Bạn phải đồng ý với điều khoản dịch vụ',
  }),
});

export type BookingFormData = z.infer<typeof bookingSchema>;
