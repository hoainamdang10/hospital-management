"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListAuditLogsUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListAuditLogsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const entries = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return entries.map((log) => mappers_1.mappers.auditLog(log));
    }
}
exports.ListAuditLogsUseCase = ListAuditLogsUseCase;
