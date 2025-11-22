/**
 * Appointment Cancelled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment cancellation event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { DomainEvent } from "@shared/domain/base/domain-event";

export interface AppointmentCancelledEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string; // Changed from providerId to doctorId for consistency
  originalStartTime: Date;
  originalEndTime: Date;
  cancellationReason: string;
  cancelledBy: string;
  cancelledAt: Date;

  // Vietnamese healthcare cancellation policy
  hoursNotice: number;
  cancellationPolicy: {
    penaltyApplied: boolean;
    refundEligible: boolean;
    rescheduleAllowed: boolean;
    penaltyAmount?: number;
    refundPercentage?: number;
  };

  // Integration events for other services
  integrationEvents: {
    // Provider Staff Service - release time slot
    providerScheduleUpdate: {
      doctorId: string; // Changed from providerId to doctorId
      timeSlotId: string;
      startTime: Date;
      endTime: Date;
      status: "available";
      releasedAppointmentId: string;
      releasedAt: Date;
    };

    // Patient Registry Service - update appointment history
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      status: "cancelled";
      cancellationReason: string;
      cancelledAt: Date;
      penaltyApplied: boolean;
    };

    // Notification Service - send cancellation notifications
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: "appointment_cancelled";
        channels: ("sms" | "email" | "push")[];
        templateData: {
          appointmentId: string;
          originalDate: string;
          originalTime: string;
          cancellationReason: string;
          penaltyInfo?: string;
          rescheduleInfo?: string;
        };
        priority: "normal" | "high";
      };

      providerNotification: {
        doctorId: string;
        type: "appointment_cancelled";
        channels: ("email" | "push")[];
        templateData: {
          appointmentId: string;
          patientName: string;
          originalDate: string;
          originalTime: string;
          cancellationReason: string;
          hoursNotice: number;
        };
        priority: "normal";
      };
    };

    // Billing Service - handle refunds/penalties
    billingUpdate?: {
      patientId: string;
      appointmentId: string;
      action: "refund" | "penalty" | "no_action";
      amount?: number;
      reason: string;
      processedAt: Date;
    };

    // Clinical/EMR Service - update medical record
    clinicalUpdate?: {
      patientId: string;
      doctorId: string;
      appointmentId: string;
      updateMedicalRecord: boolean;
      cancellationNote: string;
    };
  };
}

/**
 * Appointment Cancelled Domain Event
 * Triggered when an appointment is cancelled
 */
