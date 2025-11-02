"use strict";
/**
 * GetTreatmentPlanUseCase - Application Use Case
 * Retrieves treatment plan by ID with HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTreatmentPlanUseCase = void 0;
const TreatmentPlanId_1 = require("../../domain/value-objects/TreatmentPlanId");
const TreatmentPlanRequest_1 = require("../dto/TreatmentPlanRequest");
const TreatmentPlan_aggregate_1 = require("../../domain/aggregates/TreatmentPlan.aggregate");
class GetTreatmentPlanUseCase {
    constructor(treatmentPlanRepository) {
        this.treatmentPlanRepository = treatmentPlanRepository;
    }
    async execute(request) {
        // Validate input
        const validation = (0, TreatmentPlanRequest_1.validateGetTreatmentPlanRequest)(request);
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
        // Record read access for HIPAA compliance
        treatmentPlan.recordReadAccess(request.accessedBy, request.accessPurpose, request.ipAddress, request.userAgent);
        // Update access log in repository
        await this.treatmentPlanRepository.save(treatmentPlan);
        // Calculate statistics
        const completedItemsCount = treatmentPlan.treatmentItems.filter(item => item.status === TreatmentPlan_aggregate_1.TreatmentItemStatus.COMPLETED).length;
        const totalItemsCount = treatmentPlan.treatmentItems.length;
        return {
            planId: treatmentPlan.planId.value,
            medicalRecordId: treatmentPlan.medicalRecordId,
            patientId: treatmentPlan.patientId,
            primaryDoctorId: treatmentPlan.primaryDoctorId,
            diagnosis: treatmentPlan.diagnosis,
            diagnosisCode: treatmentPlan.diagnosisCode,
            treatmentGoals: treatmentPlan.treatmentGoals,
            planDescription: treatmentPlan.planDescription,
            treatmentItems: treatmentPlan.treatmentItems,
            startDate: treatmentPlan.startDate.toISOString(),
            expectedEndDate: treatmentPlan.expectedEndDate?.toISOString(),
            actualEndDate: treatmentPlan.actualEndDate?.toISOString(),
            progressNotes: treatmentPlan.progressNotes,
            currentProgress: treatmentPlan.currentProgress,
            patientConsent: treatmentPlan.patientConsent,
            consentDate: treatmentPlan.consentDate?.toISOString(),
            consentBy: treatmentPlan.consentBy,
            consultingDoctors: treatmentPlan.consultingDoctors,
            status: treatmentPlan.status,
            createdAt: treatmentPlan.createdAt.toISOString(),
            updatedAt: treatmentPlan.updatedAt.toISOString(),
            createdBy: treatmentPlan.createdBy,
            updatedBy: treatmentPlan.updatedBy,
            completedItemsCount,
            totalItemsCount,
        };
    }
    async authorize(request, userId) {
        return request.accessedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return null;
    }
}
exports.GetTreatmentPlanUseCase = GetTreatmentPlanUseCase;
//# sourceMappingURL=GetTreatmentPlanUseCase.js.map