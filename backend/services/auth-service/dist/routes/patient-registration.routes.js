"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const patient_registration_controller_1 = require("../controllers/patient-registration.controller");
const router = (0, express_1.Router)();
const patientRegistrationController = new patient_registration_controller_1.PatientRegistrationController();
const patientRegistrationValidation = [
    (0, express_validator_1.body)("email")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail(),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
    (0, express_validator_1.body)("full_name")
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("Full name must be between 2-100 characters"),
    (0, express_validator_1.body)("national_id")
        .matches(/^[0-9]{9,12}$/)
        .withMessage("National ID must be 9-12 digits"),
    (0, express_validator_1.body)("date_of_birth")
        .isISO8601()
        .withMessage("Valid date of birth is required"),
    (0, express_validator_1.body)("gender")
        .isIn(["male", "female", "other"])
        .withMessage("Gender must be male, female, or other"),
    (0, express_validator_1.body)("phone_number")
        .matches(/^0[0-9]{9}$/)
        .withMessage("Phone number must be 10 digits starting with 0"),
    (0, express_validator_1.body)("address.province")
        .trim()
        .notEmpty()
        .withMessage("Province is required"),
    (0, express_validator_1.body)("address.district")
        .trim()
        .notEmpty()
        .withMessage("District is required"),
    (0, express_validator_1.body)("address.ward")
        .trim()
        .notEmpty()
        .withMessage("Ward is required"),
    (0, express_validator_1.body)("address.street")
        .trim()
        .notEmpty()
        .withMessage("Street address is required"),
    (0, express_validator_1.body)("blood_type")
        .optional()
        .isIn(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .withMessage("Invalid blood type"),
    (0, express_validator_1.body)("weight")
        .optional()
        .isFloat({ min: 1, max: 300 })
        .withMessage("Weight must be between 1-300 kg"),
    (0, express_validator_1.body)("height")
        .optional()
        .isFloat({ min: 50, max: 250 })
        .withMessage("Height must be between 50-250 cm"),
    (0, express_validator_1.body)("medical_history")
        .optional()
        .isArray()
        .withMessage("Medical history must be an array"),
    (0, express_validator_1.body)("drug_allergies")
        .optional()
        .isArray()
        .withMessage("Drug allergies must be an array"),
    (0, express_validator_1.body)("emergency_contact.name")
        .trim()
        .notEmpty()
        .withMessage("Emergency contact name is required"),
    (0, express_validator_1.body)("emergency_contact.relationship")
        .trim()
        .notEmpty()
        .withMessage("Emergency contact relationship is required"),
    (0, express_validator_1.body)("emergency_contact.phone_number")
        .matches(/^0[0-9]{9}$/)
        .withMessage("Emergency contact phone must be 10 digits starting with 0"),
    (0, express_validator_1.body)("insurance_number")
        .optional()
        .trim()
        .isLength({ min: 10, max: 20 })
        .withMessage("Insurance number must be 10-20 characters"),
    (0, express_validator_1.body)("insurance_valid_from")
        .optional()
        .isISO8601()
        .withMessage("Invalid insurance valid from date"),
    (0, express_validator_1.body)("insurance_valid_to")
        .optional()
        .isISO8601()
        .withMessage("Invalid insurance valid to date"),
];
router.post("/register-patient", patientRegistrationValidation, patientRegistrationController.registerPatient);
router.get("/patient-registration-stats", patientRegistrationController.getRegistrationStats);
exports.default = router;
//# sourceMappingURL=patient-registration.routes.js.map