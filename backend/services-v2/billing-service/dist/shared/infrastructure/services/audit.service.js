"use strict";
/**
 * Audit Service Implementation - Shared Infrastructure
 * Standard audit service for all services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
class AuditService {
    constructor() {
        this.logs = [];
    }
    async log(entry) {
        const logEntry = {
            id: this.generateId(),
            timestamp: new Date(),
            ...entry
        };
        this.logs.push(logEntry);
        // In a real implementation, this would write to database
        console.log('[AUDIT]', logEntry);
    }
    async getLogsForResource(resource, resourceId) {
        return this.logs.filter(log => log.resource === resource && log.resourceId === resourceId);
    }
    async getLogsForUser(userId, limit = 100) {
        return this.logs
            .filter(log => log.userId === userId)
            .slice(0, limit);
    }
    generateId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map