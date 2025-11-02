/**
 * GetDiagnosticReportUseCase - Retrieve Diagnostic Report
 * Query use case for retrieving a diagnostic report by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA
 */
import { IDiagnosticReportRepository } from '../../domain/repositories/IDiagnosticReportRepository';
import { GetDiagnosticReportRequest, GetDiagnosticReportResponse } from '../dto/DiagnosticReportRequest';
export declare class GetDiagnosticReportUseCase {
    private readonly reportRepository;
    constructor(reportRepository: IDiagnosticReportRepository);
    execute(request: GetDiagnosticReportRequest): Promise<GetDiagnosticReportResponse>;
    authorize(request: GetDiagnosticReportRequest, userId: string): Promise<boolean>;
    involvesPHI(request: GetDiagnosticReportRequest): boolean;
    getPatientId(request: GetDiagnosticReportRequest): string | null;
}
//# sourceMappingURL=GetDiagnosticReportUseCase.d.ts.map