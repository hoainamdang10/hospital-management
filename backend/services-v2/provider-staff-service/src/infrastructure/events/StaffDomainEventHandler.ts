/**
 * StaffDomainEventHandler - Infrastructure Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles provider staff domain events with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards, HIPAA
 */

import { IDomainEventHandler } from "@shared/events/domain-event-handler.interface";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { IEventBus } from "@shared/events/event-bus.interface";
import { ILogger } from "../../application/interfaces/ILogger";
import { IAuditService } from "../../application/interfaces/IAuditService";

// Domain Events
import { StaffRegisteredEvent } from "../../domain/events/StaffRegisteredEvent";
// import { StaffCredentialVerifiedEvent } from '../../domain/events/StaffCredentialVerifiedEvent'; // Removed in scope reduction
import { StaffScheduleUpdatedEvent } from "../../domain/events/StaffScheduleUpdatedEvent";
import { StaffStatusChangedEvent } from "../../domain/events/StaffStatusChangedEvent";
// import { StaffEmploymentStatusUpdatedEvent } from '../../domain/events/StaffEmploymentStatusUpdatedEvent'; // Removed in scope reduction
import { StaffUpdatedEvent } from "../../domain/events/StaffUpdatedEvent";
// import { StaffSpecializationAddedEvent } from '../../domain/events/StaffSpecializationAddedEvent'; // Removed in scope reduction
import { StaffDepartmentAssignedEvent } from "../../domain/events/StaffDepartmentAssignedEvent";

// Integration Events
interface StaffRegisteredIntegrationEvent {
  eventId: string;
  eventType: "StaffRegistered";
  aggregateId: string;
  aggregateType: "ProviderStaff";
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
    workSchedule: {
      workingDays: string[];
      workingHours: {
        start: string;
        end: string;
      };
      timeZone: string;
      isFlexible: boolean;
    };
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

// Removed in scope reduction - credential verification is deferred to Phase 2
// interface StaffCredentialVerifiedIntegrationEvent {
//   eventId: string;
//   eventType: 'StaffCredentialVerified';
//   aggregateId: string;
//   aggregateType: 'ProviderStaff';
//   version: number;
//   timestamp: Date;
//   data: {
//     staffId: string;
//     credentialNumber: string;
//     credentialType: string;
//     issuingAuthority: string;
//     verificationDate: string;
//   };
//   metadata: {
//     serviceName: string;
//     version: string;
//     correlationId?: string;
//     causationId?: string;
//   };
// }

interface StaffScheduleUpdatedIntegrationEvent {
  eventId: string;
  eventType: "StaffScheduleUpdated";
  aggregateId: string;
  aggregateType: "ProviderStaff";
  version: number;
  timestamp: Date;
  routingKey?: string; // Override routing key for cross-service compatibility
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
      this.logger.info("Processing staff domain event", {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        eventId: event.eventId,
        timestamp: (event as any).timestamp || new Date(),
      });

      switch (event.eventType) {
        case "StaffRegistered":
          await this.handleStaffRegistered(event as StaffRegisteredEvent);
          break;

        // Removed in scope reduction
        // case 'StaffCredentialVerified':
        //   await this.handleStaffCredentialVerified(event as StaffCredentialVerifiedEvent);
        //   break;

        case "StaffScheduleUpdated":
          await this.handleStaffScheduleUpdated(
            event as StaffScheduleUpdatedEvent,
          );
          break;

        case "StaffStatusChanged":
          await this.handleStaffStatusChanged(event as StaffStatusChangedEvent);
          break;

        // Removed in scope reduction
        // case 'StaffEmploymentStatusUpdated':
        //   await this.handleStaffEmploymentStatusUpdated(event as StaffEmploymentStatusUpdatedEvent);
        //   break;

        case "StaffUpdated":
          await this.handleStaffUpdated(event as StaffUpdatedEvent);
          break;

        // Removed in scope reduction
        // case 'StaffSpecializationAdded':
        //   await this.handleStaffSpecializationAdded(event as StaffSpecializationAddedEvent);
        //   break;

        case "StaffDepartmentAssigned":
          await this.handleStaffDepartmentAssigned(
            event as StaffDepartmentAssignedEvent,
          );
          break;

        default:
          this.logger.warn("Unknown staff domain event type", {
            eventType: event.eventType,
            eventId: event.eventId,
          });
      }

      // HIPAA audit logging
      await this.auditDomainEventProcessing(event);

