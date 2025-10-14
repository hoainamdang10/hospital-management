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
import {
  createStaffRegisteredEvent,
  createStaffUpdatedEvent,
  createDoctorAvailabilityChangedEvent,
  createStaffStatusChangedEvent,
  createStaffCredentialAddedEvent,
  createStaffDepartmentAssignedEvent
} from './IntegrationEvents';

/**
 * RabbitMQ Staff Event Handler
 * Subscribes to domain events and publishes integration events
 */
export class RabbitMQStaffEventHandler {
  constructor(
    private readonly eventPublisher: RabbitMQEventPublisher,
    private readonly logger: ILogger
  ) {}

  /**
   * Handle StaffRegistered domain event
   */
  async handleStaffRegistered(event: DomainEvent): Promise<void> {
    try {
      this.logger.info('Handling StaffRegistered event', {
        eventId: event.eventId,
        staffId: event.data.staffId
      });

      // 1. Create integration event
      const integrationEvent = createStaffRegisteredEvent({
        staffId: event.data.staffId,
        userId: event.data.userId,
        staffType: event.data.staffType,
        fullName: event.data.fullName,
        department: event.data.department,
        specialization: event.data.specialization,
        licenseNumber: event.data.licenseNumber,
        registrationDate: new Date(event.data.registrationDate)
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent);

      // 3. Notify Identity Service
      const identityNotificationEvent = {
        eventId: `identity-staff-registered-${Date.now()}`,
        eventType: 'identity.staff-registered',
        aggregateId: event.data.userId,
        aggregateType: 'User',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          userId: event.data.userId,
          staffId: event.data.staffId,
          staffType: event.data.staffType,
          registrationComplete: true
        }
      };
      await this.eventPublisher.publish(identityNotificationEvent);

      // 4. Notify Scheduling Service (if doctor)
      if (event.data.staffType === 'doctor') {
        const schedulingNotificationEvent = {
          eventId: `scheduling-doctor-registered-${Date.now()}`,
          eventType: 'scheduling.doctor-registered',
          aggregateId: event.data.staffId,
          aggregateType: 'Doctor',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: event.data.staffId,
            userId: event.data.userId,
            fullName: event.data.fullName,
            department: event.data.department,
            specialization: event.data.specialization,
            requiresScheduleInitialization: true
          }
        };
        await this.eventPublisher.publish(schedulingNotificationEvent);
      }

      // 5. Notify Clinical/EMR Service
      const clinicalNotificationEvent = {
        eventId: `clinical-provider-registered-${Date.now()}`,
        eventType: 'clinical.provider-registered',
        aggregateId: event.data.staffId,
        aggregateType: 'Provider',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: event.data.staffId,
          userId: event.data.userId,
          staffType: event.data.staffType,
          fullName: event.data.fullName,
          specialization: event.data.specialization,
          licenseNumber: event.data.licenseNumber,
          requiresProfileInitialization: true
        }
      };
      await this.eventPublisher.publish(clinicalNotificationEvent);

      this.logger.info('StaffRegistered event processed successfully', {
        staffId: event.data.staffId,
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
      this.logger.info('Handling StaffUpdated event', {
        eventId: event.eventId,
        staffId: event.data.staffId
      });

      // 1. Create integration event
      const integrationEvent = createStaffUpdatedEvent({
        staffId: event.data.staffId,
        userId: event.data.userId,
        updatedFields: event.data.updatedFields,
        consultationFee: event.data.consultationFee,
        workSchedule: event.data.workSchedule,
        status: event.data.status
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent);

      // 3. Notify Scheduling Service if work schedule changed
      if (event.data.updatedFields.includes('workSchedule')) {
        const schedulingUpdateEvent = {
          eventId: `scheduling-work-schedule-updated-${Date.now()}`,
          eventType: 'scheduling.work-schedule-updated',
          aggregateId: event.data.staffId,
          aggregateType: 'Doctor',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: event.data.staffId,
            workSchedule: event.data.workSchedule
          }
        };
        await this.eventPublisher.publish(schedulingUpdateEvent);
      }

      // 4. Notify Billing Service if consultation fee changed
      if (event.data.updatedFields.includes('consultationFee')) {
        const billingUpdateEvent = {
          eventId: `billing-consultation-fee-updated-${Date.now()}`,
          eventType: 'billing.consultation-fee-updated',
          aggregateId: event.data.staffId,
          aggregateType: 'Provider',
          occurredAt: new Date(),
          serviceName: 'provider-staff-service',
          eventData: {
            staffId: event.data.staffId,
            consultationFee: event.data.consultationFee
          }
        };
        await this.eventPublisher.publish(billingUpdateEvent);
      }

      this.logger.info('StaffUpdated event processed successfully', {
        staffId: event.data.staffId,
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
      this.logger.info('Handling DoctorAvailabilityChanged event', {
        eventId: event.eventId,
        staffId: event.data.staffId
      });

      // 1. Create integration event
      const integrationEvent = createDoctorAvailabilityChangedEvent({
        staffId: event.data.staffId,
        isAcceptingNewPatients: event.data.isAcceptingNewPatients,
        reason: event.data.reason,
        effectiveDate: event.data.effectiveDate ? new Date(event.data.effectiveDate) : undefined
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent);

      // 3. Notify Scheduling Service
      const schedulingNotificationEvent = {
        eventId: `scheduling-doctor-availability-changed-${Date.now()}`,
        eventType: 'scheduling.doctor-availability-changed',
        aggregateId: event.data.staffId,
        aggregateType: 'Doctor',
        occurredAt: new Date(),
        serviceName: 'provider-staff-service',
        eventData: {
          staffId: event.data.staffId,
          isAcceptingNewPatients: event.data.isAcceptingNewPatients,
          reason: event.data.reason,
          effectiveDate: event.data.effectiveDate
        }
      };
      await this.eventPublisher.publish(schedulingNotificationEvent);

      this.logger.info('DoctorAvailabilityChanged event processed successfully', {
        staffId: event.data.staffId,
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
      this.logger.info('Handling StaffStatusChanged event', {
        eventId: event.eventId,
        staffId: event.data.staffId
      });

      // 1. Create integration event
      const integrationEvent = createStaffStatusChangedEvent({
        staffId: event.data.staffId,
        userId: event.data.userId,
        previousStatus: event.data.previousStatus,
        newStatus: event.data.newStatus,
        reason: event.data.reason,
        changedBy: event.data.changedBy
      });

      // 2. Publish to RabbitMQ
      await this.eventPublisher.publish(integrationEvent);

      this.logger.info('StaffStatusChanged event processed successfully', {
        staffId: event.data.staffId,
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
      case 'DoctorAvailabilityChanged':
        await this.handleDoctorAvailabilityChanged(event);
        break;
      case 'StaffStatusChanged':
        await this.handleStaffStatusChanged(event);
        break;
      default:
        this.logger.warn('Unknown event type', {
          eventType: event.eventType,
          eventId: event.eventId
        });
    }
  }
}

