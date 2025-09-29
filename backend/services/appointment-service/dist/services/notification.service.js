"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class NotificationService {
    constructor() {
        this.isEnabled = true;
        this.isEnabled = process.env.NOTIFICATIONS_ENABLED !== "false";
        logger_1.default.info("🔔 Notification Service initialized", {
            enabled: this.isEnabled,
        });
    }
    async sendAppointmentCreatedNotification(appointment) {
        if (!this.isEnabled) {
            logger_1.default.info("📵 Notifications disabled - skipping appointment created notification");
            return;
        }
        try {
            await this.sendNotification({
                type: "appointment_created",
                appointment,
                recipient: {
                    id: appointment.doctor_id,
                    type: "doctor",
                },
                message: `New appointment scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
            });
            await this.sendNotification({
                type: "appointment_created",
                appointment,
                recipient: {
                    id: appointment.patient_id,
                    type: "patient",
                },
                message: `Your appointment has been scheduled for ${appointment.appointment_date} at ${appointment.appointment_time}`,
            });
            logger_1.default.info("✅ Appointment created notifications sent", {
                appointment_id: appointment.appointment_id,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error sending appointment created notifications:", error);
        }
    }
    async sendAppointmentUpdatedNotification(appointment, changes) {
        if (!this.isEnabled) {
            logger_1.default.info("📵 Notifications disabled - skipping appointment updated notification");
            return;
        }
        try {
            const changeText = changes.join(", ");
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
            logger_1.default.info("✅ Appointment updated notifications sent", {
                appointment_id: appointment.appointment_id,
                changes,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error sending appointment updated notifications:", error);
        }
    }
    async sendAppointmentCancelledNotification(appointment, reason) {
        if (!this.isEnabled) {
            logger_1.default.info("📵 Notifications disabled - skipping appointment cancelled notification");
            return;
        }
        try {
            const reasonText = reason ? ` Reason: ${reason}` : "";
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
            logger_1.default.info("✅ Appointment cancelled notifications sent", {
                appointment_id: appointment.appointment_id,
                reason,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error sending appointment cancelled notifications:", error);
        }
    }
    async sendAppointmentReminder(appointment, reminderType) {
        if (!this.isEnabled) {
            logger_1.default.info("📵 Notifications disabled - skipping appointment reminder");
            return;
        }
        try {
            const reminderMessages = {
                "24h": "You have an appointment tomorrow",
                "2h": "You have an appointment in 2 hours",
                "30m": "You have an appointment in 30 minutes",
            };
            const message = `${reminderMessages[reminderType]} on ${appointment.appointment_date} at ${appointment.appointment_time}`;
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
            logger_1.default.info("✅ Appointment reminder sent", {
                appointment_id: appointment.appointment_id,
                reminderType,
            });
        }
        catch (error) {
            logger_1.default.error("❌ Error sending appointment reminder:", error);
        }
    }
    async sendNotification(notificationData) {
        try {
            logger_1.default.info("📧 Sending notification:", {
                type: notificationData.type,
                recipient: notificationData.recipient,
                message: notificationData.message,
                appointment_id: notificationData.appointment.appointment_id,
            });
            await this.sendEmailNotification(notificationData);
            await this.sendInAppNotification(notificationData);
        }
        catch (error) {
            logger_1.default.error("❌ Error in sendNotification:", error);
            throw error;
        }
    }
    async sendEmailNotification(notificationData) {
        logger_1.default.info("📧 Email notification sent (simulated)", {
            to: notificationData.recipient.email ||
                `${notificationData.recipient.type}_${notificationData.recipient.id}@hospital.com`,
            subject: `Appointment ${notificationData.type.replace("_", " ")}`,
            message: notificationData.message,
        });
    }
    async sendInAppNotification(notificationData) {
        logger_1.default.info("🔔 In-app notification created (simulated)", {
            userId: notificationData.recipient.id,
            userType: notificationData.recipient.type,
            message: notificationData.message,
            type: notificationData.type,
        });
    }
    async getNotificationPreferences(userId, userType) {
        return {
            email: true,
            sms: false,
            push: true,
            inApp: true,
        };
    }
    async updateNotificationPreferences(userId, userType, preferences) {
        logger_1.default.info("⚙️ Notification preferences updated (simulated)", {
            userId,
            userType,
            preferences,
        });
    }
    setEnabled(enabled) {
        this.isEnabled = enabled;
        logger_1.default.info(`🔔 Notification Service ${enabled ? "enabled" : "disabled"}`);
    }
    isNotificationEnabled() {
        return this.isEnabled;
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map