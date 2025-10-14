"use strict";
/**
 * Schedule Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD + CQRS Implementation
 * Matches domain model V3 (only stores IDs, not denormalized data)
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScheduleAppointmentUseCase = void 0;
const use_case_interface_1 = require("@shared/application/use-cases/base/use-case.interface");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const AppointmentId_vo_1 = require("../../domain/value-objects/AppointmentId.vo");
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
const AppointmentDetails_vo_1 = require("../../domain/value-objects/AppointmentDetails.vo");
/**
 * Schedule Appointment Use Case
 * Creates a new appointment with proper validation and business rules
 */
class ScheduleAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository) {
        super();
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Execute use case
     */
    async executeInternal(request) {
        try {
            // 1. Validate request
            this.validateRequest(request);
            // 2. Create value objects
            const appointmentId = AppointmentId_vo_1.AppointmentId.generate();
            const timeSlot = TimeSlot_vo_1.TimeSlot.create(request.appointmentDate, request.appointmentTime);
            const details = AppointmentDetails_vo_1.AppointmentDetails.create(request.reason, request.chiefComplaint, request.symptoms, request.notes, request.specialInstructions);
            // 3. Create appointment aggregate
            const appointment = Appointment_aggregate_1.Appointment.create(appointmentId, request.patientId, request.doctorId, timeSlot, request.durationMinutes, request.type, request.priority, details, request.consultationFee, request.createdBy, request.roomId, request.departmentId, request.requiredEquipment);
            // 4. Save to repository
            await this.appointmentRepository.save(appointment);
            // 5. Return response
            return {
                success: true,
                appointmentId: appointmentId.value,
                message: 'Đặt lịch hẹn thành công',
                appointment: {
                    id: appointment.id,
                    appointmentId: appointmentId.value,
                    patientId: request.patientId,
                    doctorId: request.doctorId,
                    appointmentDate: request.appointmentDate,
                    appointmentTime: request.appointmentTime,
                    durationMinutes: request.durationMinutes,
                    type: request.type,
                    priority: request.priority,
                    status: 'scheduled',
                    consultationFee: request.consultationFee
                }
            };
        }
        catch (error) {
            return {
                success: false,
                appointmentId: '',
                message: 'Đặt lịch hẹn thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Validate request
     */
    validateRequest(request) {
        const errors = [];
        if (!request.patientId) {
            errors.push('Patient ID is required');
        }
        if (!request.doctorId) {
            errors.push('Doctor ID is required');
        }
        if (!request.appointmentDate) {
            errors.push('Appointment date is required');
        }
        if (!request.appointmentTime) {
            errors.push('Appointment time is required');
        }
        if (!request.durationMinutes || request.durationMinutes <= 0) {
            errors.push('Duration must be positive');
        }
        if (!request.type) {
            errors.push('Appointment type is required');
        }
        if (!request.priority) {
            errors.push('Priority is required');
        }
        if (request.consultationFee < 0) {
            errors.push('Consultation fee cannot be negative');
        }
        if (!request.createdBy) {
            errors.push('Created by is required');
        }
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }
    /**
     * Authorization check
     */
    async authorize(request, userId) {
        // Only authenticated users can schedule appointments
        return !!userId;
    }
    /**
     * Check if involves PHI
     */
    involvesPHI(request) {
        return true; // Appointment data is PHI
    }
    /**
     * Get patient ID
     */
    getPatientId(request) {
        return request.patientId;
    }
}
exports.ScheduleAppointmentUseCase = ScheduleAppointmentUseCase;
//# sourceMappingURL=ScheduleAppointment.use-case.js.map