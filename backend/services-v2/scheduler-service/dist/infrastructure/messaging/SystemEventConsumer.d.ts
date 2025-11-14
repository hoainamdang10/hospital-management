/**
 * System Event Consumer - Infrastructure Layer
 * Consumes system events from various services
 * Handles system-level automation, monitoring, and maintenance tasks
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { CreateScheduleUseCase } from '../../application/use-cases/CreateScheduleUseCase';
import { UpdateScheduleUseCase } from '../../application/use-cases/UpdateScheduleUseCase';
import { CancelScheduleUseCase } from '../../application/use-cases/CancelScheduleUseCase';
import { SupabaseScheduleRepository } from '../persistence/SupabaseScheduleRepository';
export interface SystemEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface SystemHealthCheckEventData {
    serviceId: string;
    serviceName: string;
    healthStatus: 'healthy' | 'unhealthy' | 'degraded';
    checkedAt: Date;
    metrics?: {
        cpuUsage?: number;
        memoryUsage?: number;
        diskUsage?: number;
        responseTime?: number;
    };
    issues?: string[];
}
export interface SystemMaintenanceScheduledEventData {
    maintenanceId: string;
    maintenanceType: 'backup' | 'update' | 'cleanup' | 'migration';
    scheduledStart: Date;
    scheduledEnd: Date;
    affectedServices: string[];
    maintenanceWindow: string;
    scheduledBy: string;
    description: string;
    impactLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface SystemReportRequestedEventData {
    reportId: string;
    reportType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    reportCategory: 'operational' | 'financial' | 'clinical' | 'administrative';
    requestedBy: string;
    requestedAt: Date;
    parameters?: {
        startDate?: Date;
        endDate?: Date;
        departmentId?: string;
        serviceId?: string;
        format?: 'pdf' | 'excel' | 'csv';
    };
    recipients: string[];
}
export interface SystemAlertTriggeredEventData {
    alertId: string;
    alertType: 'error' | 'warning' | 'info' | 'critical';
    severity: 'low' | 'medium' | 'high' | 'critical';
    serviceId: string;
    serviceName: string;
    message: string;
    details?: any;
    triggeredAt: Date;
    acknowledgedBy?: string;
    resolvedAt?: Date;
}
/**
 * SystemEventConsumer - Handles system events for scheduling automation
 */
export declare class SystemEventConsumer {
    private config;
    private scheduleRepository;
    private createScheduleUseCase;
    private updateScheduleUseCase;
    private cancelScheduleUseCase;
    private connection?;
    private channel?;
    private isConnected;
    private logger;
    constructor(config: SystemEventConsumerConfig, scheduleRepository: SupabaseScheduleRepository, createScheduleUseCase: CreateScheduleUseCase, updateScheduleUseCase: UpdateScheduleUseCase, cancelScheduleUseCase: CancelScheduleUseCase);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle system health check event
     */
    private handleSystemHealthCheck;
    /**
     * Handle system maintenance scheduled event
     */
    private handleSystemMaintenanceScheduled;
    /**
     * Handle system report requested event
     */
    private handleSystemReportRequested;
    /**
     * Handle system alert triggered event
     */
    private handleSystemAlertTriggered;
    /**
     * Generate cron expression for one-time event
     */
    private generateCronForOneTime;
    /**
     * Generate cron expression for report type
     */
    private generateCronForReportType;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=SystemEventConsumer.d.ts.map