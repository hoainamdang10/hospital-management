/**
 * Appointment Read Model Event Handler - Infrastructure Layer
 * Handles events to sync appointment read model with patient/doctor data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven Architecture
 */

import { IAppointmentReadModelRepository } from "../../domain/repositories/IAppointmentReadModelRepository";
import { IPatientService } from "../../application/services/IPatientService";
import { IProviderService } from "../../application/services/IProviderService";
import {
  PatientData,
  DoctorData,
} from "../../domain/read-models/AppointmentReadModel";

/**
 * Event interfaces
 */
export interface AppointmentScheduledEvent {
  eventId: string;
  eventType: "appointment.scheduled";
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string; // Date as ISO string from event payload
  appointmentTime: string;
  durationMinutes: number;
  type: string;
  priority: string;
  status: string;
  roomId?: string;
  departmentId?: string;
  consultationFee: number; // Billing reference only
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[];
  notes?: string;
  specialInstructions?: string;
  requiredEquipment?: string[];
  occurredAt: Date | string; // Can be Date object or ISO string after deserialization
}

export interface AppointmentRescheduledEventDTO {
  eventId: string;
  eventType: "appointment.rescheduled";
  appointmentId: string;
  patientId: string;
  doctorId: string;
  newStartTime: Date | string;
  newEndTime: Date | string;
  rescheduleReason?: string;
  rescheduledBy?: string;
  occurredAt: Date | string;
}

export interface PatientUpdatedEvent {
  eventId: string;
  eventType: "patient.updated";
  patientId: string;
  updatedFields: string[];
  newValues: {
    fullName?: string;
    phone?: string;
    email?: string;
    dateOfBirth?: Date;
    gender?: string;
    nationalId?: string;
    insuranceNumber?: string;
    insuranceType?: string;
    address?: string;
  };
  occurredAt: Date;
}

export interface DoctorUpdatedEvent {
  eventId: string;
  eventType: "staff.updated";
  staffId: string;
  staffType: string;
  updatedFields: string[];
  newValues: {
    fullName?: string;
    specialization?: string;
    department?: string;
    licenseNumber?: string;
    phone?: string;
    email?: string;
  };
  occurredAt: Date;
}

export class AppointmentReadModelEventHandler {
  constructor(
    private readModelRepo: IAppointmentReadModelRepository,
    private patientService: IPatientService,
    private providerService: IProviderService,
  ) {}

