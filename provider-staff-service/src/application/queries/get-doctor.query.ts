/**
 * Get Doctor Query - Application Layer
 * CQRS Query for retrieving doctor information with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CQRS, HIPAA, Healthcare Data Access
 */

import { BaseHealthcareQuery } from '../../../shared/application/queries/base-query';

export interface GetDoctorQueryData {
  doctorId: string;
  includePersonalInfo?: boolean;
  includeCredentials?: boolean;
  includeWorkSchedule?: boolean;
  includePerformanceMetrics?: boolean;
  includeEmploymentInfo?: boolean;
  anonymizeData?: boolean;
  requestedBy: string;
  requestReason?: string;
}

export interface GetDoctorQueryOptions {
  includeInactive?: boolean;
  includeSensitiveData?: boolean;
  auditAccess?: boolean;
  cacheResult?: boolean;
  cacheTtlSeconds?: number;
}

/**
 * Get Doctor Query
 * Query for retrieving doctor information with proper access control
 */
export class GetDoctorQuery extends BaseHealthcareQuery<GetDoctorQueryData> {
  private options: GetDoctorQueryOptions;

  constructor(
    data: GetDoctorQueryData,
    options: GetDoctorQueryOptions = {},
    correlationId?: string,
    userId?: string
  ) {
    super(
      'GetDoctor',
      data,
      correlationId,
      userId || data.requestedBy,
      {
        requiresAuthorization: true,
        requiredPermissions: ['read_doctor', 'view_staff'],
        auditLevel: 'medium',
        complianceLevel: 'HIPAA',
        cacheable: options.cacheResult !== false,
        cacheTtlSeconds: options.cacheTtlSeconds || 300
      }
    );

    this.options = {
      includeInactive: false,
      includeSensitiveData: false,
      auditAccess: true,
      cacheResult: true,
      cacheTtlSeconds: 300,
      ...options
    };
  }

  /**
   * Get query data
   */
  public getData(): GetDoctorQueryData {
    return this.data;
  }

  /**
   * Get doctor ID
   */
  public getDoctorId(): string {
    return this.data.doctorId;
  }

  /**
   * Get query options
   */
  public getOptions(): GetDoctorQueryOptions {
    return this.options;
  }

  /**
   * Check if personal info should be included
   */
  public shouldIncludePersonalInfo(): boolean {
    return this.data.includePersonalInfo === true;
  }

  /**
   * Check if credentials should be included
   */
  public shouldIncludeCredentials(): boolean {
    return this.data.includeCredentials === true;
  }

  /**
   * Check if work schedule should be included
   */
  public shouldIncludeWorkSchedule(): boolean {
    return this.data.includeWorkSchedule === true;
  }

  /**
   * Check if performance metrics should be included
   */
  public shouldIncludePerformanceMetrics(): boolean {
    return this.data.includePerformanceMetrics === true;
  }

  /**
   * Check if employment info should be included
   */
  public shouldIncludeEmploymentInfo(): boolean {
    return this.data.includeEmploymentInfo === true;
  }

  /**
   * Check if data should be anonymized
   */
  public shouldAnonymizeData(): boolean {
    return this.data.anonymizeData === true;
  }

  /**
   * Check if inactive doctors should be included
   */
  public shouldIncludeInactive(): boolean {
    return this.options.includeInactive === true;
  }

  /**
   * Check if sensitive data should be included
   */
  public shouldIncludeSensitiveData(): boolean {
    return this.options.includeSensitiveData === true;
  }

  /**
   * Check if access should be audited
   */
  public shouldAuditAccess(): boolean {
    return this.options.auditAccess !== false;
  }

