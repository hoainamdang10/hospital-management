/**
 * Application Constants
 */

// API Configuration
// Empty baseURL means axios will use relative paths like /api/v1/...
// Next.js rewrites will proxy these to API Gateway
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  PATIENT: 'PATIENT',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Appointment Status
export const APPOINTMENT_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[keyof typeof APPOINTMENT_STATUS];

// Appointment Types
export const APPOINTMENT_TYPES = {
  CONSULTATION: 'CONSULTATION',
  FOLLOW_UP: 'FOLLOW_UP',
  EMERGENCY: 'EMERGENCY',
  ROUTINE_CHECKUP: 'ROUTINE_CHECKUP',
} as const;

// Invoice Status
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  FINALIZED: 'FINALIZED',
  PAID: 'PAID',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  OVERDUE: 'OVERDUE',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
  PENDING: 'PENDING',
  EXPIRED: 'EXPIRED',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT_CARD: 'CREDIT_CARD',
  PAYOS: 'PAYOS',
  INSURANCE: 'INSURANCE',
} as const;

// Insurance Types
export const INSURANCE_TYPES = {
  BHYT: 'BHYT', // Bảo hiểm y tế
  BHTN: 'BHTN', // Bảo hiểm tư nhân
  NONE: 'NONE',
} as const;

// Gender
export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  IN_APP: 'IN_APP',
} as const;

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'dd/MM/yyyy',
  LONG: 'dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',

  // Patient routes
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_BOOK_APPOINTMENT: '/patient/appointments/book',
  PATIENT_MEDICAL_HISTORY: '/patient/medical-history',
  PATIENT_PROFILE: '/patient/profile',
  PATIENT_BILLING: '/patient/billing',
  PATIENT_INSURANCE: '/patient/insurance',
  PATIENT_EMERGENCY_CONTACTS: '/patient/emergency-contacts',

  // Doctor routes
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_SCHEDULE: '/doctor/schedule',
  DOCTOR_QUEUE: '/doctor/queue',
  DOCTOR_EXAMINATION: '/doctor/examination',
  DOCTOR_PATIENTS: '/doctor/patients',
  DOCTOR_MEDICAL_RECORDS: '/doctor/medical-records',
  DOCTOR_PRESCRIPTIONS: '/doctor/prescriptions',

  // Nurse routes
  NURSE_DASHBOARD: '/nurse/dashboard',
  NURSE_PATIENTS: '/nurse/patients',
  NURSE_CHECK_IN: '/nurse/check-in',
  NURSE_VITALS: '/nurse/vitals',

  // Admin routes
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_PATIENTS: '/admin/patients',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_BILLING_REPORTS: '/admin/billing-reports',
  ADMIN_INVOICES: '/admin/invoices',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',

  // Public routes
  ABOUT: '/about',
  SERVICES: '/services',
  DOCTORS: '/doctors',
  CONTACT: '/contact',
} as const;

// Vietnamese Specializations
export const SPECIALIZATIONS = [
  'Nội khoa',
  'Ngoại khoa',
  'Sản phụ khoa',
  'Nhi khoa',
  'Tim mạch',
  'Thần kinh',
  'Chấn thương chỉnh hình',
  'Tai mũi họng',
  'Mắt',
  'Da liễu',
  'Răng hàm mặt',
  'Tâm thần',
  'Ung bướu',
  'Nội tiết',
  'Tiêu hóa',
] as const;

// Error Messages (Vietnamese)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng thử lại.',
  UNAUTHORIZED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập tài nguyên này.',
  NOT_FOUND: 'Không tìm thấy tài nguyên.',
  SERVER_ERROR: 'Lỗi máy chủ. Vui lòng thử lại sau.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  UNKNOWN_ERROR: 'Đã xảy ra lỗi không xác định.',
} as const;

// Success Messages (Vietnamese)
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  REGISTER_SUCCESS: 'Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.',
  UPDATE_SUCCESS: 'Cập nhật thành công!',
  DELETE_SUCCESS: 'Xóa thành công!',
  CREATE_SUCCESS: 'Tạo mới thành công!',
  APPOINTMENT_BOOKED: 'Đặt lịch khám thành công!',
  PAYMENT_SUCCESS: 'Thanh toán thành công!',
} as const;
