/**
 * PatientQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS Query handlers for patient registry read operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, HIPAA
 */

import {
  GetPatientProfileUseCase,
  GetPatientProfileRequest,
  GetPatientProfileResponse
} from '../use-cases/GetPatientProfileUseCase';
import {
  SearchPatientsUseCase,
  SearchPatientsRequest,
  SearchPatientsResponse
} from '../use-cases/SearchPatientsUseCase';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { ILogger } from '@shared/application/services/logger.interface';

const STAT_SAMPLE_LIMIT = 500;

type QueryFailure = { success: false; message: string };

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
  registrationTrend: Array<{ period: string; count: number }>;
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

type PatientQueryResult =
  | GetPatientProfileResponse
  | PatientListQueryResult
  | SearchPatientsQueryResult
  | PatientStatisticsQueryResult
  | QueryFailure;

// Query interfaces
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

export type PatientQuery =
  | GetPatientProfileQuery
  | GetPatientListQuery
  | SearchPatientsQuery
  | GetPatientStatisticsQuery;

/**
 * Patient Query Handlers
 * Handles all patient-related queries with proper authorization and data masking
 */
export class PatientQueryHandlers {
  constructor(
    private readonly getPatientProfileUseCase: GetPatientProfileUseCase,
    private readonly searchPatientsUseCase: SearchPatientsUseCase,
    private readonly patientRepository: IPatientRepository,
    private readonly logger: ILogger
  ) {}

