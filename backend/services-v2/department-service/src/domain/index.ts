/**
 * Domain Layer Exports - Department Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

// Entities
export { Department } from './entities/Department';

// Events
export {
  DepartmentCreatedEvent,
  DepartmentUpdatedEvent,
  DepartmentHeadAssignedEvent,
  DepartmentActivatedEvent,
  DepartmentDeactivatedEvent,
  DepartmentStaffCountChangedEvent
} from './events/DepartmentEvents';

// Repositories
export type { IDepartmentRepository } from './repositories/IDepartmentRepository';

// Types
export type { DepartmentProps } from './entities/Department';
export type {
  DepartmentEventData,
  DepartmentUpdatedEventData,
  DepartmentHeadAssignedEventData,
  DepartmentDeactivatedEventData,
  DepartmentStaffCountChangedEventData
} from './events/DepartmentEvents';
