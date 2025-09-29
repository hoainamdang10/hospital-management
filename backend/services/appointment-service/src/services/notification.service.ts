import logger from "@hospital/shared/dist/utils/logger";
// Note: external notification helpers are not used here; relying on internal methods only
import { Appointment } from "../types/appointment.types";

export interface NotificationData {
  type:
    | "appointment_created"
    | "appointment_updated"
    | "appointment_cancelled"
    | "appointment_reminder";
  appointment: Appointment;
  recipient: {
    id: string;
    type: "doctor" | "patient";
    email?: string;
    phone?: string;
  };
  message: string;
  metadata?: any;
}

export interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export class NotificationService {
  private isEnabled: boolean = true;

  constructor() {
    this.isEnabled = process.env.NOTIFICATIONS_ENABLED !== "false";
    logger.info("🔔 Notification Service initialized", {
      enabled: this.isEnabled,
    });
  }

  /**
   * Send appointment creation notification
   */
  async sendAppointmentCreatedNotification(
    appointment: Appointment
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.info(
        "📵 Notifications disabled - skipping appointment created notification"
      );
      return;
    }

    try {
      // Notify doctor
      await this.sendNotification({
        type: "appointment_created",
        appointment,
        recipient: {
          id: appointment.doctor_id,
          type: "doctor",
        },
        message: `New appointment scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
      });

      // Notify patient
      await this.sendNotification({
        type: "appointment_created",
        appointment,
        recipient: {
          id: appointment.patient_id,
          type: "patient",
        },
        message: `Your appointment has been scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
      });

      logger.info("✅ Appointment created notifications sent", {
        appointment_id: appointment.appointment_id,
      });
    } catch (error) {
      logger.error(
        "❌ Error sending appointment created notifications:",
        error
      );
    }
  }

  /**
   * Send appointment update notification
   */
  async sendAppointmentUpdatedNotification(
    appointment: Appointment,
    changes: string[]
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.info(
        "📵 Notifications disabled - skipping appointment updated notification"
      );
      return;
    }

    try {
      const changeText = changes.join(", ");

      // Notify doctor
      await this.sendNotification({
        type: "appointment_updated",
        appointment,
        recipient: {
          id: appointment.doctor_id,
          type: "doctor",
        },
        message: `Appointment ${appointment.appointment_id} has been updated: ${changeText}`,
        metadata: { changes },
      });

      // Notify patient
      await this.sendNotification({
        type: "appointment_updated",
        appointment,
        recipient: {
          id: appointment.patient_id,
          type: "patient",
        },
        message: `Your appointment has been updated: ${changeText}`,
        metadata: { changes },
      });

      logger.info("✅ Appointment updated notifications sent", {
        appointment_id: appointment.appointment_id,
        changes,
      });
    } catch (error) {
      logger.error(
        "❌ Error sending appointment updated notifications:",
        error
      );
    }
  }

  /**
   * Send appointment cancellation notification
   */
  async sendAppointmentCancelledNotification(
    appointment: Appointment,
    reason?: string
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.info(
        "📵 Notifications disabled - skipping appointment cancelled notification"
      );
      return;
    }

    try {
      const reasonText = reason ? ` Reason: ${reason}` : "";

      // Notify doctor
      await this.sendNotification({
        type: "appointment_cancelled",
        appointment,
        recipient: {
          id: appointment.doctor_id,
          type: "doctor",
        },
        message: `Appointment ${appointment.appointment_id} has been cancelled.${reasonText}`,
        metadata: { reason },
      });

      // Notify patient
      await this.sendNotification({
        type: "appointment_cancelled",
        appointment,
        recipient: {
          id: appointment.patient_id,
          type: "patient",
        },
        message: `Your appointment for ${appointment.appointment_date} has been cancelled.${reasonText}`,
        metadata: { reason },
      });

      logger.info("✅ Appointment cancelled notifications sent", {
        appointment_id: appointment.appointment_id,
        reason,
      });
    } catch (error) {
      logger.error(
        "❌ Error sending appointment cancelled notifications:",
        error
      );
    }
  }

  /**
   * Send appointment reminder notification
   */
  async sendAppointmentReminder(
    appointment: Appointment,
    reminderType: "24h" | "2h" | "30m"
  ): Promise<void> {
    if (!this.isEnabled) {
      logger.info("📵 Notifications disabled - skipping appointment reminder");
      return;
    }

    try {
      const reminderMessages = {
        "24h": "You have an appointment tomorrow",
        "2h": "You have an appointment in 2 hours",
        "30m": "You have an appointment in 30 minutes",
      };

      const message = `${reminderMessages[reminderType]} on ${appointment.appointment_date} at ${appointment.appointment_time}`;

      // Notify patient only for reminders
      await this.sendNotification({
        type: "appointment_reminder",
        appointment,
        recipient: {
          id: appointment.patient_id,
          type: "patient",
        },
        message,
        metadata: { reminderType },
      });

      logger.info("✅ Appointment reminder sent", {
        appointment_id: appointment.appointment_id,
        reminderType,
      });
    } catch (error) {
      logger.error("❌ Error sending appointment reminder:", error);
    }
  }

  /**
   * Send notification through multiple channels
   */
  private async sendNotification(
    notificationData: NotificationData
  ): Promise<void> {
    try {
      // For now, we'll log the notification
      // In a real implementation, this would integrate with:
      // - Email service (SendGrid, AWS SES, etc.)
      // - SMS service (Twilio, AWS SNS, etc.)
      // - Push notification service (Firebase, OneSignal, etc.)
      // - In-app notification system

      logger.info("📧 Sending notification:", {
        type: notificationData.type,
        recipient: notificationData.recipient,
        message: notificationData.message,
        appointment_id: notificationData.appointment.appointment_id,
      });

      // Simulate notification sending
      await this.sendEmailNotification(notificationData);
      await this.sendInAppNotification(notificationData);
    } catch (error) {
      logger.error("❌ Error in sendNotification:", error);
      throw error;
    }
  }

  /**
   * Send email notification (placeholder implementation)
   */
  private async sendEmailNotification(
    notificationData: NotificationData
  ): Promise<void> {
    // Placeholder for email integration
    logger.info("📧 Email notification sent (simulated)", {
      to:
        notificationData.recipient.email ||
        `${notificationData.recipient.type}_${notificationData.recipient.id}@hospital.com`,
      subject: `Appointment ${notificationData.type.replace("_", " ")}`,
      message: notificationData.message,
    });
  }

  /**
   * Send in-app notification (placeholder implementation)
   */
  private async sendInAppNotification(
    notificationData: NotificationData
  ): Promise<void> {
    // Placeholder for in-app notification
    // This would typically store the notification in database for the user to see
    logger.info("🔔 In-app notification created (simulated)", {
      userId: notificationData.recipient.id,
      userType: notificationData.recipient.type,
      message: notificationData.message,
      type: notificationData.type,
    });
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(
    userId: string,
    userType: "doctor" | "patient"
  ): Promise<NotificationChannel> {
    // Placeholder implementation - would fetch from database
    return {
      email: true,
      sms: false,
      push: true,
      inApp: true,
    };
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string,
    userType: "doctor" | "patient",
    preferences: Partial<NotificationChannel>
  ): Promise<void> {
    // Placeholder implementation - would update database
    logger.info("⚙️ Notification preferences updated (simulated)", {
      userId,
      userType,
      preferences,
    });
  }

  /**
   * Enable/disable notification service
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    logger.info(`🔔 Notification Service ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Check if notification service is enabled
   */
  isNotificationEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