  /**
   * Handle AppointmentScheduledEvent
   * Creates read model entry with denormalized patient/doctor data
   */
  async handleAppointmentScheduled(
    event: AppointmentScheduledEvent,
  ): Promise<void> {
    try {
      const eventAny = event as any;
      const containers = [
        eventAny,
        eventAny.payload,
        eventAny.eventData,
        eventAny.payload?.eventData,
        eventAny.data,
      ];

      const pick = (field: string) => {
        for (const source of containers) {
          if (source && source[field] !== undefined && source[field] !== null) {
            return source[field];
          }
        }
        return undefined;
      };

      const appointmentId = pick("appointmentId");
      const patientId = pick("patientId");
      const doctorId = pick("doctorId");
      const appointmentDate = pick("appointmentDate");
      const appointmentTime = pick("appointmentTime");
      const durationMinutes = pick("durationMinutes");
      const type = pick("type");
      const priority = pick("priority");
      const status = pick("status");
      const roomId = pick("roomId");
      const departmentId = pick("departmentId");
      const consultationFee = pick("consultationFee");
      const reason = pick("reason");
      const chiefComplaint = pick("chiefComplaint");
      const symptoms = pick("symptoms");
      const notes = pick("notes");
      const specialInstructions = pick("specialInstructions");
      const requiredEquipment = pick("requiredEquipment");

      if (!appointmentId || !patientId || !doctorId) {
        console.error(
          `[ReadModel] Missing critical fields in AppointmentScheduledEvent. appointmentId=${appointmentId}, patientId=${patientId}, doctorId=${doctorId}`,
        );
        return;
      }

      if (!appointmentDate || !appointmentTime) {
        console.error(
          `[ReadModel] Missing appointmentDate/time in event ${appointmentId}, skipping read-model upsert`,
        );
        return;
      }

      console.log(
        `[ReadModel] Processing AppointmentScheduledEvent: ${appointmentId}`,
      );

      // 1. Fetch patient data from Patient Service
      let patientData: PatientData | undefined;
      try {
        console.log(`[ReadModel] Fetching patient data for: ${patientId}`);
        const patient = await this.patientService.getPatient(patientId);
        if (patient) {
          console.log(`[ReadModel] Patient data fetched successfully:`, {
            fullName: patient.fullName,
            phone: patient.phone,
            email: patient.email,
          });
          patientData = {
            patientFullName: patient.fullName,
            patientPhone: patient.phone,
            patientEmail: patient.email,
            patientDateOfBirth: patient.dateOfBirth,
            patientGender: patient.gender,
            patientNationalId: patient.nationalId,
            patientInsuranceNumber: patient.insuranceNumber,
            patientInsuranceType: patient.insuranceType,
            patientAddress: patient.address,
          };
        } else {
          console.warn(`[ReadModel] Patient not found: ${patientId}`);
        }
      } catch (error) {
        console.error(
          `[ReadModel] Failed to fetch patient data for ${patientId}:`,
          error,
        );
        console.error(`[ReadModel] Error details:`, {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continue without patient data - will be synced later via PatientUpdatedEvent
      }

      // 2. Fetch doctor data from Provider Service
      let doctorData: DoctorData | undefined;
      try {
        console.log(`[ReadModel] Fetching doctor data for: ${doctorId}`);
        const doctor = await this.providerService.getProvider(doctorId);
        if (doctor) {
          console.log(`[ReadModel] Doctor data fetched successfully:`, {
            fullName: doctor.fullName,
            specialization: doctor.specialization,
            department: doctor.department,
          });
          doctorData = {
            doctorFullName: doctor.fullName,
            doctorSpecialization: doctor.specialization,
            doctorDepartment: doctor.department,
            doctorLicenseNumber: doctor.licenseNumber,
            doctorPhone: doctor.phone,
            doctorEmail: doctor.email,
          };
        } else {
          console.warn(`[ReadModel] Doctor not found: ${doctorId}`);
        }
      } catch (error) {
        console.error(
          `[ReadModel] Failed to fetch doctor data for ${doctorId}:`,
          error,
        );
        console.error(`[ReadModel] Error details:`, {
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        });
        // Continue without doctor data - will be synced later via DoctorUpdatedEvent
      }

      // 3. Create read model entry
      // Convert string date to Date object if needed
      const appointmentDateObj =
        typeof appointmentDate === "string"
          ? new Date(appointmentDate)
          : appointmentDate;

      await this.readModelRepo.create({
        appointmentId,
        patientId,
        doctorId,
        appointmentDate: appointmentDateObj,
        appointmentTime,
        durationMinutes,
        type,
        priority,
        status,
        roomId,
        departmentId,
        consultationFee, // Billing reference only
        patientData,
        doctorData,
        reason,
        chiefComplaint,
        symptoms,
        notes,
        specialInstructions,
        requiredEquipment,
      });

      console.log(
        `[ReadModel] Successfully created read model for appointment: ${appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentScheduledEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentRescheduledEvent
   * Sync new date/time into read model
   */
  async handleAppointmentRescheduled(
    event: AppointmentRescheduledEventDTO,
  ): Promise<void> {
    try {
      const newStart = new Date(event.newStartTime as any);
      const newEnd = new Date(event.newEndTime as any);
      const durationMinutes = Math.max(
        0,
        Math.round((newEnd.getTime() - newStart.getTime()) / 60000),
      );

      // Preserve existing status if present to avoid downgrading confirmed appointments
      const existing = await this.readModelRepo.findById(event.appointmentId);
      let status = existing?.status || "scheduled";
      // If đã thanh toán hoặc trước đó đã confirmed thì giữ CONFIRMED
      if (
        status?.toLowerCase() !== "confirmed" &&
        existing?.paymentStatus?.toUpperCase() === "PAID"
      ) {
        status = "confirmed";
      }

      const formattedTime = this.formatTime(newStart);

      await this.readModelRepo.updateSchedule(
        event.appointmentId,
        newStart,
        formattedTime,
        durationMinutes,
        status,
      );

      console.log(
        `[ReadModel] Updated schedule for appointment ${event.appointmentId} -> ${newStart.toISOString()} (${formattedTime})`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentRescheduledEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle PatientUpdatedEvent
   * Updates patient data for all appointments with this patientId
   */
  async handlePatientUpdated(event: PatientUpdatedEvent): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing PatientUpdatedEvent: ${event.patientId}`,
      );

      // Extract patient data from event
      const patientData: PatientData = {
        patientFullName: event.newValues.fullName || "",
        patientPhone: event.newValues.phone,
        patientEmail: event.newValues.email,
        patientDateOfBirth: event.newValues.dateOfBirth,
        patientGender: event.newValues.gender,
        patientNationalId: event.newValues.nationalId,
        patientInsuranceNumber: event.newValues.insuranceNumber,
        patientInsuranceType: event.newValues.insuranceType,
        patientAddress: event.newValues.address,
      };

      // Update all appointments with this patient
      const updatedCount = await this.readModelRepo.updatePatientData(
        event.patientId,
        patientData,
      );

      console.log(
        `[ReadModel] Updated ${updatedCount} appointments for patient: ${event.patientId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle PatientUpdatedEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle DoctorUpdatedEvent
   * Updates doctor data for all appointments with this doctorId
   */
  async handleDoctorUpdated(event: DoctorUpdatedEvent): Promise<void> {
    try {
      // Only process if this is a doctor (not nurse or other staff)
      if (event.staffType !== "doctor") {
        console.log(
          `[ReadModel] Skipping non-doctor staff update: ${event.staffId}`,
        );
        return;
      }

      console.log(
        `[ReadModel] Processing DoctorUpdatedEvent: ${event.staffId}`,
      );

      // Extract doctor data from event
      const doctorData: DoctorData = {
        doctorFullName: event.newValues.fullName || "",
        doctorSpecialization: event.newValues.specialization,
        doctorDepartment: event.newValues.department,
        doctorLicenseNumber: event.newValues.licenseNumber,
        doctorPhone: event.newValues.phone,
        doctorEmail: event.newValues.email,
      };

      // Update all appointments with this doctor
      const updatedCount = await this.readModelRepo.updateDoctorData(
        event.staffId,
        doctorData,
      );

      console.log(
        `[ReadModel] Updated ${updatedCount} appointments for doctor: ${event.staffId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle DoctorUpdatedEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentStatusChangedEvent
   * Updates appointment status in read model
   */
  async handleAppointmentStatusChanged(event: {
    appointmentId: string;
    newStatus: string;
  }): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing AppointmentStatusChangedEvent: ${event.appointmentId}`,
      );

      await this.readModelRepo.updateStatus(
        event.appointmentId,
        event.newStatus,
      );

      console.log(
        `[ReadModel] Updated status for appointment: ${event.appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentStatusChangedEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentCancelledEvent
   * Updates appointment status to cancelled in read model
   */
  async handleAppointmentCancelled(event: {
    appointmentId: string;
    cancellationReason?: string;
    cancelledAt?: Date | string;
    paymentStatusUpdate?: string;
  }): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing AppointmentCancelledEvent: ${event.appointmentId}`,
      );

      const normalizedStatus = "CANCELLED";
      await this.readModelRepo.updateStatus(
        event.appointmentId,
        normalizedStatus,
      );

      if (event.paymentStatusUpdate) {
        await this.readModelRepo.updatePaymentStatus(
          event.appointmentId,
          event.paymentStatusUpdate.toUpperCase(),
        );
      }

      const cancelledAt = event.cancelledAt
        ? new Date(event.cancelledAt)
        : new Date();
      await this.readModelRepo.updateCancellationDetails(
        event.appointmentId,
        cancelledAt,
        event.cancellationReason,
      );

      console.log(
        `[ReadModel] Marked appointment as cancelled: ${event.appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentCancelledEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentConfirmedEvent
   * Updates appointment status to confirmed in read model
   */
  async handleAppointmentConfirmed(event: {
    appointmentId: string;
  }): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing AppointmentConfirmedEvent: ${event.appointmentId}`,
      );

      await this.readModelRepo.updateStatus(event.appointmentId, "confirmed");

      console.log(
        `[ReadModel] Marked appointment as confirmed: ${event.appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentConfirmedEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentCompletedEvent
   * Updates appointment status to completed in read model
   */
  async handleAppointmentCompleted(event: {
    appointmentId: string;
  }): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing AppointmentCompletedEvent: ${event.appointmentId}`,
      );

      await this.readModelRepo.updateStatus(event.appointmentId, "completed");

      console.log(
        `[ReadModel] Marked appointment as completed: ${event.appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentCompletedEvent: ${error}`,
      );
      throw error;
    }
  }

  /**
   * Handle AppointmentNoShowEvent
   * Updates appointment status to no-show in read model
   */
  async handleAppointmentNoShow(event: {
    appointmentId: string;
  }): Promise<void> {
    try {
      console.log(
        `[ReadModel] Processing AppointmentNoShowEvent: ${event.appointmentId}`,
      );

      await this.readModelRepo.updateStatus(event.appointmentId, "no_show");

      console.log(
        `[ReadModel] Marked appointment as no-show: ${event.appointmentId}`,
      );
    } catch (error) {
      console.error(
        `[ReadModel] Failed to handle AppointmentNoShowEvent: ${error}`,
      );
      throw error;
    }
  }

  private formatTime(date: Date): string {
    return date.toISOString().substring(11, 19);
  }
}
