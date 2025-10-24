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
            offset
        };
        // Query read model
        const [appointments, total] = await Promise.all([
            this.readModelRepo.findWithFilters(filters),
            this.readModelRepo.countWithFilters(filters)
        ]);
        // Map to DTOs
        const appointmentDTOs = appointments.map(readModel => ({
            appointmentId: readModel.appointmentId,
            appointmentDate: readModel.appointmentDate.toISOString().split('T')[0],
            appointmentTime: readModel.appointmentTime,
            durationMinutes: readModel.durationMinutes,
            type: readModel.type,
            priority: readModel.priority,
            status: readModel.status,
            patientId: readModel.patientId,
            patientFullName: readModel.patientFullName,
            patientPhone: readModel.patientPhone,
            doctorId: readModel.doctorId,
            doctorFullName: readModel.doctorFullName,
            doctorSpecialization: readModel.doctorSpecialization,
            consultationFee: readModel.consultationFee,
            paymentStatus: readModel.paymentStatus,
            createdAt: readModel.createdAt.toISOString()
        }));
        // Calculate total pages
        const totalPages = Math.ceil(total / pageSize);
        return {
            appointments: appointmentDTOs,
            total,
            page,
            pageSize,
            totalPages
        };
    }
}
exports.ListAppointmentsQuery = ListAppointmentsQuery;
//# sourceMappingURL=ListAppointmentsQuery.js.map