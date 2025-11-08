"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogController = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
class AuditLogController {
    constructor(listUseCase, createUseCase, recordAccessUseCase) {
        this.listUseCase = listUseCase;
        this.createUseCase = createUseCase;
        this.recordAccessUseCase = recordAccessUseCase;
        this.list = async (req, res, next) => {
            try {
                await this.ensureRecordAccess(req);
                const pagination = (0, pagination_1.parsePagination)(req.query);
                const data = await this.listUseCase.execute({
                    recordId: req.params.recordId,
                    ...pagination,
                });
                res.json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        };
        this.create = async (req, res, next) => {
            try {
                await this.ensureRecordAccess(req);
                const dto = await this.createUseCase.execute({
                    ...req.body,
                    recordId: req.params.recordId,
                });
                res.status(201).json({ success: true, data: dto });
            }
            catch (error) {
                next(error);
            }
        };
    }
    async ensureRecordAccess(req) {
        if (!this.recordAccessUseCase)
            return;
        await this.recordAccessUseCase.execute({
            id: req.params.recordId,
            patientId: req.user?.role === "patient" ? req.user.patientId : undefined,
        });
    }
}
exports.AuditLogController = AuditLogController;
