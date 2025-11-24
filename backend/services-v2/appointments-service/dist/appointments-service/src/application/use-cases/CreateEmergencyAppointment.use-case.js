"use strict";
/**
 * Create Emergency Appointment Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEmergencyAppointmentUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const Appointment_aggregate_1 = require("../../domain/aggregates/Appointment.aggregate");
const AppointmentId_vo_1 = require("../../domain/value-objects/AppointmentId.vo");
const TenantId_vo_1 = require("../../domain/value-objects/TenantId.vo");
const TimeSlot_vo_1 = require("../../domain/value-objects/TimeSlot.vo");
const AppointmentDetails_vo_1 = require("../../domain/value-objects/AppointmentDetails.vo");
const QueueEntry_entity_1 = require("../../domain/entities/QueueEntry.entity");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Create Emergency Appointment Use Case
 *
 * Business Rules:
 * 1. Skip availability check
 * 2. Override conflicts
 * 3. Highest priority in queue (EMERGENCY)
 * 4. Immediate notification to doctor
 * 5. Auto-confirm appointment
 * 6. No cancellation fee
 */
class CreateEmergencyAppointmentUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, queueRepository, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Authorization check - only staff can create emergency appointments
            const canCreate = await this.authorizationService.canCreateEmergencyAppointment(request.createdBy);
            if (!canCreate) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to create emergency appointments', request.createdBy, 'create_emergency_appointment', 'emergency');
            }
            // 2. Create appointment for immediate time (add 1 minute to avoid "past" validation)
            const now = new Date();
            now.setMinutes(now.getMinutes() + 1); // Add 1 minute
            const appointmentDate = now.toISOString().split('T')[0];
            const appointmentTime = now.toTimeString().split(' ')[0];
            // 2. Generate appointment ID
            const appointmentId = AppointmentId_vo_1.AppointmentId.generate();
            // 3. Create time slot
            const timeSlot = TimeSlot_vo_1.TimeSlot.create(appointmentDate, appointmentTime);
            // 4. Create appointment details
            const details = AppointmentDetails_vo_1.AppointmentDetails.create('Emergency Appointment', request.chiefComplaint, undefined, // symptoms
            request.notes, 'EMERGENCY - Prioritize');
            // 5. Create appointment with EMERGENCY priority
            const tenantId = TenantId_vo_1.TenantId.createDefault();
            const appointment = Appointment_aggregate_1.Appointment.create(appointmentId, tenantId, request.patientId, request.doctorId, timeSlot, 30, // Default 30 minutes
            Appointment_aggregate_1.AppointmentType.EMERGENCY, Appointment_aggregate_1.AppointmentPriority.EMERGENCY, // ✅ Set priority in constructor
            details, 200000, // Default consultation fee
            request.createdBy);
            // Auto-confirm
            appointment.confirm(request.createdBy);
            // 5. Save appointment
            await this.appointmentRepository.save(appointment);
            // 6. Get or create queue for today
            const today = new Date(appointmentDate);
            const queue = await this.queueRepository.findOrCreateByDoctorAndDate(request.doctorId, today);
            // 7. Add to queue with EMERGENCY priority (Queue Aggregate handles ordering)
            const entry = queue.addPatient(request.patientId, appointmentId.value, QueueEntry_entity_1.QueuePriority.EMERGENCY);
            // 8. Save queue aggregate
            await this.queueRepository.save(queue);
            // 9. Get queue position (queueNumber is the position)
            const queuePosition = entry.queueNumber;
            // 10. Return success response
            return {
                success: true,
                message: 'Tạo lịch hẹn khẩn cấp thành công',
                appointment: {
                    appointmentId: appointmentId.value,
                    patientId: request.patientId,
                    doctorId: request.doctorId,
                    appointmentDate,
                    appointmentTime,
                    status: appointment.status,
                    priority: 'EMERGENCY',
                    queuePosition: queuePosition || 1
                }
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Tạo lịch hẹn khẩn cấp thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canCreateEmergencyAppointment()
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId;
    }
}
exports.CreateEmergencyAppointmentUseCase = CreateEmergencyAppointmentUseCase;
//# sourceMappingURL=CreateEmergencyAppointment.use-case.js.map