/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff notifications for schedules, assignments, availability, and updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from "amqplib";
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import {
  SendNotificationCommand,
  SendNotificationUseCase,
} from "../../application/use-cases/SendNotificationUseCase";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
import { normalizePriority } from "../../domain/services/priority-normalizer";

export interface StaffEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface StaffAvailabilityChangedEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  availabilityStatus:
    | "available"
    | "unavailable"
    | "on_leave"
    | "sick"
    | "emergency";
  reason?: string;
  startTime?: Date;
  endTime?: Date;
  updatedBy: string;
  updatedAt: Date;
  affectedAppointments?: string[];
}

export interface StaffShiftAssignedEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  shiftId: string;
  shiftType: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: "daily" | "weekly" | "monthly";
    daysOfWeek?: number[];
    endDate?: Date;
  };
  assignedBy: string;
  assignedAt: Date;
  notes?: string;
}

export interface StaffShiftCancelledEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  shiftId: string;
  shiftType: string;
  originalStartTime: Date;
  originalEndTime: Date;
  cancelledBy: string;
  cancelledAt: Date;
  cancellationReason: string;
  affectedAppointments?: string[];
}

export interface StaffScheduleUpdatedEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  updateType:
    | "vacation"
    | "sick_leave"
    | "emergency"
    | "availability_change"
    | "schedule_pattern";
  oldSchedule?: {
    startDate: Date;
    endDate: Date;
    pattern: string;
  };
  newSchedule?: {
    startDate: Date;
    endDate: Date;
    pattern: string;
  };
  updatedBy: string;
  updatedAt: Date;
  reason?: string;
  affectedAppointments?: string[];
}

export interface StaffDepartmentAssignedEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  oldDepartmentId?: string;
  oldDepartmentName?: string;
  newDepartmentId: string;
  newDepartmentName: string;
  assignedBy: string;
  assignedAt: Date;
  effectiveDate: Date;
  role?: string;
  permissions?: string[];
}

export interface StaffOnCallAssignedEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  onCallType: "primary" | "secondary" | "backup";
  startTime: Date;
  endTime: Date;
  assignedBy: string;
  assignedAt: Date;
  contactNumber?: string;
  escalationContact?: string;
}

export interface StaffPerformanceReviewEventData {
  staffId: string;
  staffName: string;
  staffType: string;
  departmentId: string;
  departmentName: string;
  reviewType: "monthly" | "quarterly" | "annual" | "special";
  reviewPeriod: {
    startDate: Date;
    endDate: Date;
  };
  overallRating: number;
  categories: {
    clinical: number;
    communication: number;
    teamwork: number;
    professionalism: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  reviewedBy: string;
  reviewedAt: Date;
  nextReviewDate: Date;
}

/**
 * StaffEventConsumer - Handles staff events for notifications
 */
export class StaffEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;
  private reconnecting = false;

