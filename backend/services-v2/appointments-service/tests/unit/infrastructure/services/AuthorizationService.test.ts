/**
 * Authorization Service Unit Tests
 * Tests RBAC logic for appointments
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */

import { AuthorizationService } from '../../../../src/infrastructure/services/AuthorizationService';
import { UserRole } from '../../../../src/application/services/IAuthorizationService';

// Mock Supabase
const mockSingle = jest.fn();
const mockEqChain: any = { single: mockSingle };
mockEqChain.eq = jest.fn(() => mockEqChain); // Allow chaining .eq().eq()
const mockEq = jest.fn(() => mockEqChain);
const mockSelect = jest.fn(() => ({ eq: mockEq }));
const mockFrom = jest.fn(() => ({ select: mockSelect }));
const mockSchema = jest.fn(() => ({ from: mockFrom }));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
    schema: mockSchema,
  })),
}));

// Helper to setup role mock with lowercase role_type (as stored in DB)
const mockUserRole = (role: UserRole) => {
  mockSingle.mockResolvedValueOnce({
    data: { role_type: role.toLowerCase() },
    error: null,
  });
};

// Helper to setup patient ID resolution
const mockPatientIdResolution = (userId: string, patientId: string | null) => {
  mockSingle.mockResolvedValueOnce({
    data: patientId ? { patient_id: patientId } : null,
    error: patientId ? null : { message: 'Not found' },
  });
};

// Helper to setup doctor ID resolution
const mockDoctorIdResolution = (userId: string, doctorId: string | null) => {
  mockSingle.mockResolvedValueOnce({
    data: doctorId ? { staff_id: doctorId } : null,
    error: doctorId ? null : { message: 'Not found' },
  });
};

