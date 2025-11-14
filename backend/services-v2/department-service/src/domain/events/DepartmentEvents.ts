/**
 * Department Domain Events - Domain Layer
 * Events representing significant occurrences in Department aggregate
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { HealthcareDomainEvent } from '@shared/domain/base/domain-event';

// Base interface for all department events
export interface DepartmentEventData {
  departmentId: string;
  departmentCode: string;
  departmentNameEn: string;
  departmentNameVi: string;
  timestamp: Date;
  triggeredBy?: string;
}

/**
 * Department Created Event
 * Published when a new department is created in the system
 */
export class DepartmentCreatedEvent extends HealthcareDomainEvent<DepartmentEventData> {
  constructor(data: DepartmentEventData) {
    super('department.created', data);
  }

  static create(departmentId: string, departmentCode: string, departmentNameEn: string, departmentNameVi: string, triggeredBy?: string): DepartmentCreatedEvent {
    return new DepartmentCreatedEvent({
      departmentId,
      departmentCode,
      departmentNameEn,
      departmentNameVi,
      timestamp: new Date(),
      triggeredBy,
    });
  }
}

/**
 * Department Updated Event
 * Published when department information is updated
 */
export interface DepartmentUpdatedEventData extends DepartmentEventData {
  updatedFields: string[];
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

export class DepartmentUpdatedEvent extends HealthcareDomainEvent<DepartmentUpdatedEventData> {
  constructor(data: DepartmentUpdatedEventData) {
    super('department.updated', data);
  }

  static create(
    departmentId: string, 
    departmentCode: string, 
    departmentNameEn: string, 
    departmentNameVi: string,
    updatedFields: string[],
    previousValues?: Record<string, any>,
    newValues?: Record<string, any>,
    triggeredBy?: string
  ): DepartmentUpdatedEvent {
    return new DepartmentUpdatedEvent({
      departmentId,
      departmentCode,
      departmentNameEn,
      departmentNameVi,
      timestamp: new Date(),
      updatedFields,
      previousValues,
      newValues,
      triggeredBy,
    });
  }
}

/**
 * Department Activated Event
 * Published when a department is activated
 */
export class DepartmentActivatedEvent extends HealthcareDomainEvent<DepartmentEventData> {
  constructor(data: DepartmentEventData) {
    super('department.activated', data);
  }

  static create(
    departmentId: string,
    departmentCode: string,
    departmentNameEn: string,
    departmentNameVi: string,
    triggeredBy?: string
  ): DepartmentActivatedEvent {
    return new DepartmentActivatedEvent({
      departmentId,
      departmentCode,
      departmentNameEn,
      departmentNameVi,
      timestamp: new Date(),
      triggeredBy,
    });
  }
}

/**
 * Department Deactivated Event
 * Published when a department is deactivated
 */
export interface DepartmentDeactivatedEventData extends DepartmentEventData {
  reason?: string;
  deactivatedAt: Date;
}

export class DepartmentDeactivatedEvent extends HealthcareDomainEvent<DepartmentDeactivatedEventData> {
  constructor(data: DepartmentDeactivatedEventData) {
    super('department.deactivated', data);
  }

  static create(
    departmentId: string,
    departmentCode: string,
    departmentNameEn: string,
    departmentNameVi: string,
    reason?: string,
    triggeredBy?: string
  ): DepartmentDeactivatedEvent {
    return new DepartmentDeactivatedEvent({
      departmentId,
      departmentCode,
      departmentNameEn,
      departmentNameVi,
      timestamp: new Date(),
      reason,
      deactivatedAt: new Date(),
      triggeredBy,
    });
  }
}
