// ============================================================================
// VIETNAM HEALTHCARE SYSTEM - VALIDATION RULES
// ============================================================================

import { body, param, query } from 'express-validator';

// Vietnam-specific format patterns - UPDATED to use Department-Based ID System
export const VIETNAM_PATTERNS = {
  // ID Patterns - Consistent with shared validators
  DOCTOR_ID: /^[A-Z]{4}-DOC-\d{6}-\d{3}$/,           // CARD-DOC-202506-001
  PATIENT_ID: /^PAT-\d{6}-\d{3}$/,                    // PAT-202506-001
  APPOINTMENT_ID: /^[A-Z]{4}-APT-\d{6}-\d{3}$/,       // CARD-APT-202506-001
  DEPARTMENT_ID: /^DEPT\d{3}$/,                       // DEPT001
  ROOM_ID: /^ROOM\d+$/,                               // ROOM1747555777
  MEDICAL_RECORD_ID: /^[A-Z]{4}-MR-\d{6}-\d{3}$/,     // CARD-MR-202506-001
  PRESCRIPTION_ID: /^[A-Z]{4}-RX-\d{6}-\d{3}$/,       // CARD-RX-202506-001
  BILLING_ID: /^[A-Z]{4}-BILL-\d{6}-\d{3}$/,          // CARD-BILL-202506-001
  
  // Contact Patterns (Vietnam specific)
  PHONE_VN: /^0[0-9]{9}$/,                    // 10 digits starting with 0
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Medical Patterns (Vietnam)
  LICENSE_VN: /^VN-[A-Z]{2,4}-\d{4}$/,        // VN-BS-1234
  CCCD: /^[0-9]{12}$/,                        // 12 digits (new CCCD)
  CMND: /^[0-9]{9}$/,                         // 9 digits (old CMND)
  BHYT: /^[A-Z]{2}[0-9]{1}[0-9]{2}[0-9]{2}[0-9]{5}$/,  // HS4020123456789
};

// Vietnam enum values
export const VIETNAM_ENUMS = {
  // Gender (Vietnamese)
  GIOI_TINH: ['nam', 'nu', 'khac'],
  
  // Blood types
  NHOM_MAU: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  
  // Doctor status (Vietnamese)
  TRANG_THAI_BAC_SI: ['dang_lam', 'nghi_phep', 'tam_nghi', 'nghi_huu'],
  
  // Patient status (Vietnamese)
  TRANG_THAI_BENH_NHAN: ['dang_dieu_tri', 'xuat_vien', 'chuyen_vien', 'tu_vong'],
  
  // Appointment status (Vietnamese)
  TRANG_THAI_LICH_KHAM: ['dat_lich', 'xac_nhan', 'dang_kham', 'hoan_thanh', 'huy_bo', 'vang_mat'],
  
  // Appointment types (Vietnamese)
  LOAI_LICH_KHAM: ['kham_benh', 'tai_kham', 'cap_cuu', 'phau_thuat'],
  
  // Room types (Vietnamese)
  LOAI_PHONG: ['phong_kham', 'phong_mo', 'phong_cap_cuu', 'phong_benh', 'phong_hoi_suc', 'phong_xet_nghiem'],
  
  // Insurance types (Vietnam)
  LOAI_BAO_HIEM: ['BHYT', 'BHXH', 'BHTN', 'TRA_TIEN'],
  
  // Payment methods (Vietnam)
  PHUONG_THUC_THANH_TOAN: ['TIEN_MAT', 'CHUYEN_KHOAN', 'THE_ATM', 'THE_VISA', 'MOMO', 'ZALOPAY', 'VNPAY'],
  
  // Medical specialties (Vietnamese)
  CHUYEN_KHOA: [
    'tim_mach', 'than_kinh', 'nhi_khoa', 'san_phu_khoa', 'ngoai_khoa', 
    'noi_khoa', 'mat', 'tai_mui_hong', 'da_lieu', 'tam_than', 'ung_buou', 
    'gay_me_hoi_suc', 'chan_doan_hinh_anh', 'xet_nghiem'
  ],
  
  // License types (Vietnam)
  LOAI_BANG_CAP: ['BS', 'DD', 'YT', 'KT', 'XN', 'CDHA']
};

// Range constraints (Vietnam specific)
export const VIETNAM_RANGES = {
  TUOI: { min: 0, max: 120 },
  KINH_NGHIEM: { min: 0, max: 50 },
  PHI_KHAM: { min: 0, max: 10000000 }, // 10 million VND max
  THOI_GIAN_KHAM: { min: 15, max: 480 }, // 15 minutes to 8 hours
  SUC_CHUA_PHONG: { min: 1, max: 50 },
  NHIET_DO: { min: 30.0, max: 45.0 },
  MACH: { min: 30, max: 200 },
  HUYET_AP_TAM_TRUONG: { min: 60, max: 250 },
  HUYET_AP_TAM_THU: { min: 40, max: 150 },
  NHIP_THO: { min: 8, max: 40 },
  SPO2: { min: 70.0, max: 100.0 },
  CAN_NANG: { min: 0.5, max: 300.0 },
  CHIEU_CAO: { min: 30.0, max: 250.0 },
  BMI: { min: 10.0, max: 50.0 }
};

