"use strict";
/**
 * Appointment Rescheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment rescheduling event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRescheduledEvent = void 0;
const domain_event_1 = require("../../shared/domain/base/domain-event");
/**
 * Appointment Rescheduled Domain Event
 * Triggered when an appointment is rescheduled to a new time
 */
class AppointmentRescheduledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, providerId, originalStartTime, originalEndTime, newStartTime, newEndTime, rescheduleReason, rescheduledBy) {
        const now = new Date();
        const hoursNotice = Math.max(0, (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const reschedulePolicy = AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);
        const eventData = {
            appointmentId,
            patientId,
            providerId,
            originalStartTime,
            originalEndTime,
            newStartTime,
            newEndTime,
            rescheduleReason,
            rescheduledBy,
            rescheduledAt: now,
            hoursNotice: Math.round(hoursNotice * 100) / 100,
            reschedulePolicy,
            integrationEvents: {
                providerScheduleUpdate: {
                    providerId,
                    releaseTimeSlot: {
                        timeSlotId: `${providerId}-${originalStartTime.getTime()}`,
                        startTime: originalStartTime,
                        endTime: originalEndTime,
                        status: 'available'
                    },
                    bookTimeSlot: {
                        timeSlotId: `${providerId}-${newStartTime.getTime()}`,
                        startTime: newStartTime,
                        endTime: newEndTime,
                        status: 'booked',
                        appointmentId
                    },
                    updatedAt: now
                },
                patientAppointmentHistory: {
                    patientId,
                    appointmentId,
                    status: 'rescheduled',
                    originalDate: originalStartTime,
                    newDate: newStartTime,
                    rescheduleReason,
                    rescheduledAt: now,
                    feeApplied: reschedulePolicy.feeApplied
                },
                notificationRequests: {
                    patientNotification: {
                        patientId,
                        type: 'appointment_rescheduled',
                        channels: AppointmentRescheduledEvent.getPatientNotificationChannels(hoursNotice),
                        templateData: {
                            appointmentId,
                            originalDate: originalStartTime.toLocaleDateString('vi-VN'),
                            originalTime: originalStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            newDate: newStartTime.toLocaleDateString('vi-VN'),
                            newTime: newStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            rescheduleReason,
                            feeInfo: reschedulePolicy.feeApplied ?
                                `Phí đổi lịch: ${reschedulePolicy.rescheduleAmount?.toLocaleString('vi-VN')} VNĐ` :
                                'Đổi lịch miễn phí',
                            preparationInstructions: 'Vui lòng có mặt đúng giờ hẹn mới'
                        },
                        priority: hoursNotice < 4 ? 'high' : 'normal'
                    },
                    providerNotification: {
                        providerId,
                        type: 'appointment_rescheduled',
                        channels: ['email', 'push'],
                        templateData: {
                            appointmentId,
                            patientName: 'Bệnh nhân', // Would be populated by handler
                            originalDate: originalStartTime.toLocaleDateString('vi-VN'),
                            originalTime: originalStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            newDate: newStartTime.toLocaleDateString('vi-VN'),
                            newTime: newStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            rescheduleReason,
                            hoursNotice: Math.round(hoursNotice * 100) / 100
                        },
                        priority: 'normal'
                    },
                    reminderNotifications: {
                        patientId,
                        appointmentId,
                        reminders: AppointmentRescheduledEvent.generateReminderSchedule(newStartTime)
                    }
                },
                billingUpdate: reschedulePolicy.feeApplied ? {
                    patientId,
                    appointmentId,
                    action: 'reschedule_fee',
                    amount: reschedulePolicy.rescheduleAmount,
                    reason: rescheduleReason,
                    processedAt: now
                } : {
                    patientId,
                    appointmentId,
                    action: 'no_charge',
                    reason: 'Free reschedule within policy',
                    processedAt: now
                },
                clinicalUpdate: {
                    patientId,
                    providerId,
                    appointmentId,
                    updateMedicalRecord: true,
                    rescheduleNote: `Cuộc hẹn được đổi lịch: ${rescheduleReason}. Từ ${originalStartTime.toLocaleString('vi-VN')} sang ${newStartTime.toLocaleString('vi-VN')}.`,
                    newAppointmentTime: newStartTime
                }
            }
        };
        super('AppointmentRescheduled', eventData, {
            aggregateId: appointmentId,
            aggregateType: 'Appointment',
            version: 1,
            correlationId: `appointment-rescheduled-${appointmentId}-${Date.now()}`,
            causationId: rescheduledBy,
            metadata: {
                rescheduledBy,
                rescheduledAt: now.toISOString(),
                rescheduleReason,
                hoursNotice: Math.round(hoursNotice * 100) / 100,
                feeApplied: reschedulePolicy.feeApplied,
                freeRescheduleUsed: reschedulePolicy.freeRescheduleUsed,
                remainingFreeReschedules: reschedulePolicy.remainingFreeReschedules,
                isLastMinuteReschedule: hoursNotice < 4,
                isEmergencyReschedule: rescheduleReason.toLowerCase().includes('emergency') ||
                    rescheduleReason.toLowerCase().includes('cấp cứu'),
                vietnameseMetadata: {
                    rescheduleReasonVi: rescheduleReason,
                    policyDescriptionVi: AppointmentRescheduledEvent.getPolicyDescription(reschedulePolicy, hoursNotice),
                    hoursNoticeVi: `${Math.round(hoursNotice * 100) / 100} giờ trước`,
                    timeChangeVi: `Từ ${originalStartTime.toLocaleString('vi-VN')} sang ${newStartTime.toLocaleString('vi-VN')}`
                }
            }
        });
    }
    /**
     * Calculate Vietnamese healthcare reschedule policy
     */
    static calculateReschedulePolicy(hoursNotice) {
        // Vietnamese healthcare reschedule policy
        // Note: In real implementation, remainingFreeReschedules would come from patient history
        const remainingFreeReschedules = 1; // Assume 1 free reschedule remaining
        if (hoursNotice >= 24 && remainingFreeReschedules > 0) {
            // 24+ hours notice with free reschedules available
            return {
                feeApplied: false,
                freeRescheduleUsed: true,
                remainingFreeReschedules: remainingFreeReschedules - 1
            };
        }
        else if (hoursNotice >= 4) {
            // 4-24 hours notice or no free reschedules: Small fee
            return {
                feeApplied: true,
                freeRescheduleUsed: false,
                remainingFreeReschedules,
                rescheduleAmount: 30000 // 30,000 VNĐ
            };
        }
        else {
            // Less than 4 hours notice: Higher fee
            return {
                feeApplied: true,
                freeRescheduleUsed: false,
                remainingFreeReschedules,
                rescheduleAmount: 50000 // 50,000 VNĐ
            };
        }
    }
    /**
     * Get patient notification channels based on notice time
     */
    static getPatientNotificationChannels(hoursNotice) {
        if (hoursNotice < 4) {
            // Last minute reschedule - use immediate channels
            return ['sms', 'push'];
        }
        else {
            // Normal reschedule
            return ['email', 'push'];
        }
    }
    /**
     * Generate reminder schedule for new appointment time
     */
    static generateReminderSchedule(newAppointmentTime) {
        const reminders = [];
        // 24 hours before new appointment
        const reminder24h = new Date(newAppointmentTime.getTime() - 24 * 60 * 60 * 1000);
        if (reminder24h > new Date()) {
            reminders.push({
                type: '24h',
                scheduledFor: reminder24h,
                channels: ['email', 'push']
            });
        }
        // 2 hours before new appointment
        const reminder2h = new Date(newAppointmentTime.getTime() - 2 * 60 * 60 * 1000);
        if (reminder2h > new Date()) {
            reminders.push({
                type: '2h',
                scheduledFor: reminder2h,
                channels: ['push']
            });
        }
        return reminders;
    }
    /**
     * Get Vietnamese policy description
     */
    static getPolicyDescription(policy, hoursNotice) {
        if (!policy.feeApplied && policy.freeRescheduleUsed) {
            return `Đổi lịch miễn phí (còn ${policy.remainingFreeReschedules} lần miễn phí)`;
        }
        else if (policy.feeApplied && hoursNotice >= 4) {
            return `Phí đổi lịch: ${policy.rescheduleAmount?.toLocaleString('vi-VN')} VNĐ`;
        }
        else {
            return `Phí đổi lịch gấp: ${policy.rescheduleAmount?.toLocaleString('vi-VN')} VNĐ`;
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
            case 'billing':
                return this.data.integrationEvents.billingUpdate;
            case 'clinical':
            case 'emr':
                return this.data.integrationEvents.clinicalUpdate;
            default:
                return null;
        }
    }
}
exports.AppointmentRescheduledEvent = AppointmentRescheduledEvent;
//# sourceMappingURL=AppointmentRescheduledEvent.js.map