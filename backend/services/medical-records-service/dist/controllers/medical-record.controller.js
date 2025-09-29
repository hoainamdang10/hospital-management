"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const shared_1 = require("@hospital/shared");
const express_validator_1 = require("express-validator");
const medical_record_repository_1 = require("../repositories/medical-record.repository");
class MedicalRecordController {
    constructor() {
        this.medicalRecordRepository = new medical_record_repository_1.MedicalRecordRepository();
    }
    async getAllMedicalRecords(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
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
        }
        catch (error) {
            shared_1.logger.error("Error fetching medical records", { error });
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    async getMedicalRecordById(req, res) {
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
        }
        catch (error) {
            shared_1.logger.error("Error fetching medical record by ID", {
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
    async getMedicalRecordsByPatientId(req, res) {
        try {
            const { patient_id } = req.params;
            const records = await this.medicalRecordRepository.findByPatientId(patient_id);
            res.json({
                success: true,
                data: records,
            });
        }
        catch (error) {
            shared_1.logger.error("Error fetching medical records by patient ID", {
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
    async getMedicalRecordsByDoctorId(req, res) {
        try {
            const { doctor_id } = req.params;
            const records = await this.medicalRecordRepository.findByDoctorId(doctor_id);
            res.json({
                success: true,
                data: records,
            });
        }
        catch (error) {
            shared_1.logger.error("Error fetching medical records by doctor ID", {
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
    async createMedicalRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
                return;
            }
            const userId = req.user?.id || "SYSTEM";
            const record = await this.medicalRecordRepository.create(req.body, userId);
            res.status(201).json({
                success: true,
                message: "Medical record created successfully",
                data: record,
            });
        }
        catch (error) {
            shared_1.logger.error("Error creating medical record", { error, body: req.body });
            res.status(500).json({
                success: false,
                message: "Internal server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
    async updateMedicalRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
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
            const record = await this.medicalRecordRepository.update(recordId, req.body, userId);
            res.json({
                success: true,
                message: "Medical record updated successfully",
                data: record,
            });
        }
        catch (error) {
            shared_1.logger.error("Error updating medical record", {
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
    async deleteMedicalRecord(req, res) {
        try {
            const { recordId } = req.params;
            await this.medicalRecordRepository.delete(recordId);
            res.json({
                success: true,
                message: "Medical record deleted successfully",
            });
        }
        catch (error) {
            shared_1.logger.error("Error deleting medical record", {
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
    async addVitalSigns(req, res) {
        try {
            const { recordId } = req.params;
            const userId = req.user?.id || "SYSTEM";
            await this.medicalRecordRepository.insertVital(recordId, req.body, userId);
            res.status(201).json({ success: true, message: "Vital signs added" });
        }
        catch (error) {
            shared_1.logger.error("Error adding vital signs", { error, params: req.params });
            res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
    }
    async listVitalSigns(req, res) {
        try {
            const { recordId } = req.params;
            const { from, to } = req.query;
            const data = await this.medicalRecordRepository.listVitals(recordId, from, to);
            res.json({ success: true, data });
        }
        catch (error) {
            shared_1.logger.error("Error listing vital signs", { error, params: req.params });
            res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
    }
    // =============================
    // LAB RESULTS ENDPOINTS
    // =============================
    async createLabResult(req, res) {
        try {
            const { recordId } = req.params;
            await this.medicalRecordRepository.createLabResult(recordId, req.body);
            res.status(201).json({ success: true, message: "Lab result created" });
        }
        catch (error) {
            shared_1.logger.error("Error creating lab result", { error, body: req.body });
            res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
    }
    async updateLabResult(req, res) {
        try {
            const { recordId, resultId } = req.params;
            await this.medicalRecordRepository.updateLabResult(recordId, resultId, req.body);
            res.json({ success: true, message: "Lab result updated" });
        }
        catch (error) {
            shared_1.logger.error("Error updating lab result", { error, params: req.params });
            res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
    }
    async listLabResultsByRecord(req, res) {
        try {
            const { recordId } = req.params;
            const data = await this.medicalRecordRepository.listLabResultsByRecord(recordId);
            res.json({ success: true, data });
        }
        catch (error) {
            shared_1.logger.error("Error listing lab results by record", {
                error,
                params: req.params,
            });
            res
                .status(500)
                .json({ success: false, message: "Internal server error" });
        }
    }
    async listLabResultsByPatient(req, res) {
        try {
            const { patientId } = req.params;
            const data = await this.medicalRecordRepository.listLabResultsByPatient(patientId);
            res.json({ success: true, data });
        }
        catch (error) {
            shared_1.logger.error("Error listing lab results by patient", {
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
    async getPatientHistory(req, res) {
        try {
            const { patientId } = req.params;
            const { from, to, type } = req.query;
            const data = await this.medicalRecordRepository.getPatientHistory(patientId, from, to, type);
            res.json({ success: true, data });
        }
        catch (error) {
            shared_1.logger.error("Error getting patient history", {
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
    async createPrescriptionForRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
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
            const prescription = await this.medicalRecordRepository.createPrescriptionForRecord(recordId, req.body, userId);
            res.status(201).json({
                success: true,
                message: "Prescription created successfully",
                data: prescription,
            });
        }
        catch (error) {
            shared_1.logger.error("Error creating prescription for record", {
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
    async updatePrescriptionInRecord(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    message: "Validation failed",
                    errors: errors.array(),
                });
                return;
            }
            const { recordId, prescriptionId } = req.params;
            const prescription = await this.medicalRecordRepository.updatePrescriptionInRecord(recordId, prescriptionId, req.body);
            res.json({
                success: true,
                message: "Prescription updated successfully",
                data: prescription,
            });
        }
        catch (error) {
            shared_1.logger.error("Error updating prescription in record", {
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
    async getPrescriptionsByPatientId(req, res) {
        try {
            const { patient_id } = req.params;
            const prescriptions = await this.medicalRecordRepository.getPrescriptionsByPatientId(patient_id);
            res.json({
                success: true,
                message: "Prescriptions retrieved successfully",
                data: prescriptions,
            });
        }
        catch (error) {
            shared_1.logger.error("Error fetching prescriptions by patient ID", {
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
    async getPrescriptionsByDoctorId(req, res) {
        try {
            const { doctor_id } = req.params;
            const prescriptions = await this.medicalRecordRepository.getPrescriptionsByDoctorId(doctor_id);
            res.json({
                success: true,
                message: "Prescriptions retrieved successfully",
                data: prescriptions,
            });
        }
        catch (error) {
            shared_1.logger.error("Error fetching prescriptions by doctor ID", {
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
exports.MedicalRecordController = MedicalRecordController;
//# sourceMappingURL=medical-record.controller.js.map