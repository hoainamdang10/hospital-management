"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
class PrescriptionController {
    constructor(createUseCase, listUseCase, auditLogUseCase, deleteUseCase, recordAccessUseCase, eventDispatcher) {
        this.createUseCase = createUseCase;
        this.listUseCase = listUseCase;
        this.auditLogUseCase = auditLogUseCase;
        this.deleteUseCase = deleteUseCase;
        this.recordAccessUseCase = recordAccessUseCase;
        this.eventDispatcher = eventDispatcher;
        this.list = async (req, res, next) => {
            try {
                await this.ensureRecordAccess(req);
                const pagination = (0, pagination_1.parsePagination)(req.query);
                const data = await this.listUseCase.execute({
                    recordId: req.params.recordId,
                    ...pagination,
                });
                res.json({ success: true, data });
                await this.logAudit(req, "prescription.listed");
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
                const patientId = await this.getPatientId(req.params.recordId);
                if (patientId) {
                    await this.eventDispatcher.prescriptionCreated(dto, patientId, req.user?.id);
                }
                await this.logAudit(req, "prescription.created");
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
                    prescriptionId: req.params.prescriptionId,
                });
                await this.logAudit(req, "prescription.deleted");
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
    async getPatientId(recordId) {
        if (!this.recordAccessUseCase)
            return null;
        const record = await this.recordAccessUseCase.execute({ id: recordId });
        return record?.patientId ?? null;
    }
}
exports.PrescriptionController = PrescriptionController;
