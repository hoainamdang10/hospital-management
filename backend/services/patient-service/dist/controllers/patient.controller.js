"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const express_validator_1 = require("express-validator");
const patient_repository_1 = require("../repositories/patient.repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientController {
    constructor() {
        this.patientRepository = new patient_repository_1.PatientRepository();
    }
    async getAllPatients(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const filters = {
                search: req.query.search,
                gender: req.query.gender,
                status: req.query.status,
                blood_type: req.query.blood_type,
                age_min: req.query.age_min ? parseInt(req.query.age_min) : undefined,
                age_max: req.query.age_max ? parseInt(req.query.age_max) : undefined,
                created_after: req.query.created_after,
                created_before: req.query.created_before
            };
            const { patients, total } = await this.patientRepository.getAllPatients(filters, page, limit);
            const response = {
                success: true,
                data: patients,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getAllPatients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientById(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patient_id } = req.params;
            const patient = await this.patientRepository.getPatientById(patient_id);
            if (!patient) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const response = {
                success: true,
                data: patient,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientById:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientByProfileId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { profileId } = req.params;
            const patient = await this.patientRepository.getPatientByProfileId(profileId);
            if (!patient) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const response = {
                success: true,
                data: patient,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientByProfileId:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientCountForDoctor(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { doctor_id } = req.params;
            const count = await this.patientRepository.getPatientCountForDoctor(doctor_id);
            const response = {
                success: true,
                data: { count },
                message: `Found ${doctor_id}`,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientCountForDoctor:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get patient count for doctor',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientStatsForDoctor(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { doctor_id } = req.params;
            logger_1.default.info(`Getting patient statistics for doctor: ${doctor_id}`);
            const stats = await this.patientRepository.getPatientStatsForDoctor(doctor_id);
            const response = {
                success: true,
                data: stats,
                message: `Patient statistics retrieved for doctor ${doctor_id}`,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientStatsForDoctor:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get patient statistics for doctor',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientsByDoctorId(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { doctor_id } = req.params;
            const patients = await this.patientRepository.getPatientsByDoctorId(doctor_id);
            const response = {
                success: true,
                data: patients,
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in getPatientsByDoctorId:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async createPatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { profile_id } = req.body;
            if (!profile_id) {
                logger_1.default.info('Patient creation request without profile_id - redirecting to Auth Service');
                res.status(400).json({
                    success: false,
                    error: 'Patient creation handled by Auth Service',
                    message: 'Use Auth Service /api/auth/register-patient endpoint for complete patient registration',
                    redirect: {
                        service: 'auth-service',
                        endpoint: '/api/auth/register-patient',
                        method: 'POST',
                        required_fields: ['email', 'password', 'full_name', 'phone_number', 'gender', 'date_of_birth'],
                        example: {
                            email: 'patient@hospital.com',
                            password: 'Password123',
                            full_name: 'John Doe',
                            phone_number: '0123456789',
                            gender: 'male',
                            date_of_birth: '1990-01-01',
                            blood_type: 'O+',
                            address: {
                                street: '123 Main St',
                                city: 'Ho Chi Minh City',
                                district: 'District 1',
                                ward: 'Ward 1'
                            },
                            emergency_contact: {
                                name: 'Emergency Contact',
                                phone: '0987654321',
                                relationship: 'spouse'
                            }
                        }
                    },
                    timestamp: new Date().toISOString()
                });
                return;
            }
            logger_1.default.info('Direct patient creation request with profile_id:', {
                profile_id,
                full_name: req.body.full_name
            });
            const patient = await this.patientRepository.createPatient(req.body);
            logger_1.default.info('Patient created successfully:', {
                patient_id: patient.patient_id,
                profile_id: patient.profile_id
            });
            res.status(201).json({
                success: true,
                message: 'Patient created successfully',
                data: patient,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in createPatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async updatePatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                logger_1.default.warn('Validation failed for updatePatient:', {
                    patient_id: req.params.patient_id,
                    errors: errors.array()
                });
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patient_id } = req.params;
            if (!patient_id) {
                logger_1.default.warn('No patient ID provided in updatePatient');
                res.status(400).json({
                    success: false,
                    error: 'Patient ID is required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const updateData = req.body;
            logger_1.default.info('Updating patient:', { patient_id, updateFields: Object.keys(updateData) });
            const exists = await this.patientRepository.patientExists(patient_id);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const patient = await this.patientRepository.updatePatient(patient_id, updateData);
            const response = {
                success: true,
                data: patient,
                message: 'Patient updated successfully',
                timestamp: new Date().toISOString()
            };
            res.json(response);
        }
        catch (error) {
            logger_1.default.error('Error in updatePatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async deletePatient(req, res) {
        try {
            const errors = (0, express_validator_1.validationResult)(req);
            if (!errors.isEmpty()) {
                res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: errors.array(),
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const { patient_id } = req.params;
            const exists = await this.patientRepository.patientExists(patient_id);
            if (!exists) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            await this.patientRepository.deletePatient(patient_id);
            res.json({
                success: true,
                message: 'Patient deleted successfully',
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in deletePatient:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete patient',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientStats(req, res) {
        try {
            const stats = await this.patientRepository.getPatientStats();
            res.json({
                success: true,
                data: stats,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getPatientStats:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient statistics',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async searchPatients(req, res) {
        try {
            const { q: searchTerm, limit = 10 } = req.query;
            if (!searchTerm || typeof searchTerm !== 'string') {
                res.status(400).json({
                    success: false,
                    error: 'Search term is required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const patients = await this.patientRepository.searchPatients(searchTerm, Number(limit));
            res.json({
                success: true,
                data: patients,
                count: patients.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in searchPatients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to search patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientsWithUpcomingAppointments(req, res) {
        try {
            const patients = await this.patientRepository.getPatientsWithUpcomingAppointments();
            res.json({
                success: true,
                data: patients,
                count: patients.length,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getPatientsWithUpcomingAppointments:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patients with upcoming appointments',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getPatientMedicalSummary(req, res) {
        try {
            const { patient_id } = req.params;
            if (!patient_id) {
                res.status(400).json({
                    success: false,
                    error: 'Patient ID is required',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            const summary = await this.patientRepository.getPatientMedicalSummary(patient_id);
            if (!summary.patient) {
                res.status(404).json({
                    success: false,
                    error: 'Patient not found',
                    timestamp: new Date().toISOString()
                });
                return;
            }
            res.json({
                success: true,
                data: summary,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getPatientMedicalSummary:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient medical summary',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getRealtimeStatus(req, res) {
        try {
            res.json({
                success: true,
                data: {
                    realtime_enabled: true,
                    websocket_enabled: true,
                    supabase_subscription: true,
                    patient_monitoring: true,
                    connected_clients: 0,
                    last_event: null,
                    uptime: process.uptime()
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getRealtimeStatus:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get real-time status',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
    async getLivePatients(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const { patients, total } = await this.patientRepository.getAllPatients({}, page, limit);
            res.json({
                success: true,
                data: {
                    patients,
                    realtime_enabled: true,
                    live_updates: true,
                    websocket_channel: 'patients_realtime',
                    subscription_info: {
                        events: ['INSERT', 'UPDATE', 'DELETE'],
                        filters: ['medical_history_updates', 'emergency_contact_updates', 'new_patients']
                    }
                },
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                },
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_1.default.error('Error in getLivePatients:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch live patients',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
        }
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=patient.controller.js.map