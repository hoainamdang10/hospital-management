import logger from "@hospital/shared/dist/utils/logger";
import express from "express";
import { supabaseAdmin } from "../config/supabase";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateDoctorRegistration,
  validateEmail,
  validateMagicLink,
  validateOAuthCallback,
  validatePatientRegistration,
  validatePhoneOTP,
  validateReceptionistRegistration,
  validateRefreshToken,
  validateResetPassword,
  validateSignIn,
  validateSignUp,
  validateVerifyOTP,
} from "../validators/auth.validators";

const router = express.Router();
const authController = new AuthController();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, doctor, patient]
 *               phone_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post("/signup", validateSignUp, authController.signUp);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Sign in user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post("/signin", validateSignIn, authController.signIn);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Sign in user (alias for signin)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User signed in successfully
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateSignIn, authController.signIn);

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Auth service health check
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/health", (req, res) => {
  res.json({
    service: "Auth Service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User signed out successfully
 *       401:
 *         description: Invalid token
 */
router.post("/signout", authMiddleware, authController.signOut);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post("/refresh", validateRefreshToken, authController.refreshToken);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Invalid email
 */
router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword
);

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verify JWT token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *       401:
 *         description: Invalid token
 */
router.get("/verify", authController.verifyToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *       401:
 *         description: Invalid token
 */
router.get("/me", authMiddleware, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get role-specific ID
    let roleSpecificData = {};
    try {
      if (userRole === "patient") {
        const { data: patientData } = await supabaseAdmin
          .from("patients")
          .select("patient_id")
          .eq("profile_id", userId)
          .single();
        if (patientData) {
          roleSpecificData = { patient_id: patientData.patient_id };
        }
      } else if (userRole === "doctor") {
        const { data: doctorData } = await supabaseAdmin
          .from("doctors")
          .select("doctor_id")
          .eq("profile_id", userId)
          .single();
        if (doctorData) {
          roleSpecificData = { doctor_id: doctorData.doctor_id };
        }
      } else if (userRole === "admin") {
        const { data: adminData } = await supabaseAdmin
          .from("admins")
          .select("admin_id")
          .eq("profile_id", userId)
          .single();
        if (adminData) {
          roleSpecificData = { admin_id: adminData.admin_id };
        }
      }
    } catch (roleError) {
      logger.warn(
        "Could not fetch role-specific ID in /me endpoint:",
        roleError
      );
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        full_name: req.user.full_name,
        role: req.user.role,
        phone_number: req.user.phone_number,
        is_active: req.user.is_active,
        ...roleSpecificData,
      },
    });
  } catch (error) {
    logger.error("Error in /me endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * @swagger
 * /api/auth/create-doctor-record:
 *   post:
 *     summary: Create doctor record with department-based ID
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userData
 *             properties:
 *               userId:
 *                 type: string
 *               userData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Doctor record created successfully
 *       400:
 *         description: Validation error
 */
router.post("/create-doctor-record", authController.createDoctorRecord);

/**
 * @swagger
 * /api/auth/create-patient-record:
 *   post:
 *     summary: Create patient record
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - userData
 *             properties:
 *               userId:
 *                 type: string
 *               userData:
 *                 type: object
 *     responses:
 *       201:
 *         description: Patient record created successfully
 *       400:
 *         description: Validation error
 */
router.post("/create-patient-record", authController.createPatientRecord);

/**
 * @swagger
 * /api/auth/register-patient:
 *   post:
 *     summary: Complete patient registration (signup + patient record)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *               - gender
 *               - date_of_birth
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               blood_type:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *               address:
 *                 type: object
 *               emergency_contact:
 *                 type: object
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post(
  "/register-patient",
  validatePatientRegistration,
  authController.registerPatient
);

/**
 * @swagger
 * /api/auth/register-doctor:
 *   post:
 *     summary: Complete doctor registration (signup + doctor record)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *               - gender
 *               - date_of_birth
 *               - department_id
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               specialty:
 *                 type: string
 *                 description: Medical specialty
 *               license_number:
 *                 type: string
 *                 description: Medical license number
 *               qualification:
 *                 type: string
 *                 description: Medical qualification (e.g., MD, PhD)
 *               department_id:
 *                 type: string
 *                 description: Department ID (required)
 *                 example: DEPT001
 *     responses:
 *       201:
 *         description: Doctor registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post(
  "/register-doctor",
  validateDoctorRegistration,
  authController.registerDoctor
);

/**
 * @swagger
 * /api/auth/register-receptionist:
 *   post:
 *     summary: Register a new receptionist
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - full_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "receptionist@hospital.com"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "Receptionist123!"
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "Nguyễn Thị Lan"
 *               phone_number:
 *                 type: string
 *                 pattern: "^0\\d{9}$"
 *                 example: "0987654321"
 *               department_id:
 *                 type: string
 *                 pattern: "^DEPT\\d{3}$"
 *                 example: "DEPT001"
 *     responses:
 *       201:
 *         description: Receptionist registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post(
  "/register-receptionist",
  validateReceptionistRegistration,
  authController.registerReceptionist
);

/**
 * @swagger
 * /api/auth/magic-link:
 *   post:
 *     summary: Send magic link for passwordless login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Magic link sent successfully
 *       400:
 *         description: Invalid email
 */
router.post("/magic-link", validateMagicLink, authController.sendMagicLink);

/**
 * @swagger
 * /api/auth/phone-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *             properties:
 *               phone_number:
 *                 type: string
 *                 pattern: '^\\+84[0-9]{9}$'
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number
 */
router.post("/phone-otp", validatePhoneOTP, authController.sendPhoneOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify phone OTP and sign in
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone_number
 *               - otp_code
 *             properties:
 *               phone_number:
 *                 type: string
 *                 pattern: '^\\+84[0-9]{9}$'
 *               otp_code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *     responses:
 *       200:
 *         description: OTP verified and user signed in
 *       400:
 *         description: Invalid OTP or phone number
 */
router.post("/verify-otp", validateVerifyOTP, authController.verifyPhoneOTP);

/**
 * @swagger
 * /api/auth/oauth/{provider}:
 *   get:
 *     summary: Initiate OAuth login
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [google, github, facebook, apple]
 *     responses:
 *       302:
 *         description: Redirect to OAuth provider
 *       400:
 *         description: Invalid provider
 */
router.get("/oauth/:provider", authController.initiateOAuth);

/**
 * @swagger
 * /api/auth/oauth/callback:
 *   post:
 *     summary: Handle OAuth callback
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - state
 *             properties:
 *               code:
 *                 type: string
 *               state:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [google, github, facebook, apple]
 *     responses:
 *       200:
 *         description: OAuth login successful
 *       400:
 *         description: Invalid OAuth callback
 */
router.post(
  "/oauth/callback",
  validateOAuthCallback,
  authController.handleOAuthCallback
);

/**
 * @swagger
 * /api/auth/check-email:
 *   post:
 *     summary: Check if email is available for registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email availability check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid email format
 */
router.post("/check-email", validateEmail, authController.checkEmailAvailability);

export default router;

// Force Docker rebuild - timestamp: 2025-06-08 09:30:00
