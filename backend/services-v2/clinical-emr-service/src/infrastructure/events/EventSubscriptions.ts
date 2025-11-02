/**
 * Event Subscriptions Setup - Infrastructure Layer
 * Configures event subscriptions for Clinical EMR Service
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, DDD
 */

import { IEventBus, EventBusFactory, EventBusConfig } from '@shared/infrastructure/event-bus/EventBus';
import { ClinicalEMREventHandler } from './ClinicalEMREventHandler';
import { MedicalRecordDomainEventHandler } from './MedicalRecordDomainEventHandler';
import { ILogger } from '@shared/infrastructure/logging/logger.interface';

/**
 * Event Subscriptions Manager
 * Manages all event subscriptions for Clinical EMR Service
 */
export class EventSubscriptions {
  private eventBus: IEventBus;
  private isConnected: boolean = false;

  constructor(
    private clinicalEMREventHandler: ClinicalEMREventHandler,
    private medicalRecordDomainEventHandler: MedicalRecordDomainEventHandler,
    private config: EventBusConfig,
    private logger: ILogger
  ) {
    this.eventBus = EventBusFactory.create(config);
  }

  /**
   * Connect to event bus and setup subscriptions
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.info('[EventSubscriptions] Already connected');
      return;
    }

    try {
      this.logger.info('[EventSubscriptions] 🔌 Connecting to RabbitMQ event bus...');
      await this.eventBus.connect();

      this.logger.info('[EventSubscriptions] 📡 Setting up event subscriptions...');
      await this.setupSubscriptions();

      this.isConnected = true;
      this.logger.info('[EventSubscriptions] ✅ All subscriptions ready and listening');
    } catch (error) {
      this.logger.error('[EventSubscriptions] ❌ Failed to setup subscriptions:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Disconnect from event bus
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      this.logger.info('[EventSubscriptions] 🔌 Disconnecting from event bus...');
      await this.eventBus.disconnect();
      this.isConnected = false;
      this.logger.info('[EventSubscriptions] ✅ Disconnected successfully');
    } catch (error) {
      this.logger.error('[EventSubscriptions] ❌ Failed to disconnect:', { error: String(error) });
      throw error;
    }
  }

  /**
   * Setup all event subscriptions
   */
  private async setupSubscriptions(): Promise<void> {
    const serviceName = this.config.serviceName || 'clinical-emr-service';

    // =====================================================
    // SUBSCRIBE TO APPOINTMENTS SERVICE EVENTS
    // =====================================================

    // 1. Appointment Completed → Create Medical Record
    await this.eventBus.subscribe(
      'AppointmentCompleted',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 📅 Received AppointmentCompleted: ${event.aggregateId}`, event.metadata as any);
          await this.clinicalEMREventHandler.handleEvent(event);
        }
      },
      `${serviceName}.appointment.completed`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to appointment.completed (from Appointments Service)');

    // 2. Appointment Cancelled → Update Medical Record if exists
    await this.eventBus.subscribe(
      'AppointmentCancelled',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] ❌ Received AppointmentCancelled: ${event.aggregateId}`, event.metadata as any);
          // Update medical record status if linked
        }
      },
      `${serviceName}.appointment.cancelled`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to appointment.cancelled');

    // =====================================================
    // SUBSCRIBE TO PATIENT REGISTRY EVENTS
    // =====================================================

    // 3. Patient Registered → Initialize EMR Profile
    await this.eventBus.subscribe(
      'PatientRegistered',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 👤 Received PatientRegistered: ${event.aggregateId}`, event.metadata as any);
          await this.clinicalEMREventHandler.handleEvent(event);
        }
      },
      `${serviceName}.patient.registered`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to patient.registered (from Patient Registry)');

    // 4. Patient Updated → Sync Patient Data
    await this.eventBus.subscribe(
      'PatientUpdated',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 👤 Received PatientUpdated: ${event.aggregateId}`, event.metadata as any);
          // Update cached patient data if needed
        }
      },
      `${serviceName}.patient.updated`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to patient.updated');

    // =====================================================
    // SUBSCRIBE TO PROVIDER/STAFF SERVICE EVENTS
    // =====================================================

    // 5. Staff Registered → Cache Doctor Info
    await this.eventBus.subscribe(
      'StaffRegistered',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 👨‍⚕️ Received StaffRegistered: ${event.aggregateId}`, event.metadata as any);
          // Cache doctor information for faster lookups
        }
      },
      `${serviceName}.staff.registered`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to staff.registered (from Provider Service)');

    // 6. Staff Updated → Update Cached Doctor Data
    await this.eventBus.subscribe(
      'StaffUpdated',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 👨‍⚕️ Received StaffUpdated: ${event.aggregateId}`, event.metadata as any);
          // Update cached doctor data
        }
      },
      `${serviceName}.staff.updated`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to staff.updated');

    // =====================================================
    // SUBSCRIBE TO LABORATORY SERVICE EVENTS (Future)
    // =====================================================

    // 7. Test Results Ready → Add to Medical Record
    await this.eventBus.subscribe(
      'TestResultsReady',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 🧪 Received TestResultsReady: ${event.aggregateId}`, event.metadata as any);
          await this.clinicalEMREventHandler.handleEvent(event);
        }
      },
      `${serviceName}.test.results.ready`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to test-results.ready (from Lab Service)');

    // =====================================================
    // SUBSCRIBE TO BILLING SERVICE EVENTS
    // =====================================================

    // 8. Payment Completed → Update Medical Record Payment Status
    await this.eventBus.subscribe(
      'PaymentCompleted',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 💰 Received PaymentCompleted: ${event.aggregateId}`, event.metadata as any);
          // Update payment status in medical record
        }
      },
      `${serviceName}.billing.payment.completed`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to billing.payment.completed');

    // =====================================================
    // SUBSCRIBE TO OWN DOMAIN EVENTS (for side effects)
    // =====================================================

    // 9. Medical Record Created → Publish to other services
    await this.eventBus.subscribe(
      'MedicalRecordCreated',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 📋 Received MedicalRecordCreated: ${event.aggregateId}`, event.metadata as any);
          await this.medicalRecordDomainEventHandler.handle(event);
        }
      },
      `${serviceName}.medical.record.created.internal`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to medical-record.created (internal)');

    // 10. Medical Record Updated → Notify other services
    await this.eventBus.subscribe(
      'MedicalRecordUpdated',
      {
        handle: async (event: any) => {
          this.logger.info(`[Event] 📝 Received MedicalRecordUpdated: ${event.aggregateId}`, event.metadata as any);
          await this.medicalRecordDomainEventHandler.handle(event);
        }
      },
      `${serviceName}.medical.record.updated.internal`
    );
    this.logger.info('[EventSubscriptions] ✅ Subscribed to medical-record.updated (internal)');

    // Summary
    this.logger.info('[EventSubscriptions] 📊 Subscription Summary:');
    this.logger.info('   - Appointments Service: 2 events');
    this.logger.info('   - Patient Registry: 2 events');
    this.logger.info('   - Provider Service: 2 events');
    this.logger.info('   - Lab Service: 1 event');
    this.logger.info('   - Billing Service: 1 event');
    this.logger.info('   - Internal Events: 2 events');
    this.logger.info('   TOTAL: 10 event subscriptions active');
  }

  /**
   * Get event bus instance
   */
  public getEventBus(): IEventBus {
    return this.eventBus;
  }

  /**
   * Check if connected
   */
  public isEventBusConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get subscription status
   */
  public getStatus(): {
    connected: boolean;
    subscriptions: number;
    serviceName: string;
  } {
    return {
      connected: this.isConnected,
      subscriptions: 10, // Total subscriptions
      serviceName: this.config.serviceName || 'clinical-emr-service'
    };
  }
}

/**
 * Create event subscriptions instance
 */
export function createEventSubscriptions(
  clinicalEMREventHandler: ClinicalEMREventHandler,
  medicalRecordDomainEventHandler: MedicalRecordDomainEventHandler,
  logger: ILogger
): EventSubscriptions {
  const config: EventBusConfig = {
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@rabbitmq-v2:5672',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
    serviceName: 'clinical-emr-service'
  };

  return new EventSubscriptions(
    clinicalEMREventHandler,
    medicalRecordDomainEventHandler,
    config,
    logger
  );
}

