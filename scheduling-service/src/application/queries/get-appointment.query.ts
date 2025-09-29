/**
 * Get Appointment Query - Application Layer
 * CQRS query for retrieving appointment information with privacy controls
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance CQRS, Healthcare Privacy, Vietnamese Localization
 */

import { Query } from '../../../shared/application/queries/query';
import { AppointmentStatus } from '../../domain/aggregates/appointment.aggregate';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/appointment-id';

export interface GetAppointmentQueryData {
  appointmentId: string;
  includePatientInfo?: boolean;
  includeProviderInfo?: boolean;
  includeTimeSlotDetails?: boolean;
  includeAppointmentDetails?: boolean;
  includeStatusHistory?: boolean;
  includeReminderHistory?: boolean;
  anonymizeData?: boolean;
  requestedBy: string;
  requestReason?: string;
  accessLevel?: 'basic' | 'standard' | 'full' | 'admin';
}

export interface GetAppointmentQueryOptions {
  includeInactive?: boolean;
  includeSensitiveData?: boolean;
  auditAccess?: boolean;
  cacheResult?: boolean;
  maxCacheAge?: number; // seconds
}

/**
 * Get Appointment Query
 * Query to retrieve appointment information with privacy controls
 */
export class GetAppointmentQuery extends Query<GetAppointmentQueryData> {
  
  constructor(
    data: GetAppointmentQueryData,
    options: GetAppointmentQueryOptions = {},
    correlationId?: string,
    userId?: string
  ) {
    super(data, options, correlationId, userId);
    this.validateQuery();
  }

  /**
   * Create basic appointment query
   */
  public static createBasic(
    appointmentId: string,
    requestedBy: string,
    correlationId?: string
  ): GetAppointmentQuery {
    const data: GetAppointmentQueryData = {
      appointmentId,
      includePatientInfo: true,
      includeProviderInfo: true,
      includeTimeSlotDetails: true,
      includeAppointmentDetails: true,
      includeStatusHistory: false,
      includeReminderHistory: false,
      anonymizeData: false,
      requestedBy,
      accessLevel: 'standard'
    };

    const options: GetAppointmentQueryOptions = {
      includeInactive: false,
      includeSensitiveData: false,
      auditAccess: true,
      cacheResult: true,
      maxCacheAge: 300 // 5 minutes
    };

    return new GetAppointmentQuery(data, options, correlationId, requestedBy);
  }

  /**
   * Create full appointment query for admin
   */
  public static createFull(
    appointmentId: string,
    requestedBy: string,
    requestReason: string,
    correlationId?: string
  ): GetAppointmentQuery {
    const data: GetAppointmentQueryData = {
      appointmentId,
      includePatientInfo: true,
      includeProviderInfo: true,
      includeTimeSlotDetails: true,
      includeAppointmentDetails: true,
      includeStatusHistory: true,
      includeReminderHistory: true,
      anonymizeData: false,
      requestedBy,
      requestReason,
      accessLevel: 'full'
    };

    const options: GetAppointmentQueryOptions = {
      includeInactive: true,
      includeSensitiveData: true,
      auditAccess: true,
      cacheResult: false // Don't cache sensitive data
    };

    return new GetAppointmentQuery(data, options, correlationId, requestedBy);
  }

  /**
   * Create anonymized appointment query
   */
  public static createAnonymized(
    appointmentId: string,
    requestedBy: string,
    correlationId?: string
  ): GetAppointmentQuery {
    const data: GetAppointmentQueryData = {
      appointmentId,
      includePatientInfo: false,
      includeProviderInfo: true,
      includeTimeSlotDetails: true,
      includeAppointmentDetails: false,
      includeStatusHistory: false,
      includeReminderHistory: false,
      anonymizeData: true,
      requestedBy,
      accessLevel: 'basic'
    };

    const options: GetAppointmentQueryOptions = {
      includeInactive: false,
      includeSensitiveData: false,
      auditAccess: true,
      cacheResult: true,
      maxCacheAge: 600 // 10 minutes for anonymized data
    };

    return new GetAppointmentQuery(data, options, correlationId, requestedBy);
  }

  /**
   * Getters
   */
  get appointmentId(): string {
    return this.data.appointmentId;
  }

  get includePatientInfo(): boolean {
    return this.data.includePatientInfo === true;
  }

  get includeProviderInfo(): boolean {
    return this.data.includeProviderInfo === true;
  }

  get includeTimeSlotDetails(): boolean {
    return this.data.includeTimeSlotDetails === true;
  }

  get includeAppointmentDetails(): boolean {
    return this.data.includeAppointmentDetails === true;
  }

  get includeStatusHistory(): boolean {
    return this.data.includeStatusHistory === true;
  }

  get includeReminderHistory(): boolean {
    return this.data.includeReminderHistory === true;
  }

  get anonymizeData(): boolean {
    return this.data.anonymizeData === true;
  }

