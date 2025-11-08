import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { ClinicalNote } from '../../domain/entities/ClinicalNote';
import { ClinicalNoteDTO, CreateClinicalNoteDTO } from '../dto/ClinicalNoteDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreateClinicalNoteDTO>({
  recordId: Joi.string().uuid().required(),
  authorId: Joi.string().uuid().required(),
  type: Joi.string().valid('soap', 'progress', 'discharge').required(),
  content: Joi.object().required(),
});

export class CreateClinicalNoteUseCase implements IUseCase<CreateClinicalNoteDTO, ClinicalNoteDTO> {
  constructor(private readonly repository: IClinicalNoteRepository) {}

  async execute(request: CreateClinicalNoteDTO): Promise<ClinicalNoteDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = ClinicalNote.create({
      recordId: payload.recordId,
      authorId: payload.authorId,
      type: payload.type,
      content: payload.content,
    });

    const persisted = await this.repository.save(entity.toJSON());
    return mappers.clinicalNote(persisted);
  }
}
