/**
 * IdentityDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from User Aggregate with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { IEventHandler } from '../../../../shared/events/event-handler.interface';
import { UserCreatedEvent } from '../../domain/events/UserCreatedEvent';
import { UserAuthenticatedEvent } from '../../domain/events/UserAuthenticatedEvent';
import { UserRoleChangedEvent } from '../../domain/events/UserRoleChangedEvent';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';

export interface IdentityDomainEventHandlerConfig {
  logger: ILogger;
  auditService: IAuditService;
  eventBus: IEventBus;
}

/**
 * Domain Event Handler for Identity Events
 * Follows pattern from Clinical EMR and Billing services
 */
export class IdentityDomainEventHandler implements IEventHandler<DomainEvent> {
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly eventBus: IEventBus;

  constructor(config: IdentityDomainEventHandlerConfig) {
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.eventBus = config.eventBus;
  }

  /**
   * Handle domain events
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      this.logger.info('Processing identity domain event', {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        eventId: event.eventId
      });

      switch (event.eventType) {
        case 'UserCreated':
          await this.handleUserCreated(event as UserCreatedEvent);
          break;
        
        case 'UserAuthenticated':
          await this.handleUserAuthenticated(event as UserAuthenticatedEvent);
          break;
        
        case 'UserRoleChanged':
          await this.handleUserRoleChanged(event as UserRoleChangedEvent);
          break;
        
        default:
          this.logger.warn('Unknown identity domain event type', {
            eventType: event.eventType,
            eventId: event.eventId
          });
      }

    } catch (error) {
      this.logger.error('Error processing identity domain event', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle UserCreated event
   */
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserCreated event', {
        userId: event.userId,
        email: event.email,
        role: event.role
      });

      // 1. HIPAA audit logging
      await this.auditService.logUserAccess(
        'CREATE',
        event.userId,
        'SYSTEM',
        'User account created',
        {
          email: event.email,
          role: event.role,
          eventId: event.eventId
        }
      );

      // 2. Publish integration event for other services
      const integrationEvent = {
        eventId: `user-created-${Date.now()}`,
        eventType: 'user.created',
        aggregateId: event.userId,
        aggregateType: 'User',
        occurredAt: new Date(),
        serviceName: 'identity-service',
        eventData: {
          userId: event.userId,
          email: event.email,
          role: event.role,
          isActive: true,
          isEmailVerified: false,
          createdAt: event.createdAt
        },
        metadata: {
          priority: 'normal',
          complianceLevel: 'hipaa',
          containsPHI: true,
          eventCategory: 'identity',
          eventSubcategory: 'user_creation',
          vietnameseDescription: 'Tài khoản người dùng mới được tạo'
        }
      };

      await this.eventBus.publish(integrationEvent);

      // 3. Trigger follow-up actions based on role
      if (event.role === 'patient') {
        // Notify patient registry service
        const patientRegistrationEvent = {
          eventId: `patient-registration-${Date.now()}`,
          eventType: 'patient.registration-required',
          aggregateId: event.userId,
          aggregateType: 'Patient',
          occurredAt: new Date(),
          serviceName: 'identity-service',
          eventData: {
            userId: event.userId,
            email: event.email,
            requiresRegistration: true
          }
        };

        await this.eventBus.publish(patientRegistrationEvent);
      }

      if (['doctor', 'nurse', 'technician'].includes(event.role)) {
        // Notify provider staff service
        const providerRegistrationEvent = {
          eventId: `provider-registration-${Date.now()}`,
          eventType: 'provider.registration-required',
          aggregateId: event.userId,
          aggregateType: 'Provider',
          occurredAt: new Date(),
          serviceName: 'identity-service',
          eventData: {
            userId: event.userId,
            email: event.email,
            role: event.role,
            requiresRegistration: true
          }
        };

        await this.eventBus.publish(providerRegistrationEvent);
      }

      this.logger.info('UserCreated event processed successfully', {
        userId: event.userId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error handling UserCreated event', {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle UserAuthenticated event
   */
  private async handleUserAuthenticated(event: UserAuthenticatedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserAuthenticated event', {
        userId: event.userId,
        sessionId: event.sessionId,
        ipAddress: event.ipAddress
      });

      // 1. HIPAA audit logging
      await this.auditService.logUserAccess(
        'LOGIN',
        event.userId,
        event.userId,
        'User authenticated successfully',
        {
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          eventId: event.eventId
        }
      );

      // 2. Publish integration event for other services
      const integrationEvent = {
        eventId: `user-authenticated-${Date.now()}`,
        eventType: 'user.authenticated',
        aggregateId: event.userId,
        aggregateType: 'User',
        occurredAt: new Date(),
        serviceName: 'identity-service',
        eventData: {
          userId: event.userId,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          authenticatedAt: event.authenticatedAt
        },
        metadata: {
          priority: 'normal',
          complianceLevel: 'hipaa',
          containsPHI: false,
          eventCategory: 'identity',
          eventSubcategory: 'user_authentication',
          vietnameseDescription: 'Người dùng đăng nhập thành công'
        }
      };

      await this.eventBus.publish(integrationEvent);

      // 3. Check for suspicious activity
      if (await this.isSuspiciousLogin(event)) {
        const securityAlertEvent = {
          eventId: `security-alert-${Date.now()}`,
          eventType: 'security.suspicious-login',
          aggregateId: event.userId,
          aggregateType: 'SecurityAlert',
          occurredAt: new Date(),
          serviceName: 'identity-service',
          eventData: {
            userId: event.userId,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            alertType: 'suspicious_login',
            severity: 'medium'
          },
          metadata: {
            priority: 'high',
            eventCategory: 'security',
            eventSubcategory: 'suspicious_activity'
          }
        };

        await this.eventBus.publish(securityAlertEvent);
      }

      this.logger.info('UserAuthenticated event processed successfully', {
        userId: event.userId,
        sessionId: event.sessionId,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error handling UserAuthenticated event', {
        userId: event.userId,
        sessionId: event.sessionId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle UserRoleChanged event
   */
  private async handleUserRoleChanged(event: UserRoleChangedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserRoleChanged event', {
        userId: event.userId,
        oldRole: event.oldRole,
        newRole: event.newRole,
        changedBy: event.changedBy
      });

      // 1. HIPAA audit logging
      await this.auditService.logUserAccess(
        'ROLE_CHANGE',
        event.userId,
        event.changedBy,
        'User role changed',
        {
          oldRole: event.oldRole,
          newRole: event.newRole,
          changeReason: event.changeReason,
          eventId: event.eventId
        }
      );

      // 2. Publish integration event
      const integrationEvent = {
        eventId: `user-role-changed-${Date.now()}`,
        eventType: 'user.role-changed',
        aggregateId: event.userId,
        aggregateType: 'User',
        occurredAt: new Date(),
        serviceName: 'identity-service',
        eventData: {
          userId: event.userId,
          oldRole: event.oldRole,
          newRole: event.newRole,
          changedBy: event.changedBy,
          changeReason: event.changeReason,
          changedAt: event.changedAt
        },
        metadata: {
          priority: 'high',
          complianceLevel: 'hipaa',
          eventCategory: 'identity',
          eventSubcategory: 'role_change',
          vietnameseDescription: 'Vai trò người dùng được thay đổi'
        }
      };

      await this.eventBus.publish(integrationEvent);

      // 3. Invalidate existing sessions if role change affects permissions
      if (this.isSignificantRoleChange(event.oldRole, event.newRole)) {
        const sessionInvalidationEvent = {
          eventId: `session-invalidation-${Date.now()}`,
          eventType: 'user.sessions-invalidated',
          aggregateId: event.userId,
          aggregateType: 'User',
          occurredAt: new Date(),
          serviceName: 'identity-service',
          eventData: {
            userId: event.userId,
            reason: 'role_change',
            invalidatedBy: event.changedBy
          }
        };

        await this.eventBus.publish(sessionInvalidationEvent);
      }

      this.logger.info('UserRoleChanged event processed successfully', {
        userId: event.userId,
        oldRole: event.oldRole,
        newRole: event.newRole,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Error handling UserRoleChanged event', {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Check if login is suspicious
   */
  private async isSuspiciousLogin(event: UserAuthenticatedEvent): Promise<boolean> {
    try {
      // Check for unusual IP address patterns
      const isUnusualIP = await this.isUnusualIPAddress(event.userId, event.ipAddress);
      
      // Check for unusual user agent
      const isUnusualUserAgent = this.isUnusualUserAgent(event.userAgent);
      
      // Check for rapid successive logins
      const isRapidLogin = await this.isRapidSuccessiveLogin(event.userId);

      return isUnusualIP || isUnusualUserAgent || isRapidLogin;

    } catch (error) {
      this.logger.error('Error checking suspicious login', {
        userId: event.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Check if IP address is unusual for user
   */
  private async isUnusualIPAddress(userId: string, ipAddress: string): Promise<boolean> {
    // In a real implementation, this would check against user's login history
    // For now, return false
    return false;
  }

  /**
   * Check if user agent is unusual
   */
  private isUnusualUserAgent(userAgent: string): boolean {
    // Check for bot patterns
    const botPatterns = [
      /bot/i, /crawler/i, /spider/i, /scraper/i,
      /curl/i, /wget/i, /python/i, /java/i
    ];

    return botPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Check for rapid successive logins
   */
  private async isRapidSuccessiveLogin(userId: string): Promise<boolean> {
    // In a real implementation, this would check recent login timestamps
    // For now, return false
    return false;
  }

  /**
   * Check if role change is significant enough to invalidate sessions
   */
  private isSignificantRoleChange(oldRole: string, newRole: string): boolean {
    // Define role hierarchy
    const roleHierarchy = {
      'patient': 1,
      'receptionist': 2,
      'technician': 3,
      'nurse': 4,
      'doctor': 5,
      'admin': 6
    };

    const oldLevel = roleHierarchy[oldRole] || 0;
    const newLevel = roleHierarchy[newRole] || 0;

    // Significant if changing to/from admin or crossing major boundaries
    return oldRole === 'admin' || newRole === 'admin' || Math.abs(oldLevel - newLevel) > 2;
  }

  /**
   * Check if handler can handle the event type
   */
  canHandle(eventType: string): boolean {
    return ['UserCreated', 'UserAuthenticated', 'UserRoleChanged'].includes(eventType);
  }

  /**
   * Get handler status
   */
  getStatus(): any {
    return {
      handlerName: 'IdentityDomainEventHandler',
      supportedEvents: ['UserCreated', 'UserAuthenticated', 'UserRoleChanged'],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString()
    };
  }
}
