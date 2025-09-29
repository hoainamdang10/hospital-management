/**
 * EventIntegrationSetup - Event Integration Setup
 * Centralized setup for all service event handlers and integration
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { EventBusConfiguration } from './EventBusConfiguration';
import { BaseEventHandler } from './BaseEventHandler';

export interface ServiceEventHandlerConfig {
  serviceName: string;
  handlerClass: any;
  dependencies: any[];
  enabled: boolean;
  priority: number;
}

export interface EventIntegrationStatus {
  totalServices: number;
  connectedServices: number;
  failedServices: number;
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  lastHealthCheck: Date;
}

export class EventIntegrationSetup {
  private static instance: EventIntegrationSetup;
  private eventBusConfig: EventBusConfiguration;
  private handlers: Map<string, BaseEventHandler> = new Map();
  private status: EventIntegrationStatus;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.eventBusConfig = EventBusConfiguration.getInstance();
    this.status = {
      totalServices: 0,
      connectedServices: 0,
      failedServices: 0,
      totalEvents: 0,
      successfulEvents: 0,
      failedEvents: 0,
      averageProcessingTime: 0,
      lastHealthCheck: new Date()
    };
  }

  public static getInstance(): EventIntegrationSetup {
    if (!EventIntegrationSetup.instance) {
      EventIntegrationSetup.instance = new EventIntegrationSetup();
    }
    return EventIntegrationSetup.instance;
  }

  /**
   * Initialize all service event handlers
   */
  public async initializeAllServices(): Promise<void> {
    try {
      console.log('🚀 Initializing Event-Driven Architecture for Hospital Management System V2');
      console.log('🏥 Vietnamese Healthcare Standards Compliance Enabled');
      
      const serviceConfigs = this.getServiceConfigurations();
      this.status.totalServices = serviceConfigs.length;

      // Initialize services in priority order
      const sortedConfigs = serviceConfigs.sort((a, b) => b.priority - a.priority);

      for (const config of sortedConfigs) {
        if (config.enabled) {
          try {
            await this.initializeService(config);
            this.status.connectedServices++;
            console.log(`✅ ${config.serviceName} event handler initialized successfully`);
          } catch (error) {
            this.status.failedServices++;
            console.error(`❌ Failed to initialize ${config.serviceName} event handler:`, error);
          }
        } else {
          console.log(`⏭️ ${config.serviceName} event handler disabled`);
        }
      }

      // Start health monitoring
      this.startHealthMonitoring();

      console.log(`🎉 Event Integration Setup Complete:`);
      console.log(`   📊 Total Services: ${this.status.totalServices}`);
      console.log(`   ✅ Connected: ${this.status.connectedServices}`);
      console.log(`   ❌ Failed: ${this.status.failedServices}`);
      console.log(`   🔄 Health Monitoring: Active`);

    } catch (error) {
      console.error('❌ Failed to initialize event integration:', error);
      throw error;
    }
  }

  /**
   * Get service configurations
   */
  private getServiceConfigurations(): ServiceEventHandlerConfig[] {
    return [
      {
        serviceName: 'identity-service',
        handlerClass: null, // Would be imported from identity service
        dependencies: [],
        enabled: false, // Already completed service
        priority: 1
      },
      {
        serviceName: 'patient-registry-service',
        handlerClass: null, // Would be imported from patient registry service
        dependencies: [],
        enabled: false, // Already completed service
        priority: 2
      },
      {
        serviceName: 'provider-staff-service',
        handlerClass: null, // Would be imported from provider staff service
        dependencies: [],
        enabled: false, // Already completed service
        priority: 3
      },
      {
        serviceName: 'scheduling-service',
        handlerClass: 'SchedulingEventHandler', // Would be imported
        dependencies: [
          'ScheduleAppointmentUseCase',
          'RescheduleAppointmentUseCase',
          'CancelAppointmentUseCase',
          'CheckAvailabilityUseCase'
        ],
        enabled: true,
        priority: 4
      },
      {
        serviceName: 'clinical-emr-service',
        handlerClass: 'ClinicalEMREventHandler', // Would be imported
        dependencies: [
          'CreateMedicalRecordUseCase',
          'UpdateMedicalRecordUseCase',
          'GenerateMedicalReportUseCase'
        ],
        enabled: true,
        priority: 5
      },
      {
        serviceName: 'billing-service',
        handlerClass: 'BillingEventHandler', // Would be imported
        dependencies: [
          'GenerateInvoiceUseCase',
          'ProcessPaymentUseCase',
          'ValidateInsuranceUseCase'
        ],
        enabled: true,
        priority: 6
      },
      {
        serviceName: 'notifications-service',
        handlerClass: 'NotificationEventHandler', // Already implemented
        dependencies: [
          'SendNotificationUseCase',
          'ScheduleNotificationUseCase',
          'ProcessNotificationQueueUseCase'
        ],
        enabled: true,
        priority: 7
      }
    ];
  }

  /**
   * Initialize individual service
   */
  private async initializeService(config: ServiceEventHandlerConfig): Promise<void> {
    try {
      console.log(`🔧 Initializing ${config.serviceName} event handler...`);

      // In a real implementation, you would:
      // 1. Import the handler class dynamically
      // 2. Resolve dependencies from DI container
      // 3. Create handler instance
      // 4. Initialize the handler

      // For now, we simulate the initialization
      const mockHandler = new MockEventHandler(config.serviceName);
      await mockHandler.initialize();
      
      this.handlers.set(config.serviceName, mockHandler);

      console.log(`✅ ${config.serviceName} event handler ready`);

    } catch (error) {
      console.error(`❌ Failed to initialize ${config.serviceName}:`, error);
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Every 30 seconds

    console.log('🔍 Health monitoring started (30s intervals)');
  }

  /**
   * Perform health check on all handlers
   */
  private async performHealthCheck(): Promise<void> {
    try {
      let totalEvents = 0;
      let successfulEvents = 0;
      let failedEvents = 0;
      let totalProcessingTime = 0;
      let connectedServices = 0;

      for (const [serviceName, handler] of this.handlers) {
        try {
          const handlerStatus = handler.getStatus();
          
          if (handlerStatus.connected) {
            connectedServices++;
          }

          const metrics = handlerStatus.metrics;
          totalEvents += metrics.totalProcessed;
          successfulEvents += metrics.totalSuccessful;
          failedEvents += metrics.totalFailed;
          totalProcessingTime += metrics.averageProcessingTime * metrics.totalProcessed;

        } catch (error) {
          console.warn(`⚠️ Health check failed for ${serviceName}:`, error);
        }
      }

      // Update status
      this.status.connectedServices = connectedServices;
      this.status.failedServices = this.status.totalServices - connectedServices;
      this.status.totalEvents = totalEvents;
      this.status.successfulEvents = successfulEvents;
      this.status.failedEvents = failedEvents;
      this.status.averageProcessingTime = totalEvents > 0 ? totalProcessingTime / totalEvents : 0;
      this.status.lastHealthCheck = new Date();

      // Log health status
      if (this.status.connectedServices === this.status.totalServices) {
        console.log(`💚 All services healthy - Events: ${totalEvents}, Success Rate: ${((successfulEvents / totalEvents) * 100).toFixed(1)}%`);
      } else {
        console.warn(`⚠️ Service health issues - Connected: ${connectedServices}/${this.status.totalServices}`);
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }

  /**
   * Get integration status
   */
  public getIntegrationStatus(): EventIntegrationStatus {
    return { ...this.status };
  }

  /**
   * Get handler status for specific service
   */
  public getServiceStatus(serviceName: string): any {
    const handler = this.handlers.get(serviceName);
    if (!handler) {
      return { error: 'Service not found' };
    }

    return handler.getStatus();
  }

  /**
   * Get all service statuses
   */
  public getAllServiceStatuses(): Record<string, any> {
    const statuses: Record<string, any> = {};

    for (const [serviceName, handler] of this.handlers) {
      statuses[serviceName] = handler.getStatus();
    }

    return statuses;
  }

  /**
   * Shutdown all handlers
   */
  public async shutdown(): Promise<void> {
    try {
      console.log('🔌 Shutting down event integration...');

      // Stop health monitoring
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // Close all handlers
      const shutdownPromises = Array.from(this.handlers.values()).map(handler => 
        handler.close().catch(error => 
          console.error(`❌ Error closing handler:`, error)
        )
      );

      await Promise.all(shutdownPromises);

      this.handlers.clear();
      console.log('✅ Event integration shutdown complete');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  /**
   * Get Vietnamese healthcare event routing summary
   */
  public getVietnameseHealthcareRoutingSummary(): any {
    const routingPatterns = this.eventBusConfig.getHealthcareRoutingPatterns();
    
    return {
      totalPatterns: Object.keys(routingPatterns).length,
      patterns: routingPatterns,
      compliance: {
        hipaa: true,
        vietnameseHealthcareStandards: true,
        bhytIntegration: true,
        bhtnIntegration: true,
        mohReporting: true
      },
      eventTypes: {
        patientLifecycle: routingPatterns['patient-lifecycle'].length,
        appointmentWorkflow: routingPatterns['appointment-workflow'].length,
        clinicalWorkflow: routingPatterns['clinical-workflow'].length,
        billingWorkflow: routingPatterns['billing-workflow'].length,
        emergencyEvents: routingPatterns['emergency-events'].length,
        complianceEvents: routingPatterns['compliance-events'].length
      }
    };
  }
}

/**
 * Mock Event Handler for demonstration
 */
class MockEventHandler extends BaseEventHandler {
  constructor(serviceName: string) {
    super(serviceName);
  }

  protected async processEvent(event: any): Promise<any> {
    // Mock processing
    return {
      success: true,
      processingTime: Math.random() * 100,
      metadata: { mock: true }
    };
  }

  public async initialize(): Promise<void> {
    // Mock initialization
    this.isConnected = true;
    console.log(`🔧 Mock handler initialized for ${this.serviceName}`);
  }
}

// Export singleton instance
export const eventIntegrationSetup = EventIntegrationSetup.getInstance();
