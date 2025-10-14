/**
 * StaffDomainEventHandler - Infrastructure Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles provider staff domain events with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards, HIPAA
 */

import { IDomainEventHandler } from '../../../../shared/events/domain-event-handler.interface';
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';

// Domain Events
import { StaffRegisteredEvent } from '../../domain/events/StaffRegisteredEvent';
import { StaffCredentialVerifiedEvent } from '../../domain/events/StaffCredentialVerifiedEvent';
import { StaffScheduleUpdatedEvent } from '../../domain/events/StaffScheduleUpdatedEvent';

// Integration Events
interface StaffRegisteredIntegrationEvent {
  eventId: string;
  eventType: 'StaffRegistered';
  aggregateId: string;
  aggregateType: 'ProviderStaff';
  version: number;
  timestamp: Date;
  data: {
    staffId: string;
    userId: string;
    staffType: string;
    personalInfo: {
      fullName: string;
      phoneNumber: string;
      email?: string;
    };
    professionalInfo: {
      title: string;
      department: string;
      position: string;
    };
    licenseNumber: string;
    employmentType: string;
    hireDate: string;
    isActive: boolean;
    vietnameseHealthcareCompliant: boolean;
    hipaaCompliant: boolean;
  };
  metadata: {
    serviceName: string;
    version: string;
    correlationId?: string;
    causationId?: string;
  };
}

interface StaffCredentialVerifiedIntegrationEvent {
  eventId: string;
  eventType: 'StaffCredentialVerified';
  aggregateId: string;
  aggregateType: 'ProviderStaff';
  version: number;
  timestamp: Date;
  data: {
    staffId: string;
    credentialNumber: string;
    credentialType: string;
    issuingAuthority: string;
    verificationDate: string;
  };
  metadata: {
    serviceName: string;
    version: string;
    correlationId?: string;
    causationId?: string;
  };
}

interface StaffScheduleUpdatedIntegrationEvent {
  eventId: string;
  eventType: 'StaffScheduleUpdated';
  aggregateId: string;
  aggregateType: 'ProviderStaff';
  version: number;
  timestamp: Date;
  data: {
    staffId: string;
    workSchedule: {
      workingDays: string[];
      workingHours: {
        start: string;
        end: string;
      };
      timeZone: string;
      isFlexible: boolean;
    };
    effectiveDate: string;
  };
  metadata: {
    serviceName: string;
    version: string;
    correlationId?: string;
    causationId?: string;
  };
}

export interface StaffDomainEventHandlerConfig {
  logger: ILogger;
  auditService: IAuditService;
  eventBus: IEventBus;
}

/**
 * Staff Domain Event Handler
 * Processes provider staff domain events and publishes integration events
 */
export class StaffDomainEventHandler implements IDomainEventHandler {
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly eventBus: IEventBus;

  constructor(config: StaffDomainEventHandlerConfig) {
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.eventBus = config.eventBus;
  }

  /**
   * Handle domain events
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      this.logger.info('Processing staff domain event', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        eventId: event.eventId,
        timestamp: event.timestamp
      });

      switch (event.eventType) {
        case 'StaffRegistered':
          await this.handleStaffRegistered(event as StaffRegisteredEvent);
          break;
        
        case 'StaffCredentialVerified':
          await this.handleStaffCredentialVerified(event as StaffCredentialVerifiedEvent);
          break;
        
        case 'StaffScheduleUpdated':
          await this.handleStaffScheduleUpdated(event as StaffScheduleUpdatedEvent);
          break;
        
        default:
          this.logger.warn('Unknown staff domain event type', {
            eventType: event.eventType,
            eventId: event.eventId
          });
      }

      // HIPAA audit logging
      await this.auditDomainEventProcessing(event);

      this.logger.info('Staff domain event processed successfully', {
        eventType: event.eventType,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error processing staff domain event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffRegistered event
   */
  private async handleStaffRegistered(event: StaffRegisteredEvent): Promise<void> {
    this.logger.info('Handling StaffRegistered event', {
      staffId: event.staffId.value,
      userId: event.userId,
      staffType: event.staffType
    });

    // Create integration event
    const integrationEvent: StaffRegisteredIntegrationEvent = {
      eventId: this.generateEventId(),
      eventType: 'StaffRegistered',
      aggregateId: event.staffId.value,
      aggregateType: 'ProviderStaff',
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        userId: event.userId,
        staffType: event.staffType,
        personalInfo: {
          fullName: event.personalInfo.fullName,
          phoneNumber: event.personalInfo.phoneNumber,
          email: event.personalInfo.email
        },
        professionalInfo: {
          title: event.professionalInfo.title,
          department: event.professionalInfo.department,
          position: event.professionalInfo.position
        },
        licenseNumber: this.maskSensitiveData(event.licenseNumber),
        employmentType: event.employmentType,
        hireDate: event.hireDate.toISOString(),
        isActive: true,
        vietnameseHealthcareCompliant: event.vietnameseHealthcareCompliant || false,
        hipaaCompliant: event.hipaaCompliant || false
      },
      metadata: {
        serviceName: 'provider-staff-service',
        version: '2.0.0',
        correlationId: event.correlationId,
        causationId: event.eventId
      }
    };

