/**
 * ListTreatmentPlansUseCase - Application Use Case
 * Lists treatment plans with filtering and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import {
  ListTreatmentPlansRequest,
  ListTreatmentPlansResponse,
  TreatmentPlanSummaryDTO,
  validateListTreatmentPlansRequest,
} from '../dto/TreatmentPlanRequest';
import { TreatmentItemStatus } from '../../domain/aggregates/TreatmentPlan.aggregate';

export class ListTreatmentPlansUseCase
  implements IUseCase<ListTreatmentPlansRequest, ListTreatmentPlansResponse>
{
  constructor(private readonly treatmentPlanRepository: ITreatmentPlanRepository) {}

  async execute(request: ListTreatmentPlansRequest): Promise<ListTreatmentPlansResponse> {
    // Validate input
    const validation = validateListTreatmentPlansRequest(request);
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
    const plans: TreatmentPlanSummaryDTO[] = treatmentPlans.map(plan => {
      const completedItemsCount = plan.treatmentItems.filter(
        item => item.status === TreatmentItemStatus.COMPLETED
      ).length;
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

  async authorize(request: ListTreatmentPlansRequest, userId: string): Promise<boolean> {
    return request.accessedBy === userId;
  }

  involvesPHI(request: ListTreatmentPlansRequest): boolean {
    return true;
  }

  getPatientId(request: ListTreatmentPlansRequest): string | null {
    return request.patientId || null;
  }
}
