/**
 * RabbitMQ Staff Event Handler
 * Handles domain events and publishes integration events to RabbitMQ
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture
 */

import { DomainEvent } from '../../domain/events/DomainEvent';
import { ILogger } from '../../application/interfaces/ILogger';
import { RabbitMQEventPublisher } from './RabbitMQEventPublisher';
import { IEventHandler } from '../messaging/SupabaseEventBus';
import {
  StaffRegisteredIntegrationEvent,
  createStaffUpdatedEvent,
  createDoctorAvailabilityChangedEvent,
  createStaffStatusChangedEvent
} from './IntegrationEvents';

/**
 * RabbitMQ Staff Event Handler
 * Subscribes to domain events and publishes integration events
 */
export class RabbitMQStaffEventHandler implements IEventHandler<DomainEvent> {
  constructor(
    private readonly eventPublisher: RabbitMQEventPublisher,
    private readonly logger: ILogger
  ) {}

  /**
   * Handle StaffRegistered domain event
   */
  async handleStaffRegistered(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling StaffRegistered event', {
        eventId: event.eventId,
        staffId: eventData.staffId
      });

      // 1. Create integration event for staff registration
      const integrationEvent = new StaffRegisteredIntegrationEvent({
        staffId: eventData.staffId,
        userId: eventData.userId,
        staffType: eventData.staffType,
        fullName: eventData.fullName,
        department: eventData.department,
        specialization: eventData.specialization,
        licenseNumber: eventData.licenseNumber,
        registrationDate: new Date()
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent as any);

      // 3. Notify Identity Service
      const identityNotificationEvent = {
        eventId: `identity-staff-registered-${Date.now()}`,
        eventType: 'identity.staff-registered',
        aggregateId: eventData.userId,
        aggregateType: 'User',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          userId: eventData.userId,
          staffId: eventData.staffId,
          staffType: eventData.staffType,
          registrationComplete: true
        }
      };
      await this.eventPublisher.publish(identityNotificationEvent);

      // 4. Notify Scheduling Service (if doctor)
      if (eventData.staffType === 'doctor') {
        const schedulingNotificationEvent = {
          eventId: `scheduling-doctor-registered-${Date.now()}`,
          eventType: 'scheduling.doctor-registered',
          aggregateId: eventData.staffId,
          aggregateType: 'Doctor',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: eventData.staffId,
            userId: eventData.userId,
            fullName: eventData.fullName,
            department: eventData.department,
            specialization: eventData.specialization,
            requiresScheduleInitialization: true
          }
        };
        await this.eventPublisher.publish(schedulingNotificationEvent);
      }

      // 5. Notify Clinical/EMR Service
      const clinicalNotificationEvent = {
        eventId: `clinical-provider-registered-${Date.now()}`,
        eventType: 'clinical.provider-registered',
        aggregateId: eventData.staffId,
        aggregateType: 'Provider',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: eventData.staffId,
          userId: eventData.userId,
          staffType: eventData.staffType,
          fullName: eventData.fullName,
          specialization: eventData.specialization,
          licenseNumber: eventData.licenseNumber,
          requiresProfileInitialization: true
        }
      };
      await this.eventPublisher.publish(clinicalNotificationEvent);

      this.logger.info('StaffRegistered event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffRegistered event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffUpdated domain event
   */
  async handleStaffUpdated(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();
      const updatedData = eventData.updatedData || {};

      this.logger.info('Handling StaffUpdated event', {
        eventId: event.eventId,
        staffId: eventData.staffId,
        updatedFields: eventData.updatedFields
      });

      // 1. Create integration event
      const integrationEvent = createStaffUpdatedEvent({
        staffId: eventData.staffId,
        userId: updatedData.userId,
        updatedFields: eventData.updatedFields,
        consultationFee: updatedData.consultationFee,
        workSchedule: updatedData.workSchedule,
        status: updatedData.status
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent as any);

      // 3. Notify Scheduling Service if work schedule changed
      if (eventData.updatedFields.includes('workSchedule') && updatedData.workSchedule) {
        const schedulingUpdateEvent = {
          eventId: `scheduling-work-schedule-updated-${Date.now()}`,
          eventType: 'scheduling.work-schedule-updated',
          aggregateId: eventData.staffId,
          aggregateType: 'Doctor',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: eventData.staffId,
            workSchedule: updatedData.workSchedule
          }
        };
        await this.eventPublisher.publish(schedulingUpdateEvent);
      }

      // 4. Notify Billing Service if consultation fee changed
      if (eventData.updatedFields.includes('consultationFee') && updatedData.consultationFee !== undefined) {
        const billingUpdateEvent = {
          eventId: `billing-consultation-fee-updated-${Date.now()}`,
          eventType: 'billing.consultation-fee-updated',
          aggregateId: eventData.staffId,
          aggregateType: 'Provider',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: eventData.staffId,
            consultationFee: updatedData.consultationFee
          }
        };
        await this.eventPublisher.publish(billingUpdateEvent);
      }

      this.logger.info('StaffUpdated event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffUpdated event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle DoctorAvailabilityChanged domain event
   */
  async handleDoctorAvailabilityChanged(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling DoctorAvailabilityChanged event', {
        eventId: event.eventId,
        staffId: eventData.staffId
      });

      // 1. Create integration event
      const integrationEvent = createDoctorAvailabilityChangedEvent({
        staffId: eventData.staffId,
        isAcceptingNewPatients: eventData.isAcceptingNewPatients,
        reason: eventData.reason,
        effectiveDate: eventData.effectiveDate ? new Date(eventData.effectiveDate) : undefined
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent as any);

      // 3. Notify Scheduling Service
      const schedulingNotificationEvent = {
        eventId: `scheduling-doctor-availability-changed-${Date.now()}`,
        eventType: 'scheduling.doctor-availability-changed',
        aggregateId: eventData.staffId,
        aggregateType: 'Doctor',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: eventData.staffId,
          isAcceptingNewPatients: eventData.isAcceptingNewPatients,
          reason: eventData.reason,
          effectiveDate: eventData.effectiveDate
        }
      };
      await this.eventPublisher.publish(schedulingNotificationEvent);

      this.logger.info('DoctorAvailabilityChanged event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle DoctorAvailabilityChanged event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffStatusChanged domain event
   */
  async handleStaffStatusChanged(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling StaffStatusChanged event', {
        eventId: event.eventId,
        staffId: eventData.staffId
      });

      // 1. Create integration event
      const integrationEvent = createStaffStatusChangedEvent({
        staffId: eventData.staffId,
        userId: eventData.userId,
        previousStatus: eventData.previousStatus,
        newStatus: eventData.newStatus,
        reason: eventData.reason,
        changedBy: eventData.changedBy
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent as any);

      this.logger.info('StaffStatusChanged event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffStatusChanged event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffEmploymentStatusUpdated domain event
   */
  async handleStaffEmploymentStatusUpdated(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling StaffEmploymentStatusUpdated event', {
        eventId: event.eventId,
        staffId: eventData.staffId,
        newEmploymentType: eventData.newEmploymentType
      });

      const integrationEvent = {
        eventId: `staff-employment-status-updated-${Date.now()}`,
        eventType: 'provider.staff.employment.updated',
        aggregateId: eventData.staffId,
        aggregateType: 'Staff',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: eventData.staffId,
          oldEmploymentType: eventData.oldEmploymentType,
          newEmploymentType: eventData.newEmploymentType,
          contractEndDate: eventData.contractEndDate,
          updatedBy: eventData.updatedBy
        },
        metadata: {
          source: 'integration',
          priority: 'normal',
          retryable: true,
          complianceLevel: 'hipaa',
          containsPHI: false,
          eventCategory: 'provider_staff',
          eventSubcategory: 'employment_change',
          vietnameseDescription: 'Loại hình lao động của nhân viên thay đổi'
        }
      };

      await this.eventPublisher.publish(integrationEvent as any);

      this.logger.info('StaffEmploymentStatusUpdated event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });
    } catch (error) {
      this.logger.error('Failed to handle StaffEmploymentStatusUpdated event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffCredentialVerified domain event
   */
  async handleStaffCredentialVerified(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling StaffCredentialVerified event', {
        eventId: event.eventId,
        staffId: eventData.staffId
      });

      // Publish integration event to RabbitMQ
      const integrationEvent = {
        eventId: `staff-credential-verified-${Date.now()}`,
        eventType: 'provider.staff.credential-verified',
        aggregateId: eventData.staffId,
        aggregateType: 'Staff',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: eventData.staffId,
          credentialNumber: eventData.credentialNumber,
          issuingAuthority: eventData.issuingAuthority,
          verifiedAt: eventData.occurredAt
        }
      };

      await this.eventPublisher.publish(integrationEvent);

      this.logger.info('StaffCredentialVerified event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffCredentialVerified event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffScheduleUpdated domain event
   */
  async handleStaffScheduleUpdated(event: DomainEvent): Promise<void> {
    try {
      const eventData = event.getEventData();

      this.logger.info('Handling StaffScheduleUpdated event', {
        eventId: event.eventId,
        staffId: eventData.staffId
      });

      // Publish integration event to RabbitMQ
      const integrationEvent = {
        eventId: `staff-schedule-updated-${Date.now()}`,
        eventType: 'provider.staff.schedule-updated',
        aggregateId: eventData.staffId,
        aggregateType: 'Staff',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: eventData.staffId,
          newSchedule: eventData.newSchedule,
          updatedAt: eventData.occurredAt
        }
      };

      await this.eventPublisher.publish(integrationEvent);

      this.logger.info('StaffScheduleUpdated event processed successfully', {
        staffId: eventData.staffId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffScheduleUpdated event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle all domain events
   */
  async handle(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'StaffRegistered':
        await this.handleStaffRegistered(event);
        break;
      case 'StaffUpdated':
        await this.handleStaffUpdated(event);
        break;
      case 'StaffCredentialVerified':
        await this.handleStaffCredentialVerified(event);
        break;
      case 'StaffScheduleUpdated':
        await this.handleStaffScheduleUpdated(event);
        break;
      case 'DoctorAvailabilityChanged':
        await this.handleDoctorAvailabilityChanged(event);
        break;
      case 'StaffStatusChanged':
        await this.handleStaffStatusChanged(event);
        break;
      case 'StaffEmploymentStatusUpdated':
        await this.handleStaffEmploymentStatusUpdated(event);
        break;
      default:
        this.logger.warn('Unknown event type', {
          eventType: event.eventType,
          eventId: event.eventId
        });
    }
  }

  canHandle(event: DomainEvent): boolean {
    return [
      'StaffRegistered',
      'StaffUpdated',
      'StaffCredentialVerified',
      'StaffScheduleUpdated',
      'DoctorAvailabilityChanged',
      'StaffStatusChanged',
      'StaffEmploymentStatusUpdated'
    ].includes(event.eventType);
  }

  getHandlerName(): string {
    return 'RabbitMQStaffEventHandler';
  }
}