  get requestedBy(): string {
    return this.data.requestedBy;
  }

  get requestReason(): string | undefined {
    return this.data.requestReason;
  }

  get accessLevel(): string {
    return this.data.accessLevel || 'standard';
  }

  get includeInactive(): boolean {
    return this.options?.includeInactive === true;
  }

  get includeSensitiveData(): boolean {
    return this.options?.includeSensitiveData === true;
  }

  get auditAccess(): boolean {
    return this.options?.auditAccess !== false; // Default true
  }

  get cacheResult(): boolean {
    return this.options?.cacheResult !== false; // Default true
  }

  get maxCacheAge(): number {
    return this.options?.maxCacheAge || 300; // Default 5 minutes
  }

  /**
   * Business methods
   */

  /**
   * Check if query requires high-level access
   */
  public requiresHighLevelAccess(): boolean {
    return this.data.accessLevel === 'full' ||
           this.data.accessLevel === 'admin' ||
           this.includeSensitiveData ||
           this.includeStatusHistory ||
           this.includeReminderHistory;
  }

  /**
   * Check if query can be cached
   */
  public canBeCached(): boolean {
    return this.cacheResult &&
           !this.includeSensitiveData &&
           this.data.accessLevel !== 'admin';
  }

  /**
   * Get cache key
   */
  public getCacheKey(): string {
    const keyParts = [
      'appointment',
      this.data.appointmentId,
      this.data.accessLevel,
      this.includePatientInfo ? 'patient' : '',
      this.includeProviderInfo ? 'provider' : '',
      this.includeTimeSlotDetails ? 'timeslot' : '',
      this.includeAppointmentDetails ? 'details' : '',
      this.anonymizeData ? 'anon' : ''
    ].filter(part => part.length > 0);

    return keyParts.join(':');
  }

  /**
   * Get required permissions
   */
  public getRequiredPermissions(): string[] {
    const permissions: string[] = ['appointment:read'];

    if (this.includePatientInfo) {
      permissions.push('patient:read');
    }

    if (this.includeProviderInfo) {
      permissions.push('provider:read');
    }

    if (this.includeSensitiveData) {
      permissions.push('appointment:read:sensitive');
    }

    if (this.includeStatusHistory) {
      permissions.push('appointment:read:history');
    }

    if (this.data.accessLevel === 'admin') {
      permissions.push('appointment:admin');
    }

    return permissions;
  }

  /**
   * Private validation methods
   */

  private validateQuery(): void {
    const errors: string[] = [];

    if (!this.data.appointmentId || this.data.appointmentId.trim().length === 0) {
      errors.push('ID cuộc hẹn không được để trống');
    }

    if (!this.data.requestedBy || this.data.requestedBy.trim().length === 0) {
      errors.push('Người yêu cầu không được để trống');
    }

    // Validate appointment ID format
    if (this.data.appointmentId && !this.isValidAppointmentIdFormat(this.data.appointmentId)) {
      errors.push('Định dạng ID cuộc hẹn không hợp lệ');
    }

    // Validate access level
    const validAccessLevels = ['basic', 'standard', 'full', 'admin'];
    if (this.data.accessLevel && !validAccessLevels.includes(this.data.accessLevel)) {
      errors.push('Mức độ truy cập không hợp lệ');
    }

    // Business rule: High-level access requires reason
    if (this.requiresHighLevelAccess() && !this.data.requestReason) {
      errors.push('Truy cập mức cao cần có lý do');
    }

    if (errors.length > 0) {
      throw new Error(`Lỗi validation query: ${errors.join(', ')}`);
    }
  }

  private isValidAppointmentIdFormat(appointmentId: string): boolean {
    // Format: TYPE-DEPT-YYYYMM-XXX
    const pattern = /^[A-Z]{4}-[A-Z]{4}-\d{6}-\d{3}$/;
    return pattern.test(appointmentId);
  }
}

/**
 * Search Appointments Query
 * Query for searching appointments with complex criteria
 */
export interface SearchAppointmentsQueryData {
  searchTerm?: string;
  patientId?: string;
  providerId?: string;
  department?: string;
  appointmentTypes?: AppointmentType[];
  statuses?: AppointmentStatus[];
  priorities?: AppointmentPriority[];
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  roomId?: string;
  includePatientInfo?: boolean;
  includeProviderInfo?: boolean;
  anonymizeData?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  requestedBy: string;
  requestReason?: string;
  accessLevel?: 'basic' | 'standard' | 'full' | 'admin';
}

export class SearchAppointmentsQuery extends Query<SearchAppointmentsQueryData> {
  
  constructor(
    data: SearchAppointmentsQueryData,
    correlationId?: string,
    userId?: string
  ) {
    super(data, {}, correlationId, userId);
    this.validateQuery();
  }

