import { ConsumeMessage } from "amqplib";
import { logger } from "@infrastructure/logging/logger";
import { SupabasePatientRepository } from "@infrastructure/repositories/SupabasePatientRepository";

export interface PatientEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

/**
 * PatientEventConsumer
 * Lắng nghe các sự kiện từ Patient Registry để đồng bộ trạng thái bảo hiểm cho Billing
 */
export class PatientEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private readonly config: PatientEventConsumerConfig,
    private readonly loggerInstance: typeof logger,
    private readonly patientRepository: SupabasePatientRepository,
  ) { }

  async connect(): Promise<void> {
    if (this.isConnected) {
      this.loggerInstance.warn("[PatientEventConsumer] Already connected, skipping reconnect");
      return;
    }

    const amqp = require("amqplib");

    this.loggerInstance.info("[PatientEventConsumer] 📡 Connecting to RabbitMQ for patient events...", {
      queueName: this.config.queueName,
      exchangeName: this.config.exchangeName,
      routingKeys: this.config.routingKeys,
      rabbitmqUrl: this.config.rabbitmqUrl.replace(/\/\/.*@/, "//***@"), // Hide credentials
    });

    this.connection = await amqp.connect(this.config.rabbitmqUrl);
    this.loggerInstance.info("[PatientEventConsumer] ✅ RabbitMQ connection established");

    this.channel = await this.connection.createChannel();
    this.loggerInstance.info("[PatientEventConsumer] ✅ RabbitMQ channel created");

    if (!this.channel) {
      throw new Error("Failed to create RabbitMQ channel for patient events");
    }

    if (this.config.prefetchCount) {
      await this.channel.prefetch(this.config.prefetchCount);
      this.loggerInstance.info("[PatientEventConsumer] ✅ Prefetch count set", {
        prefetchCount: this.config.prefetchCount,
      });
    }

    await this.channel.assertExchange(this.config.exchangeName, "topic", {
      durable: true,
    });
    this.loggerInstance.info("[PatientEventConsumer] ✅ Exchange asserted", {
      exchangeName: this.config.exchangeName,
    });

    await this.channel.assertQueue(this.config.queueName, {
      durable: true,
    });
    this.loggerInstance.info("[PatientEventConsumer] ✅ Queue asserted", {
      queueName: this.config.queueName,
    });

    for (const routingKey of this.config.routingKeys) {
      await this.channel.bindQueue(
        this.config.queueName,
        this.config.exchangeName,
        routingKey,
      );
      this.loggerInstance.debug("[PatientEventConsumer] ✅ Routing key bound", {
        routingKey,
      });
    }

    this.loggerInstance.info("[PatientEventConsumer] ✅ All routing keys bound", {
      count: this.config.routingKeys.length,
      routingKeys: this.config.routingKeys,
    });

    this.channel.consume(
      this.config.queueName,
      (msg: ConsumeMessage | null) => this.handleMessage(msg),
      { noAck: false },
    );

    this.isConnected = true;
    this.loggerInstance.info("[PatientEventConsumer] 🎉 PATIENT EVENT CONSUMER READY - Actively consuming messages", {
      queueName: this.config.queueName,
      exchangeName: this.config.exchangeName,
      routingKeyCount: this.config.routingKeys.length,
    });
  }

  async disconnect(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
      this.channel = undefined;
    }
    if (this.connection) {
      await this.connection.close();
      this.connection = undefined;
    }
    this.isConnected = false;
  }

  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      this.loggerInstance.warn("[PatientEventConsumer] ⚠️ Received null message or channel not available");
      return;
    }

    try {
      const content = msg.content.toString();
      this.loggerInstance.info("[PatientEventConsumer] 📩 MESSAGE RECEIVED", {
        routingKey: msg.fields.routingKey,
        exchange: msg.fields.exchange,
        contentLength: content.length,
        contentPreview: content.substring(0, 200),
      });

      const event = this.parseEvent(content);
      this.loggerInstance.debug("[PatientEventConsumer] Event parsed", {
        eventType: event?.eventType,
        aggregateId: event?.aggregateId,
      });

      const normalizedType = this.extractEventType(
        event,
        msg.fields.routingKey,
      );
      this.loggerInstance.info("[PatientEventConsumer] Event type normalized", {
        normalizedType,
        originalEventType: event?.eventType,
        routingKey: msg.fields.routingKey,
      });

      if (normalizedType.includes("patientupdated")) {
        this.loggerInstance.info("[PatientEventConsumer] → Handling PatientUpdated event");
        await this.handlePatientUpdated(event);
      } else if (
        normalizedType.includes("patientregistered") ||
        normalizedType.includes("patientcreated")
      ) {
        this.loggerInstance.info("[PatientEventConsumer] → Handling PatientRegistered event");
        await this.handlePatientRegistered(event);
      } else if (
        normalizedType.includes("patientdeleted") ||
        normalizedType.includes("patientdeactivated")
      ) {
        this.loggerInstance.info("[PatientEventConsumer] → Handling PatientRemoved event");
        await this.handlePatientRemoved(event);
      } else {
        this.loggerInstance.debug("[PatientEventConsumer] ⏭️ Patient event ignored (not matching any handler)", {
          eventType: normalizedType,
          routingKey: msg.fields.routingKey,
        });
      }

      this.channel.ack(msg);
      this.loggerInstance.debug("[PatientEventConsumer] ✅ Message acknowledged");
    } catch (error) {
      this.loggerInstance.error("[PatientEventConsumer] ❌ Failed to process patient event", {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        routingKey: msg.fields.routingKey,
      });
      this.channel.nack(msg, false, true);
    }
  }

  private async handlePatientUpdated(event: any): Promise<void> {
    this.loggerInstance.info("[PatientEventConsumer] 🔄 Processing PatientUpdated event", {
      eventData: JSON.stringify(event).substring(0, 300),
    });

    const patientId = this.extractPatientId(event);
    this.loggerInstance.info("[PatientEventConsumer] Patient ID extracted", {
      patientId,
      extractedFrom: patientId ? "success" : "failed",
    });

    if (!patientId) {
      this.loggerInstance.warn(
        "[PatientEventConsumer] ⚠️ PatientUpdated event received without patientId",
        {
          eventPayload: event?.eventData || event?.payload,
        },
      );
      return;
    }

    const updateType = this.extractUpdateType(event);
    this.loggerInstance.info("[PatientEventConsumer] Update type extracted", {
      updateType,
      patientId,
    });

    if (updateType && !updateType.includes("insurance")) {
      this.loggerInstance.info("[PatientEventConsumer] ⏭️ Skipping non-insurance patient update", {
        patientId,
        updateType,
        reason: "Not insurance-related update",
      });
      return;
    }

    this.loggerInstance.info("[PatientEventConsumer] ✅ Insurance update detected, syncing snapshot", {
      patientId,
      updateType,
    });

    await this.syncInsuranceSnapshot(patientId, "update");
  }

  private async handlePatientRegistered(event: any): Promise<void> {
    const patientId = this.extractPatientId(event);
    if (!patientId) {
      return;
    }

    await this.syncInsuranceSnapshot(patientId, "registered");
  }

  private async handlePatientRemoved(event: any): Promise<void> {
    const patientId = this.extractPatientId(event);
    if (!patientId) {
      return;
    }

    await this.syncInsuranceSnapshot(patientId, "removed");
  }

  private async syncInsuranceSnapshot(
    patientId: string,
    reason: "update" | "registered" | "removed",
  ): Promise<void> {
    this.loggerInstance.info("[PatientEventConsumer] 🔄 STARTING insurance snapshot sync", {
      patientId,
      reason,
      timestamp: new Date().toISOString(),
    });

    try {
      await this.patientRepository.syncInsuranceSnapshot(patientId);
      this.loggerInstance.info("[PatientEventConsumer] ✅ ✅ ✅ PATIENT INSURANCE SNAPSHOT SYNCED SUCCESSFULLY", {
        patientId,
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.loggerInstance.error("[PatientEventConsumer] ❌ Failed to sync patient insurance snapshot", {
        patientId,
        reason,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private parseEvent(content: string): any {
    try {
      return JSON.parse(content);
    } catch (error) {
      this.loggerInstance.error("Unable to parse patient event payload", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return {};
    }
  }

  private extractEventType(event: any, fallbackRoutingKey?: string): string {
    const routingKey = (
      event?.routingKey ||
      fallbackRoutingKey ||
      ""
    ).toString();
    const eventType = (
      event?.eventType ||
      event?.type ||
      event?.name ||
      routingKey
    ).toString();
    return eventType.toLowerCase();
  }

  private extractPatientId(event: any): string | null {
    const payload =
      event?.eventData || event?.payload || event?.data || event?.patient;

    return (
      payload?.patientId ||
      payload?.patient_id ||
      payload?.id ||
      payload?.patientCode ||
      event?.aggregateId ||
      event?.patientId ||
      null
    );
  }

  private extractUpdateType(event: any): string | null {
    const payload =
      event?.eventData || event?.payload || event?.data || event?.metadata;

    const updateType =
      payload?.updateType ||
      payload?.changeType ||
      event?.updateType ||
      event?.metadata?.updateType ||
      event?.routingKey;

    return updateType ? updateType.toString().toLowerCase() : null;
  }
}
