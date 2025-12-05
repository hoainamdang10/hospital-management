"use strict";
/**
 * UserDeactivatedEventHandler
 * Handles user.deactivated events from Identity Service
 *
 * Marks related patient records as inactive to keep lifecycle states in sync.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDeactivatedEventHandler = void 0;
const PatientStatus_1 = require("../../../domain/value-objects/PatientStatus");
class UserDeactivatedEventHandler {
    constructor(logger, patientRepository) {
        this.logger = logger;
        this.patientRepository = patientRepository;
    }
    /**
     * Handle user.deactivated event
     */
    async handle(rawEventData) {
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
            const updateResult = await this.patientRepository.updateStatusByUserId(eventData.userId, PatientStatus_1.PatientStatus.INACTIVE, {
                updatedBy: eventData.deactivatedBy,
                reason: eventData.reason,
                source: "identity.user.deactivated",
            });
            if (!updateResult.patientId) {
                this.logger.warn("No patient record found for deactivated user", {
                    userId: eventData.userId,
                });
                return;
            }
            if (!updateResult.updated) {
                this.logger.info("Patient already inactive when user.deactivated event arrived", {
                    userId: eventData.userId,
                    patientId: updateResult.patientId,
                    previousStatus: updateResult.previousStatus,
                });
                return;
            }
            this.logger.info("Patient marked inactive via identity user deactivation", {
                userId: eventData.userId,
                patientId: updateResult.patientId,
                reason: eventData.reason,
                deactivatedBy: eventData.deactivatedBy,
            });
        }
        catch (error) {
            this.logger.error("Error handling user.deactivated event", {
                userId: rawEventData.userId ?? rawEventData?.eventData?.userId ?? "unknown",
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    normalizeEventData(raw) {
        const payload = raw?.eventData ?? raw ?? {};
        const userId = payload.userId ??
            payload?.aggregateId ??
            payload?.id ??
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
exports.UserDeactivatedEventHandler = UserDeactivatedEventHandler;
//# sourceMappingURL=UserDeactivatedEventHandler.js.map