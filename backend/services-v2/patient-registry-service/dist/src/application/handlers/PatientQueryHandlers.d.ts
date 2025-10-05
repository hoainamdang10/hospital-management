/**
 * PatientQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Query handlers for patient registry read operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */
import { GetPatientProfileUseCase, GetPatientProfileRequest, GetPatientProfileResponse } from '../use-cases/GetPatientProfileUseCase';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
export interface GetPatientProfileQuery {
    queryId: string;
    queryType: 'GetPatientProfile';
    timestamp: Date;
    requestedBy: string;
    data: GetPatientProfileRequest;
}
export interface GetPatientListQuery {
    queryId: string;
    queryType: 'GetPatientList';
    timestamp: Date;
    requestedBy: string;
    data: {
        filters?: {
            isActive?: boolean;
            registrationDateFrom?: string;
            registrationDateTo?: string;
            hasInsurance?: boolean;
            city?: string;
            province?: string;
        };
        pagination?: {
            page: number;
            limit: number;
        };
        sorting?: {
            field: string;
            direction: 'asc' | 'desc';
        };
        requestedBy: string;
        requestedByRole: string;
    };
}
export interface SearchPatientsQuery {
    queryId: string;
    queryType: 'SearchPatients';
    timestamp: Date;
    requestedBy: string;
    data: {
        searchTerm: string;
        searchFields?: string[];
        filters?: {
            isActive?: boolean;
            hasInsurance?: boolean;
        };
        pagination?: {
            page: number;
            limit: number;
        };
        requestedBy: string;
        requestedByRole: string;
    };
}
export interface GetPatientStatisticsQuery {
    queryId: string;
    queryType: 'GetPatientStatistics';
    timestamp: Date;
    requestedBy: string;
    data: {
        dateRange?: {
            from: string;
            to: string;
        };
        groupBy?: 'day' | 'week' | 'month' | 'year';
        requestedBy: string;
        requestedByRole: string;
    };
}
export type PatientQuery = GetPatientProfileQuery | GetPatientListQuery | SearchPatientsQuery | GetPatientStatisticsQuery;
/**
 * Patient Query Handlers
 * Handles all patient-related queries with proper authorization and data masking
 */
export declare class PatientQueryHandlers {
    private readonly getPatientProfileUseCase;
    private readonly patientRepository;
    private readonly logger;
    constructor(getPatientProfileUseCase: GetPatientProfileUseCase, patientRepository: IPatientRepository, logger: ILogger);
    /**
     * Handle GetPatientProfile query
     */
    handleGetPatientProfile(query: GetPatientProfileQuery): Promise<GetPatientProfileResponse>;
    /**
     * Handle GetPatientList query
     */
    handleGetPatientList(query: GetPatientListQuery): Promise<any>;
    /**
     * Handle SearchPatients query
     */
    handleSearchPatients(query: SearchPatientsQuery): Promise<any>;
    /**
     * Handle GetPatientStatistics query
     */
    handleGetPatientStatistics(query: GetPatientStatisticsQuery): Promise<any>;
    /**
     * Generic query handler dispatcher
     */
    handleQuery(query: PatientQuery): Promise<any>;
    private isValidGetPatientProfileQuery;
    private isValidGetPatientListQuery;
    private isValidSearchPatientsQuery;
    private isValidGetPatientStatisticsQuery;
    private isAuthorizedForPatientList;
    private isAuthorizedForPatientSearch;
    private isAuthorizedForPatientStatistics;
    /**
     * Get handler status for health checks
     */
    getStatus(): any;
}
//# sourceMappingURL=PatientQueryHandlers.d.ts.map