// ============================================================================
// DOCTOR VALIDATION (Vietnam)
// ============================================================================

export const validateDoctorId = [
  param('doctorId')
    .matches(VIETNAM_PATTERNS.DOCTOR_ID)
    .withMessage('Mã bác sĩ phải có định dạng DEPT-DOC-YYYYMM-XXX (VD: CARD-DOC-202506-001)')
];

export const validateCreateDoctor = [
  body('doctor_id')
    .optional()
    .matches(VIETNAM_PATTERNS.DOCTOR_ID)
    .withMessage('Mã bác sĩ không hợp lệ'),

  body('ho_ten')
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),

  body('email')
    .isEmail()
    .withMessage('Email không hợp lệ')
    .normalizeEmail(),

  body('so_dien_thoai')
    .matches(VIETNAM_PATTERNS.PHONE_VN)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0'),

  body('so_bang_cap')
    .matches(VIETNAM_PATTERNS.LICENSE_VN)
    .withMessage('Số bằng cấp phải có định dạng VN-XX-1234 (VD: VN-BS-1234)'),

  body('chuyen_khoa')
    .isIn(VIETNAM_ENUMS.CHUYEN_KHOA)
    .withMessage(`Chuyên khoa phải là một trong: ${VIETNAM_ENUMS.CHUYEN_KHOA.join(', ')}`),

  body('kinh_nghiem_nam')
    .optional()
    .isInt(VIETNAM_RANGES.KINH_NGHIEM)
    .withMessage(`Kinh nghiệm phải từ ${VIETNAM_RANGES.KINH_NGHIEM.min}-${VIETNAM_RANGES.KINH_NGHIEM.max} năm`),

  body('phi_kham_benh')
    .optional()
    .isFloat({ min: VIETNAM_RANGES.PHI_KHAM.min, max: VIETNAM_RANGES.PHI_KHAM.max })
    .withMessage(`Phí khám bệnh phải từ ${VIETNAM_RANGES.PHI_KHAM.min}-${VIETNAM_RANGES.PHI_KHAM.max} VND`),

  body('ma_khoa')
    .matches(VIETNAM_PATTERNS.DEPARTMENT_ID)
    .withMessage('Mã khoa không hợp lệ'),

  body('trang_thai')
    .optional()
    .isIn(VIETNAM_ENUMS.TRANG_THAI_BAC_SI)
    .withMessage(`Trạng thái phải là: ${VIETNAM_ENUMS.TRANG_THAI_BAC_SI.join(', ')}`),

  body('lich_lam_viec')
    .optional()
    .isObject()
    .withMessage('Lịch làm việc phải là object JSON'),

  body('gioi_tinh')
    .isIn(VIETNAM_ENUMS.GIOI_TINH)
    .withMessage(`Giới tính phải là: ${VIETNAM_ENUMS.GIOI_TINH.join(', ')}`)
];

// ============================================================================
// PATIENT VALIDATION (Vietnam)
// ============================================================================

// validatePatientId removed - using department-based ID system

export const validateCreatePatient = [
  // patient_id validation removed - using department-based ID system

  body('ho_ten')
    .notEmpty()
    .withMessage('Họ tên là bắt buộc')
    .isLength({ min: 2, max: 100 })
    .withMessage('Họ tên phải từ 2-100 ký tự'),

  body('ngay_sinh')
    .isDate()
    .withMessage('Ngày sinh không hợp lệ'),

  body('gioi_tinh')
    .isIn(VIETNAM_ENUMS.GIOI_TINH)
    .withMessage(`Giới tính phải là: ${VIETNAM_ENUMS.GIOI_TINH.join(', ')}`),

  body('so_dien_thoai')
    .optional()
    .matches(VIETNAM_PATTERNS.PHONE_VN)
    .withMessage('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email không hợp lệ'),

  body('so_cccd')
    .optional()
    .matches(VIETNAM_PATTERNS.CCCD)
    .withMessage('Số CCCD phải có 12 chữ số'),

  body('so_cmnd')
    .optional()
    .matches(VIETNAM_PATTERNS.CMND)
    .withMessage('Số CMND phải có 9 chữ số'),

  body('so_the_bhyt')
    .optional()
    .matches(VIETNAM_PATTERNS.BHYT)
    .withMessage('Số thẻ BHYT không đúng định dạng'),

  body('nhom_mau')
    .optional()
    .isIn(VIETNAM_ENUMS.NHOM_MAU)
    .withMessage(`Nhóm máu phải là: ${VIETNAM_ENUMS.NHOM_MAU.join(', ')}`),

  body('trang_thai')
    .optional()
    .isIn(VIETNAM_ENUMS.TRANG_THAI_BENH_NHAN)
    .withMessage(`Trạng thái phải là: ${VIETNAM_ENUMS.TRANG_THAI_BENH_NHAN.join(', ')}`),

  body('dia_chi')
    .optional()
    .isObject()
    .withMessage('Địa chỉ phải là object JSON'),

  body('thong_tin_bao_hiem')
    .optional()
    .isObject()
    .withMessage('Thông tin bảo hiểm phải là object JSON')
];