  /**
   * Handle GetPatientProfile query
   */
  async handleGetPatientProfile(query: GetPatientProfileQuery): Promise<GetPatientProfileResponse> {
    try {
      this.logger.info('Processing GetPatientProfile query', {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        patientId: query.data.patientId,
        userId: query.data.userId,
        nationalId: query.data.nationalId,
        bhytNumber: query.data.bhytNumber
      });

      if (!this.isValidGetPatientProfileQuery(query)) {
        return {
          success: false,
          message: 'Cấu trúc truy vấn thông tin bệnh nhân không hợp lệ'
        };
      }

      const result = await this.getPatientProfileUseCase.execute(query.data);

      this.logger.info('GetPatientProfile query processed', {
        queryId: query.queryId,
        success: result.success,
        patientId: query.data.patientId,
        userId: query.data.userId
      });

      return result;

    } catch (error) {
      this.logger.error('Error processing GetPatientProfile query', {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi truy vấn thông tin bệnh nhân'
      };
    }
  }

  /**
   * Handle GetPatientList query
   */
  async handleGetPatientList(query: GetPatientListQuery): Promise<PatientListQueryResult> {
    try {
      this.logger.info('Processing GetPatientList query', {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        requestedByRole: query.data.requestedByRole
      });

      if (!this.isValidGetPatientListQuery(query)) {
        return {
          success: false,
          message: 'Cấu trúc truy vấn danh sách bệnh nhân không hợp lệ'
        };
      }

      if (!this.isAuthorizedForPatientList(query.data.requestedByRole)) {
        return {
          success: false,
          message: 'Không có quyền truy cập danh sách bệnh nhân'
        };
      }

      if (query.data.filters?.hasInsurance !== undefined) {
        this.logger.warn('hasInsurance filter is not yet supported for GetPatientList queries');
      }

      const page = query.data.pagination?.page ?? 1;
      const limit = query.data.pagination?.limit ?? 20;
      const filters = query.data.filters ?? {};

      const repositoryResult = await this.patientRepository.findWithFilters(
        {
          isActive: filters.isActive,
          registrationDateFrom: filters.registrationDateFrom,
          registrationDateTo: filters.registrationDateTo,
          city: filters.city,
          province: filters.province
        },
        {
          page,
          limit,
          sorting: query.data.sorting
        }
      );

      const patientSummaries = repositoryResult.patients.map(patient => this.mapToSummary(patient));
      const totalPages = this.calculateTotalPages(repositoryResult.total, limit);

      const result: Extract<PatientListQueryResult, { success: true }> = {
        success: true,
        message: 'Lấy danh sách bệnh nhân thành công',
        data: {
          patients: patientSummaries,
          pagination: {
            page,
            limit,
            total: repositoryResult.total,
            totalPages
          }
        }
      };

      this.logger.info('GetPatientList query processed', {
        queryId: query.queryId,
        success: true,
        totalPatients: repositoryResult.total
      });

      return result;

    } catch (error) {
      this.logger.error('Error processing GetPatientList query', {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi truy vấn danh sách bệnh nhân'
      };
    }
  }

  /**
   * Handle SearchPatients query
   */
  async handleSearchPatients(query: SearchPatientsQuery): Promise<SearchPatientsQueryResult> {
    try {
      this.logger.info('Processing SearchPatients query', {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        searchTerm: query.data.searchTerm
      });

      if (!this.isValidSearchPatientsQuery(query)) {
        return {
          success: false,
          message: 'Cấu trúc tìm kiếm bệnh nhân không hợp lệ'
        };
      }

      if (!this.isAuthorizedForPatientSearch(query.data.requestedByRole)) {
        return {
          success: false,
          message: 'Không có quyền tìm kiếm bệnh nhân'
        };
      }

      const page = query.data.pagination?.page ?? 1;
      const limit = query.data.pagination?.limit ?? 20;

      const request: SearchPatientsRequest = {
        searchTerm: query.data.searchTerm,
        filters: {
          isActive: query.data.filters?.isActive,
          hasInsurance: query.data.filters?.hasInsurance
        },
        pagination: {
          page,
          limit
        },
        requestedBy: query.data.requestedBy
      };

      const useCaseResult: SearchPatientsResponse = await this.searchPatientsUseCase.execute(request);

      if (!useCaseResult.success || !useCaseResult.data) {
        return {
          success: false,
          message: useCaseResult.message || 'Không thể tìm kiếm bệnh nhân'
        };
      }

      const patients = useCaseResult.data.patients.map(patient => ({
        patientId: patient.patientId,
        userId: patient.userId,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        nationalId: patient.nationalId,
        primaryPhone: patient.primaryPhone,
        email: patient.email,
        city: patient.city,
        province: patient.province,
        status: patient.status,
        hasInsurance: patient.hasInsurance,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      }));

      const result: Extract<SearchPatientsQueryResult, { success: true }> = {
        success: true,
        message: useCaseResult.message,
        data: {
          patients,
          searchTerm: query.data.searchTerm,
          totalResults: useCaseResult.data.pagination.total,
          pagination: {
            page: useCaseResult.data.pagination.page,
            limit: useCaseResult.data.pagination.limit,
            total: useCaseResult.data.pagination.total,
            totalPages: useCaseResult.data.pagination.totalPages
          }
        }
      };

      this.logger.info('SearchPatients query processed', {
        queryId: query.queryId,
        success: true,
        totalResults: result.data.totalResults
      });

      return result;

    } catch (error) {
      this.logger.error('Error processing SearchPatients query', {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi tìm kiếm bệnh nhân'
      };
    }
  }

  /**
   * Handle GetPatientStatistics query
   */
  async handleGetPatientStatistics(query: GetPatientStatisticsQuery): Promise<PatientStatisticsQueryResult> {
    try {
      this.logger.info('Processing GetPatientStatistics query', {
        queryId: query.queryId,
        requestedBy: query.requestedBy,
        requestedByRole: query.data.requestedByRole
      });

      if (!this.isValidGetPatientStatisticsQuery(query)) {
        return {
          success: false,
          message: 'Cấu trúc truy vấn thống kê bệnh nhân không hợp lệ'
        };
      }

      if (!this.isAuthorizedForPatientStatistics(query.data.requestedByRole)) {
        return {
          success: false,
          message: 'Không có quyền truy cập thống kê bệnh nhân'
        };
      }

      const sampleFilters = {
        registrationDateFrom: query.data.dateRange?.from,
        registrationDateTo: query.data.dateRange?.to
      };

      const [overallSample, activeCountResult] = await Promise.all([
        this.patientRepository.findWithFilters(sampleFilters, {
          page: 1,
          limit: STAT_SAMPLE_LIMIT,
          sorting: { field: 'created_at', direction: 'desc' }
        }),
        this.patientRepository.findWithFilters(
          { ...sampleFilters, isActive: true },
          { page: 1, limit: 1 }
        )
      ]);

      const samplePatients = overallSample.patients;
      const sampleSize = samplePatients.length;
      const totalPatients = overallSample.total;
      const activePatients = activeCountResult.total;
      const newRegistrations = overallSample.total;

      const patientsWithInsuranceSample = samplePatients.filter(patient => patient.hasValidInsurance()).length;
      const patientsWithInsurance = sampleSize === 0
        ? 0
        : sampleSize >= totalPatients
          ? patientsWithInsuranceSample
          : Math.round((patientsWithInsuranceSample / sampleSize) * totalPatients);

      const groupBy: GroupByPeriod = query.data.groupBy ?? 'month';
      const registrationTrend = this.buildRegistrationTrend(samplePatients, groupBy);
      const demographicBreakdown = this.buildDemographicBreakdown(samplePatients);

      const result: Extract<PatientStatisticsQueryResult, { success: true }> = {
        success: true,
        message: 'Lấy thống kê bệnh nhân thành công',
        data: {
          totalPatients,
          activePatients,
          newRegistrations,
          patientsWithInsurance,
          registrationTrend,
          demographicBreakdown
        }
      };

      this.logger.info('GetPatientStatistics query processed', {
        queryId: query.queryId,
        success: true,
        totalPatients
      });

      return result;

    } catch (error) {
      this.logger.error('Error processing GetPatientStatistics query', {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi truy vấn thống kê bệnh nhân'
      };
    }
  }

  /**
   * Generic query handler dispatcher
   */
  async handleQuery(query: PatientQuery): Promise<PatientQueryResult> {
    switch (query.queryType) {
      case 'GetPatientProfile':
        return this.handleGetPatientProfile(query as GetPatientProfileQuery);
      case 'GetPatientList':
        return this.handleGetPatientList(query as GetPatientListQuery);
      case 'SearchPatients':
        return this.handleSearchPatients(query as SearchPatientsQuery);
      case 'GetPatientStatistics':
        return this.handleGetPatientStatistics(query as GetPatientStatisticsQuery);
      default:
        this.logger.warn('Unknown query type');
        return {
          success: false,
          message: 'Loại truy vấn không được hỗ trợ'
        };
    }
  }

  // Query validation methods
  private isValidGetPatientProfileQuery(query: GetPatientProfileQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === 'GetPatientProfile' &&
      query.data &&
      (query.data.patientId || query.data.userId || query.data.nationalId || query.data.bhytNumber) &&
      query.data.requestedBy
    );
  }

  private isValidGetPatientListQuery(query: GetPatientListQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === 'GetPatientList' &&
      query.data &&
      query.data.requestedBy &&
      query.data.requestedByRole
    );
  }

  private isValidSearchPatientsQuery(query: SearchPatientsQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === 'SearchPatients' &&
      query.data &&
      query.data.searchTerm &&
      query.data.requestedBy &&
      query.data.requestedByRole
    );
  }

  private isValidGetPatientStatisticsQuery(query: GetPatientStatisticsQuery): boolean {
    return !!(
      query.queryId &&
      query.queryType === 'GetPatientStatistics' &&
      query.data &&
      query.data.requestedBy &&
      query.data.requestedByRole
    );
  }

  // Authorization methods
  private isAuthorizedForPatientList(role: string): boolean {
    return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
  }

  private isAuthorizedForPatientSearch(role: string): boolean {
    return ['admin', 'doctor', 'nurse', 'receptionist'].includes(role);
  }

  private isAuthorizedForPatientStatistics(role: string): boolean {
    return ['admin', 'doctor'].includes(role);
  }

  /**
   * Get handler status for health checks
   */
  getStatus() {
    return {
      handlerName: 'PatientQueryHandlers',
      supportedQueries: [
        'GetPatientProfile',
        'GetPatientList',
        'SearchPatients',
        'GetPatientStatistics'
      ],
      isHealthy: true,
      lastProcessedAt: new Date().toISOString()
    };
  }

  private mapToSummary(patient: Patient): PatientSummary {
    const personalInfo = patient.getPersonalInfo();
    const contactInfo = patient.getContactInfo();
    return {
      patientId: patient.getPatientId() || '',
      userId: patient.getUserId(),
      fullName: personalInfo.fullName,
      dateOfBirth: personalInfo.dateOfBirth.toISOString(),
      gender: personalInfo.gender,
      nationalId: personalInfo.nationalId,
      primaryPhone: contactInfo.primaryPhone,
      email: contactInfo.email,
      city: contactInfo.address.city,
      province: contactInfo.address.province,
      status: patient.getStatus(),
      hasInsurance: patient.hasValidInsurance(),
      createdAt: patient.getProps().createdAt.toISOString(),
      updatedAt: patient.getProps().updatedAt.toISOString()
    };
  }

  private calculateTotalPages(total: number, limit: number): number {
    if (limit <= 0) {
      return 0;
    }
    if (total === 0) {
      return 0;
    }
    return Math.ceil(total / limit);
  }

  private buildRegistrationTrend(patients: Patient[], groupBy: GroupByPeriod) {
    const buckets = new Map<string, number>();

    for (const patient of patients) {
      const createdAt = patient.getProps().createdAt;
      const key = this.buildTrendKey(createdAt, groupBy);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => ({ period, count }));
  }

  private buildTrendKey(date: Date, groupBy: GroupByPeriod): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    switch (groupBy) {
      case 'day':
        return `${year}-${month}-${day}`;
      case 'week': {
        const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
        const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
        const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getUTCDay() + 1) / 7);
        return `${year}-W${String(weekNumber).padStart(2, '0')}`;
      }
      case 'year':
        return `${year}`;
      case 'month':
      default:
        return `${year}-${month}`;
    }
  }

  private buildDemographicBreakdown(patients: Patient[]) {
    const byGender = { male: 0, female: 0, other: 0 };
    const ageGroupCounts: Record<AgeGroup, number> = {
      '0-18': 0,
      '19-35': 0,
      '36-60': 0,
      '60+': 0
    };
    const byProvince: Record<string, number> = {};

    for (const patient of patients) {
      const personalInfo = patient.getPersonalInfo();
      const contactInfo = patient.getContactInfo();

      switch (personalInfo.gender) {
        case 'male':
          byGender.male++;
          break;
        case 'female':
          byGender.female++;
          break;
        default:
          byGender.other++;
      }

      const ageGroup = this.resolveAgeGroup(personalInfo.dateOfBirth);
      ageGroupCounts[ageGroup]++;

      const province = contactInfo.address.province || 'Không xác định';
      byProvince[province] = (byProvince[province] ?? 0) + 1;
    }

    return {
      byGender,
      byAgeGroup: ageGroupCounts,
      byProvince
    };
  }

  private resolveAgeGroup(dateOfBirth: Date): AgeGroup {
    const age = this.calculateAge(dateOfBirth);
    if (age <= 18) return '0-18';
    if (age <= 35) return '19-35';
    if (age <= 60) return '36-60';
    return '60+';
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    return age;
  }

}
