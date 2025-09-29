/**
 * SendNotificationUseCase Unit Tests
 * Tests for immediate notification sending with Vietnamese healthcare scenarios
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Clean Architecture
 */

import { SendNotificationUseCase } from '../../../../src/application/use-cases/SendNotificationUseCase';
import { INotificationRepository } from '../../../../src/domain/repositories/INotificationRepository';
import { IDeliveryService } from '../../../../src/domain/services/IDeliveryService';
import { ITemplateService } from '../../../../src/domain/services/ITemplateService';
import { NotificationAggregate } from '../../../../src/domain/aggregates/NotificationAggregate';
import { generateVietnameseTestData, VIETNAMESE_HEALTHCARE_CONSTANTS } from '../../../setup';

describe('SendNotificationUseCase', () => {
  let useCase: SendNotificationUseCase;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let mockDeliveryService: jest.Mocked<IDeliveryService>;
  let mockTemplateService: jest.Mocked<ITemplateService>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRecipient: jest.fn(),
      findScheduledNotifications: jest.fn(),
      findFailedNotifications: jest.fn(),
      findByHealthcareContext: jest.fn(),
      searchNotifications: jest.fn(),
      getNotificationStatistics: jest.fn(),
      updateDeliveryStatus: jest.fn(),
      delete: jest.fn()
    };

    mockDeliveryService = {
      deliver: jest.fn(),
      getProviderHealth: jest.fn(),
      getDeliveryStatistics: jest.fn()
    };

    mockTemplateService = {
      applyTemplate: jest.fn(),
      getTemplate: jest.fn(),
      validateTemplateData: jest.fn(),
      getAvailableTemplates: jest.fn()
    };

    useCase = new SendNotificationUseCase(
      mockRepository,
      mockDeliveryService,
      mockTemplateService
    );
  });

  describe('Execute', () => {
    it('should send notification successfully with Vietnamese healthcare context', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'APPOINTMENT_REMINDER' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
          appointmentDate: '20/01/2024',
          appointmentTime: '14:30',
          hospitalName: VIETNAMESE_HEALTHCARE_CONSTANTS.HOSPITAL_NAME
        },
        channels: ['EMAIL', 'SMS'] as const,
        priority: 'NORMAL' as const,
        metadata: {
          healthcareContext: {
            patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
            doctorId: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
            appointmentId: VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID
          }
        }
      };

      const mockTemplateContent = {
        subject: 'Nhắc nhở lịch hẹn khám',
        body: `Xin chào ${VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME}, bạn có lịch hẹn khám với ${VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME} vào ngày 20/01/2024 lúc 14:30.`,
        preview: 'Bạn có lịch hẹn khám...'
      };

      const mockDeliveryResults = [
        {
          channel: 'EMAIL',
          success: true,
          deliveredAt: new Date(),
          providerId: 'email-provider-1',
          providerMessageId: 'msg-123'
        },
        {
          channel: 'SMS',
          success: true,
          deliveredAt: new Date(),
          providerId: 'sms-provider-1',
          providerMessageId: 'sms-456'
        }
      ];

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockTemplateService.applyTemplate.mockResolvedValue(mockTemplateContent);
      mockRepository.findByRecipient.mockResolvedValue({ notifications: [], total: 0 });
      mockDeliveryService.deliver.mockResolvedValue(mockDeliveryResults);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.notificationId).toBeDefined();
      expect(result.deliveryResults).toEqual(mockDeliveryResults);
      expect(result.message).toBe('Thông báo đã được gửi thành công');

      // Verify template validation
      expect(mockTemplateService.validateTemplateData).toHaveBeenCalledWith(
        'APPOINTMENT_REMINDER',
        command.templateData
      );

      // Verify template application
      expect(mockTemplateService.applyTemplate).toHaveBeenCalledWith(
        'APPOINTMENT_REMINDER',
        command.templateData,
        command.channels
      );

      // Verify delivery
      expect(mockDeliveryService.deliver).toHaveBeenCalledWith(
        expect.objectContaining({
          channels: command.channels,
          content: mockTemplateContent,
          priority: command.priority
        })
      );

      // Verify repository save
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.any(NotificationAggregate)
      );
    });

    it('should handle Vietnamese template validation errors', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'APPOINTMENT_REMINDER' as const,
        templateData: {
          patientName: '', // Empty patient name
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
        },
        channels: ['EMAIL'] as const,
        priority: 'NORMAL' as const
      };

      mockTemplateService.validateTemplateData.mockRejectedValue(
        new Error('Tên bệnh nhân không được để trống')
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Tên bệnh nhân không được để trống'
      );

      expect(mockTemplateService.validateTemplateData).toHaveBeenCalled();
      expect(mockTemplateService.applyTemplate).not.toHaveBeenCalled();
      expect(mockDeliveryService.deliver).not.toHaveBeenCalled();
    });

    it('should prevent duplicate notifications within 1 hour', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'APPOINTMENT_REMINDER' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
        },
        channels: ['EMAIL'] as const,
        priority: 'NORMAL' as const
      };

      const existingNotification = generateVietnameseTestData.notification();
      existingNotification.createdAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockRepository.findByRecipient.mockResolvedValue({
        notifications: [existingNotification],
        total: 1
      });

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DUPLICATE_NOTIFICATION');
      expect(result.message).toBe('Thông báo tương tự đã được gửi trong vòng 1 giờ qua');

      expect(mockDeliveryService.deliver).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle emergency notifications with high priority', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'EMERGENCY_ALERT' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          alertType: 'CRITICAL_TEST_RESULT',
          alertMessage: 'Kết quả xét nghiệm bất thường, cần liên hệ ngay với bác sĩ'
        },
        channels: ['SMS', 'VOICE', 'PUSH'] as const,
        priority: 'URGENT' as const
      };

      const mockTemplateContent = {
        subject: 'Cảnh báo khẩn cấp',
        body: 'Kết quả xét nghiệm bất thường, cần liên hệ ngay với bác sĩ',
        preview: 'Cảnh báo khẩn cấp...'
      };

      const mockDeliveryResults = [
        {
          channel: 'SMS',
          success: true,
          deliveredAt: new Date(),
          providerId: 'sms-provider-1',
          providerMessageId: 'sms-emergency-123'
        },
        {
          channel: 'VOICE',
          success: true,
          deliveredAt: new Date(),
          providerId: 'voice-provider-1',
          providerMessageId: 'voice-emergency-456'
        }
      ];

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockTemplateService.applyTemplate.mockResolvedValue(mockTemplateContent);
      mockRepository.findByRecipient.mockResolvedValue({ notifications: [], total: 0 });
      mockDeliveryService.deliver.mockResolvedValue(mockDeliveryResults);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(result.deliveryResults).toEqual(mockDeliveryResults);

      // Verify emergency notifications bypass duplicate check
      expect(mockRepository.findByRecipient).not.toHaveBeenCalled();

      // Verify high priority delivery
      expect(mockDeliveryService.deliver).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 'URGENT',
          channels: ['SMS', 'VOICE', 'PUSH']
        })
      );
    });

    it('should handle partial delivery failures gracefully', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'TEST_RESULTS_READY' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          testType: 'Xét nghiệm máu',
          testCode: 'XN-001'
        },
        channels: ['EMAIL', 'SMS'] as const,
        priority: 'HIGH' as const
      };

      const mockTemplateContent = {
        subject: 'Kết quả xét nghiệm đã có',
        body: 'Kết quả xét nghiệm máu của bạn đã có, vui lòng đến bệnh viện để nhận kết quả.',
        preview: 'Kết quả xét nghiệm đã có...'
      };

      const mockDeliveryResults = [
        {
          channel: 'EMAIL',
          success: true,
          deliveredAt: new Date(),
          providerId: 'email-provider-1',
          providerMessageId: 'email-123'
        },
        {
          channel: 'SMS',
          success: false,
          error: 'Số điện thoại không hợp lệ',
          attemptedAt: new Date()
        }
      ];

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockTemplateService.applyTemplate.mockResolvedValue(mockTemplateContent);
      mockRepository.findByRecipient.mockResolvedValue({ notifications: [], total: 0 });
      mockDeliveryService.deliver.mockResolvedValue(mockDeliveryResults);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(true); // Partial success
      expect(result.deliveryResults).toEqual(mockDeliveryResults);
      expect(result.message).toBe('Thông báo đã được gửi thành công');
      expect(result.warnings).toContain('Một số kênh gửi thông báo thất bại');

      // Verify notification is still saved with partial results
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle medication reminders with Vietnamese instructions', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'MEDICATION_REMINDER' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          medicationName: 'Paracetamol 500mg',
          dosage: '1 viên',
          medicationTime: '08:00',
          mealInstruction: 'Uống sau khi ăn sáng',
          sideEffects: 'Có thể gây buồn nôn nhẹ',
          specialInstructions: 'Không uống cùng với rượu bia'
        },
        channels: ['SMS', 'PUSH'] as const,
        priority: 'HIGH' as const
      };

      const mockTemplateContent = {
        subject: 'Nhắc nhở uống thuốc',
        body: 'Đã đến giờ uống Paracetamol 500mg - 1 viên. Uống sau khi ăn sáng.',
        preview: 'Đã đến giờ uống thuốc...'
      };

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockTemplateService.applyTemplate.mockResolvedValue(mockTemplateContent);
      mockRepository.findByRecipient.mockResolvedValue({ notifications: [], total: 0 });
      mockDeliveryService.deliver.mockResolvedValue([
        {
          channel: 'SMS',
          success: true,
          deliveredAt: new Date(),
          providerId: 'sms-provider-1',
          providerMessageId: 'med-sms-123'
        }
      ]);
      mockRepository.save.mockResolvedValue();

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTemplateService.applyTemplate).toHaveBeenCalledWith(
        'MEDICATION_REMINDER',
        expect.objectContaining({
          medicationName: 'Paracetamol 500mg',
          mealInstruction: 'Uống sau khi ăn sáng',
          specialInstructions: 'Không uống cùng với rượu bia'
        }),
        ['SMS', 'PUSH']
      );
    });

    it('should validate Vietnamese healthcare context requirements', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'APPOINTMENT_REMINDER' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          // Missing required healthcare context
        },
        channels: ['EMAIL'] as const,
        priority: 'NORMAL' as const
      };

      mockTemplateService.validateTemplateData.mockRejectedValue(
        new Error('Thiếu thông tin bác sĩ và thời gian hẹn')
      );

      // Act & Assert
      await expect(useCase.execute(command)).rejects.toThrow(
        'Thiếu thông tin bác sĩ và thời gian hẹn'
      );
    });

    it('should handle delivery service failures with Vietnamese error messages', async () => {
      // Arrange
      const command = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT' as const,
        templateType: 'PAYMENT_REMINDER' as const,
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          invoiceNumber: 'INV-202401-000001',
          amount: '500000'
        },
        channels: ['EMAIL'] as const,
        priority: 'NORMAL' as const
      };

      mockTemplateService.validateTemplateData.mockResolvedValue(true);
      mockTemplateService.applyTemplate.mockResolvedValue({
        subject: 'Nhắc nhở thanh toán',
        body: 'Vui lòng thanh toán hóa đơn...',
        preview: 'Nhắc nhở thanh toán...'
      });
      mockRepository.findByRecipient.mockResolvedValue({ notifications: [], total: 0 });
      mockDeliveryService.deliver.mockRejectedValue(
        new Error('Dịch vụ email tạm thời không khả dụng')
      );

      // Act
      const result = await useCase.execute(command);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('DELIVERY_FAILED');
      expect(result.message).toBe('Không thể gửi thông báo: Dịch vụ email tạm thời không khả dụng');

      // Verify notification is still saved with failed status
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'FAILED'
        })
      );
    });
  });

  describe('Vietnamese Healthcare Validation', () => {
    it('should validate Vietnamese patient names', async () => {
      const invalidNames = [
        'John Doe', // English name
        '123456', // Numbers only
        '', // Empty name
        'Nguyễn@Văn#An' // Special characters
      ];

      for (const invalidName of invalidNames) {
        const command = {
          recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          recipientType: 'PATIENT' as const,
          templateType: 'APPOINTMENT_REMINDER' as const,
          templateData: {
            patientName: invalidName,
            doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
          },
          channels: ['EMAIL'] as const,
          priority: 'NORMAL' as const
        };

        mockTemplateService.validateTemplateData.mockRejectedValue(
          new Error('Tên bệnh nhân không hợp lệ')
        );

        await expect(useCase.execute(command)).rejects.toThrow(
          'Tên bệnh nhân không hợp lệ'
        );
      }
    });

    it('should validate Vietnamese healthcare IDs format', async () => {
      const invalidPatientIds = [
        'INVALID-ID',
        'PAT-2024-001', // Wrong format
        'DOC-202401-001' // Wrong type
      ];

      for (const invalidId of invalidPatientIds) {
        const command = {
          recipientId: invalidId,
          recipientType: 'PATIENT' as const,
          templateType: 'APPOINTMENT_REMINDER' as const,
          templateData: {
            patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME
          },
          channels: ['EMAIL'] as const,
          priority: 'NORMAL' as const
        };

        await expect(useCase.execute(command)).rejects.toThrow();
      }
    });
  });
});
