/**
 * Service Communicator Interface - Cross-Service Communication
 * Interface for event-driven inter-service communication
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Microservices, Event-Driven Architecture, HIPAA
 */

/**
 * Service Request Interface
 */
export interface ServiceRequest<T = any> {
  requestId: string;
  requestType: string;
  sourceService: string;
  targetService: string;
  payload: T;
  timestamp: Date;
  userId?: string;
  correlationId?: string;
  timeout?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Service Response Interface
 */
export interface ServiceResponse<T = any> {
  responseId: string;
  requestId: string;
  responseType: string;
  sourceService: string;
  targetService: string;
  payload?: T;
  success: boolean;
  error?: ServiceError;
  timestamp: Date;
  processingTime: number;
  metadata?: Record<string, any>;
}

/**
 * Service Error Interface
 */
export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Service Discovery Interface
 */
export interface ServiceDiscovery {
  serviceName: string;
  serviceVersion: string;
  endpoints: ServiceEndpoint[];
  healthStatus: 'healthy' | 'unhealthy' | 'degraded';
  lastHealthCheck: Date;
  capabilities: string[];
  metadata?: Record<string, any>;
}

/**
 * Service Endpoint Interface
 */
export interface ServiceEndpoint {
  endpointId: string;
  endpointType: 'http' | 'grpc' | 'event' | 'websocket';
  address: string;
  port: number;
  protocol: string;
  isSecure: boolean;
  healthCheckPath?: string;
}

/**
 * Circuit Breaker State
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * Circuit Breaker Configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
  enableMetrics: boolean;
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  exponentialBackoff: boolean;
  jitter: boolean;
  retryableErrors: string[];
}

/**
 * Service Communicator Interface
 */
export interface IServiceCommunicator {
  /**
   * Send request to another service
   */
  sendRequest<TRequest, TResponse>(
    targetService: string,
    requestType: string,
    payload: TRequest,
    options?: RequestOptions
  ): Promise<ServiceResponse<TResponse>>;

  /**
   * Send request with callback
   */
  sendRequestAsync<TRequest, TResponse>(
    targetService: string,
    requestType: string,
    payload: TRequest,
    callback: (response: ServiceResponse<TResponse>) => void,
    options?: RequestOptions
  ): Promise<void>;

  /**
   * Broadcast event to multiple services
   */
  broadcast<T>(
    eventType: string,
    payload: T,
    targetServices?: string[],
    options?: BroadcastOptions
  ): Promise<void>;

  /**
   * Subscribe to service events
   */
  subscribe<T>(
    eventType: string,
    handler: (event: ServiceEvent<T>) => Promise<void>,
    options?: SubscriptionOptions
  ): Promise<string>;

  /**
   * Unsubscribe from service events
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * Get service discovery information
   */
  discoverService(serviceName: string): Promise<ServiceDiscovery | null>;

  /**
   * Register service for discovery
   */
  registerService(discovery: ServiceDiscovery): Promise<void>;

  /**
   * Health check for target service
   */
  healthCheck(serviceName: string): Promise<HealthCheckResult>;

  /**
   * Get communication statistics
   */
  getStatistics(): Promise<CommunicationStatistics>;
}

/**
 * Request Options
 */
export interface RequestOptions {
  timeout?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  retryConfig?: RetryConfig;
  circuitBreakerEnabled?: boolean;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Broadcast Options
 */
export interface BroadcastOptions {
  priority?: 'low' | 'normal' | 'high' | 'critical';
  excludeServices?: string[];
  requireAcknowledgment?: boolean;
  timeout?: number;
  metadata?: Record<string, any>;
}

/**
 * Subscription Options
 */
export interface SubscriptionOptions {
  filterCriteria?: Record<string, any>;
  batchSize?: number;
  maxConcurrency?: number;
  enableDeadLetterQueue?: boolean;
  retryConfig?: RetryConfig;
}

/**
 * Service Event Interface
 */
export interface ServiceEvent<T = any> {
  eventId: string;
  eventType: string;
  sourceService: string;
  payload: T;
  timestamp: Date;
  correlationId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Health Check Result
 */
export interface HealthCheckResult {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  timestamp: Date;
  details?: {
    database?: 'connected' | 'disconnected';
    dependencies?: Record<string, 'healthy' | 'unhealthy'>;
    metrics?: Record<string, number>;
  };
}

/**
 * Communication Statistics
 */
export interface CommunicationStatistics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByService: Record<string, number>;
  errorsByType: Record<string, number>;
  circuitBreakerStats: Record<string, {
    state: CircuitBreakerState;
    failureCount: number;
    lastFailureTime?: Date;
  }>;
  retryStats: {
    totalRetries: number;
    successfulRetries: number;
    failedRetries: number;
  };
}

/**
 * Healthcare-Specific Service Types
 */
export enum HealthcareServiceType {
  PATIENT_SERVICE = 'patient-service',
  DOCTOR_SERVICE = 'doctor-service',
  APPOINTMENT_SERVICE = 'appointment-service',
  MEDICAL_RECORDS_SERVICE = 'medical-records-service',
  PAYMENT_SERVICE = 'payment-service',
  NOTIFICATION_SERVICE = 'notification-service',
  AUTH_SERVICE = 'auth-service',
  FILE_SERVICE = 'file-service',
  DEPARTMENT_SERVICE = 'department-service',
  RECEPTIONIST_SERVICE = 'receptionist-service'
}

/**
 * Healthcare Request Types
 */
export enum HealthcareRequestType {
  // Patient requests
  GET_PATIENT_INFO = 'get_patient_info',
  VALIDATE_PATIENT = 'validate_patient',
  UPDATE_PATIENT_STATUS = 'update_patient_status',
  
