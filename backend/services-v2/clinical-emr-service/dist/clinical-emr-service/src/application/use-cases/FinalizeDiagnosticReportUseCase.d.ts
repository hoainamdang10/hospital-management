/**
 * FinalizeDiagnosticReportUseCase - Finalize Diagnostic Report
 * Command use case for finalizing diagnostic report (mark as final)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { FinalizeDiagnosticReportRequest, FinalizeDiagnosticReportResponse } from '../dto/DiagnosticReportRequest';
export declare class FinalizeDiagnosticReportUseCase {
    private readonly reportRepository;
    constructor(reportRepository: IDiagnosticReportRepository);
    execute(request: FinalizeDiagnosticReportRequest): Promise<FinalizeDiagnosticReportResponse>;
    authorize(request: FinalizeDiagnosticReportRequest, userId: string): Promise<boolean>;
    involvesPHI(request: FinalizeDiagnosticReportRequest): boolean;
    getPatientId(request: FinalizeDiagnosticReportRequest): string | null;
}
//# sourceMappingURL=FinalizeDiagnosticReportUseCase.d.ts.map