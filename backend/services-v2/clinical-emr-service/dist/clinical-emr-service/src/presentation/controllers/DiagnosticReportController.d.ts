/**
 * DiagnosticReportController - HTTP Controller for Diagnostic Reports
 * @compliance Clean Architecture, RESTful API, FHIR R4
 */
import { Request, Response, NextFunction } from 'express';
import { CreateDiagnosticReportUseCase, GetDiagnosticReportUseCase, UpdateDiagnosticReportUseCase, FinalizeDiagnosticReportUseCase, ListDiagnosticReportsUseCase } from '../../application/use-cases';
export declare class DiagnosticReportController {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly updateUseCase;
    private readonly finalizeUseCase;
    private readonly listUseCase;
    constructor(createUseCase: CreateDiagnosticReportUseCase, getUseCase: GetDiagnosticReportUseCase, updateUseCase: UpdateDiagnosticReportUseCase, finalizeUseCase: FinalizeDiagnosticReportUseCase, listUseCase: ListDiagnosticReportsUseCase);
    createReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    getReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    finalizeReport(req: Request, res: Response, next: NextFunction): Promise<void>;
    listReports(req: Request, res: Response, next: NextFunction): Promise<void>;
}
//# sourceMappingURL=DiagnosticReportController.d.ts.map