  // Doctor requests
  GET_DOCTOR_AVAILABILITY = 'get_doctor_availability',
  VALIDATE_DOCTOR = 'validate_doctor',
  GET_DOCTOR_SCHEDULE = 'get_doctor_schedule',
  
  // Appointment requests
  VALIDATE_APPOINTMENT_SLOT = 'validate_appointment_slot',
  RESERVE_APPOINTMENT_SLOT = 'reserve_appointment_slot',
  CONFIRM_APPOINTMENT = 'confirm_appointment',
  
  // Medical records requests
  GET_MEDICAL_HISTORY = 'get_medical_history',
  CREATE_MEDICAL_RECORD = 'create_medical_record',
  UPDATE_MEDICAL_RECORD = 'update_medical_record',
  
  // Payment requests
  VALIDATE_INSURANCE = 'validate_insurance',
  PROCESS_PAYMENT = 'process_payment',
  GET_PAYMENT_STATUS = 'get_payment_status',
  
  // Notification requests
  SEND_NOTIFICATION = 'send_notification',
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms'
}

/**
 * Healthcare Event Types
 */
export enum HealthcareEventType {
  // Patient events
  PATIENT_REGISTERED = 'patient_registered',
  PATIENT_UPDATED = 'patient_updated',
  PATIENT_DEACTIVATED = 'patient_deactivated',
  
  // Doctor events
  DOCTOR_REGISTERED = 'doctor_registered',
  DOCTOR_SCHEDULE_UPDATED = 'doctor_schedule_updated',
  DOCTOR_AVAILABILITY_CHANGED = 'doctor_availability_changed',
  
  // Appointment events
  APPOINTMENT_SCHEDULED = 'appointment_scheduled',
  APPOINTMENT_CONFIRMED = 'appointment_confirmed',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  
  // Medical records events
  MEDICAL_RECORD_CREATED = 'medical_record_created',
  MEDICAL_RECORD_UPDATED = 'medical_record_updated',
  MEDICAL_HISTORY_UPDATED = 'medical_history_updated',
  
  // Payment events
  PAYMENT_PROCESSED = 'payment_processed',
  PAYMENT_FAILED = 'payment_failed',
  INSURANCE_VERIFIED = 'insurance_verified',
  
  // System events
  SERVICE_HEALTH_CHANGED = 'service_health_changed',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert'
}

/**
 * Service Communicator Factory
 */
export interface IServiceCommunicatorFactory {
  create(config: ServiceCommunicatorConfig): IServiceCommunicator;
}

/**
 * Service Communicator Configuration
 */
export interface ServiceCommunicatorConfig {
  serviceName: string;
  serviceVersion: string;
  
  // Communication settings
  defaultTimeout: number;
  maxConcurrentRequests: number;
  enableCompression: boolean;
  enableEncryption: boolean;
  
  // Circuit breaker settings
  circuitBreakerConfig: CircuitBreakerConfig;
  
  // Retry settings
  defaultRetryConfig: RetryConfig;
  
  // Discovery settings
  discoveryEnabled: boolean;
  discoveryEndpoint?: string;
  heartbeatInterval: number;
  
  // Healthcare compliance
  enableHIPAACompliance: boolean;
  enableAuditLogging: boolean;
  enableDataEncryption: boolean;
  
  // Monitoring
  enableMetrics: boolean;
  metricsInterval: number;
  enableTracing: boolean;
}