    // Publish integration event
    await this.eventBus.publish(integrationEvent);

    this.logger.info('StaffRegistered integration event published', {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId
    });
  }

  /**
   * Handle StaffCredentialVerified event
   */
  private async handleStaffCredentialVerified(event: StaffCredentialVerifiedEvent): Promise<void> {
    this.logger.info('Handling StaffCredentialVerified event', {
      staffId: event.staffId.value,
      credentialNumber: this.maskSensitiveData(event.credentialNumber)
    });

    // Create integration event
    const integrationEvent: StaffCredentialVerifiedIntegrationEvent = {
      eventId: this.generateEventId(),
      eventType: 'StaffCredentialVerified',
      aggregateId: event.staffId.value,
      aggregateType: 'ProviderStaff',
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        credentialNumber: this.maskSensitiveData(event.credentialNumber),
        credentialType: event.credentialType || 'unknown',
        issuingAuthority: event.issuingAuthority,
        verificationDate: new Date().toISOString()
      },
      metadata: {
        serviceName: 'provider-staff-service',
        version: '2.0.0',
        correlationId: event.correlationId,
        causationId: event.eventId
      }
    };

    // Publish integration event
    await this.eventBus.publish(integrationEvent);

    this.logger.info('StaffCredentialVerified integration event published', {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId
    });
  }

  /**
   * Handle StaffScheduleUpdated event
   */
  private async handleStaffScheduleUpdated(event: StaffScheduleUpdatedEvent): Promise<void> {
    this.logger.info('Handling StaffScheduleUpdated event', {
      staffId: event.staffId.value
    });

    // Create integration event
    const integrationEvent: StaffScheduleUpdatedIntegrationEvent = {
      eventId: this.generateEventId(),
      eventType: 'StaffScheduleUpdated',
      aggregateId: event.staffId.value,
      aggregateType: 'ProviderStaff',
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        workSchedule: {
          workingDays: event.workSchedule.workingDays,
          workingHours: event.workSchedule.workingHours,
          timeZone: event.workSchedule.timeZone,
          isFlexible: event.workSchedule.isFlexible
        },
        effectiveDate: new Date().toISOString()
      },
      metadata: {
        serviceName: 'provider-staff-service',
        version: '2.0.0',
        correlationId: event.correlationId,
        causationId: event.eventId
      }
    };

    // Publish integration event
    await this.eventBus.publish(integrationEvent);

    this.logger.info('StaffScheduleUpdated integration event published', {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId
    });
  }

  /**
   * Check if handler can handle event type
   */
  canHandle(eventType: string): boolean {
    const supportedEvents = [
      'StaffRegistered',
      'StaffCredentialVerified',
      'StaffScheduleUpdated'
    ];
    
    return supportedEvents.includes(eventType);
  }

  /**
   * Get handler information
   */
  getHandlerInfo(): any {
    return {
      handlerName: 'StaffDomainEventHandler',
      serviceName: 'provider-staff-service',
      version: '2.0.0',
      supportedEvents: [
        'StaffRegistered',
        'StaffCredentialVerified',
        'StaffScheduleUpdated'
      ],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString()
    };
  }

  /**
   * HIPAA audit logging for domain event processing
   */
  private async auditDomainEventProcessing(event: DomainEvent): Promise<void> {
    await this.auditService.logDataAccess({
      action: 'DOMAIN_EVENT_PROCESSED',
      resourceType: 'provider_staff_event',
      resourceId: event.aggregateId,
      userId: 'system',
      timestamp: new Date(),
      details: {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateType: 'ProviderStaff',
        operation: 'domain_event_processing',
        serviceName: 'provider-staff-service',
        complianceLevel: 'hipaa'
      }
    });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `staff-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Mask sensitive data for logging and events
   */
  private maskSensitiveData(data: string): string {
    if (!data || data.length <= 4) return '***';
    return data.substring(0, 4) + '*'.repeat(data.length - 4);
  }

  /**
   * Health check for event handler
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Check if all dependencies are available
      const dependencies = [this.logger, this.auditService, this.eventBus];
      const allDependenciesAvailable = dependencies.every(dep => dep !== null && dep !== undefined);

      if (!allDependenciesAvailable) {
        this.logger.error('StaffDomainEventHandler health check failed - missing dependencies');
        return false;
      }

      this.logger.info('StaffDomainEventHandler health check passed');
      return true;

    } catch (error) {
      this.logger.error('StaffDomainEventHandler health check error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get event processing statistics
   */
  getStatistics(): any {
    return {
      handlerName: 'StaffDomainEventHandler',
      supportedEventsCount: 3,
      lastHealthCheck: new Date().toISOString(),
      isHealthy: true,
      processingCapabilities: {
        canHandleStaffRegistered: true,
        canHandleStaffCredentialVerified: true,
        canHandleStaffScheduleUpdated: true
      }
    };
  }
}
