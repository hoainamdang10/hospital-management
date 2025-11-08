import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecord } from '../../domain/entities/MedicalRecord';
import { MedicalRecordDTO, CreateMedicalRecordDTO } from '../dto/MedicalRecordDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreateMedicalRecordDTO>({
  patientId: Joi.string().uuid().required(),
  doctorId: Joi.string().uuid().required(),
  encounterType: Joi.string().valid('inpatient', 'outpatient').required(),
  encounterDate: Joi.date().iso().required(),
  diagnosis: Joi.object({
    primary: Joi.string().required(),
    secondary: Joi.array().items(Joi.string()).optional(),
  }).required(),
  treatmentSummary: Joi.string().allow('', null),
  vitalSigns: Joi.object({
    temperature: Joi.number(),
    heartRate: Joi.number(),
    respiratoryRate: Joi.number(),
    systolic: Joi.number(),
    diastolic: Joi.number(),
    spo2: Joi.number(),
  }).optional(),
});

export class CreateMedicalRecordUseCase implements IUseCase<CreateMedicalRecordDTO, MedicalRecordDTO> {
  constructor(private readonly repository: IMedicalRecordRepository) {}

  async execute(request: CreateMedicalRecordDTO): Promise<MedicalRecordDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });

    const entity = MedicalRecord.create({
      patientId: payload.patientId,
      doctorId: payload.doctorId,
      encounterType: payload.encounterType,
      encounterDate: new Date(payload.encounterDate),
      diagnosis: payload.diagnosis,
      treatmentSummary: payload.treatmentSummary,
      vitalSigns: payload.vitalSigns,
      status: 'draft',
    });

    const persisted = await this.repository.save(entity);
    return mappers.medicalRecord(persisted);
  }
}
