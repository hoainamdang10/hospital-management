/**
 * UpdateDiagnosticReportUseCase - Update Diagnostic Report Results
 * Command use case for updating diagnostic report results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { UpdateDiagnosticReportRequest, UpdateDiagnosticReportResponse } from '../dto/DiagnosticReportRequest';
export declare class UpdateDiagnosticReportUseCase {
    private readonly reportRepository;
    constructor(reportRepository: IDiagnosticReportRepository);
    execute(request: UpdateDiagnosticReportRequest): Promise<UpdateDiagnosticReportResponse>;
    authorize(request: UpdateDiagnosticReportRequest, userId: string): Promise<boolean>;
    involvesPHI(request: UpdateDiagnosticReportRequest): boolean;
    getPatientId(request: UpdateDiagnosticReportRequest): string | null;
}
//# sourceMappingURL=UpdateDiagnosticReportUseCase.d.ts.map