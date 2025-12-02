/**
 * Event Handlers Wrapper
 * Wraps AppointmentReadModelEventHandler to implement EventHandler interface
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { EventHandler } from "@shared/infrastructure/event-bus/EventBus";
import { DomainEvent } from "@shared/domain/base/domain-event";
import {
  AppointmentReadModelEventHandler,
  AppointmentScheduledEvent,
  PatientUpdatedEvent,
  DoctorUpdatedEvent,
  AppointmentRescheduledEventDTO,
} from "./AppointmentReadModelEventHandler";

/**
 * Appointment Scheduled Event Handler
 */
export class AppointmentScheduledEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const raw = event as any;
    const containers = [
      raw,
      raw.payload,
      raw.eventData,
      raw.payload?.eventData,
      raw.data,
    ];

    const pick = (field: string) => {
      for (const source of containers) {
        if (source && source[field] !== undefined && source[field] !== null) {
          return source[field];
        }
      }
      return undefined;
    };

    const appointmentEvent: AppointmentScheduledEvent & {
      rawEvent?: any;
      payload?: any;
      eventData?: any;
      data?: any;
    } = {
      eventId: event.eventId,
      eventType: "appointment.scheduled",
      appointmentId: pick("appointmentId"),
      patientId: pick("patientId"),
      doctorId: pick("doctorId"),
      appointmentDate: pick("appointmentDate"),
      appointmentTime: pick("appointmentTime"),
      durationMinutes: pick("durationMinutes"),
      type: pick("type"),
      priority: pick("priority"),
      status: pick("status"),
      roomId: pick("roomId"),
      departmentId: pick("departmentId"),
      consultationFee: pick("consultationFee"),
      reason: pick("reason"),
      chiefComplaint: pick("chiefComplaint"),
      symptoms: pick("symptoms"),
      notes: pick("notes"),
      specialInstructions: pick("specialInstructions"),
      requiredEquipment: pick("requiredEquipment"),
      occurredAt: raw.occurredAt || event.occurredAt,
      rawEvent: raw,
      payload: raw.payload,
      eventData: raw.eventData || raw.payload?.eventData,
      data: raw.data,
    } as any;

    await this.readModelHandler.handleAppointmentScheduled(appointmentEvent);
  }
}

/**
 * Patient Updated Event Handler
 */
export class PatientUpdatedEventHandler implements EventHandler<DomainEvent> {
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const raw = event as any;
    const payload = raw.payload || raw.data || raw.newValues || raw || {};
    const personalInfo = payload.personalInfo || raw.personalInfo || {};
    const contactInfo = payload.contactInfo || raw.contactInfo || {};
    const insurance =
      payload.insurance ||
      payload.insuranceInfo ||
      raw.insurance ||
      raw.insuranceInfo ||
      {};

    const parseDateValue = (value?: string | Date): Date | undefined => {
      if (!value) {
        return undefined;
      }
      const normalized = value instanceof Date ? value : new Date(value);
      return Number.isNaN(normalized.getTime()) ? undefined : normalized;
    };

    const resolveFullName = (): string | undefined => {
      const direct =
        raw.fullName ||
        payload.fullName ||
        raw.newValues?.fullName ||
        personalInfo.fullName;
      if (direct) {
        return direct;
      }
      const fallbackPieces = [
        payload.firstName || raw.firstName,
        payload.lastName || raw.lastName,
      ].filter(Boolean);
      return fallbackPieces.length > 0 ? fallbackPieces.join(" ") : undefined;
    };

    const resolvePhone = (): string | undefined => {
      return (
        raw.phone ||
        raw.newValues?.phone ||
        payload.phone ||
        contactInfo.primaryPhone ||
        contactInfo.phone
      );
    };

    const resolveEmail = (): string | undefined => {
      return (
        raw.email || raw.newValues?.email || payload.email || contactInfo.email
      );
    };

    const resolveNationalId = (): string | undefined => {
      return (
        raw.nationalId ||
        raw.newValues?.nationalId ||
        payload.nationalId ||
        personalInfo.nationalId
      );
    };

    const resolveGender = (): string | undefined => {
      return (
        raw.gender ||
        raw.newValues?.gender ||
        payload.gender ||
        personalInfo.gender
      );
    };

