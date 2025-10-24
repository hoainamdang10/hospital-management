/**
 * Department Domain Events
 * Shared events for Department Service integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Inter-Service Communication
 */

import { IntegrationEvent } from './EventBusConfiguration';

/**
 * Department Created Event
 * Published when a new department is created
 */
export interface DepartmentCreatedEvent extends IntegrationEvent {
  eventType: 'department.created';
  eventData: {
    departmentId: string;
    departmentCode: string;
    departmentNameEn: string;
    departmentNameVi: string;
    description?: string;
    isActive: boolean;
    createdBy?: string;
    createdAt: string;
  };
}

/**
 * Department Updated Event
 * Published when department information is updated
 */
export interface DepartmentUpdatedEvent extends IntegrationEvent {
  eventType: 'department.updated';
  eventData: {
    departmentId: string;
    departmentCode: string;
    departmentNameEn: string;
    departmentNameVi: string;
    description?: string;
    isActive: boolean;
    updatedFields: string[];
    previousValues: Record<string, any>;
    newValues: Record<string, any>;
    updatedBy?: string;
    updatedAt: string;
  };
}

/**
 * Department Activated Event
 * Published when a department is activated
 */
export interface DepartmentActivatedEvent extends IntegrationEvent {
  eventType: 'department.activated';
  eventData: {
    departmentId: string;
    departmentCode: string;
    departmentNameEn: string;
    departmentNameVi: string;
    activatedBy?: string;
    activatedAt: string;
  };
}

/**
 * Department Deactivated Event
 * Published when a department is deactivated
 */
export interface DepartmentDeactivatedEvent extends IntegrationEvent {
  eventType: 'department.deactivated';
  eventData: {
    departmentId: string;
    departmentCode: string;
    departmentNameEn: string;
    departmentNameVi: string;
    deactivatedBy?: string;
    deactivatedAt: string;
    reason?: string;
  };
}

/**
 * Department Event Factory
 * Helper methods to create department events
 */
export class DepartmentEventFactory {
  /**
   * Create department created event
   */
  public static createDepartmentCreatedEvent(
    departmentData: any,
    serviceName: string,
    metadata?: any
  ): DepartmentCreatedEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'department.created',
      aggregateId: departmentData.departmentId,
      aggregateType: 'Department',
      serviceName,
      eventVersion: '1.0',
      eventData: departmentData,
      occurredAt: new Date(),
      version: 1,
      priority: 'NORMAL',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create department updated event
   */
  public static createDepartmentUpdatedEvent(
    departmentData: any,
    serviceName: string,
    metadata?: any
  ): DepartmentUpdatedEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'department.updated',
      aggregateId: departmentData.departmentId,
      aggregateType: 'Department',
      serviceName,
      eventVersion: '1.0',
      eventData: departmentData,
      occurredAt: new Date(),
      version: 1,
      priority: 'HIGH',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Create department deactivated event
   */
  public static createDepartmentDeactivatedEvent(
    departmentData: any,
    serviceName: string,
    metadata?: any
  ): DepartmentDeactivatedEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'department.deactivated',
      aggregateId: departmentData.departmentId,
      aggregateType: 'Department',
      serviceName,
      eventVersion: '1.0',
      eventData: departmentData,
      occurredAt: new Date(),
      version: 1,
      priority: 'HIGH',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }
}
