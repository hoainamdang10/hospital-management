import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlan } from '../../domain/entities/TreatmentPlan';
import { TreatmentPlanDTO, CreateTreatmentPlanDTO } from '../dto/TreatmentPlanDTO';
import { mappers } from '../dto/mappers';

const taskSchema = Joi.object({
  description: Joi.string().required(),
  type: Joi.string().valid('medication', 'procedure', 'therapy').required(),
  status: Joi.string().valid('pending', 'in_progress', 'completed').required(),
});

const schema = Joi.object<CreateTreatmentPlanDTO>({
  recordId: Joi.string().uuid().required(),
  summary: Joi.string().required(),
  tasks: Joi.array().items(taskSchema).min(1).required(),
});

export class CreateTreatmentPlanUseCase implements IUseCase<CreateTreatmentPlanDTO, TreatmentPlanDTO> {
  constructor(private readonly repository: ITreatmentPlanRepository) {}

  async execute(request: CreateTreatmentPlanDTO): Promise<TreatmentPlanDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = TreatmentPlan.create({
      recordId: payload.recordId,
      summary: payload.summary,
      tasks: payload.tasks,
      status: 'draft',
    });
    const persisted = await this.repository.save(entity.toJSON());
    return mappers.treatmentPlan(persisted);
  }
}
