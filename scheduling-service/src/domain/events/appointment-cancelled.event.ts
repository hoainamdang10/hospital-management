/**
 * Appointment Cancelled Event - Domain Layer
 * Domain event for appointment cancellation with inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Healthcare Integration
 */

import { DomainEvent } from '../../../shared/domain/events/domain-event';

export interface AppointmentCancelledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  originalStartTime: Date;
  originalEndTime: Date;
  cancellationReason: string;
  cancelledBy: string;
  cancelledAt: Date;
  cancellationPolicy: {
    hoursNotice: number;
    penaltyApplied: boolean;
    refundEligible: boolean;
    rescheduleAllowed: boolean;
  };
  
  // Integration data for other services
  integrationEvents: {
    // For Provider/Staff Service
    providerScheduleUpdate: {
      providerId: string;
      timeSlotReleased: {
        startTime: Date;
        endTime: Date;
        appointmentId: string;
        makeAvailable: boolean;
      };
    };
    
    // For Patient Registry Service
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      cancellationDate: Date;
      cancellationReason: string;
      penaltyApplied: boolean;
    };
    
    // For Notification Service
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: 'appointment_cancelled';
        originalTime: Date;
        cancellationReason: string;
        rescheduleOptions: boolean;
        refundInfo: boolean;
      };
      providerNotification: {
        providerId: string;
        type: 'appointment_cancelled';
        originalTime: Date;
        patientName: string;
        cancellationReason: string;
        timeSlotAvailable: boolean;
      };
      reminderCancellation: {
        appointmentId: string;
        cancelScheduledReminders: boolean;
      };
    };
    
    // For Billing Service (if exists)
    billingUpdate?: {
      appointmentId: string;
      patientId: string;
      cancellationFee: number;
      refundAmount: number;
      refundEligible: boolean;
      processingRequired: boolean;
    };
    
    // For Clinical/EMR Service (if exists)
    clinicalUpdate?: {
      patientId: string;
      providerId: string;
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
export class AppointmentCancelledEvent extends DomainEvent<AppointmentCancelledEventData> {
  
  constructor(
    appointmentId: string,
    patientId: string,
    providerId: string,
    originalStartTime: Date,
    cancellationReason: string,
    cancelledBy: string,
    originalEndTime?: Date
  ) {
    const now = new Date();
    const hoursNotice = Math.max(0, (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    const cancellationPolicy = AppointmentCancelledEvent.calculateCancellationPolicy(hoursNotice);
    
    const eventData: AppointmentCancelledEventData = {
      appointmentId,
      patientId,
      providerId,
      originalStartTime,
      originalEndTime: originalEndTime || new Date(originalStartTime.getTime() + (30 * 60 * 1000)), // Default 30 min
      cancellationReason,
      cancelledBy,
      cancelledAt: now,
      cancellationPolicy,
      
      integrationEvents: {
        providerScheduleUpdate: {
          providerId,
          timeSlotReleased: {
            startTime: originalStartTime,
            endTime: originalEndTime || new Date(originalStartTime.getTime() + (30 * 60 * 1000)),
            appointmentId,
            makeAvailable: true
          }
        },
        
        patientAppointmentHistory: {
          patientId,
          appointmentId,
          cancellationDate: now,
          cancellationReason,
          penaltyApplied: cancellationPolicy.penaltyApplied
        },
        
        notificationRequests: {
          patientNotification: {
            patientId,
            type: 'appointment_cancelled',
            originalTime: originalStartTime,
            cancellationReason,
            rescheduleOptions: cancellationPolicy.rescheduleAllowed,
            refundInfo: cancellationPolicy.refundEligible
          },
          
          providerNotification: {
            providerId,
            type: 'appointment_cancelled',
            originalTime: originalStartTime,
            patientName: '', // Would be populated by handler
            cancellationReason,
            timeSlotAvailable: true
          },
          
          reminderCancellation: {
            appointmentId,
            cancelScheduledReminders: true
          }
        },
        
        ...(AppointmentCancelledEvent.needsBillingUpdate(cancellationPolicy) && {
          billingUpdate: {
            appointmentId,
            patientId,
            cancellationFee: AppointmentCancelledEvent.calculateCancellationFee(hoursNotice),
            refundAmount: cancellationPolicy.refundEligible ? 100 : 0, // Percentage
            refundEligible: cancellationPolicy.refundEligible,
            processingRequired: true
          }
        }),
        
        ...(AppointmentCancelledEvent.needsClinicalUpdate(cancellationReason) && {
          clinicalUpdate: {
            patientId,
            providerId,
            appointmentId,
            updateMedicalRecord: true,
            cancellationNote: `Cuộc hẹn bị hủy: ${cancellationReason}`
          }
        })
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
          policyDescriptionVi: AppointmentCancelledEvent.getPolicyDescriptionVietnamese(cancellationPolicy)
        }
      }
    });
  }

  /**
   * Get cancellation reason in Vietnamese
   */
  public getCancellationReasonVietnamese(): string {
    return this.data.cancellationReason;
  }

  /**
   * Check if cancellation has penalty
   */
  public hasPenalty(): boolean {
    return this.data.cancellationPolicy.penaltyApplied;
  }

  /**
   * Check if refund is eligible
   */
  public isRefundEligible(): boolean {
    return this.data.cancellationPolicy.refundEligible;
  }

  /**
   * Check if reschedule is allowed
   */
  public isRescheduleAllowed(): boolean {
    return this.data.cancellationPolicy.rescheduleAllowed;
  }

  /**
   * Get hours notice given
   */
  public getHoursNotice(): number {
    return this.data.cancellationPolicy.hoursNotice;
  }

  /**
   * Check if it's a last-minute cancellation
   */
  public isLastMinuteCancellation(): boolean {
    return this.data.cancellationPolicy.hoursNotice < 2;
  }

  /**
   * Check if it's an emergency cancellation
   */
  public isEmergencyCancellation(): boolean {
    const reason = this.data.cancellationReason.toLowerCase();
    return reason.includes('emergency') || 
           reason.includes('cấp cứu') ||
           reason.includes('khẩn cấp') ||
           reason.includes('bệnh nặng');
  }

  /**
   * Get integration events for specific service
   */
  public getIntegrationEventsForService(serviceName: string): any {
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

  /**
   * Get notification message for patient
   */
  public getPatientNotificationMessage(): string {
    const timeStr = this.data.originalStartTime.toLocaleString('vi-VN');
    let message = `Cuộc hẹn của bạn vào ${timeStr} đã được hủy. Lý do: ${this.data.cancellationReason}.`;
    
    if (this.isRefundEligible()) {
      message += ' Bạn sẽ được hoàn tiền đầy đủ.';
    } else if (this.hasPenalty()) {
      message += ' Phí hủy lịch sẽ được áp dụng do hủy muộn.';
    }
    
    if (this.isRescheduleAllowed()) {
      message += ' Bạn có thể đặt lịch hẹn mới.';
    }
    
    return message;
  }

  /**
   * Get notification message for provider
   */
  public getProviderNotificationMessage(): string {
    const timeStr = this.data.originalStartTime.toLocaleString('vi-VN');
    let message = `Cuộc hẹn vào ${timeStr} đã được hủy. Lý do: ${this.data.cancellationReason}.`;
    
    message += ' Thời gian này hiện đã có sẵn cho cuộc hẹn khác.';
    
    if (this.isEmergencyCancellation()) {
      message += ' Đây là hủy lịch khẩn cấp.';
    }
    
    return message;
  }

  /**
   * Get policy description in Vietnamese
   */
  public getPolicyDescriptionVietnamese(): string {
    return AppointmentCancelledEvent.getPolicyDescriptionVietnamese(this.data.cancellationPolicy);
  }

  /**
   * Static helper methods
   */

  private static calculateCancellationPolicy(hoursNotice: number): any {
    // Vietnamese healthcare cancellation policy
    if (hoursNotice >= 24) {
      return {
        hoursNotice,
        penaltyApplied: false,
        refundEligible: true,
        rescheduleAllowed: true
      };
    } else if (hoursNotice >= 2) {
      return {
        hoursNotice,
        penaltyApplied: true,
        refundEligible: false,
        rescheduleAllowed: true
      };
    } else {
      return {
        hoursNotice,
        penaltyApplied: true,
        refundEligible: false,
        rescheduleAllowed: false
      };
    }
  }

  private static calculateCancellationFee(hoursNotice: number): number {
    // Cancellation fee based on notice period
    if (hoursNotice >= 24) {
      return 0; // No fee
    } else if (hoursNotice >= 2) {
      return 50000; // 50,000 VND
    } else {
      return 100000; // 100,000 VND
    }
  }

  private static needsBillingUpdate(cancellationPolicy: any): boolean {
    return cancellationPolicy.penaltyApplied || cancellationPolicy.refundEligible;
  }

  private static needsClinicalUpdate(cancellationReason: string): boolean {
    const medicalReasons = [
      'bệnh nặng',
      'cấp cứu',
      'khẩn cấp',
      'sức khỏe',
      'medical',
      'emergency',
      'health'
    ];
    
    const reason = cancellationReason.toLowerCase();
    return medicalReasons.some(keyword => reason.includes(keyword));
  }

  private static getPolicyDescriptionVietnamese(policy: any): string {
    if (policy.hoursNotice >= 24) {
      return 'Hủy lịch trước 24 giờ: Không phí, được hoàn tiền đầy đủ, có thể đặt lịch mới';
    } else if (policy.hoursNotice >= 2) {
      return 'Hủy lịch trước 2 giờ: Có phí hủy, không hoàn tiền, có thể đặt lịch mới';
    } else {
      return 'Hủy lịch muộn (dưới 2 giờ): Có phí hủy cao, không hoàn tiền, không thể đặt lịch mới ngay';
    }
  }
}
