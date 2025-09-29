import { logger } from "@hospital/shared";
import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { MedicalRecordRepository } from "../repositories/medical-record.repository";

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export class MedicalRecordController {
  private medicalRecordRepository: MedicalRecordRepository;

  constructor() {
    this.medicalRecordRepository = new MedicalRecordRepository();
  }

  async getAllMedicalRecords(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const records = await this.medicalRecordRepository.findAll(limit, offset);
      const total = await this.medicalRecordRepository.count();

      res.json({
        success: true,
        data: records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Error fetching medical records", { error });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getMedicalRecordById(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const record = await this.medicalRecordRepository.findById(recordId);

      if (!record) {
        res.status(404).json({
          success: false,
          message: "Medical record not found",
        });
        return;
      }

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      logger.error("Error fetching medical record by ID", {
        error,
        recordId: req.params.recordId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getMedicalRecordsByPatientId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { patient_id } = req.params;
      const records =
        await this.medicalRecordRepository.findByPatientId(patient_id);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      logger.error("Error fetching medical records by patient ID", {
        error,
        patient_id: req.params.patient_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getMedicalRecordsByDoctorId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const records =
        await this.medicalRecordRepository.findByDoctorId(doctor_id);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      logger.error("Error fetching medical records by doctor ID", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async createMedicalRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const userId = req.user?.id || "SYSTEM";
      const record = await this.medicalRecordRepository.create(
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        message: "Medical record created successfully",
        data: record,
      });
    } catch (error) {
      logger.error("Error creating medical record", { error, body: req.body });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updateMedicalRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { recordId } = req.params;
      const userId = req.user?.id || "SYSTEM";

      const record = await this.medicalRecordRepository.update(
        recordId,
        req.body,
        userId
      );

      res.json({
        success: true,
        message: "Medical record updated successfully",
        data: record,
      });
    } catch (error) {
      logger.error("Error updating medical record", {
        error,
        recordId: req.params.recordId,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async deleteMedicalRecord(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      await this.medicalRecordRepository.delete(recordId);

      res.json({
        success: true,
        message: "Medical record deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting medical record", {
        error,
        recordId: req.params.recordId,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // =============================
  // VITAL SIGNS ENDPOINTS
  // =============================
  async addVitalSigns(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const userId = req.user?.id || "SYSTEM";
      await this.medicalRecordRepository.insertVital(
        recordId,
        req.body,
        userId
      );
      res.status(201).json({ success: true, message: "Vital signs added" });
    } catch (error) {
      logger.error("Error adding vital signs", { error, params: req.params });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async listVitalSigns(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const { from, to } = req.query as any;
      const data = await this.medicalRecordRepository.listVitals(
        recordId,
        from,
        to
      );
      res.json({ success: true, data });
    } catch (error) {
      logger.error("Error listing vital signs", { error, params: req.params });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // =============================
  // LAB RESULTS ENDPOINTS
  // =============================
  async createLabResult(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { recordId } = req.params;
      await this.medicalRecordRepository.createLabResult(recordId, req.body);
      res.status(201).json({ success: true, message: "Lab result created" });
    } catch (error) {
      logger.error("Error creating lab result", { error, body: req.body });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async updateLabResult(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const { recordId, resultId } = req.params as any;
      await this.medicalRecordRepository.updateLabResult(
        recordId,
        resultId,
        req.body
      );
      res.json({ success: true, message: "Lab result updated" });
    } catch (error) {
      logger.error("Error updating lab result", { error, params: req.params });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async listLabResultsByRecord(req: Request, res: Response): Promise<void> {
    try {
      const { recordId } = req.params;
      const data =
        await this.medicalRecordRepository.listLabResultsByRecord(recordId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error("Error listing lab results by record", {
        error,
        params: req.params,
      });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  async listLabResultsByPatient(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params as any;
      const data =
        await this.medicalRecordRepository.listLabResultsByPatient(patientId);
      res.json({ success: true, data });
    } catch (error) {
      logger.error("Error listing lab results by patient", {
        error,
        params: req.params,
      });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // =============================
  // MEDICAL HISTORY ENDPOINT
  // =============================
  async getPatientHistory(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params as any;
      const { from, to, type } = req.query as any;
      const data = await this.medicalRecordRepository.getPatientHistory(
        patientId,
        from,
        to,
        type as any
      );
      res.json({ success: true, data });
    } catch (error) {
      logger.error("Error getting patient history", {
        error,
        params: req.params,
      });
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  }

  // REMOVED: Lab Results endpoints - lab results now stored as simple text in medical records

  // REMOVED: Vital Signs endpoints - vital signs now embedded as BasicVitalSigns in medical records

  // ============================================
  // PRESCRIPTION ENDPOINTS (Merged from Prescription Service)
  // ============================================

  async createPrescriptionForRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { recordId } = req.params;
      const userId = req.user?.id || "SYSTEM";

      const prescription =
        await this.medicalRecordRepository.createPrescriptionForRecord(
          recordId,
          req.body,
          userId
        );

      res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        data: prescription,
      });
    } catch (error) {
      logger.error("Error creating prescription for record", {
        error,
        body: req.body,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async updatePrescriptionInRecord(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
        return;
      }

      const { recordId, prescriptionId } = req.params;

      const prescription =
        await this.medicalRecordRepository.updatePrescriptionInRecord(
          recordId,
          prescriptionId,
          req.body
        );

      res.json({
        success: true,
        message: "Prescription updated successfully",
        data: prescription,
      });
    } catch (error) {
      logger.error("Error updating prescription in record", {
        error,
        params: req.params,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getPrescriptionsByPatientId(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { patient_id } = req.params;
      const prescriptions =
        await this.medicalRecordRepository.getPrescriptionsByPatientId(
          patient_id
        );

      res.json({
        success: true,
        message: "Prescriptions retrieved successfully",
        data: prescriptions,
      });
    } catch (error) {
      logger.error("Error fetching prescriptions by patient ID", {
        error,
        patient_id: req.params.patient_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  async getPrescriptionsByDoctorId(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const prescriptions =
        await this.medicalRecordRepository.getPrescriptionsByDoctorId(
          doctor_id
        );

      res.json({
        success: true,
        message: "Prescriptions retrieved successfully",
        data: prescriptions,
      });
    } catch (error) {
      logger.error("Error fetching prescriptions by doctor ID", {
        error,
        doctor_id: req.params.doctor_id,
      });
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
}
