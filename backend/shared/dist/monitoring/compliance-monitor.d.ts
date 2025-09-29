/**
 * Real-time Compliance Monitoring System
 * Monitors architecture compliance, HIPAA violations, and performance metrics
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Real-time monitoring, Architecture governance
 */
import { EventEmitter } from 'events';
export interface ComplianceViolation {
    id: string;
    type: 'SCHEMA_VIOLATION' | 'CROSS_SERVICE_ACCESS' | 'HIPAA_VIOLATION' | 'PERFORMANCE_DEGRADATION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    serviceName: string;
    description: string;
    details: any;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface ComplianceMetrics {
    totalViolations: number;
    violationsByType: Record<string, number>;
    violationsBySeverity: Record<string, number>;
    violationsByService: Record<string, number>;
    averageResolutionTime: number;
    complianceScore: number;
    hipaaComplianceScore: number;
    architectureComplianceScore: number;
    lastUpdated: Date;
}
export interface AlertConfig {
    enabled: boolean;
    webhookUrl?: string;
    emailRecipients?: string[];
    slackChannel?: string;
    severityThreshold: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
/**
 * Real-time compliance monitoring service
 */
export declare class ComplianceMonitor extends EventEmitter {
    private supabase;
    private violations;
    private metrics;
    private alertConfig;
    private monitoringInterval;
    private realtimeSubscription;
    constructor(alertConfig?: AlertConfig);
    /**
     * Start compliance monitoring
     */
    startMonitoring(): Promise<void>;
    /**
     * Stop compliance monitoring
     */
    stopMonitoring(): Promise<void>;
    /**
     * Report a compliance violation
     */
    reportViolation(violation: Omit<ComplianceViolation, 'id' | 'timestamp' | 'resolved'>): Promise<string>;
    /**
     * Resolve a compliance violation
     */
    resolveViolation(violationId: string, resolvedBy: string): Promise<boolean>;
    /**
     * Get current compliance metrics
     */
    getMetrics(): ComplianceMetrics;
    /**
     * Get violations by criteria
     */
    getViolations(filters?: {
        type?: string;
        severity?: string;
        serviceName?: string;
        resolved?: boolean;
        since?: Date;
    }): ComplianceViolation[];
    /**
     * Generate compliance report
     */
    generateComplianceReport(): {
        summary: ComplianceMetrics;
        recentViolations: ComplianceViolation[];
        recommendations: string[];
        complianceStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
    };
    private initializeMetrics;
    private loadExistingViolations;
    private setupRealtimeSubscriptions;
    private handleSchemaAccessLog;
    private performComplianceCheck;
    private checkPerformanceMetrics;
    private checkHIPAACompliance;
    private checkArchitectureCompliance;
    private persistViolation;
    private updateViolationStatus;
    private updateMetrics;
    private groupBy;
    private calculateComplianceScore;
    private calculateHIPAAScore;
    private calculateArchitectureScore;
    private shouldAlert;
    private sendAlert;
    private formatAlertMessage;
    private sendWebhookAlert;
    private sendEmailAlert;
    private sendSlackAlert;
    private determineComplianceStatus;
    private generateRecommendations;
}
export declare function getComplianceMonitor(alertConfig?: AlertConfig): ComplianceMonitor;
export default ComplianceMonitor;
//# sourceMappingURL=compliance-monitor.d.ts.map