export interface AuditLogDTO {
  id: string;
  recordId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface CreateAuditLogDTO {
  recordId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
}
