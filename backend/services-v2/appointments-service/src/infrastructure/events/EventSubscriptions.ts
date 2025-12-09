/**
 * Event Subscriptions Setup
 * Configures event subscriptions for Scheduling Service
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */

import {
  IEventBus,
  EventBusFactory,
  EventBusConfig,
} from "@shared/infrastructure/event-bus/EventBus";
import { AppointmentReadModelEventHandler } from "./AppointmentReadModelEventHandler";
import {
  AppointmentScheduledEventHandler,
  PatientUpdatedEventHandler,
  DoctorUpdatedEventHandler,
  AppointmentStatusChangedEventHandler,
  AppointmentCancelledEventHandler,
  AppointmentConfirmedEventHandler,
  AppointmentCompletedEventHandler,
  AppointmentNoShowEventHandler,
  AppointmentRescheduledEventHandler,
} from "./EventHandlers";
import {
  AppointmentScheduledSchedulerHandler,
  AppointmentCancelledSchedulerHandler,
  AppointmentRescheduledSchedulerHandler,
} from "./handlers/AppointmentSchedulerIntegrationHandler";
import { OutboxRepository } from "../outbox/OutboxRepository";
import { StaffScheduleUpdatedHandler } from "./handlers/StaffScheduleUpdatedHandler";
import { SupabaseProviderScheduleRepository } from "../persistence/SupabaseProviderScheduleRepository";

// Pure Outbox Pattern - Event Consumers
import { PatientEventConsumer } from "./PatientEventConsumer";
import { ProviderEventConsumer } from "./ProviderEventConsumer";

/**
 * Setup event subscriptions for Scheduling Service
 */
export class EventSubscriptions {
  private eventBus: IEventBus;
  private isConnected: boolean = false;
  private schedulerHandlers?: {
    scheduled: AppointmentScheduledSchedulerHandler;
    cancelled: AppointmentCancelledSchedulerHandler;
    rescheduled: AppointmentRescheduledSchedulerHandler;
  };
  private staffScheduleUpdatedHandler: StaffScheduleUpdatedHandler;

  // Pure Outbox Pattern - Event Consumers
  private patientEventConsumer: PatientEventConsumer;
  private providerEventConsumer: ProviderEventConsumer;

  constructor(
    private readModelHandler: AppointmentReadModelEventHandler,
    private config: EventBusConfig,
    patientEventConsumer: PatientEventConsumer,
    providerEventConsumer: ProviderEventConsumer,
  ) {
    this.eventBus = EventBusFactory.create(config);

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Initialize Outbox + Scheduler integration handlers (optional)
    const enableScheduler = (() => {
      const schedulerDisabled =
        (process.env.SCHEDULER_DISABLED || "true").toLowerCase() === "true";
      const enableEnv =
        (process.env.ENABLE_SCHEDULER || "false").toLowerCase() === "true";
      return enableEnv && !schedulerDisabled;
    })();
    if (enableScheduler) {
      const tenantId = process.env.TENANT_ID || "hospital-1";
      const outboxReservedTimeout = parseInt(
        process.env.OUTBOX_RESERVED_TIMEOUT_MINUTES || "5",
        10,
      );

      const outboxRepo = new OutboxRepository(
        supabaseUrl,
        supabaseKey,
        outboxReservedTimeout,
      );

      this.schedulerHandlers = {
        scheduled: new AppointmentScheduledSchedulerHandler(
          outboxRepo,
          tenantId,
        ),
        cancelled: new AppointmentCancelledSchedulerHandler(
          outboxRepo,
          tenantId,
        ),
        rescheduled: new AppointmentRescheduledSchedulerHandler(
          outboxRepo,
          tenantId,
        ),
      };
    } else {
      console.log(
        "[EventSubscriptions] Scheduler integration disabled (ENABLE_SCHEDULER=false)",
      );
    }

    // Initialize StaffScheduleUpdated handler
    const providerScheduleRepo = new SupabaseProviderScheduleRepository(
      supabaseUrl,
      supabaseKey,
    );
    this.staffScheduleUpdatedHandler = new StaffScheduleUpdatedHandler(
      providerScheduleRepo,
    );

    // Pure Outbox Pattern - Event Consumers
    this.patientEventConsumer = patientEventConsumer;
    this.providerEventConsumer = providerEventConsumer;
  }

