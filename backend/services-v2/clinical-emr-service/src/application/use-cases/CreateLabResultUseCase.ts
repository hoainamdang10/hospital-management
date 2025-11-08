import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { ILabResultRepository } from '../../domain/repositories/ILabResultRepository';
import { LabResult } from '../../domain/entities/LabResult';
import { LabResultDTO, CreateLabResultDTO } from '../dto/LabResultDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreateLabResultDTO>({
  recordId: Joi.string().uuid().required(),
  testName: Joi.string().required(),
  category: Joi.string().valid('hematology', 'chemistry', 'immunology', 'microbiology', 'other').required(),
  resultValue: Joi.string().required(),
  unit: Joi.string().allow('', null),
  referenceRange: Joi.string().allow('', null),
  attachments: Joi.array().items(Joi.string().uri()),
});

export class CreateLabResultUseCase implements IUseCase<CreateLabResultDTO, LabResultDTO> {
  constructor(private readonly repository: ILabResultRepository) {}

  async execute(request: CreateLabResultDTO): Promise<LabResultDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = LabResult.create({
      recordId: payload.recordId,
      testName: payload.testName,
      category: payload.category,
      resultValue: payload.resultValue,
      unit: payload.unit,
      referenceRange: payload.referenceRange,
      status: 'completed',
      attachments: payload.attachments,
    });
    const persisted = await this.repository.save(entity.toJSON());
    return mappers.labResult(persisted);
  }
}
