/**
 * Notification API - E2E Tests
 * End-to-end tests for REST API endpoints
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import { TestFixtures } from '../../helpers/test-fixtures';

describe('Notification API - E2E', () => {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3031';
  const apiPath = '/api/v1/notifications';

  describe('POST /api/v1/notifications/send', () => {
    it('should send notification successfully', async () => {
      // Arrange
      const payload = {
        recipientId: 'patient-123',
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_CONFIRMATION',
        templateData: TestFixtures.templateData.appointmentConfirmation,
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL'
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/send`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.notificationId).toBeDefined();
      expect(response.body.data.status).toBe('SENT');
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidPayload = {
        recipientId: 'patient-123'
        // Missing required fields
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/send`)
        .send(invalidPayload)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should send Vietnamese notification', async () => {
      // Arrange
      const payload = {
        recipientId: TestFixtures.patients.patient1.patientId,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_CONFIRMATION',
        templateData: {
          patientName: TestFixtures.patients.patient1.fullName,
          appointmentDate: '15/01/2025',
          appointmentTime: '09:00',
          doctorName: TestFixtures.doctors.doctor1.fullName,
          hospitalName: 'Bệnh viện Đa khoa'
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'HIGH'
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/send`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.notificationId).toMatch(/^NOT-\d{6}-\d{6}$/);
    });
  });

  describe('GET /api/v1/notifications/:id', () => {
    it('should get notification by ID', async () => {
      // Act
      const response = await request(baseUrl)
        .get(`${apiPath}/NOT-202501-000001`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      if (response.body.data) {
        expect(response.body.data.notificationId).toBeDefined();
      }
    });

    it('should return 404 for non-existent notification', async () => {
      // Act
      const response = await request(baseUrl)
        .get(`${apiPath}/NOT-999999-999999`)
        .expect(404);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/notifications/bulk', () => {
    it('should send bulk notifications', async () => {
      // Arrange
      const payload = {
        recipientIds: ['patient-1', 'patient-2', 'patient-3'],
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_REMINDER',
        templateData: TestFixtures.templateData.appointmentConfirmation,
        channels: ['EMAIL'],
        priority: 'NORMAL'
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/bulk`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalRequested).toBe(3);
      expect(response.body.data.successful).toBeGreaterThanOrEqual(0);
    });

    it('should limit bulk size', async () => {
      // Arrange
      const payload = {
        recipientIds: Array(1500).fill('patient-x'), // > 1000 limit
        recipientType: 'PATIENT',
        templateType: 'TEST',
        templateData: {},
        channels: ['EMAIL']
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/bulk`)
        .send(payload)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/notifications/health', () => {
    it('should return service health status', async () => {
      // Act
      const response = await request(baseUrl)
        .get(`${apiPath}/health`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('isHealthy');
      expect(response.body.data).toHaveProperty('checks');
      expect(response.body.data).toHaveProperty('metrics');
    });
  });

  describe('GET /api/v1/notifications/dashboard', () => {
    it('should return dashboard summary', async () => {
      // Act
      const response = await request(baseUrl)
        .get(`${apiPath}/dashboard`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('overview');
      expect(response.body.data).toHaveProperty('queue');
      expect(response.body.data).toHaveProperty('recentActivity');
    });
  });

  describe('PUT /api/v1/notifications/:id/cancel', () => {
    it('should cancel notification', async () => {
      // Arrange
      const notificationId = 'NOT-202501-000001';
      const payload = {
        reason: 'Appointment cancelled by patient'
      };

      // Act
      const response = await request(baseUrl)
        .put(`${apiPath}/${notificationId}/cancel`)
        .send(payload)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('Vietnamese Healthcare Specific Endpoints', () => {
    it('should handle appointment reminder endpoint', async () => {
      // Arrange
      const payload = {
        patientId: TestFixtures.patients.patient1.patientId,
        appointmentId: TestFixtures.appointments.appointment1.appointmentId,
        appointmentDate: '2025-01-15T09:00:00Z',
        doctorName: TestFixtures.doctors.doctor1.fullName,
        roomNumber: 'P101'
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/appointment-reminder`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('should handle test results notification', async () => {
      // Arrange
      const payload = {
        patientId: TestFixtures.patients.patient1.patientId,
        testType: 'Xét nghiệm máu',
        testCode: 'XN-12345',
        sampleDate: '2025-01-10',
        requiresConsultation: false
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/test-results`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });

    it('should handle payment reminder', async () => {
      // Arrange
      const payload = {
        patientId: TestFixtures.patients.patient1.patientId,
        invoiceNumber: 'INV-12345',
        amount: 500000,
        dueDate: '2025-01-20',
        services: [{ name: 'Khám bệnh', price: 500000 }]
      };

      // Act
      const response = await request(baseUrl)
        .post(`${apiPath}/payment-reminder`)
        .send(payload)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
    });
  });
});


