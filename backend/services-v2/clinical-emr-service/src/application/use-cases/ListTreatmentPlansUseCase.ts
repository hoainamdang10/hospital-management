import { IUseCase } from "../interfaces/IUseCase";
import { ITreatmentPlanRepository } from "../../domain/repositories/ITreatmentPlanRepository";
import { TreatmentPlanDTO } from "../dto/TreatmentPlanDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListTreatmentPlansUseCase
  implements
    IUseCase<
      { recordId: string } & Partial<PaginationParams>,
      TreatmentPlanDTO[]
    >
{
  constructor(private readonly repository: ITreatmentPlanRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<TreatmentPlanDTO[]> {
    const { page = 1, limit = 20 } = request;
    const plans = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return plans.map((plan) => mappers.treatmentPlan(plan));
  }
}
