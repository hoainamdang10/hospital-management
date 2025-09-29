import logger from "@hospital/shared/dist/utils/logger";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { AuthService } from "../services/auth.service";

export interface PatientRegistrationRequest {
  // Authentication
  email: string;
  password: string;
  
  // Personal Information
  full_name: string;
  national_id: string; // CCCD/CMND
  date_of_birth: string;
  gender: "male" | "female" | "other";
  phone_number: string;
  
  // Address Information
  address: {
    province: string;
    district: string;
    ward: string;
    street: string;
    house_number?: string;
  };
  
  // Medical Information
  blood_type?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  weight?: number; // kg
  height?: number; // cm
  medical_history: string[]; // Tiền sử bệnh
  drug_allergies: string[]; // Dị ứng thuốc
  current_medications?: string; // Thuốc đang sử dụng
  
  // Insurance Information
  insurance_number?: string; // Số thẻ BHYT
  insurance_provider?: string; // Nơi đăng ký KCB ban đầu
  insurance_valid_from?: string;
  insurance_valid_to?: string;
  
  // Emergency Contact
  emergency_contact: {
    name: string;
    relationship: string;
    phone_number: string;
    address?: string;
  };
  
  // Additional Information
  occupation?: string;
  notes?: string;
}

export class PatientRegistrationController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new patient with comprehensive information
   */
  public registerPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: "Validation failed",
          details: errors.array(),
        });
        return;
      }

      const patientData: PatientRegistrationRequest = req.body;

      // Validate required fields
      if (!patientData.email || !patientData.password || !patientData.full_name) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: email, password, full_name",
        });
        return;
      }

      if (!patientData.national_id || !patientData.phone_number) {
        res.status(400).json({
          success: false,
          error: "Missing required fields: national_id, phone_number",
        });
        return;
      }

      if (!patientData.emergency_contact?.name || !patientData.emergency_contact?.phone_number) {
        res.status(400).json({
          success: false,
          error: "Missing required emergency contact information",
        });
        return;
      }

      // Prepare data for auth service
      const authServiceData = {
        email: patientData.email,
        password: patientData.password,
        full_name: patientData.full_name,
        role: "patient" as const,
        phone_number: patientData.phone_number,
        gender: patientData.gender,
        date_of_birth: patientData.date_of_birth,
        
        // Patient specific data
        national_id: patientData.national_id,
        address: patientData.address,
        blood_type: patientData.blood_type,
        weight: patientData.weight,
        height: patientData.height,
        medical_history: patientData.medical_history,
        drug_allergies: patientData.drug_allergies,
        current_medications: patientData.current_medications,
        insurance_number: patientData.insurance_number,
        insurance_provider: patientData.insurance_provider,
        insurance_valid_from: patientData.insurance_valid_from,
        insurance_valid_to: patientData.insurance_valid_to,
        emergency_contact: patientData.emergency_contact,
        occupation: patientData.occupation,
        notes: patientData.notes,
      };

      logger.info("🏥 Patient registration attempt", {
        email: patientData.email,
        full_name: patientData.full_name,
        national_id: patientData.national_id,
        has_insurance: !!patientData.insurance_number,
        medical_conditions: patientData.medical_history?.length || 0,
        drug_allergies: patientData.drug_allergies?.length || 0,
      });

      const result = await this.authService.signUp(authServiceData);

      if (result.error) {
        // Determine appropriate status code based on error type
        let statusCode = 400;
        if (
          result.error.includes("already registered") ||
          result.error.includes("already exists") ||
          result.error.includes("duplicate")
        ) {
          statusCode = 409; // Conflict
        } else if (
          result.error.includes("Invalid") ||
          result.error.includes("validation")
        ) {
          statusCode = 400; // Bad Request
        } else if (result.error.includes("service")) {
          statusCode = 503; // Service Unavailable
        }

        logger.error("❌ Patient registration failed", {
          email: patientData.email,
          error: result.error,
          statusCode,
        });

        res.status(statusCode).json({
          success: false,
          error: result.error,
        });
        return;
      }

      logger.info("✅ Patient registration successful", {
        email: patientData.email,
        full_name: patientData.full_name,
        user_id: result.user?.id,
        patient_id: result.user?.patient_id,
      });

      res.status(201).json({
        success: true,
        message: "Patient registration successful",
        data: {
          user: result.user,
          session: result.session,
        },
      });
    } catch (error: any) {
      logger.error("💥 Patient registration controller error", {
        error: error.message,
        stack: error.stack,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: "Internal server error during patient registration",
      });
    }
  };

  /**
   * Validate patient registration data
   */
  public validatePatientData = (data: PatientRegistrationRequest): string[] => {
    const errors: string[] = [];

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push("Invalid email format");
    }

    // Password validation
    if (data.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    // National ID validation (Vietnam CCCD/CMND)
    const nationalIdRegex = /^[0-9]{9,12}$/;
    if (!nationalIdRegex.test(data.national_id)) {
      errors.push("National ID must be 9-12 digits");
    }

    // Phone number validation (Vietnam format)
    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(data.phone_number)) {
      errors.push("Phone number must be 10 digits starting with 0");
    }

    // Emergency contact phone validation
    if (data.emergency_contact?.phone_number && !phoneRegex.test(data.emergency_contact.phone_number)) {
      errors.push("Emergency contact phone number must be 10 digits starting with 0");
    }

    // Date of birth validation
    const birthDate = new Date(data.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 0 || age > 150) {
      errors.push("Invalid date of birth");
    }

    // Weight and height validation
    if (data.weight && (data.weight < 1 || data.weight > 300)) {
      errors.push("Weight must be between 1-300 kg");
    }

    if (data.height && (data.height < 50 || data.height > 250)) {
      errors.push("Height must be between 50-250 cm");
    }

    return errors;
  };

  /**
   * Get patient registration statistics
   */
  public getRegistrationStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // TODO: Implement statistics from database
      const stats = {
        total_patients: 0,
        registrations_today: 0,
        registrations_this_month: 0,
        average_age: 0,
        gender_distribution: {
          male: 0,
          female: 0,
          other: 0,
        },
        insurance_coverage: {
          with_insurance: 0,
          without_insurance: 0,
        },
      };

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error("💥 Error getting registration stats", {
        error: error.message,
        stack: error.stack,
      });

      res.status(500).json({
        success: false,
        error: "Internal server error",
      });
    }
  };
}
