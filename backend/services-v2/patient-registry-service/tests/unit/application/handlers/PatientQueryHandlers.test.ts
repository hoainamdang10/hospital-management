/**
 * PatientQueryHandlers Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for CQRS Query handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */

import { PatientQueryHandlers } from '../../../../src/application/handlers/PatientQueryHandlers';
import { GetPatientProfileUseCase } from '../../../../src/application/use-cases/GetPatientProfileUseCase';
import { SearchPatientsUseCase } from '../../../../src/application/use-cases/SearchPatientsUseCase';
import { IPatientRepository } from '../../../../src/domain/repositories/IPatientRepository';
import { Patient } from '../../../../src/domain/aggregates/Patient';
import { PersonalInfo } from '../../../../src/domain/value-objects/PersonalInfo';
import { ContactInfo } from '../../../../src/domain/value-objects/ContactInfo';
import { BasicMedicalInfo } from '../../../../src/domain/value-objects/BasicMedicalInfo';
import { ILogger } from '@shared/application/services/logger.interface';
import { v4 as uuidv4 } from 'uuid';

describe('PatientQueryHandlers', () => {
  let handlers: PatientQueryHandlers;
  let mockGetPatientProfileUseCase: jest.Mocked<GetPatientProfileUseCase>;
  let mockSearchPatientsUseCase: jest.Mocked<SearchPatientsUseCase>;
  let mockPatientRepository: jest.Mocked<IPatientRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  // Test data
  let testPatient: Patient;
  let validPersonalInfo: PersonalInfo;
  let validContactInfo: ContactInfo;
  let validBasicMedicalInfo: BasicMedicalInfo;

  beforeEach(() => {
    // Mock use cases
    mockGetPatientProfileUseCase = {
      execute: jest.fn()
    } as any;

    mockSearchPatientsUseCase = {
      execute: jest.fn()
    } as any;

    // Mock repository
    mockPatientRepository = {
      findById: jest.fn(),
      save: jest.fn(),
      findByUserId: jest.fn(),
      findByNationalId: jest.fn(),
      findByBHYTNumber: jest.fn(),
      searchPatients: jest.fn(),
      delete: jest.fn(),
      findWithFilters: jest.fn(),
      matchPatients: jest.fn(),
      getHealthStatus: jest.fn(),
      getStatistics: jest.fn(),
      getPatientHistory: jest.fn()
    } as jest.Mocked<IPatientRepository>;

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

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

    // Create handlers instance
    handlers = new PatientQueryHandlers(
      mockGetPatientProfileUseCase,
      mockSearchPatientsUseCase,
      mockPatientRepository,
      mockLogger
    );
  });

  describe('handleGetPatientProfile', () => {
    const validQuery = {
      queryId: uuidv4(),
      queryType: 'GetPatientProfile' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        patientId: 'PAT-202510-001',
        requestedBy: 'admin-user-id'
      }
    };

    it('should handle valid GetPatientProfile query successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Lấy thông tin bệnh nhân thành công',
        data: {
          patientId: 'PAT-202510-001',
          userId: uuidv4(),
          personalInfo: {
            fullName: 'Nguyễn Văn Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationalId: '001234567890',
            nationality: 'Vietnamese'
          },
          contactInfo: {
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
          },
          basicMedicalInfo: {
            bloodType: 'O+',
            knownAllergies: ['Penicillin']
          },
          emergencyContacts: [],
          consents: [],
          status: 'active',
          hasInsurance: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          links: []
        }
      };
      mockGetPatientProfileUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleGetPatientProfile(validQuery);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockGetPatientProfileUseCase.execute).toHaveBeenCalledWith(validQuery.data);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing GetPatientProfile query',
        expect.objectContaining({
          queryId: validQuery.queryId,
          requestedBy: validQuery.requestedBy,
          patientId: validQuery.data.patientId
        })
      );
    });

    it('should return error for invalid query structure', async () => {
      // Arrange
      const invalidQuery = {
        ...validQuery,
        data: {
          requestedBy: 'admin-user-id'
          // Missing all identifier fields
        }
      };

      // Act
      const result = await handlers.handleGetPatientProfile(invalidQuery as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cấu trúc truy vấn thông tin bệnh nhân không hợp lệ');
      expect(mockGetPatientProfileUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle use case errors gracefully', async () => {
      // Arrange
      const error = new Error('Patient not found');
      mockGetPatientProfileUseCase.execute.mockRejectedValue(error);

      // Act
      const result = await handlers.handleGetPatientProfile(validQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi hệ thống khi truy vấn thông tin bệnh nhân');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing GetPatientProfile query',
        expect.objectContaining({
          queryId: validQuery.queryId,
          error: error.message
        })
      );
    });

    it('should log query processing completion', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Lấy thông tin bệnh nhân thành công',
        data: {
          patientId: 'PAT-202510-001',
          userId: uuidv4(),
          personalInfo: {
            fullName: 'Nguyễn Văn Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationalId: '001234567890',
            nationality: 'Vietnamese'
          },
          contactInfo: {
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
          },
          basicMedicalInfo: {
            bloodType: 'O+',
            knownAllergies: ['Penicillin']
          },
          emergencyContacts: [],
          consents: [],
          status: 'active',
          hasInsurance: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          links: []
        }
      };
      mockGetPatientProfileUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await handlers.handleGetPatientProfile(validQuery);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'GetPatientProfile query processed',
        expect.objectContaining({
          queryId: validQuery.queryId,
          success: true,
          patientId: validQuery.data.patientId
        })
      );
    });
  });

  describe('handleGetPatientList', () => {
    const validQuery = {
      queryId: uuidv4(),
      queryType: 'GetPatientList' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        filters: {
          isActive: true,
          city: 'Ho Chi Minh City'
        },
        pagination: {
          page: 1,
          limit: 20
        },
        requestedBy: 'admin-user-id',
        requestedByRole: 'admin'
      }
    };

    it('should handle valid GetPatientList query successfully', async () => {
      // Arrange
      const repositoryResult = {
        patients: [testPatient],
        total: 1
      };
      mockPatientRepository.findWithFilters.mockResolvedValue(repositoryResult);

      // Act
      const result = await handlers.handleGetPatientList(validQuery);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lấy danh sách bệnh nhân thành công');
      if (result.success) {
        expect(result.data.patients).toHaveLength(1);
        expect(result.data.pagination.total).toBe(1);
      }
      expect(mockPatientRepository.findWithFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: true,
          city: 'Ho Chi Minh City'
        }),
        expect.objectContaining({
          page: 1,
          limit: 20
        })
      );
    });

    it('should return error for unauthorized role', async () => {
      // Arrange
      const unauthorizedQuery = {
        ...validQuery,
        data: {
          ...validQuery.data,
          requestedByRole: 'patient' // Patient role not authorized for patient list
        }
      };

      // Act
      const result = await handlers.handleGetPatientList(unauthorizedQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không có quyền truy cập danh sách bệnh nhân');
      expect(mockPatientRepository.findWithFilters).not.toHaveBeenCalled();
    });

    it('should use default pagination when not provided', async () => {
      // Arrange
      const queryWithoutPagination = {
        ...validQuery,
        data: {
          ...validQuery.data,
          pagination: undefined
        }
      };
      const repositoryResult = {
        patients: [],
        total: 0
      };
      mockPatientRepository.findWithFilters.mockResolvedValue(repositoryResult);

      // Act
      await handlers.handleGetPatientList(queryWithoutPagination);

      // Assert
      expect(mockPatientRepository.findWithFilters).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          page: 1, // Default page
          limit: 20 // Default limit
        })
      );
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockPatientRepository.findWithFilters.mockRejectedValue(error);

      // Act
      const result = await handlers.handleGetPatientList(validQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi hệ thống khi truy vấn danh sách bệnh nhân');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleSearchPatients', () => {
    const validQuery = {
      queryId: uuidv4(),
      queryType: 'SearchPatients' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        searchTerm: 'Nguyễn Văn',
        filters: {
          isActive: true
        },
        pagination: {
          page: 1,
          limit: 10
        },
        requestedBy: 'admin-user-id',
        requestedByRole: 'doctor'
      }
    };

    it('should handle valid SearchPatients query successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Tìm kiếm bệnh nhân thành công',
        data: {
          patients: [{
            patientId: 'PAT-202510-001',
            userId: uuidv4(),
            fullName: 'Nguyễn Văn Test',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationalId: '001234567890',
            primaryPhone: '0901234567',
            email: 'test@example.com',
            city: 'Ho Chi Minh City',
            province: 'Ho Chi Minh',
            status: 'active',
            hasInsurance: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1
          }
        }
      };
      mockSearchPatientsUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleSearchPatients(validQuery);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe(expectedResult.message);
      if (result.success) {
        expect(result.data.patients).toHaveLength(1);
        expect(result.data.searchTerm).toBe('Nguyễn Văn');
      }
      expect(mockSearchPatientsUseCase.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: 'Nguyễn Văn',
          filters: { isActive: true },
          pagination: { page: 1, limit: 10 }
        })
      );
    });

    it('should return error for unauthorized role', async () => {
      // Arrange
      const unauthorizedQuery = {
        ...validQuery,
        data: {
          ...validQuery.data,
          requestedByRole: 'patient' // Patient role not authorized for search
        }
      };

      // Act
      const result = await handlers.handleSearchPatients(unauthorizedQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không có quyền tìm kiếm bệnh nhân');
      expect(mockSearchPatientsUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return error for invalid query structure', async () => {
      // Arrange
      const invalidQuery = {
        ...validQuery,
        data: {
          ...validQuery.data,
          searchTerm: '' // Empty search term
        }
      };

      // Act
      const result = await handlers.handleSearchPatients(invalidQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cấu trúc tìm kiếm bệnh nhân không hợp lệ');
    });

    it('should handle use case failure', async () => {
      // Arrange
      const failureResult = {
        success: false,
        message: 'Search term too short'
      };
      mockSearchPatientsUseCase.execute.mockResolvedValue(failureResult);

      // Act
      const result = await handlers.handleSearchPatients(validQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Search term too short');
    });
  });

  describe('handleGetPatientStatistics', () => {
    const validQuery = {
      queryId: uuidv4(),
      queryType: 'GetPatientStatistics' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        },
        groupBy: 'month' as const,
        requestedBy: 'admin-user-id',
        requestedByRole: 'admin'
      }
    };

    it('should handle valid GetPatientStatistics query successfully', async () => {
      // Arrange
      const repositoryResult = {
        patients: [testPatient],
        total: 1
      };
      mockPatientRepository.findWithFilters.mockResolvedValue(repositoryResult);

      // Act
      const result = await handlers.handleGetPatientStatistics(validQuery);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe('Lấy thống kê bệnh nhân thành công');
      if (result.success) {
        expect(result.data.totalPatients).toBe(1);
        expect(result.data.activePatients).toBeDefined();
        expect(result.data.registrationTrend).toBeDefined();
        expect(result.data.demographicBreakdown).toBeDefined();
      }
    });

    it('should return error for unauthorized role', async () => {
      // Arrange
      const unauthorizedQuery = {
        ...validQuery,
        data: {
          ...validQuery.data,
          requestedByRole: 'nurse' // Nurse role not authorized for statistics
        }
      };

      // Act
      const result = await handlers.handleGetPatientStatistics(unauthorizedQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Không có quyền truy cập thống kê bệnh nhân');
    });

    it('should use default groupBy when not provided', async () => {
      // Arrange
      const queryWithoutGroupBy = {
        ...validQuery,
        data: {
          ...validQuery.data,
          groupBy: undefined
        }
      };
      const repositoryResult = {
        patients: [],
        total: 0
      };
      mockPatientRepository.findWithFilters.mockResolvedValue(repositoryResult);

      // Act
      const result = await handlers.handleGetPatientStatistics(queryWithoutGroupBy);

      // Assert
      expect(result.success).toBe(true);
      // Should use default 'month' groupBy
    });
  });

  describe('handleQuery', () => {
    it('should dispatch GetPatientProfile query correctly', async () => {
      // Arrange
      const query = {
        queryId: uuidv4(),
        queryType: 'GetPatientProfile' as const,
        timestamp: new Date(),
        requestedBy: 'admin-user-id',
        data: {
          patientId: 'PAT-202510-001',
          requestedBy: 'admin-user-id'
        }
      };

      const expectedResult = {
        success: true,
        message: 'Lấy thông tin bệnh nhân thành công'
      };
      mockGetPatientProfileUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleQuery(query);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should return error for unknown query type', async () => {
      // Arrange
      const unknownQuery = {
        queryId: uuidv4(),
        queryType: 'UnknownQuery' as any,
        timestamp: new Date(),
        requestedBy: 'admin-user-id',
        data: {
          requestedBy: 'admin-user-id',
          requestedByRole: 'admin'
        }
      };

      // Act
      const result = await handlers.handleQuery(unknownQuery);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Loại truy vấn không được hỗ trợ');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown query type');
    });
  });

  describe('getStatus', () => {
    it('should return handler status information', () => {
      // Act
      const status = handlers.getStatus();

      // Assert
      expect(status).toEqual({
        handlerName: 'PatientQueryHandlers',
        supportedQueries: [
          'GetPatientProfile',
          'GetPatientList',
          'SearchPatients',
          'GetPatientStatistics'
        ],
        isHealthy: true,
        lastProcessedAt: expect.any(String)
      });
    });
  });
});
