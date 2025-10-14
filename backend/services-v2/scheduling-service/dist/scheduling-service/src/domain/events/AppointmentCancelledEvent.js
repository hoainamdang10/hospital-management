"use strict";
/**
 * Appointment Cancelled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment cancellation event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentCancelledEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
/**
 * Appointment Cancelled Domain Event
 * Triggered when an appointment is cancelled
 */
class AppointmentCancelledEvent extends domain_event_1.DomainEvent {
    constructor(appointmentId, patientId, providerId, originalStartTime, cancellationReason, cancelledBy, originalEndTime, correlationId, causationId, userId) {
        const now = new Date();
        const hoursNotice = Math.max(0, (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
        const eventData = {
            appointmentId,
            patientId,
            providerId,
            originalStartTime,
            originalEndTime: originalEndTime || new Date(originalStartTime.getTime() + 30 * 60 * 1000),
            cancellationReason,
            cancelledBy,
            cancelledAt: now,
            hoursNotice: Math.round(hoursNotice * 100) / 100,
            cancellationPolicy,
            integrationEvents: {
                providerScheduleUpdate: {
                    providerId,
                    timeSlotId: `${providerId}-${originalStartTime.getTime()}`,
                    startTime: originalStartTime,
                    endTime: originalEndTime || new Date(originalStartTime.getTime() + 30 * 60 * 1000),
                    status: 'available',
                    releasedAppointmentId: appointmentId,
                    releasedAt: now
                },
                patientAppointmentHistory: {
                    patientId,
                    appointmentId,
                    status: 'cancelled',
                    cancellationReason,
                    cancelledAt: now,
                    penaltyApplied: cancellationPolicy.penaltyApplied
                },
                notificationRequests: {
                    patientNotification: {
                        patientId,
                        type: 'appointment_cancelled',
                        channels: AppointmentCancelledEvent.getPatientNotificationChannels(hoursNotice),
                        templateData: {
                            appointmentId,
                            originalDate: originalStartTime.toLocaleDateString('vi-VN'),
                            originalTime: originalStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            cancellationReason,
                            penaltyInfo: cancellationPolicy.penaltyApplied ?
                                `Phí hủy lịch: ${cancellationPolicy.penaltyAmount?.toLocaleString('vi-VN')} VNĐ` : undefined,
                            rescheduleInfo: cancellationPolicy.rescheduleAllowed ?
                                'Bạn có thể đặt lịch mới miễn phí' : 'Vui lòng liên hệ để đặt lịch mới'
                        },
                        priority: hoursNotice < 2 ? 'high' : 'normal'
                    },
                    providerNotification: {
                        providerId,
                        type: 'appointment_cancelled',
                        channels: ['email', 'push'],
                        templateData: {
                            appointmentId,
                            patientName: 'Bệnh nhân', // Would be populated by handler
                            originalDate: originalStartTime.toLocaleDateString('vi-VN'),
                            originalTime: originalStartTime.toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                            cancellationReason,
                            hoursNotice: Math.round(hoursNotice * 100) / 100
                        },
                        priority: 'normal'
                    }
                },
                billingUpdate: cancellationPolicy.penaltyApplied || cancellationPolicy.refundEligible ? {
                    patientId,
                    appointmentId,
                    action: cancellationPolicy.penaltyApplied ? 'penalty' :
                        cancellationPolicy.refundEligible ? 'refund' : 'no_action',
                    amount: cancellationPolicy.penaltyApplied ? cancellationPolicy.penaltyAmount :
                        cancellationPolicy.refundEligible ? (cancellationPolicy.refundPercentage || 0) * 100000 : undefined,
                    reason: cancellationReason,
                    processedAt: now
                } : undefined,
                clinicalUpdate: {
                    patientId,
                    providerId,
                    appointmentId,
                    updateMedicalRecord: true,
                    cancellationNote: `Cuộc hẹn bị hủy: ${cancellationReason}. Thời gian thông báo: ${Math.round(hoursNotice * 100) / 100} giờ.`
                }
            }
        };
        super('AppointmentCancelled', appointmentId, 'Appointment', eventData, 1, correlationId, causationId, userId);
        this.appointmentId = appointmentId;
        this.patientId = patientId;
        this.providerId = providerId;
        this.originalStartTime = originalStartTime;
        this.cancellationReason = cancellationReason;
        this.cancelledBy = cancelledBy;
        this.originalEndTime = originalEndTime;
    }
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData() {
        const now = new Date();
        const hoursNotice = Math.max(0, (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
        return {
            appointmentId: this.appointmentId,
            patientId: this.patientId,
            providerId: this.providerId,
            originalStartTime: this.originalStartTime,
            originalEndTime: this.originalEndTime || new Date(this.originalStartTime.getTime() + 30 * 60 * 1000),
            cancellationReason: this.cancellationReason,
            cancelledBy: this.cancelledBy,
            cancelledAt: this.occurredAt,
            hoursNotice: Math.round(hoursNotice * 100) / 100,
            cancellationPolicy,
            integrationEvents: {
                providerScheduleUpdate: this.getProviderScheduleUpdate(),
                patientAppointmentHistory: this.getPatientAppointmentHistory(),
                notificationRequests: this.getNotificationRequests(),
                billingUpdate: this.getBillingUpdate(),
                clinicalUpdate: this.getClinicalUpdate()
            }
        };
    }
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI() {
        return true; // Appointments contain Protected Health Information
    }
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId() {
        return this.patientId;
    }
    /**
     * Calculate Vietnamese healthcare cancellation policy
     */
    static calculateCancellationPolicy(hoursNotice) {
        // Vietnamese healthcare cancellation policy
        if (hoursNotice >= 24) {
            // 24+ hours notice: Full refund, free reschedule
            return {
                penaltyApplied: false,
                refundEligible: true,
                rescheduleAllowed: true,
                refundPercentage: 1.0
            };
        }
        else if (hoursNotice >= 4) {
            // 4-24 hours notice: 80% refund, free reschedule
            return {
                penaltyApplied: false,
                refundEligible: true,
                rescheduleAllowed: true,
                refundPercentage: 0.8
            };
        }
        else if (hoursNotice >= 2) {
            // 2-4 hours notice: 50% refund, reschedule with fee
            return {
                penaltyApplied: true,
                refundEligible: true,
                rescheduleAllowed: true,
                penaltyAmount: 50000, // 50,000 VNĐ
                refundPercentage: 0.5
            };
        }
        else {
            // Less than 2 hours notice: No refund, penalty applies
            return {
                penaltyApplied: true,
                refundEligible: false,
                rescheduleAllowed: false,
                penaltyAmount: 100000 // 100,000 VNĐ
            };
        }
    }
    /**
     * Get patient notification channels based on notice time
     */
    static getPatientNotificationChannels(hoursNotice) {
        if (hoursNotice < 2) {
            // Last minute cancellation - use all channels
            return ['sms', 'push', 'email'];
        }
        else {
            // Normal cancellation
            return ['email', 'push'];
        }
    }
    /**
     * Get Vietnamese policy description
     */
    static getPolicyDescription(policy, hoursNotice) {
        if (hoursNotice >= 24) {
            return 'Hủy lịch miễn phí, hoàn tiền 100%';
        }
        else if (hoursNotice >= 4) {
            return 'Hoàn tiền 80%, đặt lịch mới miễn phí';
        }
        else if (hoursNotice >= 2) {
            return 'Hoàn tiền 50%, phí đặt lịch mới 50,000 VNĐ';
        }
        else {
            return 'Không hoàn tiền, phí hủy lịch 100,000 VNĐ';
        }
    }
    /**
     * Get integration events for specific service
     */
    getIntegrationEventsForService(serviceName) {
        const eventData = this.getEventData();
        switch (serviceName.toLowerCase()) {
            case 'provider-staff':
            case 'provider':
                return eventData.integrationEvents.providerScheduleUpdate;
            case 'patient-registry':
            case 'patient':
                return eventData.integrationEvents.patientAppointmentHistory;
            case 'notification':
            case 'notifications':
                return eventData.integrationEvents.notificationRequests;
            case 'billing':
                return eventData.integrationEvents.billingUpdate;
            case 'clinical':
            case 'emr':
                return eventData.integrationEvents.clinicalUpdate;
            default:
                return null;
        }
    }
    /**
     * Helper methods to get integration event parts
     */
    getProviderScheduleUpdate() {
        const now = new Date();
        return {
            providerId: this.providerId,
            timeSlotId: `${this.providerId}-${this.originalStartTime.getTime()}`,
            startTime: this.originalStartTime,
            endTime: this.originalEndTime || new Date(this.originalStartTime.getTime() + 30 * 60 * 1000),
            status: 'available',
            releasedAppointmentId: this.appointmentId,
            releasedAt: now
        };
    }
    getPatientAppointmentHistory() {
        const now = new Date();
        const hoursNotice = Math.max(0, (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
        return {
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            status: 'cancelled',
            cancellationReason: this.cancellationReason,
            cancelledAt: now,
            penaltyApplied: cancellationPolicy.penaltyApplied
        };
    }
    getNotificationRequests() {
        const now = new Date();
        const hoursNotice = Math.max(0, (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
        return {
            patientNotification: {
                patientId: this.patientId,
                type: 'appointment_cancelled',
                channels: AppointmentCancelledEvent.getPatientNotificationChannels(hoursNotice),
                templateData: {
                    appointmentId: this.appointmentId,
                    originalDate: this.originalStartTime.toLocaleDateString('vi-VN'),
                    originalTime: this.originalStartTime.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    cancellationReason: this.cancellationReason,
                    penaltyInfo: cancellationPolicy.penaltyApplied ?
                        `Phí hủy lịch: ${cancellationPolicy.penaltyAmount?.toLocaleString('vi-VN')} VNĐ` : undefined,
                    rescheduleInfo: cancellationPolicy.rescheduleAllowed ?
                        'Bạn có thể đặt lịch mới miễn phí' : 'Vui lòng liên hệ để đặt lịch mới'
                },
                priority: hoursNotice < 2 ? 'high' : 'normal'
            },
            providerNotification: {
                providerId: this.providerId,
                type: 'appointment_cancelled',
                channels: ['email', 'push'],
                templateData: {
                    appointmentId: this.appointmentId,
                    patientName: 'Bệnh nhân',
                    originalDate: this.originalStartTime.toLocaleDateString('vi-VN'),
                    originalTime: this.originalStartTime.toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    cancellationReason: this.cancellationReason,
                    hoursNotice: Math.round(hoursNotice * 100) / 100
                },
                priority: 'normal'
            }
        };
    }
    getBillingUpdate() {
        const now = new Date();
        const hoursNotice = Math.max(0, (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
        if (!cancellationPolicy.penaltyApplied && !cancellationPolicy.refundEligible) {
            return undefined;
        }
        return {
            patientId: this.patientId,
            appointmentId: this.appointmentId,
            action: cancellationPolicy.penaltyApplied ? 'penalty' :
                cancellationPolicy.refundEligible ? 'refund' : 'no_action',
            amount: cancellationPolicy.penaltyApplied ? cancellationPolicy.penaltyAmount :
                cancellationPolicy.refundEligible ? (cancellationPolicy.refundPercentage || 0) * 100000 : undefined,
            reason: this.cancellationReason,
            processedAt: now
        };
    }
    getClinicalUpdate() {
        const now = new Date();
        const hoursNotice = Math.max(0, (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        return {
            patientId: this.patientId,
            providerId: this.providerId,
            appointmentId: this.appointmentId,
            updateMedicalRecord: true,
            cancellationNote: `Cuộc hẹn bị hủy: ${this.cancellationReason}. Thời gian thông báo: ${Math.round(hoursNotice * 100) / 100} giờ.`
        };
    }
}
exports.AppointmentCancelledEvent = AppointmentCancelledEvent;
//# sourceMappingURL=AppointmentCancelledEvent.js.map