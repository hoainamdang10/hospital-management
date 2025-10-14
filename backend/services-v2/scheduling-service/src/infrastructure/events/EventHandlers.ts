/**
 * Event Handlers Wrapper
 * Wraps AppointmentReadModelEventHandler to implement EventHandler interface
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { EventHandler } from '@shared/infrastructure/event-bus/EventBus';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { AppointmentReadModelEventHandler, AppointmentScheduledEvent, PatientUpdatedEvent, DoctorUpdatedEvent } from './AppointmentReadModelEventHandler';

/**
 * Appointment Scheduled Event Handler
 */
export class AppointmentScheduledEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const appointmentEvent: AppointmentScheduledEvent = {
      eventId: event.eventId,
      eventType: 'appointment.scheduled',
      appointmentId: (event as any).appointmentId,
      patientId: (event as any).patientId,
      doctorId: (event as any).doctorId,
      appointmentDate: new Date((event as any).appointmentDate),
      appointmentTime: (event as any).appointmentTime,
      durationMinutes: (event as any).durationMinutes,
      type: (event as any).type,
      priority: (event as any).priority,
      status: (event as any).status,
      roomId: (event as any).roomId,
      departmentId: (event as any).departmentId,
      consultationFee: (event as any).consultationFee,
      additionalFees: (event as any).additionalFees,
      paymentStatus: (event as any).paymentStatus || 'pending',
      reason: (event as any).reason,
      chiefComplaint: (event as any).chiefComplaint,
      symptoms: (event as any).symptoms,
      notes: (event as any).notes,
      specialInstructions: (event as any).specialInstructions,
      requiredEquipment: (event as any).requiredEquipment,
      occurredAt: event.occurredAt
    };

    await this.readModelHandler.handleAppointmentScheduled(appointmentEvent);
  }
}

/**
 * Patient Updated Event Handler
 */
export class PatientUpdatedEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const patientEvent: PatientUpdatedEvent = {
      eventId: event.eventId,
      eventType: 'patient.updated',
      patientId: (event as any).patientId,
      updatedFields: (event as any).updatedFields || [],
      newValues: {
        fullName: (event as any).fullName,
        phone: (event as any).phone,
        email: (event as any).email,
        dateOfBirth: (event as any).dateOfBirth ? new Date((event as any).dateOfBirth) : undefined,
        gender: (event as any).gender,
        nationalId: (event as any).nationalId,
        insuranceNumber: (event as any).insuranceNumber,
        insuranceType: (event as any).insuranceType,
        address: (event as any).address
      },
      occurredAt: event.occurredAt
    };

    await this.readModelHandler.handlePatientUpdated(patientEvent);
  }
}

/**
 * Doctor Updated Event Handler
 */
export class DoctorUpdatedEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const doctorEvent: DoctorUpdatedEvent = {
      eventId: event.eventId,
      eventType: 'staff.updated',
      staffId: (event as any).staffId || (event as any).providerId,
      staffType: (event as any).staffType || 'doctor',
      updatedFields: (event as any).updatedFields || [],
      newValues: {
        fullName: (event as any).fullName,
        specialization: (event as any).specialization,
        department: (event as any).department,
        licenseNumber: (event as any).licenseNumber,
        phone: (event as any).phone,
        email: (event as any).email
      },
      occurredAt: event.occurredAt
    };

    await this.readModelHandler.handleDoctorUpdated(doctorEvent);
  }
}

/**
 * Appointment Status Changed Event Handler
 */
export class AppointmentStatusChangedEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentStatusChanged({
      appointmentId: (event as any).appointmentId,
      newStatus: (event as any).newStatus || (event as any).status
    });
  }
}

/**
 * Appointment Cancelled Event Handler
 */
export class AppointmentCancelledEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentCancelled({
      appointmentId: (event as any).appointmentId
    });
  }
}