describe('AuthorizationService', () => {
  let service: AuthorizationService;

  beforeEach(() => {
    service = new AuthorizationService('https://test.supabase.co', 'test-key');
    jest.clearAllMocks();
  });

  describe('canScheduleAppointment', () => {
    it('should allow SUPER_ADMIN to schedule for anyone', async () => {
      mockUserRole(UserRole.SUPER_ADMIN);

      const result = await service.canScheduleAppointment('user-1', 'patient-2');
      expect(result).toBe(true);
    });

    it('should allow ADMIN to schedule for anyone', async () => {
      mockUserRole(UserRole.ADMIN);

      const result = await service.canScheduleAppointment('user-1', 'patient-2');
      expect(result).toBe(true);
    });

    it('should allow DOCTOR to schedule for any patient', async () => {
      mockUserRole(UserRole.DOCTOR);

      const result = await service.canScheduleAppointment('doctor-1', 'patient-2');
      expect(result).toBe(true);
    });

    it('should allow NURSE to schedule for any patient', async () => {
      mockUserRole(UserRole.NURSE);

      const result = await service.canScheduleAppointment('nurse-1', 'patient-2');
      expect(result).toBe(true);
    });

    it('should allow PATIENT to schedule for themselves only', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canScheduleAppointment('patient-uuid-1', 'PAT-202501-001');
      expect(result).toBe(true);
    });

    it('should deny PATIENT scheduling for another patient', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canScheduleAppointment('patient-uuid-1', 'PAT-202501-002');
      expect(result).toBe(false);
    });

    it('should throw error when user not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      });

      await expect(
        service.canScheduleAppointment('unknown-user', 'patient-1')
      ).rejects.toThrow('User not found or has no role');
    });
  });

  describe('canCancelAppointment', () => {
    const appointment = {
      patientId: 'PAT-202501-001',
      doctorId: 'DEPT-DOC-202501-001',
    };

    it('should allow SUPER_ADMIN to cancel any appointment', async () => {
      mockUserRole(UserRole.SUPER_ADMIN);

      const result = await service.canCancelAppointment('admin-1', 'apt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow ADMIN to cancel any appointment', async () => {
      mockUserRole(UserRole.ADMIN);

      const result = await service.canCancelAppointment('admin-1', 'apt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow NURSE to cancel any appointment', async () => {
      mockUserRole(UserRole.NURSE);

      const result = await service.canCancelAppointment('nurse-1', 'apt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow DOCTOR to cancel their own appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-1', 'DEPT-DOC-202501-001');

      const result = await service.canCancelAppointment('doctor-uuid-1', 'apt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny DOCTOR canceling other doctor appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-1', 'DEPT-DOC-202501-002');

      const result = await service.canCancelAppointment('doctor-uuid-1', 'apt-1', appointment);
      expect(result).toBe(false);
    });

    it('should allow PATIENT to cancel their own appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canCancelAppointment('patient-uuid-1', 'apt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny PATIENT canceling other patient appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-002');

      const result = await service.canCancelAppointment('patient-uuid-1', 'apt-1', appointment);
      expect(result).toBe(false);
    });
  });

  describe('canManageAppointmentReminders', () => {
    it('should allow SUPER_ADMIN to manage reminders', async () => {
      mockUserRole(UserRole.SUPER_ADMIN);

      const result = await service.canManageAppointmentReminders('admin-1', 'PAT-202501-001');
      expect(result).toBe(true);
    });

    it('should allow ADMIN to manage reminders', async () => {
      mockUserRole(UserRole.ADMIN);

      const result = await service.canManageAppointmentReminders('admin-1', 'PAT-202501-001');
      expect(result).toBe(true);
    });

    it('should allow PATIENT to manage their own reminders', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canManageAppointmentReminders('patient-uuid-1', 'PAT-202501-001');
      expect(result).toBe(true);
    });

    it('should deny PATIENT managing other patient reminders', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-002');

      const result = await service.canManageAppointmentReminders('patient-uuid-1', 'PAT-202501-001');
      expect(result).toBe(false);
    });
  });

  describe('canViewAppointment', () => {
    const appointment = {
      patientId: 'PAT-202501-001',
      doctorId: 'DEPT-DOC-202501-001',
    };

    it('should allow SUPER_ADMIN to view any appointment', async () => {
      mockUserRole(UserRole.SUPER_ADMIN);

      const result = await service.canViewAppointment('admin-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow PATIENT to view their own appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canViewAppointment('patient-uuid-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow DOCTOR to view their appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-1', 'DEPT-DOC-202501-001');

      const result = await service.canViewAppointment('doctor-uuid-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny PATIENT viewing other appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-2', 'PAT-202501-002');

      const result = await service.canViewAppointment('patient-uuid-2', appointment);
      expect(result).toBe(false);
    });
  });

  describe('canConfirmAppointment', () => {
    const appointment = {
      patientId: 'PAT-202501-001',
      doctorId: 'DEPT-DOC-202501-001',
    };

    it('should allow SUPER_ADMIN to confirm any appointment', async () => {
      mockUserRole(UserRole.SUPER_ADMIN);

      const result = await service.canConfirmAppointment('user-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow DOCTOR to confirm their own appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-1', 'DEPT-DOC-202501-001');

      const result = await service.canConfirmAppointment('doctor-uuid-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny DOCTOR confirming other doctor appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-2', 'DEPT-DOC-202501-002');

      const result = await service.canConfirmAppointment('doctor-uuid-2', 'appt-1', appointment);
      expect(result).toBe(false);
    });

    it('should allow PATIENT to confirm their own appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canConfirmAppointment('patient-uuid-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny PATIENT confirming other patient appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-2', 'PAT-202501-002');

      const result = await service.canConfirmAppointment('patient-uuid-2', 'appt-1', appointment);
      expect(result).toBe(false);
    });
  });

  describe('canCheckInAppointment', () => {
    const appointment = {
      patientId: 'PAT-202501-001',
      doctorId: 'DEPT-DOC-202501-001',
    };

    it('should allow ADMIN to check in any appointment', async () => {
      mockUserRole(UserRole.ADMIN);

      const result = await service.canCheckInAppointment('user-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow PATIENT to check in their own appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-1', 'PAT-202501-001');

      const result = await service.canCheckInAppointment('patient-uuid-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny PATIENT checking in other patient appointments', async () => {
      mockUserRole(UserRole.PATIENT);
      mockPatientIdResolution('patient-uuid-2', 'PAT-202501-002');

      const result = await service.canCheckInAppointment('patient-uuid-2', 'appt-1', appointment);
      expect(result).toBe(false);
    });

    it('should deny DOCTOR checking in appointments', async () => {
      mockUserRole(UserRole.DOCTOR);

      const result = await service.canCheckInAppointment('doctor-uuid-1', 'appt-1', appointment);
      expect(result).toBe(false);
    });
  });

  describe('canTransferAppointment', () => {
    const appointment = {
      patientId: 'PAT-202501-001',
      doctorId: 'DEPT-DOC-202501-001',
    };

    it('should allow ADMIN to transfer any appointment', async () => {
      mockUserRole(UserRole.ADMIN);

      const result = await service.canTransferAppointment('user-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should allow DOCTOR to transfer their own appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-1', 'DEPT-DOC-202501-001');

      const result = await service.canTransferAppointment('doctor-uuid-1', 'appt-1', appointment);
      expect(result).toBe(true);
    });

    it('should deny DOCTOR transferring other doctor appointments', async () => {
      mockUserRole(UserRole.DOCTOR);
      mockDoctorIdResolution('doctor-uuid-2', 'DEPT-DOC-202501-002');

      const result = await service.canTransferAppointment('doctor-uuid-2', 'appt-1', appointment);
      expect(result).toBe(false);
    });

    it('should deny NURSE transferring appointments', async () => {
      mockUserRole(UserRole.NURSE);

      const result = await service.canTransferAppointment('nurse-1', 'appt-1', appointment);
      expect(result).toBe(false);
    });

    it('should deny PATIENT transferring appointments', async () => {
      mockUserRole(UserRole.PATIENT);

      const result = await service.canTransferAppointment('patient-uuid-1', 'appt-1', appointment);
      expect(result).toBe(false);
    });
  });
});

