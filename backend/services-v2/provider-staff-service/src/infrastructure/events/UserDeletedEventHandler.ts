/**
 * UserDeletedEventHandler - Identity Service Event Consumer
 * Provider/Staff Service V2
 *
 * Handles UserDeleted events from Identity Service to hard delete staff profiles
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { ILogger } from "../../application/interfaces/ILogger";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";

export interface UserDeletedEventPayload {
  userId?: string;
  email?: string;
  deletedBy?: string;
  reason?: string;
  deletedAt?: string;
}

export class UserDeletedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
  ) {}

  /**
   * Handle UserDeleted event
   * Performs hard delete of staff profile tied to the identity user
   */
  async handle(event: UserDeletedEventPayload): Promise<void> {
    const userId = event.userId;

    if (!userId) {
      this.logger.warn("UserDeleted event missing userId, skipping", {
        event,
      });
      return;
    }

    try {
      this.logger.warn("Handling UserDeleted event for staff hard delete", {
        userId,
        deletedBy: event.deletedBy,
        reason: event.reason,
      });

      const result = await this.staffRepository.hardDeleteByUserId(userId, {
        deletedBy: event.deletedBy,
        reason: event.reason,
      });

      if (!result.deleted) {
        this.logger.warn("No staff profile deleted for UserDeleted event", {
          userId,
        });
        return;
      }

      this.logger.warn("Staff profile hard deleted after identity removal", {
        userId,
        staffId: result.staffId,
        deletedBy: event.deletedBy,
        deletedAt: event.deletedAt,
        reason: event.reason,
      });
    } catch (error) {
      this.logger.error("Error handling UserDeleted event", {
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
