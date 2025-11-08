import { Request, Response, NextFunction } from "express";
import { ListAuditLogsUseCase } from "../../../application/use-cases/ListAuditLogsUseCase";
import { CreateAuditLogUseCase } from "../../../application/use-cases/CreateAuditLogUseCase";
import { GetMedicalRecordUseCase } from "../../../application/use-cases/GetMedicalRecordUseCase";
import { parsePagination } from "../../../shared/utils/pagination";

export class AuditLogController {
  constructor(
    private readonly listUseCase: ListAuditLogsUseCase,
    private readonly createUseCase: CreateAuditLogUseCase,
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
    } catch (error) {
      next(error);
    }
  };

  private async ensureRecordAccess(req: Request) {
    if (!this.recordAccessUseCase) return;
    await this.recordAccessUseCase.execute({
      id: req.params.recordId,
      patientId: req.user?.role === "patient" ? req.user.patientId : undefined,
    });
  }
}
