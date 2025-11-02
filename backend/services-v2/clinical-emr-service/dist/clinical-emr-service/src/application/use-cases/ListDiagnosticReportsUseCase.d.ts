/**
 * ListDiagnosticReportsUseCase - List Diagnostic Reports
 * Query use case for listing diagnostic reports with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { ListDiagnosticReportsRequest, ListDiagnosticReportsResponse } from '../dto/DiagnosticReportRequest';
export declare class ListDiagnosticReportsUseCase {
    private readonly reportRepository;
    constructor(reportRepository: IDiagnosticReportRepository);
    execute(request: ListDiagnosticReportsRequest): Promise<ListDiagnosticReportsResponse>;
    authorize(request: ListDiagnosticReportsRequest, userId: string): Promise<boolean>;
    involvesPHI(request: ListDiagnosticReportsRequest): boolean;
    getPatientId(request: ListDiagnosticReportsRequest): string | null;
}
//# sourceMappingURL=ListDiagnosticReportsUseCase.d.ts.map