  /**
   * Get cache key
   */
  public getCacheKey(): string {
    const parts = [
      'doctor',
      this.data.doctorId,
      this.shouldIncludePersonalInfo() ? 'personal' : '',
      this.shouldIncludeCredentials() ? 'credentials' : '',
      this.shouldIncludeWorkSchedule() ? 'schedule' : '',
      this.shouldIncludePerformanceMetrics() ? 'metrics' : '',
      this.shouldIncludeEmploymentInfo() ? 'employment' : '',
      this.shouldAnonymizeData() ? 'anon' : '',
      this.shouldIncludeInactive() ? 'inactive' : ''
    ].filter(Boolean);

    return parts.join(':');
  }

  /**
   * Get required permissions based on requested data
   */
  public getRequiredPermissions(): string[] {
    const permissions = ['read_doctor'];

    if (this.shouldIncludePersonalInfo()) {
      permissions.push('read_personal_info');
    }

    if (this.shouldIncludeCredentials()) {
      permissions.push('read_credentials');
    }

    if (this.shouldIncludePerformanceMetrics()) {
      permissions.push('read_performance_metrics');
    }

    if (this.shouldIncludeEmploymentInfo()) {
      permissions.push('read_employment_info');
    }

    if (this.shouldIncludeSensitiveData()) {
      permissions.push('read_sensitive_data');
    }

    return permissions;
  }

  /**
   * Validate query
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate doctor ID
    if (!this.data.doctorId || this.data.doctorId.trim().length === 0) {
      errors.push('ID bác sĩ không được để trống');
    }

    // Validate doctor ID format
    if (this.data.doctorId && !/^[A-Z]{4}-DOC-\d{6}-\d{3}$/.test(this.data.doctorId)) {
      errors.push('ID bác sĩ không đúng định dạng');
    }

    // Validate requested by
    if (!this.data.requestedBy || this.data.requestedBy.trim().length === 0) {
      errors.push('Người yêu cầu không được để trống');
    }

    // Validate request reason for sensitive data
    if (this.shouldIncludeSensitiveData() && !this.data.requestReason) {
      errors.push('Cần lý do khi truy cập dữ liệu nhạy cảm');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create basic query (minimal data)
   */
  public static createBasic(
    doctorId: string,
    requestedBy: string,
    correlationId?: string
  ): GetDoctorQuery {
    return new GetDoctorQuery(
      {
        doctorId,
        includePersonalInfo: false,
        includeCredentials: false,
        includeWorkSchedule: false,
        includePerformanceMetrics: false,
        includeEmploymentInfo: false,
        anonymizeData: false,
        requestedBy
      },
      {
        includeInactive: false,
        includeSensitiveData: false,
        auditAccess: true,
        cacheResult: true,
        cacheTtlSeconds: 300
      },
      correlationId,
      requestedBy
    );
  }

  /**
   * Create detailed query (all data)
   */
  public static createDetailed(
    doctorId: string,
    requestedBy: string,
    requestReason: string,
    correlationId?: string
  ): GetDoctorQuery {
    return new GetDoctorQuery(
      {
        doctorId,
        includePersonalInfo: true,
        includeCredentials: true,
        includeWorkSchedule: true,
        includePerformanceMetrics: true,
        includeEmploymentInfo: true,
        anonymizeData: false,
        requestedBy,
        requestReason
      },
      {
        includeInactive: false,
        includeSensitiveData: true,
        auditAccess: true,
        cacheResult: false, // Don't cache sensitive data
        cacheTtlSeconds: 0
      },
      correlationId,
      requestedBy
    );
  }

  /**
   * Create anonymized query (for research/analytics)
   */
  public static createAnonymized(
    doctorId: string,
    requestedBy: string,
    requestReason: string,
    correlationId?: string
  ): GetDoctorQuery {
    return new GetDoctorQuery(
      {
        doctorId,
        includePersonalInfo: false,
        includeCredentials: true,
        includeWorkSchedule: true,
        includePerformanceMetrics: true,
        includeEmploymentInfo: false,
        anonymizeData: true,
        requestedBy,
        requestReason
      },
      {
        includeInactive: false,
        includeSensitiveData: false,
        auditAccess: true,
        cacheResult: true,
        cacheTtlSeconds: 600
      },
      correlationId,
      requestedBy
    );
  }

