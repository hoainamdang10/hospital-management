import Joi from 'joi';
import { IUseCase } from '../interfaces/IUseCase';
import { IAuditLogRepository } from '../../domain/repositories/IAuditLogRepository';
import { AuditLog } from '../../domain/entities/AuditLog';
import { AuditLogDTO, CreateAuditLogDTO } from '../dto/AuditLogDTO';
import { mappers } from '../dto/mappers';

const schema = Joi.object<CreateAuditLogDTO>({
  recordId: Joi.string().uuid().required(),
  actorId: Joi.string().uuid().required(),
  action: Joi.string().required(),
  metadata: Joi.object().optional(),
});

export class CreateAuditLogUseCase implements IUseCase<CreateAuditLogDTO, AuditLogDTO> {
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(request: CreateAuditLogDTO): Promise<AuditLogDTO> {
    const payload = await schema.validateAsync(request, { abortEarly: false });
    const entity = AuditLog.create({
      recordId: payload.recordId,
      actorId: payload.actorId,
      action: payload.action,
      metadata: payload.metadata,
    });
    await this.repository.log(entity.toJSON());
    return mappers.auditLog(entity.toJSON());
  }
}
