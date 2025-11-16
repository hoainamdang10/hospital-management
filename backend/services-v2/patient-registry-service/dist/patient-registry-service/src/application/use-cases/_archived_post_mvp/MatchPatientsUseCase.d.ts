/**
 * MatchPatientsUseCase - Application Use Case
 *
 * Implements Patient Master Index (PMI) $match operation
 * Finds potential duplicate patients based on demographic data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HL7 FHIR, PMI Best Practices
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientMatchingService } from '../services/IPatientMatchingService';
import { ILogger } from '../../../../../shared/application/services/logger.interface';
export interface MatchPatientsRequest {
    criteria: {
        fullName?: string;
        dateOfBirth?: string;
        nationalId?: string;
        primaryPhone?: string;
        email?: string;
    };
    onlyCertainMatches?: boolean;
    limit?: number;
    requestedBy: string;
}
export interface MatchPatientsResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        matches: Array<{
            patient: {
                patientId: string;
                userId: string;
                fullName: string;
                dateOfBirth: string;
                gender: string;
                nationalId: string;
                primaryPhone: string;
                email?: string;
                city: string;
                status: string;
            };
            matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not';
            score: number;
            matchedFields: string[];
        }>;
        totalMatches: number;
    };
}
export declare class MatchPatientsUseCase {
    private readonly patientRepository;
    private readonly matchingService;
    private readonly logger;
    constructor(patientRepository: IPatientRepository, matchingService: IPatientMatchingService, logger: ILogger);
    execute(request: MatchPatientsRequest): Promise<MatchPatientsResponse>;
}
//# sourceMappingURL=MatchPatientsUseCase.d.ts.map