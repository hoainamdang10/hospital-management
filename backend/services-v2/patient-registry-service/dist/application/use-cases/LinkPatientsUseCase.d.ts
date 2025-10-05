/**
 * LinkPatientsUseCase - Application Use Case
 *
 * Links related patients (FHIR-style linking)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR R5
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface LinkPatientsRequest {
    patientId: string;
    otherPatientId: string;
    linkType: 'refer' | 'seealso';
    performedBy: string;
}
export interface LinkPatientsResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patientId: string;
        otherPatientId: string;
        linkType: string;
        linkedAt: string;
    };
}
export declare class LinkPatientsUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: LinkPatientsRequest): Promise<LinkPatientsResponse>;
}
//# sourceMappingURL=LinkPatientsUseCase.d.ts.map