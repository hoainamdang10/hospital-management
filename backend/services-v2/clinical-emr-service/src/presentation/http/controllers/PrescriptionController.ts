import { Request, Response, NextFunction } from "express";
import { CreatePrescriptionUseCase } from "../../../application/use-cases/CreatePrescriptionUseCase";
import { ListPrescriptionsUseCase } from "../../../application/use-cases/ListPrescriptionsUseCase";
import { CreateAuditLogUseCase } from "../../../application/use-cases/CreateAuditLogUseCase";
import { DeletePrescriptionUseCase } from "../../../application/use-cases/DeletePrescriptionUseCase";
import { GetMedicalRecordUseCase } from "../../../application/use-cases/GetMedicalRecordUseCase";
import { parsePagination } from "../../../shared/utils/pagination";

export class PrescriptionController {
  constructor(
    private readonly createUseCase: CreatePrescriptionUseCase,
    private readonly listUseCase: ListPrescriptionsUseCase,
    private readonly auditLogUseCase: CreateAuditLogUseCase,
    private readonly deleteUseCase: DeletePrescriptionUseCase,
    private readonly recordAccessUseCase: GetMedicalRecordUseCase,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.ensureRecordAccess(req);
      const pagination = parsePagination(req.query);
      const data = await this.listUseCase.execute({
        recordId: req.params.recordId,
        ...pagination,
      });
      res.json({ success: true, data });
      await this.logAudit(req, "prescription.listed");
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.ensureRecordAccess(req);
      const dto = await this.createUseCase.execute({
        ...req.body,
        recordId: req.params.recordId,
      });
      res.status(201).json({ success: true, data: dto });
      await this.logAudit(req, "prescription.created");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.ensureRecordAccess(req);
      await this.deleteUseCase.execute({
        recordId: req.params.recordId,
        prescriptionId: req.params.prescriptionId,
      });
      await this.logAudit(req, "prescription.deleted");
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private async logAudit(req: Request, action: string) {
    const actorId =
      req.user?.id ??
      (req.headers["x-user-id"] as string) ??
      "00000000-0000-0000-0000-000000000000";
    const recordId = req.params.recordId;
    if (!recordId) return;

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

  private async ensureRecordAccess(req: Request) {
    if (!this.recordAccessUseCase) return;
    await this.recordAccessUseCase.execute({
      id: req.params.recordId,
      patientId: req.user?.role === "patient" ? req.user.patientId : undefined,
    });
  }
}
