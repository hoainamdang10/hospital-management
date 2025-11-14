/**
 * Events Infrastructure - Exports
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export * from './RabbitMQEventPublisher';
export * from './RabbitMQStaffEventHandler';
export * from './IntegrationEvents';
// SupabaseEventBus is in messaging folder
// export * from './SupabaseEventBus';
export * from './StaffDomainEventHandler';
export * from './UserCreatedEventHandler';
export * from './UserDeactivatedEventHandler';
export * from './UserRoleChangedEventHandler';
export * from './IdentityEventConsumer';

// New Enhanced Event Consumers
export * from './EnhancedDepartmentEventConsumer';
export * from './ReviewEventConsumer';
// REMOVED: SchedulingEventConsumer - Violates bounded context
// Real-time availability management belongs to Appointment Service

