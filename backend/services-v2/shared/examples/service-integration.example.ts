/**
 * Service Integration Examples
 * Demonstrates how to integrate Identity & Access Service with existing services
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Service Integration, Authentication Flow, Healthcare Security
 */

import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { SupabaseAuthMiddleware } from '../infrastructure/middleware/supabase-auth.middleware';
import { HealthcareRoleType } from '../../identity-access-service/src/domain/value-objects/healthcare-role';
import { ConsoleLogger } from '../infrastructure/logging/console.logger';

/**
 * EXAMPLE 1: PATIENT REGISTRY SERVICE INTEGRATION
 * Shows how to protect Patient Registry endpoints with authentication
 */
export class PatientRegistryServiceIntegration {
  private app: express.Application;
  private authMiddleware: SupabaseAuthMiddleware;
  private logger = new ConsoleLogger('PatientRegistryIntegration');

  constructor() {
    this.app = express();
    this.setupAuthentication();
    this.setupRoutes();
  }

  private setupAuthentication(): void {
    // Create Supabase client for authentication
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        db: { schema: 'auth_schema' }
      }
    );

    // Initialize authentication middleware
    this.authMiddleware = new SupabaseAuthMiddleware({
      supabaseClient,
      logger: this.logger,
      skipPaths: ['/health', '/metrics'],
      requireEmailVerification: true,
      enableAuditLogging: true
    });
  }

  private setupRoutes(): void {
    const { authenticate, requireRole, requirePermission, requireOwnership } = this.authMiddleware.getMiddleware();

    // Public endpoints (no authentication required)
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'patient-registry' });
    });

    // Protected endpoints with role-based access control

    // 1. Create Patient - Receptionist, Admin, or Doctor can create patients
    this.app.post('/api/v1/patients', 
      authenticate,
      requireRole([HealthcareRoleType.ADMIN, HealthcareRoleType.RECEPTIONIST, HealthcareRoleType.DOCTOR]),
      this.createPatient.bind(this)
    );

    // 2. Get Patient by ID - Role-based access with ownership check
    this.app.get('/api/v1/patients/:patientId',
      authenticate,
      this.checkPatientAccess.bind(this),
      this.getPatientById.bind(this)
    );

    // 3. Update Patient - Permission-based access
    this.app.put('/api/v1/patients/:patientId',
      authenticate,
      requirePermission('patient:update'),
      this.updatePatient.bind(this)
    );

    // 4. Get Patient Medical History - Strict access control
    this.app.get('/api/v1/patients/:patientId/medical-history',
      authenticate,
      requireRole([HealthcareRoleType.DOCTOR, HealthcareRoleType.NURSE, HealthcareRoleType.ADMIN]),
      this.getPatientMedicalHistory.bind(this)
    );

    // 5. Patient's own data access
    this.app.get('/api/v1/patients/me',
      authenticate,
      requireRole(HealthcareRoleType.PATIENT),
      this.getOwnPatientData.bind(this)
    );
  }

  // Custom middleware for patient access control
  private checkPatientAccess(req: Request, res: Response, next: NextFunction): void {
    const { patientId } = req.params;
    const user = req.user!;

    // Admin can access all patients
    if (user.roles.some(role => role.type === HealthcareRoleType.ADMIN)) {
      return next();
    }

    // Patient can only access their own data
    if (user.roles.some(role => role.type === HealthcareRoleType.PATIENT)) {
      if (patientId === user.id) {
        return next();
      } else {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập dữ liệu bệnh nhân này',
          code: 'PATIENT_ACCESS_DENIED'
        });
      }
    }

    // Healthcare providers can access assigned patients
    if (user.roles.some(role => [HealthcareRoleType.DOCTOR, HealthcareRoleType.NURSE].includes(role.type))) {
      // In real implementation, check if patient is assigned to this provider
      // For demo, we'll allow access
      return next();
    }

    // Receptionist can access all patients for administrative purposes
    if (user.roles.some(role => role.type === HealthcareRoleType.RECEPTIONIST)) {
      return next();
    }

    res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập',
      code: 'ACCESS_DENIED'
    });
  }

  // Route handlers with authentication context
  private async createPatient(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const patientData = req.body;

      this.logger.info('Creating patient', {
        createdBy: user.id,
        createdByRole: user.roles.map(r => r.type),
        patientData: { ...patientData, sensitiveDataRemoved: true }
      });

      // Business logic here...
      const newPatient = {
        id: 'patient-123',
        ...patientData,
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: 'Bệnh nhân đã được tạo thành công',
        data: newPatient
      });

    } catch (error) {
      this.logger.error('Error creating patient', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tạo bệnh nhân',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  private async getPatientById(req: Request, res: Response): Promise<void> {
    try {
      const { patientId } = req.params;
      const user = req.user!;

      this.logger.info('Getting patient by ID', {
        patientId,
        requestedBy: user.id,
        requestedByRole: user.roles.map(r => r.type)
      });

      // Business logic here...
      const patient = {
        id: patientId,
        fullName: 'Nguyễn Văn A',
        dateOfBirth: '1990-01-01',
        // Data filtering based on user role
        sensitiveData: user.roles.some(r => [HealthcareRoleType.DOCTOR, HealthcareRoleType.ADMIN].includes(r.type))
          ? { medicalHistory: 'Full access' }
          : undefined
      };

      res.json({
        success: true,
        data: patient
      });

    } catch (error) {
      this.logger.error('Error getting patient', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy thông tin bệnh nhân',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  private async updatePatient(req: Request, res: Response): Promise<void> {
    // Implementation similar to above...
    res.json({ success: true, message: 'Patient updated successfully' });
  }

  private async getPatientMedicalHistory(req: Request, res: Response): Promise<void> {
    // Implementation with strict medical data access...
    res.json({ success: true, data: { medicalHistory: 'Restricted medical data' } });
  }

  private async getOwnPatientData(req: Request, res: Response): Promise<void> {
    // Patient accessing their own data...
    res.json({ success: true, data: { ownData: 'Patient personal data' } });
  }
}

/**
 * EXAMPLE 2: SCHEDULING SERVICE INTEGRATION
 * Shows how to integrate with Scheduling Service for appointment management
 */
export class SchedulingServiceIntegration {
  private app: express.Application;
  private authMiddleware: SupabaseAuthMiddleware;
  private logger = new ConsoleLogger('SchedulingIntegration');

  constructor() {
    this.app = express();
    this.setupAuthentication();
    this.setupRoutes();
  }

  private setupAuthentication(): void {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.authMiddleware = new SupabaseAuthMiddleware({
      supabaseClient,
      logger: this.logger,
      skipPaths: ['/health'],
      requireEmailVerification: true,
      enableAuditLogging: true
    });
  }

  private setupRoutes(): void {
    const { authenticate, requireRole, requirePermission } = this.authMiddleware.getMiddleware();

    // Appointment management with role-based access

    // 1. Create Appointment - Patients can create their own, staff can create for others
    this.app.post('/api/v1/appointments',
      authenticate,
      this.createAppointment.bind(this)
    );

    // 2. Get Appointments - Role-based filtering
    this.app.get('/api/v1/appointments',
      authenticate,
      this.getAppointments.bind(this)
    );

    // 3. Update Appointment Status - Healthcare providers only
    this.app.put('/api/v1/appointments/:appointmentId/status',
      authenticate,
      requireRole([HealthcareRoleType.DOCTOR, HealthcareRoleType.NURSE, HealthcareRoleType.RECEPTIONIST]),
      this.updateAppointmentStatus.bind(this)
    );

    // 4. Cancel Appointment - Patients can cancel their own, staff can cancel any
    this.app.delete('/api/v1/appointments/:appointmentId',
      authenticate,
      this.cancelAppointment.bind(this)
    );
  }

  private async createAppointment(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const appointmentData = req.body;

      // Business logic based on user role
      if (user.roles.some(role => role.type === HealthcareRoleType.PATIENT)) {
        // Patients can only create appointments for themselves
        appointmentData.patientId = user.id;
      } else if (user.roles.some(role => [HealthcareRoleType.RECEPTIONIST, HealthcareRoleType.ADMIN].includes(role.type))) {
        // Staff can create appointments for any patient
        if (!appointmentData.patientId) {
          return res.status(400).json({
            success: false,
            message: 'Patient ID is required',
            messageVietnamese: 'Cần cung cấp ID bệnh nhân'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền tạo lịch hẹn',
          code: 'APPOINTMENT_CREATE_DENIED'
        });
      }

      this.logger.info('Creating appointment', {
        createdBy: user.id,
        createdByRole: user.roles.map(r => r.type),
        patientId: appointmentData.patientId
      });

      const newAppointment = {
        id: 'appointment-123',
        ...appointmentData,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        status: 'scheduled'
      };

      res.status(201).json({
        success: true,
        message: 'Lịch hẹn đã được tạo thành công',
        data: newAppointment
      });

    } catch (error) {
      this.logger.error('Error creating appointment', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi tạo lịch hẹn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  private async getAppointments(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { patientId, providerId, status, date } = req.query;

      let appointments: any[] = [];

      // Filter appointments based on user role
      if (user.roles.some(role => role.type === HealthcareRoleType.PATIENT)) {
        // Patients can only see their own appointments
        appointments = this.getPatientAppointments(user.id);
      } else if (user.roles.some(role => role.type === HealthcareRoleType.DOCTOR)) {
        // Doctors can see appointments assigned to them
        appointments = this.getProviderAppointments(user.id);
      } else if (user.roles.some(role => [HealthcareRoleType.RECEPTIONIST, HealthcareRoleType.ADMIN].includes(role.type))) {
        // Staff can see all appointments with filtering
        appointments = this.getAllAppointments({ patientId, providerId, status, date });
      }

      res.json({
        success: true,
        data: {
          appointments,
          totalCount: appointments.length,
          filters: { patientId, providerId, status, date }
        }
      });

    } catch (error) {
      this.logger.error('Error getting appointments', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi lấy danh sách lịch hẹn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  private async updateAppointmentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const { status, notes } = req.body;
      const user = req.user!;

      this.logger.info('Updating appointment status', {
        appointmentId,
        newStatus: status,
        updatedBy: user.id,
        updatedByRole: user.roles.map(r => r.type)
      });

      // Business logic for status updates...
      const updatedAppointment = {
        id: appointmentId,
        status,
        notes,
        updatedBy: user.id,
        updatedAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: 'Trạng thái lịch hẹn đã được cập nhật',
        data: updatedAppointment
      });

    } catch (error) {
      this.logger.error('Error updating appointment status', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi cập nhật trạng thái lịch hẹn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  private async cancelAppointment(req: Request, res: Response): Promise<void> {
    try {
      const { appointmentId } = req.params;
      const { reason } = req.body;
      const user = req.user!;

      // Check if user can cancel this appointment
      const appointment = this.getAppointmentById(appointmentId);
      
      if (user.roles.some(role => role.type === HealthcareRoleType.PATIENT)) {
        // Patients can only cancel their own appointments
        if (appointment.patientId !== user.id) {
          return res.status(403).json({
            success: false,
            message: 'Không thể hủy lịch hẹn của bệnh nhân khác',
            code: 'APPOINTMENT_CANCEL_DENIED'
          });
        }
      }

      this.logger.info('Cancelling appointment', {
        appointmentId,
        cancelledBy: user.id,
        cancelledByRole: user.roles.map(r => r.type),
        reason
      });

      res.json({
        success: true,
        message: 'Lịch hẹn đã được hủy thành công',
        data: {
          appointmentId,
          status: 'cancelled',
          cancelledBy: user.id,
          cancelledAt: new Date().toISOString(),
          reason
        }
      });

    } catch (error) {
      this.logger.error('Error cancelling appointment', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống khi hủy lịch hẹn',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // Helper methods (mock implementations)
  private getPatientAppointments(patientId: string): any[] {
    return [{ id: '1', patientId, status: 'scheduled', type: 'consultation' }];
  }

  private getProviderAppointments(providerId: string): any[] {
    return [{ id: '2', providerId, status: 'scheduled', type: 'consultation' }];
  }

  private getAllAppointments(filters: any): any[] {
    return [{ id: '3', status: 'scheduled', type: 'consultation', ...filters }];
  }

  private getAppointmentById(appointmentId: string): any {
    return { id: appointmentId, patientId: 'patient-123', status: 'scheduled' };
  }
}

/**
 * EXAMPLE 3: UNIFIED AUTHENTICATION FLOW
 * Shows complete authentication flow across all services
 */
export class UnifiedAuthenticationFlow {
  /**
   * Step 1: User logs in through Identity & Access Service
   */
  static async loginFlow(): Promise<void> {
    console.log(`
    1. USER LOGIN FLOW:
    
    Frontend → POST /api/v1/auth/login
    {
      "email": "doctor@hospital.com",
      "password": "Doctor123!!"
    }
    
    Identity Service Response:
    {
      "success": true,
      "data": {
        "user": {
          "id": "user-123",
          "email": "doctor@hospital.com",
          "fullName": "Dr. Nguyễn Văn A",
          "roles": [{"type": "doctor", "permissions": [...]}]
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresAt": "2024-01-01T12:00:00Z"
      }
    }
    `);
  }

  /**
   * Step 2: Frontend stores token and makes authenticated requests
   */
  static async authenticatedRequestFlow(): Promise<void> {
    console.log(`
    2. AUTHENTICATED REQUEST FLOW:
    
    Frontend → GET /api/v1/patients/123
    Headers: {
      "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "X-Correlation-ID": "req_123456"
    }
    
    Service Flow:
    1. SupabaseAuthMiddleware validates JWT token
    2. Loads user context (roles, permissions, profile)
    3. Checks role-based access (doctor can access assigned patients)
    4. Executes business logic
    5. Returns filtered data based on user role
    `);
  }

  /**
   * Step 3: Cross-service communication with authentication
   */
  static async crossServiceFlow(): Promise<void> {
    console.log(`
    3. CROSS-SERVICE COMMUNICATION:
    
    Scheduling Service → Patient Registry Service
    Headers: {
      "Authorization": "Bearer service-to-service-token",
      "X-Service-Name": "scheduling-service",
      "X-Correlation-ID": "req_123456"
    }
    
    Service-to-Service Authentication:
    1. Use service role key for internal communication
    2. Validate service identity
    3. Apply service-level permissions
    4. Maintain audit trail across services
    `);
  }
}

export {
  PatientRegistryServiceIntegration,
  SchedulingServiceIntegration,
  UnifiedAuthenticationFlow
};
