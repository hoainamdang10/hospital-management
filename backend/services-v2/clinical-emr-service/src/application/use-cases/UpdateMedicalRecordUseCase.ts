import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecord, MedicalRecordStatus } from '../../domain/entities/MedicalRecord';
import { MedicalRecordDTO, UpdateMedicalRecordDTO } from '../dto/MedicalRecordDTO';
import { ApplicationError } from '../errors/ApplicationError';
import { mappers } from '../dto/mappers';

const schema = Joi.object<UpdateMedicalRecordDTO>({
  patientId: Joi.string().uuid(),
  doctorId: Joi.string().uuid(),
  encounterType: Joi.string().valid('inpatient', 'outpatient'),
  encounterDate: Joi.date().iso(),
  diagnosis: Joi.object({
    primary: Joi.string().required(),
    secondary: Joi.array().items(Joi.string()).optional(),
  }),
  treatmentSummary: Joi.string().allow('', null),
  vitalSigns: Joi.object({
    temperature: Joi.number(),
    heartRate: Joi.number(),
    respiratoryRate: Joi.number(),
    systolic: Joi.number(),
    diastolic: Joi.number(),
    spo2: Joi.number(),
  }),
  status: Joi.string().valid('draft', 'final', 'archived'),
});

export class UpdateMedicalRecordUseCase implements IUseCase<{ id: string; payload: UpdateMedicalRecordDTO }, MedicalRecordDTO> {
  constructor(private readonly repository: IMedicalRecordRepository) {}

  async execute({ id, payload }: { id: string; payload: UpdateMedicalRecordDTO }): Promise<MedicalRecordDTO> {
    if (!id) {
      throw new ApplicationError(400, 'recordId là bắt buộc');
    }

    const value = await schema.validateAsync(payload, { abortEarly: false });
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new ApplicationError(404, 'Không tìm thấy hồ sơ');
    }

    const entity = MedicalRecord.create(existing);
    entity.update({
      patientId: value.patientId ?? existing.patientId,
      doctorId: value.doctorId ?? existing.doctorId,
      encounterType: value.encounterType ?? existing.encounterType,
      encounterDate: value.encounterDate ? new Date(value.encounterDate) : existing.encounterDate,
      diagnosis: value.diagnosis ?? existing.diagnosis,
      treatmentSummary: value.treatmentSummary ?? existing.treatmentSummary,
      vitalSigns: value.vitalSigns ?? existing.vitalSigns,
      status: (value.status ?? existing.status) as MedicalRecordStatus,
    });

    const persisted = await this.repository.update(entity);
    return mappers.medicalRecord(persisted);
  }
}
