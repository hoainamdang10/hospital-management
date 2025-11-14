/**
 * System Event Consumer - Infrastructure Layer
 * Consumes system events from various services
 * Handles system-level automation, monitoring, and maintenance tasks
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { Logger } from '../observability/Logger';
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
export class SystemEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;
  private logger: Logger;

  constructor(
    private config: SystemEventConsumerConfig,
    private scheduleRepository: SupabaseScheduleRepository,
    private createScheduleUseCase: CreateScheduleUseCase,
    private updateScheduleUseCase: UpdateScheduleUseCase,
    private cancelScheduleUseCase: CancelScheduleUseCase,
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for System events', {
        queueName: this.config.queueName,
      });

      const amqp = require('amqplib');
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true,
      });

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey,
        );
        this.logger.info('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info('System event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', {
          error: error.message,
        });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;

      this.logger.debug('Received system event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'system.health.checked':
          await this.handleSystemHealthCheck(event.payload as SystemHealthCheckEventData);
          break;

        case 'system.maintenance.scheduled':
          await this.handleSystemMaintenanceScheduled(event.payload as SystemMaintenanceScheduledEventData);
          break;

        case 'system.report.requested':
          await this.handleSystemReportRequested(event.payload as SystemReportRequestedEventData);
          break;

        case 'system.alert.triggered':
          await this.handleSystemAlertTriggered(event.payload as SystemAlertTriggeredEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing system event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle system health check event
   */
  private async handleSystemHealthCheck(data: SystemHealthCheckEventData): Promise<void> {
    this.logger.info('Processing system health check', {
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      healthStatus: data.healthStatus,
      checkedAt: data.checkedAt,
    });

    try {
      // If service is unhealthy, schedule follow-up health checks
      if (data.healthStatus === 'unhealthy' || data.healthStatus === 'degraded') {
        const scheduleId = `health-check-${data.serviceId}-${Date.now()}`;
        
        // Schedule follow-up health checks every 5 minutes for the next hour
        await this.createScheduleUseCase.execute({
          id: scheduleId,
          name: `Health Check Monitoring - ${data.serviceName}`,
          description: `Follow-up health checks for ${data.serviceName}`,
          cronExpression: '*/5 * * * *', // Every 5 minutes
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          ownerService: 'scheduler-service',
          topicOrCommand: 'system.health.followup',
          payload: {
            serviceId: data.serviceId,
            serviceName: data.serviceName,
            originalStatus: data.healthStatus,
            issues: data.issues,
            metrics: data.metrics,
          },
          metadata: {
            eventType: 'system_health_monitoring',
            originalCheckAt: data.checkedAt.toISOString(),
            monitoringDuration: '1hour',
            checkInterval: '5minutes',
          },
        });

        this.logger.info('Created health monitoring schedule', {
          serviceId: data.serviceId,
          scheduleId,
          healthStatus: data.healthStatus,
        });

      } else if (data.healthStatus === 'healthy') {
        // Cancel any existing health monitoring schedules for this service
        const existingSchedules = await this.scheduleRepository.findByOwnerServiceAndTopic(
          'scheduler-service',
          'system.health.followup'
        );

        for (const schedule of existingSchedules) {
          if (schedule.payload?.serviceId === data.serviceId) {
            await this.cancelScheduleUseCase.execute(schedule.id);
            this.logger.info('Cancelled health monitoring schedule', {
              serviceId: data.serviceId,
              scheduleId: schedule.id,
            });
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to process system health check', {
        serviceId: data.serviceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle system maintenance scheduled event
   */
  private async handleSystemMaintenanceScheduled(data: SystemMaintenanceScheduledEventData): Promise<void> {
    this.logger.info('Processing system maintenance scheduling', {
      maintenanceId: data.maintenanceId,
      maintenanceType: data.maintenanceType,
      scheduledStart: data.scheduledStart,
      scheduledEnd: data.scheduledEnd,
      impactLevel: data.impactLevel,
    });

    try {
      const scheduleId = `maintenance-${data.maintenanceId}`;
      
      // Create pre-maintenance reminder schedule
      const reminderTime = new Date(data.scheduledStart.getTime() - (30 * 60 * 1000)); // 30 minutes before
      
      await this.createScheduleUseCase.execute({
        id: `${scheduleId}-reminder`,
        name: `Maintenance Reminder - ${data.maintenanceType}`,
        description: `Pre-maintenance reminder for ${data.description}`,
        cronExpression: this.generateCronForOneTime(reminderTime),
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        ownerService: 'scheduler-service',
        topicOrCommand: 'system.maintenance.reminder',
        payload: {
          maintenanceId: data.maintenanceId,
          maintenanceType: data.maintenanceType,
          scheduledStart: data.scheduledStart.toISOString(),
          scheduledEnd: data.scheduledEnd.toISOString(),
          affectedServices: data.affectedServices,
          maintenanceWindow: data.maintenanceWindow,
          description: data.description,
          impactLevel: data.impactLevel,
          scheduledBy: data.scheduledBy,
        },
        metadata: {
          eventType: 'maintenance_reminder',
          reminderType: 'pre_maintenance',
          reminderOffset: '30minutes',
        },
      });

      // Create post-maintenance cleanup schedule
      await this.createScheduleUseCase.execute({
        id: `${scheduleId}-cleanup`,
        name: `Post-Maintenance Cleanup - ${data.maintenanceType}`,
        description: `Post-maintenance cleanup and verification`,
        cronExpression: this.generateCronForOneTime(data.scheduledEnd),
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        ownerService: 'scheduler-service',
        topicOrCommand: 'system.maintenance.cleanup',
        payload: {
          maintenanceId: data.maintenanceId,
          maintenanceType: data.maintenanceType,
          scheduledEnd: data.scheduledEnd.toISOString(),
          affectedServices: data.affectedServices,
          scheduledBy: data.scheduledBy,
        },
        metadata: {
          eventType: 'maintenance_cleanup',
          cleanupType: 'post_maintenance',
        },
      });

      this.logger.info('Created maintenance schedules', {
        maintenanceId: data.maintenanceId,
        scheduleId,
        reminderSchedule: `${scheduleId}-reminder`,
        cleanupSchedule: `${scheduleId}-cleanup`,
      });

    } catch (error) {
      this.logger.error('Failed to process system maintenance scheduling', {
        maintenanceId: data.maintenanceId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle system report requested event
   */
  private async handleSystemReportRequested(data: SystemReportRequestedEventData): Promise<void> {
    this.logger.info('Processing system report scheduling', {
      reportId: data.reportId,
      reportType: data.reportType,
      reportCategory: data.reportCategory,
      requestedBy: data.requestedBy,
    });

    try {
      const scheduleId = `report-${data.reportId}`;
      
      // Generate cron expression based on report type
      const cronExpression = this.generateCronForReportType(data.reportType);
      
      await this.createScheduleUseCase.execute({
        id: scheduleId,
        name: `Report Generation - ${data.reportCategory} ${data.reportType}`,
        description: `Automated ${data.reportType} ${data.reportCategory} report`,
        cronExpression,
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        ownerService: 'scheduler-service',
        topicOrCommand: 'system.report.generate',
        payload: {
          reportId: data.reportId,
          reportType: data.reportType,
          reportCategory: data.reportCategory,
          requestedBy: data.requestedBy,
          parameters: data.parameters,
          recipients: data.recipients,
        },
        metadata: {
          eventType: 'report_generation',
          requestedAt: data.requestedAt.toISOString(),
          isRecurring: data.reportType !== 'daily' || data.parameters?.startDate,
        },
      });

      this.logger.info('Created report generation schedule', {
        reportId: data.reportId,
        scheduleId,
        reportType: data.reportType,
        reportCategory: data.reportCategory,
      });

    } catch (error) {
      this.logger.error('Failed to process system report scheduling', {
        reportId: data.reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle system alert triggered event
   */
  private async handleSystemAlertTriggered(data: SystemAlertTriggeredEventData): Promise<void> {
    this.logger.info('Processing system alert scheduling', {
      alertId: data.alertId,
      alertType: data.alertType,
      severity: data.severity,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
    });

    try {
      // For critical alerts, schedule follow-up checks
      if (data.severity === 'critical' || data.severity === 'high') {
        const scheduleId = `alert-monitoring-${data.alertId}`;
        
        // Schedule follow-up checks every 2 minutes for 30 minutes
        await this.createScheduleUseCase.execute({
          id: scheduleId,
          name: `Alert Monitoring - ${data.serviceName}`,
          description: `Follow-up monitoring for critical alert: ${data.message}`,
          cronExpression: '*/2 * * * *', // Every 2 minutes
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          ownerService: 'scheduler-service',
          topicOrCommand: 'system.alert.followup',
          payload: {
            alertId: data.alertId,
            alertType: data.alertType,
            severity: data.severity,
            serviceId: data.serviceId,
            serviceName: data.serviceName,
            originalMessage: data.message,
            details: data.details,
            triggeredAt: data.triggeredAt.toISOString(),
          },
          metadata: {
            eventType: 'alert_monitoring',
            monitoringDuration: '30minutes',
            checkInterval: '2minutes',
          },
        });

        this.logger.info('Created alert monitoring schedule', {
          alertId: data.alertId,
          serviceId: data.serviceId,
          scheduleId,
          severity: data.severity,
        });

      } else if (data.resolvedAt) {
        // Cancel alert monitoring if alert is resolved
        const existingSchedules = await this.scheduleRepository.findByOwnerServiceAndTopic(
          'scheduler-service',
          'system.alert.followup'
        );

        for (const schedule of existingSchedules) {
          if (schedule.payload?.alertId === data.alertId) {
            await this.cancelScheduleUseCase.execute(schedule.id);
            this.logger.info('Cancelled alert monitoring schedule', {
              alertId: data.alertId,
              scheduleId: schedule.id,
            });
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to process system alert scheduling', {
        alertId: data.alertId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate cron expression for one-time event
   */
  private generateCronForOneTime(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  /**
   * Generate cron expression for report type
   */
  private generateCronForReportType(reportType: string): string {
    switch (reportType) {
      case 'daily':
        return '0 8 * * *'; // 8 AM daily
      case 'weekly':
        return '0 8 * * 1'; // 8 AM every Monday
      case 'monthly':
        return '0 8 1 * *'; // 8 AM on 1st of every month
      case 'quarterly':
        return '0 8 1 */3 *'; // 8 AM on 1st of every quarter
      case 'yearly':
        return '0 8 1 1 *'; // 8 AM on January 1st
      default:
        return '0 8 * * *'; // Default to daily
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info('System event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting system event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
