"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateOAuthCallback = exports.validateVerifyOTP = exports.validateDepartmentId = exports.validateAdminId = exports.validatePatientId = exports.validateDoctorId = exports.validatePhoneOTP = exports.validateMagicLink = exports.validateRole = exports.validateUserId = exports.validateEmail = exports.validateUpdateProfile = exports.validateChangePassword = exports.validateRefreshToken = exports.validateResetPassword = exports.validateSignIn = exports.validateReceptionistRegistration = exports.validateDoctorRegistration = exports.validatePatientRegistration = exports.validateSignUp = void 0;
const express_validator_1 = require("express-validator");
const DOCTOR_ID_PATTERN = /^[A-Z]{4}-DOC-\d{6}-\d{3}$/;
const PATIENT_ID_PATTERN = /^PAT-\d{6}-\d{3}$/;
const ADMIN_ID_PATTERN = /^ADM-\d{6}-\d{3}$/;
const DEPARTMENT_ID_PATTERN = /^DEPT\d{3}$/;
exports.validateSignUp = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Full name can only contain letters and spaces"),
    (0, express_validator_1.body)("role")
        .isIn(["admin", "doctor", "patient"])
        .withMessage("Role must be one of: admin, doctor, patient"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("gender")
        .optional()
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
    (0, express_validator_1.body)("date_of_birth")
        .optional()
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
    (0, express_validator_1.body)("specialty")
        .if((0, express_validator_1.body)("role").equals("doctor"))
        .notEmpty()
        .withMessage("Specialty is required for doctors"),
    (0, express_validator_1.body)("license_number")
        .if((0, express_validator_1.body)("role").equals("doctor"))
        .optional()
        .matches(/^VN-[A-Z]{2}-\d{4}$/)
        .withMessage("License number must follow format: VN-XX-0000"),
    (0, express_validator_1.body)("qualification")
        .if((0, express_validator_1.body)("role").equals("doctor"))
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage("Qualification must be between 2 and 50 characters"),
    (0, express_validator_1.body)("department_id")
        .if((0, express_validator_1.body)("role").equals("doctor"))
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage("Department ID is invalid"),
];
exports.validatePatientRegistration = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Full name can only contain letters and spaces"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("gender")
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
    (0, express_validator_1.body)("date_of_birth")
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
    (0, express_validator_1.body)("blood_type")
        .optional()
        .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .withMessage("Blood type must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-"),
    (0, express_validator_1.body)("address")
        .optional()
        .isObject()
        .withMessage("Address must be an object"),
    (0, express_validator_1.body)("emergency_contact")
        .optional()
        .isObject()
        .withMessage("Emergency contact must be an object"),
];
exports.validateDoctorRegistration = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Full name can only contain letters and spaces"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("gender")
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
    (0, express_validator_1.body)("date_of_birth")
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
    (0, express_validator_1.body)("specialty")
        .notEmpty()
        .isLength({ min: 2, max: 100 })
        .withMessage("Specialty is required and must be between 2 and 100 characters"),
    (0, express_validator_1.body)("license_number")
        .optional()
        .matches(/^VN-[A-Z]{2}-\d{4}$/)
        .withMessage("License number must follow format: VN-XX-0000"),
    (0, express_validator_1.body)("qualification")
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage("Qualification must be between 2 and 50 characters"),
    (0, express_validator_1.body)("department_id")
        .notEmpty()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage("Department ID is required and must follow format: DEPT001"),
];
exports.validateReceptionistRegistration = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("Password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Full name can only contain letters and spaces"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("gender")
        .optional()
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
    (0, express_validator_1.body)("date_of_birth")
        .optional()
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
    (0, express_validator_1.body)("department_id")
        .optional()
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage("Department ID must follow format: DEPT001"),
    (0, express_validator_1.body)("shift_schedule")
        .optional()
        .isObject()
        .withMessage("Shift schedule must be an object"),
    (0, express_validator_1.body)("languages_spoken")
        .optional()
        .isArray()
        .withMessage("Languages spoken must be an array"),
    (0, express_validator_1.body)("can_manage_appointments")
        .optional()
        .isBoolean()
        .withMessage("Can manage appointments must be a boolean"),
    (0, express_validator_1.body)("can_manage_patients")
        .optional()
        .isBoolean()
        .withMessage("Can manage patients must be a boolean"),
    (0, express_validator_1.body)("can_view_medical_records")
        .optional()
        .isBoolean()
        .withMessage("Can view medical records must be a boolean"),
];
exports.validateSignIn = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
];
exports.validateResetPassword = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
];
exports.validateRefreshToken = [
    (0, express_validator_1.body)("refresh_token")
        .notEmpty()
        .withMessage("Refresh token is required")
        .isLength({ min: 10 })
        .withMessage("Invalid refresh token format"),
];
exports.validateChangePassword = [
    (0, express_validator_1.body)("current_password")
        .notEmpty()
        .withMessage("Current password is required"),
    (0, express_validator_1.body)("new_password")
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage("New password must contain at least one lowercase letter, one uppercase letter, and one number"),
    (0, express_validator_1.body)("confirm_password").custom((value, { req }) => {
        if (value !== req.body.new_password) {
            throw new Error("Password confirmation does not match new password");
        }
        return true;
    }),
];
exports.validateUpdateProfile = [
    (0, express_validator_1.body)("full_name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2 and 100 characters")
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/)
        .withMessage("Full name can only contain letters and spaces"),
    (0, express_validator_1.body)("phone_number")
        .optional()
        .matches(/^0\d{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("gender")
        .optional()
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be one of: male, female, other"),
    (0, express_validator_1.body)("date_of_birth")
        .optional()
        .isISO8601()
        .withMessage("Date of birth must be a valid date"),
];
exports.validateEmail = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
];
exports.validateUserId = [
    (0, express_validator_1.body)("user_id").isUUID().withMessage("User ID must be a valid UUID"),
];
exports.validateRole = [
    (0, express_validator_1.body)("role")
        .isIn(["admin", "doctor", "patient"])
        .withMessage("Role must be one of: admin, doctor, patient"),
];
exports.validateMagicLink = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .normalizeEmail()
        .withMessage("Please provide a valid email address"),
];
exports.validatePhoneOTP = [
    (0, express_validator_1.body)("phone_number")
        .matches(/^\+84\d{9}$/)
        .withMessage("Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)"),
];
exports.validateDoctorId = [
    (0, express_validator_1.param)("doctorId")
        .matches(DOCTOR_ID_PATTERN)
        .withMessage("Doctor ID must be in department-based format (e.g., CARD-DOC-202506-001)"),
];
exports.validatePatientId = [
    (0, express_validator_1.param)("patientId")
        .matches(PATIENT_ID_PATTERN)
        .withMessage("Patient ID must be in format PAT-YYYYMM-XXX"),
];
exports.validateAdminId = [
    (0, express_validator_1.param)("adminId")
        .matches(ADMIN_ID_PATTERN)
        .withMessage("Admin ID must be in format ADM-YYYYMM-XXX"),
];
exports.validateDepartmentId = [
    (0, express_validator_1.param)("departmentId")
        .matches(DEPARTMENT_ID_PATTERN)
        .withMessage("Department ID must be in format DEPT001"),
];
exports.validateVerifyOTP = [
    (0, express_validator_1.body)("phone_number")
        .matches(/^\+84\d{9}$/)
        .withMessage("Phone number must be in format +84xxxxxxxxx (Vietnamese phone number)"),
    (0, express_validator_1.body)("otp_code")
        .matches(/^\d{6}$/)
        .withMessage("OTP code must be exactly 6 digits"),
];
exports.validateOAuthCallback = [
    (0, express_validator_1.body)("code").notEmpty().withMessage("OAuth authorization code is required"),
    (0, express_validator_1.body)("state").notEmpty().withMessage("OAuth state parameter is required"),
    (0, express_validator_1.body)("provider")
        .optional()
        .isIn(["google", "github", "facebook", "apple"])
        .withMessage("Provider must be one of: google, github, facebook, apple"),
];
//# sourceMappingURL=auth.validators.js.map