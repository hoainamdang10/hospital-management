"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const pagination_1 = require("../../../shared/utils/pagination");
class MedicalRecordController {
    constructor(listUseCase, getUseCase, createUseCase, updateUseCase, auditLogUseCase) {
        this.listUseCase = listUseCase;
        this.getUseCase = getUseCase;
        this.createUseCase = createUseCase;
        this.updateUseCase = updateUseCase;
        this.auditLogUseCase = auditLogUseCase;
        this.list = async (req, res, next) => {
            try {
                const pagination = (0, pagination_1.parsePagination)(req.query);
                const patientId = req.user?.role === "patient"
                    ? req.user.patientId
                    : req.query.patientId;
                const doctorId = req.user?.role === "doctor"
                    ? req.user.id
                    : req.query.doctorId;
                const data = await this.listUseCase.execute({
                    ...pagination,
                    patientId: patientId ?? undefined,
                    doctorId: doctorId ?? undefined,
                    status: req.query.status,
                    encounterType: req.query.encounterType,
                });
                res.json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        };
        this.get = async (req, res, next) => {
            try {
                const data = await this.getUseCase.execute({
                    id: req.params.id,
                    patientId: req.user?.role === "patient" ? req.user.patientId : undefined,
                });
                res.json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        };
        this.create = async (req, res, next) => {
            try {
                const data = await this.createUseCase.execute(req.body);
                await this.logAudit(req, data.id, "medical_record.created");
                res.status(201).json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        };
        this.update = async (req, res, next) => {
            try {
                const data = await this.updateUseCase.execute({
                    id: req.params.id,
                    payload: req.body,
                });
                await this.logAudit(req, data.id, "medical_record.updated");
                res.json({ success: true, data });
            }
            catch (error) {
                next(error);
            }
        };
    }
    async logAudit(req, recordId, action) {
        const actorId = req.user?.id ??
            req.headers["x-user-id"] ??
            "00000000-0000-0000-0000-000000000000";
        await this.auditLogUseCase
            .execute({
            recordId,
            actorId,
            action,
            metadata: {
                ip: req.ip,
                method: req.method,
                path: req.originalUrl,
            },
        })
            .catch(() => undefined);
    }
}
exports.MedicalRecordController = MedicalRecordController;
