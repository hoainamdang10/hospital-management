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
    constructor(appointmentId, patientId, providerId, originalStartTime, cancellationReason, cancelledBy, originalEndTime) {
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
        super('AppointmentCancelled', eventData, {
            aggregateId: appointmentId,
            aggregateType: 'Appointment',
            version: 1,
            correlationId: `appointment-cancelled-${appointmentId}-${Date.now()}`,
            causationId: cancelledBy,
            metadata: {
                cancelledBy,
                cancelledAt: now.toISOString(),
                cancellationReason,
                hoursNotice: Math.round(hoursNotice * 100) / 100,
                penaltyApplied: cancellationPolicy.penaltyApplied,
                refundEligible: cancellationPolicy.refundEligible,
                rescheduleAllowed: cancellationPolicy.rescheduleAllowed,
                isLastMinuteCancellation: hoursNotice < 2,
                isEmergencyCancellation: cancellationReason.toLowerCase().includes('emergency') ||
                    cancellationReason.toLowerCase().includes('cấp cứu'),
                vietnameseMetadata: {
                    cancellationReasonVi: cancellationReason,
                    policyDescriptionVi: AppointmentCancelledEvent.getPolicyDescription(cancellationPolicy, hoursNotice),
                    hoursNoticeVi: `${Math.round(hoursNotice * 100) / 100} giờ trước`
                }
            }
        });
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
exports.AppointmentCancelledEvent = AppointmentCancelledEvent;
//# sourceMappingURL=AppointmentCancelledEvent.js.map