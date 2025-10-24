/**
 * Integration Events for Provider/Staff Service
 * Events published to RabbitMQ for inter-service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { IntegrationEvent } from '@shared/domain/base/domain-event';

/**
 * Staff Registered Event
 * Published when a new staff member is registered
 *
 * Subscribers:
 * - Scheduling Service: Create doctor schedule
 * - Clinical/EMR Service: Initialize provider profile
 * - Notifications Service: Send welcome email
 */
export class StaffRegisteredIntegrationEvent extends IntegrationEvent {
  constructor(data: {
    staffId: string;
    userId: string;
    staffType: 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'receptionist' | 'admin';
    fullName: string;
    department?: string;
    specialization?: string;
    licenseNumber?: string;
    registrationDate: Date;
  }) {
    super(
      'provider.staff.registered',
      'provider-staff-service',
      data.staffId,
      'Staff',
      {
        staffId: data.staffId,
        userId: data.userId,
        staffType: data.staffType,
        fullName: data.fullName,
        department: data.department,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        registrationDate: data.registrationDate.toISOString()
      },
      undefined,
      undefined,
      data.userId
    );
  }

  public override getEventData(): any {
    return {
      staffId: this.aggregateId,
      userId: this.userId,
      fullName: (this as any).fullName,
      email: (this as any).email,
      phoneNumber: (this as any).phoneNumber,
      department: (this as any).department,
      specialization: (this as any).specialization,
      licenseNumber: (this as any).licenseNumber,
      registrationDate: (this as any).registrationDate
    };
  }

  public override containsPHI(): boolean {
    return false;
  }

  public override getPatientId(): string | null {
    return null;
  }
}

/**
 * Staff Updated Event
 * Published when staff information is updated
 * 
 * Subscribers:
 * - Scheduling Service: Update doctor availability
 * - Billing Service: Update consultation fee
 * - Clinical/EMR Service: Update provider profile
 */
export function createStaffUpdatedEvent(data: {
  staffId: string;
  userId: string;
  updatedFields: string[];
  consultationFee?: number;
  workSchedule?: any;
  status?: string;
}): IntegrationEvent {
  return {
    eventId: `staff-updated-${Date.now()}`,
    eventType: 'provider.staff.updated',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    eventData: {
      staffId: data.staffId,
      userId: data.userId,
      updatedFields: data.updatedFields,
      consultationFee: data.consultationFee,
      workSchedule: data.workSchedule,
      status: data.status
    },
    metadata: {
      source: 'integration',
      priority: 'normal',
      retryable: true,
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'staff_update',
      vietnameseDescription: 'Thông tin nhân viên y tế được cập nhật'
    }
  } as any;
}

/**
 * Doctor Availability Changed Event
 * Published when doctor's availability status changes
 * 
 * Subscribers:
 * - Scheduling Service: Block/unblock new appointments
 * - Notifications Service: Notify patients
 */
export function createDoctorAvailabilityChangedEvent(data: {
  staffId: string;
  isAcceptingNewPatients: boolean;
  reason?: string;
  effectiveDate?: Date;
}): IntegrationEvent {
  return {
    eventId: `doctor-availability-changed-${Date.now()}`,
    eventType: 'provider.doctor.availability.changed',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    eventData: {
      staffId: data.staffId,
      isAcceptingNewPatients: data.isAcceptingNewPatients,
      reason: data.reason,
      effectiveDate: data.effectiveDate?.toISOString()
    },
    metadata: {
      source: 'integration',
      priority: 'high',
      retryable: true,
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'availability_change',
      vietnameseDescription: 'Trạng thái nhận bệnh nhân của bác sĩ thay đổi'
    }
  } as any;
}

/**
 * Staff Status Changed Event
 * Published when staff status changes (active, inactive, suspended)
 * 
 * Subscribers:
 * - Scheduling Service: Cancel future appointments
 * - Identity Service: Update user status
 * - Notifications Service: Notify relevant parties
 */
export function createStaffStatusChangedEvent(data: {
  staffId: string;
  userId: string;
  previousStatus: string;
  newStatus: string;
  reason?: string;
  changedBy: string;
}): IntegrationEvent {
  return {
    eventId: `staff-status-changed-${Date.now()}`,
    eventType: 'provider.staff.status.changed',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    eventData: {
      staffId: data.staffId,
      userId: data.userId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
      changedBy: data.changedBy
    },
    metadata: {
      source: 'integration',
      priority: 'high',
      retryable: true,
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'status_change',
      vietnameseDescription: 'Trạng thái nhân viên y tế thay đổi'
    }
  } as any;
}

/**
 * Staff Credential Added Event
 * Published when new credential/certification is added
 *
 * Subscribers:
 * - Clinical/EMR Service: Update provider qualifications
 * - Compliance Service: Track certifications
 */
export class StaffCredentialVerifiedIntegrationEvent extends IntegrationEvent {
  constructor(data: {
    staffId: string;
    credentialType: string;
    credentialNumber: string;
    issuedBy: string;
    issuedDate: Date;
    expiryDate?: Date;
  }) {
    super(
      'provider.staff.credential.added',
      'provider-staff-service',
      data.staffId,
      'Staff',
      {
        staffId: data.staffId,
        credentialType: data.credentialType,
        credentialNumber: data.credentialNumber,
        issuedBy: data.issuedBy,
        issuedDate: data.issuedDate.toISOString(),
        expiryDate: data.expiryDate?.toISOString()
      },
      undefined,
      undefined,
      undefined
    );
  }

  public override getEventData(): any {
    return {
      staffId: this.aggregateId,
      credentialType: (this as any).credentialType,
      credentialNumber: (this as any).credentialNumber,
      issuedBy: (this as any).issuedBy,
      issuedDate: (this as any).issuedDate,
      expiryDate: (this as any).expiryDate
    };
  }

  public override containsPHI(): boolean {
    return false;
  }

  public override getPatientId(): string | null {
    return null;
  }
}

/**
 * Staff Department Assigned Event
 * Published when staff is assigned to a department
 *
 * Subscribers:
 * - Scheduling Service: Update department schedules
 * - Notifications Service: Notify department head
 */
export class StaffScheduleUpdatedIntegrationEvent extends IntegrationEvent {
  constructor(data: {
    staffId: string;
    departmentId: string;
    departmentName: string;
    role: string;
    assignedBy: string;
  }) {
    super(
      'provider.staff.department.assigned',
      'provider-staff-service',
      data.staffId,
      'Staff',
      {
        staffId: data.staffId,
        departmentId: data.departmentId,
        departmentName: data.departmentName,
        role: data.role,
        assignedBy: data.assignedBy
      },
      undefined,
      undefined,
      data.assignedBy
    );
  }

  public override getEventData(): any {
    return {
      staffId: this.aggregateId,
      departmentId: (this as any).departmentId,
      departmentName: (this as any).departmentName,
      role: (this as any).role,
      assignedBy: (this as any).assignedBy
    };
  }

  public override containsPHI(): boolean {
    return false;
  }

  public override getPatientId(): string | null {
    return null;
  }
}