  constructor(
    private config: StaffEventConsumerConfig,
    private sendNotificationUseCase: SendNotificationUseCase,
    private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private inboxRepo: IInboxRepository,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    const maxAttempts = Math.max(1, this.config.retryAttempts || 3);
    const retryDelay = this.config.retryDelayMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log("Connecting to RabbitMQ for Staff events", {
          queueName: this.config.queueName,
          attempt,
          maxAttempts,
        });

        const amqp = require("amqplib");
        this.connection = await amqp.connect(this.config.rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        if (!this.channel) {
          throw new Error("Failed to create RabbitMQ channel");
        }

        this.setupConnectionListeners();

        // Assert exchange
        await this.channel.assertExchange(this.config.exchangeName, "topic", {
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
          console.log("Queue bound to routing key", {
            queueName: this.config.queueName,
            routingKey,
          });
        }

        this.channel.prefetch(this.config.prefetchCount || 10);

        // Start consuming
        await this.channel.consume(
          this.config.queueName,
          this.handleMessage.bind(this),
          { noAck: false },
        );

        this.isConnected = true;
        console.log("Staff event consumer connected successfully");
        return;
      } catch (error) {
        console.error("Failed to connect to RabbitMQ", {
          attempt,
          maxAttempts,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        await this.closeConnectionSilently();

        if (attempt === maxAttempts) {
          throw error;
        }

        const delay = retryDelay * attempt;
        console.log(
          `Retrying staff consumer connection in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private setupConnectionListeners(): void {
    if (!this.connection) {
      return;
    }

    this.connection.on("error", (error: Error) => {
      console.error("RabbitMQ connection error", {
        error: error.message,
      });
      this.isConnected = false;
    });

    this.connection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      this.isConnected = false;
      this.triggerReconnect();
    });
  }

  private triggerReconnect(): void {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;
    const delay = this.config.retryDelayMs || 1000;

    setTimeout(() => {
      this.connect()
        .catch((error) => {
          console.error("Staff event consumer reconnect failed", error);
        })
        .finally(() => {
          this.reconnecting = false;
        });
    }, delay);
  }

  private async closeConnectionSilently(): Promise<void> {
    try {
      await this.disconnect();
    } catch {
      // Ignore cleanup failures during retries
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

      // Idempotency check
      const eventId = event.eventId || event.id || event.metadata?.eventId;
      if (!eventId) {
        console.error(
          "[StaffEventConsumer] Missing eventId, cannot process:",
          event,
        );
        this.channel?.ack(msg);
        return;
      }

      if (await this.inboxRepo.exists(eventId)) {
        console.debug(
          `[StaffEventConsumer] Duplicate event ${eventId}, skipping`,
        );
        this.channel?.ack(msg);
        return;
      }

      console.log(
        `[StaffEventConsumer] Processing event: ${routingKey} (${eventId})`,
      );

      // Route to appropriate handler
      switch (routingKey) {
        case "availability.staff.changed":
          await this.handleStaffAvailabilityChanged(
            event.payload as StaffAvailabilityChangedEventData,
          );
          break;

        case "shift.staff.assigned":
          await this.handleStaffShiftAssigned(
            event.payload as StaffShiftAssignedEventData,
          );
          break;

        case "shift.staff.cancelled":
          await this.handleStaffShiftCancelled(
            event.payload as StaffShiftCancelledEventData,
          );
          break;

        case "schedule.staff.updated":
          await this.handleStaffScheduleUpdated(
            event.payload as StaffScheduleUpdatedEventData,
          );
          break;

        case "department.staff.assigned":
          await this.handleStaffDepartmentAssigned(
            event.payload as StaffDepartmentAssignedEventData,
          );
          break;

        case "oncall.staff.assigned":
          await this.handleStaffOnCallAssigned(
            event.payload as StaffOnCallAssignedEventData,
          );
          break;

        case "performance.staff.reviewed":
          await this.handleStaffPerformanceReview(
            event.payload as StaffPerformanceReviewEventData,
          );
          break;

        default:
          console.warn("Unhandled routing key", { routingKey });
          break;
      }

      // Store in inbox after successful processing
      await this.inboxRepo.store({
        idempotencyKey: eventId,
        eventType: "staff.oncall.assigned",
        payload: event,
      });

      // Acknowledge message
      this.channel.ack(msg);
    } catch (error) {
      console.error("Error processing staff event", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle staff availability changed event
   */
  private async handleStaffAvailabilityChanged(
    data: StaffAvailabilityChangedEventData,
  ): Promise<void> {
    console.log("Processing staff availability changed for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      availabilityStatus: data.availabilityStatus,
      reason: data.reason,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send availability change notification to staff
      await this.sendAvailabilityChangeNotification(data, staffPreferences);

      // Send notification to department manager for critical status changes
      if (
        data.availabilityStatus === "sick" ||
        data.availabilityStatus === "emergency"
      ) {
        await this.sendCriticalAvailabilityNotification(data);
      }

      // Send notification to affected patients if appointments are affected
      if (data.affectedAppointments && data.affectedAppointments.length > 0) {
        await this.sendAffectedPatientsNotification(data);
      }
    } catch (error) {
      console.error("Failed to process staff availability changed", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff shift assigned event
   */
  private async handleStaffShiftAssigned(
    data: StaffShiftAssignedEventData,
  ): Promise<void> {
    console.log("Processing staff shift assigned for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      shiftType: data.shiftType,
      startTime: data.startTime,
      endTime: data.endTime,
      isRecurring: data.isRecurring,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send shift assignment notification to staff
      await this.sendShiftAssignmentNotification(data, staffPreferences);

      // Send notification to department manager for critical shifts
      if (data.shiftType === "emergency" || data.shiftType === "on_call") {
        await this.sendCriticalShiftNotification(data);
      }

      // Send calendar integration if enabled
      if (staffPreferences.calendarIntegration) {
        await this.sendCalendarInvitation(data);
      }
    } catch (error) {
      console.error("Failed to process staff shift assigned", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff shift cancelled event
   */
  private async handleStaffShiftCancelled(
    data: StaffShiftCancelledEventData,
  ): Promise<void> {
    console.log("Processing staff shift cancelled for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      shiftType: data.shiftType,
      originalStartTime: data.originalStartTime,
      cancellationReason: data.cancellationReason,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send shift cancellation notification to staff
      await this.sendShiftCancellationNotification(data, staffPreferences);

      // Send notification to department manager
      await this.sendShiftCancellationManagerNotification(data);

      // Send notification to affected patients
      if (data.affectedAppointments && data.affectedAppointments.length > 0) {
        await this.sendShiftCancellationPatientsNotification(data);
      }
    } catch (error) {
      console.error("Failed to process staff shift cancelled", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff schedule updated event
   */
  private async handleStaffScheduleUpdated(
    data: StaffScheduleUpdatedEventData,
  ): Promise<void> {
    console.log("Processing staff schedule updated for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      updateType: data.updateType,
      updatedBy: data.updatedBy,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send schedule update notification to staff
      await this.sendScheduleUpdateNotification(data, staffPreferences);

      // Send special notifications for critical updates
      if (data.updateType === "emergency" || data.updateType === "sick_leave") {
        await this.sendEmergencyScheduleNotification(data);
      }

      // Send notification to affected patients
      if (data.affectedAppointments && data.affectedAppointments.length > 0) {
        await this.sendScheduleUpdatePatientsNotification(data);
      }
    } catch (error) {
      console.error("Failed to process staff schedule updated", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff department assigned event
   */
  private async handleStaffDepartmentAssigned(
    data: StaffDepartmentAssignedEventData,
  ): Promise<void> {
    console.log("Processing staff department assigned for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      oldDepartmentName: data.oldDepartmentName,
      newDepartmentName: data.newDepartmentName,
      role: data.role,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send department assignment notification to staff
      await this.sendDepartmentAssignmentNotification(data, staffPreferences);

      // Send welcome notification to new department
      await this.sendDepartmentWelcomeNotification(data);

      // Send notification to old department if applicable
      if (data.oldDepartmentId) {
        await this.sendDepartmentTransferNotification(data);
      }
    } catch (error) {
      console.error("Failed to process staff department assigned", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff on-call assigned event
   */
  private async handleStaffOnCallAssigned(
    data: StaffOnCallAssignedEventData,
  ): Promise<void> {
    console.log("Processing staff on-call assigned for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      onCallType: data.onCallType,
      startTime: data.startTime,
      endTime: data.endTime,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send on-call assignment notification to staff
      await this.sendOnCallAssignmentNotification(data, staffPreferences);

      // Send high-priority notification for primary on-call
      if (data.onCallType === "primary") {
        await this.sendPrimaryOnCallNotification(data);
      }

      // Send on-call schedule to department
      await this.sendOnCallScheduleNotification(data);
    } catch (error) {
      console.error("Failed to process staff on-call assigned", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle staff performance review event
   */
  private async handleStaffPerformanceReview(
    data: StaffPerformanceReviewEventData,
  ): Promise<void> {
    console.log("Processing staff performance review for notifications", {
      staffId: data.staffId,
      staffName: data.staffName,
      reviewType: data.reviewType,
      overallRating: data.overallRating,
      reviewedBy: data.reviewedBy,
    });

    try {
      // Get staff notification preferences
      const staffPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.staffId,
          userType: "staff",
        });

      // Send performance review notification to staff
      await this.sendPerformanceReviewNotification(data, staffPreferences);

      // Send notification to department manager for action items
      if (data.overallRating < 3 || data.areasForImprovement.length > 0) {
        await this.sendPerformanceReviewManagerNotification(data);
      }

      // Schedule follow-up for improvement areas
      if (data.areasForImprovement.length > 0) {
        await this.scheduleImprovementFollowUp(data);
      }
    } catch (error) {
      console.error("Failed to process staff performance review", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send availability change notification to staff
   */
  private async sendAvailabilityChangeNotification(
    data: StaffAvailabilityChangedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const statusText =
        {
          available: "sẵn sàng làm việc",
          unavailable: "không sẵn sàng",
          on_leave: "nghỉ phép",
          sick: "nghỉ ốm",
          emergency: "khẩn cấp",
        }[data.availabilityStatus] || data.availabilityStatus;

      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "availability_changed",
        title: "Thay đổi trạng thái sẵn sàng",
        content: `Trạng thái sẵn sàng của bạn đã được cập nhật: ${statusText}${data.reason ? `. Lý do: ${data.reason}` : ""}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.availabilityStatus === "emergency" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          availabilityStatus: data.availabilityStatus,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent availability change notification to staff", {
        staffId: data.staffId,
        availabilityStatus: data.availabilityStatus,
      });
    } catch (error) {
      console.error("Failed to send availability change notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send critical availability notification to department manager
   */
  private async sendCriticalAvailabilityNotification(
    data: StaffAvailabilityChangedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "critical_availability",
        title: "Thông báo sẵn sàng khẩn cấp",
        content: `${data.staffName} (${data.staffType}) đã báo cáo trạng thái ${data.availabilityStatus}.${data.reason ? ` Lý do: ${data.reason}` : ""}`,
        channels: ["in_app", "email"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          availabilityStatus: data.availabilityStatus,
          reason: data.reason,
          affectedAppointments: data.affectedAppointments,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send critical availability notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send notification to affected patients
   */
  private async sendAffectedPatientsNotification(
    data: StaffAvailabilityChangedEventData,
  ): Promise<void> {
    try {
      if (
        !data.affectedAppointments ||
        data.affectedAppointments.length === 0
      ) {
        return;
      }

      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "staff_availability_patients_affected",
        title: "Bệnh nhân bị ảnh hưởng bởi thay đổi sẵn sàng",
        content: `${data.affectedAppointments.length} lịch hẹn bị ảnh hưởng do ${data.staffName} không sẵn sàng. Cần sắp xếp lại.`,
        channels: ["in_app"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          affectedAppointments: data.affectedAppointments,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send affected patients notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send shift assignment notification to staff
   */
  private async sendShiftAssignmentNotification(
    data: StaffShiftAssignedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const shiftTypeText =
        {
          morning: "sáng",
          afternoon: "chiều",
          evening: "tối",
          night: "đêm",
          emergency: "khẩn cấp",
          on_call: "trực",
        }[data.shiftType] || data.shiftType;

      const recurringText = data.isRecurring ? " (lặp lại)" : "";
      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "shift_assigned",
        title: "Phân công ca làm việc",
        content: `Bạn đã được phân công ca ${shiftTypeText}${recurringText} từ ${this.formatDateTime(data.startTime)} đến ${this.formatDateTime(data.endTime)} tại ${data.departmentName}.`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: data.shiftType === "emergency" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          shiftId: data.shiftId,
          shiftType: data.shiftType,
          startTime: data.startTime,
          endTime: data.endTime,
          isRecurring: data.isRecurring,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent shift assignment notification to staff", {
        staffId: data.staffId,
        shiftId: data.shiftId,
      });
    } catch (error) {
      console.error("Failed to send shift assignment notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send critical shift notification to department manager
   */
  private async sendCriticalShiftNotification(
    data: StaffShiftAssignedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "critical_shift_assigned",
        title: "Phân công ca khẩn cấp",
        content: `${data.staffName} đã được phân công ca ${data.shiftType} khẩn cấp từ ${this.formatDateTime(data.startTime)} đến ${this.formatDateTime(data.endTime)}.`,
        channels: ["in_app", "email"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          shiftId: data.shiftId,
          shiftType: data.shiftType,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send critical shift notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send calendar invitation
   */
  private async sendCalendarInvitation(
    data: StaffShiftAssignedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "calendar_invitation",
        title: "Mời lịch làm việc",
        content: `Ca làm việc của bạn đã được thêm vào lịch: ${this.formatDateTime(data.startTime)} - ${this.formatDateTime(data.endTime)}`,
        channels: ["email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          shiftId: data.shiftId,
          startTime: data.startTime,
          endTime: data.endTime,
          addToCalendar: true,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send calendar invitation", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send shift cancellation notification to staff
   */
  private async sendShiftCancellationNotification(
    data: StaffShiftCancelledEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "shift_cancelled",
        title: "Hủy ca làm việc",
        content: `Ca làm việc của bạn từ ${this.formatDateTime(data.originalStartTime)} đến ${this.formatDateTime(data.originalEndTime)} đã bị hủy. Lý do: ${data.cancellationReason}`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          shiftId: data.shiftId,
          originalStartTime: data.originalStartTime,
          cancellationReason: data.cancellationReason,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent shift cancellation notification to staff", {
        staffId: data.staffId,
        shiftId: data.shiftId,
      });
    } catch (error) {
      console.error("Failed to send shift cancellation notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send shift cancellation notification to department manager
   */
  private async sendShiftCancellationManagerNotification(
    data: StaffShiftCancelledEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "shift_cancelled_manager",
        title: "Ca làm việc đã bị hủy",
        content: `Ca làm việc của ${data.staffName} (${data.shiftType}) từ ${this.formatDateTime(data.originalStartTime)} đã bị hủy bởi ${data.cancelledBy}. Lý do: ${data.cancellationReason}`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          shiftId: data.shiftId,
          cancelledBy: data.cancelledBy,
          cancellationReason: data.cancellationReason,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send shift cancellation manager notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send shift cancellation notification to affected patients
   */
  private async sendShiftCancellationPatientsNotification(
    data: StaffShiftCancelledEventData,
  ): Promise<void> {
    try {
      if (
        !data.affectedAppointments ||
        data.affectedAppointments.length === 0
      ) {
        return;
      }

      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "shift_cancellation_patients_affected",
        title: "Bệnh nhân bị ảnh hưởng bởi hủy ca",
        content: `${data.affectedAppointments.length} lịch hẹn bị ảnh hưởng do hủy ca của ${data.staffName}. Cần thông báo cho bệnh nhân.`,
        channels: ["in_app"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          affectedAppointments: data.affectedAppointments,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send shift cancellation patients notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send schedule update notification to staff
   */
  private async sendScheduleUpdateNotification(
    data: StaffScheduleUpdatedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const updateTypeText =
        {
          vacation: "nghỉ phép",
          sick_leave: "nghỉ ốm",
          emergency: "khẩn cấp",
          availability_change: "thay đổi sẵn sàng",
          schedule_pattern: "thay đổi lịch trình",
        }[data.updateType] || data.updateType;

      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "schedule_updated",
        title: "Cập nhật lịch trình",
        content: `Lịch trình của bạn đã được cập nhật: ${updateTypeText}${data.reason ? `. Lý do: ${data.reason}` : ""}`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.updateType === "emergency" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          updateType: data.updateType,
          oldSchedule: data.oldSchedule,
          newSchedule: data.newSchedule,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent schedule update notification to staff", {
        staffId: data.staffId,
        updateType: data.updateType,
      });
    } catch (error) {
      console.error("Failed to send schedule update notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send emergency schedule notification
   */
  private async sendEmergencyScheduleNotification(
    data: StaffScheduleUpdatedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "emergency_schedule_update",
        title: "Cập nhật lịch trình khẩn cấp",
        content: `${data.staffName} đã có thay đổi lịch trình khẩn cấp: ${data.updateType}. Cần điều phối lại nhân sự.`,
        channels: ["in_app", "email"],
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          updateType: data.updateType,
          reason: data.reason,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send emergency schedule notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send schedule update notification to affected patients
   */
  private async sendScheduleUpdatePatientsNotification(
    data: StaffScheduleUpdatedEventData,
  ): Promise<void> {
    try {
      if (
        !data.affectedAppointments ||
        data.affectedAppointments.length === 0
      ) {
        return;
      }

      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "schedule_update_patients_affected",
        title: "Bệnh nhân bị ảnh hưởng bởi cập nhật lịch trình",
        content: `${data.affectedAppointments.length} lịch hẹn bị ảnh hưởng do cập nhật lịch trình của ${data.staffName}.`,
        channels: ["in_app"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          affectedAppointments: data.affectedAppointments,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send schedule update patients notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send department assignment notification to staff
   */
  private async sendDepartmentAssignmentNotification(
    data: StaffDepartmentAssignedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "department_assigned",
        title: "Phân công khoa mới",
        content: `Bạn đã được phân công đến khoa ${data.newDepartmentName}${data.role ? ` với vai trò ${data.role}` : ""}. Hiệu lực từ ${this.formatDate(data.effectiveDate)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          oldDepartmentId: data.oldDepartmentId,
          newDepartmentId: data.newDepartmentId,
          role: data.role,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent department assignment notification to staff", {
        staffId: data.staffId,
        newDepartmentName: data.newDepartmentName,
      });
    } catch (error) {
      console.error("Failed to send department assignment notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send department welcome notification
   */
  private async sendDepartmentWelcomeNotification(
    data: StaffDepartmentAssignedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.newDepartmentId,
        recipientType: "department",
        type: "staff_welcome",
        title: "Chào mừng nhân viên mới",
        content: `${data.staffName} (${data.staffType}) đã gia nhập khoa ${data.newDepartmentName}${data.role ? ` với vai trò ${data.role}` : ""}.`,
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          newDepartmentId: data.newDepartmentId,
          role: data.role,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send department welcome notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send department transfer notification
   */
  private async sendDepartmentTransferNotification(
    data: StaffDepartmentAssignedEventData,
  ): Promise<void> {
    try {
      if (!data.oldDepartmentId) return;

      const notificationData = {
        recipientId: data.oldDepartmentId,
        recipientType: "department",
        type: "staff_transfer",
        title: "Nhân viên chuyển khoa",
        content: `${data.staffName} đã chuyển từ khoa ${data.oldDepartmentName} đến khoa ${data.newDepartmentName}.`,
        channels: ["in_app"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          oldDepartmentId: data.oldDepartmentId,
          newDepartmentId: data.newDepartmentId,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send department transfer notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send on-call assignment notification to staff
   */
  private async sendOnCallAssignmentNotification(
    data: StaffOnCallAssignedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const onCallTypeText =
        {
          primary: "chính",
          secondary: "phụ",
          backup: "dự phòng",
        }[data.onCallType] || data.onCallType;

      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "oncall_assigned",
        title: "Phân công trực",
        content: `Bạn đã được phân công trực ${onCallTypeText} tại khoa ${data.departmentName} từ ${this.formatDateTime(data.startTime)} đến ${this.formatDateTime(data.endTime)}.`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: data.onCallType === "primary" ? "high" : "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          onCallType: data.onCallType,
          startTime: data.startTime,
          endTime: data.endTime,
          contactNumber: data.contactNumber,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent on-call assignment notification to staff", {
        staffId: data.staffId,
        onCallType: data.onCallType,
      });
    } catch (error) {
      console.error("Failed to send on-call assignment notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send primary on-call notification
   */
  private async sendPrimaryOnCallNotification(
    data: StaffOnCallAssignedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "primary_oncall_assigned",
        title: "Phân công trực chính",
        content: `${data.staffName} đã được phân công trực chính tại khoa ${data.departmentName} từ ${this.formatDateTime(data.startTime)} đến ${this.formatDateTime(data.endTime)}.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          onCallType: data.onCallType,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send primary on-call notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send on-call schedule notification
   */
  private async sendOnCallScheduleNotification(
    data: StaffOnCallAssignedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "oncall_schedule",
        title: "Lịch trực khoa",
        content: `Lịch trực khoa ${data.departmentName} đã được cập nhật: ${data.staffName} trực ${data.onCallType} từ ${this.formatDateTime(data.startTime)} đến ${this.formatDateTime(data.endTime)}.`,
        channels: ["in_app"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          onCallType: data.onCallType,
          startTime: data.startTime,
          endTime: data.endTime,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send on-call schedule notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send performance review notification to staff
   */
  private async sendPerformanceReviewNotification(
    data: StaffPerformanceReviewEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const ratingText = this.getRatingText(data.overallRating);
      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "performance_review",
        title: "Đánh giá hiệu suất",
        content: `Đánh giá hiệu suất ${data.reviewType} của bạn đã hoàn thành. Điểm tổng thể: ${data.overallRating}/5 (${ratingText}). Đánh giá tiếp theo: ${this.formatDate(data.nextReviewDate)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          reviewType: data.reviewType,
          overallRating: data.overallRating,
          reviewedBy: data.reviewedBy,
          nextReviewDate: data.nextReviewDate,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent performance review notification to staff", {
        staffId: data.staffId,
        reviewType: data.reviewType,
        overallRating: data.overallRating,
      });
    } catch (error) {
      console.error("Failed to send performance review notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send performance review notification to manager
   */
  private async sendPerformanceReviewManagerNotification(
    data: StaffPerformanceReviewEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.departmentId,
        recipientType: "department",
        type: "performance_review_action_required",
        title: "Đánh giá hiệu suất cần hành động",
        content: `Đánh giá hiệu suất của ${data.staffName} (${data.overallRating}/5) có các điểm cần cải thiện. Cần lên kế hoạch hỗ trợ.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          staffId: data.staffId,
          overallRating: data.overallRating,
          areasForImprovement: data.areasForImprovement,
          nextReviewDate: data.nextReviewDate,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send performance review manager notification", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Schedule improvement follow-up
   */
  private async scheduleImprovementFollowUp(
    data: StaffPerformanceReviewEventData,
  ): Promise<void> {
    try {
      // Schedule follow-up notification for improvement areas
      const followUpDate = new Date(
        data.nextReviewDate.getTime() - 7 * 24 * 60 * 60 * 1000,
      ); // 1 week before next review

      const notificationData = {
        recipientId: data.staffId,
        recipientType: "staff",
        type: "improvement_follow_up",
        title: "Nhắc nhở cải thiện hiệu suất",
        content:
          "Đánh giá hiệu suất tiếp theo sẽ diễn ra sau 1 tuần. Vui lòng hoàn thành các mục cải thiện đã đề ra.",
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: followUpDate,
        metadata: {
          staffId: data.staffId,
          reviewType: data.reviewType,
          areasForImprovement: data.areasForImprovement,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to schedule improvement follow-up", {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Get enabled channels based on preferences
   */
  private getEnabledChannels(
    preferences: any,
    defaultChannels: string[],
  ): string[] {
    if (!preferences || !preferences.channels) {
      return defaultChannels;
    }

    return defaultChannels.filter(
      (channel) => preferences.channels[channel] !== false,
    );
  }

  /**
   * Get rating text
   */
  private getRatingText(rating: number): string {
    if (rating >= 4.5) return "Xuất sắc";
    if (rating >= 4.0) return "Tốt";
    if (rating >= 3.5) return "Khá";
    if (rating >= 3.0) return "Đạt";
    return "Cần cải thiện";
  }

  /**
   * Format date for Vietnamese locale
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Format date and time for Vietnamese locale
   */
  private formatDateTime(date: Date): string {
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private async dispatchNotification(
    payload: SendNotificationCommand,
  ): Promise<void> {
    await this.sendNotificationUseCase.execute({
      ...payload,
      priority: normalizePriority(payload.priority),
    });
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
      console.log("Staff event consumer disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect Staff event consumer:", error);
      throw error;
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected && !!this.channel && !!this.connection;
  }
}
