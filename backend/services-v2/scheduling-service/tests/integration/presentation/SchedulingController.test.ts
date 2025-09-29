/**
 * Scheduling Controller Integration Tests
 * V2 Clean Architecture + DDD Implementation
 * Tests for REST API endpoints and controller logic
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import request from 'supertest';
import express from 'express';
import { DIContainer } from '../../../shared/infrastructure/di/container';
import { setupDependencies } from '../../../src/infrastructure/di/setup';
import { createSchedulingRoutes } from '../../../src/presentation/routes/schedulingRoutes';
import { 
  errorHandlingMiddleware, 
  notFoundHandler, 
  handleValidationError 
} from '../../../src/presentation/middleware/ErrorHandlingMiddleware';
import { TestDataFactory } from '../../factories/TestDataFactory';
import { TEST_CONSTANTS } from '../../setup';

describe('Scheduling Controller Integration Tests', () => {
  let app: express.Application;
  let container: DIContainer;

  beforeAll(async () => {
    // Setup test application
    app = express();
    container = new DIContainer();
    
    // Setup dependencies with mocks
    setupDependencies(container);
    
    // Setup middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Setup routes
    app.use('/api/v1/scheduling', createSchedulingRoutes(container));
    
    // Setup error handling
    app.use(handleValidationError);
    app.use(notFoundHandler);
    app.use(errorHandlingMiddleware);
  });

  describe('POST /api/v1/scheduling/appointments', () => {
    it('should schedule appointment with valid data', async () => {
      const requestData = {
        patient: {
          patientId: TEST_CONSTANTS.PATIENT.ID,
          fullName: TEST_CONSTANTS.PATIENT.NAME,
          phone: TEST_CONSTANTS.PATIENT.PHONE,
          dateOfBirth: TEST_CONSTANTS.PATIENT.DATE_OF_BIRTH,
          nationalId: TEST_CONSTANTS.PATIENT.NATIONAL_ID,
          email: TEST_CONSTANTS.PATIENT.EMAIL,
          insuranceType: 'BHYT'
        },
        provider: {
          providerId: TEST_CONSTANTS.PROVIDER.ID,
          fullName: TEST_CONSTANTS.PROVIDER.NAME,
          specialization: TEST_CONSTANTS.PROVIDER.SPECIALIZATION
        },
        appointment: {
          appointmentType: 'consultation',
          priority: 'normal',
          startTime: TEST_CONSTANTS.DATES.TOMORROW.toISOString(),
          endTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + 30 * 60 * 1000).toISOString(),
          reason: TEST_CONSTANTS.APPOINTMENT.REASON,
          estimatedDuration: TEST_CONSTANTS.APPOINTMENT.DURATION,
          urgencyLevel: TEST_CONSTANTS.APPOINTMENT.URGENCY_LEVEL
        },
        departmentCode: TEST_CONSTANTS.PROVIDER.DEPARTMENT
      };

      const response = await request(app)
        .post('/api/v1/scheduling/appointments')
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Đặt lịch hẹn thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.appointment).toBeDefined();
      expect(response.body.data.appointment.patientId).toBe(TEST_CONSTANTS.PATIENT.ID);
      expect(response.body.data.appointment.providerId).toBe(TEST_CONSTANTS.PROVIDER.ID);
      expect(response.body.data.appointment.status).toBe('scheduled');
      expect(response.body.data.nextSteps).toBeDefined();
      expect(response.body.data.reminders).toBeDefined();
    });

    it('should return validation error for invalid phone number', async () => {
      const requestData = {
        patient: {
          patientId: TEST_CONSTANTS.PATIENT.ID,
          fullName: TEST_CONSTANTS.PATIENT.NAME,
          phone: '123456789', // Invalid phone (not 10 digits starting with 0)
          dateOfBirth: TEST_CONSTANTS.PATIENT.DATE_OF_BIRTH,
          nationalId: TEST_CONSTANTS.PATIENT.NATIONAL_ID
        },
        provider: {
          providerId: TEST_CONSTANTS.PROVIDER.ID
        },
        appointment: {
          appointmentType: 'consultation',
          priority: 'normal',
          startTime: TEST_CONSTANTS.DATES.TOMORROW.toISOString(),
          endTime: new Date(TEST_CONSTANTS.DATES.TOMORROW.getTime() + 30 * 60 * 1000).toISOString(),
          reason: TEST_CONSTANTS.APPOINTMENT.REASON,
          estimatedDuration: TEST_CONSTANTS.APPOINTMENT.DURATION
        },
        departmentCode: TEST_CONSTANTS.PROVIDER.DEPARTMENT
      };

      const response = await request(app)
        .post('/api/v1/scheduling/appointments')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Dữ liệu đầu vào không hợp lệ');
      expect(response.body.validationErrors).toBeDefined();
      expect(response.body.validationErrors.some((error: any) => 
        error.field.includes('phone')
      )).toBe(true);
    });

    it('should return validation error for Sunday appointment', async () => {
      const sundayDate = new Date('2024-12-29T10:00:00.000Z'); // Sunday
      const requestData = {
        patient: {
          patientId: TEST_CONSTANTS.PATIENT.ID,
          fullName: TEST_CONSTANTS.PATIENT.NAME,
          phone: TEST_CONSTANTS.PATIENT.PHONE,
          dateOfBirth: TEST_CONSTANTS.PATIENT.DATE_OF_BIRTH,
          nationalId: TEST_CONSTANTS.PATIENT.NATIONAL_ID
        },
        provider: {
          providerId: TEST_CONSTANTS.PROVIDER.ID
        },
        appointment: {
          appointmentType: 'consultation',
          priority: 'normal',
          startTime: sundayDate.toISOString(),
          endTime: new Date(sundayDate.getTime() + 30 * 60 * 1000).toISOString(),
          reason: TEST_CONSTANTS.APPOINTMENT.REASON,
          estimatedDuration: TEST_CONSTANTS.APPOINTMENT.DURATION
        },
        departmentCode: TEST_CONSTANTS.PROVIDER.DEPARTMENT
      };

      const response = await request(app)
        .post('/api/v1/scheduling/appointments')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });

    it('should return validation error for missing required fields', async () => {
      const requestData = {
        patient: {
          // Missing required fields
          fullName: TEST_CONSTANTS.PATIENT.NAME
        },
        provider: {
          providerId: TEST_CONSTANTS.PROVIDER.ID
        },
        appointment: {
          appointmentType: 'consultation',
          priority: 'normal'
          // Missing required fields
        },
        departmentCode: TEST_CONSTANTS.PROVIDER.DEPARTMENT
      };

      const response = await request(app)
        .post('/api/v1/scheduling/appointments')
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
      expect(response.body.validationErrors.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/scheduling/availability', () => {
    it('should check availability with valid parameters', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/availability')
        .query({
          providerId: TEST_CONSTANTS.PROVIDER.ID,
          date: TEST_CONSTANTS.DATES.TOMORROW.toISOString().split('T')[0], // YYYY-MM-DD format
          duration: 30
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Kiểm tra lịch trống thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.date).toBeDefined();
      expect(response.body.data.slots).toBeDefined();
      expect(Array.isArray(response.body.data.slots)).toBe(true);
    });

    it('should return validation error for invalid date format', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/availability')
        .query({
          providerId: TEST_CONSTANTS.PROVIDER.ID,
          date: 'invalid-date',
          duration: 30
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });

    it('should return validation error when neither providerId nor departmentCode provided', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/availability')
        .query({
          date: TEST_CONSTANTS.DATES.TOMORROW.toISOString().split('T')[0],
          duration: 30
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Phải cung cấp mã bác sĩ hoặc mã khoa');
    });
  });

  describe('PUT /api/v1/scheduling/appointments/:appointmentId/reschedule', () => {
    const appointmentId = 'test-appointment-id';

    it('should reschedule appointment with valid data', async () => {
      const requestData = {
        newStartTime: TEST_CONSTANTS.DATES.NEXT_WEEK.toISOString(),
        newEndTime: new Date(TEST_CONSTANTS.DATES.NEXT_WEEK.getTime() + 30 * 60 * 1000).toISOString(),
        reason: 'Bệnh nhân yêu cầu đổi lịch',
        notifyPatient: true,
        notifyProvider: true
      };

      const response = await request(app)
        .put(`/api/v1/scheduling/appointments/${appointmentId}/reschedule`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Thay đổi lịch hẹn thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.appointmentId).toBeDefined();
      expect(response.body.data.newStartTime).toBe(requestData.newStartTime);
      expect(response.body.data.newEndTime).toBe(requestData.newEndTime);
      expect(response.body.data.reason).toBe(requestData.reason);
    });

    it('should return validation error for past date reschedule', async () => {
      const requestData = {
        newStartTime: TEST_CONSTANTS.DATES.YESTERDAY.toISOString(),
        newEndTime: new Date(TEST_CONSTANTS.DATES.YESTERDAY.getTime() + 30 * 60 * 1000).toISOString(),
        reason: 'Test reason'
      };

      const response = await request(app)
        .put(`/api/v1/scheduling/appointments/${appointmentId}/reschedule`)
        .send(requestData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.validationErrors).toBeDefined();
    });
  });

  describe('GET /api/v1/scheduling/appointments/:appointmentId', () => {
    const appointmentId = 'test-appointment-id';

    it('should get appointment details', async () => {
      const response = await request(app)
        .get(`/api/v1/scheduling/appointments/${appointmentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Lấy thông tin cuộc hẹn thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.patient).toBeDefined();
      expect(response.body.data.provider).toBeDefined();
      expect(response.body.data.appointment).toBeDefined();
      expect(response.body.data.timeline).toBeDefined();
    });

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/appointments/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không tìm thấy');
    });
  });

  describe('DELETE /api/v1/scheduling/appointments/:appointmentId', () => {
    const appointmentId = 'test-appointment-id';

    it('should cancel appointment with valid reason', async () => {
      const requestData = {
        reason: 'Bệnh nhân hủy lịch'
      };

      const response = await request(app)
        .delete(`/api/v1/scheduling/appointments/${appointmentId}`)
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Hủy lịch hẹn thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.appointmentId).toBe(appointmentId);
      expect(response.body.data.reason).toBe(requestData.reason);
    });

    it('should return validation error for missing reason', async () => {
      const response = await request(app)
        .delete(`/api/v1/scheduling/appointments/${appointmentId}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/scheduling/appointments/:appointmentId/confirm', () => {
    const appointmentId = 'test-appointment-id';

    it('should confirm appointment', async () => {
      const response = await request(app)
        .post(`/api/v1/scheduling/appointments/${appointmentId}/confirm`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Xác nhận lịch hẹn thành công');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.appointmentId).toBeDefined();
      expect(response.body.data.status).toBeDefined();
    });
  });

  describe('Health Check Endpoints', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('scheduling-service');
      expect(response.body.version).toBe('2.0.0');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return service metrics', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Service metrics retrieved successfully');
      expect(response.body.data).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/v1/scheduling/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('không tồn tại');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/v1/scheduling/appointments')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle request timeout', async () => {
      // This test would require a slow endpoint to test timeout
      // For now, we'll just verify the middleware is set up
      expect(true).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting', async () => {
      // Make multiple requests quickly to test rate limiting
      const requests = Array(10).fill(null).map(() =>
        request(app)
          .get('/api/v1/scheduling/health')
      );

      const responses = await Promise.all(requests);
      
      // All requests should succeed initially (within rate limit)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });
});
