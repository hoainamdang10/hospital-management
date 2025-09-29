/**
 * Appointment Scheduled Event - Domain Layer
 * Domain event for appointment scheduling with inter-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Healthcare Integration
 */

import { DomainEvent } from '../../../shared/domain/events/domain-event';
import { AppointmentType, AppointmentPriority } from '../value-objects/appointment-id';

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
  
  // Integration data for other services
  integrationEvents: {
    // For Provider/Staff Service
    providerScheduleUpdate: {
      providerId: string;
      timeSlotBooked: {
        startTime: Date;
        endTime: Date;
        appointmentId: string;
      };
    };
    
    // For Patient Registry Service
    patientAppointmentHistory: {
      patientId: string;
      appointmentId: string;
      appointmentType: AppointmentType;
      scheduledDate: Date;
    };
    
    // For Notification Service
    notificationRequests: {
      patientNotification: {
        patientId: string;
        type: 'appointment_scheduled';
        scheduledTime: Date;
        providerName: string;
        department: string;
        preparationRequired: boolean;
      };
      providerNotification: {
        providerId: string;
        type: 'new_appointment';
        appointmentTime: Date;
        patientName: string;
        appointmentType: AppointmentType;
        priority: AppointmentPriority;
      };
      reminderScheduling: {
        appointmentId: string;
        patientId: string;
        reminderTimes: Date[]; // 24h and 2h before
      };
    };
    
    // For Clinical/EMR Service (if exists)
    clinicalPreparation?: {
      patientId: string;
      providerId: string;
      appointmentId: string;
      appointmentType: AppointmentType;
      expectedDuration: number;
      prepareMedicalRecord: boolean;
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
    estimatedDuration?: number,
    requiresPreparation?: boolean
  ) {
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
      estimatedDuration: estimatedDuration || AppointmentScheduledEvent.getDefaultDuration(appointmentType),
      requiresPreparation: requiresPreparation || AppointmentScheduledEvent.requiresPreparation(appointmentType),
      scheduledBy,
      scheduledAt: new Date(),
      
      integrationEvents: {
        providerScheduleUpdate: {
          providerId,
          timeSlotBooked: {
            startTime,
            endTime,
            appointmentId
          }
        },
        
        patientAppointmentHistory: {
          patientId,
          appointmentId,
          appointmentType,
          scheduledDate: new Date()
        },
        
        notificationRequests: {
          patientNotification: {
            patientId,
            type: 'appointment_scheduled',
            scheduledTime: startTime,
            providerName: '', // Would be populated by handler
            department: department || 'GENERAL',
            preparationRequired: requiresPreparation || AppointmentScheduledEvent.requiresPreparation(appointmentType)
          },
          
          providerNotification: {
            providerId,
            type: 'new_appointment',
            appointmentTime: startTime,
            patientName: '', // Would be populated by handler
            appointmentType,
            priority
          },
          
          reminderScheduling: {
            appointmentId,
            patientId,
            reminderTimes: AppointmentScheduledEvent.calculateReminderTimes(startTime)
          }
        },
        
        ...(AppointmentScheduledEvent.needsClinicalPreparation(appointmentType) && {
          clinicalPreparation: {
            patientId,
            providerId,
            appointmentId,
            appointmentType,
            expectedDuration: estimatedDuration || AppointmentScheduledEvent.getDefaultDuration(appointmentType),
            prepareMedicalRecord: true
          }
        })
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
        scheduledAt: new Date().toISOString(),
        appointmentType,
        priority,
        department: department || 'GENERAL',
        isEmergency: priority === AppointmentPriority.EMERGENCY,
        isUrgent: priority === AppointmentPriority.URGENT || priority === AppointmentPriority.EMERGENCY,
        requiresSpecialHandling: AppointmentScheduledEvent.requiresSpecialHandling(appointmentType, priority),
        businessHours: AppointmentScheduledEvent.isWithinBusinessHours(startTime),
        vietnameseMetadata: {
          appointmentTypeVi: AppointmentScheduledEvent.getAppointmentTypeVietnamese(appointmentType),
          priorityVi: AppointmentScheduledEvent.getPriorityVietnamese(priority),
          departmentVi: AppointmentScheduledEvent.getDepartmentVietnamese(department || 'GENERAL')
        }
      }
    });
  }

  /**
   * Get appointment type in Vietnamese
   */
  public getAppointmentTypeVietnamese(): string {
    return AppointmentScheduledEvent.getAppointmentTypeVietnamese(this.data.appointmentType);
  }

  /**
   * Get priority in Vietnamese
   */
  public getPriorityVietnamese(): string {
    return AppointmentScheduledEvent.getPriorityVietnamese(this.data.priority);
  }

  /**
   * Get department in Vietnamese
   */
  public getDepartmentVietnamese(): string {
    return AppointmentScheduledEvent.getDepartmentVietnamese(this.data.department);
  }

  /**
   * Check if appointment is emergency
   */
  public isEmergency(): boolean {
    return this.data.priority === AppointmentPriority.EMERGENCY ||
           this.data.appointmentType === AppointmentType.EMERGENCY;
  }

  /**
   * Check if appointment is urgent
   */
  public isUrgent(): boolean {
    return this.data.priority === AppointmentPriority.URGENT ||
           this.data.priority === AppointmentPriority.EMERGENCY;
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

  /**
   * Get notification message for patient
   */
  public getPatientNotificationMessage(): string {
    const timeStr = this.data.startTime.toLocaleString('vi-VN');
    const typeVi = this.getAppointmentTypeVietnamese();
    const deptVi = this.getDepartmentVietnamese();
    
    let message = `Cuộc hẹn ${typeVi} của bạn đã được lên lịch vào ${timeStr} tại ${deptVi}.`;
    
    if (this.data.requiresPreparation) {
      message += ' Vui lòng chuẩn bị theo hướng dẫn được gửi kèm.';
    }
    
    if (this.isUrgent()) {
      message += ' Đây là cuộc hẹn ưu tiên, vui lòng đến đúng giờ.';
    }
    
    return message;
  }

  /**
   * Get notification message for provider
   */
  public getProviderNotificationMessage(): string {
    const timeStr = this.data.startTime.toLocaleString('vi-VN');
    const typeVi = this.getAppointmentTypeVietnamese();
    const priorityVi = this.getPriorityVietnamese();
    
    let message = `Cuộc hẹn ${typeVi} mới được lên lịch vào ${timeStr}. Mức độ ưu tiên: ${priorityVi}.`;
    
    if (this.isEmergency()) {
      message += ' CUỘC HẸN CẤP CỨU - Cần xử lý ngay lập tức.';
    }
    
    return message;
  }

  /**
   * Static helper methods
   */

  private static getDefaultDuration(appointmentType: AppointmentType): number {
    const durationMap = {
      [AppointmentType.CONSULTATION]: 30,
      [AppointmentType.FOLLOW_UP]: 15,
      [AppointmentType.SURGERY]: 120,
      [AppointmentType.EMERGENCY]: 60,
      [AppointmentType.DIAGNOSTIC]: 45,
      [AppointmentType.THERAPY]: 60,
      [AppointmentType.VACCINATION]: 10,
      [AppointmentType.HEALTH_CHECK]: 45
    };

    return durationMap[appointmentType] || 30;
  }

  private static requiresPreparation(appointmentType: AppointmentType): boolean {
    const preparationRequired = [
      AppointmentType.SURGERY,
      AppointmentType.DIAGNOSTIC,
      AppointmentType.HEALTH_CHECK
    ];

    return preparationRequired.includes(appointmentType);
  }

  private static needsClinicalPreparation(appointmentType: AppointmentType): boolean {
    const clinicalPreparationTypes = [
      AppointmentType.SURGERY,
      AppointmentType.DIAGNOSTIC,
      AppointmentType.EMERGENCY
    ];

    return clinicalPreparationTypes.includes(appointmentType);
  }

  private static requiresSpecialHandling(appointmentType: AppointmentType, priority: AppointmentPriority): boolean {
    return appointmentType === AppointmentType.SURGERY ||
           appointmentType === AppointmentType.EMERGENCY ||
           priority === AppointmentPriority.EMERGENCY ||
           priority === AppointmentPriority.URGENT;
  }

  private static isWithinBusinessHours(dateTime: Date): boolean {
    const hour = dateTime.getHours();
    const dayOfWeek = dateTime.getDay();
    
    // Vietnamese healthcare business hours
    if (dayOfWeek === 0) return false; // Sunday
    if (dayOfWeek === 6) return hour >= 7 && hour < 12; // Saturday morning only
    return hour >= 7 && hour < 17; // Monday to Friday
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

  private static getAppointmentTypeVietnamese(appointmentType: AppointmentType): string {
    const typeMap = {
      [AppointmentType.CONSULTATION]: 'Khám bệnh',
      [AppointmentType.FOLLOW_UP]: 'Tái khám',
      [AppointmentType.SURGERY]: 'Phẫu thuật',
      [AppointmentType.EMERGENCY]: 'Cấp cứu',
      [AppointmentType.DIAGNOSTIC]: 'Chẩn đoán',
      [AppointmentType.THERAPY]: 'Điều trị',
      [AppointmentType.VACCINATION]: 'Tiêm chủng',
      [AppointmentType.HEALTH_CHECK]: 'Khám sức khỏe'
    };

    return typeMap[appointmentType] || appointmentType;
  }

  private static getPriorityVietnamese(priority: AppointmentPriority): string {
    const priorityMap = {
      [AppointmentPriority.LOW]: 'Thấp',
      [AppointmentPriority.NORMAL]: 'Bình thường',
      [AppointmentPriority.HIGH]: 'Cao',
      [AppointmentPriority.URGENT]: 'Khẩn cấp',
      [AppointmentPriority.EMERGENCY]: 'Cấp cứu'
    };

    return priorityMap[priority] || priority;
  }

  private static getDepartmentVietnamese(department: string): string {
    const departmentMap: { [key: string]: string } = {
      'CARD': 'Khoa Tim mạch',
      'NEUR': 'Khoa Thần kinh',
      'ORTH': 'Khoa Chấn thương Chỉnh hình',
      'PEDI': 'Khoa Nhi',
      'INTE': 'Khoa Nội',
      'SURG': 'Khoa Phẫu thuật',
      'OBGY': 'Khoa Sản phụ khoa',
      'EMER': 'Khoa Cấp cứu',
      'RADI': 'Khoa Chẩn đoán hình ảnh',
      'ANES': 'Khoa Gây mê hồi sức',
      'GENERAL': 'Khoa Tổng hợp'
    };

    return departmentMap[department] || department;
  }
}
