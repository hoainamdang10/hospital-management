/**
 * Appointment Rescheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment rescheduling event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { DomainEvent } from "@shared/domain/base/domain-event";

export interface AppointmentRescheduledEventData {
  appointmentId: string;
  patientId: string;
  doctorId: string; // Changed from providerId to doctorId for consistency
  originalStartTime: Date;
  originalEndTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  rescheduleReason: string;
  rescheduledBy: string;
  rescheduledAt: Date;

  // Vietnamese healthcare reschedule policy
  hoursNotice: number;
  reschedulePolicy: {
    feeApplied: boolean;
    freeRescheduleUsed: boolean;
    remainingFreeReschedules: number;
    rescheduleAmount?: number;
  };

  // Integration events for other services
  integrationEvents: {
    // Provider Staff Service - update time slots
    providerScheduleUpdate: {
      doctorId: string; // Changed from providerId to doctorId
      releaseTimeSlot: {
        timeSlotId: string;
        startTime: Date;
        endTime: Date;
        status: "available";
      };
      bookTimeSlot: {
        timeSlotId: string;
        startTime: Date;
        endTime: Date;
        status: "booked";
        appointmentId: string;
      };
      updatedAt: Date;
    };

    // Patient Registry Service - update appointment history
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      status: "rescheduled";
      originalDate: Date;
      newDate: Date;
      rescheduleReason: string;
      rescheduledAt: Date;
      feeApplied: boolean;
    };

    // Notification Service - send reschedule notifications
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: "appointment_rescheduled";
        channels: ("sms" | "email" | "push")[];
        templateData: {
          appointmentId: string;
          originalDate: string;
          originalTime: string;
          newDate: string;
          newTime: string;
          rescheduleReason: string;
          feeInfo?: string;
          preparationInstructions?: string;
        };
        priority: "normal" | "high";
      };

      providerNotification: {
        doctorId: string;
        type: "appointment_rescheduled";
        channels: ("email" | "push")[];
        templateData: {
          appointmentId: string;
          patientName: string;
          originalDate: string;
          originalTime: string;
          newDate: string;
          newTime: string;
          rescheduleReason: string;
          hoursNotice: number;
        };
        priority: "normal";
      };

      // New reminder notifications for rescheduled appointment
      reminderNotifications: {
        patientId: string;
        appointmentId: string;
        reminders: {
          type: "24h" | "2h" | "30min";
          scheduledFor: Date;
          channels: ("sms" | "email" | "push")[];
        }[];
      };
    };

    // Billing Service - handle reschedule fees
    billingUpdate?: {
      patientId: string;
      patientRecordId?: string;
      appointmentId: string;
      action: "reschedule_fee" | "no_charge";
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
      rescheduleNote: string;
      newAppointmentTime: Date;
    };
  };
}

/**
 * Appointment Rescheduled Domain Event
 * Triggered when an appointment is rescheduled to a new time
 */
export class AppointmentRescheduledEvent extends DomainEvent {
  private patientRecordId?: string;

  constructor(
    public readonly appointmentId: string,
    public readonly patientId: string,
    public readonly doctorId: string, // Changed from providerId to doctorId
    public readonly originalStartTime: Date,
    public readonly originalEndTime: Date,
    public readonly newStartTime: Date,
    public readonly newEndTime: Date,
    public readonly rescheduleReason: string,
    public readonly rescheduledBy: string,
    correlationId?: string,
    causationId?: string,
    userId?: string,
  ) {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const reschedulePolicy =
      AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);

    const eventData: AppointmentRescheduledEventData = {
      appointmentId,
      patientId,
      doctorId, // Changed from providerId to doctorId
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
          doctorId, // Changed from providerId to doctorId
          releaseTimeSlot: {
            timeSlotId: `${doctorId}-${originalStartTime.getTime()}`,
            startTime: originalStartTime,
            endTime: originalEndTime,
            status: "available",
          },
          bookTimeSlot: {
            timeSlotId: `${doctorId}-${newStartTime.getTime()}`,
            startTime: newStartTime,
            endTime: newEndTime,
            status: "booked",
            appointmentId,
          },
          updatedAt: now,
        },

        patientAppointmentHistory: {
          patientId,
          appointmentId,
          status: "rescheduled",
          originalDate: originalStartTime,
          newDate: newStartTime,
          rescheduleReason,
          rescheduledAt: now,
          feeApplied: reschedulePolicy.feeApplied,
        },

