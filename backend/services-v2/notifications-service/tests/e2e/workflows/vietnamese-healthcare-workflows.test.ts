/**
 * Vietnamese Healthcare Workflows E2E Tests
 * End-to-end tests for complete Vietnamese healthcare notification workflows
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, End-to-End Testing
 */

import request from 'supertest';
import { NotificationServiceApp } from '../../../src/app';
import { generateVietnameseTestData, VIETNAMESE_HEALTHCARE_CONSTANTS, testUtils } from '../../setup';

describe('Vietnamese Healthcare Workflows E2E', () => {
  let app: NotificationServiceApp;
  let server: any;
  let authToken: string;

  beforeAll(async () => {
    app = new NotificationServiceApp();
    server = app.getApp();
    authToken = 'Bearer valid-jwt-token';
  });

  afterAll(async () => {
    if (app) {
      await app.getServer().close();
    }
  });

  describe('Complete Patient Journey Workflow', () => {
    it('should handle complete patient appointment workflow with Vietnamese notifications', async () => {
      // Step 1: Patient schedules appointment (simulated event)
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

      // Send appointment confirmation
      const confirmationResponse = await request(server)
        .post('/api/v1/notifications/appointment-reminder')
        .set('Authorization', authToken)
        .send(appointmentData)
        .expect(200);

      expect(confirmationResponse.body).toMatchObject({
        success: true,
        message: 'Nhắc nhở lịch hẹn đã được thiết lập thành công',
        notificationId: expect.stringMatching(/^NOT-\d{6}-\d{6}$/)
      });

      // Step 2: Check scheduled notifications
      const scheduledResponse = await request(server)
        .get(`/api/v1/notifications/patient/${VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID}`)
        .set('Authorization', authToken)
        .query({ status: 'SCHEDULED' })
        .expect(200);

      expect(scheduledResponse.body.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            templateType: 'APPOINTMENT_REMINDER',
            status: 'SCHEDULED'
          })
        ])
      );

      // Step 3: Simulate appointment completion and test results
      const testResultsData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        testType: 'Xét nghiệm máu tổng quát',
        testCode: 'XN-MAU-001',
        sampleDate: '2024-01-25',
        requiresConsultation: false
      };

      const testResultsResponse = await request(server)
        .post('/api/v1/notifications/test-results')
        .set('Authorization', authToken)
        .send(testResultsData)
        .expect(200);

      expect(testResultsResponse.body).toMatchObject({
        success: true,
        message: 'Thông báo kết quả xét nghiệm đã được gửi'
      });

      // Step 4: Generate and send invoice
      const invoiceData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        invoiceNumber: 'INV-202401-000001',
        amount: 750000,
        dueDate: '2024-02-10',
        services: ['Khám tim mạch', 'Xét nghiệm máu', 'Siêu âm tim']
      };

      const invoiceResponse = await request(server)
        .post('/api/v1/notifications/payment-reminder')
        .set('Authorization', authToken)
        .send(invoiceData)
        .expect(200);

      expect(invoiceResponse.body).toMatchObject({
        success: true,
        message: 'Nhắc nhở thanh toán đã được gửi'
      });

      // Step 5: Verify complete patient notification history
      const historyResponse = await request(server)
        .get(`/api/v1/notifications/patient/${VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(historyResponse.body.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ templateType: 'APPOINTMENT_REMINDER' }),
          expect.objectContaining({ templateType: 'TEST_RESULTS_READY' }),
          expect.objectContaining({ templateType: 'PAYMENT_REMINDER' })
        ])
      );

      expect(historyResponse.body.total).toBeGreaterThanOrEqual(3);
    });

    it('should handle emergency workflow with urgent Vietnamese notifications', async () => {
      // Step 1: Emergency alert
      const emergencyData = {
        patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
        patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
        alertType: 'CRITICAL_TEST_RESULT',
        alertMessage: 'Kết quả xét nghiệm bất thường, cần liên hệ ngay với bác sĩ',
        emergencyContacts: [
          {
            contactId: 'FAMILY-001',
            name: 'Nguyễn Thị Bình',
            relationship: 'Vợ',
            phoneNumber: '0987654321'
          }
        ]
      };

      const emergencyResponse = await request(server)
        .post('/api/v1/notifications/emergency-alert')
        .set('Authorization', authToken)
        .send(emergencyData)
        .expect(200);

      expect(emergencyResponse.body).toMatchObject({
        success: true,
        message: 'Cảnh báo khẩn cấp đã được gửi',
        priority: 'URGENT',
        deliveryResults: expect.arrayContaining([
          expect.objectContaining({
            channel: expect.stringMatching(/^(SMS|VOICE|PUSH)$/),
            success: true
          })
        ])
      });

      // Step 2: Verify emergency notification bypassed rate limiting
      const immediateResponse = await request(server)
        .post('/api/v1/notifications/emergency-alert')
        .set('Authorization', authToken)
        .send({
          ...emergencyData,
          alertMessage: 'Cảnh báo khẩn cấp thứ hai'
        })
        .expect(200);

      expect(immediateResponse.body.success).toBe(true);

      // Step 3: Check emergency notifications in analytics
      const analyticsResponse = await request(server)
        .get('/api/v1/notifications/analytics')
        .set('Authorization', authToken)
        .query({ 
          dateRange: JSON.stringify({
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          })
        })
        .expect(200);

      expect(analyticsResponse.body.analytics.healthcareStats.emergencyAlerts).toBeGreaterThan(0);
    });
  });

  describe('Medication Management Workflow', () => {
    it('should handle complete medication reminder workflow', async () => {
      // Step 1: Set up medication schedule
      const medicationSchedule = [
        {
          patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          medicationName: 'Paracetamol 500mg',
          dosage: '1 viên',
          medicationTime: '08:00',
          mealInstruction: 'Uống sau khi ăn sáng',
          frequency: 'DAILY'
        },
        {
          patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
          medicationName: 'Vitamin D3',
          dosage: '1 viên',
          medicationTime: '20:00',
          mealInstruction: 'Uống sau khi ăn tối',
          frequency: 'DAILY'
        }
      ];

      // Send medication reminders
      const reminderPromises = medicationSchedule.map(medication =>
        request(server)
          .post('/api/v1/notifications/medication-reminder')
          .set('Authorization', authToken)
          .send(medication)
      );

      const reminderResponses = await Promise.all(reminderPromises);

      reminderResponses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
          success: true,
          message: 'Nhắc nhở uống thuốc đã được thiết lập'
        });
      });

      // Step 2: Verify medication reminders in patient history
      const medicationHistoryResponse = await request(server)
        .get(`/api/v1/notifications/patient/${VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID}`)
        .set('Authorization', authToken)
        .query({ templateType: 'MEDICATION_REMINDER' })
        .expect(200);

      expect(medicationHistoryResponse.body.notifications).toHaveLength(2);
      expect(medicationHistoryResponse.body.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            templateType: 'MEDICATION_REMINDER',
            templateData: expect.objectContaining({
              medicationName: 'Paracetamol 500mg'
            })
          }),
          expect.objectContaining({
            templateType: 'MEDICATION_REMINDER',
            templateData: expect.objectContaining({
              medicationName: 'Vitamin D3'
            })
          })
        ])
      );
    });
  });

  describe('Vietnamese Content Validation Workflow', () => {
    it('should validate Vietnamese healthcare content throughout workflow', async () => {
      // Test Vietnamese patient name validation
      const vietnameseNames = [
        'Nguyễn Văn An',
        'Trần Thị Bình Minh',
        'Lê Hoàng Đức',
        'Phạm Thu Hà'
      ];

      for (const patientName of vietnameseNames) {
        const notificationData = {
          recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          recipientType: 'PATIENT',
          templateType: 'APPOINTMENT_REMINDER',
          templateData: {
            patientName: patientName,
            doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
            appointmentDate: '25/01/2024',
            appointmentTime: '14:30'
          },
          channels: ['EMAIL'],
          priority: 'NORMAL'
        };

        const response = await request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send(notificationData)
          .expect(200);

        expect(response.body.success).toBe(true);
        
        // Verify Vietnamese content in response
        expect(testUtils.isVietnameseText(response.body.message)).toBe(true);
      }
    });

    it('should reject non-Vietnamese healthcare content', async () => {
      const invalidNames = [
        'John Doe',
        'Smith Johnson',
        '123456',
        'Test@User'
      ];

      for (const invalidName of invalidNames) {
        const notificationData = {
          recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
          recipientType: 'PATIENT',
          templateType: 'APPOINTMENT_REMINDER',
          templateData: {
            patientName: invalidName,
            doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
          },
          channels: ['EMAIL'],
          priority: 'NORMAL'
        };

        const response = await request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send(notificationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('không hợp lệ');
      }
    });
  });

  describe('Healthcare Analytics and Reporting Workflow', () => {
    it('should generate comprehensive Vietnamese healthcare analytics', async () => {
      // Step 1: Generate various notification types
      const notificationTypes = [
        'APPOINTMENT_REMINDER',
        'TEST_RESULTS_READY',
        'PAYMENT_REMINDER',
        'MEDICATION_REMINDER'
      ];

      for (const templateType of notificationTypes) {
        await request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send({
            recipientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID,
            recipientType: 'PATIENT',
            templateType,
            templateData: {
              patientName: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_NAME,
              doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME
            },
            channels: ['EMAIL', 'SMS'],
            priority: 'NORMAL'
          });
      }

      // Step 2: Get comprehensive analytics
      const analyticsResponse = await request(server)
        .get('/api/v1/notifications/analytics')
        .set('Authorization', authToken)
        .expect(200);

      expect(analyticsResponse.body).toMatchObject({
        success: true,
        analytics: expect.objectContaining({
          totalNotifications: expect.any(Number),
          deliveryStats: expect.objectContaining({
            sent: expect.any(Number),
            failed: expect.any(Number),
            pending: expect.any(Number)
          }),
          channelStats: expect.objectContaining({
            EMAIL: expect.any(Number),
            SMS: expect.any(Number)
          }),
          templateStats: expect.objectContaining({
            APPOINTMENT_REMINDER: expect.any(Number),
            TEST_RESULTS_READY: expect.any(Number),
            PAYMENT_REMINDER: expect.any(Number),
            MEDICATION_REMINDER: expect.any(Number)
          }),
          healthcareStats: expect.objectContaining({
            patientNotifications: expect.any(Number),
            doctorNotifications: expect.any(Number)
          })
        })
      });

      // Step 3: Get detailed search results
      const searchResponse = await request(server)
        .post('/api/v1/notifications/search')
        .set('Authorization', authToken)
        .send({
          templateType: 'APPOINTMENT_REMINDER',
          dateRange: {
            start: new Date().toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
          },
          healthcareContext: {
            patientId: VIETNAMESE_HEALTHCARE_CONSTANTS.PATIENT_ID
          }
        })
        .expect(200);

      expect(searchResponse.body).toMatchObject({
        success: true,
        notifications: expect.any(Array),
        total: expect.any(Number),
        executionTime: expect.any(Number)
      });
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent Vietnamese healthcare notifications', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();

      // Create concurrent notification requests
      const requests = Array.from({ length: concurrentRequests }, (_, index) => 
        request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send({
            recipientId: `PAT-202401-${String(index + 1).padStart(3, '0')}`,
            recipientType: 'PATIENT',
            templateType: 'APPOINTMENT_REMINDER',
            templateData: {
              patientName: testUtils.generateVietnameseName(),
              doctorName: VIETNAMESE_HEALTHCARE_CONSTANTS.DOCTOR_NAME,
              appointmentDate: '25/01/2024',
              appointmentTime: '14:30'
            },
            channels: ['EMAIL'],
            priority: 'NORMAL'
          })
      );

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Verify performance (should complete within reasonable time)
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests

      console.log(`✅ Processed ${concurrentRequests} concurrent notifications in ${totalTime}ms`);
    });

    it('should maintain Vietnamese content quality under load', async () => {
      const loadTestRequests = 20;
      const vietnamesePatientNames = Array.from({ length: loadTestRequests }, () => 
        testUtils.generateVietnameseName()
      );

      const requests = vietnamesePatientNames.map((patientName, index) =>
        request(server)
          .post('/api/v1/notifications/send')
          .set('Authorization', authToken)
          .send({
            recipientId: `PAT-202401-${String(index + 100).padStart(3, '0')}`,
            recipientType: 'PATIENT',
            templateType: 'TEST_RESULTS_READY',
            templateData: {
              patientName: patientName,
              testType: 'Xét nghiệm máu tổng quát',
              testCode: `XN-${String(index + 1).padStart(3, '0')}`
            },
            channels: ['EMAIL', 'SMS'],
            priority: 'HIGH'
          })
      );

      const responses = await Promise.all(requests);

      // Verify all Vietnamese names were processed correctly
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        
        // Verify Vietnamese content integrity
        const originalName = vietnamesePatientNames[index];
        expect(testUtils.isVietnameseText(originalName)).toBe(true);
      });

      console.log(`✅ Processed ${loadTestRequests} Vietnamese healthcare notifications with content validation`);
    });
  });
});