export class AppointmentCancelledEvent extends DomainEvent {
  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string, // Changed from providerId to doctorId
    public readonly originalStartTime: Date,
    public readonly cancellationReason: string,
    public readonly cancelledBy: string,
    public readonly originalEndTime?: Date,
    correlationId?: string,
    causationId?: string,
    userId?: string,
  ) {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    const eventData: AppointmentCancelledEventData = {
      appointmentId,
      patientId,
      doctorId, // Changed from providerId to doctorId
      originalStartTime,
      originalEndTime:
        originalEndTime ||
        new Date(originalStartTime.getTime() + 30 * 60 * 1000),
      cancellationReason,
      cancelledBy,
      cancelledAt: now,
      hoursNotice: Math.round(hoursNotice * 100) / 100,
      cancellationPolicy,

      integrationEvents: {
        providerScheduleUpdate: {
          doctorId, // Changed from providerId to doctorId
          timeSlotId: `${doctorId}-${originalStartTime.getTime()}`,
          startTime: originalStartTime,
          endTime:
            originalEndTime ||
            new Date(originalStartTime.getTime() + 30 * 60 * 1000),
          status: "available",
          releasedAppointmentId: appointmentId,
          releasedAt: now,
        },

        patientAppointmentHistory: {
          patientId,
          appointmentId,
          status: "cancelled",
          cancellationReason,
          cancelledAt: now,
          penaltyApplied: cancellationPolicy.penaltyApplied,
        },

        notificationRequests: {
          patientNotification: {
            patientId,
            type: "appointment_cancelled",
            channels:
              AppointmentCancelledEvent.getPatientNotificationChannels(
                hoursNotice,
              ),
            templateData: {
              appointmentId,
              originalDate: originalStartTime.toLocaleDateString("vi-VN"),
              originalTime: originalStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              cancellationReason,
              penaltyInfo: cancellationPolicy.penaltyApplied
                ? `Phí hủy lịch: ${cancellationPolicy.penaltyAmount?.toLocaleString("vi-VN")} VNĐ`
                : undefined,
              rescheduleInfo: cancellationPolicy.rescheduleAllowed
                ? "Bạn có thể đặt lịch mới miễn phí"
                : "Vui lòng liên hệ để đặt lịch mới",
            },
            priority: hoursNotice < 2 ? "high" : "normal",
          },

          providerNotification: {
            doctorId,
            type: "appointment_cancelled",
            channels: ["email", "push"],
            templateData: {
              appointmentId,
              patientName: "Bệnh nhân", // Would be populated by handler
              originalDate: originalStartTime.toLocaleDateString("vi-VN"),
              originalTime: originalStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              cancellationReason,
              hoursNotice: Math.round(hoursNotice * 100) / 100,
            },
            priority: "normal",
          },
        },

        billingUpdate:
          cancellationPolicy.penaltyApplied || cancellationPolicy.refundEligible
            ? {
                patientId,
                appointmentId,
                action: cancellationPolicy.penaltyApplied
                  ? "penalty"
                  : cancellationPolicy.refundEligible
                    ? "refund"
                    : "no_action",
                amount: cancellationPolicy.penaltyApplied
                  ? cancellationPolicy.penaltyAmount
                  : cancellationPolicy.refundEligible
                    ? (cancellationPolicy.refundPercentage || 0) * 100000
                    : undefined,
                reason: cancellationReason,
                processedAt: now,
              }
            : undefined,

        clinicalUpdate: {
          patientId,
          doctorId,
          appointmentId,
          updateMedicalRecord: true,
          cancellationNote: `Cuộc hẹn bị hủy: ${cancellationReason}. Thời gian thông báo: ${Math.round(hoursNotice * 100) / 100} giờ.`,
        },
      },
    };

    super(
      "AppointmentCancelled",
      appointmentId,
      "Appointment",
      eventData,
      1,
      correlationId,
      causationId,
      userId,
    );
  }

  /**
   * Get event data payload (required by DomainEvent base class)
   */
  public getEventData(): AppointmentCancelledEventData {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId, // Changed from providerId to doctorId
      originalStartTime: this.originalStartTime,
      originalEndTime:
        this.originalEndTime ||
        new Date(this.originalStartTime.getTime() + 30 * 60 * 1000),
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
        clinicalUpdate: this.getClinicalUpdate(),
      },
    };
  }

  /**
   * Check if event contains PHI (required by DomainEvent base class)
   */
  public containsPHI(): boolean {
    return true; // Appointments contain Protected Health Information
  }

  /**
   * Get patient ID (required for healthcare events)
   */
  public getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Calculate Vietnamese healthcare cancellation policy
   */
  public static calculateCancellationPolicy(hoursNotice: number): {
    penaltyApplied: boolean;
    refundEligible: boolean;
    rescheduleAllowed: boolean;
    penaltyAmount?: number;
    refundPercentage?: number;
  } {
    // Vietnamese healthcare cancellation policy
    if (hoursNotice >= 24) {
      // 24+ hours notice: Full refund, free reschedule
      return {
        penaltyApplied: false,
        refundEligible: true,
        rescheduleAllowed: true,
        refundPercentage: 1.0,
      };
    } else if (hoursNotice >= 4) {
      // 4-24 hours notice: 80% refund, free reschedule
      return {
        penaltyApplied: false,
        refundEligible: true,
        rescheduleAllowed: true,
        refundPercentage: 0.8,
      };
    } else if (hoursNotice >= 2) {
      // 2-4 hours notice: 50% refund, reschedule with fee
      return {
        penaltyApplied: true,
        refundEligible: true,
        rescheduleAllowed: true,
        penaltyAmount: 50000, // 50,000 VNĐ
        refundPercentage: 0.5,
      };
    } else {
      // Less than 2 hours notice: No refund, penalty applies
      return {
        penaltyApplied: true,
        refundEligible: false,
        rescheduleAllowed: false,
        penaltyAmount: 100000, // 100,000 VNĐ
      };
    }
  }

  /**
   * Get patient notification channels based on notice time
   */
  private static getPatientNotificationChannels(
    hoursNotice: number,
  ): ("sms" | "email" | "push")[] {
    if (hoursNotice < 2) {
      // Last minute cancellation - use all channels
      return ["sms", "push", "email"];
    } else {
      // Normal cancellation
      return ["email", "push"];
    }
  }

  /**
   * Get Vietnamese policy description
   */
  private static getPolicyDescription(
    policy: {
      penaltyApplied: boolean;
      refundEligible: boolean;
      rescheduleAllowed: boolean;
      penaltyAmount?: number;
      refundPercentage?: number;
    },
    hoursNotice: number,
  ): string {
    if (hoursNotice >= 24) {
      return "Hủy lịch miễn phí, hoàn tiền 100%";
    } else if (hoursNotice >= 4) {
      return "Hoàn tiền 80%, đặt lịch mới miễn phí";
    } else if (hoursNotice >= 2) {
      return "Hoàn tiền 50%, phí đặt lịch mới 50,000 VNĐ";
    } else {
      return "Không hoàn tiền, phí hủy lịch 100,000 VNĐ";
    }
  }

  /**
   * Get integration events for specific service
   */
  public getIntegrationEventsForService(serviceName: string): any {
    const eventData = this.getEventData();
    switch (serviceName.toLowerCase()) {
      case "provider-staff":
      case "provider":
        return eventData.integrationEvents.providerScheduleUpdate;

      case "patient-registry":
      case "patient":
        return eventData.integrationEvents.patientAppointmentHistory;

      case "notification":
      case "notifications":
        return eventData.integrationEvents.notificationRequests;

      case "billing":
        return eventData.integrationEvents.billingUpdate;

      case "clinical":
      case "emr":
        return eventData.integrationEvents.clinicalUpdate;

      default:
        return null;
    }
  }

  /**
   * Helper methods to get integration event parts
   */
  private getProviderScheduleUpdate() {
    const now = new Date();
    return {
      doctorId: this.doctorId, // Changed from providerId to doctorId
      timeSlotId: `${this.doctorId}-${this.originalStartTime.getTime()}`,
      startTime: this.originalStartTime,
      endTime:
        this.originalEndTime ||
        new Date(this.originalStartTime.getTime() + 30 * 60 * 1000),
      status: "available" as const,
      releasedAppointmentId: this.appointmentId,
      releasedAt: now,
    };
  }

  private getPatientAppointmentHistory() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    return {
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      status: "cancelled" as const,
      cancellationReason: this.cancellationReason,
      cancelledAt: now,
      penaltyApplied: cancellationPolicy.penaltyApplied,
    };
  }

  private getNotificationRequests() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    return {
      patientNotification: {
        patientId: this.patientId,
        type: "appointment_cancelled" as const,
        channels:
          AppointmentCancelledEvent.getPatientNotificationChannels(hoursNotice),
        templateData: {
          appointmentId: this.appointmentId,
          originalDate: this.originalStartTime.toLocaleDateString("vi-VN"),
          originalTime: this.originalStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cancellationReason: this.cancellationReason,
          penaltyInfo: cancellationPolicy.penaltyApplied
            ? `Phí hủy lịch: ${cancellationPolicy.penaltyAmount?.toLocaleString("vi-VN")} VNĐ`
            : undefined,
          rescheduleInfo: cancellationPolicy.rescheduleAllowed
            ? "Bạn có thể đặt lịch mới miễn phí"
            : "Vui lòng liên hệ để đặt lịch mới",
        },
        priority: hoursNotice < 2 ? ("high" as const) : ("normal" as const),
      },
      providerNotification: {
        doctorId: this.doctorId, // Changed from providerId to doctorId
        type: "appointment_cancelled" as const,
        channels: ["email", "push"] as ("email" | "push")[],
        templateData: {
          appointmentId: this.appointmentId,
          patientName: "Bệnh nhân",
          originalDate: this.originalStartTime.toLocaleDateString("vi-VN"),
          originalTime: this.originalStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cancellationReason: this.cancellationReason,
          hoursNotice: Math.round(hoursNotice * 100) / 100,
        },
        priority: "normal" as const,
      },
    };
  }

  private getBillingUpdate() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    if (
      !cancellationPolicy.penaltyApplied &&
      !cancellationPolicy.refundEligible
    ) {
      return undefined;
    }

    return {
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      action: cancellationPolicy.penaltyApplied
        ? ("penalty" as const)
        : cancellationPolicy.refundEligible
          ? ("refund" as const)
          : ("no_action" as const),
      amount: cancellationPolicy.penaltyApplied
        ? cancellationPolicy.penaltyAmount
        : cancellationPolicy.refundEligible
          ? (cancellationPolicy.refundPercentage || 0) * 100000
          : undefined,
      reason: this.cancellationReason,
      processedAt: now,
    };
  }

  private getClinicalUpdate() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    return {
      patientId: this.patientId,
      doctorId: this.doctorId, // Changed from providerId to doctorId
      appointmentId: this.appointmentId,
      updateMedicalRecord: true,
      cancellationNote: `Cuộc hẹn bị hủy: ${this.cancellationReason}. Thời gian thông báo: ${Math.round(hoursNotice * 100) / 100} giờ.`,
    };
  }

  /**
   * Override getRoutingKey to determine routing key based on cancellation policy
   * - Early cancellation (refund eligible) → 'appointment.cancelled'
   * - Late cancellation (penalty applied) → 'appointment.cancelled_late'
   */
  public override getRoutingKey(): string {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const cancellationPolicy =
      AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);

    // If refund eligible (early cancellation), use 'appointment.cancelled' for refund processing
    if (cancellationPolicy.refundEligible) {
      return "appointment.cancelled";
    }

    // If penalty applied (late cancellation), use 'appointment.cancelled_late' for fee processing
    if (cancellationPolicy.penaltyApplied) {
      return "appointment.cancelled_late";
    }

    // Default: no refund, no penalty (edge case)
    return "appointment.cancelled";
  }
}
