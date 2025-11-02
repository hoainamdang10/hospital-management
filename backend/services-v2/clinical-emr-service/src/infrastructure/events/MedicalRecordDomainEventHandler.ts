/**
 * MedicalRecordDomainEventHandler - Domain Event Handler
 * Handles domain events from Medical Record Aggregate
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';
import { IEventHandler } from '@shared/events/event-handler.interface';
import { MedicalRecordCreatedEvent } from '../../domain/events/MedicalRecordCreatedEvent';
import { MedicalRecordUpdatedEvent } from '../../domain/events/MedicalRecordUpdatedEvent';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';
import { IAuditService } from '@shared/application/services/audit.service.interface';
import { IEventBus } from '@shared/events/event-bus.interface';

export interface MedicalRecordDomainEventHandlerConfig {
  logger: ILogger;
  auditService: IAuditService;
  eventBus: IEventBus;
}

/**
 * Domain Event Handler for Medical Record Events
 * Follows pattern from SchedulingEventHandler
 */
export class MedicalRecordDomainEventHandler implements IEventHandler {
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly eventBus: IEventBus;

  constructor(config: MedicalRecordDomainEventHandlerConfig) {
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.eventBus = config.eventBus;
  }

  /**
   * Get event type this handler handles
   */
  getEventType(): string {
    return 'MedicalRecordDomain';
  }

