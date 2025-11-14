/**
 * Events Infrastructure - Exports
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Specific exports to avoid conflicts
export { StaffEventConsumer, StaffEventConsumerConfig } from './StaffEventConsumer';
export { DepartmentEventConsumer, DepartmentEventConsumerConfig } from './DepartmentEventConsumer';

// Event data types from StaffEventConsumer
export type {
  StaffAvailabilityChangedEventData,
  StaffShiftAssignedEventData,
  StaffShiftCancelledEventData,
  StaffScheduleUpdatedEventData,
  StaffStatusChangedEventData,
  StaffDepartmentAssignedEventData,
  DepartmentCreatedEventData,
  DepartmentUpdatedEventData,
  DepartmentStaffCountChangedEventData,
  DepartmentCapacityUpdatedEventData
} from './StaffEventConsumer';

// Event data types from DepartmentEventConsumer (avoid conflicts)
export type {
  DepartmentCapacityUpdatedEventData as DeptCapacityUpdatedEventData,
  DepartmentCreatedEventData as DeptCreatedEventData,
  DepartmentStaffAssignedEventData,
  DepartmentResourceUpdatedEventData,
  DepartmentOperationalHoursChangedEventData
} from './DepartmentEventConsumer';

export * from './BillingEventConsumer';
export * from './ClinicalEMREventConsumer';
export * from './EventBusAdapter';
export * from './EventHandlers';
export * from './EventSubscriptions';