  /**
   * Connect to event bus and setup subscriptions
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log("[EventSubscriptions] Already connected");
      return;
    }

    try {
      console.log("[EventSubscriptions] Connecting to event bus...");
      await this.eventBus.connect();

      console.log("[EventSubscriptions] Setting up subscriptions...");
      await this.setupSubscriptions();

      this.isConnected = true;
      console.log("[EventSubscriptions] ✅ All subscriptions ready");
    } catch (error) {
      console.error(
        "[EventSubscriptions] ❌ Failed to setup subscriptions:",
        error,
      );
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
      console.log("[EventSubscriptions] Disconnecting from event bus...");
      await this.eventBus.disconnect();
      this.isConnected = false;
      console.log("[EventSubscriptions] ✅ Disconnected");
    } catch (error) {
      console.error("[EventSubscriptions] ❌ Failed to disconnect:", error);
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
      "AppointmentScheduled",
      new AppointmentScheduledEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.scheduled`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentScheduled (Read Model)",
    );

    // 1b. Scheduler Integration Handler (optional)
    if (this.schedulerHandlers) {
      await this.eventBus.subscribe(
        "AppointmentScheduled",
        this.schedulerHandlers.scheduled,
        `${this.config.serviceName}.appointment.scheduled.scheduler`,
      );
      console.log(
        "[EventSubscriptions] ✅ Subscribed to AppointmentScheduled (Scheduler Integration)",
      );
    }

    // 2. Subscribe to PatientUpdated events (from Patient Registry Service)
    await this.eventBus.subscribe(
      "PatientUpdated",
      new PatientUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.patient.updated`,
    );
    console.log("[EventSubscriptions] ✅ Subscribed to PatientUpdated");

    // 3. Subscribe to PatientRegistered events (from Patient Registry Service)
    await this.eventBus.subscribe(
      "PatientRegistered",
      new PatientUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.patient.registered`,
    );
    console.log("[EventSubscriptions] ✅ Subscribed to PatientRegistered");

    // 4. Subscribe to StaffUpdated events (from Provider Staff Service)
    await this.eventBus.subscribe(
      "StaffUpdated",
      new DoctorUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.staff.updated`,
    );
    console.log("[EventSubscriptions] ✅ Subscribed to StaffUpdated");

    // 5. Subscribe to StaffRegistered events (from Provider Staff Service)
    await this.eventBus.subscribe(
      "StaffRegistered",
      new DoctorUpdatedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.staff.registered`,
    );
    console.log("[EventSubscriptions] ✅ Subscribed to StaffRegistered");

    // 6. Subscribe to AppointmentStatusChanged events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      "AppointmentStatusChanged",
      new AppointmentStatusChangedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.status.changed`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentStatusChanged",
    );

    // 6b. Subscribe to AppointmentStarted events and update read model
    await this.eventBus.subscribe(
      "AppointmentStarted",
      new AppointmentStatusChangedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.started`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentStarted (Read Model)",
    );

    // 7. Subscribe to AppointmentCancelled events (from Scheduling Service itself)
    // 7a. Read Model Handler
    await this.eventBus.subscribe(
      "AppointmentCancelled",
      new AppointmentCancelledEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.cancelled`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentCancelled (Read Model)",
    );

    // 7b. Scheduler Integration Handler (optional)
    if (this.schedulerHandlers) {
      await this.eventBus.subscribe(
        "AppointmentCancelled",
        this.schedulerHandlers.cancelled,
        `${this.config.serviceName}.appointment.cancelled.scheduler`,
      );
      console.log(
        "[EventSubscriptions] ✅ Subscribed to AppointmentCancelled (Scheduler Integration)",
      );
    }

    // 8. Subscribe to AppointmentRescheduled events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      "AppointmentRescheduled",
      new AppointmentRescheduledEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.rescheduled`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentRescheduled (Read Model)",
    );

    if (this.schedulerHandlers) {
      await this.eventBus.subscribe(
        "AppointmentRescheduled",
        this.schedulerHandlers.rescheduled,
        `${this.config.serviceName}.appointment.rescheduled.scheduler`,
      );
      console.log(
        "[EventSubscriptions] ✅ Subscribed to AppointmentRescheduled (Scheduler Integration)",
      );
    }

    // 9. Subscribe to StaffScheduleUpdated events (from Provider Staff Service)
    // This caches work schedule templates for runtime availability calculation
    await this.eventBus.subscribe(
      "StaffScheduleUpdated",
      this.staffScheduleUpdatedHandler,
      `${this.config.serviceName}.staff.schedule.updated`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to StaffScheduleUpdated (Provider Schedule Cache)",
    );

    // 10. Subscribe to AppointmentConfirmed events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      "AppointmentConfirmed",
      new AppointmentConfirmedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.confirmed`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentConfirmed (Read Model)",
    );

    // 11. Subscribe to AppointmentCompleted events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      "AppointmentCompleted",
      new AppointmentCompletedEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.completed`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentCompleted (Read Model)",
    );

    // 12. Subscribe to AppointmentNoShow events (from Scheduling Service itself)
    await this.eventBus.subscribe(
      "AppointmentNoShow",
      new AppointmentNoShowEventHandler(this.readModelHandler),
      `${this.config.serviceName}.appointment.noshow`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to AppointmentNoShow (Read Model)",
    );

    // ========================================================================
    // PURE OUTBOX PATTERN - Read Model Sync Subscriptions
    // ========================================================================

    // 13. Subscribe to patient.patient.* events (from Patient Registry Service)
    // These events sync Patient data into local patient_read_model
    await this.eventBus.subscribe(
      "patient.registered",
      this.patientEventConsumer,
      `${this.config.serviceName}.patient.read.model.registered`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to patient.patient.registered (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "patient.updated",
      this.patientEventConsumer,
      `${this.config.serviceName}.patient.read.model.updated`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to patient.patient.updated (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "patient.deactivated",
      this.patientEventConsumer,
      `${this.config.serviceName}.patient.read.model.deactivated`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to patient.patient.deactivated (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "patient.deleted",
      this.patientEventConsumer,
      `${this.config.serviceName}.patient.read.model.deleted`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to patient.patient.deleted (Pure Outbox)",
    );

    // 14. Subscribe to provider.staff.* events (from Provider Staff Service)
    // These events sync Provider/Staff data into local provider_read_model
    await this.eventBus.subscribe(
      "provider.staff.created",
      this.providerEventConsumer,
      `${this.config.serviceName}.provider.read.model.created`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to provider.staff.created (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "provider.staff.updated",
      this.providerEventConsumer,
      `${this.config.serviceName}.provider.read.model.updated`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to provider.staff.updated (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "provider.staff.deactivated",
      this.providerEventConsumer,
      `${this.config.serviceName}.provider.read.model.deactivated`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to provider.staff.deactivated (Pure Outbox)",
    );

    await this.eventBus.subscribe(
      "provider.staff.deleted",
      this.providerEventConsumer,
      `${this.config.serviceName}.provider.read.model.deleted`,
    );
    console.log(
      "[EventSubscriptions] ✅ Subscribed to provider.staff.deleted (Pure Outbox)",
    );

    console.log("[EventSubscriptions] =".repeat(30));
    console.log(
      "[EventSubscriptions] 🚀 Pure Outbox Pattern: All read model syncs ready!",
    );
    console.log("[EventSubscriptions]    Patient Read Model: 4 events");
    console.log("[EventSubscriptions]    Provider Read Model: 4 events");
    console.log("[EventSubscriptions] =".repeat(30));
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
  readModelHandler: AppointmentReadModelEventHandler,
  patientEventConsumer?: PatientEventConsumer,
  providerEventConsumer?: ProviderEventConsumer,
): EventSubscriptions {
  const config: EventBusConfig = {
    rabbitmqUrl:
      process.env.RABBITMQ_URL || "amqp://admin:admin@localhost:5673",
    exchangeName: process.env.RABBITMQ_EXCHANGE || "hospital.events",
    serviceName: "scheduling-service",
  };

  // If consumers not provided, create them here (fallback for backward compatibility)
  if (!patientEventConsumer || !providerEventConsumer) {
    console.warn(
      "[EventSubscriptions] Event consumers not provided, creating fallback instances",
    );
    const {
      PatientReadModelRepository,
    } = require("../repositories/PatientReadModelRepository");
    const {
      ProviderReadModelRepository,
    } = require("../repositories/ProviderReadModelRepository");
    const { InboxRepository } = require("../inbox/InboxRepository");

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const patientReadModelRepo = new PatientReadModelRepository(
      supabaseUrl,
      supabaseKey,
    );
    const providerReadModelRepo = new ProviderReadModelRepository(
      supabaseUrl,
      supabaseKey,
    );
    const inboxRepo = new InboxRepository(supabaseUrl, supabaseKey);

    patientEventConsumer = new PatientEventConsumer(
      patientReadModelRepo,
      inboxRepo,
    );
    providerEventConsumer = new ProviderEventConsumer(
      providerReadModelRepo,
      inboxRepo,
    );
  }

  return new EventSubscriptions(
    readModelHandler,
    config,
    patientEventConsumer,
    providerEventConsumer,
  );
}