        notificationRequests: {
          patientNotification: {
            patientId,
            type: "appointment_rescheduled",
            channels:
              AppointmentRescheduledEvent.getPatientNotificationChannels(
                hoursNotice,
              ),
            templateData: {
              appointmentId,
              originalDate: originalStartTime.toLocaleDateString("vi-VN"),
              originalTime: originalStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              newDate: newStartTime.toLocaleDateString("vi-VN"),
              newTime: newStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              rescheduleReason,
              feeInfo: reschedulePolicy.feeApplied
                ? `Phí đổi lịch: ${reschedulePolicy.rescheduleAmount?.toLocaleString("vi-VN")} VNĐ`
                : "Đổi lịch miễn phí",
              preparationInstructions: "Vui lòng có mặt đúng giờ hẹn mới",
            },
            priority: hoursNotice < 4 ? "high" : "normal",
          },

          providerNotification: {
            doctorId, // Changed from providerId to doctorId
            type: "appointment_rescheduled",
            channels: ["email", "push"],
            templateData: {
              appointmentId,
              patientName: "Bệnh nhân", // Would be populated by handler
              originalDate: originalStartTime.toLocaleDateString("vi-VN"),
              originalTime: originalStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              newDate: newStartTime.toLocaleDateString("vi-VN"),
              newTime: newStartTime.toLocaleTimeString("vi-VN", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              rescheduleReason,
              hoursNotice: Math.round(hoursNotice * 100) / 100,
            },
            priority: "normal",
          },

          reminderNotifications: {
            patientId,
            appointmentId,
            reminders:
              AppointmentRescheduledEvent.generateReminderSchedule(
                newStartTime,
              ),
          },
        },

        billingUpdate: reschedulePolicy.feeApplied
          ? {
              patientId,
              appointmentId,
              action: "reschedule_fee",
              amount: reschedulePolicy.rescheduleAmount,
              reason: rescheduleReason,
              processedAt: now,
            }
          : {
              patientId,
              appointmentId,
              action: "no_charge",
              reason: "Free reschedule within policy",
              processedAt: now,
            },

        clinicalUpdate: {
          patientId,
          doctorId, // Changed from providerId to doctorId
          appointmentId,
          updateMedicalRecord: true,
          rescheduleNote: `Cuộc hẹn được đổi lịch: ${rescheduleReason}. Từ ${originalStartTime.toLocaleString("vi-VN")} sang ${newStartTime.toLocaleString("vi-VN")}.`,
          newAppointmentTime: newStartTime,
        },
      },
    };

    super(
      "AppointmentRescheduled",
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
  public getEventData(): AppointmentRescheduledEventData {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const reschedulePolicy =
      AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);

    return {
      appointmentId: this.appointmentId,
      patientId: this.patientId,
      doctorId: this.doctorId, // Changed from providerId to doctorId
      originalStartTime: this.originalStartTime,
      originalEndTime: this.originalEndTime,
      newStartTime: this.newStartTime,
      newEndTime: this.newEndTime,
      rescheduleReason: this.rescheduleReason,
      rescheduledBy: this.rescheduledBy,
      rescheduledAt: this.occurredAt,
      hoursNotice: Math.round(hoursNotice * 100) / 100,
      reschedulePolicy,
      integrationEvents: {
        providerScheduleUpdate: this.getProviderScheduleUpdate(),
        patientAppointmentHistory: this.getPatientAppointmentHistory(),
        notificationRequests: this.getNotificationRequests(),
        billingUpdate: this.getBillingUpdate(),
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
   * Calculate Vietnamese healthcare reschedule policy
   */
  private static calculateReschedulePolicy(hoursNotice: number): {
    feeApplied: boolean;
    freeRescheduleUsed: boolean;
    remainingFreeReschedules: number;
    rescheduleAmount?: number;
  } {
    // Vietnamese healthcare reschedule policy
    // Note: In real implementation, remainingFreeReschedules would come from patient history
    const remainingFreeReschedules = 1; // Assume 1 free reschedule remaining

    if (hoursNotice >= 24 && remainingFreeReschedules > 0) {
      // 24+ hours notice with free reschedules available
      return {
        feeApplied: false,
        freeRescheduleUsed: true,
        remainingFreeReschedules: remainingFreeReschedules - 1,
      };
    } else if (hoursNotice >= 4) {
      // 4-24 hours notice or no free reschedules: Small fee
      return {
        feeApplied: true,
        freeRescheduleUsed: false,
        remainingFreeReschedules,
        rescheduleAmount: 30000, // 30,000 VNĐ
      };
    } else {
      // Less than 4 hours notice: Higher fee
      return {
        feeApplied: true,
        freeRescheduleUsed: false,
        remainingFreeReschedules,
        rescheduleAmount: 50000, // 50,000 VNĐ
      };
    }
  }

  /**
   * Get patient notification channels based on notice time
   */
  private static getPatientNotificationChannels(
    hoursNotice: number,
  ): ("sms" | "email" | "push")[] {
    if (hoursNotice < 4) {
      // Last minute reschedule - use immediate channels
      return ["sms", "push"];
    } else {
      // Normal reschedule
      return ["email", "push"];
    }
  }

  /**
   * Generate reminder schedule for new appointment time
   */
  private static generateReminderSchedule(newAppointmentTime: Date): {
    type: "24h" | "2h" | "30min";
    scheduledFor: Date;
    channels: ("sms" | "email" | "push")[];
  }[] {
    const reminders = [];

    // 24 hours before new appointment
    const reminder24h = new Date(
      newAppointmentTime.getTime() - 24 * 60 * 60 * 1000,
    );
    if (reminder24h > new Date()) {
      reminders.push({
        type: "24h" as const,
        scheduledFor: reminder24h,
        channels: ["email", "push"] as ("sms" | "email" | "push")[],
      });
    }

    // 2 hours before new appointment
    const reminder2h = new Date(
      newAppointmentTime.getTime() - 2 * 60 * 60 * 1000,
    );
    if (reminder2h > new Date()) {
      reminders.push({
        type: "2h" as const,
        scheduledFor: reminder2h,
        channels: ["push"] as ("sms" | "email" | "push")[],
      });
    }

    return reminders;
  }

  /**
   * Get Vietnamese policy description
   */
  private static getPolicyDescription(
    policy: {
      feeApplied: boolean;
      freeRescheduleUsed: boolean;
      remainingFreeReschedules: number;
      rescheduleAmount?: number;
    },
    hoursNotice: number,
  ): string {
    if (!policy.feeApplied && policy.freeRescheduleUsed) {
      return `Đổi lịch miễn phí (còn ${policy.remainingFreeReschedules} lần miễn phí)`;
    } else if (policy.feeApplied && hoursNotice >= 4) {
      return `Phí đổi lịch: ${policy.rescheduleAmount?.toLocaleString("vi-VN")} VNĐ`;
    } else {
      return `Phí đổi lịch gấp: ${policy.rescheduleAmount?.toLocaleString("vi-VN")} VNĐ`;
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
      releaseTimeSlot: {
        timeSlotId: `${this.doctorId}-${this.originalStartTime.getTime()}`,
        startTime: this.originalStartTime,
        endTime: this.originalEndTime,
        status: "available" as const,
      },
      bookTimeSlot: {
        timeSlotId: `${this.doctorId}-${this.newStartTime.getTime()}`,
        startTime: this.newStartTime,
        endTime: this.newEndTime,
        status: "booked" as const,
        appointmentId: this.appointmentId,
      },
      updatedAt: now,
    };
  }

  private getPatientAppointmentHistory() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const reschedulePolicy =
      AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);

    return {
      patientId: this.patientId,
      appointmentId: this.appointmentId,
      status: "rescheduled" as const,
      originalDate: this.originalStartTime,
      newDate: this.newStartTime,
      rescheduleReason: this.rescheduleReason,
      rescheduledAt: now,
      feeApplied: reschedulePolicy.feeApplied,
    };
  }

  private getNotificationRequests() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const reschedulePolicy =
      AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);

    return {
      patientNotification: {
        patientId: this.patientId,
        type: "appointment_rescheduled" as const,
        channels:
          AppointmentRescheduledEvent.getPatientNotificationChannels(
            hoursNotice,
          ),
        templateData: {
          appointmentId: this.appointmentId,
          originalDate: this.originalStartTime.toLocaleDateString("vi-VN"),
          originalTime: this.originalStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          newDate: this.newStartTime.toLocaleDateString("vi-VN"),
          newTime: this.newStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          rescheduleReason: this.rescheduleReason,
          feeInfo: reschedulePolicy.feeApplied
            ? `Phí đổi lịch: ${reschedulePolicy.rescheduleAmount?.toLocaleString("vi-VN")} VNĐ`
            : undefined,
        },
        priority: hoursNotice < 4 ? ("high" as const) : ("normal" as const),
      },
      providerNotification: {
        doctorId: this.doctorId, // Changed from providerId to doctorId
        type: "appointment_rescheduled" as const,
        channels: ["email", "push"] as ("email" | "push")[],
        templateData: {
          appointmentId: this.appointmentId,
          patientName: "Bệnh nhân",
          originalDate: this.originalStartTime.toLocaleDateString("vi-VN"),
          originalTime: this.originalStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          newDate: this.newStartTime.toLocaleDateString("vi-VN"),
          newTime: this.newStartTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          rescheduleReason: this.rescheduleReason,
          hoursNotice: Math.round(hoursNotice * 100) / 100,
        },
        priority: "normal" as const,
      },
      reminderNotifications: {
        patientId: this.patientId,
        appointmentId: this.appointmentId,
        reminders: AppointmentRescheduledEvent.generateReminderSchedule(
          this.newStartTime,
        ),
      },
    };
  }

  private getBillingUpdate() {
    const now = new Date();
    const hoursNotice = Math.max(
      0,
      (this.originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60),
    );
    const reschedulePolicy =
      AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice);

    if (!reschedulePolicy.feeApplied) {
      return undefined;
    }

    return {
      patientId: this.patientId,
      patientRecordId: this.patientRecordId,
      appointmentId: this.appointmentId,
      action: "reschedule_fee" as const,
      amount: reschedulePolicy.rescheduleAmount,
      reason: this.rescheduleReason,
      processedAt: now,
      newAppointmentDate: this.newStartTime,
      newAppointmentTime: this.newStartTime,
    };
  }
  /**
   * Attach patient record UUID for downstream billing service
   */
  public attachPatientRecordId(patientRecordId: string): this {
    this.patientRecordId = patientRecordId;
    return this;
  }
}
