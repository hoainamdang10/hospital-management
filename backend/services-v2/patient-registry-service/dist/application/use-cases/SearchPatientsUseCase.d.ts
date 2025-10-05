/**
 * SearchPatientsUseCase - Application Use Case
 *
 * Searches for patients by various criteria
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface SearchPatientsRequest {
    searchTerm: string;
    filters?: {
        isActive?: boolean;
        city?: string;
        province?: string;
        hasInsurance?: boolean;
        insuranceType?: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    };
    pagination?: {
        page: number;
        limit: number;
        sorting?: {
            field: 'fullName' | 'dateOfBirth' | 'createdAt' | 'updatedAt';
            direction: 'asc' | 'desc';
        };
    };
    requestedBy: string;
}
export interface SearchPatientsResponse {
    success: boolean;
    message: string;
    errors?: string[];
    data?: {
        patients: Array<{
            patientId: string;
            userId: string;
            fullName: string;
            dateOfBirth: string;
            gender: string;
            nationalId: string;
            primaryPhone: string;
            email?: string;
            city: string;
            province: string;
            status: string;
            hasInsurance: boolean;
            insuranceType?: string;
            createdAt: string;
            updatedAt: string;
        }>;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}
export declare class SearchPatientsUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(request: SearchPatientsRequest): Promise<SearchPatientsResponse>;
}
//# sourceMappingURL=SearchPatientsUseCase.d.ts.map