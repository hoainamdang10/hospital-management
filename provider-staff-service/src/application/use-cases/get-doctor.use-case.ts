/**
 * Get Doctor Use Case - Application Layer
 * CQRS Query Handler for retrieving doctor information with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Healthcare Data Access
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { GetDoctorQuery } from '../queries/get-doctor.query';
import { DoctorDetailResponse, DoctorResponseMapper } from '../dtos/doctor-response.dto';
import { IDoctorRepository } from '../../domain/repositories/doctor.repository';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { ICacheService } from '../../../shared/infrastructure/caching/cache.service.interface';

export interface GetDoctorUseCaseDependencies {
  doctorRepository: IDoctorRepository;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
  cacheService: ICacheService;
}

/**
 * Get Doctor Use Case
 * Handles retrieving doctor information with proper access control and caching
 */
export class GetDoctorUseCase implements BaseHealthcareUseCase<GetDoctorQuery, DoctorDetailResponse> {
  constructor(private dependencies: GetDoctorUseCaseDependencies) {}

  /**
   * Execute the use case
   */
  async execute(query: GetDoctorQuery): Promise<DoctorDetailResponse> {
    const { doctorRepository, logger, authorizationService, auditService, cacheService } = this.dependencies;

    try {
      // 1. Validate query
      logger.info('Validating get doctor query', { 
        queryId: query.queryId,
        doctorId: query.getDoctorId(),
        requestedBy: query.getData().requestedBy
      });

      const validation = query.validate();
      if (!validation.isValid) {
        logger.warn('Query validation failed', { 
          queryId: query.queryId,
          errors: validation.errors 
        });

        throw new Error(`Truy vấn không hợp lệ: ${validation.errors.join(', ')}`);
      }

      // 2. Authorization check
      logger.info('Checking authorization', { 
        queryId: query.queryId,
        userId: query.userId,
        requiredPermissions: query.getRequiredPermissions()
      });

      const isAuthorized = await authorizationService.authorize(
        query.userId!,
        query.getRequiredPermissions(),
        'doctor_access',
        query.correlationId
      );

      if (!isAuthorized) {
        logger.warn('Authorization failed', { 
          queryId: query.queryId,
          userId: query.userId,
          doctorId: query.getDoctorId()
        });

        await auditService.logUnauthorizedAccess(
          query.userId!,
          'get_doctor',
          `Attempted to access doctor ${query.getDoctorId()} without permission`,
          query.correlationId
        );

        throw new Error('Không có quyền truy cập thông tin bác sĩ');
      }

      // 3. Check cache first (if enabled)
      let doctor = null;
      const cacheKey = query.getCacheKey();
      
      if (query.metadata.cacheable && !query.shouldIncludeSensitiveData()) {
        logger.debug('Checking cache', { 
          queryId: query.queryId,
          cacheKey: cacheKey
        });

        const cachedResult = await cacheService.get<DoctorDetailResponse>(cacheKey);
        if (cachedResult) {
          logger.info('Cache hit', { 
            queryId: query.queryId,
            cacheKey: cacheKey
          });

          // Still audit the access even for cached results
          if (query.shouldAuditAccess()) {
            await auditService.logDoctorAccess(
              query.getDoctorId(),
              query.userId!,
              'Doctor information accessed (cached)',
              {
                includePersonalInfo: query.shouldIncludePersonalInfo(),
                includeCredentials: query.shouldIncludeCredentials(),
                includeSensitiveData: query.shouldIncludeSensitiveData(),
                anonymized: query.shouldAnonymizeData()
              },
              query.correlationId
            );
          }

          return cachedResult;
        }

        logger.debug('Cache miss', { 
          queryId: query.queryId,
          cacheKey: cacheKey
        });
      }

      // 4. Retrieve doctor from repository
      logger.info('Retrieving doctor from repository', { 
        queryId: query.queryId,
        doctorId: query.getDoctorId()
      });

      doctor = await doctorRepository.findByDoctorId(query.getDoctorId());

      if (!doctor) {
        logger.warn('Doctor not found', { 
          queryId: query.queryId,
          doctorId: query.getDoctorId()
        });

        throw new Error(`Không tìm thấy bác sĩ với ID: ${query.getDoctorId()}`);
      }

      // 5. Check if inactive doctors should be included
      if (!doctor.isActive() && !query.shouldIncludeInactive()) {
        logger.warn('Inactive doctor access denied', { 
          queryId: query.queryId,
          doctorId: query.getDoctorId(),
          doctorStatus: doctor.status
        });

        throw new Error(`Bác sĩ ${query.getDoctorId()} không còn hoạt động`);
      }

      // 6. Additional authorization for sensitive data
      if (query.shouldIncludeSensitiveData()) {
        const canAccessSensitive = await authorizationService.authorize(
          query.userId!,
          ['read_sensitive_data', 'admin_access'],
          'sensitive_doctor_data',
          query.correlationId
        );

        if (!canAccessSensitive) {
          logger.warn('Sensitive data access denied', { 
            queryId: query.queryId,
            userId: query.userId,
            doctorId: query.getDoctorId()
          });

          throw new Error('Không có quyền truy cập dữ liệu nhạy cảm');
        }
      }

      // 7. Map to response DTO
      logger.info('Mapping doctor to response', { 
        queryId: query.queryId,
        doctorId: query.getDoctorId(),
        includePersonalInfo: query.shouldIncludePersonalInfo(),
        includeCredentials: query.shouldIncludeCredentials(),
        anonymizeData: query.shouldAnonymizeData()
      });

      const response = DoctorResponseMapper.toDetailResponse(
        doctor,
        query.shouldIncludePersonalInfo(),
        query.shouldIncludeCredentials(),
        query.shouldIncludeWorkSchedule(),
        query.shouldIncludeEmploymentInfo(),
        query.shouldIncludePerformanceMetrics(),
        query.shouldAnonymizeData()
      );

      // 8. Cache the result (if enabled and not sensitive)
      if (query.metadata.cacheable && !query.shouldIncludeSensitiveData()) {
        const ttl = query.metadata.cacheTtlSeconds || 300;
        
        logger.debug('Caching result', { 
          queryId: query.queryId,
          cacheKey: cacheKey,
          ttl: ttl
        });

        await cacheService.set(cacheKey, response, ttl);
      }

      // 9. Audit logging
      if (query.shouldAuditAccess()) {
        await auditService.logDoctorAccess(
          query.getDoctorId(),
          query.userId!,
          'Doctor information accessed',
          {
            includePersonalInfo: query.shouldIncludePersonalInfo(),
            includeCredentials: query.shouldIncludeCredentials(),
            includeWorkSchedule: query.shouldIncludeWorkSchedule(),
            includeEmploymentInfo: query.shouldIncludeEmploymentInfo(),
            includePerformanceMetrics: query.shouldIncludePerformanceMetrics(),
            includeSensitiveData: query.shouldIncludeSensitiveData(),
            anonymized: query.shouldAnonymizeData(),
            requestReason: query.getData().requestReason
          },
          query.correlationId
        );
      }

      logger.info('Doctor retrieval completed successfully', { 
        queryId: query.queryId,
        doctorId: query.getDoctorId(),
        competencyScore: response.competencyScore,
        experienceLevel: response.experienceLevel
      });

      return response;

    } catch (error) {
      logger.error('Error in get doctor use case', {
        queryId: query.queryId,
        doctorId: query.getDoctorId(),
        error: error.message,
        stack: error.stack
      });

      // Audit error
      await auditService.logError(
        query.userId!,
        'get_doctor',
        error.message,
        query.correlationId
      );

      throw error;
    }
  }
}

