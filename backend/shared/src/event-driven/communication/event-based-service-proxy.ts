/**
 * Event-Based Service Proxy - Cross-Service Communication
 * Replaces direct database access with event-driven communication
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Microservices, Schema Isolation, Event-Driven Architecture
 */

import { 
  IServiceCommunicator, 
  ServiceRequest, 
  ServiceResponse, 
  HealthcareServiceType, 
  HealthcareRequestType,
  RequestOptions 
} from './service-communicator.interface';
import { IDomainEventBus } from '../../domain/events/domain-event-publisher.interface';

/**
 * Service Proxy Configuration
 */
export interface ServiceProxyConfig {
  sourceService: string;
  defaultTimeout: number;
  enableCaching: boolean;
  cacheTTL: number;
  enableRetry: boolean;
  maxRetries: number;
  enableCircuitBreaker: boolean;
  enableMetrics: boolean;
}

/**
 * Cache Entry Interface
 */
interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  ttl: number;
}

/**
 * Event-Based Service Proxy
 * Eliminates cross-schema access by using event-driven communication
 */
export class EventBasedServiceProxy {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(
    private readonly serviceCommunicator: IServiceCommunicator,
    private readonly eventBus: IDomainEventBus,
    private readonly config: ServiceProxyConfig
  ) {}

  /**
   * Patient Service Proxy Methods
   * Replaces direct access to patient_schema
   */
  public async getPatientInfo(patientId: string, userId?: string): Promise<any> {
    const cacheKey = `patient_info_${patientId}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    // Check for pending request
    const pendingKey = `get_patient_${patientId}`;
    if (this.pendingRequests.has(pendingKey)) {
      return await this.pendingRequests.get(pendingKey);
    }

    // Create new request
    const requestPromise = this.serviceCommunicator.sendRequest(
      HealthcareServiceType.PATIENT_SERVICE,
      HealthcareRequestType.GET_PATIENT_INFO,
      { patientId },
      {
        timeout: this.config.defaultTimeout,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    this.pendingRequests.set(pendingKey, requestPromise);

    try {
      const response = await requestPromise;
      
      if (response.success && response.payload) {
        // Cache the result
        if (this.config.enableCaching) {
          this.setCachedData(cacheKey, response.payload);
        }
        
        return response.payload;
      } else {
        throw new Error(response.error?.message || 'Failed to get patient info');
      }
    } finally {
      this.pendingRequests.delete(pendingKey);
    }
  }

  /**
   * Validate patient exists and is active
   */
  public async validatePatient(patientId: string, userId?: string): Promise<{
    isValid: boolean;
    isActive: boolean;
    patientName?: string;
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.PATIENT_SERVICE,
      HealthcareRequestType.VALIDATE_PATIENT,
      { patientId },
      {
        timeout: 5000, // Quick validation
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Patient validation failed');
    }
  }

  /**
   * Doctor Service Proxy Methods
   * Replaces direct access to doctor_schema
   */
  public async getDoctorAvailability(
    doctorId: string, 
    date: Date, 
    userId?: string
  ): Promise<any> {
    const cacheKey = `doctor_availability_${doctorId}_${date.toISOString().split('T')[0]}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.DOCTOR_SERVICE,
      HealthcareRequestType.GET_DOCTOR_AVAILABILITY,
      { doctorId, date },
      {
        timeout: this.config.defaultTimeout,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success && response.payload) {
      // Cache with shorter TTL for availability data
      if (this.config.enableCaching) {
        this.setCachedData(cacheKey, response.payload, 300); // 5 minutes
      }
      
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Failed to get doctor availability');
    }
  }

  /**
   * Validate doctor exists and is active
   */
  public async validateDoctor(doctorId: string, userId?: string): Promise<{
    isValid: boolean;
    isActive: boolean;
    doctorName?: string;
    specialties?: string[];
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.DOCTOR_SERVICE,
      HealthcareRequestType.VALIDATE_DOCTOR,
      { doctorId },
      {
        timeout: 5000,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Doctor validation failed');
    }
  }

  /**
   * Appointment Service Proxy Methods
   * Replaces direct access to appointment_schema
   */
  public async validateAppointmentSlot(
    doctorId: string,
    appointmentDate: Date,
    duration: number,
    userId?: string
  ): Promise<{
    isAvailable: boolean;
    conflictingAppointments?: any[];
    suggestedSlots?: Date[];
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.APPOINTMENT_SERVICE,
      HealthcareRequestType.VALIDATE_APPOINTMENT_SLOT,
      { doctorId, appointmentDate, duration },
      {
        timeout: 10000,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Appointment slot validation failed');
    }
  }

  /**
   * Reserve appointment slot temporarily
   */
  public async reserveAppointmentSlot(
    doctorId: string,
    appointmentDate: Date,
    duration: number,
    patientId: string,
    userId?: string
  ): Promise<{
    reservationId: string;
    expiresAt: Date;
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.APPOINTMENT_SERVICE,
      HealthcareRequestType.RESERVE_APPOINTMENT_SLOT,
      { doctorId, appointmentDate, duration, patientId },
      {
        timeout: 15000,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Failed to reserve appointment slot');
    }
  }

