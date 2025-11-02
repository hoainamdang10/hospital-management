"use strict";
/**
 * Leave Queue Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveQueueUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const IAuthorizationService_1 = require("../services/IAuthorizationService");
/**
 * Leave Queue Use Case
 *
 * Business Rules:
 * 1. Patient can leave queue voluntarily
 * 2. Removes patient from queue
 * 3. Reorders remaining patients
 * 4. Recalculates wait times
 */
class LeaveQueueUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(queueRepository, authorizationService) {
        super();
        this.queueRepository = queueRepository;
        this.authorizationService = authorizationService;
    }
    async executeInternal(request) {
        try {
            // 1. Authorization check
            const canLeave = await this.authorizationService.canLeaveQueue(request.leftBy, request.patientId);
            if (!canLeave) {
                throw new IAuthorizationService_1.AuthorizationError('You are not authorized to remove this patient from queue', request.leftBy, 'leave_queue', request.patientId);
            }
            // 2. Get queue for today
            const today = new Date();
            const queue = await this.queueRepository.findByDoctorAndDate(request.doctorId, today);
            if (!queue) {
                return {
                    success: false,
                    message: 'Không tìm thấy hàng chờ',
                    errors: ['Queue not found']
                };
            }
            // 2. Check if patient is in queue
            if (!queue.hasPatient(request.patientId)) {
                return {
                    success: false,
                    message: 'Bệnh nhân không có trong hàng chờ',
                    errors: ['Patient not in queue']
                };
            }
            // 3. Remove patient (Queue Aggregate handles reordering)
            const reason = request.reason || 'Patient left queue';
            queue.removePatient(request.patientId, reason, request.leftBy);
            // 4. Save queue aggregate
            await this.queueRepository.save(queue);
            return {
                success: true,
                message: 'Đã rời khỏi hàng chờ'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Không thể rời khỏi hàng chờ',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    async authorize(request, userId) {
        // Authorization enforced in executeInternal() via authorizationService.canLeaveQueue()
        return !!userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId;
    }
}
exports.LeaveQueueUseCase = LeaveQueueUseCase;
//# sourceMappingURL=LeaveQueue.use-case.js.map