/**
 * Search Doctors Use Case
 */
import { SearchDoctorsQuery } from '../queries/get-doctor.query';
import { DoctorListResponse, DoctorBasicResponse } from '../dtos/doctor-response.dto';
import { ProviderSearchSpecificationBuilder } from '../../domain/specifications/provider-search.specification';

export class SearchDoctorsUseCase implements BaseHealthcareUseCase<SearchDoctorsQuery, DoctorListResponse> {
  constructor(private dependencies: GetDoctorUseCaseDependencies) {}

  async execute(query: SearchDoctorsQuery): Promise<DoctorListResponse> {
    const { doctorRepository, logger, authorizationService, auditService, cacheService } = this.dependencies;

    try {
      // 1. Validate query
      logger.info('Validating search doctors query', { 
        queryId: query.queryId,
        searchCriteria: query.getSearchCriteria(),
        pagination: query.getPagination()
      });

      const validation = query.validate();
      if (!validation.isValid) {
        throw new Error(`Truy vấn tìm kiếm không hợp lệ: ${validation.errors.join(', ')}`);
      }

      // 2. Authorization check
      const isAuthorized = await authorizationService.authorize(
        query.userId!,
        ['read_doctor', 'search_staff'],
        'doctor_search',
        query.correlationId
      );

      if (!isAuthorized) {
        await auditService.logUnauthorizedAccess(
          query.userId!,
          'search_doctors',
          'Attempted to search doctors without permission',
          query.correlationId
        );

        throw new Error('Không có quyền tìm kiếm thông tin bác sĩ');
      }

      // 3. Check cache
      const cacheKey = query.getCacheKey();
      const cachedResult = await cacheService.get<DoctorListResponse>(cacheKey);
      
      if (cachedResult) {
        logger.info('Search cache hit', { 
          queryId: query.queryId,
          cacheKey: cacheKey
        });

        return cachedResult;
      }

      // 4. Build search specification
      const criteria = query.getSearchCriteria();
      const specBuilder = new ProviderSearchSpecificationBuilder();

      if (criteria.department) {
        specBuilder.inDepartment(criteria.department as any);
      }

      if (criteria.specializations && criteria.specializations.length > 0) {
        specBuilder.withAnySpecialization(criteria.specializations as any[]);
      }

      if (criteria.minExperience !== undefined) {
        specBuilder.withExperience(criteria.minExperience, criteria.maxExperience);
      }

      if (criteria.minCompetencyScore !== undefined) {
        specBuilder.withMinCompetencyScore(criteria.minCompetencyScore);
      }

      if (criteria.availableOnly) {
        specBuilder.availableOnly();
      }

      if (criteria.emergencyCapable) {
        specBuilder.emergencyCareCapable();
      }

      if (criteria.surgeryCapable) {
        specBuilder.surgeryCapable();
      }

      const specification = specBuilder.build();

      // 5. Execute search
      const pagination = query.getPagination();
      const searchResult = await doctorRepository.searchDoctors(
        specification,
        criteria.searchTerm,
        pagination.page,
        pagination.pageSize,
        pagination.sortBy,
        pagination.sortOrder
      );

      // 6. Map results
      const doctors: DoctorBasicResponse[] = searchResult.doctors.map(doctor => 
        DoctorResponseMapper.toBasicResponse(doctor)
      );

      // 7. Build response
      const response: DoctorListResponse = {
        doctors,
        pagination: {
          page: pagination.page,
          pageSize: pagination.pageSize,
          totalCount: searchResult.totalCount,
          totalPages: Math.ceil(searchResult.totalCount / pagination.pageSize),
          hasNextPage: pagination.page < Math.ceil(searchResult.totalCount / pagination.pageSize),
          hasPreviousPage: pagination.page > 1
        },
        filters: {
          department: criteria.department,
          specializations: criteria.specializations,
          status: criteria.status,
          experienceRange: criteria.minExperience !== undefined || criteria.maxExperience !== undefined ? 
            { min: criteria.minExperience || 0, max: criteria.maxExperience || 100 } : undefined,
          competencyRange: criteria.minCompetencyScore !== undefined ? 
            { min: criteria.minCompetencyScore, max: 100 } : undefined
        },
        summary: {
          totalDoctors: searchResult.totalCount,
          activeDoctors: searchResult.summary.activeDoctors,
          inactiveDoctors: searchResult.summary.inactiveDoctors,
          averageCompetencyScore: searchResult.summary.averageCompetencyScore,
          departmentDistribution: searchResult.summary.departmentDistribution,
          specializationDistribution: searchResult.summary.specializationDistribution
        }
      };

      // 8. Cache result
      await cacheService.set(cacheKey, response, 180); // 3 minutes cache

      // 9. Audit logging
      await auditService.logDoctorSearch(
        query.userId!,
        'Doctors searched',
        {
          searchCriteria: criteria,
          resultCount: searchResult.totalCount,
          pagination: pagination
        },
        query.correlationId
      );

      logger.info('Doctor search completed successfully', { 
        queryId: query.queryId,
        resultCount: searchResult.totalCount,
        page: pagination.page
      });

      return response;

    } catch (error) {
      logger.error('Error in search doctors use case', {
        queryId: query.queryId,
        error: error.message,
        stack: error.stack
      });

      await auditService.logError(
        query.userId!,
        'search_doctors',
        error.message,
        query.correlationId
      );

      throw error;
    }
  }
}