// ============================================================================
// APPOINTMENT VALIDATION (Vietnam)
// ============================================================================

export const validateAppointmentId = [
  param('appointmentId')
    .matches(VIETNAM_PATTERNS.APPOINTMENT_ID)
    .withMessage('Mã lịch khám phải có định dạng DEPT-APT-YYYYMM-XXX (VD: CARD-APT-202506-001)')
];

export const validateCreateAppointment = [
  body('appointment_id')
    .optional()
    .matches(VIETNAM_PATTERNS.APPOINTMENT_ID)
    .withMessage('Mã lịch khám không hợp lệ'),

  // ma_benh_nhan validation removed - using department-based ID system

  body('ma_bac_si')
    .matches(VIETNAM_PATTERNS.DOCTOR_ID)
    .withMessage('Mã bác sĩ không hợp lệ'),

  body('thoi_gian_kham')
    .isISO8601()
    .withMessage('Thời gian khám phải đúng định dạng ISO 8601'),

  body('thoi_luong_phut')
    .isInt(VIETNAM_RANGES.THOI_GIAN_KHAM)
    .withMessage(`Thời lượng khám phải từ ${VIETNAM_RANGES.THOI_GIAN_KHAM.min}-${VIETNAM_RANGES.THOI_GIAN_KHAM.max} phút`),

  body('loai_lich_kham')
    .isIn(VIETNAM_ENUMS.LOAI_LICH_KHAM)
    .withMessage(`Loại lịch khám phải là: ${VIETNAM_ENUMS.LOAI_LICH_KHAM.join(', ')}`),

  body('trang_thai')
    .optional()
    .isIn(VIETNAM_ENUMS.TRANG_THAI_LICH_KHAM)
    .withMessage(`Trạng thái phải là: ${VIETNAM_ENUMS.TRANG_THAI_LICH_KHAM.join(', ')}`),

  body('ma_phong')
    .optional()
    .matches(VIETNAM_PATTERNS.ROOM_ID)
    .withMessage('Mã phòng không hợp lệ'),

  body('ghi_chu')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Ghi chú không được quá 1000 ký tự')
];

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export const validateVietnamPhone = (phone: string): boolean => {
  return VIETNAM_PATTERNS.PHONE_VN.test(phone);
};

export const validateVietnamLicense = (license: string): boolean => {
  return VIETNAM_PATTERNS.LICENSE_VN.test(license);
};

export const validateCCCD = (cccd: string): boolean => {
  return VIETNAM_PATTERNS.CCCD.test(cccd);
};

export const validateBHYT = (bhyt: string): boolean => {
  return VIETNAM_PATTERNS.BHYT.test(bhyt);
};

export const formatVietnamPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  
  if (digits.length === 10 && digits.startsWith('0')) {
    return digits;
  } else if (digits.length === 11 && digits.startsWith('84')) {
    return '0' + digits.substring(2);
  } else if (digits.length === 9) {
    return '0' + digits;
  }
  
  return phone;
};

export const formatVietnamLicense = (license: string): string => {
  const letters = license.match(/[A-Z]+/g)?.join('') || 'BS';
  const numbers = license.match(/\d+/g)?.join('') || '0001';
  
  const prefix = letters.substring(0, 4);
  const suffix = numbers.padStart(4, '0').substring(0, 4);
  
  return `VN-${prefix}-${suffix}`;
};

// ============================================================================
// UNIQUENESS VALIDATION
// ============================================================================

export const VIETNAM_UNIQUE_CONSTRAINTS = {
  doctors: ['doctor_id', 'email', 'so_bang_cap'],
  patients: ['email', 'so_cccd', 'so_cmnd', 'so_the_bhyt'], // patient_id removed - using department-based ID
  appointments: ['appointment_id'],
  departments: ['department_id', 'ten_khoa'],
  rooms: ['room_id', 'so_phong'],
  medical_records: ['record_id'],
  prescriptions: ['prescription_id'],
  billing: ['billing_id']
};

export const validateUniqueness = async (table: string, field: string, value: any, excludeId?: string) => {
  // This would be implemented with actual database queries
  // For now, return validation structure
  return {
    isUnique: true,
    message: `${field} đã tồn tại trong hệ thống`
  };
};

export default {
  VIETNAM_PATTERNS,
  VIETNAM_ENUMS,
  VIETNAM_RANGES,
  validateDoctorId,
  validateCreateDoctor,
  // validatePatientId removed - using department-based ID system
  validateCreatePatient,
  validateAppointmentId,
  validateCreateAppointment,
  validateVietnamPhone,
  validateVietnamLicense,
  validateCCCD,
  validateBHYT,
  formatVietnamPhone,
  formatVietnamLicense,
  VIETNAM_UNIQUE_CONSTRAINTS
};
