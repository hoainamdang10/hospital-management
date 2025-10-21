/**
 * PatientCommandHandlers Unit Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for CQRS Command handlers
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */

import { PatientCommandHandlers } from '../../../../src/application/handlers/PatientCommandHandlers';
import { RegisterPatientUseCase } from '../../../../src/application/use-cases/RegisterPatientUseCase';
import { UpdatePatientInfoUseCase } from '../../../../src/application/use-cases/UpdatePatientInfoUseCase';
import { DeactivatePatientUseCase } from '../../../../src/application/use-cases/DeactivatePatientUseCase';
import { GrantConsentUseCase } from '../../../../src/application/use-cases/GrantConsentUseCase';
import { AddEmergencyContactUseCase } from '../../../../src/application/use-cases/AddEmergencyContactUseCase';
import { ILogger } from '@shared/application/services/logger.interface';
import { v4 as uuidv4 } from 'uuid';

describe('PatientCommandHandlers', () => {
  let handlers: PatientCommandHandlers;
  let mockRegisterPatientUseCase: jest.Mocked<RegisterPatientUseCase>;
  let mockUpdatePatientInfoUseCase: jest.Mocked<UpdatePatientInfoUseCase>;
  let mockDeactivatePatientUseCase: jest.Mocked<DeactivatePatientUseCase>;
  let mockGrantConsentUseCase: jest.Mocked<GrantConsentUseCase>;
  let mockAddEmergencyContactUseCase: jest.Mocked<AddEmergencyContactUseCase>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Mock use cases
    mockRegisterPatientUseCase = {
      execute: jest.fn()
    } as any;

    mockUpdatePatientInfoUseCase = {
      execute: jest.fn()
    } as any;

    mockDeactivatePatientUseCase = {
      execute: jest.fn()
    } as any;

    mockGrantConsentUseCase = {
      execute: jest.fn()
    } as any;

    mockAddEmergencyContactUseCase = {
      execute: jest.fn()
    } as any;

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as any;

    // Create handlers instance
    handlers = new PatientCommandHandlers(
      mockRegisterPatientUseCase,
      mockUpdatePatientInfoUseCase,
      mockDeactivatePatientUseCase,
      mockGrantConsentUseCase,
      mockAddEmergencyContactUseCase,
      mockLogger
    );
  });

  describe('handleRegisterPatient', () => {
    const validCommand = {
      commandId: uuidv4(),
      commandType: 'RegisterPatient' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        userId: uuidv4(),
        personalInfo: {
          fullName: 'Nguyễn Văn Test',
          dateOfBirth: '1990-01-01',
          gender: 'male' as const,
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        contactInfo: {
          primaryPhone: '0901234567',
          email: 'test@example.com',
          preferredContactMethod: 'phone' as const,
          address: {
            street: '123 Test Street',
            ward: 'Ward 1',
            district: 'District 1',
            city: 'Ho Chi Minh City',
            province: 'Ho Chi Minh',
            country: 'Vietnam'
          }
        },
        emergencyContacts: [],
        requestedBy: 'admin-user-id'
      }
    };

    it('should handle valid RegisterPatient command successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Đăng ký bệnh nhân thành công',
        patientId: 'PAT-202510-001'
      };
      mockRegisterPatientUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleRegisterPatient(validCommand);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockRegisterPatientUseCase.execute).toHaveBeenCalledWith(validCommand.data);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Processing RegisterPatient command',
        expect.objectContaining({
          commandId: validCommand.commandId,
          requestedBy: validCommand.requestedBy,
          userId: validCommand.data.userId
        })
      );
    });

    it('should return error for invalid command structure', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        data: {
          ...validCommand.data,
          userId: undefined // Missing required field
        }
      };

      // Act
      const result = await handlers.handleRegisterPatient(invalidCommand as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cấu trúc lệnh đăng ký bệnh nhân không hợp lệ');
      expect(mockRegisterPatientUseCase.execute).not.toHaveBeenCalled();
    });

    it('should handle use case errors gracefully', async () => {
      // Arrange
      const error = new Error('Database connection failed');
      mockRegisterPatientUseCase.execute.mockRejectedValue(error);

      // Act
      const result = await handlers.handleRegisterPatient(validCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi hệ thống khi xử lý lệnh đăng ký bệnh nhân');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing RegisterPatient command',
        expect.objectContaining({
          commandId: validCommand.commandId,
          error: error.message
        })
      );
    });

    it('should log command processing completion', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Đăng ký bệnh nhân thành công',
        patientId: 'PAT-202510-001'
      };
      mockRegisterPatientUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      await handlers.handleRegisterPatient(validCommand);

      // Assert
      expect(mockLogger.info).toHaveBeenCalledWith(
        'RegisterPatient command processed',
        expect.objectContaining({
          commandId: validCommand.commandId,
          success: true,
          patientId: expectedResult.patientId
        })
      );
    });
  });

  describe('handleUpdatePatientInfo', () => {
    const validCommand = {
      commandId: uuidv4(),
      commandType: 'UpdatePatientInfo' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        patientId: 'PAT-202510-001',
        personalInfo: {
          fullName: 'Nguyễn Văn Test Updated',
          dateOfBirth: '1990-01-01',
          gender: 'male' as const,
          nationalId: '001234567890',
          nationality: 'Vietnamese'
        },
        updatedBy: 'admin-user-id'
      }
    };

    it('should handle valid UpdatePatientInfo command successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Cập nhật thông tin bệnh nhân thành công'
      };
      mockUpdatePatientInfoUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleUpdatePatientInfo(validCommand);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockUpdatePatientInfoUseCase.execute).toHaveBeenCalledWith(validCommand.data);
    });

    it('should return error for invalid command structure', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        data: {
          ...validCommand.data,
          patientId: undefined // Missing required field
        }
      };

      // Act
      const result = await handlers.handleUpdatePatientInfo(invalidCommand as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cấu trúc lệnh cập nhật thông tin bệnh nhân không hợp lệ');
    });

    it('should handle use case errors gracefully', async () => {
      // Arrange
      const error = new Error('Patient not found');
      mockUpdatePatientInfoUseCase.execute.mockRejectedValue(error);

      // Act
      const result = await handlers.handleUpdatePatientInfo(validCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Lỗi hệ thống khi xử lý lệnh cập nhật thông tin bệnh nhân');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('handleDeactivatePatient', () => {
    const validCommand = {
      commandId: uuidv4(),
      commandType: 'DeactivatePatient' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        patientId: 'PAT-202510-001',
        reason: 'Patient requested deactivation',
        requestedBy: 'admin-user-id',
        requestedByRole: 'admin'
      }
    };

    it('should handle valid DeactivatePatient command successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Vô hiệu hóa bệnh nhân thành công'
      };
      mockDeactivatePatientUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleDeactivatePatient(validCommand);

      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockDeactivatePatientUseCase.execute).toHaveBeenCalledWith({
        patientId: validCommand.data.patientId,
        reason: validCommand.data.reason,
        performedBy: validCommand.data.requestedBy
      });
    });

    it('should return error for invalid command structure', async () => {
      // Arrange
      const invalidCommand = {
        ...validCommand,
        data: {
          ...validCommand.data,
          reason: undefined // Missing required field
        }
      };

      // Act
      const result = await handlers.handleDeactivatePatient(invalidCommand as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Cấu trúc lệnh vô hiệu hóa bệnh nhân không hợp lệ');
    });
  });

  describe('handleGrantPatientConsent', () => {
    const validCommand = {
      commandId: uuidv4(),
      commandType: 'GrantPatientConsent' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        patientId: 'PAT-202510-001',
        consentType: 'treatment',
        consentDetails: 'Consent for medical treatment',
        grantedBy: 'patient-user-id',
        expiresAt: new Date('2025-12-31')
      }
    };

    it('should handle valid GrantPatientConsent command successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Cấp phép bệnh nhân thành công',
        consentId: 'consent-123'
      };
      mockGrantConsentUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleGrantPatientConsent(validCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe(expectedResult.message);
      expect(mockGrantConsentUseCase.execute).toHaveBeenCalledWith({
        patientId: validCommand.data.patientId,
        consentType: validCommand.data.consentType,
        grantedBy: validCommand.data.grantedBy,
        expiresAt: validCommand.data.expiresAt,
        performedBy: validCommand.requestedBy
      });
    });
  });

  describe('handleAddEmergencyContact', () => {
    const validCommand = {
      commandId: uuidv4(),
      commandType: 'AddEmergencyContact' as const,
      timestamp: new Date(),
      requestedBy: 'admin-user-id',
      data: {
        patientId: 'PAT-202510-001',
        contactInfo: {
          name: 'Nguyễn Thị Emergency',
          relationship: 'spouse',
          phoneNumber: '0901234567',
          email: 'emergency@example.com',
          isPrimary: true
        },
        requestedBy: 'admin-user-id',
        requestedByRole: 'admin'
      }
    };

    it('should handle valid AddEmergencyContact command successfully', async () => {
      // Arrange
      const expectedResult = {
        success: true,
        message: 'Thêm liên hệ khẩn cấp thành công',
        contactId: 'contact-123'
      };
      mockAddEmergencyContactUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleAddEmergencyContact(validCommand);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe(expectedResult.message);
    });
  });

  describe('handleCommand', () => {
    it('should dispatch RegisterPatient command correctly', async () => {
      // Arrange
      const command = {
        commandId: uuidv4(),
        commandType: 'RegisterPatient' as const,
        timestamp: new Date(),
        requestedBy: 'admin-user-id',
        data: {
          userId: uuidv4(),
          personalInfo: {
            fullName: 'Test Patient',
            dateOfBirth: '1990-01-01',
            gender: 'male' as const,
            nationalId: '001234567890',
            nationality: 'Vietnamese'
          },
          contactInfo: {
            primaryPhone: '0901234567',
            email: 'test@example.com',
            preferredContactMethod: 'phone' as const,
            address: {
              street: '123 Test Street',
              ward: 'Ward 1',
              district: 'District 1',
              city: 'Ho Chi Minh City',
              province: 'Ho Chi Minh',
              country: 'Vietnam'
            }
          },
          emergencyContacts: [],
          requestedBy: 'admin-user-id'
        }
      };

      const expectedResult = {
        success: true,
        message: 'Đăng ký bệnh nhân thành công',
        patientId: 'PAT-202510-001'
      };
      mockRegisterPatientUseCase.execute.mockResolvedValue(expectedResult);

      // Act
      const result = await handlers.handleCommand(command);

      // Assert
      expect(result).toEqual(expectedResult);
    });

    it('should return error for unknown command type', async () => {
      // Arrange
      const unknownCommand = {
        commandId: uuidv4(),
        commandType: 'UnknownCommand' as any,
        timestamp: new Date(),
        requestedBy: 'admin-user-id',
        data: {
          patientId: 'PAT-202510-001',
          contactInfo: {
            name: 'Test Contact',
            relationship: 'spouse',
            phoneNumber: '0901234567'
          },
          requestedBy: 'admin-user-id',
          requestedByRole: 'admin'
        }
      };

      // Act
      const result = await handlers.handleCommand(unknownCommand);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Loại lệnh không được hỗ trợ');
      expect(mockLogger.warn).toHaveBeenCalledWith('Unknown command type');
    });
  });

  describe('getStatus', () => {
    it('should return handler status information', () => {
      // Act
      const status = handlers.getStatus();

      // Assert
      expect(status).toEqual({
        handlerName: 'PatientCommandHandlers',
        supportedCommands: [
          'RegisterPatient',
          'UpdatePatientInfo',
          'DeactivatePatient',
          'GrantPatientConsent',
          'AddEmergencyContact'
        ],
        isHealthy: true,
        lastProcessedAt: expect.any(String)
      });
    });
  });
});
