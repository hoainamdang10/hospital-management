/**
 * UserDeletedEvent Domain Event
 * Fired khi tài khoản bị xóa vĩnh viễn (hard delete)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { DomainEvent } from "@shared/domain/base/domain-event";
import { UserId } from "../value-objects/UserId";

export class UserDeletedEvent extends DomainEvent {
  constructor(
    public readonly userIdVO: UserId,
    public readonly deletedBy: string,
    public readonly reason: string,
    public readonly userEmail: string,
  ) {
    super(
      "UserDeleted",
      userIdVO.value,
      "User",
      { deletedBy, reason, email: userEmail },
      1,
      undefined,
      undefined,
      deletedBy,
      {
        priority: "critical",
        publishExternal: true,
        tags: ["compliance", "gdpr"],
      },
    );
  }

  getEventData(): Record<string, unknown> {
    return {
      userId: this.userIdVO.value,
      deletedBy: this.deletedBy,
      reason: this.reason,
      email: this.userEmail,
      deletedAt: this.occurredAt,
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return null;
  }
}