    const resolveInsuranceNumber = (): string | undefined => {
      return (
        raw.insuranceNumber ||
        raw.newValues?.insuranceNumber ||
        payload.insuranceNumber ||
        insurance.policyNumber ||
        insurance.bhytNumber
      );
    };

    const resolveInsuranceType = (): string | undefined => {
      return (
        raw.insuranceType ||
        raw.newValues?.insuranceType ||
        payload.insuranceType ||
        insurance.coverageType ||
        insurance.type
      );
    };

    const resolveAddress = (): any => {
      return (
        raw.address ||
        raw.newValues?.address ||
        payload.address ||
        contactInfo.address
      );
    };

    const resolveDateOfBirth = (): Date | undefined => {
      return (
        parseDateValue(
          raw.dateOfBirth ||
            raw.newValues?.dateOfBirth ||
            payload.dateOfBirth ||
            personalInfo.dateOfBirth,
        ) || undefined
      );
    };

    const patientId =
      raw.patientId ||
      payload.patientId ||
      raw.aggregateId ||
      (event as any).aggregateId;

    const patientEvent: PatientUpdatedEvent = {
      eventId: event.eventId,
      eventType: "patient.updated",
      patientId,
      updatedFields: raw.updatedFields || payload.updatedFields || [],
      newValues: {
        fullName: resolveFullName(),
        phone: resolvePhone(),
        email: resolveEmail(),
        dateOfBirth: resolveDateOfBirth(),
        gender: resolveGender(),
        nationalId: resolveNationalId(),
        insuranceNumber: resolveInsuranceNumber(),
        insuranceType: resolveInsuranceType(),
        address: resolveAddress(),
      },
      occurredAt: event.occurredAt,
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
      eventType: "staff.updated",
      staffId: (event as any).staffId || (event as any).providerId,
      staffType: (event as any).staffType || "doctor",
      updatedFields: (event as any).updatedFields || [],
      newValues: {
        fullName: (event as any).fullName,
        specialization: (event as any).specialization,
        department: (event as any).department,
        licenseNumber: (event as any).licenseNumber,
        phone: (event as any).phone,
        email: (event as any).email,
      },
      occurredAt: event.occurredAt,
    };

    await this.readModelHandler.handleDoctorUpdated(doctorEvent);
  }
}

/**
 * Appointment Status Changed Event Handler
 */
export class AppointmentStatusChangedEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentStatusChanged({
      appointmentId: (event as any).appointmentId,
      newStatus: (event as any).newStatus || (event as any).status,
    });
  }
}

/**
 * Appointment Rescheduled Event Handler
 */
export class AppointmentRescheduledEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    const payload: AppointmentRescheduledEventDTO = {
      eventId: event.eventId,
      eventType: "appointment.rescheduled",
      appointmentId: (event as any).appointmentId,
      patientId: (event as any).patientId,
      doctorId: (event as any).doctorId,
      newStartTime:
        (event as any).newStartTime ||
        (event as any).newAppointmentTime ||
        (event as any).newStart,
      newEndTime:
        (event as any).newEndTime ||
        (event as any).newEnd ||
        (event as any).newAppointmentEndTime,
      rescheduleReason: (event as any).rescheduleReason,
      rescheduledBy: (event as any).rescheduledBy,
      occurredAt: event.occurredAt,
    };

    await this.readModelHandler.handleAppointmentRescheduled(payload);
  }
}

/**
 * Appointment Cancelled Event Handler
 */
export class AppointmentCancelledEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentCancelled({
      appointmentId: (event as any).appointmentId,
    });
  }
}

/**
 * Appointment Confirmed Event Handler
 */
export class AppointmentConfirmedEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentConfirmed({
      appointmentId: (event as any).appointmentId,
    });
  }
}

/**
 * Appointment Completed Event Handler
 */
export class AppointmentCompletedEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentCompleted({
      appointmentId: (event as any).appointmentId,
    });
  }
}

/**
 * Appointment No-Show Event Handler
 */
export class AppointmentNoShowEventHandler
  implements EventHandler<DomainEvent>
{
  constructor(private readModelHandler: AppointmentReadModelEventHandler) {}

  async handle(event: DomainEvent): Promise<void> {
    await this.readModelHandler.handleAppointmentNoShow({
      appointmentId: (event as any).appointmentId,
    });
  }
}
