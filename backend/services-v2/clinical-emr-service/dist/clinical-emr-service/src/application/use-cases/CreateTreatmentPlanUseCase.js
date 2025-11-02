"use strict";
/**
 * CreateTreatmentPlanUseCase - Application Use Case
 * Handles creation of new treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTreatmentPlanUseCase = void 0;
const TreatmentPlan_aggregate_1 = require("../../domain/aggregates/TreatmentPlan.aggregate");
const TreatmentPlanId_1 = require("../../domain/value-objects/TreatmentPlanId");
const TreatmentPlanRequest_1 = require("../dto/TreatmentPlanRequest");
class CreateTreatmentPlanUseCase {
    constructor(treatmentPlanRepository) {
        this.treatmentPlanRepository = treatmentPlanRepository;
    }
    async execute(request) {
        // Validate input
        const validation = (0, TreatmentPlanRequest_1.validateCreateTreatmentPlanRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Generate new TreatmentPlanId
        const now = new Date();
        const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
        const sequence = await this.treatmentPlanRepository.getNextSequence(yearMonth);
        const planId = TreatmentPlanId_1.TreatmentPlanId.generate(sequence);
        // Parse dates
        const startDate = new Date(request.startDate);
        const expectedEndDate = request.expectedEndDate ? new Date(request.expectedEndDate) : undefined;
        const consentDate = request.consentDate ? new Date(request.consentDate) : undefined;
        // Create aggregate
        const treatmentPlan = TreatmentPlan_aggregate_1.TreatmentPlanAggregate.create(planId, request.medicalRecordId, request.patientId, request.primaryDoctorId, request.diagnosis, request.treatmentGoals, startDate, request.createdBy, {
            diagnosisCode: request.diagnosisCode,
            planDescription: request.planDescription,
            expectedEndDate,
            patientConsent: request.patientConsent,
            consentDate,
            consentBy: request.consentBy,
            consultingDoctors: request.consultingDoctors,
        });
        // Add initial treatment items if provided
        if (request.treatmentItems && request.treatmentItems.length > 0) {
            for (const item of request.treatmentItems) {
                treatmentPlan.addTreatmentItem(item, request.createdBy);
            }
        }
        // Save to repository
        await this.treatmentPlanRepository.save(treatmentPlan);
        return {
            planId: planId.value,
            medicalRecordId: request.medicalRecordId,
            patientId: request.patientId,
            status: treatmentPlan.status,
            createdAt: treatmentPlan.createdAt.toISOString(),
            message: 'Tạo kế hoạch điều trị thành công',
        };
    }
    async authorize(request, userId) {
        return request.primaryDoctorId === userId || request.createdBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.CreateTreatmentPlanUseCase = CreateTreatmentPlanUseCase;
//# sourceMappingURL=CreateTreatmentPlanUseCase.js.map