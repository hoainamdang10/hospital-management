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

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  remember: z.boolean().optional(),
  captcha_token: z.string().optional(),
})

// Patient registration schema
export const patientRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
  full_name: fullNameSchema,
  date_of_birth: z.string().min(1, 'Ngày sinh là bắt buộc'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Giới tính là bắt buộc',
  }),
  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại quá dài')
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .optional(),
  accept_tos: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng',
  }),
  accept_privacy: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với chính sách bảo mật',
  }),
  captcha_token: z.string().min(1, 'Vui lòng xác thực CAPTCHA'),
}).refine(data => data.password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
})

// Staff invitation acceptance schema
export const acceptInviteSchema = z.object({
  token: z.string().min(1, 'Token lời mời là bắt buộc'),
  password: passwordSchema,
  confirm_password: z.string(),
  accept_tos: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với điều khoản sử dụng',
  }),
  accept_privacy: z.boolean().refine(val => val === true, {
    message: 'Bạn phải đồng ý với chính sách bảo mật',
  }),
  mfa_opt_in: z.boolean().optional(),
}).refine(data => data.password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
})

// Create invitation schema (admin)
export const createInvitationSchema = z.object({
  email: emailSchema,
  role: z.enum(['doctor', 'staff', 'admin'], {
    required_error: 'Vai trò là bắt buộc',
  }),
  department_id: z.number().int().positive().optional(),
  expires_in_days: z
    .number()
    .int()
    .min(1, 'Thời hạn phải ít nhất 1 ngày')
    .max(30, 'Thời hạn tối đa 30 ngày')
    .default(7),
  message: z.string().max(500, 'Tin nhắn quá dài').optional(),
})

// Password reset schema
export const passwordResetSchema = z.object({
  email: emailSchema,
  captcha_token: z.string().min(1, 'Vui lòng xác thực CAPTCHA'),
})

// Change password schema
export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirm_password'],
})

// Update profile schema
export const updateProfileSchema = z.object({
  full_name: fullNameSchema,
  phone: z
    .string()
    .min(10, 'Số điện thoại phải có ít nhất 10 số')
    .max(15, 'Số điện thoại quá dài')
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
})

// MFA setup schema
export const mfaSetupSchema = z.object({
  password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  backup_codes: z.array(z.string()).optional(),
})

// MFA verification schema
export const mfaVerificationSchema = z.object({
  code: z
    .string()
    .min(6, 'Mã xác thực phải có 6 số')
    .max(6, 'Mã xác thực phải có 6 số')
    .regex(/^\d{6}$/, 'Mã xác thực chỉ được chứa số'),
})

// Export types
export type LoginFormData = z.infer<typeof loginSchema>
export type PatientRegistrationFormData = z.infer<typeof patientRegistrationSchema>
export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>
export type CreateInvitationFormData = z.infer<typeof createInvitationSchema>
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type MfaSetupFormData = z.infer<typeof mfaSetupSchema>
export type MfaVerificationFormData = z.infer<typeof mfaVerificationSchema>
