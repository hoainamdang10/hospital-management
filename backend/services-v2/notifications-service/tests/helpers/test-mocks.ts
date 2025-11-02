/**
 * Test Mocks - Helper functions for creating test doubles
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { RecipientInfo } from '../../src/domain/value-objects/RecipientInfo';
import { NotificationContent } from '../../src/domain/value-objects/NotificationContent';
import { NotificationChannel } from '../../src/domain/value-objects/NotificationChannel';
import { Notification } from '../../src/domain/aggregates/Notification';

export class TestMocks {
  /**
   * Create mock RecipientInfo
   */
  static createMockRecipient(overrides?: Partial<any>): RecipientInfo {
    return RecipientInfo.create({
      recipientId: overrides?.recipientId || 'patient-123',
      recipientType: overrides?.recipientType || 'PATIENT',
      fullName: overrides?.fullName || 'Nguyễn Văn A',
      contactInfo: {
        email: overrides?.email || 'patient@example.com',
        phoneNumber: overrides?.phoneNumber || '+84123456789'
      },
      preferences: {
        preferredChannels: overrides?.preferredChannels || ['EMAIL', 'SMS'],
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        optOut: {
          marketing: false,
          reminders: false,
          emergency: false
        }
      }
    });
  }

  /**
   * Create mock NotificationContent
   */
  static createMockContent(overrides?: Partial<any>): NotificationContent {
    return NotificationContent.create({
      subject: overrides?.subject || 'Test Notification',
      body: overrides?.body || 'This is a test notification body',
      footer: overrides?.footer,
      contentType: 'TEXT',
      language: overrides?.language || 'vi'
    });
  }

  /**
   * Create mock Notification
   */
  static createMockNotification(overrides?: Partial<any>): Notification {
    const recipient = overrides?.recipient || TestMocks.createMockRecipient();
    const content = overrides?.content || TestMocks.createMockContent();
    const channels = overrides?.channels || [NotificationChannel.create('EMAIL')];

    return Notification.create({
      recipient,
      templateType: overrides?.templateType || 'APPOINTMENT_CONFIRMATION',
      content,
      channels,
      priority: overrides?.priority || 'NORMAL',
      metadata: {
        source: 'test',
        correlationId: 'test-correlation-123',
        ...overrides?.metadata
      }
    });
  }

  /**
   * Create mock notification repository
   */
  static createMockNotificationRepository() {
    return {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByRecipient: jest.fn(),
      findByCriteria: jest.fn(),
      findScheduledForProcessing: jest.fn(),
      findFailedForRetry: jest.fn(),
      findByStatus: jest.fn(),
      findUrgentNotifications: jest.fn(),
      findByHealthcareContext: jest.fn(),
      findByTemplateType: jest.fn(),
      findByChannel: jest.fn(),
      findByDateRange: jest.fn(),
      findDuplicates: jest.fn(),
      countByCriteria: jest.fn(),
      countByStatus: jest.fn(),
      countByRecipient: jest.fn(),
      delete: jest.fn(),
      deleteOlderThan: jest.fn(),
      deleteByCriteria: jest.fn(),
      exists: jest.fn(),
      getStatistics: jest.fn(),
      getDeliveryMetrics: jest.fn(),
      getNotificationsRequiringAttention: jest.fn(),
      getRecipientHistory: jest.fn(),
      getRecentNotifications: jest.fn(),
      findByCorrelationId: jest.fn(),
      findOverdueNotifications: jest.fn(),
      findHighRetryNotifications: jest.fn(),
      findByPriorityAndStatus: jest.fn(),
      updateStatus: jest.fn(),
      updateRetryInfo: jest.fn(),
      markAsProcessed: jest.fn(),
      markAsFailed: jest.fn(),
      bulkUpdate: jest.fn(),
      getQueueSize: jest.fn(),
      getAverageProcessingTime: jest.fn(),
      getFailureRateByChannel: jest.fn(),
      getSuccessRateByTemplateType: jest.fn(),
      getPeakUsageHours: jest.fn(),
      getNotificationTrends: jest.fn(),
      archiveOldNotifications: jest.fn(),
      getHealthCheck: jest.fn(),
      optimize: jest.fn(),
      getRepositoryStats: jest.fn()
    };
  }

  /**
   * Create mock delivery service
   */
  static createMockDeliveryService() {
    return {
      deliver: jest.fn().mockResolvedValue([
        {
          notificationId: 'test-123',
          channel: 'EMAIL',
          success: true,
          status: 'SENT',
          deliveryTime: 100,
          retryable: false
        }
      ]),
      deliverToChannel: jest.fn(),
      scheduleDelivery: jest.fn(),
      cancelScheduledDelivery: jest.fn(),
      retryDelivery: jest.fn(),
      getDeliveryStatus: jest.fn(),
      getDeliveryAttempts: jest.fn(),
      canDeliverToRecipient: jest.fn(),
      validateDeliveryRequest: jest.fn(),
      getOptimalChannels: jest.fn(),
      getChannelHealth: jest.fn(),
      getDeliveryMetrics: jest.fn(),
      getQueueStatus: jest.fn(),
      processQueue: jest.fn(),
      pauseChannel: jest.fn(),
      resumeChannel: jest.fn(),
      getPausedChannels: jest.fn(),
      setChannelRateLimit: jest.fn(),
      getRateLimitStatus: jest.fn(),
      testChannel: jest.fn(),
      estimateDeliveryCost: jest.fn(),
      getDeliveryAnalytics: jest.fn(),
      getFailedDeliveriesRequiringAttention: jest.fn(),
      bulkDeliver: jest.fn(),
      getChannelTemplates: jest.fn(),
      configureChannelProvider: jest.fn(),
      getChannelProviderConfig: jest.fn(),
      switchChannelProvider: jest.fn(),
      getAvailableProviders: jest.fn(),
      monitorPerformance: jest.fn(),
      getHealthCheck: jest.fn(),
      cleanupOldRecords: jest.fn(),
      exportDeliveryData: jest.fn(),
      getServiceStatistics: jest.fn()
    };
  }

  /**
   * Create mock template service
   */
  static createMockTemplateService() {
    return {
      getTemplate: jest.fn(),
      getTemplateByType: jest.fn(),
      getTemplates: jest.fn(),
      getActiveTemplates: jest.fn(),
      getVietnameseHealthcareTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      activateTemplate: jest.fn(),
      deactivateTemplate: jest.fn(),
      approveTemplate: jest.fn(),
      applyTemplate: jest.fn(),
      applyTemplateByType: jest.fn().mockResolvedValue(TestMocks.createMockContent()),
      validateTemplate: jest.fn(),
      validatePlaceholderValues: jest.fn(),
      previewTemplate: jest.fn(),
      getTemplateUsageStatistics: jest.fn(),
      getTemplatePerformanceMetrics: jest.fn(),
      getMostUsedTemplates: jest.fn(),
      getBestPerformingTemplates: jest.fn(),
      cloneTemplate: jest.fn(),
      createTemplateVersion: jest.fn(),
      getTemplateVersions: jest.fn(),
      rollbackTemplate: jest.fn(),
      testTemplate: jest.fn(),
      getTemplateRecommendations: jest.fn(),
      optimizeTemplateForChannel: jest.fn(),
      getTemplateComplianceStatus: jest.fn(),
      generateTemplateFromSample: jest.fn(),
      extractPlaceholders: jest.fn(),
      suggestPlaceholders: jest.fn(),
      getTemplateAnalytics: jest.fn(),
      exportTemplate: jest.fn(),
      importTemplate: jest.fn(),
      bulkUpdateTemplates: jest.fn(),
      searchTemplatesByContent: jest.fn(),
      getTemplateHealthCheck: jest.fn(),
      cleanupUnusedTemplates: jest.fn(),
      getTemplateDependencies: jest.fn(),
      validateTemplateDependencies: jest.fn()
    };
  }

  /**
   * Create mock Supabase client
   */
  static createMockSupabaseClient() {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      contains: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn(),
      rpc: jest.fn(),
      auth: {
        signInWithPassword: jest.fn(),
        signOut: jest.fn()
      }
    };
  }
}


