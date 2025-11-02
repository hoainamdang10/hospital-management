/**
 * CompleteTreatmentPlanUseCase - Application Use Case
 * Marks treatment plan as completed
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';
import {
  CompleteTreatmentPlanRequest,
  CompleteTreatmentPlanResponse,
  validateCompleteTreatmentPlanRequest,
} from '../dto/TreatmentPlanRequest';

export class CompleteTreatmentPlanUseCase
  implements IUseCase<CompleteTreatmentPlanRequest, CompleteTreatmentPlanResponse>
{
  constructor(private readonly treatmentPlanRepository: ITreatmentPlanRepository) {}

  async execute(request: CompleteTreatmentPlanRequest): Promise<CompleteTreatmentPlanResponse> {
    // Validate input
    const validation = validateCompleteTreatmentPlanRequest(request);
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

    // Complete treatment plan
    treatmentPlan.complete(request.completedBy, request.completionNotes);

    // Save updated aggregate
    await this.treatmentPlanRepository.save(treatmentPlan);

    return {
      planId: request.planId,
      status: treatmentPlan.status,
      completedAt: treatmentPlan.actualEndDate!.toISOString(),
      message: 'Hoàn thành kế hoạch điều trị thành công',
    };
  }

  async authorize(request: CompleteTreatmentPlanRequest, userId: string): Promise<boolean> {
    return request.completedBy === userId;
  }

  involvesPHI(request: CompleteTreatmentPlanRequest): boolean {
    return true;
  }

  getPatientId(request: CompleteTreatmentPlanRequest): string | null {
    return null;
  }
}
