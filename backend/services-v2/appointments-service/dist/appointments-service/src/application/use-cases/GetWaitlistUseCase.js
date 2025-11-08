"use strict";
/**
 * GetWaitlistUseCase - Application Layer
 * Retrieves waitlist entries with filters
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetWaitlistUseCase = void 0;
const AppointmentWaitlist_entity_1 = require("../../domain/entities/AppointmentWaitlist.entity");
/**
 * Use case for retrieving waitlist entries
 */
class GetWaitlistUseCase {
    constructor(waitlistRepository) {
        this.waitlistRepository = waitlistRepository;
    }
    async execute(query) {
        try {
            // Build filter criteria
            const criteria = {
                patientId: query.patientId,
                doctorId: query.doctorId,
                departmentId: query.departmentId,
                date: query.date,
                appointmentType: query.appointmentType,
                priority: query.priority,
                status: query.status,
                isExpired: query.isExpired
            };
            // Get entries
            const entries = await this.waitlistRepository.findWithFilters(criteria, query.limit || 50, query.offset || 0);
            // Get total count
            const total = await this.waitlistRepository.count(criteria);
            // Map to DTOs with position
            const entryDTOs = await Promise.all(entries.map(async (entry) => {
                let position;
                // Get position only for WAITING entries
                if (entry.status === AppointmentWaitlist_entity_1.WaitlistStatus.WAITING) {
                    try {
                        position = await this.waitlistRepository.getWaitlistPosition(entry.waitlistId);
                    }
                    catch (error) {
                        // Ignore position errors
                        position = undefined;
                    }
                }
                return {
                    waitlistId: entry.waitlistId,
                    patientId: entry.patientId,
                    preferredDoctorId: entry.preferredDoctorId,
                    preferredDepartmentId: entry.preferredDepartmentId,
                    preferredDate: entry.preferredDate?.toISOString().split('T')[0],
                    preferredTimeSlot: entry.preferredTimeSlot,
                    appointmentType: entry.appointmentType,
                    priority: entry.priority,
                    status: entry.status,
                    notes: entry.notes,
                    reason: entry.reason,
                    isFlexibleDate: entry.isFlexibleDate,
                    isFlexibleTime: entry.isFlexibleTime,
                    isFlexibleDoctor: entry.isFlexibleDoctor,
                    matchedAppointmentId: entry.matchedAppointmentId,
                    matchedAt: entry.matchedAt?.toISOString(),
                    expiresAt: entry.expiresAt?.toISOString(),
                    contactPhone: entry.contactPhone,
                    contactEmail: entry.contactEmail,
                    preferredContactMethod: entry.preferredContactMethod,
                    createdAt: entry.createdAt.toISOString(),
                    updatedAt: entry.updatedAt.toISOString(),
                    position
                };
            }));
            return {
                success: true,
                entries: entryDTOs,
                total
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message || 'Failed to retrieve waitlist'
            };
        }
    }
}
exports.GetWaitlistUseCase = GetWaitlistUseCase;
//# sourceMappingURL=GetWaitlistUseCase.js.map