  /**
   * Handle domain events
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      this.logger.info('Processing medical record domain event', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        eventId: event.eventId
      });

      switch (event.eventType) {
        case 'MedicalRecordCreated':
          await this.handleMedicalRecordCreated(event as MedicalRecordCreatedEvent);
          break;
        
        case 'MedicalRecordUpdated':
          await this.handleMedicalRecordUpdated(event as MedicalRecordUpdatedEvent);
          break;
        
        default:
          this.logger.warn('Unknown domain event type', {
            eventType: event.eventType,
            eventId: event.eventId
          });
      }

    } catch (error) {
      this.logger.error('Error processing medical record domain event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle MedicalRecordCreated event
   */
  private async handleMedicalRecordCreated(event: MedicalRecordCreatedEvent): Promise<void> {
    try {
      this.logger.info('Handling MedicalRecordCreated event', {
        recordId: event.recordId,
        patientId: event.patientId,
        doctorId: event.doctorId
      });

      // 1. HIPAA Audit Logging
      await this.auditService.logAction(
        'CREATE',
        'MedicalRecord',
        event.recordId,
        event.createdBy,
        'Medical record created',
        {
          patientId: event.patientId,
          doctorId: event.doctorId,
          appointmentId: event.appointmentId,
          eventId: event.eventId
        }
      );

      // 2. Publish integration event for other services
      const integrationEvent = {
        eventId: `medical-record-created-${Date.now()}`,
        eventType: 'medical-record.created',
        aggregateId: event.recordId,
        aggregateType: 'MedicalRecord',
        occurredAt: new Date(),
        serviceName: 'clinical-emr-service',
        eventData: {
          recordId: event.recordId,
          patientId: event.patientId,
          doctorId: event.doctorId,
          appointmentId: event.appointmentId,
          visitDate: event.visitDate,
          symptoms: event.symptoms,
          diagnosis: event.diagnosis,
          createdBy: event.createdBy
        },
        metadata: {
          priority: 'high',
          complianceLevel: 'hipaa',
          containsPHI: true,
          patientId: event.patientId,
          eventCategory: 'clinical',
          eventSubcategory: 'medical_record',
          vietnameseDescription: 'Hồ sơ bệnh án mới được tạo'
        }
      };

      await this.eventBus.publish(integrationEvent as any);

      // 3. Trigger follow-up actions if needed
      if (event.appointmentId) {
        // Notify appointment service that medical record is created
        const appointmentNotificationEvent = {
          eventId: `appointment-medical-record-${Date.now()}`,
          eventType: 'appointment.medical-record-created',
          aggregateId: event.appointmentId,
          aggregateType: 'Appointment',
          occurredAt: new Date(),
          serviceName: 'clinical-emr-service',
          eventData: {
            appointmentId: event.appointmentId,
            recordId: event.recordId,
            patientId: event.patientId,
            doctorId: event.doctorId
          }
        };

        await this.eventBus.publish(appointmentNotificationEvent);
      }

      this.logger.info('MedicalRecordCreated event processed successfully', {
        recordId: event.recordId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error handling MedicalRecordCreated event', {
        recordId: event.recordId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle MedicalRecordUpdated event
   */
  private async handleMedicalRecordUpdated(event: MedicalRecordUpdatedEvent): Promise<void> {
    try {
      this.logger.info('Handling MedicalRecordUpdated event', {
        recordId: event.recordId,
        patientId: event.patientId,
        updatedFields: event.updatedFields
      });

      // 1. HIPAA Audit Logging
      await this.auditService.logAction(
        'UPDATE',
        'MedicalRecord',
        event.recordId,
        event.updatedBy,
        'Medical record updated',
        {
          patientId: event.patientId,
          doctorId: event.doctorId,
          updatedFields: event.updatedFields,
          updateReason: event.updateReason,
          eventId: event.eventId
        }
      );

      // 2. Publish integration event for other services
      const integrationEvent = {
        eventId: `medical-record-updated-${Date.now()}`,
        eventType: 'medical-record.updated',
        aggregateId: event.recordId,
        aggregateType: 'MedicalRecord',
        occurredAt: new Date(),
        serviceName: 'clinical-emr-service',
        eventData: {
          recordId: event.recordId,
          patientId: event.patientId,
          doctorId: event.doctorId,
          updatedFields: event.updatedFields,
          previousValues: event.previousValues,
          newValues: event.newValues,
          updatedBy: event.updatedBy,
          updateReason: event.updateReason
        },
        metadata: {
          priority: 'normal',
          complianceLevel: 'hipaa',
          containsPHI: true,
          patientId: event.patientId,
          eventCategory: 'clinical',
          eventSubcategory: 'medical_record_update',
          vietnameseDescription: 'Hồ sơ bệnh án được cập nhật'
        }
      };

      await this.eventBus.publish(integrationEvent as any);

      // 3. Check for critical updates that need immediate attention
      const criticalFields = ['diagnosis', 'medications', 'status'];
      const hasCriticalUpdate = event.updatedFields.some(field => criticalFields.includes(field));

      if (hasCriticalUpdate) {
        const criticalUpdateEvent = {
          eventId: `medical-record-critical-update-${Date.now()}`,
          eventType: 'medical-record.critical-update',
          aggregateId: event.recordId,
          aggregateType: 'MedicalRecord',
          occurredAt: new Date(),
          serviceName: 'clinical-emr-service',
          eventData: {
            recordId: event.recordId,
            patientId: event.patientId,
            doctorId: event.doctorId,
            criticalFields: event.updatedFields.filter(field => criticalFields.includes(field)),
            updatedBy: event.updatedBy
          },
          metadata: {
            priority: 'urgent',
            requiresNotification: true
          }
        };

        await this.eventBus.publish(criticalUpdateEvent as any);
      }

      this.logger.info('MedicalRecordUpdated event processed successfully', {
        recordId: event.recordId,
        eventId: event.eventId,
        hasCriticalUpdate
      });

    } catch (error) {
      this.logger.error('Error handling MedicalRecordUpdated event', {
        recordId: event.recordId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if handler can handle the event type
   */
  canHandle(eventType: string): boolean {
    return ['MedicalRecordCreated', 'MedicalRecordUpdated'].includes(eventType);
  }

  /**
   * Get handler status
   */
  getStatus(): any {
    return {
      handlerName: 'MedicalRecordDomainEventHandler',
      supportedEvents: ['MedicalRecordCreated', 'MedicalRecordUpdated'],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString()
    };
  }
}
