import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IImagingStudyRepository } from '../../domain/repositories/IImagingStudyRepository';
import { ImagingStudy } from '../../domain/entities/ImagingStudy';
import { ImagingStudyDTO, CreateImagingStudyDTO } from '../dto/ImagingStudyDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreateImagingStudyDTO>({
  recordId: Joi.string().uuid().required(),
  modality: Joi.string().valid('xray', 'ct', 'mri', 'ultrasound', 'other').required(),
  bodyRegion: Joi.string().allow('', null),
  findings: Joi.string().allow('', null),
  impression: Joi.string().allow('', null),
  imageUrls: Joi.array().items(Joi.string().uri()),
});

export class CreateImagingStudyUseCase implements IUseCase<CreateImagingStudyDTO, ImagingStudyDTO> {
  constructor(private readonly repository: IImagingStudyRepository) {}

  async execute(request: CreateImagingStudyDTO): Promise<ImagingStudyDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = ImagingStudy.create({
      recordId: payload.recordId,
      modality: payload.modality,
      bodyRegion: payload.bodyRegion,
      findings: payload.findings,
      impression: payload.impression,
      imageUrls: payload.imageUrls,
    });
    const persisted = await this.repository.save(entity.toJSON());
    return mappers.imagingStudy(persisted);
  }
}
