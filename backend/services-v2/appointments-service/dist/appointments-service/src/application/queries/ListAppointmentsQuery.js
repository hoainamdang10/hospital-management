"use strict";
/**
 * List Appointments Query - Application Layer
 * CQRS Query to list appointments with filters and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAppointmentsQuery = void 0;
class ListAppointmentsQuery {
    constructor(readModelRepo) {
        this.readModelRepo = readModelRepo;
    }
    /**
     * Execute query to list appointments
     */
    async execute(params) {
        // Default pagination
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        const offset = (page - 1) * pageSize;
        // Build filters
        const filters = {
            patientId: params.patientId,
            doctorId: params.doctorId,
            startDate: params.startDate,
            endDate: params.endDate,
            status: params.status,
            type: params.type,
            priority: params.priority,
            departmentId: params.departmentId,
            limit: pageSize,
            offset,
        };
        // Query read model
        const [appointments, total] = await Promise.all([
            this.readModelRepo.findWithFilters(filters),
            this.readModelRepo.countWithFilters(filters),
        ]);
        // Map to DTOs with snake_case field names (REST API convention)
        const appointmentDTOs = appointments.map((readModel) => ({
            appointment_id: readModel.appointmentId,
            appointment_date: readModel.appointmentDate.toISOString().split("T")[0],
            appointment_time: readModel.appointmentTime,
            duration_minutes: readModel.durationMinutes,
            type: readModel.type,
            priority: readModel.priority,
            status: readModel.status,
            payment_status: readModel.paymentStatus,
            patient_id: readModel.patientId,
            patient_full_name: readModel.patientFullName,
            patient_phone: readModel.patientPhone,
            doctor_id: readModel.doctorId,
            doctor_full_name: readModel.doctorFullName,
            doctor_specialization: readModel.doctorSpecialization,
            consultation_fee: readModel.consultationFee, // Billing reference only
            created_at: readModel.createdAt.toISOString(),
        }));
        // Calculate total pages
        const totalPages = Math.ceil(total / pageSize);
        return {
            appointments: appointmentDTOs,
            total,
            page,
            pageSize,
            totalPages,
        };
    }
}
exports.ListAppointmentsQuery = ListAppointmentsQuery;
//# sourceMappingURL=ListAppointmentsQuery.js.map