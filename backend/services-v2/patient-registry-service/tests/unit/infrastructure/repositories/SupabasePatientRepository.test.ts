/**
 * SupabasePatientRepository Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for Infrastructure Repository with mocked dependencies
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern, HIPAA
 */

import { SupabasePatientRepository } from '../../../../src/infrastructure/repositories/SupabasePatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PatientId } from '../../../../src/domain/value-objects/PatientId';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { PatientMapper } from '../../../../src/infrastructure/mappers/PatientMapper';
import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientMatchingService } from '../../../../src/application/services/IPatientMatchingService';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
import { CircuitBreakerFactory } from '../../../../src/infrastructure/resilience/CircuitBreaker';
import { v4 as uuidv4 } from 'uuid';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  rpc: jest.fn()
};

// Mock createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock CircuitBreakerFactory
jest.mock('../../../../src/infrastructure/resilience/CircuitBreaker', () => ({
  CircuitBreakerFactory: {
    getBreaker: jest.fn(() => ({
      execute: jest.fn(async (fn, fallback) => {
        try {
          return await fn();
        } catch (error) {
          if (fallback) {
            return await fallback(error);
          }
          throw error;
        }
      }),
      getState: jest.fn(() => 'CLOSED'),
      getMetrics: jest.fn(() => ({ failures: 0, successes: 0 }))
    }))
  }
}));

// Mock PatientMapper
jest.mock('../../../../src/infrastructure/mappers/PatientMapper', () => ({
  PatientMapper: {
    toDomain: jest.fn(),
    toPersistence: jest.fn()
  }
}));

