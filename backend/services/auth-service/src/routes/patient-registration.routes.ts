import { Router } from "express";
import { body } from "express-validator";
import { PatientRegistrationController } from "../controllers/patient-registration.controller";

const router = Router();
const patientRegistrationController = new PatientRegistrationController();

// Validation middleware for patient registration
const patientRegistrationValidation = [
  // Basic authentication fields
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  
  // Personal information
  body("full_name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2-100 characters"),
  
  body("national_id")
    .matches(/^[0-9]{9,12}$/)
    .withMessage("National ID must be 9-12 digits"),
  
  body("date_of_birth")
    .isISO8601()
    .withMessage("Valid date of birth is required"),
  
  body("gender")
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),
  
  body("phone_number")
    .matches(/^0[0-9]{9}$/)
    .withMessage("Phone number must be 10 digits starting with 0"),
  
  // Address validation
  body("address.province")
    .trim()
    .notEmpty()
    .withMessage("Province is required"),
  
  body("address.district")
    .trim()
    .notEmpty()
    .withMessage("District is required"),
  
  body("address.ward")
    .trim()
    .notEmpty()
    .withMessage("Ward is required"),
  
  body("address.street")
    .trim()
    .notEmpty()
    .withMessage("Street address is required"),
  
  // Medical information (optional)
  body("blood_type")
    .optional()
    .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
    .withMessage("Invalid blood type"),
  
  body("weight")
    .optional()
    .isFloat({ min: 1, max: 300 })
    .withMessage("Weight must be between 1-300 kg"),
  
  body("height")
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage("Height must be between 50-250 cm"),
  
  body("medical_history")
    .optional()
    .isArray()
    .withMessage("Medical history must be an array"),
  
  body("drug_allergies")
    .optional()
    .isArray()
    .withMessage("Drug allergies must be an array"),
  
  // Emergency contact validation
  body("emergency_contact.name")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact name is required"),
  
  body("emergency_contact.relationship")
    .trim()
    .notEmpty()
    .withMessage("Emergency contact relationship is required"),
  
  body("emergency_contact.phone_number")
    .matches(/^0[0-9]{9}$/)
    .withMessage("Emergency contact phone must be 10 digits starting with 0"),
  
  // Insurance information (optional)
  body("insurance_number")
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Insurance number must be 10-20 characters"),
  
  body("insurance_valid_from")
    .optional()
    .isISO8601()
    .withMessage("Invalid insurance valid from date"),
  
  body("insurance_valid_to")
    .optional()
    .isISO8601()
    .withMessage("Invalid insurance valid to date"),
];

/**
 * @route   POST /api/auth/register-patient
 * @desc    Register a new patient with comprehensive information
 * @access  Public
 */
router.post(
  "/register-patient",
  patientRegistrationValidation,
  patientRegistrationController.registerPatient
);

/**
 * @route   GET /api/auth/patient-registration-stats
 * @desc    Get patient registration statistics
 * @access  Admin only (TODO: Add auth middleware)
 */
router.get(
  "/patient-registration-stats",
  // TODO: Add admin authentication middleware
  patientRegistrationController.getRegistrationStats
);

export default router;