      this.logger.info("Staff domain event processed successfully", {
        eventType: event.eventType,
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error("Error processing staff domain event", {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle StaffRegistered event
   */
  private async handleStaffRegistered(
    event: StaffRegisteredEvent,
  ): Promise<void> {
    this.logger.info("Handling StaffRegistered event", {
      staffId: event.staffId.value,
      userId: event.userId,
      staffType: event.staffType,
    });

    // Create integration event
    const integrationEvent: StaffRegisteredIntegrationEvent = {
      eventId: this.generateEventId(),
      eventType: "StaffRegistered",
      aggregateId: event.staffId.value,
      aggregateType: "ProviderStaff",
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        userId: event.userId,
        staffType: event.staffType,
        personalInfo: {
          fullName: event.personalInfo.fullName,
          phoneNumber: event.personalInfo.phoneNumber,
          email: event.personalInfo.email,
        },
        professionalInfo: {
          title: event.professionalInfo.title,
          department: event.professionalInfo.department,
          position: event.professionalInfo.position,
        },
        licenseNumber: this.maskSensitiveData(event.licenseNumber),
        employmentType: event.employmentType,
        hireDate: event.hireDate.toISOString(),
        workSchedule: event.workSchedule.toPersistence(),
        isActive: true,
        vietnameseHealthcareCompliant:
          event.personalInfo.isVietnameseCompliant(),
        hipaaCompliant: event.personalInfo.isHIPAACompliant(),
      },
      metadata: {
        serviceName: "provider-staff-service",
        version: "2.0.0",
        correlationId: event.correlationId,
        causationId: event.eventId,
      },
    };

    // Publish integration event
    await this.eventBus.publish(integrationEvent as any);

    this.logger.info("StaffRegistered integration event published", {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId,
    });
  }

  // Removed in scope reduction
  // /**
  //  * Handle StaffCredentialVerified event
  //  */
  // private async handleStaffCredentialVerified(event: StaffCredentialVerifiedEvent): Promise<void> {
  //   this.logger.info('Handling StaffCredentialVerified event', {
  //     staffId: event.staffId.value,
  //     credentialNumber: this.maskSensitiveData(event.credentialNumber)
  //   });

  //   // Create integration event
  //   const integrationEvent: StaffCredentialVerifiedIntegrationEvent = {
  //     eventId: this.generateEventId(),
  //     eventType: 'StaffCredentialVerified',
  //     aggregateId: event.staffId.value,
  //     aggregateType: 'ProviderStaff',
  //     version: 1,
  //     timestamp: new Date(),
  //     data: {
  //       staffId: event.staffId.value,
  //       credentialNumber: this.maskSensitiveData(event.credentialNumber),
  //       credentialType: event.credentialType,
  //       issuingAuthority: event.issuingAuthority,
  //       verificationDate: new Date().toISOString()
  //     },
  //     metadata: {
  //       serviceName: 'provider-staff-service',
  //       version: '2.0.0',
  //       correlationId: event.correlationId,
  //       causationId: event.eventId
  //     }
  //   };

  //   // Publish integration event
  //   await this.eventBus.publish(integrationEvent as any);

  //   this.logger.info('StaffCredentialVerified integration event published', {
  //     staffId: event.staffId.value,
  //     integrationEventId: integrationEvent.eventId
  //   });
  // }

  /**
   * Handle StaffScheduleUpdated event
   */
  private async handleStaffScheduleUpdated(
    event: StaffScheduleUpdatedEvent,
  ): Promise<void> {
    this.logger.info("Handling StaffScheduleUpdated event", {
      staffId: event.staffId.value,
    });

    // Create integration event
    const integrationEvent: StaffScheduleUpdatedIntegrationEvent = {
      eventId: this.generateEventId(),
      eventType: "StaffScheduleUpdated",
      aggregateId: event.staffId.value,
      aggregateType: "ProviderStaff",
      version: 1,
      timestamp: new Date(),
      routingKey: "provider.schedule.updated", // Override for Appointments Service compatibility
      data: {
        staffId: event.staffId.value,
        workSchedule: event.newSchedule.toPersistence(),
        effectiveDate: new Date().toISOString(),
      },
      metadata: {
        serviceName: "provider-staff-service",
        version: "2.0.0",
        correlationId: event.correlationId,
        causationId: event.eventId,
      },
    };

    // Publish integration event
    await this.eventBus.publish(integrationEvent as any);

    this.logger.info("StaffScheduleUpdated integration event published", {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId,
    });
  }

  /**
   * Handle StaffStatusChanged event
   */
  private async handleStaffStatusChanged(
    event: StaffStatusChangedEvent,
  ): Promise<void> {
    this.logger.info("Handling StaffStatusChanged event", {
      staffId: event.staffId,
      oldStatus: event.oldStatus,
      newStatus: event.newStatus,
    });

    const integrationEvent = {
      eventId: this.generateEventId(),
      eventType: "StaffStatusChanged",
      aggregateId: event.staffId,
      aggregateType: "ProviderStaff",
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
        reason: event.reason,
        changedBy: event.changedBy,
        statusChangedAt: new Date().toISOString(),
      },
      metadata: {
        serviceName: "provider-staff-service",
        version: "2.0.0",
        correlationId: event.correlationId,
        causationId: event.eventId,
      },
    };

    await this.eventBus.publish(integrationEvent as any);

    this.logger.info("StaffStatusChanged integration event published", {
      staffId: event.staffId,
      integrationEventId: integrationEvent.eventId,
    });
  }

  // Removed in scope reduction
  // /**
  //  * Handle StaffEmploymentStatusUpdated event
  //  */
  // private async handleStaffEmploymentStatusUpdated(event: StaffEmploymentStatusUpdatedEvent): Promise<void> {
  //   this.logger.info('Handling StaffEmploymentStatusUpdated event', {
  //     staffId: event.staffId,
  //     oldEmploymentType: event.oldEmploymentType,
  //     newEmploymentType: event.newEmploymentType
  //   });

  //   const integrationEvent = {
  //     eventId: this.generateEventId(),
  //     eventType: 'StaffEmploymentStatusUpdated',
  //     aggregateId: event.staffId,
  //     aggregateType: 'ProviderStaff',
  //     version: 1,
  //     timestamp: new Date(),
  //     data: {
  //       staffId: event.staffId,
  //       oldEmploymentType: event.oldEmploymentType,
  //       newEmploymentType: event.newEmploymentType,
  //       contractEndDate: event.contractEndDate?.toISOString(),
  //       updatedBy: event.updatedBy,
  //       updatedAt: new Date().toISOString()
  //     },
  //     metadata: {
  //       serviceName: 'provider-staff-service',
  //       version: '2.0.0',
  //       correlationId: event.correlationId,
  //       causationId: event.eventId
  //     }
  //   };

  //   await this.eventBus.publish(integrationEvent as any);

  //   this.logger.info('StaffEmploymentStatusUpdated integration event published', {
  //     staffId: event.staffId,
  //     integrationEventId: integrationEvent.eventId
  //   });
  // }

  /**
   * Handle StaffUpdated event
   */
  private async handleStaffUpdated(event: StaffUpdatedEvent): Promise<void> {
    this.logger.info("Handling StaffUpdated event", {
      staffId: event.staffId.value,
      updatedFields: event.updatedFields,
    });

    const integrationEvent = {
      eventId: this.generateEventId(),
      eventType: "StaffUpdated",
      aggregateId: event.staffId.value,
      aggregateType: "ProviderStaff",
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        updatedFields: event.updatedFields,
        updatedData: this.sanitizeUpdatedData(event.updatedData),
        updatedAt: new Date().toISOString(),
      },
      metadata: {
        serviceName: "provider-staff-service",
        version: "2.0.0",
        correlationId: event.correlationId,
        causationId: event.eventId,
      },
    };

    await this.eventBus.publish(integrationEvent as any);

    this.logger.info("StaffUpdated integration event published", {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId,
    });
  }

  /**
   * Sanitize updated data to remove sensitive information
   */
  private sanitizeUpdatedData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };

