/**
 * Appointment Read Model Event Handler Tests
 * Unit tests for event-driven read model sync
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { AppointmentReadModelEventHandler, AppointmentScheduledEvent, PatientUpdatedEvent, DoctorUpdatedEvent } from '../../../src/infrastructure/events/AppointmentReadModelEventHandler';
import { IAppointmentReadModelRepository } from '../../../src/domain/repositories/IAppointmentReadModelRepository';
import { IPatientService } from '../../../src/application/services/IPatientService';
import { IProviderService } from '../../../src/application/services/IProviderService';

describe('AppointmentReadModelEventHandler', () => {
  let handler: AppointmentReadModelEventHandler;
  let mockReadModelRepo: jest.Mocked<IAppointmentReadModelRepository>;
  let mockPatientService: jest.Mocked<IPatientService>;
  let mockProviderService: jest.Mocked<IProviderService>;

  beforeEach(() => {
    // Create mocks
    mockReadModelRepo = {
      create: jest.fn(),
      updatePatientData: jest.fn(),
      updateDoctorData: jest.fn(),
      updateStatus: jest.fn(),
      findById: jest.fn(),
      findByPatientId: jest.fn(),
      findByDoctorId: jest.fn(),
      findByDateRange: jest.fn(),
      findWithFilters: jest.fn(),
      countWithFilters: jest.fn(),
      delete: jest.fn()
    } as any;

    mockPatientService = {
      getPatient: jest.fn(),
      getPatients: jest.fn()
    } as any;

    mockProviderService = {
      getProvider: jest.fn(),
      getProviders: jest.fn()
    } as any;

    handler = new AppointmentReadModelEventHandler(
      mockReadModelRepo,
      mockPatientService,
      mockProviderService
    );

    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleAppointmentScheduled', () => {
    it('should create read model with patient and doctor data', async () => {
      // Arrange
      const event: AppointmentScheduledEvent = {
        eventId: 'event-123',
        eventType: 'appointment.scheduled',
        appointmentId: '2025-APT-011201-001',
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000,
        occurredAt: new Date()
      };

      const mockPatient = {
        patientId: 'PAT-202501-001',
        fullName: 'Nguyen Van A',
        phone: '0901234567',
        email: 'nguyenvana@example.com'
      };

      const mockDoctor = {
        providerId: 'CARD-DOC-202501-001',
        fullName: 'Dr. Tran Van B',
        specialization: 'Cardiology',
        department: 'Cardiology'
      };

      mockPatientService.getPatient.mockResolvedValue(mockPatient);
      mockProviderService.getProvider.mockResolvedValue(mockDoctor);
      mockReadModelRepo.create.mockResolvedValue({} as any);

      // Act
      await handler.handleAppointmentScheduled(event);

      // Assert
      expect(mockPatientService.getPatient).toHaveBeenCalledWith('PAT-202501-001');
      expect(mockProviderService.getProvider).toHaveBeenCalledWith('CARD-DOC-202501-001');
      expect(mockReadModelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: event.appointmentId,
          patientId: event.patientId,
          doctorId: event.doctorId,
          patientData: expect.objectContaining({
            patientFullName: 'Nguyen Van A'
          }),
          doctorData: expect.objectContaining({
            doctorFullName: 'Dr. Tran Van B'
          })
        })
      );
    });

    it('should create read model even if patient service fails', async () => {
      // Arrange
      const event: AppointmentScheduledEvent = {
        eventId: 'event-123',
        eventType: 'appointment.scheduled',
        appointmentId: '2025-APT-011201-001',
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000,
        occurredAt: new Date()
      };

      const mockDoctor = {
        providerId: 'CARD-DOC-202501-001',
        fullName: 'Dr. Tran Van B',
        specialization: 'Cardiology'
      };

      mockPatientService.getPatient.mockRejectedValue(new Error('Patient service unavailable'));
      mockProviderService.getProvider.mockResolvedValue(mockDoctor);
      mockReadModelRepo.create.mockResolvedValue({} as any);

      // Act
      await handler.handleAppointmentScheduled(event);

      // Assert
      expect(mockReadModelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: event.appointmentId,
          patientData: undefined, // Patient data not available
          doctorData: expect.objectContaining({
            doctorFullName: 'Dr. Tran Van B'
          })
        })
      );
    });

    it('should create read model even if doctor service fails', async () => {
      // Arrange
      const event: AppointmentScheduledEvent = {
        eventId: 'event-123',
        eventType: 'appointment.scheduled',
        appointmentId: '2025-APT-011201-001',
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000,
        occurredAt: new Date()
      };

      const mockPatient = {
        patientId: 'PAT-202501-001',
        fullName: 'Nguyen Van A',
        phone: '0901234567'
      };

      mockPatientService.getPatient.mockResolvedValue(mockPatient);
      mockProviderService.getProvider.mockRejectedValue(new Error('Provider service unavailable'));
      mockReadModelRepo.create.mockResolvedValue({} as any);

      // Act
      await handler.handleAppointmentScheduled(event);

      // Assert
      expect(mockReadModelRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentId: event.appointmentId,
          patientData: expect.objectContaining({
            patientFullName: 'Nguyen Van A'
          }),
          doctorData: undefined // Doctor data not available
        })
      );
    });
  });

  describe('handlePatientUpdated', () => {
    it('should update patient data for all appointments', async () => {
      // Arrange
      const event: PatientUpdatedEvent = {
        eventId: 'event-456',
        eventType: 'patient.updated',
        patientId: 'PAT-202501-001',
        updatedFields: ['fullName', 'phone'],
        newValues: {
          fullName: 'Nguyen Van A Updated',
          phone: '0909999999'
        },
        occurredAt: new Date()
      };

      mockReadModelRepo.updatePatientData.mockResolvedValue(3);

      // Act
      await handler.handlePatientUpdated(event);

      // Assert
      expect(mockReadModelRepo.updatePatientData).toHaveBeenCalledWith(
        'PAT-202501-001',
        expect.objectContaining({
          patientFullName: 'Nguyen Van A Updated',
          patientPhone: '0909999999'
        })
      );
    });

    it('should handle errors gracefully', async () => {
      // Arrange
      const event: PatientUpdatedEvent = {
        eventId: 'event-456',
        eventType: 'patient.updated',
        patientId: 'PAT-202501-001',
        updatedFields: ['fullName'],
        newValues: {
          fullName: 'Nguyen Van A Updated'
        },
        occurredAt: new Date()
      };

      mockReadModelRepo.updatePatientData.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(handler.handlePatientUpdated(event)).rejects.toThrow();
    });
  });

  describe('handleDoctorUpdated', () => {
    it('should update doctor data for all appointments', async () => {
      // Arrange
      const event: DoctorUpdatedEvent = {
        eventId: 'event-789',
        eventType: 'staff.updated',
        staffId: 'CARD-DOC-202501-001',
        staffType: 'doctor',
        updatedFields: ['fullName', 'specialization'],
        newValues: {
          fullName: 'Dr. Tran Van B Updated',
          specialization: 'Cardiology & Internal Medicine'
        },
        occurredAt: new Date()
      };

      mockReadModelRepo.updateDoctorData.mockResolvedValue(5);

      // Act
      await handler.handleDoctorUpdated(event);

      // Assert
      expect(mockReadModelRepo.updateDoctorData).toHaveBeenCalledWith(
        'CARD-DOC-202501-001',
        expect.objectContaining({
          doctorFullName: 'Dr. Tran Van B Updated',
          doctorSpecialization: 'Cardiology & Internal Medicine'
        })
      );
    });

    it('should skip non-doctor staff updates', async () => {
      // Arrange
      const event: DoctorUpdatedEvent = {
        eventId: 'event-789',
        eventType: 'staff.updated',
        staffId: 'NURSE-202501-001',
        staffType: 'nurse',
        updatedFields: ['fullName'],
        newValues: {
          fullName: 'Nurse Nguyen Thi C'
        },
        occurredAt: new Date()
      };

      // Act
      await handler.handleDoctorUpdated(event);

      // Assert
      expect(mockReadModelRepo.updateDoctorData).not.toHaveBeenCalled();
    });
  });

  describe('handleAppointmentStatusChanged', () => {
    it('should update appointment status', async () => {
      // Arrange
      const event = {
        appointmentId: '2025-APT-011201-001',
        newStatus: 'completed'
      };

      mockReadModelRepo.updateStatus.mockResolvedValue();

      // Act
      await handler.handleAppointmentStatusChanged(event);

      // Assert
      expect(mockReadModelRepo.updateStatus).toHaveBeenCalledWith(
        '2025-APT-011201-001',
        'completed'
      );
    });
  });

  describe('handleAppointmentCancelled', () => {
    it('should mark appointment as cancelled', async () => {
      // Arrange
      const event = {
        appointmentId: '2025-APT-011201-001'
      };

      mockReadModelRepo.updateStatus.mockResolvedValue();

      // Act
      await handler.handleAppointmentCancelled(event);

      // Assert
      expect(mockReadModelRepo.updateStatus).toHaveBeenCalledWith(
        '2025-APT-011201-001',
        'cancelled'
      );
    });
  });
});