describe('SupabasePatientRepository', () => {
  let repository: SupabasePatientRepository;
  let mockLogger: jest.Mocked<ILogger>;
  let mockMatchingService: jest.Mocked<IPatientMatchingService>;
  let mockEventPublisher: jest.Mocked<IDomainEventPublisher>;
  let mockCircuitBreaker: any;

  // Test data
  let testPatient: Patient;
  let validPersonalInfo: PersonalInfo;
  let validContactInfo: ContactInfo;
  let validBasicMedicalInfo: BasicMedicalInfo;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock dependencies
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    mockMatchingService = {
      findMatches: jest.fn(),
      calculateMatchScore: jest.fn(),
      isDefiniteMatch: jest.fn()
    } as any;

    mockEventPublisher = {
      publish: jest.fn(),
      publishBatch: jest.fn()
    } as any;

    // Mock circuit breaker
    mockCircuitBreaker = {
      execute: jest.fn(async (fn, fallback) => {
        try {
          return await fn();
        } catch (error) {
          if (fallback) {
            return await fallback(error);
          }
          throw error;
        }
      }),
      getState: jest.fn(() => 'CLOSED'),
      getMetrics: jest.fn(() => ({ failures: 0, successes: 0 })),
      getStatus: jest.fn(() => ({ state: 'CLOSED', failures: 0, successes: 0 }))
    };

    (CircuitBreakerFactory.getBreaker as jest.Mock).mockReturnValue(mockCircuitBreaker);

    // Create test data
    validPersonalInfo = PersonalInfo.create({
      fullName: 'Nguyễn Văn Test',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      nationalId: '001234567890',
      nationality: 'Vietnamese'
    });

    validContactInfo = ContactInfo.create({
      primaryPhone: '0901234567',
      email: 'test@example.com',
      preferredContactMethod: 'phone',
      address: {
        street: '123 Test Street',
        ward: 'Ward 1',
        district: 'District 1',
        city: 'Ho Chi Minh City',
        province: 'Ho Chi Minh',
        country: 'Vietnam'
      }
    });

    validBasicMedicalInfo = BasicMedicalInfo.create({
      bloodType: 'O+',
      knownAllergies: ['Penicillin']
    });

    testPatient = Patient.register(
      uuidv4(),
      validPersonalInfo,
      validContactInfo,
      validBasicMedicalInfo,
      undefined,
      [],
      'test-admin'
    );

    // Create repository instance
    repository = new SupabasePatientRepository(
      'https://test.supabase.co',
      'test-key',
      mockLogger,
      mockMatchingService,
      mockEventPublisher
    );
  });

  describe('constructor', () => {
    it('should initialize with correct Supabase configuration', () => {
      // Act
      const newRepository = new SupabasePatientRepository(
        'https://test.supabase.co',
        'test-key',
        mockLogger,
        mockMatchingService,
        mockEventPublisher
      );

      // Assert
      expect(newRepository).toBeInstanceOf(SupabasePatientRepository);
      expect(CircuitBreakerFactory.getBreaker).toHaveBeenCalledWith('patient-repository');
    });

    it('should work without event publisher (optional dependency)', () => {
      // Act
      const newRepository = new SupabasePatientRepository(
        'https://test.supabase.co',
        'test-key',
        mockLogger,
        mockMatchingService
      );

      // Assert
      expect(newRepository).toBeInstanceOf(SupabasePatientRepository);
    });
  });

  describe('findById', () => {
    const testPatientId = PatientId.create('PAT-202510-001');

    it('should find patient by ID successfully', async () => {
      // Arrange
      const mockPatientData = {
        id: uuidv4(),
        patient_id: 'PAT-202510-001',
        user_id: uuidv4(),
        personal_info: {
          fullName: 'Nguyễn Văn Test',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contact_info: {
          primaryPhone: '0901234567',
          email: 'test@example.com',
          preferredContactMethod: 'phone'
        },
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPatientData, error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Mock the private helper methods by setting up the repository to return expected data
      (repository as any).fetchInsurance = jest.fn().mockResolvedValue(null);
      (repository as any).fetchEmergencyContacts = jest.fn().mockResolvedValue([]);
      (repository as any).fetchConsents = jest.fn().mockResolvedValue([]);
      (repository as any).fetchLinks = jest.fn().mockResolvedValue([]);

      (PatientMapper.toDomain as jest.Mock).mockReturnValue(testPatient);

      // Act
      const result = await repository.findById(testPatientId);

      // Assert
      expect(result).toBe(testPatient);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('patient_id', 'PAT-202510-001');
      expect(mockQuery.single).toHaveBeenCalled();
      expect(PatientMapper.toDomain).toHaveBeenCalledWith(
        mockPatientData,
        null,
        [],
        [],
        []
      );
    });

    it('should return null when patient not found', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.findById(testPatientId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null and log fallback for database errors', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST500', message: 'Database error' } 
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.findById(testPatientId);

      // Assert
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker fallback for findById',
        { patientId: testPatientId.getValue() }
      );
    });

    it('should use circuit breaker for resilience', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      await repository.findById(testPatientId);

      // Assert
      expect(mockCircuitBreaker.execute).toHaveBeenCalled();
    });
  });

  describe('findByUserId', () => {
    const testUserId = uuidv4();

    it('should find patient by user ID successfully', async () => {
      // Arrange
      const mockPatientData = {
        id: uuidv4(),
        patient_id: 'PAT-202510-001',
        user_id: testUserId,
        personal_info: {
          fullName: 'Nguyễn Văn Test',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        status: 'active'
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPatientData, error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Mock helper methods
      (repository as any).fetchInsurance = jest.fn().mockResolvedValue(null);
      (repository as any).fetchEmergencyContacts = jest.fn().mockResolvedValue([]);
      (repository as any).fetchConsents = jest.fn().mockResolvedValue([]);
      (repository as any).fetchLinks = jest.fn().mockResolvedValue([]);

      (PatientMapper.toDomain as jest.Mock).mockReturnValue(testPatient);

      // Act
      const result = await repository.findByUserId(testUserId);

      // Assert
      expect(result).toBe(testPatient);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients');
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', testUserId);
    });

    it('should return null when patient not found by user ID', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ 
          data: null, 
          error: { code: 'PGRST116', message: 'No rows found' } 
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.findByUserId(testUserId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByNationalId', () => {
    const testNationalId = '001234567890';

    it('should find patient by national ID successfully', async () => {
      // Arrange
      const mockPatientData = {
        id: uuidv4(),
        patient_id: 'PAT-202510-001',
        user_id: uuidv4(),
        personal_info: {
          fullName: 'Nguyễn Văn Test',
          nationalId: testNationalId
        },
        status: 'active'
      };

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [mockPatientData], error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Mock helper methods
      (repository as any).fetchInsurance = jest.fn().mockResolvedValue(null);
      (repository as any).fetchEmergencyContacts = jest.fn().mockResolvedValue([]);
      (repository as any).fetchConsents = jest.fn().mockResolvedValue([]);
      (repository as any).fetchLinks = jest.fn().mockResolvedValue([]);

      (PatientMapper.toDomain as jest.Mock).mockReturnValue(testPatient);

      // Act
      const result = await repository.findByNationalId(testNationalId);

      // Assert
      expect(result).toBe(testPatient);
      expect(mockQuery.eq).toHaveBeenCalledWith('personal_info->>nationalId', testNationalId);
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
    });

    it('should return null when no patient found by national ID', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.findByNationalId(testNationalId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save patient successfully', async () => {
      // Arrange
      const mockPersistenceData = {
        patientRecord: {
          id: testPatient.id,
          patient_id: 'PAT-202510-001',
          user_id: testPatient.getProps().userId,
          personal_info: {
            fullName: 'Nguyễn Văn Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationalId: '001234567890',
            nationality: 'Vietnamese'
          },
          status: 'active'
        },
        insuranceRecord: null,
        emergencyContactRecords: [],
        consentRecords: [],
        linkRecords: []
      };

      (PatientMapper.toPersistence as jest.Mock).mockReturnValue(mockPersistenceData);

      // Mock RPC call for atomic save
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act
      await repository.save(testPatient);

      // Assert
      expect(PatientMapper.toPersistence).toHaveBeenCalledWith(testPatient);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('save_patient_transaction', {
        p_patient_data: mockPersistenceData.patientRecord,
        p_insurance_data: mockPersistenceData.insuranceRecord,
        p_contacts_data: mockPersistenceData.emergencyContactRecords,
        p_consents_data: mockPersistenceData.consentRecords,
        p_links_data: mockPersistenceData.linkRecords
      });
    });

    it('should throw error when patient ID is missing', async () => {
      // Arrange
      const patientWithoutId = { ...testPatient, getPatientId: () => null } as any;

      // Act & Assert
      await expect(repository.save(patientWithoutId)).rejects.toThrow('Patient ID is required');
    });

    it('should handle database errors during save', async () => {
      // Arrange
      const mockPersistenceData = {
        patientRecord: { patient_id: 'PAT-202510-001' },
        insuranceRecord: null,
        emergencyContactRecords: [],
        consentRecords: [],
        linkRecords: []
      };

      (PatientMapper.toPersistence as jest.Mock).mockReturnValue(mockPersistenceData);
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database constraint violation' }
      });

      // Act & Assert
      await expect(repository.save(testPatient)).rejects.toThrow('Failed to save patient: Database constraint violation');
    });

    it('should publish domain events after successful save', async () => {
      // Arrange
      const mockPersistenceData = {
        patientRecord: { patient_id: 'PAT-202510-001' },
        insuranceRecord: null,
        emergencyContactRecords: [],
        consentRecords: [],
        linkRecords: []
      };

      (PatientMapper.toPersistence as jest.Mock).mockReturnValue(mockPersistenceData);
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: null });

      const mockDomainEvents = [
        { eventType: 'PatientRegistered', eventId: uuidv4() }
      ];
      testPatient.getUncommittedEvents = jest.fn().mockReturnValue(mockDomainEvents);
      testPatient.markEventsAsCommitted = jest.fn();

      // Act
      await repository.save(testPatient);

      // Assert
      expect(mockEventPublisher.publishBatch).toHaveBeenCalledWith(mockDomainEvents);
      expect(testPatient.markEventsAsCommitted).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const testPatientId = PatientId.create('PAT-202510-001');

    it('should soft delete patient successfully', async () => {
      // Arrange
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      await repository.delete(testPatientId);

      // Assert
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('patients');
      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'inactive',
        updated_at: expect.any(String)
      });
      expect(mockQuery.eq).toHaveBeenCalledWith('patient_id', 'PAT-202510-001');
    });

    it('should handle errors during delete', async () => {
      // Arrange
      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Patient not found' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act & Assert
      await expect(repository.delete(testPatientId)).rejects.toThrow('Failed to delete patient: Patient not found');
    });
  });

  describe('searchPatients', () => {
    const searchTerm = 'Nguyễn Văn';
    const filters = { isActive: true, hasInsurance: false };
    const pagination = { page: 1, limit: 10 };

    it('should search patients successfully', async () => {
      // Arrange
      const mockPatientData = [{
        id: uuidv4(),
        patient_id: 'PAT-202510-001',
        personal_info: { fullName: 'Nguyễn Văn Test' },
        status: 'active'
      }];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockPatientData,
          error: null,
          count: 1
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Mock helper methods for each patient
      (repository as any).fetchInsurance = jest.fn().mockResolvedValue(null);
      (repository as any).fetchEmergencyContacts = jest.fn().mockResolvedValue([]);
      (repository as any).fetchConsents = jest.fn().mockResolvedValue([]);
      (repository as any).fetchLinks = jest.fn().mockResolvedValue([]);

      (PatientMapper.toDomain as jest.Mock).mockReturnValue(testPatient);

      // Act
      const result = await repository.searchPatients(searchTerm, filters, pagination);

      // Assert
      expect(result.patients).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('fullName.ilike'));
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'active');
      expect(mockQuery.range).toHaveBeenCalledWith(0, 9); // page 1, limit 10
    });

    it('should handle search with no filters', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.searchPatients(searchTerm);

      // Assert
      expect(result.patients).toHaveLength(0);
      expect(result.total).toBe(0);
      // No filters applied, so eq should not be called for status filter
    });

    it('should handle search errors', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Search failed' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.searchPatients(searchTerm);

      // Assert - should return fallback response
      expect(result).toEqual({
        patients: [],
        total: 0
      });
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(
        mockLogger.warn.mock.calls.some(call => call[0] === 'Circuit breaker fallback for searchPatients')
      ).toBe(true);
    });
  });

  describe('getHealthStatus', () => {
    it('should return healthy status when database is accessible', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.getHealthStatus();

      // Assert
      expect(result.status).toBe('healthy');
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy status when database is not accessible', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection failed' }
        })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      const result = await repository.getHealthStatus();

      // Assert
      expect(result.status).toBe('unhealthy');
      expect(result.database).toBe('patient_schema');
      expect(result.circuitBreaker).toEqual({ state: 'CLOSED', failures: 0, successes: 0 });
    });
  });

  describe('getStatistics', () => {
    it('should return patient statistics successfully', async () => {
      // Arrange
      const totalCountResponse = { count: 3, error: null };
      const personalInfoData = [
        { personal_info: { gender: 'male', dateOfBirth: '2005-01-01' } },
        { personal_info: { gender: 'female', dateOfBirth: '1980-01-01' } },
        { personal_info: { gender: 'other', dateOfBirth: '1960-01-01' } }
      ];
      const statusData = [
        { status: 'active' },
        { status: 'inactive' },
        { status: 'merged' }
      ];
      const insuranceData = [
        { insurance_type: 'BHYT' },
        { insurance_type: 'PRIVATE' }
      ];
      const trendData = [
        { created_at: '2024-01-15T00:00:00.000Z' },
        { created_at: '2024-02-20T00:00:00.000Z' }
      ];

      const personalInfoResponses = [
        { data: personalInfoData, error: null },
        { data: personalInfoData, error: null }
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'patients') {
          return {
            select: jest.fn((columns: string, options?: any) => {
              if (columns === '*' && options?.count === 'exact') {
                return Promise.resolve(totalCountResponse);
              }
              if (columns === 'personal_info') {
                return Promise.resolve(personalInfoResponses.shift() ?? { data: [], error: null });
              }
              if (columns === 'status') {
                return Promise.resolve({ data: statusData, error: null });
              }
              if (columns === 'created_at') {
                return {
                  gte: jest.fn(() => Promise.resolve({ data: trendData, error: null }))
                };
              }
              return Promise.resolve({ data: [], error: null });
            })
          };
        }

        if (table === 'insurance_info') {
          return {
            select: jest.fn(() => Promise.resolve({ data: insuranceData, error: null }))
          };
        }

        return {
          select: jest.fn(() => Promise.resolve({ data: [], error: null }))
        };
      });

      // Act
      const result = await repository.getStatistics();

      // Assert
      expect(result.total).toBe(3);
      expect(result.byGender).toEqual({
        male: 1,
        female: 1,
        other: 1,
        unknown: 0
      });
      expect(result.byAgeRange).toEqual({
        '0-18': 0,
        '19-40': 1,
        '41-60': 1,
        '60+': 1
      });
      expect(result.byInsuranceType).toEqual({
        bhyt: 1,
        bhtn: 0,
        private: 1,
        selfPay: 1
      });
      expect(result.byStatus).toEqual({
        active: 1,
        inactive: 1,
        deceased: 0,
        merged: 1
      });
      expect(result.registrationTrend).toEqual([
        { month: '2024-01', count: 1 },
        { month: '2024-02', count: 1 }
      ]);
      expect(mockSupabaseClient.rpc).not.toHaveBeenCalled();
    });

    it('should handle statistics errors', async () => {
      // Arrange
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn(() => Promise.resolve({
          count: null,
          error: { message: 'Total failed' }
        }))
      }));

      // Act & Assert
      await expect(repository.getStatistics()).rejects.toThrow('Failed to get total count: Total failed');
    });
  });

  describe('circuit breaker integration', () => {
    it('should use circuit breaker for all operations', async () => {
      // Arrange
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
      };

      mockSupabaseClient.from.mockReturnValue(mockQuery);

      // Act
      await repository.findById(PatientId.create('PAT-202510-001'));

      // Assert
      expect(mockCircuitBreaker.execute).toHaveBeenCalled();
    });

    it('should handle circuit breaker fallback', async () => {
      // Arrange
      mockCircuitBreaker.execute.mockImplementation((fn: any, fallback: any) => {
        if (fallback) {
          return fallback();
        }
        throw new Error('Circuit breaker open');
      });

      // Act
      const result = await repository.findByUserId('test-user-id');

      // Assert
      expect(result).toBeNull(); // Fallback should return null
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker fallback for findByUserId',
        { userId: 'test-user-id' }
      );
    });
  });
});
