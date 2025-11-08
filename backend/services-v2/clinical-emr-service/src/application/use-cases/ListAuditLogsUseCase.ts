import { IUseCase } from "../interfaces/IUseCase";
import { IAuditLogRepository } from "../../domain/repositories/IAuditLogRepository";
import { AuditLogDTO } from "../dto/AuditLogDTO";
import { mappers } from "../dto/mappers";
import { PaginationParams } from "../../shared/types/pagination";

export class ListAuditLogsUseCase
  implements
    IUseCase<{ recordId: string } & Partial<PaginationParams>, AuditLogDTO[]>
{
  constructor(private readonly repository: IAuditLogRepository) {}

  async execute(
    request: { recordId: string } & Partial<PaginationParams>,
  ): Promise<AuditLogDTO[]> {
    const { page = 1, limit = 20 } = request;
    const entries = await this.repository.listByRecord(request.recordId, {
      page,
      limit,
    });
    return entries.map((log) => mappers.auditLog(log));
  }
}
