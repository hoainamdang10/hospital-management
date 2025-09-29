/**
 * Real-time Compliance Monitoring System
 * Monitors architecture compliance, HIPAA violations, and performance metrics
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Real-time monitoring, Architecture governance
 */

import { EventEmitter } from 'events';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import logger from '../utils/logger';

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
export class ComplianceMonitor extends EventEmitter {
  private supabase: SupabaseClient;
  private violations: Map<string, ComplianceViolation> = new Map();
  private metrics: ComplianceMetrics;
  private alertConfig: AlertConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private realtimeSubscription: any = null;

  constructor(alertConfig: AlertConfig = { enabled: false, severityThreshold: 'HIGH' }) {
    super();
    
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    this.alertConfig = alertConfig;
    this.metrics = this.initializeMetrics();
    
    this.setupRealtimeSubscriptions();
  }

  /**
   * Start compliance monitoring
   */
  async startMonitoring(): Promise<void> {
    logger.info('🔍 Starting real-time compliance monitoring...');
    
    try {
      // Load existing violations
      await this.loadExistingViolations();
      
      // Start periodic monitoring
      this.monitoringInterval = setInterval(() => {
        this.performComplianceCheck();
      }, 30000); // Check every 30 seconds
      
      // Setup real-time subscriptions
      await this.setupRealtimeSubscriptions();
      
      logger.info('✅ Compliance monitoring started successfully');
      this.emit('monitoring:started');
      
    } catch (error) {
      logger.error('❌ Failed to start compliance monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop compliance monitoring
   */
  async stopMonitoring(): Promise<void> {
    logger.info('🛑 Stopping compliance monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.realtimeSubscription) {
      await this.supabase.removeChannel(this.realtimeSubscription);
      this.realtimeSubscription = null;
    }
    
    logger.info('✅ Compliance monitoring stopped');
    this.emit('monitoring:stopped');
  }

  /**
   * Report a compliance violation
   */
  async reportViolation(violation: Omit<ComplianceViolation, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const violationId = `${violation.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullViolation: ComplianceViolation = {
      ...violation,
      id: violationId,
      timestamp: new Date(),
      resolved: false
    };
    
    // Store violation
    this.violations.set(violationId, fullViolation);
    
    // Persist to database
    await this.persistViolation(fullViolation);
    
    // Update metrics
    this.updateMetrics();
    
    // Send alerts if configured
    if (this.shouldAlert(fullViolation)) {
      await this.sendAlert(fullViolation);
    }
    
    // Emit event
    this.emit('violation:reported', fullViolation);
    
    logger.warn('🚨 Compliance violation reported', {
      id: violationId,
      type: violation.type,
      severity: violation.severity,
      service: violation.serviceName
    });
    
    return violationId;
  }

  /**
   * Resolve a compliance violation
   */
  async resolveViolation(violationId: string, resolvedBy: string): Promise<boolean> {
    const violation = this.violations.get(violationId);
    
    if (!violation) {
      logger.warn(`Violation ${violationId} not found`);
      return false;
    }
    
    violation.resolved = true;
    violation.resolvedAt = new Date();
    violation.resolvedBy = resolvedBy;
    
    // Update in database
    await this.updateViolationStatus(violationId, true, resolvedBy);
    
    // Update metrics
    this.updateMetrics();
    
    // Emit event
    this.emit('violation:resolved', violation);
    
    logger.info('✅ Compliance violation resolved', {
      id: violationId,
      resolvedBy,
      resolutionTime: violation.resolvedAt.getTime() - violation.timestamp.getTime()
    });
    
    return true;
  }

  /**
   * Get current compliance metrics
   */
  getMetrics(): ComplianceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get violations by criteria
   */
  getViolations(filters: {
    type?: string;
    severity?: string;
    serviceName?: string;
    resolved?: boolean;
    since?: Date;
  } = {}): ComplianceViolation[] {
    let violations = Array.from(this.violations.values());
    
    if (filters.type) {
      violations = violations.filter(v => v.type === filters.type);
    }
    
    if (filters.severity) {
      violations = violations.filter(v => v.severity === filters.severity);
    }
    
    if (filters.serviceName) {
      violations = violations.filter(v => v.serviceName === filters.serviceName);
    }
    
    if (filters.resolved !== undefined) {
      violations = violations.filter(v => v.resolved === filters.resolved);
    }
    
    if (filters.since) {
      violations = violations.filter(v => v.timestamp >= filters.since!);
    }
    
    return violations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(): {
    summary: ComplianceMetrics;
    recentViolations: ComplianceViolation[];
    recommendations: string[];
    complianceStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  } {
    const recentViolations = this.getViolations({
      since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
    });
    
    const complianceStatus = this.determineComplianceStatus();
    const recommendations = this.generateRecommendations();
    
    return {
      summary: this.getMetrics(),
      recentViolations,
      recommendations,
      complianceStatus
    };
  }

  // Private methods
  private initializeMetrics(): ComplianceMetrics {
    return {
      totalViolations: 0,
      violationsByType: {},
      violationsBySeverity: {},
      violationsByService: {},
      averageResolutionTime: 0,
      complianceScore: 100,
      hipaaComplianceScore: 100,
      architectureComplianceScore: 100,
      lastUpdated: new Date()
    };
  }

  private async loadExistingViolations(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('compliance_violations')
        .select('*')
        .eq('resolved', false)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        data.forEach(violation => {
          this.violations.set(violation.id, {
            ...violation,
            timestamp: new Date(violation.timestamp)
          });
        });
      }
      
      this.updateMetrics();
      
    } catch (error) {
      logger.error('Failed to load existing violations:', error);
    }
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    try {
      // Subscribe to schema access logs for real-time violation detection
      this.realtimeSubscription = this.supabase
        .channel('compliance-monitoring')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'migration_backup_phase1',
          table: 'schema_access_log'
        }, (payload) => {
          this.handleSchemaAccessLog(payload.new);
        })
        .subscribe();
        
    } catch (error) {
      logger.error('Failed to setup realtime subscriptions:', error);
    }
  }

  private async handleSchemaAccessLog(logEntry: any): Promise<void> {
    if (!logEntry.is_allowed) {
      await this.reportViolation({
        type: 'SCHEMA_VIOLATION',
        severity: 'HIGH',
        serviceName: logEntry.service_name,
        description: `Unauthorized schema access attempt: ${logEntry.service_name} tried to access ${logEntry.schema_name}.${logEntry.table_name}`,
        details: logEntry
      });
    }
  }

  private async performComplianceCheck(): Promise<void> {
    try {
      // Check for performance degradation
      await this.checkPerformanceMetrics();
      
      // Check for HIPAA compliance issues
      await this.checkHIPAACompliance();
      
      // Check for architecture violations
      await this.checkArchitectureCompliance();
      
    } catch (error) {
      logger.error('Compliance check failed:', error);
    }
  }

  private async checkPerformanceMetrics(): Promise<void> {
    // Implementation for performance monitoring
    // This would integrate with your performance monitoring system
  }

  private async checkHIPAACompliance(): Promise<void> {
    // Implementation for HIPAA compliance checking
    // This would check audit logs, access patterns, etc.
  }

  private async checkArchitectureCompliance(): Promise<void> {
    // Implementation for architecture compliance checking
    // This would validate service boundaries, schema usage, etc.
  }

  private async persistViolation(violation: ComplianceViolation): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('compliance_violations')
        .insert({
          id: violation.id,
          type: violation.type,
          severity: violation.severity,
          service_name: violation.serviceName,
          description: violation.description,
          details: violation.details,
          timestamp: violation.timestamp.toISOString(),
          resolved: violation.resolved
        });
      
      if (error) throw error;
      
    } catch (error) {
      logger.error('Failed to persist violation:', error);
    }
  }

  private async updateViolationStatus(violationId: string, resolved: boolean, resolvedBy: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('compliance_violations')
        .update({
          resolved,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', violationId);
      
      if (error) throw error;
      
    } catch (error) {
      logger.error('Failed to update violation status:', error);
    }
  }

  private updateMetrics(): void {
    const violations = Array.from(this.violations.values());
    
    this.metrics.totalViolations = violations.length;
    this.metrics.violationsByType = this.groupBy(violations, 'type');
    this.metrics.violationsBySeverity = this.groupBy(violations, 'severity');
    this.metrics.violationsByService = this.groupBy(violations, 'serviceName');
    
    // Calculate average resolution time
    const resolvedViolations = violations.filter(v => v.resolved && v.resolvedAt);
    if (resolvedViolations.length > 0) {
      const totalResolutionTime = resolvedViolations.reduce((sum, v) => {
        return sum + (v.resolvedAt!.getTime() - v.timestamp.getTime());
      }, 0);
      this.metrics.averageResolutionTime = totalResolutionTime / resolvedViolations.length;
    }
    
    // Calculate compliance scores
    this.metrics.complianceScore = this.calculateComplianceScore();
    this.metrics.hipaaComplianceScore = this.calculateHIPAAScore();
    this.metrics.architectureComplianceScore = this.calculateArchitectureScore();
    
    this.metrics.lastUpdated = new Date();
  }

  private groupBy(items: any[], key: string): Record<string, number> {
    return items.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  private calculateComplianceScore(): number {
    const violations = Array.from(this.violations.values());
    const unresolvedViolations = violations.filter(v => !v.resolved);
    
    if (unresolvedViolations.length === 0) return 100;
    
    // Weighted scoring based on severity
    const severityWeights = { LOW: 1, MEDIUM: 3, HIGH: 7, CRITICAL: 15 };
    const totalWeight = unresolvedViolations.reduce((sum, v) => {
      return sum + severityWeights[v.severity];
    }, 0);
    
    return Math.max(0, 100 - totalWeight);
  }

  private calculateHIPAAScore(): number {
    const hipaaViolations = Array.from(this.violations.values())
      .filter(v => v.type === 'HIPAA_VIOLATION' && !v.resolved);
    
    return Math.max(0, 100 - (hipaaViolations.length * 10));
  }

  private calculateArchitectureScore(): number {
    const archViolations = Array.from(this.violations.values())
      .filter(v => ['SCHEMA_VIOLATION', 'CROSS_SERVICE_ACCESS'].includes(v.type) && !v.resolved);
    
    return Math.max(0, 100 - (archViolations.length * 5));
  }

  private shouldAlert(violation: ComplianceViolation): boolean {
    if (!this.alertConfig.enabled) return false;
    
    const severityLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const thresholdIndex = severityLevels.indexOf(this.alertConfig.severityThreshold);
    const violationIndex = severityLevels.indexOf(violation.severity);
    
    return violationIndex >= thresholdIndex;
  }

  private async sendAlert(violation: ComplianceViolation): Promise<void> {
    try {
      const alertMessage = this.formatAlertMessage(violation);
      
      // Send webhook alert
      if (this.alertConfig.webhookUrl) {
        await this.sendWebhookAlert(this.alertConfig.webhookUrl, alertMessage);
      }
      
      // Send email alert
      if (this.alertConfig.emailRecipients) {
        await this.sendEmailAlert(this.alertConfig.emailRecipients, alertMessage);
      }
      
      // Send Slack alert
      if (this.alertConfig.slackChannel) {
        await this.sendSlackAlert(this.alertConfig.slackChannel, alertMessage);
      }
      
    } catch (error) {
      logger.error('Failed to send alert:', error);
    }
  }

  private formatAlertMessage(violation: ComplianceViolation): string {
    return `🚨 COMPLIANCE VIOLATION DETECTED
    
Type: ${violation.type}
Severity: ${violation.severity}
Service: ${violation.serviceName}
Description: ${violation.description}
Time: ${violation.timestamp.toISOString()}

Please investigate and resolve immediately.`;
  }

  private async sendWebhookAlert(url: string, message: string): Promise<void> {
    // Implementation for webhook alerts
  }

  private async sendEmailAlert(recipients: string[], message: string): Promise<void> {
    // Implementation for email alerts
  }

  private async sendSlackAlert(channel: string, message: string): Promise<void> {
    // Implementation for Slack alerts
  }

  private determineComplianceStatus(): 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' {
    const score = this.metrics.complianceScore;
    
    if (score >= 95) return 'EXCELLENT';
    if (score >= 85) return 'GOOD';
    if (score >= 70) return 'NEEDS_IMPROVEMENT';
    return 'CRITICAL';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const violations = Array.from(this.violations.values()).filter(v => !v.resolved);
    
    if (violations.some(v => v.type === 'SCHEMA_VIOLATION')) {
      recommendations.push('Review and fix schema access violations in microservices');
    }
    
    if (violations.some(v => v.type === 'HIPAA_VIOLATION')) {
      recommendations.push('Immediate HIPAA compliance review required');
    }
    
    if (violations.some(v => v.severity === 'CRITICAL')) {
      recommendations.push('Address critical violations immediately');
    }
    
    return recommendations;
  }
}

// Singleton instance
let complianceMonitorInstance: ComplianceMonitor | null = null;

export function getComplianceMonitor(alertConfig?: AlertConfig): ComplianceMonitor {
  if (!complianceMonitorInstance) {
    complianceMonitorInstance = new ComplianceMonitor(alertConfig);
  }
  return complianceMonitorInstance;
}

export default ComplianceMonitor;
