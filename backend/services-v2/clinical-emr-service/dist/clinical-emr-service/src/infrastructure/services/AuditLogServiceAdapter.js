"use strict";
/**
 * AuditLogServiceAdapter - Infrastructure Layer
 * Adapter to match IAuditLogService interface with existing SupabaseAuditLogService
 *
 * @author Hospital Management Team
 * @version 2.0.0
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
exports.AuditLogServiceAdapter = void 0;
const inversify_1 = require("inversify");
const SupabaseAuditLogService_1 = require("../audit/SupabaseAuditLogService");
const types_1 = require("../di/types");
let AuditLogServiceAdapter = class AuditLogServiceAdapter {
    constructor(supabaseAuditService) {
        this.supabaseAuditService = supabaseAuditService;
    }
    /**
     * Get audit logs with filters and pagination
     */
    async getAuditLogs(filters, limit, offset) {
        // Convert filters to SupabaseAuditLogService format
        const queryFilters = {
            limit,
            offset
        };
        if (filters.patientId)
            queryFilters.patientId = filters.patientId;
        if (filters.userId)
            queryFilters.userId = filters.userId;
        if (filters.action)
            queryFilters.action = filters.action;
        if (filters.startDate)
            queryFilters.startDate = filters.startDate;
        if (filters.endDate)
            queryFilters.endDate = filters.endDate;
        // Query audit logs
        const logs = await this.supabaseAuditService.query(queryFilters);
        // Map to domain format
        const mappedLogs = logs.map(log => ({
            id: log.resourceId || `${log.userId}-${log.timestamp.getTime()}`,
            timestamp: log.timestamp.toISOString(),
            userId: log.userId,
            userName: log.userEmail || 'Unknown',
            userRole: log.userRole || 'Unknown',
            action: this.mapAction(log.action),
            resourceType: log.resourceType,
            resourceId: log.resourceId || '',
            patientId: log.patientId,
            patientName: log.details?.patientName,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            purpose: log.details?.purpose,
            outcome: log.success ? 'success' : 'failure',
            details: log.errorMessage
        }));
        // Get total count (approximate - in production, use separate count query)
        const total = logs.length >= limit ? offset + logs.length + 1 : offset + logs.length;
        return {
            logs: mappedLogs,
            total
        };
    }
    /**
     * Log PHI access
     */
    async logAccess(entry) {
        await this.supabaseAuditService.log({
            action: entry.action,
            userId: entry.userId,
            userEmail: entry.userName,
            userRole: entry.userRole,
            resourceType: entry.resourceType,
            resourceId: entry.resourceId,
            patientId: entry.patientId,
            ipAddress: entry.ipAddress,
            userAgent: entry.userAgent,
            success: entry.outcome === 'success',
            errorMessage: entry.outcome === 'failure' ? entry.details : undefined,
            details: {
                patientName: entry.patientName,
                purpose: entry.purpose
            }
        });
    }
    /**
     * Get audit logs for specific patient
     */
    async getPatientAuditLogs(patientId, limit, offset) {
        return this.getAuditLogs({ patientId }, limit, offset);
    }
    /**
     * Get audit logs for specific user
     */
    async getUserAuditLogs(userId, limit, offset) {
        return this.getAuditLogs({ userId }, limit, offset);
    }
    /**
     * Map action string to standardized format
     */
    mapAction(action) {
        // Map various action formats to standardized format
        const actionMap = {
            'medical_record.accessed': 'read',
            'medical_record.created': 'write',
            'medical_record.updated': 'update',
            'medical_record.deleted': 'delete',
            'medical_record.exported': 'export',
            'medical_record.printed': 'print',
            'phi.accessed': 'read',
            'phi.exported': 'export'
        };
        return actionMap[action] || action;
    }
};
exports.AuditLogServiceAdapter = AuditLogServiceAdapter;
exports.AuditLogServiceAdapter = AuditLogServiceAdapter = __decorate([
    (0, inversify_1.injectable)(),
    __param(0, (0, inversify_1.inject)(types_1.TYPES.AuditLogService)),
    __metadata("design:paramtypes", [SupabaseAuditLogService_1.SupabaseAuditLogService])
], AuditLogServiceAdapter);
//# sourceMappingURL=AuditLogServiceAdapter.js.map