    // Only redact truly sensitive root-level secrets (e.g., password)
    if (sanitized.password) {
      sanitized.password = "***REDACTED***";
    }

    return sanitized;
  }

  /**
   * Check if handler can handle event type
   */
  canHandle(eventType: string): boolean {
    const supportedEvents = [
      "StaffRegistered",
      "StaffCredentialVerified",
      "StaffScheduleUpdated",
      "StaffStatusChanged",
      "StaffEmploymentStatusUpdated",
      "StaffUpdated",
    ];

    return supportedEvents.includes(eventType);
  }

  /**
   * Get handler information
   */
  getHandlerInfo(): any {
    return {
      handlerName: "StaffDomainEventHandler",
      serviceName: "provider-staff-service",
      version: "2.0.0",
      supportedEvents: [
        "StaffRegistered",
        "StaffCredentialVerified",
        "StaffScheduleUpdated",
        "StaffStatusChanged",
        "StaffEmploymentStatusUpdated",
        "StaffUpdated",
      ],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString(),
    };
  }

  /**
   * HIPAA audit logging for domain event processing
   */
  private async auditDomainEventProcessing(event: DomainEvent): Promise<void> {
    await this.auditService.logDataAccess({
      action: "DOMAIN_EVENT_PROCESSED",
      resourceType: "provider_staff_event",
      resourceId: event.aggregateId,
      userId: "system",
      timestamp: new Date(),
      details: {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateType: "ProviderStaff",
        operation: "domain_event_processing",
        serviceName: "provider-staff-service",
        complianceLevel: "hipaa",
      },
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
    if (!data || data.length <= 4) return "***";
    return data.substring(0, 4) + "*".repeat(data.length - 4);
  }

  /**
   * Health check for event handler
   */
  async isHealthy(): Promise<boolean> {
    try {
      // Check if all dependencies are available
      const dependencies = [this.logger, this.auditService, this.eventBus];
      const allDependenciesAvailable = dependencies.every(
        (dep) => dep !== null && dep !== undefined,
      );

      if (!allDependenciesAvailable) {
        this.logger.error(
          "StaffDomainEventHandler health check failed - missing dependencies",
        );
        return false;
      }

      this.logger.info("StaffDomainEventHandler health check passed");
      return true;
    } catch (error) {
      this.logger.error("StaffDomainEventHandler health check error", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  // Removed in scope reduction
  // /**
  //  * Handle StaffSpecializationAdded event
  //  */
  // private async handleStaffSpecializationAdded(event: StaffSpecializationAddedEvent): Promise<void> {
  //   this.logger.info('Handling StaffSpecializationAdded event', {
  //     staffId: event.staffId.value,
  //     specialization: event.specialization.name
  //   });

  //   const integrationEvent = {
  //     eventId: this.generateEventId(),
  //     eventType: 'StaffSpecializationAdded',
  //     aggregateId: event.staffId.value,
  //     aggregateType: 'ProviderStaff',
  //     version: 1,
  //     timestamp: new Date(),
  //     data: {
  //       staffId: event.staffId.value,
  //       specialization: {
  //         code: event.specialization.code,
  //         name: event.specialization.name,
  //         description: event.specialization.description
  //       }
  //     },
  //     metadata: {
  //       serviceName: 'provider-staff-service',
  //       version: '2.0.0',
  //       correlationId: event.correlationId,
  //       causationId: event.eventId
  //     }
  //   };

  //   await this.eventBus.publish(integrationEvent as any);

  //   this.logger.info('StaffSpecializationAdded integration event published', {
  //     staffId: event.staffId.value,
  //     integrationEventId: integrationEvent.eventId
  //   });
  // }

  /**
   * Handle StaffDepartmentAssigned event
   */
  private async handleStaffDepartmentAssigned(
    event: StaffDepartmentAssignedEvent,
  ): Promise<void> {
    this.logger.info("Handling StaffDepartmentAssigned event", {
      staffId: event.staffId.value,
      departmentId: event.assignment.departmentId,
    });

    const integrationEvent = {
      eventId: this.generateEventId(),
      eventType: "StaffDepartmentAssigned",
      aggregateId: event.staffId.value,
      aggregateType: "ProviderStaff",
      version: 1,
      timestamp: new Date(),
      data: {
        staffId: event.staffId.value,
        assignment: {
          departmentId: event.assignment.departmentId,
          departmentCode: event.assignment.departmentCode,
          departmentNameEn: event.assignment.departmentNameEn,
          departmentNameVi: event.assignment.departmentNameVi,
          role: event.assignment.role,
          isPrimary: event.assignment.isPrimary,
          startDate: event.assignment.startDate.toISOString(),
        },
      },
      metadata: {
        serviceName: "provider-staff-service",
        version: "2.0.0",
        correlationId: event.correlationId,
        causationId: event.eventId,
      },
    };

    await this.eventBus.publish(integrationEvent as any);

    this.logger.info("StaffDepartmentAssigned integration event published", {
      staffId: event.staffId.value,
      integrationEventId: integrationEvent.eventId,
    });
  }

  /**
   * Get event processing statistics
   */
  getHandlerName(): string {
    return "StaffDomainEventHandler";
  }

  getStatistics(): any {
    return {
      handlerName: "StaffDomainEventHandler",
      supportedEventsCount: 8,
      lastHealthCheck: new Date().toISOString(),
      isHealthy: true,
      processingCapabilities: {
        canHandleStaffRegistered: true,
        canHandleStaffCredentialVerified: true,
        canHandleStaffScheduleUpdated: true,
        canHandleStaffStatusChanged: true,
        canHandleStaffEmploymentStatusUpdated: true,
        canHandleStaffUpdated: true,
        canHandleStaffSpecializationAdded: true,
        canHandleStaffDepartmentAssigned: true,
      },
    };
  }
}
