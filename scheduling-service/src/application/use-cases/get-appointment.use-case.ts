/**
 * Get Appointment Use Case - Application Layer
 * Use case for retrieving appointment information with privacy controls
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Healthcare Privacy, CQRS
 */

import { UseCase } from '../../../shared/application/use-cases/use-case';
import { GetAppointmentQuery, SearchAppointmentsQuery } from '../queries/get-appointment.query';
import { AppointmentResponseDto, AppointmentSearchResultDto, AppointmentResponseMapper } from '../dtos/appointment-response.dto';
import { IAppointmentRepository } from '../../domain/repositories/appointment.repository';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { ICacheService } from '../../../shared/infrastructure/caching/cache.service.interface';

export interface GetAppointmentUseCaseDependencies {
  appointmentRepository: IAppointmentRepository;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
  cacheService: ICacheService;
}

/**
 * Get Appointment Use Case
 * Handles appointment retrieval with privacy controls and caching
 */
export class GetAppointmentUseCase implements UseCase<GetAppointmentQuery, AppointmentResponseDto> {
  
  constructor(private dependencies: GetAppointmentUseCaseDependencies) {}

  /**
   * Execute appointment retrieval
   */
  async execute(query: GetAppointmentQuery): Promise<AppointmentResponseDto> {
    const { appointmentRepository, logger, authorizationService, auditService, cacheService } = this.dependencies;

    try {
      logger.info('Getting appointment', {
        correlationId: query.correlationId,
        appointmentId: query.appointmentId,
        requestedBy: query.requestedBy,
        accessLevel: query.accessLevel
      });

      // Step 1: Authorization check
      const authResult = await this.checkAuthorization(query);
      if (!authResult.isAuthorized) {
        logger.warn('Authorization failed for appointment retrieval', {
          correlationId: query.correlationId,
          appointmentId: query.appointmentId,
          reason: authResult.reason,
          requestedBy: query.requestedBy
        });

        throw new Error(authResult.reason || 'Không có quyền truy cập cuộc hẹn');
      }

      // Step 2: Check cache first
      let appointment = null;
      if (query.canBeCached()) {
        const cacheKey = query.getCacheKey();
        appointment = await cacheService.get(cacheKey);
        
        if (appointment) {
          logger.debug('Appointment retrieved from cache', {
            correlationId: query.correlationId,
            appointmentId: query.appointmentId,
            cacheKey
          });

          // Still need to audit access
          if (query.auditAccess) {
            await this.auditAppointmentAccess(query, appointment);
          }

          return appointment;
        }
      }

      // Step 3: Get appointment from repository
      appointment = await appointmentRepository.findByAppointmentId(query.appointmentId);
      
      if (!appointment) {
        logger.warn('Appointment not found', {
          correlationId: query.correlationId,
          appointmentId: query.appointmentId
        });

        throw new Error('Không tìm thấy cuộc hẹn');
      }

      // Step 4: Additional authorization checks based on appointment data
      const dataAuthResult = await this.checkDataAuthorization(query, appointment);
      if (!dataAuthResult.isAuthorized) {
        logger.warn('Data authorization failed', {
          correlationId: query.correlationId,
          appointmentId: query.appointmentId,
          reason: dataAuthResult.reason
        });

        throw new Error(dataAuthResult.reason || 'Không có quyền truy cập dữ liệu cuộc hẹn này');
      }

      // Step 5: Map to response DTO
      const appointmentDto = AppointmentResponseMapper.mapToDto(
        appointment,
        query.includePatientInfo,
        query.includeProviderInfo,
        query.includeAppointmentDetails,
        query.includeStatusHistory,
        query.anonymizeData,
        query.accessLevel
      );

      // Step 6: Cache result if applicable
      if (query.canBeCached()) {
        const cacheKey = query.getCacheKey();
        await cacheService.set(cacheKey, appointmentDto, query.maxCacheAge);
        
        logger.debug('Appointment cached', {
          correlationId: query.correlationId,
          appointmentId: query.appointmentId,
          cacheKey,
          ttl: query.maxCacheAge
        });
      }

      // Step 7: Audit access
      if (query.auditAccess) {
        await this.auditAppointmentAccess(query, appointmentDto);
      }

      logger.info('Appointment retrieved successfully', {
        correlationId: query.correlationId,
        appointmentId: query.appointmentId,
        status: appointmentDto.status,
        accessLevel: query.accessLevel
      });

      return appointmentDto;

    } catch (error) {
      logger.error('Error in get appointment use case', {
        correlationId: query.correlationId,
        appointmentId: query.appointmentId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Check authorization for appointment access
   */
  private async checkAuthorization(query: GetAppointmentQuery): Promise<{ isAuthorized: boolean; reason?: string }> {
    const { authorizationService } = this.dependencies;

    try {
      const requiredPermissions = query.getRequiredPermissions();
      
      for (const permission of requiredPermissions) {
        const hasPermission = await authorizationService.hasPermission(
          query.requestedBy,
          permission
        );

        if (!hasPermission) {
          return { 
            isAuthorized: false, 
            reason: `Không có quyền ${permission}` 
          };
        }
      }

      return { isAuthorized: true };

    } catch (error) {
      this.dependencies.logger.error('Authorization check failed', {
        error: error.message,
        requestedBy: query.requestedBy
      });

      return { isAuthorized: false, reason: 'Lỗi kiểm tra quyền hạn' };
    }
  }

  /**
   * Check data-specific authorization
   */
  private async checkDataAuthorization(
    query: GetAppointmentQuery,
    appointment: any
  ): Promise<{ isAuthorized: boolean; reason?: string }> {
    const { authorizationService } = this.dependencies;

    try {
      // Check if user can access this specific patient's data
      if (query.includePatientInfo) {
        const canAccessPatient = await authorizationService.canAccessPatientData(
          query.requestedBy,
          appointment.patient.patientId
        );

        if (!canAccessPatient) {
          return { 
            isAuthorized: false, 
            reason: 'Không có quyền truy cập dữ liệu bệnh nhân này' 
          };
        }
      }

      // Check if user can access this specific provider's data
      if (query.includeProviderInfo) {
        const canAccessProvider = await authorizationService.canAccessProviderData(
          query.requestedBy,
          appointment.provider.providerId
        );

        if (!canAccessProvider) {
          return { 
            isAuthorized: false, 
            reason: 'Không có quyền truy cập dữ liệu bác sĩ này' 
          };
        }
      }

      // Check emergency appointment access
      if (appointment.appointmentId.isEmergency() && query.accessLevel !== 'admin') {
        const canAccessEmergency = await authorizationService.hasPermission(
          query.requestedBy,
          'appointment:read:emergency'
        );

        if (!canAccessEmergency) {
          return { 
            isAuthorized: false, 
            reason: 'Không có quyền truy cập cuộc hẹn cấp cứu' 
          };
        }
      }

      return { isAuthorized: true };

    } catch (error) {
      this.dependencies.logger.error('Data authorization check failed', {
        error: error.message,
        appointmentId: query.appointmentId
      });

      return { isAuthorized: false, reason: 'Lỗi kiểm tra quyền truy cập dữ liệu' };
    }
  }

  /**
   * Audit appointment access
   */
  private async auditAppointmentAccess(
    query: GetAppointmentQuery,
    appointment: AppointmentResponseDto
  ): Promise<void> {
    const { auditService, logger } = this.dependencies;

    try {
      await auditService.logAppointmentAccess(
        query.appointmentId,
        query.requestedBy,
        'Appointment data accessed',
        {
          accessLevel: query.accessLevel,
          includePatientInfo: query.includePatientInfo,
          includeProviderInfo: query.includeProviderInfo,
          includeSensitiveData: query.includeSensitiveData,
          requestReason: query.requestReason,
          appointmentStatus: appointment.status,
          patientId: appointment.patient?.patientId,
          providerId: appointment.provider?.providerId
        }
      );

    } catch (error) {
      logger.error('Error auditing appointment access', {
        appointmentId: query.appointmentId,
        requestedBy: query.requestedBy,
        error: error.message
      });
    }
  }
}

/**
 * Search Appointments Use Case
 * Handles appointment searching with complex criteria and privacy controls
 */
export class SearchAppointmentsUseCase implements UseCase<SearchAppointmentsQuery, AppointmentSearchResultDto> {
  
  constructor(private dependencies: GetAppointmentUseCaseDependencies) {}

  /**
   * Execute appointment search
   */
  async execute(query: SearchAppointmentsQuery): Promise<AppointmentSearchResultDto> {
    const { appointmentRepository, logger, authorizationService, auditService, cacheService } = this.dependencies;

    try {
      logger.info('Searching appointments', {
        correlationId: query.correlationId,
        searchTerm: query.searchTerm,
        patientId: query.patientId,
        providerId: query.providerId,
        page: query.page,
        pageSize: query.pageSize,
        requestedBy: query.requestedBy
      });

      // Step 1: Authorization check
      const authResult = await this.checkSearchAuthorization(query);
      if (!authResult.isAuthorized) {
        logger.warn('Authorization failed for appointment search', {
          correlationId: query.correlationId,
          reason: authResult.reason,
          requestedBy: query.requestedBy
        });

        throw new Error(authResult.reason || 'Không có quyền tìm kiếm cuộc hẹn');
      }

      // Step 2: Check cache for search results
      let searchResult = null;
      const cacheKey = query.getCacheKey();
      
      if (!query.isEmergencyQuery()) {
        searchResult = await cacheService.get(cacheKey);
        
        if (searchResult) {
          logger.debug('Search results retrieved from cache', {
            correlationId: query.correlationId,
            cacheKey,
            totalCount: searchResult.pagination.totalCount
          });

          return searchResult;
        }
      }

      // Step 3: Execute search
      const searchResults = await appointmentRepository.searchAppointments(
        query.searchTerm,
        {
          patientId: query.patientId,
          providerId: query.providerId,
          department: query.department,
          appointmentTypes: query.appointmentTypes,
          statuses: query.statuses,
          priorities: query.priorities,
          startDate: query.startDate,
          endDate: query.endDate,
          roomId: query.data.roomId
        },
        query.page,
        query.pageSize,
        query.sortBy,
        query.sortOrder
      );

      // Step 4: Map appointments to DTOs
      const appointmentDtos = searchResults.appointments.map(appointment =>
        AppointmentResponseMapper.mapToDto(
          appointment,
          query.data.includePatientInfo,
          query.data.includeProviderInfo,
          true, // includeDetails
          false, // includeHistory
          query.data.anonymizeData,
          query.data.accessLevel || 'standard'
        )
      );

      // Step 5: Calculate summary statistics
      const summary = this.calculateSearchSummary(appointmentDtos);

      // Step 6: Build search result
      const result: AppointmentSearchResultDto = {
        appointments: appointmentDtos,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalCount: searchResults.totalCount,
          totalPages: Math.ceil(searchResults.totalCount / query.pageSize),
          hasNextPage: query.page * query.pageSize < searchResults.totalCount,
          hasPreviousPage: query.page > 1
        },
        summary,
        filters: {
          appliedFilters: this.getAppliedFilters(query),
          availableFilters: searchResults.availableFilters || {
            departments: [],
            appointmentTypes: [],
            statuses: [],
            priorities: []
          }
        }
      };

      // Step 7: Cache results (except emergency queries)
      if (!query.isEmergencyQuery()) {
        await cacheService.set(cacheKey, result, 300); // 5 minutes cache
        
        logger.debug('Search results cached', {
          correlationId: query.correlationId,
          cacheKey,
          totalCount: result.pagination.totalCount
        });
      }

      // Step 8: Audit search
      await this.auditAppointmentSearch(query, result);

      logger.info('Appointment search completed successfully', {
        correlationId: query.correlationId,
        totalCount: result.pagination.totalCount,
        page: query.page,
        pageSize: query.pageSize
      });

      return result;

    } catch (error) {
      logger.error('Error in search appointments use case', {
        correlationId: query.correlationId,
        error: error.message,
        stack: error.stack
      });

      throw error;
    }
  }

  /**
   * Check authorization for appointment search
   */
  private async checkSearchAuthorization(query: SearchAppointmentsQuery): Promise<{ isAuthorized: boolean; reason?: string }> {
    const { authorizationService } = this.dependencies;

    try {
      // Basic search permission
      const hasSearchPermission = await authorizationService.hasPermission(
        query.requestedBy,
        'appointment:search'
      );

      if (!hasSearchPermission) {
        return { isAuthorized: false, reason: 'Không có quyền tìm kiếm cuộc hẹn' };
      }

      // Patient-specific search
      if (query.patientId) {
        const canAccessPatient = await authorizationService.canAccessPatientData(
          query.requestedBy,
          query.patientId
        );

        if (!canAccessPatient) {
          return { isAuthorized: false, reason: 'Không có quyền truy cập dữ liệu bệnh nhân này' };
        }
      }

      // Provider-specific search
      if (query.providerId) {
        const canAccessProvider = await authorizationService.canAccessProviderData(
          query.requestedBy,
          query.providerId
        );

        if (!canAccessProvider) {
          return { isAuthorized: false, reason: 'Không có quyền truy cập dữ liệu bác sĩ này' };
        }
      }

      // Emergency appointments search
      if (query.isEmergencyQuery()) {
        const hasEmergencyPermission = await authorizationService.hasPermission(
          query.requestedBy,
          'appointment:search:emergency'
        );

        if (!hasEmergencyPermission) {
          return { isAuthorized: false, reason: 'Không có quyền tìm kiếm cuộc hẹn cấp cứu' };
        }
      }

      return { isAuthorized: true };

    } catch (error) {
      this.dependencies.logger.error('Search authorization check failed', {
        error: error.message,
        requestedBy: query.requestedBy
      });

      return { isAuthorized: false, reason: 'Lỗi kiểm tra quyền hạn' };
    }
  }

  /**
   * Calculate search summary statistics
   */
  private calculateSearchSummary(appointments: AppointmentResponseDto[]): any {
    const summary = {
      totalAppointments: appointments.length,
      scheduledAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      emergencyAppointments: 0,
      todayAppointments: 0,
      upcomingAppointments: 0,
      departmentDistribution: {} as { [department: string]: number },
      appointmentTypeDistribution: {} as { [type: string]: number },
      statusDistribution: {} as { [status: string]: number }
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    appointments.forEach(appointment => {
      // Status distribution
      summary.statusDistribution[appointment.status] = 
        (summary.statusDistribution[appointment.status] || 0) + 1;

      // Count by status
      switch (appointment.status) {
        case 'scheduled':
          summary.scheduledAppointments++;
          break;
        case 'confirmed':
          summary.confirmedAppointments++;
          break;
        case 'completed':
          summary.completedAppointments++;
          break;
        case 'cancelled':
          summary.cancelledAppointments++;
          break;
      }

      // Emergency appointments
      if (appointment.isEmergency) {
        summary.emergencyAppointments++;
      }

      // Today appointments
      const appointmentDate = new Date(appointment.timeSlot.startTime);
      appointmentDate.setHours(0, 0, 0, 0);
      if (appointmentDate.getTime() === today.getTime()) {
        summary.todayAppointments++;
      }

      // Upcoming appointments
      if (appointmentDate > today) {
        summary.upcomingAppointments++;
      }

      // Department distribution
      if (appointment.provider?.department) {
        const dept = appointment.provider.departmentVietnamese;
        summary.departmentDistribution[dept] = 
          (summary.departmentDistribution[dept] || 0) + 1;
      }

      // Appointment type distribution
      const type = appointment.appointmentTypeVietnamese;
      summary.appointmentTypeDistribution[type] = 
        (summary.appointmentTypeDistribution[type] || 0) + 1;
    });

    return summary;
  }

  /**
   * Get applied filters for search
   */
  private getAppliedFilters(query: SearchAppointmentsQuery): string[] {
    const filters: string[] = [];

    if (query.searchTerm) filters.push(`Từ khóa: ${query.searchTerm}`);
    if (query.patientId) filters.push(`Bệnh nhân: ${query.patientId}`);
    if (query.providerId) filters.push(`Bác sĩ: ${query.providerId}`);
    if (query.department) filters.push(`Khoa: ${query.department}`);
    if (query.appointmentTypes?.length) filters.push(`Loại: ${query.appointmentTypes.join(', ')}`);
    if (query.statuses?.length) filters.push(`Trạng thái: ${query.statuses.join(', ')}`);
    if (query.startDate) filters.push(`Từ ngày: ${query.startDate}`);
    if (query.endDate) filters.push(`Đến ngày: ${query.endDate}`);

    return filters;
  }

  /**
   * Audit appointment search
   */
  private async auditAppointmentSearch(
    query: SearchAppointmentsQuery,
    result: AppointmentSearchResultDto
  ): Promise<void> {
    const { auditService, logger } = this.dependencies;

    try {
      await auditService.logAppointmentSearch(
        query.requestedBy,
        'Appointment search performed',
        {
          searchTerm: query.searchTerm,
          patientId: query.patientId,
          providerId: query.providerId,
          department: query.department,
          appointmentTypes: query.appointmentTypes,
          statuses: query.statuses,
          page: query.page,
          pageSize: query.pageSize,
          totalResults: result.pagination.totalCount,
          emergencyQuery: query.isEmergencyQuery()
        }
      );

    } catch (error) {
      logger.error('Error auditing appointment search', {
        requestedBy: query.requestedBy,
        error: error.message
      });
    }
  }
}
