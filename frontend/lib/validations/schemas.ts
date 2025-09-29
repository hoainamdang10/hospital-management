import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email format');
const phoneSchema = z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format').optional();
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  role: z.enum(['admin', 'doctor', 'patient']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Doctor schemas
export const doctorSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema,
  specialization: z.string().min(1, 'Specialization is required'),
  license_number: z.string().min(1, 'License number is required'),
  department_id: z.string().min(1, 'Department is required'),
  bio: z.string().optional(),
  experience_years: z.number().min(0, 'Experience years cannot be negative').max(50, 'Experience years cannot exceed 50').optional(),
  consultation_fee: z.number().min(0, 'Consultation fee cannot be negative').optional(),
});

// Patient schemas
export const patientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: emailSchema,
  phone: phoneSchema,
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['male', 'female', 'other']),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: phoneSchema,
  blood_type: z.string().optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
  insurance_number: z.string().optional(),
});

// Appointment schemas
export const appointmentSchema = z.object({
  patient_id: z.string().min(1, 'Patient is required'),
  doctor_id: z.string().min(1, 'Doctor is required'),
  appointment_date: z.string().min(1, 'Appointment date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  appointment_type: z.enum(['consultation', 'follow_up', 'emergency', 'routine_checkup']).default('consultation'),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']).default('scheduled'),
  reason: z.string().optional(),
  notes: z.string().optional(),
  diagnosis: z.string().optional(),
});

// Department schemas
export const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  head_doctor_id: z.string().optional(),
  location: z.string().optional(),
  phone: phoneSchema,
  email: emailSchema.optional(),
});

// Room schemas
export const roomSchema = z.object({
  room_number: z.string().min(1, 'Room number is required'),
  room_type: z.enum(['consultation', 'surgery', 'emergency', 'ward', 'icu', 'laboratory']),
  department_id: z.string().min(1, 'Department is required'),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  equipment: z.string().optional(),
  notes: z.string().optional(),
});

// Search and filter schemas
export const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  department_id: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type DoctorFormData = z.infer<typeof doctorSchema>;
export type PatientFormData = z.infer<typeof patientSchema>;
export type AppointmentFormData = z.infer<typeof appointmentSchema>;
export type DepartmentFormData = z.infer<typeof departmentSchema>;
export type RoomFormData = z.infer<typeof roomSchema>;
export type FilterFormData = z.infer<typeof filterSchema>;

// Validation utilities
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Custom validation functions
export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validatePhone = (phone: string): boolean => {
  return phoneSchema.safeParse(phone).success;
};

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
};

// Form field validation helpers
export const getFieldError = (errors: Record<string, string> | undefined, fieldName: string): string | undefined => {
  return errors?.[fieldName];
};

export const hasFieldError = (errors: Record<string, string> | undefined, fieldName: string): boolean => {
  return !!errors?.[fieldName];
};

export const clearFieldError = (errors: Record<string, string>, fieldName: string): Record<string, string> => {
  const newErrors = { ...errors };
  delete newErrors[fieldName];
  return newErrors;
};
