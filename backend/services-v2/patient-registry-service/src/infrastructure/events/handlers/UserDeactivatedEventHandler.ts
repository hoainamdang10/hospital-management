/**
 * UserDeactivatedEventHandler
 * Handles user.deactivated events from Identity Service
 *
 * Marks related patient records as inactive to keep lifecycle states in sync.
 */

import { ILogger } from "@shared/application/services/logger.interface";
import { IPatientRepository } from "../../../domain/repositories/IPatientRepository";
import { PatientStatus } from "../../../domain/value-objects/PatientStatus";

export interface UserDeactivatedEventData {
  userId?: string;
  deactivatedBy?: string;
  reason?: string;
  email?: string;
  role?: string;
  deactivatedAt?: string;
  eventData?: UserDeactivatedEventData;
}

type NormalizedUserDeactivatedEventData = {
  userId: string;
  deactivatedBy?: string;
  reason?: string;
  email?: string;
  role?: string;
  deactivatedAt?: string;
};

export class UserDeactivatedEventHandler {
  constructor(
    private logger: ILogger,
    private patientRepository: IPatientRepository,
  ) {}

  /**
   * Handle user.deactivated event
   */
  async handle(rawEventData: UserDeactivatedEventData): Promise<void> {
    try {
      const eventData = this.normalizeEventData(rawEventData);

      if (!eventData) {
        this.logger.warn("user.deactivated event missing userId, skipping", {
          raw: rawEventData,
        });
        return;
      }

      this.logger.info("Processing user.deactivated event", {
        userId: eventData.userId,
        deactivatedBy: eventData.deactivatedBy,
        reason: eventData.reason,
      });

      const updateResult = await this.patientRepository.updateStatusByUserId(
        eventData.userId,
        PatientStatus.INACTIVE,
        {
          updatedBy: eventData.deactivatedBy,
          reason: eventData.reason,
          source: "identity.user.deactivated",
        },
      );

      if (!updateResult.patientId) {
        this.logger.warn("No patient record found for deactivated user", {
          userId: eventData.userId,
        });
        return;
      }

      if (!updateResult.updated) {
        this.logger.info(
          "Patient already inactive when user.deactivated event arrived",
          {
            userId: eventData.userId,
            patientId: updateResult.patientId,
            previousStatus: updateResult.previousStatus,
          },
        );
        return;
      }

      this.logger.info(
        "Patient marked inactive via identity user deactivation",
        {
          userId: eventData.userId,
          patientId: updateResult.patientId,
          reason: eventData.reason,
          deactivatedBy: eventData.deactivatedBy,
        },
      );
    } catch (error) {
      this.logger.error("Error handling user.deactivated event", {
        userId:
          rawEventData.userId ?? rawEventData?.eventData?.userId ?? "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private normalizeEventData(
    raw: UserDeactivatedEventData,
  ): NormalizedUserDeactivatedEventData | null {
    const payload = (raw?.eventData as UserDeactivatedEventData) ?? raw ?? {};
    const userId =
      payload.userId ??
      (payload as any)?.aggregateId ??
      (payload as any)?.id ??
      null;

    if (!userId || typeof userId !== "string") {
      return null;
    }

    return {
      userId,
      deactivatedBy: payload.deactivatedBy,
      reason: payload.reason,
      email: payload.email,
      role: payload.role,
      deactivatedAt: payload.deactivatedAt,
    };
  }
}
