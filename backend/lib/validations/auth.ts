/**
 * Authentication Validation Schemas
 * Zod schemas for auth-related forms and API endpoints
 */

import { z } from 'zod'

// Common validation patterns
const emailSchema = z
  .string()
  .min(1, 'Email là bắt buộc')
  .email('Định dạng email không hợp lệ')
  .max(255, 'Email quá dài')
  .transform(email => email.toLowerCase().trim())

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(128, 'Mật khẩu quá dài')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
  )

const fullNameSchema = z
  .string()
  .min(2, 'Họ tên phải có ít nhất 2 ký tự')
  .max(80, 'Họ tên quá dài')
  .regex(/^[a-zA-ZÀ-ỹ\s]+$/, 'Họ tên chỉ được chứa chữ cái và khoảng trắng')
  .transform(name => name.trim().replace(/\s+/g, ' '))

const phoneSchema = z
  .string()
  .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ')
  .optional()

const dateOfBirthSchema = z
  .string()
  .refine(
    (date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      return age >= 0 && age <= 150 && birthDate <= today
    },
    'Ngày sinh không hợp lệ'
  )
  .optional()

// Patient Registration Schema (Step 1)
export const patientRegisterSchema = z.object({
  full_name: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  date_of_birth: dateOfBirthSchema.refine(
    (date) => date !== undefined,
    'Ngày sinh là bắt buộc'
  ),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Giới tính không hợp lệ' })
  }).optional(),
  accept_tos: z.boolean().refine(val => val === true, 'Bạn phải đồng ý với Điều khoản sử dụng'),
  accept_privacy: z.boolean().refine(val => val === true, 'Bạn phải đồng ý với Chính sách bảo mật'),
  captcha_token: z.string().min(1, 'Vui lòng xác thực CAPTCHA'),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  }
)

// Patient Onboarding Schema (Step 2)
export const patientOnboardingSchema = z.object({
  // Contact Information
  phone: phoneSchema,
  preferred_language: z
    .enum(['vi', 'en'], {
      errorMap: () => ({ message: 'Vui lòng chọn ngôn ngữ hợp lệ' })
    })
    .default('vi'),

  contact_channel: z
    .enum(['sms', 'email', 'both'], {
      errorMap: () => ({ message: 'Vui lòng chọn phương thức liên lạc hợp lệ' })
    })
    .default('email'),

  // Address Information
  address: z.object({
    line1: z
      .string()
      .min(5, 'Địa chỉ phải có ít nhất 5 ký tự')
      .max(200, 'Địa chỉ quá dài')
      .trim(),

    line2: z
      .string()
      .max(200, 'Địa chỉ dòng 2 quá dài')
      .optional(),

    ward: z
      .string()
      .max(100, 'Tên phường/xã quá dài')
      .optional(),

    district: z
      .string()
      .max(100, 'Tên quận/huyện quá dài')
      .optional(),

    city: z
      .string()
      .min(1, 'Thành phố là bắt buộc')
      .max(100, 'Tên thành phố quá dài')
      .trim(),

    postal_code: z
      .string()
      .max(20, 'Mã bưu điện quá dài')
      .optional(),

    country: z
      .string()
      .length(2, 'Mã quốc gia phải có 2 ký tự')
      .default('VN'),
  }),

  // Emergency Contact
  emergency_contact: z.object({
    name: fullNameSchema,
    relation: z
      .string()
      .min(1, 'Mối quan hệ là bắt buộc')
      .max(50, 'Mối quan hệ quá dài')
      .trim(),

    phone: z
      .string()
      .min(1, 'Số điện thoại liên hệ khẩn cấp là bắt buộc')
      .regex(/^(\+84|0)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),

    email: z
      .string()
      .email('Email không hợp lệ')
      .optional(),
  }),

  // Insurance Information (Optional)
  insurance: z.object({
    insurance_number: z
      .string()
      .max(50, 'Số bảo hiểm quá dài')
      .optional(),

    provider: z
      .string()
      .max(100, 'Tên nhà cung cấp bảo hiểm quá dài')
      .optional(),

    valid_from: z
      .string()
      .optional()
      .refine((date) => !date || new Date(date) <= new Date(), 'Ngày hiệu lực không thể trong tương lai'),

    valid_to: z
      .string()
      .optional()
      .refine((date) => !date || new Date(date) >= new Date(), 'Bảo hiểm đã hết hạn'),
  }).optional(),

  // Medical Information (Optional)
  medical_info: z.object({
    allergies: z
      .array(z.string().max(100, 'Mô tả dị ứng quá dài'))
      .max(20, 'Quá nhiều dị ứng được liệt kê')
      .optional(),

    chronic_conditions: z
      .array(z.string().max(100, 'Mô tả bệnh lý quá dài'))
      .max(20, 'Quá nhiều bệnh lý được liệt kê')
      .optional(),

    blood_type: z
      .enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
        errorMap: () => ({ message: 'Vui lòng chọn nhóm máu hợp lệ' })
      })
      .optional(),
  }).optional(),

  // Document Upload References
  documents: z.object({
    id_card: z.string().optional(),
    insurance_card: z.string().optional(),
  }).optional(),
})

