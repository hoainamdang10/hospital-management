/**
 * Supabase Appointment Read Model Repository Tests
 * Unit tests for CQRS Read Model Repository
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseAppointmentReadModelRepository } from '../../../src/infrastructure/persistence/SupabaseAppointmentReadModelRepository';
import { CreateAppointmentReadModelData } from '../../../src/domain/read-models/AppointmentReadModel';

// Create chainable mocks with proper forward references
let mockSingle: jest.Mock;
let mockSelect: jest.Mock;
let mockEq: jest.Mock;
let mockGte: jest.Mock;
let mockLte: jest.Mock;
let mockOrder: jest.Mock;
let mockRange: jest.Mock;
let mockLimit: jest.Mock;
let mockInsert: jest.Mock;
let mockUpdate: jest.Mock;
let mockFrom: jest.Mock;

// Initialize mocks with proper chaining
const mockChain: any = {};

mockChain.single = jest.fn();
mockChain.range = jest.fn(() => mockChain);
mockChain.limit = jest.fn(() => mockChain);
mockChain.order = jest.fn(() => mockChain);
mockChain.lte = jest.fn(() => mockChain);
mockChain.gte = jest.fn(() => mockChain);
mockChain.eq = jest.fn(() => mockChain);
mockChain.select = jest.fn(() => mockChain);
mockChain.insert = jest.fn(() => mockChain);
mockChain.update = jest.fn(() => mockChain);
mockChain.delete = jest.fn(() => mockChain);

mockSingle = mockChain.single;
mockRange = mockChain.range;
mockLimit = mockChain.limit;
mockOrder = mockChain.order;
mockLte = mockChain.lte;
mockGte = mockChain.gte;
mockEq = mockChain.eq;
mockSelect = mockChain.select;
mockInsert = mockChain.insert;
mockUpdate = mockChain.update;
mockFrom = jest.fn(() => mockChain);

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom
  }))
}));

describe('SupabaseAppointmentReadModelRepository', () => {
  let repository: SupabaseAppointmentReadModelRepository;
  let mockSupabaseClient: any;

  beforeEach(() => {
    repository = new SupabaseAppointmentReadModelRepository(
      'https://test.supabase.co',
      'test-key'
    );
    mockSupabaseClient = (repository as any).client;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create read model entry with denormalized data', async () => {
      // Arrange
      const data: CreateAppointmentReadModelData = {
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
        patientData: {
          patientFullName: 'Nguyen Van A',
          patientPhone: '0901234567',
          patientEmail: 'nguyenvana@example.com'
        },
        doctorData: {
          doctorFullName: 'Dr. Tran Van B',
          doctorSpecialization: 'Cardiology',
          doctorDepartment: 'Cardiology'
        }
      };

      const mockResult = {
        id: 'uuid-123',
        appointment_id: data.appointmentId,
        patient_id: data.patientId,
        doctor_id: data.doctorId,
        appointment_date: '2025-01-15',
        appointment_time: '09:00',
        duration_minutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultation_fee: 500000,
        payment_status: 'pending',
        patient_full_name: 'Nguyen Van A',
        patient_phone: '0901234567',
        patient_email: 'nguyenvana@example.com',
        doctor_full_name: 'Dr. Tran Van B',
        doctor_specialization: 'Cardiology',
        doctor_department: 'Cardiology',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: mockResult,
        error: null
      });

      // Act
      const result = await repository.create(data);

      // Assert
      expect(result).toBeDefined();
      expect(result.appointmentId).toBe(data.appointmentId);
      expect(result.patientFullName).toBe('Nguyen Van A');
      expect(result.doctorFullName).toBe('Dr. Tran Van B');
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointment_read_model');
    });

    it('should throw error when create fails', async () => {
      // Arrange
      const data: CreateAppointmentReadModelData = {
        appointmentId: '2025-APT-011201-001',
        patientId: 'PAT-202501-001',
        doctorId: 'CARD-DOC-202501-001',
        appointmentDate: new Date('2025-01-15'),
        appointmentTime: '09:00',
        durationMinutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultationFee: 500000
      };

      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      // Act & Assert
      await expect(repository.create(data)).rejects.toThrow('Failed to create appointment read model');
    });
  });

  describe('updatePatientData', () => {
    it('should update patient data for all appointments', async () => {
      // Arrange
      const patientId = 'PAT-202501-001';
      const patientData = {
        patientFullName: 'Nguyen Van A Updated',
        patientPhone: '0901234567',
        patientEmail: 'updated@example.com'
      };

      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: 'uuid-1' }, { id: 'uuid-2' }],
        error: null
      });

      // Act
      const count = await repository.updatePatientData(patientId, patientData);

      // Assert
      expect(count).toBe(2);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointment_read_model');
    });
  });

  describe('updateDoctorData', () => {
    it('should update doctor data for all appointments', async () => {
      // Arrange
      const doctorId = 'CARD-DOC-202501-001';
      const doctorData = {
        doctorFullName: 'Dr. Tran Van B Updated',
        doctorSpecialization: 'Cardiology',
        doctorDepartment: 'Cardiology'
      };

      mockSupabaseClient.from().update().eq().select.mockResolvedValue({
        data: [{ id: 'uuid-1' }, { id: 'uuid-2' }, { id: 'uuid-3' }],
        error: null
      });

      // Act
      const count = await repository.updateDoctorData(doctorId, doctorData);

      // Assert
      expect(count).toBe(3);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointment_read_model');
    });
  });

  describe('findById', () => {
    it('should return appointment read model by ID', async () => {
      // Arrange
      const appointmentId = '2025-APT-011201-001';
      const mockResult = {
        id: 'uuid-123',
        appointment_id: appointmentId,
        patient_id: 'PAT-202501-001',
        doctor_id: 'CARD-DOC-202501-001',
        appointment_date: '2025-01-15',
        appointment_time: '09:00',
        duration_minutes: 30,
        type: 'consultation',
        priority: 'normal',
        status: 'scheduled',
        consultation_fee: 500000,
        payment_status: 'pending',
        patient_full_name: 'Nguyen Van A',
        doctor_full_name: 'Dr. Tran Van B',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      };

      mockSingle.mockResolvedValue({
        data: mockResult,
        error: null
      });

      // Act
      const result = await repository.findById(appointmentId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.appointmentId).toBe(appointmentId);
      expect(result?.patientFullName).toBe('Nguyen Van A');
    });

    it('should return null when appointment not found', async () => {
      // Arrange
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByPatientId', () => {
    it('should return appointments for patient', async () => {
      // Arrange
      const patientId = 'PAT-202501-001';
      const mockResults = [
        {
          id: 'uuid-1',
          appointment_id: '2025-APT-011201-001',
          patient_id: patientId,
          doctor_id: 'CARD-DOC-202501-001',
          appointment_date: '2025-01-15',
          appointment_time: '09:00',
          duration_minutes: 30,
          type: 'consultation',
          priority: 'normal',
          status: 'scheduled',
          consultation_fee: 500000,
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          synced_at: new Date().toISOString()
        }
      ];

      mockOrder.mockResolvedValue({
        data: mockResults,
        error: null
      });

      // Act
      const results = await repository.findByPatientId(patientId);

      // Assert
      expect(results).toHaveLength(1);
      expect(results[0].patientId).toBe(patientId);
    });
  });

  describe('findWithFilters', () => {
    it('should apply filters correctly', async () => {
      // Arrange
      const filters = {
        patientId: 'PAT-202501-001',
        status: 'scheduled',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        limit: 10,
        offset: 0
      };

      mockRange.mockResolvedValue({
        data: [],
        error: null
      });

      // Act
      await repository.findWithFilters(filters);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('appointment_read_model');
    });
  });
});

