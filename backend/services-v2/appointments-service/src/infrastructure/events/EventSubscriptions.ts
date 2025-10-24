/**
 * Event Subscriptions Setup
 * Configures event subscriptions for Scheduling Service
 * 
 * @author Hospital Management Team
 * @version 3.0.0
 */

import { IEventBus, EventBusFactory, EventBusConfig } from '@shared/infrastructure/event-bus/EventBus';
import { AppointmentReadModelEventHandler } from './AppointmentReadModelEventHandler';
import {
  AppointmentScheduledEventHandler,
  PatientUpdatedEventHandler,
  DoctorUpdatedEventHandler,
  AppointmentStatusChangedEventHandler,
  AppointmentCancelledEventHandler
} from './EventHandlers';
import {
  AppointmentScheduledSchedulerHandler,
  AppointmentCancelledSchedulerHandler,
  AppointmentRescheduledSchedulerHandler
} from './handlers/AppointmentSchedulerIntegrationHandler';
import { OutboxRepository } from '../outbox/OutboxRepository';
import { StaffScheduleUpdatedHandler } from './handlers/StaffScheduleUpdatedHandler';
import { SupabaseProviderScheduleRepository } from '../persistence/SupabaseProviderScheduleRepository';

/**
 * Setup event subscriptions for Scheduling Service
 */
export class EventSubscriptions {
  private eventBus: IEventBus;
  private isConnected: boolean = false;
  private schedulerHandlers: {
    scheduled: AppointmentScheduledSchedulerHandler;
    cancelled: AppointmentCancelledSchedulerHandler;
    rescheduled: AppointmentRescheduledSchedulerHandler;
  };
  private staffScheduleUpdatedHandler: StaffScheduleUpdatedHandler;

  constructor(
    private readModelHandler: AppointmentReadModelEventHandler,
    private config: EventBusConfig
  ) {
    this.eventBus = EventBusFactory.create(config);

    // Initialize Outbox + Scheduler integration handlers
    const schedulerURL = process.env.SCHEDULER_SERVICE_URL || 'http://localhost:3030';
    const schedulerApiKey = process.env.SCHEDULER_API_KEY;
    const tenantId = process.env.TENANT_ID || 'hospital-1';

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const outboxRepo = new OutboxRepository(supabaseUrl, supabaseKey);

    this.schedulerHandlers = {
      scheduled: new AppointmentScheduledSchedulerHandler(outboxRepo, tenantId),
      cancelled: new AppointmentCancelledSchedulerHandler(outboxRepo, tenantId),
      rescheduled: new AppointmentRescheduledSchedulerHandler(outboxRepo, tenantId)
    };

    // Initialize StaffScheduleUpdated handler
    const providerScheduleRepo = new SupabaseProviderScheduleRepository(supabaseUrl, supabaseKey);
    this.staffScheduleUpdatedHandler = new StaffScheduleUpdatedHandler(providerScheduleRepo);
  }

  /**
   * Connect to event bus and setup subscriptions
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('[EventSubscriptions] Already connected');
      return;
    }

    try {
      console.log('[EventSubscriptions] Connecting to event bus...');
      await this.eventBus.connect();

      console.log('[EventSubscriptions] Setting up subscriptions...');
      await this.setupSubscriptions();

      this.isConnected = true;
      console.log('[EventSubscriptions] ✅ All subscriptions ready');
    } catch (error) {
      console.error('[EventSubscriptions] ❌ Failed to setup subscriptions:', error);
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
      console.log('[EventSubscriptions] Disconnecting from event bus...');
      await this.eventBus.disconnect();
      this.isConnected = false;
      console.log('[EventSubscriptions] ✅ Disconnected');
    } catch (error) {
      console.error('[EventSubscriptions] ❌ Failed to disconnect:', error);
      throw error;
    }
  }

  /**
   * Setup all event subscriptions
   */
  private async setupSubscriptions(): Promise<void> {
    // 1. Subscribe to AppointmentScheduled events (from Scheduling Service itself)
    // 1a. Read Model Handler
    await this.eventBus.subscribe(
      'AppointmentScheduled',
      new AppointmentScheduledEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.scheduled`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentScheduled (Read Model)');

    // 1b. Scheduler Integration Handler
    await this.eventBus.subscribe(
      'AppointmentScheduled',
      this.schedulerHandlers.scheduled,
      `${this.config.serviceName}.appointment.scheduled.scheduler`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentScheduled (Scheduler Integration)');

    // 2. Subscribe to PatientUpdated events (from Patient Registry Service)
    await this.eventBus.subscribe(
      'PatientUpdated',
      new PatientUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.patient.updated`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to PatientUpdated');

    // 3. Subscribe to PatientRegistered events (from Patient Registry Service)
    await this.eventBus.subscribe(
      'PatientRegistered',
      new PatientUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.patient.registered`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to PatientRegistered');

    // 4. Subscribe to StaffUpdated events (from Provider Staff Service)
    await this.eventBus.subscribe(
      'StaffUpdated',
      new DoctorUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.staff.updated`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to StaffUpdated');

    // 5. Subscribe to StaffRegistered events (from Provider Staff Service)
    await this.eventBus.subscribe(
      'StaffRegistered',
      new DoctorUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.staff.registered`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to StaffRegistered');

    // 6. Subscribe to AppointmentStatusChanged events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      'AppointmentStatusChanged',
      new AppointmentStatusChangedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.status.changed`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentStatusChanged');

    // 7. Subscribe to AppointmentCancelled events (from Scheduling Service itself)
    // 7a. Read Model Handler
    await this.eventBus.subscribe(
      'AppointmentCancelled',
      new AppointmentCancelledEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.cancelled`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentCancelled (Read Model)');

    // 7b. Scheduler Integration Handler
    await this.eventBus.subscribe(
      'AppointmentCancelled',
      this.schedulerHandlers.cancelled,
      `${this.config.serviceName}.appointment.cancelled.scheduler`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentCancelled (Scheduler Integration)');

    // 8. Subscribe to AppointmentRescheduled events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      'AppointmentRescheduled',
      this.schedulerHandlers.rescheduled,
      `${this.config.serviceName}.appointment.rescheduled.scheduler`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to AppointmentRescheduled (Scheduler Integration)');

    // 9. Subscribe to StaffScheduleUpdated events (from Provider Staff Service)
    // This caches work schedule templates for runtime availability calculation
    await this.eventBus.subscribe(
      'StaffScheduleUpdated',
      this.staffScheduleUpdatedHandler,
      `${this.config.serviceName}.staff.schedule.updated`
    );
    console.log('[EventSubscriptions] ✅ Subscribed to StaffScheduleUpdated (Provider Schedule Cache)');
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
}

/**
 * Create event subscriptions instance
 */
export function createEventSubscriptions(
  readModelHandler: AppointmentReadModelEventHandler
): EventSubscriptions {
  const config: EventBusConfig = {
    rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5673',
    exchangeName: process.env.RABBITMQ_EXCHANGE || 'hospital.events',
    serviceName: 'scheduling-service'
  };

  return new EventSubscriptions(readModelHandler, config);
}