// Accept Invitation Schema
export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token mời là bắt buộc'),
  password: passwordSchema.optional(),
  confirm_password: z.string().optional(),
  mfa_opt_in: z.boolean().default(false),
  accept_tos: z.boolean().refine(val => val === true, 'Bạn phải đồng ý với Điều khoản sử dụng'),
  accept_privacy: z.boolean().refine(val => val === true, 'Bạn phải đồng ý với Chính sách bảo mật'),
}).refine(
  (data) => {
    if (data.password && data.confirm_password) {
      return data.password === data.confirm_password
    }
    return true
  },
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  }
)

// Login Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  remember_me: z.boolean().default(false),
})

// Forgot Password Schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
  captcha_token: z.string().min(1, 'Vui lòng xác thực CAPTCHA'),
})

// Reset Password Schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token đặt lại mật khẩu là bắt buộc'),
  password: passwordSchema,
  confirm_password: z.string(),
}).refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  }
)

// Admin Invitation Schema
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z
    .enum(['staff', 'doctor', 'admin'], {
      errorMap: () => ({ message: 'Vui lòng chọn vai trò hợp lệ' })
    }),
  department_id: z
    .number()
    .int()
    .positive('ID khoa phải là số dương')
    .optional(),
  expires_in_days: z
    .number()
    .int()
    .min(1, 'Thời hạn phải ít nhất 1 ngày')
    .max(30, 'Thời hạn không thể vượt quá 30 ngày')
    .default(7),
  message: z
    .string()
    .max(500, 'Tin nhắn quá dài')
    .optional(),
})

// Document Upload Schema
export const documentUploadSchema = z.object({
  document_type: z
    .enum(['id_card', 'insurance_card', 'medical_report', 'prescription', 'lab_result', 'profile_photo', 'other'], {
      errorMap: () => ({ message: 'Vui lòng chọn loại tài liệu hợp lệ' })
    }),
  file_name: z
    .string()
    .min(1, 'Tên file là bắt buộc')
    .max(255, 'Tên file quá dài')
    .refine(
      (name) => !/[<>:"/\\|?*]/.test(name),
      'Tên file chứa ký tự không hợp lệ'
    ),
  file_size: z
    .number()
    .int()
    .min(1, 'Kích thước file phải lớn hơn 0')
    .max(2097152, 'Kích thước file không thể vượt quá 2MB'),
  mime_type: z
    .enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain'], {
      errorMap: () => ({ message: 'Loại file không được hỗ trợ' })
    }),
  checksum: z
    .string()
    .min(1, 'Checksum file là bắt buộc'),
})

// Type exports for TypeScript
export type PatientRegisterInput = z.infer<typeof patientRegisterSchema>
export type PatientOnboardingInput = z.infer<typeof patientOnboardingSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>

// Validation helper functions
export function validateEmail(email: string): boolean {
  return emailSchema.safeParse(email).success
}

export function validatePassword(password: string): boolean {
  return passwordSchema.safeParse(password).success
}

export function validatePhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success
}

export function getPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('Ít nhất 8 ký tự')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Ít nhất 1 chữ thường')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Ít nhất 1 chữ hoa')

  if (/\d/.test(password)) score += 1
  else feedback.push('Ít nhất 1 số')

  if (/[@$!%*?&]/.test(password)) score += 1
  else feedback.push('Ít nhất 1 ký tự đặc biệt')

  if (password.length >= 12) score += 1

  return { score, feedback }
}
