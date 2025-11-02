"use strict";
/**
 * Manage Appointment Reminders Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageAppointmentRemindersUseCase = void 0;
const use_case_interface_1 = require("../../../../shared/application/use-cases/base/use-case.interface");
const IReminderService_1 = require("../services/IReminderService");
/**
 * Manage Appointment Reminders Use Case
 *
 * Business Rules:
 * 1. Default reminders: 24h, 2h, 30m before appointment
 * 2. Channels: SMS, Email, App notification
 * 3. Respect quiet hours (21:00 - 06:00)
 * 4. Can enable/disable/reschedule reminders
 * 5. Integration with Scheduler Service
 */
class ManageAppointmentRemindersUseCase extends use_case_interface_1.BaseHealthcareUseCase {
    constructor(appointmentRepository, reminderService, authorizationService) {
        super();
        this.appointmentRepository = appointmentRepository;
        this.reminderService = reminderService;
        this.authorizationService = authorizationService;
        this.DEFAULT_REMINDER_WINDOWS = [
            { window: '24h', channels: [IReminderService_1.ReminderChannel.EMAIL, IReminderService_1.ReminderChannel.IN_APP] },
            { window: '2h', channels: [IReminderService_1.ReminderChannel.SMS, IReminderService_1.ReminderChannel.IN_APP] },
            { window: '30m', channels: [IReminderService_1.ReminderChannel.IN_APP] }
        ];
    }
    async executeInternal(request) {
        try {
            // 1. Find appointment
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                return {
                    success: false,
                    message: 'Không tìm thấy lịch hẹn',
                    errors: ['Appointment not found']
                };
            }
            // 2. Handle action
            switch (request.action) {
                case 'enable':
                    return await this.enableReminders(appointment, request);
                case 'disable':
                    return await this.disableReminders(appointment);
                case 'reschedule':
                    return await this.rescheduleReminders(appointment, request);
                default:
                    return {
                        success: false,
                        message: 'Hành động không hợp lệ',
                        errors: ['Invalid action']
                    };
            }
        }
        catch (error) {
            return {
                success: false,
                message: 'Quản lý nhắc nhở thất bại',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }
    /**
     * Enable reminders
     */
    async enableReminders(appointment, request) {
        const windows = request.reminderWindows || this.DEFAULT_REMINDER_WINDOWS;
        const appointmentDateTime = new Date(`${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`);
        // Calculate scheduled times
        const scheduledReminders = windows.map(window => {
            const scheduledFor = this.calculateReminderTime(appointmentDateTime, window.window);
            return {
                window: window.window,
                scheduledFor: scheduledFor.toISOString(),
                channels: window.channels
            };
        });
        // Call Scheduler Service to schedule reminders with custom windows
        try {
            await this.reminderService.scheduleReminders(appointment.appointmentId.value, appointment.patientId, appointmentDateTime, appointment.priority, windows // ✅ Pass custom windows
            );
            console.log(`[ManageReminders] Scheduled reminders for appointment ${appointment.appointmentId.value} with ${windows.length} custom windows`);
        }
        catch (error) {
            console.error('[ManageReminders] Failed to schedule reminders:', error);
            throw new Error('Failed to schedule reminders in scheduler service');
        }
        return {
            success: true,
            message: 'Đã bật nhắc nhở',
            reminders: {
                appointmentId: appointment.appointmentId.value,
                enabled: true,
                windows: scheduledReminders
            }
        };
    }
    /**
     * Disable reminders
     */
    async disableReminders(appointment) {
        // Call Scheduler Service to cancel reminders
        try {
            await this.reminderService.cancelReminders(appointment.appointmentId.value);
            console.log(`[ManageReminders] Cancelled reminders for appointment ${appointment.appointmentId.value}`);
        }
        catch (error) {
            console.error('[ManageReminders] Failed to cancel reminders:', error);
            throw new Error('Failed to cancel reminders in scheduler service');
        }
        return {
            success: true,
            message: 'Đã tắt nhắc nhở',
            reminders: {
                appointmentId: appointment.appointmentId.value,
                enabled: false,
                windows: []
            }
        };
    }
    /**
     * Reschedule reminders
     */
    async rescheduleReminders(appointment, request) {
        // Cancel old reminders
        await this.disableReminders(appointment);
        // Schedule new reminders
        return await this.enableReminders(appointment, request);
    }
    /**
     * Calculate reminder time based on window
     */
    calculateReminderTime(appointmentTime, window) {
        const match = window.match(/^(\d+)(h|m)$/);
        if (!match) {
            throw new Error(`Invalid window format: ${window}`);
        }
        const value = parseInt(match[1]);
        const unit = match[2];
        const reminderTime = new Date(appointmentTime);
        if (unit === 'h') {
            reminderTime.setHours(reminderTime.getHours() - value);
        }
        else if (unit === 'm') {
            reminderTime.setMinutes(reminderTime.getMinutes() - value);
        }
        // Respect quiet hours (21:00 - 06:00)
        return this.adjustForQuietHours(reminderTime);
    }
    /**
     * Adjust time to avoid quiet hours
     */
    adjustForQuietHours(time) {
        const hour = time.getHours();
        // If in quiet hours (21:00 - 06:00), move to 06:05
        if (hour >= 21 || hour < 6) {
            const adjusted = new Date(time);
            if (hour >= 21) {
                adjusted.setDate(adjusted.getDate() + 1);
            }
            adjusted.setHours(6, 5, 0, 0);
            return adjusted;
        }
        return time;
    }
    async authorize(request, userId) {
        try {
            // Get appointment to check patient ID
            const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
            if (!appointment) {
                // Let executeInternal handle "not found" case
                return true;
            }
            // Check if user has permission to manage reminders
            // Patient can manage their own reminders, Staff can manage any reminders
            const canManage = await this.authorizationService.canManageAppointmentReminders(userId, appointment.patientId);
            return canManage;
        }
        catch (error) {
            console.error('[ManageReminders] Authorization check failed:', error);
            return false;
        }
    }
    involvesPHI(request) {
        return true;
    }
    getPatientId(request) {
        // Will be retrieved from appointment
        return null;
    }
}
exports.ManageAppointmentRemindersUseCase = ManageAppointmentRemindersUseCase;
//# sourceMappingURL=ManageAppointmentReminders.use-case.js.map