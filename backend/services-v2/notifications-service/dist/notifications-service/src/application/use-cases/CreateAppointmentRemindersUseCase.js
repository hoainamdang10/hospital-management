"use strict";
/**
 * CreateAppointmentRemindersUseCase
 * Creates reminder records in database when appointment is scheduled
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppointmentRemindersUseCase = void 0;
const AppointmentReminder_1 = require("../../domain/aggregates/AppointmentReminder");
const ReminderType_1 = require("../../domain/value-objects/ReminderType");
const ReminderStatus_1 = require("../../domain/value-objects/ReminderStatus");
class CreateAppointmentRemindersUseCase {
    constructor(reminderRepo) {
        this.reminderRepo = reminderRepo;
    }
    /**
     * Execute use case - create 3 reminders for an appointment
     */
    async execute(request) {
        try {
            // Validate input
            if (!request.appointmentId || !request.patientId) {
                return {
                    success: false,
                    created: 0,
                    message: 'Appointment ID and Patient ID are required'
                };
            }
            if (!request.appointmentDate || !request.appointmentTime) {
                return {
                    success: false,
                    created: 0,
                    message: 'Appointment date and time are required'
                };
            }
            if (!request.patientPhone && !request.patientEmail) {
                return {
                    success: false,
                    created: 0,
                    message: 'Patient must have at least one contact method'
                };
            }
            // Calculate appointment datetime
            const appointmentDateTime = this.combineDateTime(request.appointmentDate, request.appointmentTime);
            // Check if appointment is in the future
            if (appointmentDateTime <= new Date()) {
                console.warn('[CreateAppointmentRemindersUseCase] Appointment is in the past, skipping reminders');
                return { success: true, created: 0, message: 'Appointment in past, no reminders created' };
            }
            // Create 3 standard reminders
            const reminderTypes = ReminderType_1.ReminderType.getAllStandardTypes();
            let created = 0;
            for (const reminderType of reminderTypes) {
                const scheduledSendTime = reminderType.calculateSendTime(appointmentDateTime);
                // Only create reminder if send time is in the future
                if (scheduledSendTime > new Date()) {
                    try {
                        const reminder = AppointmentReminder_1.AppointmentReminder.create({
                            appointmentId: request.appointmentId,
                            tenantId: request.tenantId || 'hospital-1',
                            patientId: request.patientId,
                            patientName: request.patientName,
                            patientPhone: request.patientPhone,
                            patientEmail: request.patientEmail,
                            patientLanguage: request.patientLanguage || 'vi',
                            doctorId: request.doctorId,
                            doctorName: request.doctorName,
                            doctorSpecialization: request.doctorSpecialization,
                            appointmentDate: request.appointmentDate,
                            appointmentTime: request.appointmentTime,
                            appointmentType: request.appointmentType,
                            reason: request.reason,
                            reminderType,
                            scheduledSendTime,
                            status: ReminderStatus_1.ReminderStatus.PENDING,
                            channels: this.determineChannels(request),
                            preferredChannel: this.determinePreferredChannel(request),
                        });
                        await this.reminderRepo.save(reminder);
                        created++;
                        console.log(`[CreateAppointmentRemindersUseCase] Created ${reminderType.toString()} reminder for appointment ${request.appointmentId}`);
                    }
                    catch (error) {
                        console.error(`[CreateAppointmentRemindersUseCase] Failed to create/save reminder: ${error.message}`);
                        continue;
                    }
                }
                else {
                    console.warn(`[CreateAppointmentRemindersUseCase] Skipping ${reminderType.toString()} reminder (send time in past)`);
                }
            }
            console.log(`[CreateAppointmentRemindersUseCase] Created ${created}/${reminderTypes.length} reminders for appointment ${request.appointmentId}`);
            return {
                success: true,
                created,
                message: `Created ${created} reminders`
            };
        }
        catch (error) {
            console.error('[CreateAppointmentRemindersUseCase] Unexpected error:', error);
            return {
                success: false,
                created: 0,
                message: `Failed to create reminders: ${error.message}`
            };
        }
    }
    /**
     * Combine date and time into single datetime
     */
    combineDateTime(date, time) {
        const [hours, minutes] = time.split(':').map(Number);
        const datetime = new Date(date);
        datetime.setHours(hours, minutes, 0, 0);
        return datetime;
    }
    /**
     * Determine notification channels based on patient contact info
     */
    determineChannels(request) {
        const channels = [];
        if (request.patientPhone) {
            channels.push('SMS');
        }
        if (request.patientEmail) {
            channels.push('EMAIL');
        }
        // Always include IN_APP if available
        channels.push('IN_APP');
        return channels.length > 0 ? channels : ['SMS', 'EMAIL'];
    }
    /**
     * Determine preferred channel
     */
    determinePreferredChannel(request) {
        // Prefer SMS for reminders (more immediate)
        if (request.patientPhone) {
            return 'SMS';
        }
        if (request.patientEmail) {
            return 'EMAIL';
        }
        return 'IN_APP';
    }
}
exports.CreateAppointmentRemindersUseCase = CreateAppointmentRemindersUseCase;
//# sourceMappingURL=CreateAppointmentRemindersUseCase.js.map