import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PatientRepository } from '../repositories/patient.repository';
import logger from '@hospital/shared/dist/utils/logger';
import { 
  CreatePatientDto, 
  UpdatePatientDto, 
  PatientSearchFilters,
  PatientResponse,
  PaginatedPatientResponse
} from '../types/patient.types';

export class PatientController {
  private patientRepository: PatientRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
  }

  // Get all patients with optional filters and pagination
  async getAllPatients(req: Request, res: Response): Promise<void> {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const filters: PatientSearchFilters = {
        search: req.query.search as string,
        gender: req.query.gender as 'male' | 'female' | 'other',
        status: req.query.status as 'active' | 'inactive' | 'suspended',
        blood_type: req.query.blood_type as string,
        age_min: req.query.age_min ? parseInt(req.query.age_min as string) : undefined,
        age_max: req.query.age_max ? parseInt(req.query.age_max as string) : undefined,
        created_after: req.query.created_after as string,
        created_before: req.query.created_before as string
      };

      const { patients, total } = await this.patientRepository.getAllPatients(filters, page, limit);

      const response: PaginatedPatientResponse = {
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
    } catch (error) {
      logger.error('Error in getAllPatients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient by ID
  async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientById:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient by profile ID
  async getPatientByProfileId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientByProfileId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient count for a specific doctor
  async getPatientCountForDoctor(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
    } catch (error) {
      logger.error('Error in getPatientCountForDoctor:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get patient count for doctor',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient statistics for a specific doctor
  async getPatientStatsForDoctor(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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
      logger.info(`Getting patient statistics for doctor: ${doctor_id}`);

      // Get comprehensive patient statistics for the doctor
      const stats = await this.patientRepository.getPatientStatsForDoctor(doctor_id);

      const response = {
        success: true,
        data: stats,
        message: `Patient statistics retrieved for doctor ${doctor_id}`,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientStatsForDoctor:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get patient statistics for doctor',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patients by doctor ID
  async getPatientsByDoctorId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      const response: PatientResponse = {
        success: true,
        data: patients,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in getPatientsByDoctorId:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Create new patient - Support both direct creation and Auth Service redirect
  async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array(),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Check if this is a direct patient creation request (with profile_id)
      // or a complete registration request (without profile_id)
      const { profile_id } = req.body;

      if (!profile_id) {
        // No profile_id provided - redirect to Auth Service for complete registration
        logger.info('Patient creation request without profile_id - redirecting to Auth Service');

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

      // profile_id provided - this is a direct patient creation (internal service call)
      logger.info('Direct patient creation request with profile_id:', {
        profile_id,
        full_name: req.body.full_name
      });

      // Create patient record directly
      const patient = await this.patientRepository.createPatient(req.body);

      logger.info('Patient created successfully:', {
        patient_id: patient.patient_id,
        profile_id: patient.profile_id
      });

      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patient,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error in createPatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Update patient
  async updatePatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Validation failed for updatePatient:', {
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

      // Check if patient_id is provided
      if (!patient_id) {
        logger.warn('No patient ID provided in updatePatient');
        res.status(400).json({
          success: false,
          error: 'Patient ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updateData: UpdatePatientDto = req.body;
      logger.info('Updating patient:', { patient_id, updateFields: Object.keys(updateData) });

      // Check if patient exists
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

      const response: PatientResponse = {
        success: true,
        data: patient,
        message: 'Patient updated successfully',
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      logger.error('Error in updatePatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Delete patient (soft delete)
  async deletePatient(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
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

      // Check if patient exists
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
    } catch (error) {
      logger.error('Error in deletePatient:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete patient',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get patient statistics
  async getPatientStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.patientRepository.getPatientStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getPatientStats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ENHANCED: Search patients
  async searchPatients(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      logger.error('Error in searchPatients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ENHANCED: Get patients with upcoming appointments
  async getPatientsWithUpcomingAppointments(req: Request, res: Response): Promise<void> {
    try {
      const patients = await this.patientRepository.getPatientsWithUpcomingAppointments();

      res.json({
        success: true,
        data: patients,
        count: patients.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getPatientsWithUpcomingAppointments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patients with upcoming appointments',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // ENHANCED: Get patient medical summary
  async getPatientMedicalSummary(req: Request, res: Response): Promise<void> {
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
    } catch (error) {
      logger.error('Error in getPatientMedicalSummary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch patient medical summary',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // REAL-TIME FEATURES

  // Get real-time service status
  async getRealtimeStatus(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          realtime_enabled: true,
          websocket_enabled: true,
          supabase_subscription: true,
          patient_monitoring: true,
          connected_clients: 0, // Will be updated when WebSocket is integrated
          last_event: null,
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error in getRealtimeStatus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get real-time status',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get live patients with real-time capabilities
  async getLivePatients(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Get current patients
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
    } catch (error) {
      logger.error('Error in getLivePatients:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch live patients',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }
}
