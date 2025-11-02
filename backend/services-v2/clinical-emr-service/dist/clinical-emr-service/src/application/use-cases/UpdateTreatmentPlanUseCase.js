"use strict";
/**
 * UpdateTreatmentPlanUseCase - Application Use Case
 * Handles updates to treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTreatmentPlanUseCase = void 0;
const TreatmentPlanId_1 = require("../../domain/value-objects/TreatmentPlanId");
const TreatmentPlanRequest_1 = require("../dto/TreatmentPlanRequest");
class UpdateTreatmentPlanUseCase {
    constructor(treatmentPlanRepository) {
        this.treatmentPlanRepository = treatmentPlanRepository;
    }
    async execute(request) {
        // Validate input
        const validation = (0, TreatmentPlanRequest_1.validateUpdateTreatmentPlanRequest)(request);
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
        const updatedFields = [];
        // Add treatment item
        if (request.addTreatmentItem) {
            treatmentPlan.addTreatmentItem(request.addTreatmentItem, request.updatedBy);
            updatedFields.push('treatmentItems');
        }
        // Update treatment item status
        if (request.updateItemStatus) {
            treatmentPlan.updateTreatmentItemStatus(request.updateItemStatus.itemId, request.updateItemStatus.newStatus, request.updatedBy, request.updateItemStatus.notes);
            updatedFields.push('treatmentItemStatus');
        }
        // Grant consent
        if (request.grantConsent) {
            treatmentPlan.grantConsent(request.grantConsent.consentBy, request.updatedBy);
            updatedFields.push('patientConsent');
        }
        // Update progress notes
        if (request.progressNotes) {
            treatmentPlan.updateProgress(request.progressNotes, request.updatedBy);
            updatedFields.push('progressNotes');
        }
        // Note: planDescription, treatmentGoals, expectedEndDate, consultingDoctors
        // would require additional methods in the aggregate
        // For now, we handle the most critical updates
        // Save updated aggregate
        await this.treatmentPlanRepository.save(treatmentPlan);
        return {
            planId: request.planId,
            updatedFields,
            currentProgress: treatmentPlan.currentProgress,
            status: treatmentPlan.status,
            updatedAt: treatmentPlan.updatedAt.toISOString(),
            message: 'Cập nhật kế hoạch điều trị thành công',
        };
    }
    async authorize(request, userId) {
        return request.updatedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.UpdateTreatmentPlanUseCase = UpdateTreatmentPlanUseCase;
//# sourceMappingURL=UpdateTreatmentPlanUseCase.js.map