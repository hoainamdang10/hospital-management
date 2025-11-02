/**
 * UpdateTreatmentPlanUseCase - Application Use Case
 * Handles updates to treatment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';
import {
  UpdateTreatmentPlanRequest,
  UpdateTreatmentPlanResponse,
  validateUpdateTreatmentPlanRequest,
} from '../dto/TreatmentPlanRequest';

export class UpdateTreatmentPlanUseCase
  implements IUseCase<UpdateTreatmentPlanRequest, UpdateTreatmentPlanResponse>
{
  constructor(private readonly treatmentPlanRepository: ITreatmentPlanRepository) {}

  async execute(request: UpdateTreatmentPlanRequest): Promise<UpdateTreatmentPlanResponse> {
    // Validate input
    const validation = validateUpdateTreatmentPlanRequest(request);
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

    const updatedFields: string[] = [];

    // Add treatment item
    if (request.addTreatmentItem) {
      treatmentPlan.addTreatmentItem(request.addTreatmentItem, request.updatedBy);
      updatedFields.push('treatmentItems');
    }

    // Update treatment item status
    if (request.updateItemStatus) {
      treatmentPlan.updateTreatmentItemStatus(
        request.updateItemStatus.itemId,
        request.updateItemStatus.newStatus,
        request.updatedBy,
        request.updateItemStatus.notes
      );
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

  async authorize(request: UpdateTreatmentPlanRequest, userId: string): Promise<boolean> {
    return request.updatedBy === userId;
  }

  involvesPHI(request: UpdateTreatmentPlanRequest): boolean {
    return true;
  }

  getPatientId(request: UpdateTreatmentPlanRequest): string | null {
    return null;
  }
}
