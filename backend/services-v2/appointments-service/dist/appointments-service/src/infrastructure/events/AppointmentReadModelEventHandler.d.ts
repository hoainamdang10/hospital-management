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
    consultationFee: number;
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
export declare class AppointmentReadModelEventHandler {
    private readModelRepo;
    private patientService;
    private providerService;
    constructor(readModelRepo: IAppointmentReadModelRepository, patientService: IPatientService, providerService: IProviderService);
    /**
     * Handle AppointmentScheduledEvent
     * Creates read model entry with denormalized patient/doctor data
     */
    handleAppointmentScheduled(event: AppointmentScheduledEvent): Promise<void>;
    /**
     * Handle PatientUpdatedEvent
     * Updates patient data for all appointments with this patientId
     */
    handlePatientUpdated(event: PatientUpdatedEvent): Promise<void>;
    /**
     * Handle DoctorUpdatedEvent
     * Updates doctor data for all appointments with this doctorId
     */
    handleDoctorUpdated(event: DoctorUpdatedEvent): Promise<void>;
    /**
     * Handle AppointmentStatusChangedEvent
     * Updates appointment status in read model
     */
    handleAppointmentStatusChanged(event: {
        appointmentId: string;
        newStatus: string;
    }): Promise<void>;
    /**
     * Handle AppointmentCancelledEvent
     * Updates appointment status to cancelled in read model
     */
    handleAppointmentCancelled(event: {
        appointmentId: string;
    }): Promise<void>;
    /**
     * Handle AppointmentConfirmedEvent
     * Updates appointment status to confirmed in read model
     */
    handleAppointmentConfirmed(event: {
        appointmentId: string;
    }): Promise<void>;
    /**
     * Handle AppointmentCompletedEvent
     * Updates appointment status to completed in read model
     */
    handleAppointmentCompleted(event: {
        appointmentId: string;
    }): Promise<void>;
    /**
     * Handle AppointmentNoShowEvent
     * Updates appointment status to no-show in read model
     */
    handleAppointmentNoShow(event: {
        appointmentId: string;
    }): Promise<void>;
}
//# sourceMappingURL=AppointmentReadModelEventHandler.d.ts.map