"use strict";
/**
 * Appointment Scheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment scheduling event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentScheduledEvent = exports.AppointmentPriority = exports.AppointmentType = void 0;
const domain_event_1 = require("../../shared/domain/base/domain-event");
var AppointmentType;
(function (AppointmentType) {
    AppointmentType["CONSULTATION"] = "consultation";
    AppointmentType["FOLLOW_UP"] = "follow_up";
    AppointmentType["EMERGENCY"] = "emergency";
    AppointmentType["TELEMEDICINE"] = "telemedicine";
    AppointmentType["SURGERY"] = "surgery";
    AppointmentType["PROCEDURE"] = "procedure";
})(AppointmentType || (exports.AppointmentType = AppointmentType = {}));
var AppointmentPriority;
(function (AppointmentPriority) {
    AppointmentPriority["ROUTINE"] = "routine";
    AppointmentPriority["URGENT"] = "urgent";
    AppointmentPriority["EMERGENCY"] = "emergency";
    AppointmentPriority["STAT"] = "stat";
})(AppointmentPriority || (exports.AppointmentPriority = AppointmentPriority = {}));
/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 */
class AppointmentScheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, providerId, startTime, endTime, reason, appointmentType, priority, scheduledBy, department, roomId, estimatedDuration = 30, requiresPreparation = false, urgencyLevel = 'routine', specialRequirements, interpreterRequired, wheelchairAccessible) {
        const now = new Date();
        const eventData = {
            appointmentId,
            patientId,
            providerId,
            startTime,
            endTime,
            reason,
            appointmentType,
            priority,
            department: department || 'GENERAL',
            roomId,
            estimatedDuration,
            requiresPreparation,
            scheduledBy,
            scheduledAt: now,
            urgencyLevel,
            specialRequirements,
            interpreterRequired,
            wheelchairAccessible,
            integrationEvents: {
                providerScheduleUpdate: {
                    providerId,
                    timeSlotId: `${providerId}-${startTime.getTime()}`,
                    startTime,
                    endTime,
                    status: 'booked',
                    appointmentId,
                    patientId
                },
                patientAppointmentHistory: {
                    patientId,
                    appointmentId,
                    appointmentType,
                    providerId,
                    department: department || 'GENERAL',
                    scheduledAt: now,
                    status: 'scheduled'
                },
                notificationRequests: {
                    patientNotification: {
                        patientId,
                        type: 'appointment_scheduled',
                        channels: AppointmentScheduledEvent.getPatientNotificationChannels(priority, urgencyLevel),
                        templateData: {
                            appointmentId,
                            providerName: 'Bác sĩ', // Would be populated by handler
                            department: department || 'GENERAL',
                            appointmentDate: startTime.toLocaleDateString('vi-VN'),
                            appointmentTime: startTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            preparationInstructions: requiresPreparation ? 'Vui lòng liên hệ để biết hướng dẫn chuẩn bị' : undefined
                        },
                        scheduledFor: now,
                        priority: AppointmentScheduledEvent.getNotificationPriority(priority, urgencyLevel)
                    },
                    providerNotification: {
                        providerId,
                        type: 'new_appointment',
                        channels: ['email', 'push'],
                        templateData: {
                            appointmentId,
                            patientName: 'Bệnh nhân', // Would be populated by handler
                            appointmentDate: startTime.toLocaleDateString('vi-VN'),
                            appointmentTime: startTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            reason,
                            urgencyLevel: AppointmentScheduledEvent.getUrgencyDisplayName(urgencyLevel)
                        },
                        scheduledFor: now,
                        priority: urgencyLevel === 'emergency' ? 'urgent' : 'normal'
                    },
                    reminderNotifications: {
                        patientId,
                        appointmentId,
                        reminders: AppointmentScheduledEvent.generateReminderSchedule(startTime, urgencyLevel)
                    }
                },
                clinicalPreparation: AppointmentScheduledEvent.shouldPrepareClinicalRecord(appointmentType) ? {
                    patientId,
                    providerId,
                    appointmentId,
                    appointmentType,
                    reason,
                    prepareMedicalRecord: true,
                    reviewPreviousRecords: true,
                    specialInstructions: requiresPreparation ? reason : undefined
                } : undefined
            }
        };
        super('AppointmentScheduled', eventData, {
            aggregateId: appointmentId,
            aggregateType: 'Appointment',
            version: 1,
            correlationId: `appointment-${appointmentId}-${Date.now()}`,
            causationId: scheduledBy,
            metadata: {
                scheduledBy,
                scheduledAt: now.toISOString(),
                appointmentType,
                priority,
                department: department || 'GENERAL',
                isEmergency: priority === AppointmentPriority.EMERGENCY,
                isUrgent: priority === AppointmentPriority.URGENT || priority === AppointmentPriority.EMERGENCY,
                requiresSpecialHandling: AppointmentScheduledEvent.requiresSpecialHandling(appointmentType, priority),
                businessHours: AppointmentScheduledEvent.isWithinBusinessHours(startTime),
                vietnameseMetadata: {
                    reasonVi: reason,
                    departmentVi: AppointmentScheduledEvent.getDepartmentDisplayName(department || 'GENERAL'),
                    urgencyLevelVi: AppointmentScheduledEvent.getUrgencyDisplayName(urgencyLevel),
                    specialRequirementsVi: specialRequirements?.join(', ') || 'Không có yêu cầu đặc biệt'
                }
            }
        });
    }
    /**
     * Get patient notification channels based on priority and urgency
     */
    static getPatientNotificationChannels(priority, urgencyLevel) {
        if (urgencyLevel === 'emergency' || priority === AppointmentPriority.EMERGENCY) {
            return ['sms', 'push', 'email'];
        }
        else if (urgencyLevel === 'urgent' || priority === AppointmentPriority.URGENT) {
            return ['sms', 'push'];
        }
        else {
            return ['email', 'push'];
        }
    }
    /**
     * Get notification priority
     */
    static getNotificationPriority(priority, urgencyLevel) {
        if (urgencyLevel === 'emergency' || priority === AppointmentPriority.EMERGENCY) {
            return 'urgent';
        }
        else if (urgencyLevel === 'urgent' || priority === AppointmentPriority.URGENT) {
            return 'high';
        }
        else {
            return 'normal';
        }
    }
    /**
     * Generate reminder schedule based on urgency
     */
    static generateReminderSchedule(appointmentTime, urgencyLevel) {
        const reminders = [];
        if (urgencyLevel === 'emergency') {
            // Emergency appointments get immediate confirmation only
            return [];
        }
        // 24 hours before
        const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > new Date()) {
            reminders.push({
                type: '24h',
                scheduledFor: reminder24h,
                channels: ['email', 'push']
            });
        }
        // 2 hours before
        const reminder2h = new Date(appointmentTime.getTime() - 2 * 60 * 60 * 1000);
        if (reminder2h > new Date()) {
            reminders.push({
                type: '2h',
                scheduledFor: reminder2h,
                channels: urgencyLevel === 'urgent' ? ['sms', 'push'] : ['push']
            });
        }
        // 30 minutes before (for urgent appointments)
        if (urgencyLevel === 'urgent') {
            const reminder30min = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
            if (reminder30min > new Date()) {
                reminders.push({
                    type: '30min',
                    scheduledFor: reminder30min,
                    channels: ['sms']
                });
            }
        }
        return reminders;
    }
    /**
     * Check if appointment type requires special handling
     */
    static requiresSpecialHandling(appointmentType, priority) {
        return appointmentType === AppointmentType.SURGERY ||
            appointmentType === AppointmentType.EMERGENCY ||
            priority === AppointmentPriority.EMERGENCY ||
            priority === AppointmentPriority.URGENT;
    }
    /**
     * Check if appointment is within business hours
     */
    static isWithinBusinessHours(appointmentTime) {
        const hour = appointmentTime.getHours();
        return hour >= 8 && hour < 17;
    }
    /**
     * Check if clinical record preparation is needed
     */
    static shouldPrepareClinicalRecord(appointmentType) {
        return appointmentType === AppointmentType.SURGERY ||
            appointmentType === AppointmentType.DIAGNOSTIC ||
            appointmentType === AppointmentType.FOLLOW_UP;
    }
    /**
     * Get Vietnamese department display name
     */
    static getDepartmentDisplayName(department) {
        const departmentMap = {
            'CARD': 'Tim mạch',
            'ORTH': 'Chấn thương chỉnh hình',
            'NEUR': 'Thần kinh',
            'PEDI': 'Nhi khoa',
            'OBGY': 'Sản phụ khoa',
            'EMER': 'Cấp cứu',
            'SURG': 'Phẫu thuật',
            'GENERAL': 'Tổng quát'
        };
        return departmentMap[department] || department;
    }
    /**
     * Get Vietnamese urgency level display name
     */
    static getUrgencyDisplayName(urgencyLevel) {
        switch (urgencyLevel) {
            case 'routine':
                return 'Thường quy';
            case 'urgent':
                return 'Khẩn cấp';
            case 'emergency':
                return 'Cấp cứu';
            default:
                return 'Không xác định';
        }
    }
    /**
     * Get integration events for specific service
     */
    getIntegrationEventsForService(serviceName) {
        switch (serviceName.toLowerCase()) {
            case 'provider-staff':
            case 'provider':
                return this.data.integrationEvents.providerScheduleUpdate;
            case 'patient-registry':
            case 'patient':
                return this.data.integrationEvents.patientAppointmentHistory;
            case 'notification':
            case 'notifications':
                return this.data.integrationEvents.notificationRequests;
            case 'clinical':
            case 'emr':
                return this.data.integrationEvents.clinicalPreparation;
            default:
                return null;
        }
    }
}
exports.AppointmentScheduledEvent = AppointmentScheduledEvent;
//# sourceMappingURL=AppointmentScheduledEvent.js.map