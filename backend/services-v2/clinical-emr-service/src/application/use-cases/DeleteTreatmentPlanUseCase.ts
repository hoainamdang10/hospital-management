import { IUseCase } from "../interfaces/IUseCase";
import { ITreatmentPlanRepository } from "../../domain/repositories/ITreatmentPlanRepository";

interface DeleteTreatmentPlanRequest {
  recordId: string;
  planId: string;
}

export class DeleteTreatmentPlanUseCase
  implements IUseCase<DeleteTreatmentPlanRequest, void>
{
  constructor(private readonly repository: ITreatmentPlanRepository) {}

  async execute({
    recordId,
    planId,
  }: DeleteTreatmentPlanRequest): Promise<void> {
    await this.repository.delete(recordId, planId);
  }
}
