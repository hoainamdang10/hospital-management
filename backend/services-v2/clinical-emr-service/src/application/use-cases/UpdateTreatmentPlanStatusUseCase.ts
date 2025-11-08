import Joi from "joi";
import { IUseCase } from "../interfaces/IUseCase";
import { ITreatmentPlanRepository } from "../../domain/repositories/ITreatmentPlanRepository";
import {
  TreatmentPlanDTO,
  UpdateTreatmentPlanStatusDTO,
} from "../dto/TreatmentPlanDTO";
import { TreatmentPlan } from "../../domain/entities/TreatmentPlan";
import { ApplicationError } from "../errors/ApplicationError";
import { mappers } from "../dto/mappers";

const schema = Joi.object<UpdateTreatmentPlanStatusDTO>({
  planId: Joi.string().uuid().required(),
  recordId: Joi.string().uuid().required(),
  status: Joi.string().valid("draft", "active", "completed").required(),
});

export class UpdateTreatmentPlanStatusUseCase
  implements IUseCase<UpdateTreatmentPlanStatusDTO, TreatmentPlanDTO>
{
  constructor(private readonly repository: ITreatmentPlanRepository) {}

  async execute(
    request: UpdateTreatmentPlanStatusDTO,
  ): Promise<TreatmentPlanDTO> {
    const payload = await schema.validateAsync(request);
    const existing = await this.repository.getById(payload.planId);
    if (!existing) {
      throw new ApplicationError(404, "Không tìm thấy treatment plan");
    }

    if (existing.recordId !== payload.recordId) {
      throw new ApplicationError(403, "Plan không thuộc hồ sơ này");
    }

    const entity = TreatmentPlan.create(existing);
    entity.update({ status: payload.status });
    const persisted = await this.repository.update(entity.toJSON());
    return mappers.treatmentPlan(persisted);
  }
}
