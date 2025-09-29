/**
 * Appointment Rescheduled Event - Domain Layer
 * Domain event for appointment rescheduling with inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Healthcare Integration
 */

import { DomainEvent } from '../../../shared/domain/events/domain-event';

export interface AppointmentRescheduledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  originalStartTime: Date;
  originalEndTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  rescheduleReason: string;
  rescheduledBy: string;
  rescheduledAt: Date;
  reschedulePolicy: {
    hoursNotice: number;
    feeApplied: boolean;
    freeRescheduleUsed: boolean;
    remainingFreeReschedules: number;
  };
  
  // Integration data for other services
  integrationEvents: {
    // For Provider/Staff Service
    providerScheduleUpdate: {
      providerId: string;
      timeSlotChanges: {
        releasedSlot: {
          startTime: Date;
          endTime: Date;
          appointmentId: string;
          makeAvailable: boolean;
        };
        bookedSlot: {
          startTime: Date;
          endTime: Date;
          appointmentId: string;
        };
      };
    };
    
    // For Patient Registry Service
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      rescheduleDate: Date;
      rescheduleReason: string;
      originalTime: Date;
      newTime: Date;
      feeApplied: boolean;
    };
    
    // For Notification Service
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: 'appointment_rescheduled';
        originalTime: Date;
        newTime: Date;
        rescheduleReason: string;
        feeInfo: boolean;
        newPreparationRequired: boolean;
      };
      providerNotification: {
        providerId: string;
        type: 'appointment_rescheduled';
        originalTime: Date;
        newTime: Date;
        patientName: string;
        rescheduleReason: string;
      };
      reminderUpdate: {
        appointmentId: string;
        cancelOldReminders: boolean;
        scheduleNewReminders: Date[]; // New reminder times
      };
    };
    
    // For Billing Service (if exists)
    billingUpdate?: {
      appointmentId: string;
      patientId: string;
      rescheduleeFee: number;
      feeApplied: boolean;
      processingRequired: boolean;
    };
    
    // For Clinical/EMR Service (if exists)
    clinicalUpdate?: {
      patientId: string;
      providerId: string;
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
export class AppointmentRescheduledEvent extends DomainEvent<AppointmentRescheduledEventData> {
  
  constructor(
    appointmentId: string,
    patientId: string,
    providerId: string,
    originalStartTime: Date,
    originalEndTime: Date,
    newStartTime: Date,
    newEndTime: Date,
    rescheduleReason: string,
    rescheduledBy: string
  ) {
    const now = new Date();
    const hoursNotice = Math.max(0, (originalStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    const reschedulePolicy = AppointmentRescheduledEvent.calculateReschedulePolicy(hoursNotice, patientId);
    
    const eventData: AppointmentRescheduledEventData = {
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
      reschedulePolicy,
      
      integrationEvents: {
        providerScheduleUpdate: {
          providerId,
          timeSlotChanges: {
            releasedSlot: {
              startTime: originalStartTime,
              endTime: originalEndTime,
              appointmentId,
              makeAvailable: true
            },
            bookedSlot: {
              startTime: newStartTime,
              endTime: newEndTime,
              appointmentId
            }
          }
        },
        
        patientAppointmentHistory: {
          patientId,
          appointmentId,
          rescheduleDate: now,
          rescheduleReason,
          originalTime: originalStartTime,
          newTime: newStartTime,
          feeApplied: reschedulePolicy.feeApplied
        },
        
        notificationRequests: {
          patientNotification: {
            patientId,
            type: 'appointment_rescheduled',
            originalTime: originalStartTime,
            newTime: newStartTime,
            rescheduleReason,
            feeInfo: reschedulePolicy.feeApplied,
            newPreparationRequired: AppointmentRescheduledEvent.requiresPreparation(newStartTime)
          },
          
          providerNotification: {
            providerId,
            type: 'appointment_rescheduled',
            originalTime: originalStartTime,
            newTime: newStartTime,
            patientName: '', // Would be populated by handler
            rescheduleReason
          },
          
          reminderUpdate: {
            appointmentId,
            cancelOldReminders: true,
            scheduleNewReminders: AppointmentRescheduledEvent.calculateReminderTimes(newStartTime)
          }
        },
        
        ...(reschedulePolicy.feeApplied && {
          billingUpdate: {
            appointmentId,
            patientId,
            rescheduleeFee: AppointmentRescheduledEvent.calculateRescheduleFee(hoursNotice),
            feeApplied: true,
            processingRequired: true
          }
        }),
        
        ...(AppointmentRescheduledEvent.needsClinicalUpdate(rescheduleReason) && {
          clinicalUpdate: {
            patientId,
            providerId,
            appointmentId,
            updateMedicalRecord: true,
            rescheduleNote: `Cuộc hẹn được đổi lịch: ${rescheduleReason}`,
            newAppointmentTime: newStartTime
          }
        })
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
        isLastMinuteReschedule: hoursNotice < 2,
        isEmergencyReschedule: rescheduleReason.toLowerCase().includes('emergency') || 
                              rescheduleReason.toLowerCase().includes('cấp cứu'),
        timeChange: {
          originalTimeVi: originalStartTime.toLocaleString('vi-VN'),
          newTimeVi: newStartTime.toLocaleString('vi-VN'),
          timeDifferenceHours: Math.abs(newStartTime.getTime() - originalStartTime.getTime()) / (1000 * 60 * 60)
        },
        vietnameseMetadata: {
          rescheduleReasonVi: rescheduleReason,
          policyDescriptionVi: AppointmentRescheduledEvent.getPolicyDescriptionVietnamese(reschedulePolicy)
        }
      }
    });
  }

  /**
   * Get reschedule reason in Vietnamese
   */
  public getRescheduleReasonVietnamese(): string {
    return this.data.rescheduleReason;
  }

  /**
   * Check if reschedule has fee
   */
  public hasFee(): boolean {
    return this.data.reschedulePolicy.feeApplied;
  }

  /**
   * Check if free reschedule was used
   */
  public usedFreeReschedule(): boolean {
    return this.data.reschedulePolicy.freeRescheduleUsed;
  }

  /**
   * Get remaining free reschedules
   */
  public getRemainingFreeReschedules(): number {
    return this.data.reschedulePolicy.remainingFreeReschedules;
  }

  /**
   * Get hours notice given
   */
  public getHoursNotice(): number {
    return this.data.reschedulePolicy.hoursNotice;
  }

  /**
   * Check if it's a last-minute reschedule
   */
  public isLastMinuteReschedule(): boolean {
    return this.data.reschedulePolicy.hoursNotice < 2;
  }

  /**
   * Check if it's an emergency reschedule
   */
  public isEmergencyReschedule(): boolean {
    const reason = this.data.rescheduleReason.toLowerCase();
    return reason.includes('emergency') || 
           reason.includes('cấp cứu') ||
           reason.includes('khẩn cấp') ||
           reason.includes('bệnh nặng');
  }

  /**
   * Get time difference in hours
   */
  public getTimeDifferenceHours(): number {
    return Math.abs(this.data.newStartTime.getTime() - this.data.originalStartTime.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Check if appointment was moved earlier
   */
  public isMovedEarlier(): boolean {
    return this.data.newStartTime < this.data.originalStartTime;
  }

  /**
   * Check if appointment was moved later
   */
  public isMovedLater(): boolean {
    return this.data.newStartTime > this.data.originalStartTime;
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
    const originalTimeStr = this.data.originalStartTime.toLocaleString('vi-VN');
    const newTimeStr = this.data.newStartTime.toLocaleString('vi-VN');
    
    let message = `Cuộc hẹn của bạn đã được đổi từ ${originalTimeStr} sang ${newTimeStr}. Lý do: ${this.data.rescheduleReason}.`;
    
    if (this.hasFee()) {
      message += ` Phí đổi lịch sẽ được áp dụng.`;
    } else if (this.usedFreeReschedule()) {
      message += ` Bạn đã sử dụng 1 lần đổi lịch miễn phí. Còn lại ${this.getRemainingFreeReschedules()} lần.`;
    }
    
    if (this.isMovedEarlier()) {
      message += ' Vui lòng đến sớm hơn so với dự định ban đầu.';
    }
    
    return message;
  }

  /**
   * Get notification message for provider
   */
  public getProviderNotificationMessage(): string {
    const originalTimeStr = this.data.originalStartTime.toLocaleString('vi-VN');
    const newTimeStr = this.data.newStartTime.toLocaleString('vi-VN');
    
    let message = `Cuộc hẹn đã được đổi từ ${originalTimeStr} sang ${newTimeStr}. Lý do: ${this.data.rescheduleReason}.`;
    
    if (this.isEmergencyReschedule()) {
      message += ' Đây là đổi lịch khẩn cấp.';
    }
    
    const timeDiff = this.getTimeDifferenceHours();
    if (timeDiff > 24) {
      message += ` Thời gian thay đổi ${Math.round(timeDiff)} giờ.`;
    }
    
    return message;
  }

  /**
   * Get policy description in Vietnamese
   */
  public getPolicyDescriptionVietnamese(): string {
    return AppointmentRescheduledEvent.getPolicyDescriptionVietnamese(this.data.reschedulePolicy);
  }

  /**
   * Static helper methods
   */

  private static calculateReschedulePolicy(hoursNotice: number, patientId: string): any {
    // Get patient's reschedule history (would be from database in real implementation)
    const freeReschedulesUsed = 0; // Mock data
    const maxFreeReschedules = 2; // Policy: 2 free reschedules per year
    
    const remainingFreeReschedules = Math.max(0, maxFreeReschedules - freeReschedulesUsed);
    
    // Vietnamese healthcare reschedule policy
    if (hoursNotice >= 24 && remainingFreeReschedules > 0) {
      return {
        hoursNotice,
        feeApplied: false,
        freeRescheduleUsed: true,
        remainingFreeReschedules: remainingFreeReschedules - 1
      };
    } else if (hoursNotice >= 24) {
      return {
        hoursNotice,
        feeApplied: true,
        freeRescheduleUsed: false,
        remainingFreeReschedules
      };
    } else {
      return {
        hoursNotice,
        feeApplied: true,
        freeRescheduleUsed: false,
        remainingFreeReschedules
      };
    }
  }

  private static calculateRescheduleFee(hoursNotice: number): number {
    // Reschedule fee based on notice period
    if (hoursNotice >= 24) {
      return 30000; // 30,000 VND for standard reschedule
    } else if (hoursNotice >= 2) {
      return 50000; // 50,000 VND for short notice
    } else {
      return 100000; // 100,000 VND for last minute
    }
  }

  private static requiresPreparation(appointmentTime: Date): boolean {
    // Check if new appointment time requires special preparation
    const hour = appointmentTime.getHours();
    return hour < 9; // Morning appointments might require fasting
  }

  private static calculateReminderTimes(appointmentTime: Date): Date[] {
    const reminders: Date[] = [];
    
    // 24 hours before
    const reminder24h = new Date(appointmentTime.getTime() - (24 * 60 * 60 * 1000));
    if (reminder24h > new Date()) {
      reminders.push(reminder24h);
    }
    
    // 2 hours before
    const reminder2h = new Date(appointmentTime.getTime() - (2 * 60 * 60 * 1000));
    if (reminder2h > new Date()) {
      reminders.push(reminder2h);
    }
    
    return reminders;
  }

  private static needsClinicalUpdate(rescheduleReason: string): boolean {
    const medicalReasons = [
      'bệnh nặng',
      'cấp cứu',
      'khẩn cấp',
      'sức khỏe',
      'triệu chứng',
      'medical',
      'emergency',
      'health',
      'symptoms'
    ];
    
    const reason = rescheduleReason.toLowerCase();
    return medicalReasons.some(keyword => reason.includes(keyword));
  }

  private static getPolicyDescriptionVietnamese(policy: any): string {
    if (policy.freeRescheduleUsed) {
      return `Đổi lịch miễn phí đã sử dụng. Còn lại ${policy.remainingFreeReschedules} lần đổi lịch miễn phí.`;
    } else if (policy.hoursNotice >= 24) {
      return 'Đổi lịch trước 24 giờ: Có phí đổi lịch tiêu chuẩn';
    } else if (policy.hoursNotice >= 2) {
      return 'Đổi lịch trước 2 giờ: Có phí đổi lịch cao hơn';
    } else {
      return 'Đổi lịch muộn (dưới 2 giờ): Có phí đổi lịch cao nhất';
    }
  }
}
