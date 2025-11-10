import { Request, Response, NextFunction } from "express";
import { CreateLabResultUseCase } from "../../../application/use-cases/CreateLabResultUseCase";
import { ListLabResultsUseCase } from "../../../application/use-cases/ListLabResultsUseCase";
import { CreateAuditLogUseCase } from "../../../application/use-cases/CreateAuditLogUseCase";
import { DeleteLabResultUseCase } from "../../../application/use-cases/DeleteLabResultUseCase";
import { GetMedicalRecordUseCase } from "../../../application/use-cases/GetMedicalRecordUseCase";
import { parsePagination } from "../../../shared/utils/pagination";
import { ClinicalEventDispatcher } from "../../../application/services/ClinicalEventDispatcher";

export class LabResultController {
  constructor(
    private readonly createUseCase: CreateLabResultUseCase,
    private readonly listUseCase: ListLabResultsUseCase,
    private readonly deleteUseCase: DeleteLabResultUseCase,
    private readonly auditLogUseCase: CreateAuditLogUseCase,
    private readonly recordAccessUseCase: GetMedicalRecordUseCase,
    private readonly eventDispatcher: ClinicalEventDispatcher,
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
      await this.logAudit(req, "lab_result.listed");
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
      const patientId = await this.getPatientId(req.params.recordId);
      if (patientId) {
        await this.eventDispatcher.labResultCreated(
          dto,
          patientId,
          req.user?.id,
        );
      }
      await this.logAudit(req, "lab_result.created");
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.ensureRecordAccess(req);
      await this.deleteUseCase.execute({
        recordId: req.params.recordId,
        resultId: req.params.resultId,
      });
      await this.logAudit(req, "lab_result.deleted");
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

  private async getPatientId(recordId: string): Promise<string | null> {
    if (!this.recordAccessUseCase) return null;
    const record = await this.recordAccessUseCase.execute({ id: recordId });
    return record?.patientId ?? null;
  }
}