  /**
   * Create patient appointments query
   */
  public static createForPatient(
    patientId: string,
    requestedBy: string,
    startDate?: string,
    endDate?: string,
    correlationId?: string
  ): SearchAppointmentsQuery {
    const data: SearchAppointmentsQueryData = {
      patientId,
      startDate,
      endDate,
      includePatientInfo: true,
      includeProviderInfo: true,
      anonymizeData: false,
      page: 1,
      pageSize: 20,
      sortBy: 'startTime',
      sortOrder: 'desc',
      requestedBy,
      accessLevel: 'standard'
    };

    return new SearchAppointmentsQuery(data, correlationId, requestedBy);
  }

  /**
   * Create provider appointments query
   */
  public static createForProvider(
    providerId: string,
    requestedBy: string,
    startDate?: string,
    endDate?: string,
    correlationId?: string
  ): SearchAppointmentsQuery {
    const data: SearchAppointmentsQueryData = {
      providerId,
      startDate,
      endDate,
      includePatientInfo: true,
      includeProviderInfo: true,
      anonymizeData: false,
      page: 1,
      pageSize: 50,
      sortBy: 'startTime',
      sortOrder: 'asc',
      requestedBy,
      accessLevel: 'standard'
    };

    return new SearchAppointmentsQuery(data, correlationId, requestedBy);
  }

  /**
   * Create emergency appointments query
   */
  public static createEmergencyAppointments(
    requestedBy: string,
    correlationId?: string
  ): SearchAppointmentsQuery {
    const data: SearchAppointmentsQueryData = {
      appointmentTypes: [AppointmentType.EMERGENCY],
      priorities: [AppointmentPriority.EMERGENCY, AppointmentPriority.URGENT],
      statuses: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS],
      includePatientInfo: true,
      includeProviderInfo: true,
      anonymizeData: false,
      page: 1,
      pageSize: 100,
      sortBy: 'priority',
      sortOrder: 'desc',
      requestedBy,
      accessLevel: 'full'
    };

    return new SearchAppointmentsQuery(data, correlationId, requestedBy);
  }

  /**
   * Getters and business methods
   */
  get searchTerm(): string | undefined {
    return this.data.searchTerm;
  }

  get patientId(): string | undefined {
    return this.data.patientId;
  }

  get providerId(): string | undefined {
    return this.data.providerId;
  }

  get department(): string | undefined {
    return this.data.department;
  }

  get appointmentTypes(): AppointmentType[] | undefined {
    return this.data.appointmentTypes;
  }

  get statuses(): AppointmentStatus[] | undefined {
    return this.data.statuses;
  }

  get priorities(): AppointmentPriority[] | undefined {
    return this.data.priorities;
  }

  get startDate(): Date | undefined {
    return this.data.startDate ? new Date(this.data.startDate) : undefined;
  }

  get endDate(): Date | undefined {
    return this.data.endDate ? new Date(this.data.endDate) : undefined;
  }

  get page(): number {
    return this.data.page || 1;
  }

  get pageSize(): number {
    return Math.min(this.data.pageSize || 20, 100); // Max 100 per page
  }

  get sortBy(): string {
    return this.data.sortBy || 'startTime';
  }

  get sortOrder(): 'asc' | 'desc' {
    return this.data.sortOrder || 'asc';
  }

  /**
   * Check if query is for emergency appointments
   */
  public isEmergencyQuery(): boolean {
    return this.data.appointmentTypes?.includes(AppointmentType.EMERGENCY) === true ||
           this.data.priorities?.includes(AppointmentPriority.EMERGENCY) === true;
  }

  /**
   * Get cache key for search results
   */
  public getCacheKey(): string {
    const keyParts = [
      'appointments:search',
      this.data.searchTerm || '',
      this.data.patientId || '',
      this.data.providerId || '',
      this.data.department || '',
      this.data.appointmentTypes?.join(',') || '',
      this.data.statuses?.join(',') || '',
      this.data.startDate || '',
      this.data.endDate || '',
      this.page.toString(),
      this.pageSize.toString(),
      this.sortBy,
      this.sortOrder
    ].filter(part => part.length > 0);

    return keyParts.join(':');
  }

  private validateQuery(): void {
    const errors: string[] = [];

    if (!this.data.requestedBy || this.data.requestedBy.trim().length === 0) {
      errors.push('Người yêu cầu không được để trống');
    }

    if (this.data.page && this.data.page < 1) {
      errors.push('Số trang phải lớn hơn 0');
    }

    if (this.data.pageSize && (this.data.pageSize < 1 || this.data.pageSize > 100)) {
      errors.push('Kích thước trang phải từ 1 đến 100');
    }

    if (this.data.startDate && this.data.endDate) {
      const start = new Date(this.data.startDate);
      const end = new Date(this.data.endDate);
      if (start > end) {
        errors.push('Ngày bắt đầu phải trước ngày kết thúc');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Lỗi validation query: ${errors.join(', ')}`);
    }
  }
}
