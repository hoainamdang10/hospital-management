import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IPrescriptionRepository } from '../../domain/repositories/IPrescriptionRepository';
import { Prescription } from '../../domain/entities/Prescription';
import { PrescriptionDTO, CreatePrescriptionDTO } from '../dto/PrescriptionDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreatePrescriptionDTO>({
  recordId: Joi.string().uuid().required(),
  medicationName: Joi.string().required(),
  dosage: Joi.string().required(),
  frequency: Joi.string().required(),
  route: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().optional(),
  instructions: Joi.string().allow('', null),
});

export class CreatePrescriptionUseCase implements IUseCase<CreatePrescriptionDTO, PrescriptionDTO> {
  constructor(private readonly repository: IPrescriptionRepository) {}

  async execute(request: CreatePrescriptionDTO): Promise<PrescriptionDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = Prescription.create({
      recordId: payload.recordId,
      medicationName: payload.medicationName,
      dosage: payload.dosage,
      frequency: payload.frequency,
      route: payload.route,
      startDate: new Date(payload.startDate),
      endDate: payload.endDate ? new Date(payload.endDate) : undefined,
      instructions: payload.instructions,
      status: 'active',
    });
    const persisted = await this.repository.save(entity.toJSON());
    return mappers.prescription(persisted);
  }
}
