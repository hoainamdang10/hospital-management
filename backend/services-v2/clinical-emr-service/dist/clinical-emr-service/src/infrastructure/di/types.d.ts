/**
 * Dependency Injection Types - Clinical EMR Service
 * Type definitions for DI container
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DI Pattern
 */
export declare const TYPES: {
    readonly Config: symbol;
    readonly SupabaseClient: symbol;
    readonly DatabaseConnection: symbol;
    readonly DomainEventPublisher: symbol;
    readonly EventBus: symbol;
    readonly EventStore: symbol;
    readonly ClinicalEMREventHandler: symbol;
    readonly MedicalRecordDomainEventHandler: symbol;
    readonly MedicalRecordRepository: symbol;
    readonly BaseMedicalRecordRepository: symbol;
    readonly OutboxRepository: symbol;
    readonly CreateMedicalRecordUseCase: symbol;
    readonly GetMedicalRecordUseCase: symbol;
    readonly GetPatientMedicalRecordsUseCase: symbol;
    readonly UpdateMedicalRecordUseCase: symbol;
    readonly DeleteMedicalRecordUseCase: symbol;
    readonly ArchiveMedicalRecordUseCase: symbol;
    readonly RestoreMedicalRecordUseCase: symbol;
    readonly SearchMedicalRecordsUseCase: symbol;
    readonly MedicalRecordService: symbol;
    readonly VitalSignsService: symbol;
    readonly DiagnosisService: symbol;
    readonly TreatmentService: symbol;
    readonly TokenVerifier: symbol;
    readonly AuditLogService: symbol;
    readonly MedicalRecordController: symbol;
    readonly HealthController: symbol;
    readonly NotificationService: symbol;
    readonly AuditService: symbol;
    readonly FileService: symbol;
    readonly AuthenticationMiddleware: symbol;
    readonly AuthorizationMiddleware: symbol;
    readonly ValidationMiddleware: symbol;
    readonly AuditMiddleware: symbol;
    readonly ErrorHandlingMiddleware: symbol;
    readonly RateLimitingMiddleware: symbol;
    readonly Logger: symbol;
    readonly AuditLogger: symbol;
    readonly PerformanceLogger: symbol;
    readonly CacheService: symbol;
    readonly RedisClient: symbol;
    readonly MetricsService: symbol;
    readonly HealthCheckService: symbol;
    readonly PerformanceMonitor: symbol;
    readonly OutboxPublisherWorker: symbol;
    readonly MedicalRecordDomainService: symbol;
    readonly VitalSignsDomainService: symbol;
    readonly DiagnosisDomainService: symbol;
    readonly EncryptionService: symbol;
    readonly TokenService: symbol;
    readonly PermissionService: symbol;
    readonly ApiGatewayClient: symbol;
    readonly PatientServiceClient: symbol;
    readonly DoctorServiceClient: symbol;
    readonly AppointmentServiceClient: symbol;
    readonly RequestValidator: symbol;
    readonly BusinessRuleValidator: symbol;
    readonly DataValidator: symbol;
    readonly JsonSerializer: symbol;
    readonly XmlSerializer: symbol;
    readonly ProtobufSerializer: symbol;
    readonly MessageBus: symbol;
    readonly CommandBus: symbol;
    readonly QueryBus: symbol;
    readonly EventBusPublisher: symbol;
    readonly EventBusSubscriber: symbol;
    readonly FileUploadService: symbol;
    readonly FileDownloadService: symbol;
    readonly FileStorageService: symbol;
    readonly ImageProcessingService: symbol;
    readonly ReportingService: symbol;
    readonly PdfGeneratorService: symbol;
    readonly ExcelGeneratorService: symbol;
    readonly ChartGeneratorService: symbol;
    readonly LocalizationService: symbol;
    readonly TranslationService: symbol;
    readonly CurrencyService: symbol;
    readonly DateTimeService: symbol;
    readonly BackupService: symbol;
    readonly RecoveryService: symbol;
    readonly DataMigrationService: symbol;
    readonly MockMedicalRecordRepository: symbol;
    readonly MockDomainEventPublisher: symbol;
    readonly MockSupabaseClient: symbol;
    readonly TestDataBuilder: symbol;
    readonly TestFixtureService: symbol;
};
/**
 * Type definitions for better type safety
 */
export type DITypes = typeof TYPES;
export type DITypeKeys = keyof DITypes;
export type DITypeValues = DITypes[DITypeKeys];
/**
 * Helper type for container binding
 */
export interface ServiceBinding<T = any> {
    identifier: symbol;
    implementation: new (...args: any[]) => T;
    scope: 'singleton' | 'transient' | 'request';
    dependencies?: symbol[];
}
/**
 * Container configuration interface
 */
export interface ContainerConfig {
    bindings: ServiceBinding[];
    modules?: string[];
    environment: 'development' | 'testing' | 'staging' | 'production';
    enableLogging: boolean;
    enableMetrics: boolean;
    enableHealthChecks: boolean;
}
/**
 * Service metadata interface
 */
export interface ServiceMetadata {
    name: string;
    version: string;
    description: string;
    dependencies: string[];
    healthCheckEndpoint?: string;
    metricsEndpoint?: string;
}
/**
 * Dependency injection decorators metadata
 */
export declare const METADATA_KEYS: {
    readonly INJECTABLE: symbol;
    readonly INJECT: symbol;
    readonly MULTIINJECT: symbol;
    readonly TAGGED: symbol;
    readonly NAMED: symbol;
    readonly OPTIONAL: symbol;
    readonly UNMANAGED: symbol;
    readonly POST_CONSTRUCT: symbol;
    readonly PRE_DESTROY: symbol;
};
//# sourceMappingURL=types.d.ts.map