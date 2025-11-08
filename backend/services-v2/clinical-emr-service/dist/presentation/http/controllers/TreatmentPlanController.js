"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentPlanController = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
class TreatmentPlanController {
    constructor(createUseCase, listUseCase, updateStatusUseCase, deleteUseCase, auditLogUseCase, recordAccessUseCase) {
        this.createUseCase = createUseCase;
        this.listUseCase = listUseCase;
        this.updateStatusUseCase = updateStatusUseCase;
        this.deleteUseCase = deleteUseCase;
        this.auditLogUseCase = auditLogUseCase;
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
                await this.logAudit(req, "treatment_plan.listed");
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
                await this.logAudit(req, "treatment_plan.created");
            }
            catch (error) {
                next(error);
            }
        };
        this.updateStatus = async (req, res, next) => {
            try {
                await this.ensureRecordAccess(req);
                const dto = await this.updateStatusUseCase.execute({
                    planId: req.params.planId,
                    recordId: req.params.recordId,
                    status: req.body.status,
                });
                res.json({ success: true, data: dto });
                await this.logAudit(req, "treatment_plan.status_updated");
            }
            catch (error) {
                next(error);
            }
        };
        this.delete = async (req, res, next) => {
            try {
                await this.ensureRecordAccess(req);
                await this.deleteUseCase.execute({
                    recordId: req.params.recordId,
                    planId: req.params.planId,
                });
                await this.logAudit(req, "treatment_plan.deleted");
                res.status(204).send();
            }
            catch (error) {
                next(error);
            }
        };
    }
    async logAudit(req, action) {
        const actorId = req.user?.id ??
            req.headers["x-user-id"] ??
            "00000000-0000-0000-0000-000000000000";
        const recordId = req.params.recordId;
        if (!recordId)
            return;
        await this.auditLogUseCase
            .execute({
            recordId,
            actorId,
            action,
            metadata: {
                path: req.originalUrl,
                method: req.method,
                ip: req.ip,
            },
        })
            .catch(() => undefined);
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
exports.TreatmentPlanController = TreatmentPlanController;
