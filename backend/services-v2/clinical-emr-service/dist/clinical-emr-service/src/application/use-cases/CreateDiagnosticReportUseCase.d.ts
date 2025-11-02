/**
 * CreateDiagnosticReportUseCase - Create Diagnostic Report
 * Command use case for creating a new diagnostic report
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { CreateDiagnosticReportRequest, CreateDiagnosticReportResponse } from '../dto/DiagnosticReportRequest';
export declare class CreateDiagnosticReportUseCase {
    private readonly reportRepository;
    constructor(reportRepository: IDiagnosticReportRepository);
    execute(request: CreateDiagnosticReportRequest): Promise<CreateDiagnosticReportResponse>;
    authorize(request: CreateDiagnosticReportRequest, userId: string): Promise<boolean>;
    involvesPHI(request: CreateDiagnosticReportRequest): boolean;
    getPatientId(request: CreateDiagnosticReportRequest): string | null;
}
//# sourceMappingURL=CreateDiagnosticReportUseCase.d.ts.map