  /**
   * Medical Records Service Proxy Methods
   * Replaces direct access to medical_records_schema
   */
  public async getMedicalHistory(
    patientId: string,
    fromDate?: Date,
    toDate?: Date,
    userId?: string
  ): Promise<any> {
    const cacheKey = `medical_history_${patientId}_${fromDate?.toISOString()}_${toDate?.toISOString()}`;
    
    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.getCachedData(cacheKey);
      if (cached) return cached;
    }

    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.MEDICAL_RECORDS_SERVICE,
      HealthcareRequestType.GET_MEDICAL_HISTORY,
      { patientId, fromDate, toDate },
      {
        timeout: this.config.defaultTimeout,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success && response.payload) {
      // Cache medical history with longer TTL
      if (this.config.enableCaching) {
        this.setCachedData(cacheKey, response.payload, 1800); // 30 minutes
      }
      
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Failed to get medical history');
    }
  }

  /**
   * Payment Service Proxy Methods
   * Replaces direct access to payment_schema
   */
  public async validateInsurance(
    patientId: string,
    insuranceInfo: any,
    userId?: string
  ): Promise<{
    isValid: boolean;
    isActive: boolean;
    coverageDetails?: any;
    copayAmount?: number;
    deductibleRemaining?: number;
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.PAYMENT_SERVICE,
      HealthcareRequestType.VALIDATE_INSURANCE,
      { patientId, insuranceInfo },
      {
        timeout: 30000, // Insurance validation can take longer
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Insurance validation failed');
    }
  }

  /**
   * Auth Service Proxy Methods
   * Replaces direct access to auth_schema
   */
  public async validateUserPermissions(
    userId: string,
    requiredPermissions: string[],
    resourceId?: string
  ): Promise<{
    hasPermissions: boolean;
    grantedPermissions: string[];
    deniedPermissions: string[];
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.AUTH_SERVICE,
      'validate_user_permissions',
      { userId, requiredPermissions, resourceId },
      {
        timeout: 5000,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Permission validation failed');
    }
  }

  /**
   * Notification Service Proxy Methods
   */
  public async sendNotification(
    recipientId: string,
    notificationType: string,
    message: string,
    metadata?: any,
    userId?: string
  ): Promise<{
    notificationId: string;
    status: 'sent' | 'queued' | 'failed';
  }> {
    const response = await this.serviceCommunicator.sendRequest(
      HealthcareServiceType.NOTIFICATION_SERVICE,
      HealthcareRequestType.SEND_NOTIFICATION,
      { recipientId, notificationType, message, metadata },
      {
        timeout: 10000,
        userId,
        correlationId: this.generateCorrelationId()
      }
    );

    if (response.success) {
      return response.payload;
    } else {
      throw new Error(response.error?.message || 'Failed to send notification');
    }
  }

  /**
   * Cross-Service Data Aggregation
   * Combines data from multiple services without cross-schema access
   */
  public async getPatientSummary(patientId: string, userId?: string): Promise<{
    patientInfo: any;
    upcomingAppointments: any[];
    recentMedicalRecords: any[];
    insuranceStatus: any;
  }> {
    // Execute requests in parallel
    const [patientInfo, appointments, medicalRecords, insuranceStatus] = await Promise.allSettled([
      this.getPatientInfo(patientId, userId),
      this.getUpcomingAppointments(patientId, userId),
      this.getRecentMedicalRecords(patientId, userId),
      this.getInsuranceStatus(patientId, userId)
    ]);

    return {
      patientInfo: patientInfo.status === 'fulfilled' ? patientInfo.value : null,
      upcomingAppointments: appointments.status === 'fulfilled' ? appointments.value : [],
      recentMedicalRecords: medicalRecords.status === 'fulfilled' ? medicalRecords.value : [],
      insuranceStatus: insuranceStatus.status === 'fulfilled' ? insuranceStatus.value : null
    };
  }

  /**
   * Cache Management Methods
   */
  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = new Date();
    const expiresAt = new Date(entry.timestamp.getTime() + entry.ttl * 1000);

    if (now > expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCachedData<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: new Date(),
      ttl: ttl || this.config.cacheTTL
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear cache for specific patterns
   */
  public clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Helper Methods
   */
  private generateCorrelationId(): string {
    return `${this.config.sourceService}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getUpcomingAppointments(patientId: string, userId?: string): Promise<any[]> {
    // Implementation would call appointment service
    return [];
  }

  private async getRecentMedicalRecords(patientId: string, userId?: string): Promise<any[]> {
    // Implementation would call medical records service
    return [];
  }

  private async getInsuranceStatus(patientId: string, userId?: string): Promise<any> {
    // Implementation would call payment service
    return null;
  }

  /**
   * Health check for all dependent services
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, 'healthy' | 'unhealthy'>;
  }> {
    const services = [
      HealthcareServiceType.PATIENT_SERVICE,
      HealthcareServiceType.DOCTOR_SERVICE,
      HealthcareServiceType.APPOINTMENT_SERVICE,
      HealthcareServiceType.MEDICAL_RECORDS_SERVICE,
      HealthcareServiceType.PAYMENT_SERVICE,
      HealthcareServiceType.AUTH_SERVICE,
      HealthcareServiceType.NOTIFICATION_SERVICE
    ];

    const healthChecks = await Promise.allSettled(
      services.map(service => this.serviceCommunicator.healthCheck(service))
    );

    const serviceStatuses: Record<string, 'healthy' | 'unhealthy'> = {};
    let healthyCount = 0;

    healthChecks.forEach((result, index) => {
      const serviceName = services[index];
      if (result.status === 'fulfilled' && result.value.status === 'healthy') {
        serviceStatuses[serviceName] = 'healthy';
        healthyCount++;
      } else {
        serviceStatuses[serviceName] = 'unhealthy';
      }
    });

    const healthyPercentage = healthyCount / services.length;
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (healthyPercentage >= 0.8) {
      overallStatus = 'healthy';
    } else if (healthyPercentage >= 0.5) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      status: overallStatus,
      services: serviceStatuses
    };
  }
}
