/**
 * NotificationAggregate Unit Tests
 * Comprehensive tests for NotificationAggregate with Vietnamese healthcare scenarios
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Domain-Driven Design
 */

import { NotificationAggregate } from '../../../../src/domain/aggregates/NotificationAggregate';
import { NotificationId } from '../../../../src/domain/value-objects/NotificationId';
import { NotificationChannel } from '../../../../src/domain/value-objects/NotificationChannel';
import { NotificationContent } from '../../../../src/domain/value-objects/NotificationContent';
import { NotificationRecipient } from '../../../../src/domain/value-objects/NotificationRecipient';
import { generateVietnameseTestData, VIETNAMESE_HEALTHCARE_CONSTANTS } from '../../../setup';

describe('NotificationAggregate', () => {
  let notificationData: any;
  let notificationId: NotificationId;
  let recipient: NotificationRecipient;
  let channels: NotificationChannel[];
  let content: NotificationContent;

  beforeEach(() => {
    notificationData = generateVietnameseTestData.notification();
    notificationId = NotificationId.fromString(notificationData.notificationId);
    recipient = NotificationRecipient.create(
      notificationData.recipientId,
      notificationData.recipientType
    );
    channels = notificationData.channels.map((channel: string) => 
      NotificationChannel.fromString(channel)
    );
    content = NotificationContent.create(
      'Nhắc nhở lịch hẹn khám',
      'Bạn có lịch hẹn khám với BS. Trần Thị Bình vào ngày 20/01/2024 lúc 14:30',
      'Xin chào Nguyễn Văn An, bạn có lịch hẹn khám...'
    );
  });

  describe('Creation', () => {
    it('should create notification aggregate successfully', () => {
      const notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );

      expect(notification).toBeInstanceOf(NotificationAggregate);
      expect(notification.getId()).toBe(notificationId);
      expect(notification.getRecipient()).toBe(recipient);
      expect(notification.getTemplateType()).toBe('APPOINTMENT_REMINDER');
      expect(notification.getChannels()).toEqual(channels);
      expect(notification.getPriority()).toBe('NORMAL');
      expect(notification.getStatus()).toBe('DRAFT');
    });

    it('should create notification with Vietnamese healthcare context', () => {
      const notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'HIGH',
        {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
          appointmentDate: '20/01/2024',
          appointmentTime: '14:30',
          hospitalName: VIETNAMESE_HEALTHCARE_CONSTANTS.HOSPITAL_NAME
        },
        {
          healthcareContext: {
            patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
            doctorId: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
            appointmentId: VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID
          }
        }
      );

      const templateData = notification.getTemplateData();
      expect(templateData.patientName).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME);
      expect(templateData.doctorName).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME);
      expect(templateData.hospitalName).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.HOSPITAL_NAME);

      const metadata = notification.getMetadata();
      expect(metadata.healthcareContext?.patientId).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID);
      expect(metadata.healthcareContext?.doctorId).toBe(VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID);
    });

    it('should throw error for invalid template type', () => {
      expect(() => {
        NotificationAggregate.create(
          notificationId,
          recipient,
          'INVALID_TEMPLATE' as any,
          channels,
          'NORMAL',
          {},
          {}
        );
      }).toThrow('Template type không hợp lệ: INVALID_TEMPLATE');
    });

    it('should throw error for empty channels', () => {
      expect(() => {
        NotificationAggregate.create(
          notificationId,
          recipient,
          'APPOINTMENT_REMINDER',
          [],
          'NORMAL',
          {},
          {}
        );
      }).toThrow('Phải có ít nhất một kênh gửi thông báo');
    });
  });

  describe('Status Management', () => {
    let notification: NotificationAggregate;

    beforeEach(() => {
      notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
    });

    it('should schedule notification successfully', () => {
      const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours later
      
      notification.schedule(scheduledAt);
      
      expect(notification.getStatus()).toBe('SCHEDULED');
      expect(notification.getScheduledAt()).toEqual(scheduledAt);
      
      const events = notification.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('NotificationScheduled');
    });

    it('should not schedule notification in the past', () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      expect(() => {
        notification.schedule(pastDate);
      }).toThrow('Không thể lên lịch thông báo trong quá khứ');
    });

    it('should start processing notification', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      
      notification.startProcessing();
      
      expect(notification.getStatus()).toBe('PROCESSING');
      expect(notification.getProcessingStartedAt()).toBeDefined();
    });

    it('should mark notification as sent successfully', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      notification.startProcessing();
      
      const deliveryResults = [
        {
          channel: 'EMAIL',
          success: true,
          deliveredAt: new Date(),
          providerId: 'email-provider-1',
          providerMessageId: 'msg-123'
        }
      ];
      
      notification.markAsSent(deliveryResults);
      
      expect(notification.getStatus()).toBe('SENT');
      expect(notification.getSentAt()).toBeDefined();
      expect(notification.getDeliveryResults()).toEqual(deliveryResults);
      
      const events = notification.getUncommittedEvents();
      const sentEvent = events.find(e => e.eventType === 'NotificationSent');
      expect(sentEvent).toBeDefined();
    });

    it('should mark notification as failed with retry logic', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      notification.startProcessing();
      
      const error = new Error('Lỗi gửi email');
      
      notification.markAsFailed(error, 1);
      
      expect(notification.getStatus()).toBe('FAILED');
      expect(notification.getFailureReason()).toBe('Lỗi gửi email');
      expect(notification.getRetryCount()).toBe(1);
      expect(notification.getNextRetryAt()).toBeDefined();
    });

    it('should cancel scheduled notification', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      
      notification.cancel('Bệnh nhân yêu cầu hủy');
      
      expect(notification.getStatus()).toBe('CANCELLED');
      expect(notification.getCancellationReason()).toBe('Bệnh nhân yêu cầu hủy');
      expect(notification.getCancelledAt()).toBeDefined();
    });

    it('should not cancel already sent notification', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      notification.startProcessing();
      notification.markAsSent([]);
      
      expect(() => {
        notification.cancel('Test cancellation');
      }).toThrow('Không thể hủy thông báo đã được gửi');
    });
  });

  describe('Vietnamese Healthcare Business Rules', () => {
    let notification: NotificationAggregate;

    beforeEach(() => {
      notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
    });

    it('should respect Vietnamese quiet hours', () => {
      // Test scheduling during quiet hours (22:00 - 06:00)
      const quietHourTime = new Date();
      quietHourTime.setHours(23, 0, 0, 0); // 11 PM
      
      notification.schedule(quietHourTime);
      
      // Should be rescheduled to next morning
      const scheduledAt = notification.getScheduledAt();
      expect(scheduledAt?.getHours()).toBeGreaterThanOrEqual(6);
      expect(scheduledAt?.getHours()).toBeLessThan(22);
    });

    it('should handle emergency notifications during quiet hours', () => {
      const emergencyNotification = NotificationAggregate.create(
        notificationId,
        recipient,
        'EMERGENCY_ALERT',
        [NotificationChannel.fromString('SMS'), NotificationChannel.fromString('VOICE')],
        'URGENT',
        { alertMessage: 'Cảnh báo khẩn cấp' },
        {}
      );
      
      const quietHourTime = new Date();
      quietHourTime.setHours(2, 0, 0, 0); // 2 AM
      
      emergencyNotification.schedule(quietHourTime);
      
      // Emergency notifications should not be rescheduled
      expect(emergencyNotification.getScheduledAt()?.getHours()).toBe(2);
    });

    it('should validate Vietnamese healthcare template data', () => {
      const invalidTemplateData = {
        patientName: '', // Empty patient name
        doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
        appointmentDate: 'invalid-date'
      };
      
      expect(() => {
        NotificationAggregate.create(
          notificationId,
          recipient,
          'APPOINTMENT_REMINDER',
          channels,
          'NORMAL',
          invalidTemplateData,
          {}
        );
      }).toThrow('Tên bệnh nhân không được để trống');
    });

    it('should handle medication reminder with Vietnamese instructions', () => {
      const medicationNotification = NotificationAggregate.create(
        notificationId,
        recipient,
        'MEDICATION_REMINDER',
        [NotificationChannel.fromString('SMS')],
        'HIGH',
        {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          medicationName: 'Paracetamol 500mg',
          dosage: '1 viên',
          medicationTime: '08:00',
          mealInstruction: 'Uống sau khi ăn sáng'
        },
        {}
      );
      
      expect(medicationNotification.getTemplateType()).toBe('MEDICATION_REMINDER');
      expect(medicationNotification.getPriority()).toBe('HIGH');
      
      const templateData = medicationNotification.getTemplateData();
      expect(templateData.mealInstruction).toBe('Uống sau khi ăn sáng');
    });
  });

  describe('Event Generation', () => {
    let notification: NotificationAggregate;

    beforeEach(() => {
      notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
    });

    it('should generate domain events for notification lifecycle', () => {
      // Schedule notification
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      
      // Start processing
      notification.startProcessing();
      
      // Mark as sent
      notification.markAsSent([]);
      
      const events = notification.getUncommittedEvents();
      expect(events).toHaveLength(3);
      
      expect(events[0].eventType).toBe('NotificationScheduled');
      expect(events[1].eventType).toBe('NotificationProcessingStarted');
      expect(events[2].eventType).toBe('NotificationSent');
    });

    it('should include Vietnamese healthcare context in events', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      
      const events = notification.getUncommittedEvents();
      const scheduledEvent = events[0];
      
      expect(scheduledEvent.eventData.healthcareContext).toBeDefined();
      expect(scheduledEvent.eventData.healthcareContext.patientId).toBe(
        VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID
      );
    });

    it('should clear uncommitted events after commit', () => {
      notification.schedule(new Date(Date.now() + 60 * 60 * 1000));
      
      expect(notification.getUncommittedEvents()).toHaveLength(1);
      
      notification.markEventsAsCommitted();
      
      expect(notification.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe('Content Management', () => {
    let notification: NotificationAggregate;

    beforeEach(() => {
      notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
    });

    it('should set notification content successfully', () => {
      notification.setContent(content);
      
      expect(notification.getContent()).toBe(content);
      expect(notification.getContent()?.getSubject()).toBe('Nhắc nhở lịch hẹn khám');
    });

    it('should update delivery results', () => {
      const deliveryResults = [
        {
          channel: 'EMAIL',
          success: true,
          deliveredAt: new Date(),
          providerId: 'email-provider',
          providerMessageId: 'msg-123'
        },
        {
          channel: 'SMS',
          success: false,
          error: 'Số điện thoại không hợp lệ',
          attemptedAt: new Date()
        }
      ];
      
      notification.updateDeliveryResults(deliveryResults);
      
      expect(notification.getDeliveryResults()).toEqual(deliveryResults);
    });

    it('should track Vietnamese healthcare audit information', () => {
      const auditInfo = {
        accessedBy: 'user-123',
        accessedAt: new Date(),
        action: 'VIEW_NOTIFICATION',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };
      
      notification.addAuditEntry(auditInfo);
      
      const auditTrail = notification.getAuditTrail();
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0]).toEqual(auditInfo);
    });
  });

  describe('Validation', () => {
    it('should validate notification aggregate invariants', () => {
      const notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
      
      expect(() => notification.validate()).not.toThrow();
    });

    it('should fail validation for invalid state transitions', () => {
      const notification = NotificationAggregate.create(
        notificationId,
        recipient,
        'APPOINTMENT_REMINDER',
        channels,
        'NORMAL',
        notificationData.templateData,
        notificationData.metadata
      );
      
      // Try to mark as sent without scheduling first
      expect(() => {
        notification.markAsSent([]);
      }).toThrow('Không thể đánh dấu thông báo là đã gửi khi chưa được lên lịch');
    });

    it('should validate Vietnamese healthcare data requirements', () => {
      const invalidHealthcareData = {
        patientName: 'John Doe', // Non-Vietnamese name format
        doctorName: '',
        appointmentDate: 'invalid-date'
      };
      
      expect(() => {
        NotificationAggregate.create(
          notificationId,
          recipient,
          'APPOINTMENT_REMINDER',
          channels,
          'NORMAL',
          invalidHealthcareData,
          {}
        );
      }).toThrow();
    });
  });
});
