export interface MedicalRecordHistory {
  historyId: string;
  action: string;
  actorId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  historyType: 'audit_log' | 'version';
}
