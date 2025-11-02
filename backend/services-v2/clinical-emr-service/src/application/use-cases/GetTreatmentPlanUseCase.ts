/**
 * GetTreatmentPlanUseCase - Application Use Case
 * Retrieves treatment plan by ID with HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';
import {
  GetTreatmentPlanRequest,
  GetTreatmentPlanResponse,
  validateGetTreatmentPlanRequest,
} from '../dto/TreatmentPlanRequest';
import { TreatmentItemStatus } from '../../domain/aggregates/TreatmentPlan.aggregate';

export class GetTreatmentPlanUseCase
  implements IUseCase<GetTreatmentPlanRequest, GetTreatmentPlanResponse>
{
  constructor(private readonly treatmentPlanRepository: ITreatmentPlanRepository) {}

  async execute(request: GetTreatmentPlanRequest): Promise<GetTreatmentPlanResponse> {
    // Validate input
    const validation = validateGetTreatmentPlanRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Parse TreatmentPlanId
    const planId = TreatmentPlanId.create(request.planId);

    // Find treatment plan
    const treatmentPlan = await this.treatmentPlanRepository.findById(planId);
    if (!treatmentPlan) {
      throw new Error(`Không tìm thấy kế hoạch điều trị với ID ${request.planId}`);
    }

    // Record read access for HIPAA compliance
    treatmentPlan.recordReadAccess(
      request.accessedBy,
      request.accessPurpose,
      request.ipAddress,
      request.userAgent
    );

    // Update access log in repository
    await this.treatmentPlanRepository.save(treatmentPlan);

    // Calculate statistics
    const completedItemsCount = treatmentPlan.treatmentItems.filter(
      item => item.status === TreatmentItemStatus.COMPLETED
    ).length;
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

  async authorize(request: GetTreatmentPlanRequest, userId: string): Promise<boolean> {
    return request.accessedBy === userId;
  }

  involvesPHI(request: GetTreatmentPlanRequest): boolean {
    return true;
  }

  getPatientId(request: GetTreatmentPlanRequest): string | null {
    return null;
  }
}
