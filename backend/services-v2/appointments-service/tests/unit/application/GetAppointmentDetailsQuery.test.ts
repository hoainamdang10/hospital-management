/**
 * Get Appointment Details Query Tests
 * Unit tests for CQRS query use case
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { GetAppointmentDetailsQuery } from '../../../src/application/queries/GetAppointmentDetailsQuery';
import { IAppointmentReadModelRepository } from '../../../src/domain/repositories/IAppointmentReadModelRepository';
import { AppointmentReadModel } from '../../../src/domain/read-models/AppointmentReadModel';

describe('GetAppointmentDetailsQuery', () => {
  let query: GetAppointmentDetailsQuery;
  let mockReadModelRepo: jest.Mocked<IAppointmentReadModelRepository>;

  beforeEach(() => {
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

    query = new GetAppointmentDetailsQuery(mockReadModelRepo);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return appointment details with patient and doctor info', async () => {
      // Arrange
      const appointmentId = '2025-APT-011201-001';
      const mockReadModel: AppointmentReadModel = {
        id: 'uuid-123',
        appointmentId,
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000,
        paymentStatus: 'pending',
        
        patientFullName: 'Nguyen Van A',
        patientPhone: '0901234567',
        patientEmail: 'nguyenvana@example.com',
        patientDateOfBirth: new Date('1990-01-01'),
        patientGender: 'male',
        
        doctorFullName: 'Dr. Tran Van B',
        doctorSpecialization: 'Cardiology',
        doctorDepartment: 'Cardiology',
        
        reason: 'Chest pain',
        symptoms: ['chest pain', 'shortness of breath'],
        
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
        syncedAt: new Date('2025-01-10')
      };

      mockReadModelRepo.findById.mockResolvedValue(mockReadModel);

      // Act
      const result = await query.execute(appointmentId);

      // Assert
      expect(mockReadModelRepo.findById).toHaveBeenCalledWith(appointmentId);
      expect(result).toEqual({
        appointmentId,
        appointmentDate: '2025-01-15',
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        
        patient: {
          patientId: 'PAT-202501-001',
          fullName: 'Nguyen Van A',
          phone: '0901234567',
          email: 'nguyenvana@example.com',
          dateOfBirth: '1990-01-01',
          gender: 'male'
        },
        
        doctor: {
          doctorId: 'CARD-DOC-202501-001',
          fullName: 'Dr. Tran Van B',
          specialization: 'Cardiology',
          department: 'Cardiology'
        },
        
        reason: 'Chest pain',
        symptoms: ['chest pain', 'shortness of breath'],
        
        consultationFee: 500000,
        paymentStatus: 'pending',
        
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });

    it('should throw error when appointment not found', async () => {
      // Arrange
      const appointmentId = 'non-existent';
      mockReadModelRepo.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(query.execute(appointmentId)).rejects.toThrow('Appointment not found');
    });

    it('should handle appointments without patient/doctor data', async () => {
      // Arrange
      const appointmentId = '2025-APT-011201-001';
      const mockReadModel: AppointmentReadModel = {
        id: 'uuid-123',
        appointmentId,
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000,
        paymentStatus: 'pending',
        
        // No patient/doctor denormalized data
        
        createdAt: new Date('2025-01-10'),
        updatedAt: new Date('2025-01-10'),
        syncedAt: new Date('2025-01-10')
      };

      mockReadModelRepo.findById.mockResolvedValue(mockReadModel);

      // Act
      const result = await query.execute(appointmentId);

      // Assert
      expect(result.patient.patientId).toBe('PAT-202501-001');
      expect(result.patient.fullName).toBeUndefined();
      expect(result.doctor.doctorId).toBe('CARD-DOC-202501-001');
      expect(result.doctor.fullName).toBeUndefined();
    });
  });
});

