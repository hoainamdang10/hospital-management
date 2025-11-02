/**
 * Appointment Read Model Event Handler - Infrastructure Layer
 * Handles events to sync appointment read model with patient/doctor data
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven Architecture
 */

import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import { IPatientService } from '../../application/services/IPatientService';
import { IProviderService } from '../../application/services/IProviderService';
import { PatientData, DoctorData } from '../../domain/read-models/AppointmentReadModel';

/**
 * Event interfaces
 */
export interface AppointmentScheduledEvent {
  eventId: string;
  eventType: 'appointment.scheduled';
  appointmentId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
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
  occurredAt: Date;
}

export interface PatientUpdatedEvent {
  eventId: string;
  eventType: 'patient.updated';
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
  eventType: 'staff.updated';
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
    private providerService: IProviderService
  ) {}

  /**
   * Handle AppointmentScheduledEvent
   * Creates read model entry with denormalized patient/doctor data
   */
  async handleAppointmentScheduled(event: AppointmentScheduledEvent): Promise<void> {
    try {
      console.log(`[ReadModel] Processing AppointmentScheduledEvent: ${event.appointmentId}`);

      // 1. Fetch patient data from Patient Service
      let patientData: PatientData | undefined;
      try {
        const patient = await this.patientService.getPatient(event.patientId);
        if (patient) {
          patientData = {
            patientFullName: patient.fullName,
            patientPhone: patient.phone,
            patientEmail: patient.email,
            patientDateOfBirth: patient.dateOfBirth,
            patientGender: patient.gender,
            patientNationalId: patient.nationalId,
            patientInsuranceNumber: patient.insuranceNumber,
            patientInsuranceType: patient.insuranceType,
            patientAddress: patient.address
          };
        }
      } catch (error) {
        console.error(`[ReadModel] Failed to fetch patient data: ${error}`);
        // Continue without patient data - will be synced later via PatientUpdatedEvent
      }

      // 2. Fetch doctor data from Provider Service
      let doctorData: DoctorData | undefined;
      try {
        const doctor = await this.providerService.getProvider(event.doctorId);
        if (doctor) {
          doctorData = {
            doctorFullName: doctor.fullName,
            doctorSpecialization: doctor.specialization,
            doctorDepartment: doctor.department,
            doctorLicenseNumber: doctor.licenseNumber,
            doctorPhone: doctor.phone,
            doctorEmail: doctor.email
          };
        }
      } catch (error) {
        console.error(`[ReadModel] Failed to fetch doctor data: ${error}`);
        // Continue without doctor data - will be synced later via DoctorUpdatedEvent
      }

      // 3. Create read model entry
      await this.readModelRepo.create({
        appointmentId: event.appointmentId,
        patientId: event.patientId,
        doctorId: event.doctorId,
        appointmentDate: event.appointmentDate,
        appointmentTime: event.appointmentTime,
        durationMinutes: event.durationMinutes,
        type: event.type,
        priority: event.priority,
        status: event.status,
        roomId: event.roomId,
        departmentId: event.departmentId,
        consultationFee: event.consultationFee, // Billing reference only
        patientData,
        doctorData,
        reason: event.reason,
        chiefComplaint: event.chiefComplaint,
        symptoms: event.symptoms,
        notes: event.notes,
        specialInstructions: event.specialInstructions,
        requiredEquipment: event.requiredEquipment
      });

      console.log(`[ReadModel] Successfully created read model for appointment: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentScheduledEvent: ${error}`);
      throw error;
    }
  }

  /**
   * Handle PatientUpdatedEvent
   * Updates patient data for all appointments with this patientId
   */
  async handlePatientUpdated(event: PatientUpdatedEvent): Promise<void> {
    try {
      console.log(`[ReadModel] Processing PatientUpdatedEvent: ${event.patientId}`);

      // Extract patient data from event
      const patientData: PatientData = {
        patientFullName: event.newValues.fullName || '',
        patientPhone: event.newValues.phone,
        patientEmail: event.newValues.email,
        patientDateOfBirth: event.newValues.dateOfBirth,
        patientGender: event.newValues.gender,
        patientNationalId: event.newValues.nationalId,
        patientInsuranceNumber: event.newValues.insuranceNumber,
        patientInsuranceType: event.newValues.insuranceType,
        patientAddress: event.newValues.address
      };

      // Update all appointments with this patient
      const updatedCount = await this.readModelRepo.updatePatientData(
        event.patientId,
        patientData
      );

      console.log(`[ReadModel] Updated ${updatedCount} appointments for patient: ${event.patientId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle PatientUpdatedEvent: ${error}`);
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
      if (event.staffType !== 'doctor') {
        console.log(`[ReadModel] Skipping non-doctor staff update: ${event.staffId}`);
        return;
      }

      console.log(`[ReadModel] Processing DoctorUpdatedEvent: ${event.staffId}`);

      // Extract doctor data from event
      const doctorData: DoctorData = {
        doctorFullName: event.newValues.fullName || '',
        doctorSpecialization: event.newValues.specialization,
        doctorDepartment: event.newValues.department,
        doctorLicenseNumber: event.newValues.licenseNumber,
        doctorPhone: event.newValues.phone,
        doctorEmail: event.newValues.email
      };

      // Update all appointments with this doctor
      const updatedCount = await this.readModelRepo.updateDoctorData(
        event.staffId,
        doctorData
      );

      console.log(`[ReadModel] Updated ${updatedCount} appointments for doctor: ${event.staffId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle DoctorUpdatedEvent: ${error}`);
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
      console.log(`[ReadModel] Processing AppointmentStatusChangedEvent: ${event.appointmentId}`);

      await this.readModelRepo.updateStatus(event.appointmentId, event.newStatus);

      console.log(`[ReadModel] Updated status for appointment: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentStatusChangedEvent: ${error}`);
      throw error;
    }
  }

  /**
   * Handle AppointmentCancelledEvent
   * Updates appointment status to cancelled in read model
   */
  async handleAppointmentCancelled(event: {
    appointmentId: string;
  }): Promise<void> {
    try {
      console.log(`[ReadModel] Processing AppointmentCancelledEvent: ${event.appointmentId}`);

      await this.readModelRepo.updateStatus(event.appointmentId, 'cancelled');

      console.log(`[ReadModel] Marked appointment as cancelled: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentCancelledEvent: ${error}`);
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
      console.log(`[ReadModel] Processing AppointmentConfirmedEvent: ${event.appointmentId}`);

      await this.readModelRepo.updateStatus(event.appointmentId, 'confirmed');

      console.log(`[ReadModel] Marked appointment as confirmed: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentConfirmedEvent: ${error}`);
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
      console.log(`[ReadModel] Processing AppointmentCompletedEvent: ${event.appointmentId}`);

      await this.readModelRepo.updateStatus(event.appointmentId, 'completed');

      console.log(`[ReadModel] Marked appointment as completed: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentCompletedEvent: ${error}`);
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
      console.log(`[ReadModel] Processing AppointmentNoShowEvent: ${event.appointmentId}`);

      await this.readModelRepo.updateStatus(event.appointmentId, 'no_show');

      console.log(`[ReadModel] Marked appointment as no-show: ${event.appointmentId}`);
    } catch (error) {
      console.error(`[ReadModel] Failed to handle AppointmentNoShowEvent: ${error}`);
      throw error;
    }
  }
}

