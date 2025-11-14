/**
 * Messaging Infrastructure - Exports
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

export * from './RabbitMQPublisher';
export * from './SystemEventConsumer';
export * from './BillingEventConsumer';

// REMOVED: StaffEventConsumer - Vi phạm nguyên tắc "mù domain"
// REMOVED: DepartmentEventConsumer - Vi phạm nguyên tắc "mù domain"
// Domain services (Provider Staff, Department) phải TỰ GỌI Scheduler API thay vì Scheduler consume domain events
