"use strict";
/**
 * SupabaseAuditLogService - Audit Logging Implementation
 * Stores security audit logs in Supabase
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, HIPAA, Security
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
        this.tableName = 'audit_logs';
    }
    async log(entry) {
        try {
            const logEntry = {
                ...entry,
                timestamp: new Date()
            };
            const { error } = await this.supabase
                .from(this.tableName)
                .insert({
                action: logEntry.action,
                user_id: logEntry.userId,
                user_email: logEntry.userEmail,
                user_role: logEntry.userRole,
                resource_type: logEntry.resourceType,
                resource_id: logEntry.resourceId,
                patient_id: logEntry.patientId,
                details: logEntry.details || {},
                ip_address: logEntry.ipAddress,
                user_agent: logEntry.userAgent,
                severity: logEntry.severity,
                success: logEntry.success,
                error_message: logEntry.errorMessage,
                metadata: logEntry.metadata || {},
                timestamp: logEntry.timestamp.toISOString()
            });
            if (error) {
                this.logger.error('Failed to write audit log', { error, entry: logEntry });
            }
        }
        catch (error) {
            this.logger.error('Audit log error', { error, entry });
        }
    }
    async logSuccess(action, userId, resourceType, resourceId, details) {
        await this.log({
            action,
            userId,
            resourceType,
            resourceId,
            details,
            severity: IAuditLogService_1.AuditSeverity.INFO,
            success: true
        });
    }
    async logFailure(action, userId, resourceType, error, details) {
        await this.log({
            action,
            userId,
            resourceType,
            details,
            severity: IAuditLogService_1.AuditSeverity.ERROR,
            success: false,
            errorMessage: error
        });
    }
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
                compliance: 'HIPAA'
            }
        });
    }
    async query(filters) {
        try {
            let query = this.supabase
                .from(this.tableName)
                .select('*')
                .order('timestamp', { ascending: false });
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters.patientId) {
                query = query.eq('patient_id', filters.patientId);
            }
            if (filters.resourceType) {
                query = query.eq('resource_type', filters.resourceType);
            }
            if (filters.action) {
                query = query.eq('action', filters.action);
            }
            if (filters.startDate) {
                query = query.gte('timestamp', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('timestamp', filters.endDate.toISOString());
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
            }
            const { data, error } = await query;
            if (error) {
                this.logger.error('Failed to query audit logs', { error, filters });
                return [];
            }
            return (data || []).map((row) => ({
                action: row.action,
                userId: row.user_id,
                userEmail: row.user_email,
                userRole: row.user_role,
                resourceType: row.resource_type,
                resourceId: row.resource_id,
                patientId: row.patient_id,
                details: row.details || {},
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
                severity: row.severity,
                timestamp: new Date(row.timestamp),
                success: row.success,
                errorMessage: row.error_message,
                metadata: row.metadata || {}
            }));
        }
        catch (error) {
            this.logger.error('Audit log query error', { error, filters });
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