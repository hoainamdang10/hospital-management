"use strict";
/**
 * AuditService - HIPAA-compliant audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance HIPAA, Clean Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const crypto_1 = require("crypto");
class AuditService {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.eventFunctionsAvailable = true;
    }
    /**
     * Log audit event
     */
    async logAudit(entry) {
        try {
            const { error } = await this.supabase
                .schema("patient_schema")
                .from("audit_logs")
                .insert({
                event_id: entry.eventId,
                event_type: entry.eventType,
                aggregate_type: entry.aggregateType,
                aggregate_id: entry.aggregateId,
                action: entry.action,
                user_id: entry.userId,
                user_role: entry.userRole,
                patient_id: entry.patientId,
                contains_phi: entry.containsPHI,
                changed_fields: entry.changedFields,
                old_values: entry.oldValues,
                new_values: entry.newValues,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                session_id: entry.sessionId,
                correlation_id: entry.correlationId,
                compliance_level: entry.complianceLevel,
                timestamp: new Date().toISOString(),
            });
            if (error) {
                this.logger.error("Failed to log audit entry", {
                    error: error.message,
                });
                throw error;
            }
            this.logger.debug("Audit log created", {
                eventType: entry.eventType,
                action: entry.action,
                patientId: entry.patientId,
            });
        }
        catch (error) {
            this.logger.error("Error logging audit", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            // Don't throw - audit logging should not break main flow
        }
    }
    /**
     * Log PHI access
     */
    async logPHIAccess(entry) {
        try {
            const { error } = await this.supabase
                .schema("patient_schema")
                .from("phi_access_logs")
                .insert({
                patient_id: entry.patientId,
                user_id: entry.userId,
                user_role: entry.userRole,
                access_type: entry.accessType,
                accessed_fields: entry.accessedFields,
                reason: entry.reason,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                session_id: entry.sessionId,
                timestamp: new Date().toISOString(),
            });
            if (error) {
                this.logger.error("Failed to log PHI access", { error: error.message });
                throw error;
            }
            this.logger.debug("PHI access logged", {
                patientId: entry.patientId,
                accessType: entry.accessType,
                userId: entry.userId,
            });
        }
        catch (error) {
            this.logger.error("Error logging PHI access", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Check if event was already processed (idempotency)
     */
    async isEventProcessed(eventId) {
        try {
            const { data, error } = await this.supabase.rpc("is_event_processed", {
                p_event_id: eventId,
            });
            if (error) {
                if (this.isMissingEventFunctionError(error)) {
                    this.handleMissingEventFunction(error);
                    return false;
                }
                this.logger.error("Failed to check event processing status", {
                    error: error.message,
                });
                return false; // Fail open - allow processing
            }
            return data === true;
        }
        catch (error) {
            this.logger.error("Error checking event processing status", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return false;
        }
    }
    /**
     * Mark event as processing
     */
    async markEventProcessing(eventId, eventType, handlerName, eventPayload) {
        try {
            const { data, error } = await this.supabase.rpc("mark_event_processing", {
                p_event_id: eventId,
                p_event_type: eventType,
                p_handler_name: handlerName,
                p_event_payload: eventPayload,
            });
            if (error) {
                if (this.isMissingEventFunctionError(error)) {
                    this.handleMissingEventFunction(error);
                    return null;
                }
                this.logger.error("Failed to mark event as processing", {
                    error: error.message,
                });
                return null;
            }
            return data;
        }
        catch (error) {
            this.logger.error("Error marking event as processing", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }
    /**
     * Mark event as completed
     */
    async markEventCompleted(eventId, processingDurationMs) {
        try {
            const { error } = await this.supabase.rpc("mark_event_completed", {
                p_event_id: eventId,
                p_processing_duration_ms: processingDurationMs,
            });
            if (error) {
                if (this.isMissingEventFunctionError(error)) {
                    this.handleMissingEventFunction(error);
                    return;
                }
                this.logger.error("Failed to mark event as completed", {
                    error: error.message,
                });
            }
        }
        catch (error) {
            this.logger.error("Error marking event as completed", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Mark event as failed
     */
    async markEventFailed(eventId, errorMessage, errorStack) {
        try {
            const { error } = await this.supabase.rpc("mark_event_failed", {
                p_event_id: eventId,
                p_error_message: errorMessage,
                p_error_stack: errorStack || "",
            });
            if (error) {
                if (this.isMissingEventFunctionError(error)) {
                    this.handleMissingEventFunction(error);
                    return;
                }
                this.logger.error("Failed to mark event as failed", {
                    error: error.message,
                });
            }
        }
        catch (error) {
            this.logger.error("Error marking event as failed", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * IAuditService implementation - Log audit entry
     */
    async log(entry) {
        try {
            const { error } = await this.supabase
                .schema("patient_schema")
                .from("audit_logs")
                .insert({
                event_id: (0, crypto_1.randomUUID)(),
                event_type: "AUDIT",
                aggregate_type: entry.resource,
                aggregate_id: entry.resourceId || "",
                action: entry.action,
                user_id: entry.userId,
                patient_id: entry.resourceId,
                contains_phi: true,
                changed_fields: entry.details,
                ip_address: entry.ipAddress,
                user_agent: entry.userAgent,
                compliance_level: "HIPAA",
                timestamp: new Date().toISOString(),
            });
            if (error) {
                this.logger.error("Failed to log audit entry", {
                    error: error.message,
                });
                throw error;
            }
            this.logger.debug("Audit log created via IAuditService", {
                action: entry.action,
                resource: entry.resource,
                resourceId: entry.resourceId,
            });
        }
        catch (error) {
            this.logger.error("Error logging audit via IAuditService", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            // Don't throw - audit logging should not break main flow
        }
    }
    /**
     * IAuditService implementation - Get logs for resource
     */
    async getLogsForResource(resource, resourceId) {
        try {
            const { data, error } = await this.supabase
                .schema("patient_schema")
                .from("audit_logs")
                .select("*")
                .eq("aggregate_type", resource)
                .eq("aggregate_id", resourceId)
                .order("timestamp", { ascending: false });
            if (error) {
                this.logger.error("Failed to get audit logs for resource", {
                    error: error.message,
                });
                return [];
            }
            return (data || []).map((row) => ({
                id: row.event_id,
                timestamp: new Date(row.timestamp),
                userId: row.user_id,
                action: row.action,
                resource: row.aggregate_type,
                resourceId: row.aggregate_id,
                details: row.changed_fields,
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
            }));
        }
        catch (error) {
            this.logger.error("Error getting audit logs for resource", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return [];
        }
    }
    /**
     * IAuditService implementation - Get logs for user
     */
    async getLogsForUser(userId, limit = 100) {
        try {
            const { data, error } = await this.supabase
                .schema("patient_schema")
                .from("audit_logs")
                .select("*")
                .eq("user_id", userId)
                .order("timestamp", { ascending: false })
                .limit(limit);
            if (error) {
                this.logger.error("Failed to get audit logs for user", {
                    error: error.message,
                });
                return [];
            }
            return (data || []).map((row) => ({
                id: row.event_id,
                timestamp: new Date(row.timestamp),
                userId: row.user_id,
                action: row.action,
                resource: row.aggregate_type,
                resourceId: row.aggregate_id,
                details: row.changed_fields,
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
            }));
        }
        catch (error) {
            this.logger.error("Error getting audit logs for user", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return [];
        }
    }
    isMissingEventFunctionError(error) {
        if (!error?.message) {
            return false;
        }
        const lowered = error.message.toLowerCase();
        return (lowered.includes("is_event_processed") ||
            lowered.includes("mark_event_processing") ||
            lowered.includes("mark_event_completed") ||
            lowered.includes("mark_event_failed"));
    }
    handleMissingEventFunction(error) {
        if (this.eventFunctionsAvailable) {
            this.eventFunctionsAvailable = false;
            this.logger.warn("Event idempotency RPC functions not found. Continuing without audit-based idempotency tracking.", { error: error.message });
        }
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=AuditService.js.map