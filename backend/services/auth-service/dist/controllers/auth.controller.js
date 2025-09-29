"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const express_validator_1 = require("express-validator");
const auth_service_1 = require("../services/auth.service");
class AuthController {
    constructor() {
        this.signUp = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email, password, full_name, role, ...additionalData } = req.body;
                const result = await this.authService.signUp({
                    email,
                    password,
                    full_name,
                    role,
                    ...additionalData,
                });
                if (result.error) {
                    let statusCode = 400;
                    if (result.error.includes("already registered") ||
                        result.error.includes("already exists")) {
                        statusCode = 409;
                    }
                    else if (result.error.includes("Invalid") ||
                        result.error.includes("validation")) {
                        statusCode = 400;
                    }
                    else if (result.error.includes("permission") ||
                        result.error.includes("unauthorized")) {
                        statusCode = 403;
                    }
                    res.status(statusCode).json({
                        success: false,
                        error: result.error,
                        message: "Failed to create account",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                logger_1.default.info("✅ User signed up successfully", {
                    userId: result.user?.id,
                    email: result.user?.email,
                    role: result.user?.role,
                    hasSession: !!result.session,
                });
                res.status(201).json({
                    success: true,
                    message: "Account created successfully",
                    user: result.user,
                    session: result.session,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error("❌ Sign up controller error:", {
                    error: error.message,
                    stack: error.stack,
                    body: req.body,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to create account",
                    timestamp: new Date().toISOString(),
                });
            }
        };
        this.signIn = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email, password } = req.body;
                const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
                const userAgent = req.headers["user-agent"] || "unknown";
                const result = await this.authService.signIn(email, password, ipAddress, userAgent);
                if (result.error) {
                    res.status(401).json({
                        success: false,
                        error: result.error,
                        message: "Invalid credentials",
                    });
                    return;
                }
                logger_1.default.info("User signed in successfully", {
                    userId: result.user?.id,
                    email: result.user?.email,
                    role: result.user?.role,
                });
                res.status(200).json({
                    success: true,
                    message: "Signed in successfully",
                    user: result.user,
                    session: result.session,
                    access_token: result.session?.access_token,
                });
            }
            catch (error) {
                logger_1.default.error("Sign in error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to sign in",
                });
            }
        };
        this.signOut = async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader?.replace("Bearer ", "");
                if (!token) {
                    res.status(400).json({
                        success: false,
                        error: "No token provided",
                    });
                    return;
                }
                const result = await this.authService.signOut(token);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to sign out",
                    });
                    return;
                }
                logger_1.default.info("User signed out successfully");
                res.status(200).json({
                    success: true,
                    message: "Signed out successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Sign out error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to sign out",
                });
            }
        };
        this.refreshToken = async (req, res) => {
            try {
                const { refresh_token } = req.body;
                if (!refresh_token) {
                    res.status(400).json({
                        success: false,
                        error: "Refresh token is required",
                    });
                    return;
                }
                const result = await this.authService.refreshToken(refresh_token);
                if (result.error) {
                    res.status(401).json({
                        success: false,
                        error: result.error,
                        message: "Failed to refresh token",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Token refreshed successfully",
                    session: result.session,
                    access_token: result.session?.access_token,
                });
            }
            catch (error) {
                logger_1.default.error("Refresh token error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to refresh token",
                });
            }
        };
        this.resetPassword = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email } = req.body;
                const result = await this.authService.resetPassword(email);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to send reset password email",
                    });
                    return;
                }
                logger_1.default.info("Password reset email sent", { email });
                res.status(200).json({
                    success: true,
                    message: "Password reset email sent successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Reset password error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to send reset password email",
                });
            }
        };
        this.verifyToken = async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                const token = authHeader?.replace("Bearer ", "");
                if (!token) {
                    res.status(400).json({
                        success: false,
                        error: "No token provided",
                    });
                    return;
                }
                const result = await this.authService.verifyToken(token);
                if (result.error) {
                    res.status(401).json({
                        success: false,
                        error: result.error,
                        message: "Invalid token",
                    });
                    return;
                }
                res.status(200).json({
                    success: true,
                    message: "Token is valid",
                    user: result.user,
                });
            }
            catch (error) {
                logger_1.default.error("Verify token error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to verify token",
                });
            }
        };
        this.createDoctorRecord = async (req, res) => {
            try {
                const { userId, userData } = req.body;
                if (!userId || !userData) {
                    res.status(400).json({
                        success: false,
                        error: "userId and userData are required",
                    });
                    return;
                }
                await this.authService.createDoctorRecord(userId, userData);
                logger_1.default.info("Doctor record created successfully", { userId });
                res.status(201).json({
                    success: true,
                    message: "Doctor record created successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Create doctor record error:", error);
                res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error",
                    message: "Failed to create doctor record",
                });
            }
        };
        this.createPatientRecord = async (req, res) => {
            try {
                const { userId, userData } = req.body;
                if (!userId || !userData) {
                    res.status(400).json({
                        success: false,
                        error: "userId and userData are required",
                    });
                    return;
                }
                await this.authService.createPatientRecord(userId, userData);
                logger_1.default.info("Patient record created successfully", { userId });
                res.status(201).json({
                    success: true,
                    message: "Patient record created successfully",
                });
            }
            catch (error) {
                logger_1.default.error("Create patient record error:", error);
                res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error",
                    message: "Failed to create patient record",
                });
            }
        };
        this.registerPatient = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email, password, full_name, phone_number, gender, date_of_birth, blood_type, address, emergency_contact, } = req.body;
                const patientSignupData = {
                    email,
                    password,
                    full_name,
                    role: "patient",
                    phone_number,
                    gender,
                    date_of_birth,
                    blood_type,
                    address,
                    emergency_contact,
                };
                const result = await this.authService.signUp(patientSignupData);
                if (result.error) {
                    let statusCode = 400;
                    if (result.error.includes("already registered") ||
                        result.error.includes("already exists")) {
                        statusCode = 409;
                    }
                    else if (result.error.includes("Invalid") ||
                        result.error.includes("validation")) {
                        statusCode = 400;
                    }
                    else if (result.error.includes("permission") ||
                        result.error.includes("unauthorized")) {
                        statusCode = 403;
                    }
                    res.status(statusCode).json({
                        success: false,
                        error: result.error,
                        message: "Failed to register patient",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                logger_1.default.info("✅ Patient registered successfully", {
                    userId: result.user?.id,
                    email: result.user?.email,
                    role: result.user?.role,
                    hasSession: !!result.session,
                });
                res.status(201).json({
                    success: true,
                    message: "Patient registered successfully",
                    user: result.user,
                    session: result.session,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error("❌ Patient registration controller error:", {
                    error: error.message,
                    stack: error.stack,
                    body: req.body,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to register patient",
                    timestamp: new Date().toISOString(),
                });
            }
        };
        this.registerDoctor = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email, password, full_name, phone_number, gender, date_of_birth, specialty, license_number, qualification, department_id, } = req.body;
                if (!department_id) {
                    res.status(400).json({
                        success: false,
                        error: "Department ID is required for doctor registration",
                        message: "Please provide a valid department_id",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                const doctorSignupData = {
                    email,
                    password,
                    full_name,
                    role: "doctor",
                    phone_number,
                    gender,
                    date_of_birth,
                    specialty,
                    license_number,
                    qualification,
                    department_id,
                };
                const result = await this.authService.signUp(doctorSignupData);
                if (result.error) {
                    let statusCode = 400;
                    if (result.error.includes("already registered") ||
                        result.error.includes("already exists")) {
                        statusCode = 409;
                    }
                    else if (result.error.includes("Invalid") ||
                        result.error.includes("validation")) {
                        statusCode = 400;
                    }
                    else if (result.error.includes("permission") ||
                        result.error.includes("unauthorized")) {
                        statusCode = 403;
                    }
                    res.status(statusCode).json({
                        success: false,
                        error: result.error,
                        message: "Failed to register doctor",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                logger_1.default.info("✅ Doctor registered successfully", {
                    userId: result.user?.id,
                    email: result.user?.email,
                    role: result.user?.role,
                    department_id,
                    hasSession: !!result.session,
                });
                res.status(201).json({
                    success: true,
                    message: "Doctor registered successfully",
                    user: result.user,
                    session: result.session,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error("❌ Doctor registration controller error:", {
                    error: error.message,
                    stack: error.stack,
                    body: req.body,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to register doctor",
                    timestamp: new Date().toISOString(),
                });
            }
        };
        this.registerReceptionist = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email, password, full_name, phone_number, gender, date_of_birth, department_id, shift_schedule, languages_spoken, can_manage_appointments, can_manage_patients, can_view_medical_records, } = req.body;
                const receptionistSignupData = {
                    email,
                    password,
                    full_name,
                    role: "receptionist",
                    phone_number,
                    gender,
                    date_of_birth,
                    department_id,
                    shift_schedule,
                    languages_spoken,
                    can_manage_appointments,
                    can_manage_patients,
                    can_view_medical_records,
                };
                logger_1.default.info("🔄 Starting receptionist registration:", {
                    email,
                    full_name,
                    department_id,
                });
                const result = await this.authService.signUp(receptionistSignupData);
                if (result.error) {
                    logger_1.default.error("❌ Receptionist registration failed:", result.error);
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to register receptionist",
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                logger_1.default.info("✅ Receptionist registration successful:", {
                    email,
                    userId: result.user?.id,
                });
                res.status(201).json({
                    success: true,
                    message: "Receptionist registered successfully",
                    data: {
                        user: result.user,
                        session: result.session,
                    },
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error("❌ Receptionist registration controller error:", {
                    error: error.message,
                    stack: error.stack,
                    body: req.body,
                });
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to register receptionist",
                    timestamp: new Date().toISOString(),
                });
            }
        };
        this.sendMagicLink = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email } = req.body;
                const result = await this.authService.sendMagicLink(email);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to send magic link",
                    });
                    return;
                }
                logger_1.default.info("Magic link sent successfully", { email });
                res.status(200).json({
                    success: true,
                    message: "Magic link sent to your email address",
                });
            }
            catch (error) {
                logger_1.default.error("Send magic link error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to send magic link",
                });
            }
        };
        this.sendPhoneOTP = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { phone_number } = req.body;
                const result = await this.authService.sendPhoneOTP(phone_number);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to send OTP",
                    });
                    return;
                }
                logger_1.default.info("Phone OTP sent successfully", { phone_number });
                res.status(200).json({
                    success: true,
                    message: "OTP sent to your phone number",
                });
            }
            catch (error) {
                logger_1.default.error("Send phone OTP error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to send OTP",
                });
            }
        };
        this.verifyPhoneOTP = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { phone_number, otp_code } = req.body;
                const result = await this.authService.verifyPhoneOTP(phone_number, otp_code);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Invalid OTP or phone number",
                    });
                    return;
                }
                logger_1.default.info("Phone OTP verified successfully", { phone_number });
                res.status(200).json({
                    success: true,
                    message: "OTP verified successfully",
                    user: result.user,
                    session: result.session,
                    access_token: result.session?.access_token,
                });
            }
            catch (error) {
                logger_1.default.error("Verify phone OTP error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to verify OTP",
                });
            }
        };
        this.initiateOAuth = async (req, res) => {
            try {
                const { provider } = req.params;
                if (!["google", "github", "facebook", "apple"].includes(provider)) {
                    res.status(400).json({
                        success: false,
                        error: "Invalid OAuth provider",
                        message: "Supported providers: google, github, facebook, apple",
                    });
                    return;
                }
                const result = await this.authService.initiateOAuth(provider);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "Failed to initiate OAuth login",
                    });
                    return;
                }
                logger_1.default.info("OAuth login initiated", { provider });
                res.redirect(result.url);
            }
            catch (error) {
                logger_1.default.error("Initiate OAuth error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to initiate OAuth login",
                });
            }
        };
        this.handleOAuthCallback = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { code, state, provider } = req.body;
                const result = await this.authService.handleOAuthCallback(code, state, provider);
                if (result.error) {
                    res.status(400).json({
                        success: false,
                        error: result.error,
                        message: "OAuth login failed",
                    });
                    return;
                }
                logger_1.default.info("OAuth login successful", { provider });
                res.status(200).json({
                    success: true,
                    message: "OAuth login successful",
                    user: result.user,
                    session: result.session,
                    access_token: result.session?.access_token,
                });
            }
            catch (error) {
                logger_1.default.error("OAuth callback error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "OAuth login failed",
                });
            }
        };
        this.checkEmailAvailability = async (req, res) => {
            try {
                const errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    res.status(400).json({
                        success: false,
                        error: "Validation failed",
                        details: errors.array(),
                    });
                    return;
                }
                const { email } = req.body;
                logger_1.default.info(`🔍 Checking email availability for: ${email}`);
                const isAvailable = await this.authService.checkEmailAvailability(email);
                res.status(200).json({
                    success: true,
                    available: isAvailable,
                    message: isAvailable
                        ? "Email is available for registration"
                        : "Email is already registered",
                });
            }
            catch (error) {
                logger_1.default.error("Check email availability error:", error);
                res.status(500).json({
                    success: false,
                    error: "Internal server error",
                    message: "Failed to check email availability",
                });
            }
        };
        this.authService = new auth_service_1.AuthService();
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map