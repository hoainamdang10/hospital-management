"use strict";
/**
 * CompleteTreatmentPlanUseCase - Application Use Case
 * Marks treatment plan as completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteTreatmentPlanUseCase = void 0;
const TreatmentPlanId_1 = require("../../domain/value-objects/TreatmentPlanId");
const TreatmentPlanRequest_1 = require("../dto/TreatmentPlanRequest");
class CompleteTreatmentPlanUseCase {
    constructor(treatmentPlanRepository) {
        this.treatmentPlanRepository = treatmentPlanRepository;
    }
    async execute(request) {
        // Validate input
        const validation = (0, TreatmentPlanRequest_1.validateCompleteTreatmentPlanRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Parse TreatmentPlanId
        const planId = TreatmentPlanId_1.TreatmentPlanId.create(request.planId);
        // Find treatment plan
        const treatmentPlan = await this.treatmentPlanRepository.findById(planId);
        if (!treatmentPlan) {
            throw new Error(`Không tìm thấy kế hoạch điều trị với ID ${request.planId}`);
        }
        // Complete treatment plan
        treatmentPlan.complete(request.completedBy, request.completionNotes);
        // Save updated aggregate
        await this.treatmentPlanRepository.save(treatmentPlan);
        return {
            planId: request.planId,
            status: treatmentPlan.status,
            completedAt: treatmentPlan.actualEndDate.toISOString(),
            message: 'Hoàn thành kế hoạch điều trị thành công',
        };
    }
    async authorize(request, userId) {
        return request.completedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.CompleteTreatmentPlanUseCase = CompleteTreatmentPlanUseCase;
//# sourceMappingURL=CompleteTreatmentPlanUseCase.js.map