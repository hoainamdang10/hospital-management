"use strict";
/**
 * SupabaseAuditLogService - Audit Logging Implementation
 * Stores security audit logs in Supabase (shared public.audit_logs table)
 *
 * @author Hospital Management Team
 * @version 2.1.0
 * @compliance Clean Architecture, HIPAA, Security
 * @updated 2025-11-02 - Migrated to shared public.audit_logs
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseAuditLogService = void 0;
const inversify_1 = require("inversify");
const supabase_js_1 = require("@supabase/supabase-js");
const IAuditLogService_1 = require("../../application/services/IAuditLogService");
const types_1 = require("../di/types");
let SupabaseAuditLogService = class SupabaseAuditLogService {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.tableName = "audit_logs"; // public.audit_logs (shared)
        this.serviceName = "clinical-emr-service";
    }
    /**
     * Check if entry contains PHI (Protected Health Information)
     */
    containsPHI(entry) {
        // PHI indicators
        const phiIndicators = [
            entry.patientId !== undefined,
            entry.resourceType === "medical_record",
            entry.resourceType === "clinical_note",
            entry.resourceType === "diagnostic_report",
            entry.resourceType === "prescription",
            entry.action === "medical_record.accessed",
            entry.action === "medical_record.created",
            entry.action === "medical_record.updated",
            entry.action === "phi.accessed",
        ];
        return phiIndicators.some((indicator) => indicator === true);
    }
    /**
     * Main logging method - writes to shared public.audit_logs
     */
    async log(entry) {
        try {
            const logEntry = {
                ...entry,
                timestamp: new Date(),
            };
            // Map to shared audit_logs schema
            const { error } = await this.supabase.from(this.tableName).insert({
                // Shared fields
                service_name: this.serviceName,
                action: logEntry.action,
                resource_type: logEntry.resourceType,
                resource_id: logEntry.resourceId || "",
                user_id: logEntry.userId,
                timestamp: logEntry.timestamp.toISOString(),
                ip_address: logEntry.ipAddress,
                user_agent: logEntry.userAgent,
                session_id: logEntry.metadata?.sessionId || logEntry.metadata?.session_id,
                // HIPAA compliance
                compliance_level: "hipaa",
                contains_phi: this.containsPHI(logEntry),
                // Store clinical-specific fields in details JSONB
                details: {
                    ...(logEntry.details || {}),
                    // Clinical-specific metadata
                    patient_id: logEntry.patientId,
                    severity: logEntry.severity || IAuditLogService_1.AuditSeverity.INFO,
                    success: logEntry.success !== false, // default true
                    error_message: logEntry.errorMessage,
                    user_email: logEntry.userEmail,
                    user_role: logEntry.userRole,
                    metadata: logEntry.metadata || {},
                },
            });
            if (error) {
                this.logger.error("Failed to write audit log", {
                    error,
                    service: this.serviceName,
                    action: logEntry.action,
                });
            }
        }
        catch (error) {
            this.logger.error("Audit log error", {
                error,
                service: this.serviceName,
                entry,
            });
        }
    }
    /**
     * Log successful action
     */
    async logSuccess(action, userId, resourceType, resourceId, details) {
        await this.log({
            action,
            userId,
            resourceType,
            resourceId,
            details,
            severity: IAuditLogService_1.AuditSeverity.INFO,
            success: true,
        });
    }
    /**
     * Log failed action
     */
    async logFailure(action, userId, resourceType, error, details) {
        await this.log({
            action,
            userId,
            resourceType,
            details,
            severity: IAuditLogService_1.AuditSeverity.ERROR,
            success: false,
            errorMessage: error,
        });
    }
    /**
     * Log PHI (Protected Health Information) access
     * HIPAA compliance requirement
     */
    async logPHIAccess(userId, patientId, resourceType, resourceId, action, ipAddress) {
        await this.log({
            action,
            userId,
            patientId,
            resourceType,
            resourceId,
            ipAddress,
            severity: IAuditLogService_1.AuditSeverity.INFO,
            success: true,
            details: {
                phi_access: true,
                compliance: "HIPAA",
                access_type: "read",
            },
        });
    }
    /**
     * Query audit logs with filters
     */
    async query(filters) {
        try {
            let query = this.supabase
                .from(this.tableName)
                .select("*")
                .eq("service_name", this.serviceName) // Filter by clinical service
                .order("timestamp", { ascending: false });
            if (filters.userId) {
                query = query.eq("user_id", filters.userId);
            }
            if (filters.resourceType) {
                query = query.eq("resource_type", filters.resourceType);
            }
            if (filters.action) {
                query = query.eq("action", filters.action);
            }
            if (filters.startDate) {
                query = query.gte("timestamp", filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte("timestamp", filters.endDate.toISOString());
            }
            // Filter by patient_id in JSONB details
            if (filters.patientId) {
                query = query.contains("details", { patient_id: filters.patientId });
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
            }
            const { data, error } = await query;
            if (error) {
                this.logger.error("Failed to query audit logs", { error, filters });
                return [];
            }
            // Map from shared schema back to clinical format
            return (data || []).map((row) => {
                const details = row.details || {};
                return {
                    action: row.action,
                    userId: row.user_id,
                    userEmail: details.user_email,
                    userRole: details.user_role,
                    resourceType: row.resource_type,
                    resourceId: row.resource_id,
                    patientId: details.patient_id,
                    details: details,
                    ipAddress: row.ip_address,
                    userAgent: row.user_agent,
                    severity: details.severity || IAuditLogService_1.AuditSeverity.INFO,
                    timestamp: new Date(row.timestamp),
                    success: details.success !== false,
                    errorMessage: details.error_message,
                    metadata: {
                        ...details.metadata,
                        session_id: row.session_id,
                        compliance_level: row.compliance_level,
                        contains_phi: row.contains_phi,
                        service_name: row.service_name,
                    },
                };
            });
        }
        catch (error) {
            this.logger.error("Audit log query error", { error, filters });
            return [];
        }
    }
};
exports.SupabaseAuditLogService = SupabaseAuditLogService;
exports.SupabaseAuditLogService = SupabaseAuditLogService = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.SupabaseClient)),
    __param(1, (0, inversify_1.inject)(types_1.TYPES.Logger)),
    __metadata("design:paramtypes", [supabase_js_1.SupabaseClient, Object])
], SupabaseAuditLogService);
//# sourceMappingURL=SupabaseAuditLogService.js.map