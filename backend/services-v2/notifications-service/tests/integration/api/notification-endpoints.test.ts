/**
 * Notification API Endpoints Integration Tests
 * Tests for REST API endpoints with Vietnamese healthcare scenarios
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, API Testing
 */

import request from 'supertest';
import { NotificationServiceApp } from '../../../src/app';
import { generateVietnameseTestData, VIETNAMESE_HEALTHCARE_CONSTANTS, mockSupabaseClient } from '../../setup';

describe('Notification API Endpoints', () => {
  let app: NotificationServiceApp;
  let server: any;

  beforeAll(async () => {
    app = new NotificationServiceApp();
    server = app.getApp();
  });

  afterAll(async () => {
    if (app) {
      await app.getServer().close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/notifications/send', () => {
    it('should send notification successfully with Vietnamese healthcare data', async () => {
      // Arrange
      const notificationData = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
          appointmentDate: '20/01/2024',
          appointmentTime: '14:30',
          roomNumber: 'P.101',
          hospitalName: VIETNAMESE_HEALTHCARE_CONSTANTS.HOSPITAL_NAME
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        metadata: {
          healthcareContext: {
            patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
            doctorId: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID,
            appointmentId: VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID
          }
        }
      };

      const authToken = 'Bearer valid-jwt-token';

      // Mock successful responses
      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/send')
        .set('Authorization', authToken)
        .send(notificationData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Thông báo đã được gửi thành công',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
        deliveryResults: expect.any(Array)
      });

      expect(response.body.deliveryResults).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            channel: expect.stringMatching(/^(EMAIL|SMS)$/),
            success: expect.any(Boolean)
          })
        ])
      );
    });

    it('should return validation error for invalid Vietnamese healthcare data', async () => {
      // Arrange
      const invalidData = {
        recipientId: 'INVALID-ID',
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: {
          patientName: '', // Empty name
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
        },
        channels: [],
        priority: 'NORMAL'
      };

      const authToken = 'Bearer valid-jwt-token';

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/send')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: 'Dữ liệu đầu vào không hợp lệ',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: expect.any(String),
            message: expect.stringContaining('không hợp lệ')
          })
        ])
      });
    });

    it('should require authentication', async () => {
      // Arrange
      const notificationData = generateVietnameseTestData.notification();

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/send')
        .send(notificationData)
        .expect(401);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: 'Token xác thực không được cung cấp',
        error: 'UNAUTHORIZED'
      });
    });

    it('should handle rate limiting for healthcare users', async () => {
      // Arrange
      const notificationData = generateVietnameseTestData.notification();
      const authToken = 'Bearer valid-jwt-token';

      // Act - Send multiple requests rapidly
      const requests = Array.from({ length: 15 }, () =>
        request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send(notificationData)
      );

      const responses = await Promise.all(requests);

      // Assert - Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      const rateLimitedResponse = rateLimitedResponses[0];
      expect(rateLimitedResponse.body).toMatchObject({
        success: false,
        message: expect.stringContaining('quá nhiều yêu cầu'),
        error: 'HEALTHCARE_RATE_LIMIT_EXCEEDED'
      });
    });
  });

  describe('POST /api/v1/notifications/schedule', () => {
    it('should schedule notification for future delivery', async () => {
      // Arrange
      const scheduleData = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
          appointmentDate: '25/01/2024',
          appointmentTime: '09:00'
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'HIGH',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours later
      };

      const authToken = 'Bearer valid-jwt-token';

      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/schedule')
        .set('Authorization', authToken)
        .send(scheduleData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Thông báo đã được lên lịch thành công',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
        scheduledAt: expect.any(String)
      });
    });

    it('should reject scheduling in the past', async () => {
      // Arrange
      const scheduleData = {
        recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: {
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME
        },
        channels: ['EMAIL'],
        priority: 'NORMAL',
        scheduledAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      };

      const authToken = 'Bearer valid-jwt-token';

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/schedule')
        .set('Authorization', authToken)
        .send(scheduleData)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('không thể lên lịch trong quá khứ'),
        error: 'INVALID_SCHEDULE_TIME'
      });
    });
  });

  describe('GET /api/v1/notifications/patient/:patientId', () => {
    it('should get patient notifications with Vietnamese healthcare context', async () => {
      // Arrange
      const patientId = VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID;
      const authToken = 'Bearer valid-jwt-token';

      const mockNotifications = [
        generateVietnameseTestData.notification(),
        {
          ...generateVietnameseTestData.notification(),
          notificationId: 'NOT-202401-000002',
          templateType: 'TEST_RESULTS_READY'
        }
      ];

      mockSupabaseClient.from().select().mockResolvedValue({
        data: mockNotifications,
        error: null
      });

      // Act
      const response = await request(server)
        .get(`/api/v1/notifications/patient/${patientId}`)
        .set('Authorization', authToken)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        notifications: expect.arrayContaining([
          expect.objectContaining({
            notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
            recipientId: patientId,
            templateType: expect.any(String)
          })
        ]),
        total: expect.any(Number),
        pagination: expect.objectContaining({
          page: expect.any(Number),
          limit: expect.any(Number)
        })
      });
    });

    it('should validate patient ID format', async () => {
      // Arrange
      const invalidPatientId = 'INVALID-PATIENT-ID';
      const authToken = 'Bearer valid-jwt-token';

      // Act
      const response = await request(server)
        .get(`/api/v1/notifications/patient/${invalidPatientId}`)
        .set('Authorization', authToken)
        .expect(400);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Mã bệnh nhân không hợp lệ'),
        error: 'INVALID_PATIENT_ID'
      });
    });
  });

  describe('POST /api/v1/notifications/search', () => {
    it('should search notifications with Vietnamese healthcare filters', async () => {
      // Arrange
      const searchCriteria = {
        templateType: 'APPOINTMENT_REMINDER',
        priority: 'HIGH',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        healthcareContext: {
          doctorId: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_ID
        },
        status: 'SENT'
      };

      const authToken = 'Bearer valid-jwt-token';

      const mockSearchResults = [
        generateVietnameseTestData.notification(),
        {
          ...generateVietnameseTestData.notification(),
          notificationId: 'NOT-202401-000003',
          priority: 'HIGH'
        }
      ];

      mockSupabaseClient.from().select().mockResolvedValue({
        data: mockSearchResults,
        error: null
      });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/search')
        .set('Authorization', authToken)
        .send(searchCriteria)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        notifications: expect.any(Array),
        total: expect.any(Number),
        searchCriteria: searchCriteria,
        executionTime: expect.any(Number)
      });
    });
  });

  describe('GET /api/v1/notifications/analytics', () => {
    it('should return Vietnamese healthcare analytics', async () => {
      // Arrange
      const authToken = 'Bearer valid-jwt-token';

      const mockAnalytics = {
        totalNotifications: 1250,
        deliveryStats: {
          sent: 1100,
          failed: 50,
          pending: 100
        },
        channelStats: {
          EMAIL: 600,
          SMS: 500,
          PUSH: 150
        },
        templateStats: {
          APPOINTMENT_REMINDER: 500,
          TEST_RESULTS_READY: 300,
          PAYMENT_REMINDER: 250,
          MEDICATION_REMINDER: 200
        },
        healthcareStats: {
          patientNotifications: 1000,
          doctorNotifications: 200,
          emergencyAlerts: 50
        }
      };

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockAnalytics,
        error: null
      });

      // Act
      const response = await request(server)
        .get('/api/v1/notifications/analytics')
        .set('Authorization', authToken)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        analytics: expect.objectContaining({
          totalNotifications: expect.any(Number),
          deliveryStats: expect.objectContaining({
            sent: expect.any(Number),
            failed: expect.any(Number),
            pending: expect.any(Number)
          }),
          channelStats: expect.any(Object),
          templateStats: expect.any(Object),
          healthcareStats: expect.any(Object)
        }),
        generatedAt: expect.any(String)
      });
    });
  });

  describe('Healthcare-specific endpoints', () => {
    it('should send appointment reminder with Vietnamese template', async () => {
      // Arrange
      const appointmentData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        appointmentId: VIETNAMESE_HEALTHCARE_CONSTANTS.APPOINTMENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
        appointmentDate: '2024-01-25',
        appointmentTime: '14:30',
        roomNumber: 'P.101',
        reminderTime: '24_HOURS_BEFORE'
      };

      const authToken = 'Bearer valid-jwt-token';

      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/appointment-reminder')
        .set('Authorization', authToken)
        .send(appointmentData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Nhắc nhở lịch hẹn đã được thiết lập thành công',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
        scheduledAt: expect.any(String)
      });
    });

    it('should send test results notification with Vietnamese medical terms', async () => {
      // Arrange
      const testResultsData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        testType: 'Xét nghiệm máu tổng quát',
        testCode: 'XN-MAU-001',
        sampleDate: '2024-01-20',
        requiresConsultation: true
      };

      const authToken = 'Bearer valid-jwt-token';

      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/test-results')
        .set('Authorization', authToken)
        .send(testResultsData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Thông báo kết quả xét nghiệm đã được gửi',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
        deliveryResults: expect.any(Array)
      });
    });

    it('should send payment reminder with Vietnamese currency format', async () => {
      // Arrange
      const paymentData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        invoiceNumber: 'INV-202401-000001',
        amount: 500000,
        dueDate: '2024-01-30',
        services: ['Khám tim mạch', 'Siêu âm tim']
      };

      const authToken = 'Bearer valid-jwt-token';

      mockSupabaseClient.from().insert().mockResolvedValue({ data: [{}], error: null });

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/payment-reminder')
        .set('Authorization', authToken)
        .send(paymentData)
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        message: 'Nhắc nhở thanh toán đã được gửi',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/),
        deliveryResults: expect.arrayContaining([
          expect.objectContaining({
            channel: expect.any(String),
            success: expect.any(Boolean)
          })
        ])
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Arrange
      const notificationData = generateVietnameseTestData.notification();
      const authToken = 'Bearer valid-jwt-token';

      mockSupabaseClient.from().insert().mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/send')
        .set('Authorization', authToken)
        .send(notificationData)
        .expect(500);

      // Assert
      expect(response.body).toMatchObject({
        success: false,
        message: 'Đã xảy ra lỗi hệ thống',
        error: 'INTERNAL_SERVER_ERROR',
        requestId: expect.any(String)
      });
    });

    it('should return Vietnamese error messages for validation failures', async () => {
      // Arrange
      const invalidData = {
        recipientId: '',
        templateType: 'INVALID_TEMPLATE',
        channels: []
      };

      const authToken = 'Bearer valid-jwt-token';

      // Act
      const response = await request(server)
        .post('/api/v1/notifications/send')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      // Assert
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringMatching(/tiếng Việt/i)
          })
        ])
      );
    });
  });

  describe('Health Check', () => {
    it('should return service health status', async () => {
      // Act
      const response = await request(server)
        .get('/health')
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'notifications-service',
        version: '2.0.0',
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String)
      });
    });
  });
});
