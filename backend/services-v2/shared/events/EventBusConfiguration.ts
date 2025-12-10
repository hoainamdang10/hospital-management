/**
 * EventBusConfiguration - Shared Event Bus Configuration
 * Centralized event bus configuration for all microservices
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import * as amqp from 'amqplib';

export interface EventBusConfig {
  connectionUrl: string;
  exchangeName: string;
  deadLetterExchange: string;
  retryAttempts: number;
  retryDelay: number;
  messageTimeout: number;
  prefetchCount: number;
}

export interface ServiceEventConfig {
  serviceName: string;
  queueName: string;
  routingKeys: string[];
  publishingKeys: string[];
  deadLetterQueue: string;
}

export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventData: any;
  occurredAt: Date;
  version: number;
  metadata?: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
    source?: string;
    traceId?: string;
  };
}

export interface IntegrationEvent extends DomainEvent {
  serviceName: string;
  eventVersion: string;
  targetServices?: string[];
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  expiresAt?: Date;
}

export class EventBusConfiguration {
  private static instance: EventBusConfiguration;
  private config: EventBusConfig;

  private constructor() {
    this.config = {
      connectionUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
      exchangeName: 'hospital.events',
      deadLetterExchange: 'hospital.events.dlx',
      retryAttempts: 3,
      retryDelay: 1000,
      messageTimeout: 30000,
      prefetchCount: 10
    };
  }

  public static getInstance(): EventBusConfiguration {
    if (!EventBusConfiguration.instance) {
      EventBusConfiguration.instance = new EventBusConfiguration();
    }
    return EventBusConfiguration.instance;
  }

  public getConfig(): EventBusConfig {
    return { ...this.config };
  }

  public getServiceConfig(serviceName: string): ServiceEventConfig {
    const serviceConfigs: Record<string, ServiceEventConfig> = {
      'identity-service': {
        serviceName: 'identity-service',
        queueName: 'identity.queue',
        routingKeys: ['user.*', 'auth.*', 'profile.*'],
        publishingKeys: ['user.created', 'user.updated', 'user.deleted', 'auth.login', 'auth.logout'],
        deadLetterQueue: 'identity.queue.dlq'
      },
      'patient-registry-service': {
        serviceName: 'patient-registry-service',
        queueName: 'patient.queue',
        routingKeys: ['patient.*', 'family.*', 'insurance.*'],
        publishingKeys: ['patient.registered', 'patient.updated', 'patient.deleted', 'insurance.verified'],
        deadLetterQueue: 'patient.queue.dlq'
      },
      'provider-staff-service': {
        serviceName: 'provider-staff-service',
        queueName: 'provider.queue',
        routingKeys: ['doctor.*', 'nurse.*', 'staff.*', 'department.*'],
        publishingKeys: ['doctor.registered', 'doctor.updated', 'staff.assigned', 'department.created'],
        deadLetterQueue: 'provider.queue.dlq'
      },
      'scheduling-service': {
        serviceName: 'scheduling-service',
        queueName: 'scheduling.queue',
        routingKeys: ['appointment.*', 'schedule.*', 'availability.*'],
        publishingKeys: [
          'appointment.scheduled',
          'appointment.confirmed',
          'appointment.cancelled',
          'appointment.rescheduled',
          'appointment.completed',
          'appointment.no-show'
        ],
        deadLetterQueue: 'scheduling.queue.dlq'
      },
      'clinical-emr-service': {
        serviceName: 'clinical-emr-service',
        queueName: 'clinical.queue',
        routingKeys: ['medical-record.*', 'diagnosis.*', 'treatment.*', 'test.*'],
        publishingKeys: [
          'medical-record.created',
          'medical-record.updated',
          'test-results.ready',
          'diagnosis.confirmed',
          'treatment.prescribed',
          'follow-up.required'
        ],
        deadLetterQueue: 'clinical.queue.dlq'
      },
      'billing-service': {
        serviceName: 'billing-service',
        queueName: 'billing.queue',
        routingKeys: ['invoice.*', 'payment.*', 'insurance.*', 'billing.*'],
        publishingKeys: [
          'invoice.generated',
          'invoice.sent',
          'payment.completed',
          'payment.failed',
          'insurance.claim.submitted',
          'insurance.claim.approved',
          'insurance.claim.rejected'
        ],
        deadLetterQueue: 'billing.queue.dlq'
      },
      'notifications-service': {
        serviceName: 'notifications-service',
        queueName: 'notifications.queue',
        routingKeys: [
          'appointment.*',
          'medical-record.*',
          'billing.*',
          'emergency.*',
          'medication.*',
          'system.*'
        ],
        publishingKeys: [
          'notification.sent',
          'notification.failed',
          'notification.scheduled',
          'notification.cancelled'
        ],
        deadLetterQueue: 'notifications.queue.dlq'
      }
    };

    return serviceConfigs[serviceName] || {
      serviceName,
      queueName: `${serviceName}.queue`,
      routingKeys: [`${serviceName}.*`],
      publishingKeys: [],
      deadLetterQueue: `${serviceName}.queue.dlq`
    };
  }

  /**
   * Get Vietnamese healthcare event routing patterns
   */
  public getHealthcareRoutingPatterns(): Record<string, string[]> {
    return {
      // Patient lifecycle events
      'patient-lifecycle': [
        'patient.registered',
        'patient.updated',
        'patient.admitted',
        'patient.discharged'
      ],
      
      // Appointment workflow events
      'appointment-workflow': [
        'appointment.scheduled',
        'appointment.confirmed',
        'appointment.cancelled',
        'appointment.completed',
        'appointment.no-show'
      ],
      
      // Clinical workflow events
      'clinical-workflow': [
        'medical-record.created',
        'test-results.ready',
        'diagnosis.confirmed',
        'treatment.prescribed',
        'follow-up.required'
      ],
      
      // Billing workflow events
      'billing-workflow': [
        'invoice.generated',
        'payment.completed',
        'insurance.claim.submitted',
        'insurance.claim.approved'
      ],
      
      // Emergency events
      'emergency-events': [
        'emergency.alert',
        'emergency.resolved',
        'critical.test-result',
        'urgent.consultation'
      ],
      
      // Vietnamese healthcare compliance events
      'compliance-events': [
        'bhyt.verification',
        'bhtn.claim',
        'moh.reporting',
        'hipaa.audit'
      ]
    };
  }

  /**
   * Create RabbitMQ connection with retry logic
   */
  public async createConnection(): Promise<amqp.Connection> {
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        console.log(` Attempting to connect to RabbitMQ (attempt ${attempts + 1}/${maxAttempts})`);
        
        const connection = await amqp.connect(this.config.connectionUrl);
        
        connection.on('error', (error) => {
          console.error(' RabbitMQ connection error:', error);
        });

        connection.on('close', () => {
          console.warn(' RabbitMQ connection closed');
        });

        console.log(' Connected to RabbitMQ successfully');
        return connection as any;

      } catch (error) {
        attempts++;
        console.error(` Failed to connect to RabbitMQ (attempt ${attempts}):`, error);
        
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to connect to RabbitMQ after ${maxAttempts} attempts`);
        }
        
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error('Failed to establish RabbitMQ connection');
  }

  /**
   * Setup exchange and queues for a service
   */
  public async setupServiceInfrastructure(
    channel: amqp.Channel,
    serviceConfig: ServiceEventConfig
  ): Promise<void> {
    try {
      console.log(` Setting up infrastructure for ${serviceConfig.serviceName}`);

      // Declare main exchange
      await channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true
      });

      // Declare dead letter exchange
      await channel.assertExchange(this.config.deadLetterExchange, 'direct', {
        durable: true
      });

      // Declare main queue
      await channel.assertQueue(serviceConfig.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': this.config.messageTimeout,
          'x-max-retries': this.config.retryAttempts,
          'x-dead-letter-exchange': this.config.deadLetterExchange,
          'x-dead-letter-routing-key': 'failed'
        }
      });

      // Declare dead letter queue
      await channel.assertQueue(serviceConfig.deadLetterQueue, {
        durable: true
      });

      // Bind dead letter queue
      await channel.bindQueue(
        serviceConfig.deadLetterQueue,
        this.config.deadLetterExchange,
        'failed'
      );

      // Bind main queue to routing keys
      for (const routingKey of serviceConfig.routingKeys) {
        await channel.bindQueue(
          serviceConfig.queueName,
          this.config.exchangeName,
          routingKey
        );
        console.log(` Bound queue ${serviceConfig.queueName} to routing key: ${routingKey}`);
      }

      // Set prefetch count
      await channel.prefetch(this.config.prefetchCount);

      console.log(` Infrastructure setup completed for ${serviceConfig.serviceName}`);

    } catch (error) {
      console.error(` Failed to setup infrastructure for ${serviceConfig.serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Validate event structure
   */
  public validateEvent(event: any): event is IntegrationEvent {
    const requiredFields = [
      'eventId',
      'eventType',
      'aggregateId',
      'aggregateType',
      'serviceName',
      'eventVersion',
      'eventData',
      'occurredAt'
    ];

    for (const field of requiredFields) {
      if (!event[field]) {
        console.error(` Event validation failed: missing field '${field}'`);
        return false;
      }
    }

    // Validate event type format
    if (!/^[a-zA-Z][a-zA-Z0-9]*\.[a-zA-Z][a-zA-Z0-9]*$/.test(event.eventType)) {
      console.error(` Event validation failed: invalid eventType format '${event.eventType}'`);
      return false;
    }

    // Validate priority
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
    if (event.priority && !validPriorities.includes(event.priority)) {
      console.error(` Event validation failed: invalid priority '${event.priority}'`);
      return false;
    }

    // Validate Vietnamese healthcare context
    if (event.eventData && event.eventData.healthcareContext) {
      const context = event.eventData.healthcareContext;
      
      // Validate patient ID format
      if (context.patientId && !/^PAT-\d{6}-\d{3}$/.test(context.patientId)) {
        console.error(` Event validation failed: invalid patientId format '${context.patientId}'`);
        return false;
      }
      
      // Validate doctor ID format
      if (context.doctorId && !/^[A-Z]{4}-DOC-\d{6}-\d{3}$/.test(context.doctorId)) {
        console.error(` Event validation failed: invalid doctorId format '${context.doctorId}'`);
        return false;
      }
    }

    return true;
  }

  /**
   * Create integration event
   */
  public createIntegrationEvent(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    serviceName: string,
    eventData: any,
    metadata?: any
  ): IntegrationEvent {
    return {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventType,
      aggregateId,
      aggregateType,
      serviceName,
      eventVersion: '1.0',
      eventData,
      occurredAt: new Date(),
      version: 1,
      priority: 'NORMAL',
      metadata: {
        correlationId: metadata?.correlationId || `corr_${Date.now()}`,
        traceId: metadata?.traceId || `trace_${Date.now()}`,
        source: serviceName,
        ...metadata
      }
    };
  }

  /**
   * Get event routing key
   */
  public getRoutingKey(eventType: string, priority?: string): string {
    const basePriority = priority?.toLowerCase() || 'normal';
    return `${eventType}.${basePriority}`;
  }

  /**
   * Check if event should be processed by service
   */
  public shouldProcessEvent(event: IntegrationEvent, serviceConfig: ServiceEventConfig): boolean {
    // Check if event is targeted to specific services
    if (event.targetServices && event.targetServices.length > 0) {
      return event.targetServices.includes(serviceConfig.serviceName);
    }

    // Check routing key patterns
    return serviceConfig.routingKeys.some(pattern => {
      const regex = new RegExp(pattern.replace('*', '.*'));
      return regex.test(event.eventType);
    });
  }

  /**
   * Get Vietnamese healthcare event metadata
   */
  public getVietnameseHealthcareMetadata(event: IntegrationEvent): any {
    return {
      isHealthcareEvent: true,
      complianceRequired: ['HIPAA', 'Vietnamese_Healthcare_Standards'],
      auditRequired: true,
      dataClassification: 'PHI', // Protected Health Information
      retentionPeriod: '7_YEARS',
      vietnameseContext: {
        language: 'vi-VN',
        culturalContext: 'Vietnamese_Healthcare',
        regulatoryFramework: ['MOH_Vietnam', 'BHYT', 'BHTN']
      },
      processingMetadata: {
        processedAt: new Date().toISOString(),
        processingService: 'event-bus',
        eventAge: Date.now() - event.occurredAt.getTime()
      }
    };
  }
}
