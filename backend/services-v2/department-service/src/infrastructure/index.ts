/**
 * Infrastructure Layer Exports - Department Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Persistence
export { SupabaseDepartmentRepository } from './persistence/SupabaseDepartmentRepository';

// Cache
export { RedisDepartmentCache } from './cache/RedisDepartmentCache';

// Event System
export { DepartmentEventPublisher } from './events/DepartmentEventPublisher';
export { StaffDepartmentChangeConsumer } from './events/StaffDepartmentChangeConsumer';
export { IdentityRoleChangeConsumer } from './events/IdentityRoleChangeConsumer';

// Types
export type { DepartmentEventPublisherConfig } from './events/DepartmentEventPublisher';
export type {
  StaffDepartmentChangeConsumerConfig,
  StaffDepartmentChangedEventData,
  StaffRoleChangedEventData,
  StaffDepartmentAssignedEventData,
  StaffStatusChangedEventData,
  DepartmentCreatedEventData,
  DepartmentUpdatedEventData
} from './events/StaffDepartmentChangeConsumer';
export type {
  IdentityRoleChangeConsumerConfig,
  UserRoleChangedEventData,
  UserDeactivatedEventData
} from './events/IdentityRoleChangeConsumer';
