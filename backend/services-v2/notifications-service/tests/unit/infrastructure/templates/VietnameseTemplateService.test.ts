/**
 * VietnameseTemplateService - Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { VietnameseTemplateService } from '../../../../src/infrastructure/templates/VietnameseTemplateService';
import { SupabaseTemplateRepository } from '../../../../src/infrastructure/persistence/SupabaseTemplateRepository';
import { NotificationTemplate } from '../../../../src/domain/value-objects/NotificationTemplate';
import { TestMocks } from '../../../helpers/test-mocks';

describe('VietnameseTemplateService', () => {
  let service: VietnameseTemplateService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByTypeAndLanguage: jest.fn(),
      findByCriteria: jest.fn(),
      getVietnameseHealthcareTemplates: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      incrementUsage: jest.fn(),
      getUsageStatistics: jest.fn(),
      getMostUsed: jest.fn(),
      getBestPerforming: jest.fn(),
      search: jest.fn()
    };
    service = new VietnameseTemplateService(mockRepository);
  });

  describe('getTemplateByType', () => {
    it('should get Vietnamese template by type', async () => {
      // Arrange
      const mockTemplate = {
        getTemplateId: () => 'appointment-confirmation-vi',
        getTemplateType: () => 'APPOINTMENT_CONFIRMATION',
        getLanguage: () => 'vi',
        getContent: () => ({ subject: 'Test', body: 'Body' }),
        getPlaceholders: () => [],
        isActive: () => true
      } as any;
      mockRepository.findByTypeAndLanguage.mockResolvedValue(mockTemplate);

      // Act
      const result = await service.getTemplateByType('APPOINTMENT_CONFIRMATION', 'vi');

      // Assert
      expect(result).not.toBeNull();
      expect(mockRepository.findByTypeAndLanguage).toHaveBeenCalledWith('APPOINTMENT_CONFIRMATION', 'vi');
    });

    it('should default to Vietnamese language', async () => {
      // Arrange
      mockRepository.findByTypeAndLanguage.mockResolvedValue(null);

      // Act
      await service.getTemplateByType('APPOINTMENT_CONFIRMATION');

      // Assert
      expect(mockRepository.findByTypeAndLanguage).toHaveBeenCalledWith(
        'APPOINTMENT_CONFIRMATION',
        'vi'
      );
    });
  });

  describe('applyTemplateByType', () => {
    it('should apply template and replace placeholders', async () => {
      // Arrange
      const mockTemplate = {
        getTemplateId: () => 'test-template',
        getTemplateType: () => 'APPOINTMENT_CONFIRMATION',
        getLanguage: () => 'vi',
        getContent: () => ({
          subject: 'Xác nhận lịch hẹn - {{patientName}}',
          body: 'Kính gửi {{patientName}}, lịch hẹn của bạn: {{appointmentDate}}'
        }),
        getPlaceholders: () => [],
        isActive: () => true,
        getContentForChannel: () => null
      } as any;
      mockRepository.findByTypeAndLanguage.mockResolvedValue(mockTemplate);
      mockRepository.incrementUsage.mockResolvedValue(undefined);

      const placeholderValues = {
        patientName: 'Nguyễn Văn A',
        appointmentDate: '15/01/2025'
      };

      // Act
      const result = await service.applyTemplateByType(
        'APPOINTMENT_CONFIRMATION',
        placeholderValues,
        'vi'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.getSubject()).toContain('Nguyễn Văn A');
      expect(result.getBody()).toContain('Nguyễn Văn A');
      expect(result.getBody()).toContain('15/01/2025');
      expect(mockRepository.incrementUsage).toHaveBeenCalled();
    });

    it('should throw error when template not found', async () => {
      // Arrange
      mockRepository.findByTypeAndLanguage.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.applyTemplateByType('NONEXISTENT_TYPE', {})
      ).rejects.toThrow('not found');
    });
  });

  describe('validateTemplate', () => {
    it('should validate template successfully', async () => {
      // Arrange
      const mockTemplate = {
        getContent: () => ({ body: 'Valid body content' }),
        getPlaceholders: () => [
          { key: 'patientName', required: true, type: 'string' }
        ],
        getLanguage: () => 'vi'
      } as any;

      // Act
      const result = await service.validateTemplate(mockTemplate);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for empty body', async () => {
      // Arrange
      const mockTemplate = {
        getContent: () => ({ body: '' }),
        getPlaceholders: () => [],
        getLanguage: () => 'vi'
      } as any;

      // Act
      const result = await service.validateTemplate(mockTemplate);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Template body is required');
    });
  });

  describe('getVietnameseHealthcareTemplates', () => {
    it('should return all Vietnamese healthcare templates', async () => {
      // Arrange
      const mockTemplates = [
        { getTemplateId: () => 'template-1', getLanguage: () => 'vi' },
        { getTemplateId: () => 'template-2', getLanguage: () => 'vi' }
      ];
      mockRepository.getVietnameseHealthcareTemplates.mockResolvedValue(mockTemplates);

      // Act
      const result = await service.getVietnameseHealthcareTemplates();

      // Assert
      expect(result).toHaveLength(2);
      expect(mockRepository.getVietnameseHealthcareTemplates).toHaveBeenCalled();
    });
  });
});


