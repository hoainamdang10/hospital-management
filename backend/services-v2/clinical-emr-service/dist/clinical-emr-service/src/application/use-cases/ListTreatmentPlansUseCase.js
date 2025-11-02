"use strict";
/**
 * ListTreatmentPlansUseCase - Application Use Case
 * Lists treatment plans with filtering and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTreatmentPlansUseCase = void 0;
const TreatmentPlanRequest_1 = require("../dto/TreatmentPlanRequest");
const TreatmentPlan_aggregate_1 = require("../../domain/aggregates/TreatmentPlan.aggregate");
class ListTreatmentPlansUseCase {
    constructor(treatmentPlanRepository) {
        this.treatmentPlanRepository = treatmentPlanRepository;
    }
    async execute(request) {
        // Validate input
        const validation = (0, TreatmentPlanRequest_1.validateListTreatmentPlansRequest)(request);
        if (!validation.valid) {
            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
        // Default pagination
        const limit = request.limit || 20;
        const offset = request.offset || 0;
        // Parse dates
        const fromDate = request.fromDate ? new Date(request.fromDate) : undefined;
        const toDate = request.toDate ? new Date(request.toDate) : undefined;
        // Build search filters
        const filters = {
            patientId: request.patientId,
            medicalRecordId: request.medicalRecordId,
            primaryDoctorId: request.primaryDoctorId,
            consultingDoctorId: request.consultingDoctorId,
            status: request.status,
            statuses: request.statuses,
            diagnosis: request.diagnosis,
            diagnosisCode: request.diagnosisCode,
            fromDate,
            toDate,
            hasConsent: request.hasConsent,
            minProgress: request.minProgress,
            maxProgress: request.maxProgress,
            limit,
            offset,
        };
        // Search treatment plans
        const treatmentPlans = await this.treatmentPlanRepository.search(filters);
        // Get total count
        const total = await this.treatmentPlanRepository.count(filters);
        // Map to summary DTOs
        const plans = treatmentPlans.map(plan => {
            const completedItemsCount = plan.treatmentItems.filter(item => item.status === TreatmentPlan_aggregate_1.TreatmentItemStatus.COMPLETED).length;
            const treatmentItemsCount = plan.treatmentItems.length;
            return {
                planId: plan.planId.value,
                medicalRecordId: plan.medicalRecordId,
                patientId: plan.patientId,
                primaryDoctorId: plan.primaryDoctorId,
                diagnosis: plan.diagnosis,
                treatmentGoals: plan.treatmentGoals,
                startDate: plan.startDate.toISOString(),
                expectedEndDate: plan.expectedEndDate?.toISOString(),
                actualEndDate: plan.actualEndDate?.toISOString(),
                currentProgress: plan.currentProgress,
                patientConsent: plan.patientConsent,
                status: plan.status,
                treatmentItemsCount,
                completedItemsCount,
                createdAt: plan.createdAt.toISOString(),
                updatedAt: plan.updatedAt.toISOString(),
            };
        });
        return {
            plans,
            total,
            limit,
            offset,
        };
    }
    async authorize(request, userId) {
        return request.accessedBy === userId;
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        return request.patientId || null;
    }
}
exports.ListTreatmentPlansUseCase = ListTreatmentPlansUseCase;
//# sourceMappingURL=ListTreatmentPlansUseCase.js.map