"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
const express_1 = __importDefault(require("express"));
const supabase_1 = require("../config/supabase");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const auth_validators_1 = require("../validators/auth.validators");
const router = express_1.default.Router();
const authController = new auth_controller_1.AuthController();
router.post("/signup", auth_validators_1.validateSignUp, authController.signUp);
router.post("/signin", auth_validators_1.validateSignIn, authController.signIn);
router.post("/login", auth_validators_1.validateSignIn, authController.signIn);
router.get("/health", (req, res) => {
    res.json({
        service: "Auth Service",
        status: "healthy",
        timestamp: new Date().toISOString(),
    });
});
router.post("/signout", auth_middleware_1.authMiddleware, authController.signOut);
router.post("/refresh", auth_validators_1.validateRefreshToken, authController.refreshToken);
router.post("/reset-password", auth_validators_1.validateResetPassword, authController.resetPassword);
router.get("/verify", authController.verifyToken);
router.get("/me", auth_middleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;
        let roleSpecificData = {};
        try {
            if (userRole === "patient") {
                const { data: patientData } = await supabase_1.supabaseAdmin
                    .from("patients")
                    .select("patient_id")
                    .eq("profile_id", userId)
                    .single();
                if (patientData) {
                    roleSpecificData = { patient_id: patientData.patient_id };
                }
            }
            else if (userRole === "doctor") {
                const { data: doctorData } = await supabase_1.supabaseAdmin
                    .from("doctors")
                    .select("doctor_id")
                    .eq("profile_id", userId)
                    .single();
                if (doctorData) {
                    roleSpecificData = { doctor_id: doctorData.doctor_id };
                }
            }
            else if (userRole === "admin") {
                const { data: adminData } = await supabase_1.supabaseAdmin
                    .from("admins")
                    .select("admin_id")
                    .eq("profile_id", userId)
                    .single();
                if (adminData) {
                    roleSpecificData = { admin_id: adminData.admin_id };
                }
            }
        }
        catch (roleError) {
            logger_1.default.warn("Could not fetch role-specific ID in /me endpoint:", roleError);
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
    }
    catch (error) {
        logger_1.default.error("Error in /me endpoint:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
router.post("/create-doctor-record", authController.createDoctorRecord);
router.post("/create-patient-record", authController.createPatientRecord);
router.post("/register-patient", auth_validators_1.validatePatientRegistration, authController.registerPatient);
router.post("/register-doctor", auth_validators_1.validateDoctorRegistration, authController.registerDoctor);
router.post("/register-receptionist", auth_validators_1.validateReceptionistRegistration, authController.registerReceptionist);
router.post("/magic-link", auth_validators_1.validateMagicLink, authController.sendMagicLink);
router.post("/phone-otp", auth_validators_1.validatePhoneOTP, authController.sendPhoneOTP);
router.post("/verify-otp", auth_validators_1.validateVerifyOTP, authController.verifyPhoneOTP);
router.get("/oauth/:provider", authController.initiateOAuth);
router.post("/oauth/callback", auth_validators_1.validateOAuthCallback, authController.handleOAuthCallback);
router.post("/check-email", auth_validators_1.validateEmail, authController.checkEmailAvailability);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map