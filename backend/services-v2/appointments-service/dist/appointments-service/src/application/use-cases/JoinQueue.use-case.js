"use strict";
/**
 * Join Queue Use Case - Application Layer
 * Add patient to waiting queue for their appointment
 *
 * Refactored to use Queue Aggregate for business logic
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoinQueueUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const QueueEntry_entity_1 = require("../../domain/entities/QueueEntry.entity");
/**
 * Join Queue Use Case
 * Adds a patient to the waiting queue when they check in
 *
 * Business logic delegated to Queue Aggregate
 */
class JoinQueueUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(queueRepository) {
        super();
        this.queueRepository = queueRepository;
    }
    async executeInternal(request) {
        try {
            // 1. Validate request
            this.validateRequest(request);
            // 2. Get or create queue for today
            const today = request.checkInTime || new Date();
            const queue = await this.queueRepository.findOrCreateByDoctorAndDate(request.doctorId, today);
            // 3. Add patient to queue (Queue Aggregate handles all business logic)
            const priority = QueueEntry_entity_1.QueuePriority[request.priority];
            const entry = queue.addPatient(request.patientId, request.appointmentId, priority, today);
            // 4. Save queue aggregate (persists all changes)
            await this.queueRepository.save(queue);
            // 5. Return success response
            const positionInfo = queue.getPatientPosition(request.patientId);
            return {
                success: true,
                message: 'Đã vào hàng chờ thành công',
                queueEntry: {
                    queueId: entry.id,
                    queueNumber: entry.queueNumber,
                    estimatedWaitTime: positionInfo?.estimatedWaitMinutes || entry.estimatedWaitMinutes || 0,
                    position: positionInfo?.position || 0,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Không thể vào hàng chờ',
                errors: [error instanceof Error ? error.message : 'Unknown error'],
            };
        }
    }
    validateRequest(request) {
        const errors = [];
        if (!request.patientId)
            errors.push('Patient ID is required');
        if (!request.doctorId)
            errors.push('Doctor ID is required');
        if (!request.priority)
            errors.push('Priority is required');
        const validPriorities = ['EMERGENCY', 'URGENT', 'NORMAL', 'LOW'];
        if (request.priority && !validPriorities.includes(request.priority)) {
            errors.push(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
        }
        if (errors.length > 0) {
            throw new Error(errors.join(', '));
        }
    }
    async authorize(request, userId) {
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId;
    }
}
exports.JoinQueueUseCase = JoinQueueUseCase;
//# sourceMappingURL=JoinQueue.use-case.js.map