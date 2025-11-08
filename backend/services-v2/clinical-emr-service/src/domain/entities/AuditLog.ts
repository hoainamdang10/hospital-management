import { randomUUID } from "crypto";

export interface AuditLogProps {
  id: string;
  recordId: string;
  actorId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class AuditLog {
  private props: AuditLogProps;

  private constructor(props: AuditLogProps) {
    this.props = props;
  }

  static create(
    initial: Omit<AuditLogProps, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ) {
    return new AuditLog({
      ...initial,
      id: initial.id ?? randomUUID(),
      createdAt: initial.createdAt ?? new Date(),
    });
  }

  toJSON() {
    return this.props;
  }
}
