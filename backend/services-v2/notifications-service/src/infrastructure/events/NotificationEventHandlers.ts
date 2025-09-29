/**
 * NotificationEventHandlers - Event Handlers
 * Event handlers for cross-service integration with Vietnamese healthcare context
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { NotificationApplicationService } from '../../application/services/NotificationApplicationService';

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  occurredAt: Date;
  version: number;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    source?: string;
  };
}

export interface IntegrationEvent extends DomainEvent {
  serviceName: string;
  eventVersion: string;
}

export class NotificationEventHandlers {
  constructor(
    private readonly notificationService: NotificationApplicationService
  ) {}

  /**
   * Handle appointment scheduled event
   */
  public async handleAppointmentScheduled(event: IntegrationEvent): Promise<void> {
    try {
      const { appointmentId, patientId, doctorId, appointmentDate, appointmentTime, doctorName, roomNumber } = event.eventData;

      // Schedule appointment reminder 24 hours before
      const reminderTime = new Date(appointmentDate);
      reminderTime.setHours(reminderTime.getHours() - 24);

      // Only schedule if reminder time is in the future
      if (reminderTime > new Date()) {
        await this.notificationService.scheduleNotification({
          recipientId: patientId,
          recipientType: 'PATIENT',
          templateType: 'APPOINTMENT_REMINDER',
          templateData: {
            patientName: event.eventData.patientName || 'Quý khách',
            appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
            appointmentTime: appointmentTime,
            doctorName: doctorName,
            roomNumber: roomNumber || 'Sẽ thông báo sau',
            hospitalName: 'Bệnh viện Đa khoa',
            hospitalAddress: '123 Đường ABC, Quận XYZ, TP.HCM',
            contactPhone: '1900-xxxx'
          },
          channels: ['EMAIL', 'SMS', 'PUSH'],
          priority: 'HIGH',
          scheduledAt: reminderTime,
          metadata: {
            correlationId: event.metadata?.correlationId,
            healthcareContext: {
              patientId,
              doctorId,
              appointmentId
            },
            tags: ['appointment', 'reminder', 'scheduled'],
            source: 'APPOINTMENT_SERVICE'
          }
        });
      }

      // Send immediate confirmation
      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_CONFIRMATION',
        templateData: {
          patientName: event.eventData.patientName || 'Quý khách',
          appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
          appointmentTime: appointmentTime,
          doctorName: doctorName,
          roomNumber: roomNumber || 'Sẽ thông báo sau',
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx'
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            doctorId,
            appointmentId
          },
          tags: ['appointment', 'confirmation'],
          source: 'APPOINTMENT_SERVICE'
        }
      });

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện appointment scheduled:', error);
      throw new Error(`Lỗi xử lý sự kiện appointment scheduled: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle appointment cancelled event
   */
  public async handleAppointmentCancelled(event: IntegrationEvent): Promise<void> {
    try {
      const { appointmentId, patientId, doctorId, appointmentDate, appointmentTime, doctorName, cancellationReason } = event.eventData;

      // Send cancellation notification
      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'APPOINTMENT_CANCELLED',
        templateData: {
          patientName: event.eventData.patientName || 'Quý khách',
          appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
          appointmentTime: appointmentTime,
          doctorName: doctorName,
          cancellationReason: cancellationReason || 'Không có lý do cụ thể',
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx',
          rebookingUrl: 'https://booking.hospital.com'
        },
        channels: ['EMAIL', 'SMS', 'PUSH'],
        priority: 'HIGH',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            doctorId,
            appointmentId
          },
          tags: ['appointment', 'cancellation'],
          source: 'APPOINTMENT_SERVICE'
        }
      });

      // Cancel any pending appointment reminders
      // This would require implementing a cancel notification feature
      // await this.notificationService.cancelNotificationsByContext({ appointmentId });

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện appointment cancelled:', error);
      throw new Error(`Lỗi xử lý sự kiện appointment cancelled: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle medical record updated event
   */
  public async handleMedicalRecordUpdated(event: IntegrationEvent): Promise<void> {
    try {
      const { recordId, patientId, doctorId, updateType, hasTestResults, requiresFollowUp } = event.eventData;

      // Send notification for test results
      if (updateType === 'TEST_RESULTS' && hasTestResults) {
        await this.notificationService.sendNotification({
          recipientId: patientId,
          recipientType: 'PATIENT',
          templateType: 'TEST_RESULTS_READY',
          templateData: {
            patientName: event.eventData.patientName || 'Quý khách',
            testType: event.eventData.testType || 'Xét nghiệm',
            testCode: event.eventData.testCode || recordId,
            sampleDate: event.eventData.sampleDate ? new Date(event.eventData.sampleDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
            requiresConsultation: requiresFollowUp || false,
            onlinePortalUrl: 'https://portal.hospital.com',
            consultationBookingUrl: 'https://booking.hospital.com',
            hospitalName: 'Bệnh viện Đa khoa',
            contactPhone: '1900-xxxx'
          },
          channels: ['EMAIL', 'SMS', 'PUSH'],
          priority: requiresFollowUp ? 'HIGH' : 'NORMAL',
          metadata: {
            correlationId: event.metadata?.correlationId,
            healthcareContext: {
              patientId,
              doctorId,
              medicalRecordId: recordId
            },
            tags: ['test-results', 'medical-records'],
            source: 'CLINICAL_EMR_SERVICE'
          }
        });
      }

      // Send follow-up notification if required
      if (requiresFollowUp) {
        await this.notificationService.sendNotification({
          recipientId: patientId,
          recipientType: 'PATIENT',
          templateType: 'FOLLOW_UP_REQUIRED',
          templateData: {
            patientName: event.eventData.patientName || 'Quý khách',
            doctorName: event.eventData.doctorName || 'Bác sĩ',
            followUpReason: event.eventData.followUpReason || 'Cần tái khám',
            bookingUrl: 'https://booking.hospital.com',
            hospitalName: 'Bệnh viện Đa khoa',
            contactPhone: '1900-xxxx'
          },
          channels: ['EMAIL', 'SMS'],
          priority: 'HIGH',
          metadata: {
            correlationId: event.metadata?.correlationId,
            healthcareContext: {
              patientId,
              doctorId,
              medicalRecordId: recordId
            },
            tags: ['follow-up', 'medical-records'],
            source: 'CLINICAL_EMR_SERVICE'
          }
        });
      }

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện medical record updated:', error);
      throw new Error(`Lỗi xử lý sự kiện medical record updated: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle invoice generated event
   */
  public async handleInvoiceGenerated(event: IntegrationEvent): Promise<void> {
    try {
      const { invoiceId, patientId, amount, dueDate, services, insuranceCoverage } = event.eventData;

      // Send invoice notification
      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'INVOICE_GENERATED',
        templateData: {
          patientName: event.eventData.patientName || 'Quý khách',
          invoiceNumber: invoiceId,
          amount: amount.toLocaleString('vi-VN'),
          serviceDate: event.eventData.serviceDate ? new Date(event.eventData.serviceDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
          dueDate: new Date(dueDate).toLocaleDateString('vi-VN'),
          services: services || [],
          insuranceCoverage: insuranceCoverage || false,
          insuranceAmount: event.eventData.insuranceAmount ? event.eventData.insuranceAmount.toLocaleString('vi-VN') : '0',
          finalAmount: event.eventData.finalAmount ? event.eventData.finalAmount.toLocaleString('vi-VN') : amount.toLocaleString('vi-VN'),
          bankAccount: 'STK: 123456789 - Ngân hàng ABC',
          paymentUrl: 'https://payment.hospital.com',
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx'
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            invoiceId
          },
          tags: ['invoice', 'billing'],
          source: 'BILLING_SERVICE'
        }
      });

      // Schedule payment reminder 3 days before due date
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 3);

      if (reminderDate > new Date()) {
        await this.notificationService.scheduleNotification({
          recipientId: patientId,
          recipientType: 'PATIENT',
          templateType: 'PAYMENT_REMINDER',
          templateData: {
            patientName: event.eventData.patientName || 'Quý khách',
            invoiceNumber: invoiceId,
            amount: amount.toLocaleString('vi-VN'),
            dueDate: new Date(dueDate).toLocaleDateString('vi-VN'),
            services: services || [],
            paymentUrl: 'https://payment.hospital.com',
            hospitalName: 'Bệnh viện Đa khoa',
            contactPhone: '1900-xxxx'
          },
          channels: ['EMAIL', 'SMS'],
          priority: 'NORMAL',
          scheduledAt: reminderDate,
          metadata: {
            correlationId: event.metadata?.correlationId,
            healthcareContext: {
              patientId,
              invoiceId
            },
            tags: ['payment', 'reminder', 'billing'],
            source: 'BILLING_SERVICE'
          }
        });
      }

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện invoice generated:', error);
      throw new Error(`Lỗi xử lý sự kiện invoice generated: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle payment completed event
   */
  public async handlePaymentCompleted(event: IntegrationEvent): Promise<void> {
    try {
      const { paymentId, invoiceId, patientId, amount, paymentMethod } = event.eventData;

      // Send payment confirmation
      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'PAYMENT_CONFIRMATION',
        templateData: {
          patientName: event.eventData.patientName || 'Quý khách',
          invoiceNumber: invoiceId,
          paymentId: paymentId,
          amount: amount.toLocaleString('vi-VN'),
          paymentMethod: paymentMethod || 'Chuyển khoản',
          paymentDate: new Date().toLocaleDateString('vi-VN'),
          hospitalName: 'Bệnh viện Đa khoa',
          contactPhone: '1900-xxxx'
        },
        channels: ['EMAIL', 'SMS'],
        priority: 'NORMAL',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            invoiceId,
            paymentId
          },
          tags: ['payment', 'confirmation', 'billing'],
          source: 'BILLING_SERVICE'
        }
      });

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện payment completed:', error);
      throw new Error(`Lỗi xử lý sự kiện payment completed: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle emergency alert event
   */
  public async handleEmergencyAlert(event: IntegrationEvent): Promise<void> {
    try {
      const { patientId, alertType, alertMessage, location, emergencyContacts } = event.eventData;

      // Send emergency alert to patient
      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'EMERGENCY_ALERT',
        templateData: {
          patientName: event.eventData.patientName || 'Bệnh nhân',
          alertType: alertType,
          alertMessage: alertMessage,
          alertTime: new Date().toLocaleString('vi-VN'),
          location: location || 'Bệnh viện',
          actionRequired: event.eventData.actionRequired || 'Liên hệ ngay với bệnh viện',
          emergencyPhone: '115',
          hospitalName: 'Bệnh viện Đa khoa'
        },
        channels: ['SMS', 'VOICE', 'PUSH'],
        priority: 'URGENT',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            alertType
          },
          tags: ['emergency', 'alert', 'urgent'],
          source: event.metadata?.source || 'EMERGENCY_SYSTEM'
        }
      });

      // Send alerts to emergency contacts
      if (emergencyContacts && emergencyContacts.length > 0) {
        for (const contact of emergencyContacts) {
          await this.notificationService.sendNotification({
            recipientId: contact.contactId,
            recipientType: 'FAMILY',
            templateType: 'EMERGENCY_ALERT',
            templateData: {
              patientName: event.eventData.patientName || 'Bệnh nhân',
              alertType: alertType,
              alertMessage: alertMessage,
              alertTime: new Date().toLocaleString('vi-VN'),
              location: location || 'Bệnh viện',
              actionRequired: 'Vui lòng liên hệ ngay với bệnh viện',
              emergencyPhone: '115',
              hospitalName: 'Bệnh viện Đa khoa'
            },
            channels: ['SMS', 'VOICE'],
            priority: 'URGENT',
            metadata: {
              correlationId: event.metadata?.correlationId,
              healthcareContext: {
                patientId,
                alertType,
                emergencyContactId: contact.contactId
              },
              tags: ['emergency', 'alert', 'family'],
              source: event.metadata?.source || 'EMERGENCY_SYSTEM'
            }
          });
        }
      }

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện emergency alert:', error);
      throw new Error(`Lỗi xử lý sự kiện emergency alert: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Handle medication reminder event
   */
  public async handleMedicationReminder(event: IntegrationEvent): Promise<void> {
    try {
      const { patientId, medicationName, dosage, medicationTime, mealInstruction } = event.eventData;

      await this.notificationService.sendNotification({
        recipientId: patientId,
        recipientType: 'PATIENT',
        templateType: 'MEDICATION_REMINDER',
        templateData: {
          patientName: event.eventData.patientName || 'Quý khách',
          medicationName: medicationName,
          dosage: dosage,
          medicationTime: medicationTime,
          mealInstruction: mealInstruction || 'Uống sau khi ăn',
          sideEffects: event.eventData.sideEffects,
          specialInstructions: event.eventData.specialInstructions,
          doctorPhone: event.eventData.doctorPhone || '1900-xxxx',
          hospitalName: 'Bệnh viện Đa khoa'
        },
        channels: ['SMS', 'PUSH', 'IN_APP'],
        priority: 'HIGH',
        metadata: {
          correlationId: event.metadata?.correlationId,
          healthcareContext: {
            patientId,
            medicationName
          },
          tags: ['medication', 'reminder', 'healthcare'],
          source: 'MEDICATION_SERVICE'
        }
      });

    } catch (error) {
      console.error('Lỗi khi xử lý sự kiện medication reminder:', error);
      throw new Error(`Lỗi xử lý sự kiện medication reminder: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  /**
   * Generic event handler dispatcher
   */
  public async handleEvent(event: IntegrationEvent): Promise<void> {
    try {
      console.log(`Xử lý sự kiện: ${event.eventType} từ ${event.serviceName}`);

      switch (event.eventType) {
        case 'AppointmentScheduled':
          await this.handleAppointmentScheduled(event);
          break;

        case 'AppointmentCancelled':
          await this.handleAppointmentCancelled(event);
          break;

        case 'MedicalRecordUpdated':
          await this.handleMedicalRecordUpdated(event);
          break;

        case 'InvoiceGenerated':
          await this.handleInvoiceGenerated(event);
          break;

        case 'PaymentCompleted':
          await this.handlePaymentCompleted(event);
          break;

        case 'EmergencyAlert':
          await this.handleEmergencyAlert(event);
          break;

        case 'MedicationReminder':
          await this.handleMedicationReminder(event);
          break;

        default:
          console.warn(`Không có handler cho sự kiện: ${event.eventType}`);
          break;
      }

    } catch (error) {
      console.error(`Lỗi khi xử lý sự kiện ${event.eventType}:`, error);
      throw error;
    }
  }
}
