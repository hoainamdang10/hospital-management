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
import { SearchPatientsUseCase } from '../use-cases/SearchPatientsUseCase';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { ILogger } from '../../../../shared/application/services/logger.interface';
type QueryFailure = {
    success: false;
    message: string;
};
type GroupByPeriod = 'day' | 'week' | 'month' | 'year';
interface PaginationMetadata {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
interface PatientSummary {
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
    createdAt: string;
    updatedAt: string;
}
interface PatientListData {
    patients: PatientSummary[];
    pagination: PaginationMetadata;
}
type PatientListQueryResult = QueryFailure | {
    success: true;
    message: string;
    data: PatientListData;
};
interface SearchPatientsData {
    patients: PatientSummary[];
    searchTerm: string;
    totalResults: number;
    pagination: PaginationMetadata;
}
type SearchPatientsQueryResult = QueryFailure | {
    success: true;
    message: string;
    data: SearchPatientsData;
};
type AgeGroup = '0-18' | '19-35' | '36-60' | '60+';
interface PatientStatisticsData {
    totalPatients: number;
    activePatients: number;
    newRegistrations: number;
    patientsWithInsurance: number;
    registrationTrend: Array<{
        period: string;
        count: number;
    }>;
    demographicBreakdown: {
        byGender: {
            male: number;
            female: number;
            other: number;
        };
        byAgeGroup: Record<AgeGroup, number>;
        byProvince: Record<string, number>;
    };
}
type PatientStatisticsQueryResult = QueryFailure | {
    success: true;
    message: string;
    data: PatientStatisticsData;
};
type PatientQueryResult = GetPatientProfileResponse | PatientListQueryResult | SearchPatientsQueryResult | PatientStatisticsQueryResult | QueryFailure;
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
        groupBy?: GroupByPeriod;
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
    private readonly searchPatientsUseCase;
    private readonly patientRepository;
    private readonly logger;
    constructor(getPatientProfileUseCase: GetPatientProfileUseCase, searchPatientsUseCase: SearchPatientsUseCase, patientRepository: IPatientRepository, logger: ILogger);
    /**
     * Handle GetPatientProfile query
     */
    handleGetPatientProfile(query: GetPatientProfileQuery): Promise<GetPatientProfileResponse>;
    /**
     * Handle GetPatientList query
     */
    handleGetPatientList(query: GetPatientListQuery): Promise<PatientListQueryResult>;
    /**
     * Handle SearchPatients query
     */
    handleSearchPatients(query: SearchPatientsQuery): Promise<SearchPatientsQueryResult>;
    /**
     * Handle GetPatientStatistics query
     */
    handleGetPatientStatistics(query: GetPatientStatisticsQuery): Promise<PatientStatisticsQueryResult>;
    /**
     * Generic query handler dispatcher
     */
    handleQuery(query: PatientQuery): Promise<PatientQueryResult>;
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
    getStatus(): {
        handlerName: string;
        supportedQueries: string[];
        isHealthy: boolean;
        lastProcessedAt: string;
    };
    private collectAllPatients;
    private calculateNewRegistrations;
    private mapToSummary;
    private calculateTotalPages;
    private buildRegistrationTrend;
    private buildTrendKey;
    private buildDemographicBreakdown;
    private resolveAgeGroup;
    private calculateAge;
}
export {};
//# sourceMappingURL=PatientQueryHandlers.d.ts.map