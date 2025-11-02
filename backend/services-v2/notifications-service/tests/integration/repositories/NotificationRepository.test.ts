/**
 * SupabaseNotificationRepository - Integration Tests
 * Tests with mock Supabase client
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { SupabaseNotificationRepository } from '../../../src/infrastructure/persistence/SupabaseNotificationRepository';
import { TestMocks } from '../../helpers/test-mocks';
import { NotificationId } from '../../../src/domain/value-objects/NotificationId';

describe('SupabaseNotificationRepository - Integration', () => {
  let repository: SupabaseNotificationRepository;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = TestMocks.createMockSupabaseClient();
    repository = new SupabaseNotificationRepository(mockSupabase);
  });

  describe('save', () => {
    it('should save notification to database', async () => {
      // Arrange
      const notification = TestMocks.createMockNotification();
      mockSupabase.from().insert.mockResolvedValue({ data: null, error: null });

      // Act
      await repository.save(notification);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should throw error when save fails', async () => {
      // Arrange
      const notification = TestMocks.createMockNotification();
      mockSupabase.from().insert.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      // Act & Assert
      await expect(repository.save(notification)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should return notification when found', async () => {
      // Arrange
      const notificationId = NotificationId.fromString('NOT-202501-000001');
      const mockData = {
        notification_id: 'NOT-202501-000001',
        recipient_id: 'patient-123',
        recipient_type: 'PATIENT',
        recipient_name: 'Nguyễn Văn A',
        template_type: 'APPOINTMENT_CONFIRMATION',
        subject: 'Test',
        body: 'Test body',
        channels: ['EMAIL'],
        status: 'PENDING',
        priority: 'NORMAL',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_deleted: false
      };
      mockSupabase.single.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await repository.findById(notificationId);

      // Assert
      expect(result).not.toBeNull();
      expect(mockSupabase.eq).toHaveBeenCalledWith('notification_id', notificationId.value);
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_deleted', false);
    });

    it('should return null when not found', async () => {
      // Arrange
      const notificationId = NotificationId.fromString('NOT-202501-999999');
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: { code: 'PGRST116' } 
      });

      // Act
      const result = await repository.findById(notificationId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByRecipient', () => {
    it('should return notifications for recipient', async () => {
      // Arrange
      const recipientId = 'patient-123';
      const mockData = [
        { notification_id: 'NOT-1', recipient_id: recipientId, template_type: 'TEST', subject: 'Test', body: 'Body', channels: [], status: 'SENT', priority: 'NORMAL', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
      mockSupabase.range.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await repository.findByRecipient(recipientId, 20, 0);

      // Assert
      expect(result).toHaveLength(1);
      expect(mockSupabase.eq).toHaveBeenCalledWith('recipient_id', recipientId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_deleted', false);
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      mockSupabase.range.mockResolvedValue({ data: [], error: null });

      // Act
      await repository.findByRecipient('patient-123', 10, 20);

      // Assert
      expect(mockSupabase.range).toHaveBeenCalledWith(20, 29);
    });
  });

  describe('countByStatus', () => {
    it('should count notifications by status', async () => {
      // Arrange
      mockSupabase.from().select.mockResolvedValue({ 
        count: 42, 
        error: null 
      });

      // Act
      const count = await repository.countByStatus('SENT');

      // Assert
      expect(count).toBe(42);
      expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'SENT');
    });
  });

  describe('getHealthCheck', () => {
    it('should return health check data', async () => {
      // Arrange
      mockRepository.countByStatus.mockResolvedValue(5);
      mockRepository.findOverdueNotifications.mockResolvedValue([]);
      mockRepository.getAverageProcessingTime.mockResolvedValue(100);

      // Act
      const health = await repository.getHealthCheck();

      // Assert
      expect(health.isHealthy).toBe(true);
      expect(health.pendingNotifications).toBeGreaterThanOrEqual(0);
      expect(health.failedNotifications).toBeGreaterThanOrEqual(0);
      expect(health.averageResponseTime).toBeGreaterThanOrEqual(0);
    });
  });
});


