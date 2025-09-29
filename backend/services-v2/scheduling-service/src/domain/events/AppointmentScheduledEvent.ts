/**
 * Appointment Scheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment scheduling event
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */

import { DomainEvent } from '../../../shared/domain/base/domain-event';
import { AppointmentType, AppointmentPriority } from '../value-objects/AppointmentId';

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  appointmentType: AppointmentType;
  priority: AppointmentPriority;
  department: string;
  roomId?: string;
  estimatedDuration: number;
  requiresPreparation: boolean;
  scheduledBy: string;
  scheduledAt: Date;
  
  // Vietnamese healthcare specific
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  specialRequirements?: string[];
  interpreterRequired?: boolean;
  wheelchairAccessible?: boolean;
  
  // Integration events for other services
  integrationEvents: {
    // Provider Staff Service - update provider schedule
    providerScheduleUpdate: {
      providerId: string;
      timeSlotId: string;
      startTime: Date;
      endTime: Date;
      status: 'booked';
      appointmentId: string;
      patientId: string;
    };
    
    // Patient Registry Service - update appointment history
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      appointmentType: AppointmentType;
      providerId: string;
      department: string;
      scheduledAt: Date;
      status: 'scheduled';
    };
    
    // Notification Service - send appointment confirmations
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: 'appointment_scheduled';
        channels: ('sms' | 'email' | 'push')[];
        templateData: {
          appointmentId: string;
          providerName: string;
          department: string;
          appointmentDate: string;
          appointmentTime: string;
          preparationInstructions?: string;
        };
        scheduledFor: Date; // Send immediately
        priority: 'normal' | 'high' | 'urgent';
      };
      
      providerNotification: {
        providerId: string;
        type: 'new_appointment';
        channels: ('email' | 'push')[];
        templateData: {
          appointmentId: string;
          patientName: string;
          appointmentDate: string;
          appointmentTime: string;
          reason: string;
          urgencyLevel: string;
        };
        scheduledFor: Date;
        priority: 'normal' | 'high';
      };
      
      reminderNotifications: {
        patientId: string;
        appointmentId: string;
        reminders: {
          type: '24h' | '2h' | '30min';
          scheduledFor: Date;
          channels: ('sms' | 'email' | 'push')[];
        }[];
      };
    };
    
    // Clinical/EMR Service - prepare medical record
    clinicalPreparation?: {
      patientId: string;
      providerId: string;
      appointmentId: string;
      appointmentType: AppointmentType;
      reason: string;
      prepareMedicalRecord: boolean;
      reviewPreviousRecords: boolean;
      specialInstructions?: string;
    };
  };
}

/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 */
export class AppointmentScheduledEvent extends DomainEvent<AppointmentScheduledEventData> {
  
  constructor(
    appointmentId: string,
    patientId: string,
    providerId: string,
    startTime: Date,
    endTime: Date,
    reason: string,
    appointmentType: AppointmentType,
    priority: AppointmentPriority,
    scheduledBy: string,
    department?: string,
    roomId?: string,
    estimatedDuration: number = 30,
    requiresPreparation: boolean = false,
    urgencyLevel: 'routine' | 'urgent' | 'emergency' = 'routine',
    specialRequirements?: string[],
    interpreterRequired?: boolean,
    wheelchairAccessible?: boolean
  ) {
    const now = new Date();
    const eventData: AppointmentScheduledEventData = {
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
  private static getPatientNotificationChannels(
    priority: AppointmentPriority, 
    urgencyLevel: 'routine' | 'urgent' | 'emergency'
  ): ('sms' | 'email' | 'push')[] {
    if (urgencyLevel === 'emergency' || priority === AppointmentPriority.EMERGENCY) {
      return ['sms', 'push', 'email'];
    } else if (urgencyLevel === 'urgent' || priority === AppointmentPriority.URGENT) {
      return ['sms', 'push'];
    } else {
      return ['email', 'push'];
    }
  }

  /**
   * Get notification priority
   */
  private static getNotificationPriority(
    priority: AppointmentPriority, 
    urgencyLevel: 'routine' | 'urgent' | 'emergency'
  ): 'normal' | 'high' | 'urgent' {
    if (urgencyLevel === 'emergency' || priority === AppointmentPriority.EMERGENCY) {
      return 'urgent';
    } else if (urgencyLevel === 'urgent' || priority === AppointmentPriority.URGENT) {
      return 'high';
    } else {
      return 'normal';
    }
  }

  /**
   * Generate reminder schedule based on urgency
   */
  private static generateReminderSchedule(
    appointmentTime: Date, 
    urgencyLevel: 'routine' | 'urgent' | 'emergency'
  ): { type: '24h' | '2h' | '30min'; scheduledFor: Date; channels: ('sms' | 'email' | 'push')[] }[] {
    const reminders = [];
    
    if (urgencyLevel === 'emergency') {
      // Emergency appointments get immediate confirmation only
      return [];
    }
    
    // 24 hours before
    const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > new Date()) {
      reminders.push({
        type: '24h' as const,
        scheduledFor: reminder24h,
        channels: ['email', 'push'] as ('sms' | 'email' | 'push')[]
      });
    }
    
    // 2 hours before
    const reminder2h = new Date(appointmentTime.getTime() - 2 * 60 * 60 * 1000);
    if (reminder2h > new Date()) {
      reminders.push({
        type: '2h' as const,
        scheduledFor: reminder2h,
        channels: urgencyLevel === 'urgent' ? ['sms', 'push'] : ['push'] as ('sms' | 'email' | 'push')[]
      });
    }
    
    // 30 minutes before (for urgent appointments)
    if (urgencyLevel === 'urgent') {
      const reminder30min = new Date(appointmentTime.getTime() - 30 * 60 * 1000);
      if (reminder30min > new Date()) {
        reminders.push({
          type: '30min' as const,
          scheduledFor: reminder30min,
          channels: ['sms'] as ('sms' | 'email' | 'push')[]
        });
      }
    }
    
    return reminders;
  }

  /**
   * Check if appointment type requires special handling
   */
  private static requiresSpecialHandling(appointmentType: AppointmentType, priority: AppointmentPriority): boolean {
    return appointmentType === AppointmentType.SURGERY ||
           appointmentType === AppointmentType.EMERGENCY ||
           priority === AppointmentPriority.EMERGENCY ||
           priority === AppointmentPriority.URGENT;
  }

  /**
   * Check if appointment is within business hours
   */
  private static isWithinBusinessHours(appointmentTime: Date): boolean {
    const hour = appointmentTime.getHours();
    return hour >= 8 && hour < 17;
  }

  /**
   * Check if clinical record preparation is needed
   */
  private static shouldPrepareClinicalRecord(appointmentType: AppointmentType): boolean {
    return appointmentType === AppointmentType.SURGERY ||
           appointmentType === AppointmentType.DIAGNOSTIC ||
           appointmentType === AppointmentType.FOLLOW_UP;
  }

  /**
   * Get Vietnamese department display name
   */
  private static getDepartmentDisplayName(department: string): string {
    const departmentMap: { [key: string]: string } = {
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
  private static getUrgencyDisplayName(urgencyLevel: 'routine' | 'urgent' | 'emergency'): string {
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
      
      case 'clinical':
      case 'emr':
        return this.data.integrationEvents.clinicalPreparation;
      
      default:
        return null;
    }
  }
}
