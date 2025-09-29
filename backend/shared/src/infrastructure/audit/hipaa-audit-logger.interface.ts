/**
 * HIPAA Audit Logger Interface - Healthcare Compliance
 * Interface for HIPAA-compliant audit logging
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Audit, Data Privacy
 */

/**
 * HIPAA Data Access Log Entry
 */
export interface HIPAADataAccessLog {
  logId: string;
  userId: string;
  patientId: string;
  accessReason: string;
  dataAccessed: string[];
  sensitivityLevel: 'basic' | 'sensitive' | 'highly_sensitive';
  timestamp: Date;
  queryId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  accessMethod: 'api' | 'web' | 'mobile' | 'system';
  accessResult: 'success' | 'denied' | 'error';
  errorMessage?: string;
}

/**
 * HIPAA Data Modification Log Entry
 */
export interface HIPAADataModificationLog {
  logId: string;
  userId: string;
  patientId: string;
  modificationReason: string;
  dataModified: string[];
  modificationType: 'create' | 'update' | 'delete' | 'archive';
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: Date;
  commandId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requiresPatientNotification: boolean;
}

/**
 * HIPAA System Access Log Entry
 */
export interface HIPAASystemAccessLog {
  logId: string;
  userId: string;
  userName: string;
  userRole: string;
  accessType: 'login' | 'logout' | 'session_timeout' | 'forced_logout';
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  accessResult: 'success' | 'failed' | 'blocked';
  failureReason?: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
}

/**
 * HIPAA Security Event Log Entry
 */
export interface HIPAASecurityEventLog {
  logId: string;
  eventType: 'unauthorized_access' | 'data_breach' | 'system_intrusion' | 'policy_violation' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  patientId?: string;
  affectedData?: string[];
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  detectionMethod: 'automated' | 'manual' | 'reported';
  responseAction?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

/**
 * HIPAA Audit Report
 */
export interface HIPAAAuditReport {
  reportId: string;
  reportType: 'data_access' | 'data_modification' | 'system_access' | 'security_events' | 'comprehensive';
  generatedBy: string;
  generatedAt: Date;
  periodFrom: Date;
  periodTo: Date;
  patientId?: string;
  userId?: string;
  totalEntries: number;
  summary: {
    dataAccessCount: number;
    dataModificationCount: number;
    systemAccessCount: number;
    securityEventCount: number;
    uniqueUsersCount: number;
    uniquePatientsCount: number;
  };
  findings?: HIPAAAuditFinding[];
  recommendations?: string[];
}

/**
 * HIPAA Audit Finding
 */
export interface HIPAAAuditFinding {
  findingId: string;
  findingType: 'policy_violation' | 'unusual_access' | 'data_anomaly' | 'security_concern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEntries: string[];
  recommendedAction: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * HIPAA Audit Logger Interface
 */
export interface IHIPAAAuditLogger {
  /**
   * Log data access event
   */
  logDataAccess(entry: Omit<HIPAADataAccessLog, 'logId' | 'timestamp'>): Promise<void>;

  /**
   * Log data modification event
   */
  logDataModification(entry: Omit<HIPAADataModificationLog, 'logId' | 'timestamp'>): Promise<void>;

  /**
   * Log system access event
   */
  logSystemAccess(entry: Omit<HIPAASystemAccessLog, 'logId' | 'timestamp'>): Promise<void>;

  /**
   * Log security event
   */
  logSecurityEvent(entry: Omit<HIPAASecurityEventLog, 'logId' | 'timestamp'>): Promise<void>;

  /**
   * Get audit logs by patient ID
   */
  getAuditLogsByPatient(
    patientId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    dataAccess: HIPAADataAccessLog[];
    dataModification: HIPAADataModificationLog[];
  }>;

  /**
   * Get audit logs by user ID
   */
  getAuditLogsByUser(
    userId: string,
    fromDate?: Date,
    toDate?: Date
  ): Promise<{
    dataAccess: HIPAADataAccessLog[];
    dataModification: HIPAADataModificationLog[];
    systemAccess: HIPAASystemAccessLog[];
  }>;

  /**
   * Get security events
   */
  getSecurityEvents(
    fromDate?: Date,
    toDate?: Date,
    severity?: string[]
  ): Promise<HIPAASecurityEventLog[]>;

