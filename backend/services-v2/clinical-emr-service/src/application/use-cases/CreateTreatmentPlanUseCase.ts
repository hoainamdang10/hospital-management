/**
 * CreateTreatmentPlanUseCase - Application Use Case
 * Handles creation of new treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanAggregate } from '../../domain/aggregates/TreatmentPlan.aggregate';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';
import {
  CreateTreatmentPlanRequest,
  CreateTreatmentPlanResponse,
  validateCreateTreatmentPlanRequest,
} from '../dto/TreatmentPlanRequest';

export class CreateTreatmentPlanUseCase
  implements IUseCase<CreateTreatmentPlanRequest, CreateTreatmentPlanResponse>
{
  constructor(private readonly treatmentPlanRepository: ITreatmentPlanRepository) {}

  async execute(request: CreateTreatmentPlanRequest): Promise<CreateTreatmentPlanResponse> {
    // Validate input
    const validation = validateCreateTreatmentPlanRequest(request);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate new TreatmentPlanId
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const sequence = await this.treatmentPlanRepository.getNextSequence(yearMonth);
    const planId = TreatmentPlanId.generate(sequence);

    // Parse dates
    const startDate = new Date(request.startDate);
    const expectedEndDate = request.expectedEndDate ? new Date(request.expectedEndDate) : undefined;
    const consentDate = request.consentDate ? new Date(request.consentDate) : undefined;

    // Create aggregate
    const treatmentPlan = TreatmentPlanAggregate.create(
      planId,
      request.medicalRecordId,
      request.patientId,
      request.primaryDoctorId,
      request.diagnosis,
      request.treatmentGoals,
      startDate,
      request.createdBy,
      {
        diagnosisCode: request.diagnosisCode,
        planDescription: request.planDescription,
        expectedEndDate,
        patientConsent: request.patientConsent,
        consentDate,
        consentBy: request.consentBy,
        consultingDoctors: request.consultingDoctors,
      }
    );

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

  async authorize(request: CreateTreatmentPlanRequest, userId: string): Promise<boolean> {
    return request.primaryDoctorId === userId || request.createdBy === userId;
  }

  involvesPHI(request: CreateTreatmentPlanRequest): boolean {
    return true;
  }

  getPatientId(request: CreateTreatmentPlanRequest): string | null {
    return request.patientId || null;
  }
}
