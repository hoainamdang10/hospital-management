import { Request, Response, NextFunction } from "express";
import { ListMedicalRecordsUseCase } from "../../../application/use-cases/ListMedicalRecordsUseCase";
import { GetMedicalRecordUseCase } from "../../../application/use-cases/GetMedicalRecordUseCase";
import { CreateMedicalRecordUseCase } from "../../../application/use-cases/CreateMedicalRecordUseCase";
import { UpdateMedicalRecordUseCase } from "../../../application/use-cases/UpdateMedicalRecordUseCase";
import { CreateAuditLogUseCase } from "../../../application/use-cases/CreateAuditLogUseCase";
import { parsePagination } from "../../../shared/utils/pagination";
import { ClinicalEventDispatcher } from "../../../application/services/ClinicalEventDispatcher";

export class MedicalRecordController {
  constructor(
    private readonly listUseCase: ListMedicalRecordsUseCase,
    private readonly getUseCase: GetMedicalRecordUseCase,
    private readonly createUseCase: CreateMedicalRecordUseCase,
    private readonly updateUseCase: UpdateMedicalRecordUseCase,
    private readonly auditLogUseCase: CreateAuditLogUseCase,
    private readonly eventDispatcher: ClinicalEventDispatcher,
  ) {}

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination = parsePagination(req.query);
      const patientId =
        req.user?.role === "patient"
          ? req.user.patientId
          : (req.query.patientId as string | undefined);

      const doctorId =
        req.user?.role === "doctor"
          ? req.user.id
          : (req.query.doctorId as string | undefined);
      const data = await this.listUseCase.execute({
        ...pagination,
        patientId: patientId ?? undefined,
        doctorId: doctorId ?? undefined,
        status: req.query.status as any,
        encounterType: req.query.encounterType as any,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.getUseCase.execute({
        id: req.params.id,
        patientId:
          req.user?.role === "patient" ? req.user.patientId : undefined,
      });
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.createUseCase.execute(req.body);
      await this.logAudit(req, data.id, "medical_record.created");
      await this.eventDispatcher.medicalRecordCreated(data, req.user?.id);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.updateUseCase.execute({
        id: req.params.id,
        payload: req.body,
      });
      await this.logAudit(req, data.id, "medical_record.updated");
      await this.eventDispatcher.medicalRecordUpdated(data, req.user?.id);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
  private async logAudit(req: Request, recordId: string, action: string) {
    const actorId =
      req.user?.id ??
      (req.headers["x-user-id"] as string) ??
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
