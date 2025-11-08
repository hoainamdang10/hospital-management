import { AuditLogProps } from "../entities/AuditLog";
import { PaginationParams } from "../../shared/types/pagination";

export interface IAuditLogRepository {
  log(entry: AuditLogProps): Promise<void>;
  listByRecord(
    recordId: string,
    pagination: PaginationParams,
  ): Promise<AuditLogProps[]>;
}