  /**
   * Convert to JSON
   */
  public toJSON(): any {
    return {
      queryType: this.queryType,
      queryId: this.queryId,
      correlationId: this.correlationId,
      userId: this.userId,
      timestamp: this.timestamp.toISOString(),
      data: this.data,
      options: this.options,
      metadata: this.metadata
    };
  }

  /**
   * Create from JSON
   */
  public static fromJSON(json: any): GetDoctorQuery {
    const query = new GetDoctorQuery(
      json.data,
      json.options,
      json.correlationId,
      json.userId
    );
    query.queryId = json.queryId;
    query.timestamp = new Date(json.timestamp);
    return query;
  }
}

/**
 * Search Doctors Query
 */
export interface SearchDoctorsQueryData {
  // Search criteria
  searchTerm?: string;
  department?: string;
  specializations?: string[];
  status?: string[];
  
  // Filters
  minExperience?: number;
  maxExperience?: number;
  minCompetencyScore?: number;
  availableOnly?: boolean;
  emergencyCapable?: boolean;
  surgeryCapable?: boolean;
  
  // Pagination
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Access control
  requestedBy: string;
  requestReason?: string;
}

export class SearchDoctorsQuery extends BaseHealthcareQuery<SearchDoctorsQueryData> {
  constructor(
    data: SearchDoctorsQueryData,
    correlationId?: string,
    userId?: string
  ) {
    super(
      'SearchDoctors',
      data,
      correlationId,
      userId || data.requestedBy,
      {
        requiresAuthorization: true,
        requiredPermissions: ['read_doctor', 'search_staff'],
        auditLevel: 'low',
        complianceLevel: 'HIPAA',
        cacheable: true,
        cacheTtlSeconds: 180
      }
    );
  }

  /**
   * Get search criteria
   */
  public getSearchCriteria(): Partial<SearchDoctorsQueryData> {
    const { requestedBy, requestReason, page, pageSize, sortBy, sortOrder, ...criteria } = this.data;
    return criteria;
  }

  /**
   * Get pagination info
   */
  public getPagination(): { page: number; pageSize: number; sortBy: string; sortOrder: 'asc' | 'desc' } {
    return {
      page: this.data.page || 1,
      pageSize: Math.min(this.data.pageSize || 20, 100), // Max 100 results per page
      sortBy: this.data.sortBy || 'fullName',
      sortOrder: this.data.sortOrder || 'asc'
    };
  }

  /**
   * Get cache key
   */
  public getCacheKey(): string {
    const criteria = this.getSearchCriteria();
    const pagination = this.getPagination();
    
    const key = JSON.stringify({ criteria, pagination });
    return `search:doctors:${Buffer.from(key).toString('base64')}`;
  }

  /**
   * Validate query
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate pagination
    const pagination = this.getPagination();
    if (pagination.page < 1) {
      errors.push('Số trang phải lớn hơn 0');
    }

    if (pagination.pageSize < 1 || pagination.pageSize > 100) {
      errors.push('Kích thước trang phải từ 1 đến 100');
    }

    // Validate experience range
    if (this.data.minExperience !== undefined && this.data.minExperience < 0) {
      errors.push('Kinh nghiệm tối thiểu không được âm');
    }

    if (this.data.maxExperience !== undefined && this.data.maxExperience < 0) {
      errors.push('Kinh nghiệm tối đa không được âm');
    }

    if (this.data.minExperience !== undefined && 
        this.data.maxExperience !== undefined && 
        this.data.minExperience > this.data.maxExperience) {
      errors.push('Kinh nghiệm tối thiểu không được lớn hơn tối đa');
    }

    // Validate competency score
    if (this.data.minCompetencyScore !== undefined && 
        (this.data.minCompetencyScore < 0 || this.data.minCompetencyScore > 100)) {
      errors.push('Điểm năng lực phải từ 0 đến 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
