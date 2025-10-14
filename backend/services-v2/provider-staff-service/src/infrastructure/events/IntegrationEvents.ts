/**
 * Integration Events for Provider/Staff Service
 * Events published to RabbitMQ for inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { IntegrationEvent } from './RabbitMQEventPublisher';

/**
 * Staff Registered Event
 * Published when a new staff member is registered
 * 
 * Subscribers:
 * - Scheduling Service: Create doctor schedule
 * - Clinical/EMR Service: Initialize provider profile
 * - Notifications Service: Send welcome email
 */
export function createStaffRegisteredEvent(data: {
  staffId: string;
  userId: string;
  staffType: 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'receptionist' | 'admin';
  fullName: string;
  department?: string;
  specialization?: string;
  licenseNumber?: string;
  registrationDate: Date;
}): IntegrationEvent {
  return {
    eventId: `staff-registered-${Date.now()}`,
    eventType: 'provider.staff.registered',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      userId: data.userId,
      staffType: data.staffType,
      fullName: data.fullName,
      department: data.department,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      registrationDate: data.registrationDate.toISOString()
    },
    metadata: {
      priority: 'normal',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'staff_registration',
      vietnameseDescription: 'Nhân viên y tế mới được đăng ký vào hệ thống'
    }
  };
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
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      userId: data.userId,
      updatedFields: data.updatedFields,
      consultationFee: data.consultationFee,
      workSchedule: data.workSchedule,
      status: data.status
    },
    metadata: {
      priority: 'normal',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'staff_update',
      vietnameseDescription: 'Thông tin nhân viên y tế được cập nhật'
    }
  };
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
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      isAcceptingNewPatients: data.isAcceptingNewPatients,
      reason: data.reason,
      effectiveDate: data.effectiveDate?.toISOString()
    },
    metadata: {
      priority: 'high',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'availability_change',
      vietnameseDescription: 'Trạng thái nhận bệnh nhân của bác sĩ thay đổi'
    }
  };
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
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      userId: data.userId,
      previousStatus: data.previousStatus,
      newStatus: data.newStatus,
      reason: data.reason,
      changedBy: data.changedBy
    },
    metadata: {
      priority: 'high',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'status_change',
      vietnameseDescription: 'Trạng thái nhân viên y tế thay đổi'
    }
  };
}

/**
 * Staff Credential Added Event
 * Published when new credential/certification is added
 * 
 * Subscribers:
 * - Clinical/EMR Service: Update provider qualifications
 * - Compliance Service: Track certifications
 */
export function createStaffCredentialAddedEvent(data: {
  staffId: string;
  credentialType: string;
  credentialNumber: string;
  issuedBy: string;
  issuedDate: Date;
  expiryDate?: Date;
}): IntegrationEvent {
  return {
    eventId: `staff-credential-added-${Date.now()}`,
    eventType: 'provider.staff.credential.added',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      credentialType: data.credentialType,
      credentialNumber: data.credentialNumber,
      issuedBy: data.issuedBy,
      issuedDate: data.issuedDate.toISOString(),
      expiryDate: data.expiryDate?.toISOString()
    },
    metadata: {
      priority: 'normal',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'credential_management',
      vietnameseDescription: 'Chứng chỉ hành nghề mới được thêm vào'
    }
  };
}

/**
 * Staff Department Assigned Event
 * Published when staff is assigned to a department
 * 
 * Subscribers:
 * - Scheduling Service: Update department schedules
 * - Notifications Service: Notify department head
 */
export function createStaffDepartmentAssignedEvent(data: {
  staffId: string;
  departmentId: string;
  departmentName: string;
  role: string;
  assignedBy: string;
}): IntegrationEvent {
  return {
    eventId: `staff-department-assigned-${Date.now()}`,
    eventType: 'provider.staff.department.assigned',
    aggregateId: data.staffId,
    aggregateType: 'Staff',
    occurredAt: new Date(),
    serviceName: 'provider-staff-service',
    eventData: {
      staffId: data.staffId,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      role: data.role,
      assignedBy: data.assignedBy
    },
    metadata: {
      priority: 'normal',
      complianceLevel: 'hipaa',
      containsPHI: false,
      eventCategory: 'provider_staff',
      eventSubcategory: 'department_assignment',
      vietnameseDescription: 'Nhân viên được phân công vào khoa'
    }
  };
}

