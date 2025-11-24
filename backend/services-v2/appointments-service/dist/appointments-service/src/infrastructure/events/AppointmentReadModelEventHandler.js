"use strict";
/**
 * Appointment Read Model Event Handler - Infrastructure Layer
 * Handles events to sync appointment read model with patient/doctor data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentReadModelEventHandler = void 0;
class AppointmentReadModelEventHandler {
    constructor(readModelRepo, patientService, providerService) {
        this.readModelRepo = readModelRepo;
        this.patientService = patientService;
        this.providerService = providerService;
    }
    /**
     * Handle AppointmentScheduledEvent
     * Creates read model entry with denormalized patient/doctor data
     */
    async handleAppointmentScheduled(event) {
        try {
            // FIX: After deserialization, event data is spread into root level of event object
            // Access properties directly instead of relying on readonly properties
            const eventAny = event;
            const appointmentId = eventAny.appointmentId;
            const patientId = eventAny.patientId;
            const doctorId = eventAny.doctorId;
            const appointmentDate = eventAny.appointmentDate;
            const appointmentTime = eventAny.appointmentTime;
            const durationMinutes = eventAny.durationMinutes;
            const type = eventAny.type;
            const priority = eventAny.priority;
            const status = eventAny.status;
            const roomId = eventAny.roomId;
            const departmentId = eventAny.departmentId;
            const consultationFee = eventAny.consultationFee;
            const reason = eventAny.reason;
            const chiefComplaint = eventAny.chiefComplaint;
            const symptoms = eventAny.symptoms;
            const notes = eventAny.notes;
            const specialInstructions = eventAny.specialInstructions;
            const requiredEquipment = eventAny.requiredEquipment;
            console.log(`[ReadModel] Processing AppointmentScheduledEvent: ${appointmentId}`);
            // 1. Fetch patient data from Patient Service
            let patientData;
            try {
                const patient = await this.patientService.getPatient(patientId);
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
                        patientAddress: patient.address,
                    };
                }
            }
            catch (error) {
                console.error(`[ReadModel] Failed to fetch patient data: ${error}`);
                // Continue without patient data - will be synced later via PatientUpdatedEvent
            }
            // 2. Fetch doctor data from Provider Service
            let doctorData;
            try {
                const doctor = await this.providerService.getProvider(doctorId);
                if (doctor) {
                    doctorData = {
                        doctorFullName: doctor.fullName,
                        doctorSpecialization: doctor.specialization,
                        doctorDepartment: doctor.department,
                        doctorLicenseNumber: doctor.licenseNumber,
                        doctorPhone: doctor.phone,
                        doctorEmail: doctor.email,
                    };
                }
            }
            catch (error) {
                console.error(`[ReadModel] Failed to fetch doctor data: ${error}`);
                // Continue without doctor data - will be synced later via DoctorUpdatedEvent
            }
            // 3. Create read model entry
            // Convert string date to Date object if needed
            const appointmentDateObj = typeof appointmentDate === "string"
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
            console.log(`[ReadModel] Successfully created read model for appointment: ${appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentScheduledEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentRescheduledEvent
     * Sync new date/time into read model
     */
    async handleAppointmentRescheduled(event) {
        try {
            const newStart = new Date(event.newStartTime);
            const newEnd = new Date(event.newEndTime);
            const durationMinutes = Math.max(0, Math.round((newEnd.getTime() - newStart.getTime()) / 60000));
            // Preserve existing status if present to avoid downgrading confirmed appointments
            const existing = await this.readModelRepo.findById(event.appointmentId);
            const status = existing?.status || "scheduled";
            const formattedTime = this.formatTime(newStart);
            await this.readModelRepo.updateSchedule(event.appointmentId, newStart, formattedTime, durationMinutes, status);
            console.log(`[ReadModel] Updated schedule for appointment ${event.appointmentId} -> ${newStart.toISOString()} (${formattedTime})`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentRescheduledEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle PatientUpdatedEvent
     * Updates patient data for all appointments with this patientId
     */
    async handlePatientUpdated(event) {
        try {
            console.log(`[ReadModel] Processing PatientUpdatedEvent: ${event.patientId}`);
            // Extract patient data from event
            const patientData = {
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
            const updatedCount = await this.readModelRepo.updatePatientData(event.patientId, patientData);
            console.log(`[ReadModel] Updated ${updatedCount} appointments for patient: ${event.patientId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle PatientUpdatedEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle DoctorUpdatedEvent
     * Updates doctor data for all appointments with this doctorId
     */
    async handleDoctorUpdated(event) {
        try {
            // Only process if this is a doctor (not nurse or other staff)
            if (event.staffType !== "doctor") {
                console.log(`[ReadModel] Skipping non-doctor staff update: ${event.staffId}`);
                return;
            }
            console.log(`[ReadModel] Processing DoctorUpdatedEvent: ${event.staffId}`);
            // Extract doctor data from event
            const doctorData = {
                doctorFullName: event.newValues.fullName || "",
                doctorSpecialization: event.newValues.specialization,
                doctorDepartment: event.newValues.department,
                doctorLicenseNumber: event.newValues.licenseNumber,
                doctorPhone: event.newValues.phone,
                doctorEmail: event.newValues.email,
            };
            // Update all appointments with this doctor
            const updatedCount = await this.readModelRepo.updateDoctorData(event.staffId, doctorData);
            console.log(`[ReadModel] Updated ${updatedCount} appointments for doctor: ${event.staffId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle DoctorUpdatedEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentStatusChangedEvent
     * Updates appointment status in read model
     */
    async handleAppointmentStatusChanged(event) {
        try {
            console.log(`[ReadModel] Processing AppointmentStatusChangedEvent: ${event.appointmentId}`);
            await this.readModelRepo.updateStatus(event.appointmentId, event.newStatus);
            console.log(`[ReadModel] Updated status for appointment: ${event.appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentStatusChangedEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentCancelledEvent
     * Updates appointment status to cancelled in read model
     */
    async handleAppointmentCancelled(event) {
        try {
            console.log(`[ReadModel] Processing AppointmentCancelledEvent: ${event.appointmentId}`);
            await this.readModelRepo.updateStatus(event.appointmentId, "cancelled");
            console.log(`[ReadModel] Marked appointment as cancelled: ${event.appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentCancelledEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentConfirmedEvent
     * Updates appointment status to confirmed in read model
     */
    async handleAppointmentConfirmed(event) {
        try {
            console.log(`[ReadModel] Processing AppointmentConfirmedEvent: ${event.appointmentId}`);
            await this.readModelRepo.updateStatus(event.appointmentId, "confirmed");
            console.log(`[ReadModel] Marked appointment as confirmed: ${event.appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentConfirmedEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentCompletedEvent
     * Updates appointment status to completed in read model
     */
    async handleAppointmentCompleted(event) {
        try {
            console.log(`[ReadModel] Processing AppointmentCompletedEvent: ${event.appointmentId}`);
            await this.readModelRepo.updateStatus(event.appointmentId, "completed");
            console.log(`[ReadModel] Marked appointment as completed: ${event.appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentCompletedEvent: ${error}`);
            throw error;
        }
    }
    /**
     * Handle AppointmentNoShowEvent
     * Updates appointment status to no-show in read model
     */
    async handleAppointmentNoShow(event) {
        try {
            console.log(`[ReadModel] Processing AppointmentNoShowEvent: ${event.appointmentId}`);
            await this.readModelRepo.updateStatus(event.appointmentId, "no_show");
            console.log(`[ReadModel] Marked appointment as no-show: ${event.appointmentId}`);
        }
        catch (error) {
            console.error(`[ReadModel] Failed to handle AppointmentNoShowEvent: ${error}`);
            throw error;
        }
    }
    formatTime(date) {
        return date.toISOString().substring(11, 19);
    }
}
exports.AppointmentReadModelEventHandler = AppointmentReadModelEventHandler;
//# sourceMappingURL=AppointmentReadModelEventHandler.js.map