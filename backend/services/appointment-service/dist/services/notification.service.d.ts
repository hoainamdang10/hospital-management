import { Appointment } from "../types/appointment.types";
export interface NotificationData {
    type: "appointment_created" | "appointment_updated" | "appointment_cancelled" | "appointment_reminder";
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
export declare class NotificationService {
    private isEnabled;
    constructor();
    sendAppointmentCreatedNotification(appointment: Appointment): Promise<void>;
    sendAppointmentUpdatedNotification(appointment: Appointment, changes: string[]): Promise<void>;
    sendAppointmentCancelledNotification(appointment: Appointment, reason?: string): Promise<void>;
    sendAppointmentReminder(appointment: Appointment, reminderType: "24h" | "2h" | "30m"): Promise<void>;
    private sendNotification;
    private sendEmailNotification;
    private sendInAppNotification;
    getNotificationPreferences(userId: string, userType: "doctor" | "patient"): Promise<NotificationChannel>;
    updateNotificationPreferences(userId: string, userType: "doctor" | "patient", preferences: Partial<NotificationChannel>): Promise<void>;
    setEnabled(enabled: boolean): void;
    isNotificationEnabled(): boolean;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map