  /**
   * Generate audit report
   */
  generateAuditReport(
    reportType: HIPAAAuditReport['reportType'],
    periodFrom: Date,
    periodTo: Date,
    filters?: {
      patientId?: string;
      userId?: string;
      dataTypes?: string[];
    }
  ): Promise<HIPAAAuditReport>;

  /**
   * Search audit logs
   */
  searchAuditLogs(criteria: AuditSearchCriteria): Promise<AuditSearchResult>;

  /**
   * Get audit statistics
   */
  getAuditStatistics(
    fromDate: Date,
    toDate: Date
  ): Promise<HIPAAAuditStatistics>;

  /**
   * Archive old audit logs
   */
  archiveAuditLogs(olderThan: Date): Promise<{
    archivedCount: number;
    archiveLocation: string;
  }>;

  /**
   * Validate audit log integrity
   */
  validateAuditIntegrity(
    fromDate: Date,
    toDate: Date
  ): Promise<{
    isValid: boolean;
    issues?: string[];
  }>;
}

/**
 * Audit Search Criteria
 */
export interface AuditSearchCriteria {
  patientId?: string;
  userId?: string;
  eventTypes?: string[];
  fromDate?: Date;
  toDate?: Date;
  ipAddress?: string;
  accessResult?: string;
  dataTypes?: string[];
  sensitivityLevel?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'userId' | 'patientId' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Search Result
 */
export interface AuditSearchResult {
  entries: (HIPAADataAccessLog | HIPAADataModificationLog | HIPAASystemAccessLog | HIPAASecurityEventLog)[];
  totalCount: number;
  hasNextPage: boolean;
  searchCriteria: AuditSearchCriteria;
  executionTime: number;
}

/**
 * HIPAA Audit Statistics
 */
export interface HIPAAAuditStatistics {
  period: {
    from: Date;
    to: Date;
  };
  totalEvents: number;
  eventsByType: Record<string, number>;
  uniqueUsers: number;
  uniquePatients: number;
  dataAccessEvents: number;
  dataModificationEvents: number;
  systemAccessEvents: number;
  securityEvents: number;
  failedAccessAttempts: number;
  suspiciousActivities: number;
  topAccessedPatients: Array<{
    patientId: string;
    accessCount: number;
  }>;
  topActiveUsers: Array<{
    userId: string;
    eventCount: number;
  }>;
  accessByHour: Record<string, number>;
  accessByDay: Record<string, number>;
  complianceScore: number;
}

/**
 * HIPAA Compliance Checker Interface
 */
export interface IHIPAAComplianceChecker {
  /**
   * Check if data access complies with HIPAA
   */
  checkDataAccessCompliance(
    userId: string,
    patientId: string,
    dataTypes: string[],
    accessReason: string
  ): Promise<{
    isCompliant: boolean;
    violations?: string[];
    recommendations?: string[];
  }>;

  /**
   * Check if user has appropriate access rights
   */
  checkUserAccessRights(
    userId: string,
    patientId: string,
    requestedPermissions: string[]
  ): Promise<{
    hasAccess: boolean;
    grantedPermissions: string[];
    deniedPermissions: string[];
    reason?: string;
  }>;

  /**
   * Validate minimum necessary standard
   */
  validateMinimumNecessary(
    userId: string,
    patientId: string,
    requestedData: string[],
    purpose: string
  ): Promise<{
    isMinimumNecessary: boolean;
    allowedData: string[];
    restrictedData: string[];
    justification: string;
  }>;
}

/**
 * HIPAA Audit Logger Configuration
 */
export interface HIPAAAuditLoggerConfig {
  connectionString: string;
  schema: string;
  enableEncryption: boolean;
  encryptionKey?: string;
  retentionPeriod: number; // days
  archiveLocation: string;
  enableIntegrityChecks: boolean;
  enableRealTimeAlerts: boolean;
  alertThresholds: {
    failedAccessAttempts: number;
    suspiciousActivityScore: number;
    dataAccessVolume: number;
  };
  complianceReportingSchedule: string; // cron expression
}

/**
 * HIPAA Audit Logger Factory
 */
export interface IHIPAAAuditLoggerFactory {
  create(config: HIPAAAuditLoggerConfig): IHIPAAAuditLogger;
  createComplianceChecker(config: HIPAAAuditLoggerConfig): IHIPAAComplianceChecker;
}
