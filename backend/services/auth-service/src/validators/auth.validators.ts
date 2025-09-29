import { body, param } from "express-validator";

// Standardized ID Format Patterns - Consistent with shared validators
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/; // CARD-DOC-202506-001
const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/; // PAT-202506-001
const ADMIN_ID_PATTERN = /^ADM-\d{6}-\d{3}$/; // ADM-202506-001
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/; // DEPT001

export const validateSignUp = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  body("role")
    .isIn(["admin", "doctor", "patient"])
    .withMessage("Role must be one of: admin, doctor, patient"),

  body("phone_number")
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be one of: male, female, other"),

  body("date_of_birth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  // Doctor-specific validations
  body("specialty")
    .if(body("role").equals("doctor"))
    .notEmpty()
    .withMessage("Specialty is required for doctors"),

  body("license_number")
    .if(body("role").equals("doctor"))
    .optional()
    .matches(/^VN-[A-Z]{2}-\d{4}$/)
    .withMessage("License number must follow format: VN-XX-0000"),

  body("qualification")
    .if(body("role").equals("doctor"))
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Qualification must be between 2 and 50 characters"),

  body("department_id")
    .if(body("role").equals("doctor"))
    .optional()
    .isLength({ min: 1, max: 20 })
    .withMessage("Department ID is invalid"),
];

// Patient-specific registration validator
export const validatePatientRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  body("phone_number")
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),

  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be one of: male, female, other"),

  body("date_of_birth")
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("blood_type")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"),

  body("address")
    .optional()
    .isObject()
    .withMessage("Address must be an object"),

  body("emergency_contact")
    .optional()
    .isObject()
    .withMessage("Emergency contact must be an object"),
];

// Doctor-specific registration validator
export const validateDoctorRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  body("phone_number")
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),

  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be one of: male, female, other"),

  body("date_of_birth")
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("specialty")
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage(
      "Specialty is required and must be between 2 and 100 characters"
    ),

  body("license_number")
    .optional()
    .matches(/^VN-[A-Z]{2}-\d{4}$/)
    .withMessage("License number must follow format: VN-XX-0000"),

  body("qualification")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Qualification must be between 2 and 50 characters"),

  body("department_id")
    .notEmpty()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage("Department ID is required and must follow format: DEPT001"),
];

// Receptionist-specific registration validator
export const validateReceptionistRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  body("phone_number")
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be one of: male, female, other"),

  body("date_of_birth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),

  body("department_id")
    .optional()
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage("Department ID must follow format: DEPT001"),

  body("shift_schedule")
    .optional()
    .isObject()
    .withMessage("Shift schedule must be an object"),

  body("languages_spoken")
    .optional()
    .isArray()
    .withMessage("Languages spoken must be an array"),

  body("can_manage_appointments")
    .optional()
    .isBoolean()
    .withMessage("Can manage appointments must be a boolean"),

  body("can_manage_patients")
    .optional()
    .isBoolean()
    .withMessage("Can manage patients must be a boolean"),

  body("can_view_medical_records")
    .optional()
    .isBoolean()
    .withMessage("Can view medical records must be a boolean"),
];

export const validateSignIn = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),

  body("password").notEmpty().withMessage("Password is required"),
];

export const validateResetPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export const validateRefreshToken = [
  body("refresh_token")
    .notEmpty()
    .withMessage("Refresh token is required")
    .isLength({ min: 10 })
    .withMessage("Invalid refresh token format"),
];

export const validateChangePassword = [
  body("current_password")
    .notEmpty()
    .withMessage("Current password is required"),

  body("new_password")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "New password must contain at least one lowercase letter, one uppercase letter, and one number"
    ),

  body("confirm_password").custom((value, { req }) => {
    if (value !== req.body.new_password) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  }),
];

export const validateUpdateProfile = [
  body("full_name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters")
    .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
    .withMessage("Full name can only contain letters and spaces"),

  body("phone_number")
    .optional()
    .matches(/^0\d{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),

  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be one of: male, female, other"),

  body("date_of_birth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
];

export const validateEmail = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

export const validateUserId = [
  body("user_id").isUUID().withMessage("User ID must be a valid UUID"),
];

export const validateRole = [
  body("role")
    .isIn(["admin", "doctor", "patient"])
    .withMessage("Role must be one of: admin, doctor, patient"),
];

// Magic Link validators
export const validateMagicLink = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
];

// Phone OTP validators
export const validatePhoneOTP = [
  body("phone_number")
    .matches(/^\+84\d{9}$/)
    .withMessage(
      "Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)"
    ),
];

// ID Format validators - for cross-service validation
export const validateDoctorId = [
  param("doctorId")
    .matches(DOCTOR_ID_PATTERN)
    .withMessage(
      "Doctor ID must be in department-based format (e.g., CARD-DOC-202506-001)"
    ),
];

export const validatePatientId = [
  param("patientId")
    .matches(PATIENT_ID_PATTERN)
    .withMessage("Patient ID must be in format PAT-YYYYMM-XXX"),
];

export const validateAdminId = [
  param("adminId")
    .matches(ADMIN_ID_PATTERN)
    .withMessage("Admin ID must be in format ADM-YYYYMM-XXX"),
];

export const validateDepartmentId = [
  param("departmentId")
    .matches(DEPARTMENT_ID_PATTERN)
    .withMessage("Department ID must be in format DEPT001"),
];

export const validateVerifyOTP = [
  body("phone_number")
    .matches(/^\+84\d{9}$/)
    .withMessage(
      "Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)"
    ),

  body("otp_code")
    .matches(/^\d{6}$/)
    .withMessage("OTP code must be exactly 6 digits"),
];

// OAuth validators
export const validateOAuthCallback = [
  body("code").notEmpty().withMessage("OAuth authorization code is required"),

  body("state").notEmpty().withMessage("OAuth state parameter is required"),

  body("provider")
    .optional()
    .isIn(["google", "github", "facebook", "apple"])
    .withMessage("Provider must be one of: google, github, facebook, apple"),
];
