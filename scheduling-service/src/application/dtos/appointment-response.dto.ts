/**
 * Appointment Response DTOs - Application Layer
 * Response data transfer objects with Vietnamese localization and data masking
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Healthcare Privacy, Vietnamese Localization, Data Masking
 */

import { AppointmentStatus } from '../../domain/aggregates/appointment.aggregate';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/appointment-id';
import { TimeSlotStatus } from '../../domain/value-objects/time-slot';

export interface PatientInfoResponseDto {
  patientId: string;
  fullName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  nationalId?: string;
  age?: number;
  gender?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface ProviderInfoResponseDto {
  providerId: string;
  fullName: string;
  specialization: string;
  department: string;
  departmentVietnamese: string;
  licenseNumber?: string;
  title: string;
  experience?: number;
  rating?: number;
  availableLanguages: string[];
}

export interface TimeSlotResponseDto {
  startTime: string; // ISO string
  endTime: string;
  startTimeVietnamese: string;
  endTimeVietnamese: string;
  duration: number; // minutes
  durationVietnamese: string;
  status: TimeSlotStatus;
  statusVietnamese: string;
  dayOfWeek: string;
  dayOfWeekVietnamese: string;
  isToday: boolean;
  isPast: boolean;
  isWithinBusinessHours: boolean;
}

export interface AppointmentDetailsResponseDto {
  reason: string;
  symptoms?: string;
  notes?: string;
  preparationInstructions?: string;
  estimatedDuration: number;
  estimatedDurationVietnamese: string;
  requiresPreparation: boolean;
  isFollowUp: boolean;
  previousAppointmentId?: string;
  specialRequirements?: string[];
}

export interface AppointmentStatusHistoryDto {
  status: AppointmentStatus;
  statusVietnamese: string;
  timestamp: string;
  changedBy: string;
  reason?: string;
  notes?: string;
}

export interface ReminderHistoryDto {
  sentAt: string;
  sentAtVietnamese: string;
  type: 'sms' | 'email' | 'call' | 'push';
  typeVietnamese: string;
  status: 'sent' | 'delivered' | 'failed';
  statusVietnamese: string;
  recipient: string;
}

export interface AppointmentResponseDto {
  id: string;
  appointmentId: string;
  appointmentType: AppointmentType;
  appointmentTypeVietnamese: string;
  priority: AppointmentPriority;
  priorityVietnamese: string;
  status: AppointmentStatus;
  statusVietnamese: string;
  
  patient?: PatientInfoResponseDto;
  provider?: ProviderInfoResponseDto;
  timeSlot: TimeSlotResponseDto;
  details?: AppointmentDetailsResponseDto;
  
  roomId?: string;
  roomName?: string;
  
  createdAt: string;
  createdAtVietnamese: string;
  updatedAt: string;
  updatedAtVietnamese: string;
  createdBy: string;
  
  confirmedAt?: string;
  confirmedAtVietnamese?: string;
  completedAt?: string;
  completedAtVietnamese?: string;
  cancelledAt?: string;
  cancelledAtVietnamese?: string;
  cancellationReason?: string;
  
  remindersSent: number;
  lastReminderSent?: string;
  lastReminderSentVietnamese?: string;
  
  statusHistory?: AppointmentStatusHistoryDto[];
  reminderHistory?: ReminderHistoryDto[];
  
  // Business computed fields
  canBeCancelled: boolean;
  canBeRescheduled: boolean;
  needsReminder: boolean;
  isEmergency: boolean;
  isUrgent: boolean;
  timeUntilAppointment?: {
    hours: number;
    minutes: number;
    displayText: string;
  };
  
  // Compliance and audit
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  accessLevel: string;
  lastAccessedAt?: string;
  lastAccessedBy?: string;
}

export interface AppointmentSearchResultDto {
  appointments: AppointmentResponseDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: {
    totalAppointments: number;
    scheduledAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    emergencyAppointments: number;
    todayAppointments: number;
    upcomingAppointments: number;
    departmentDistribution: { [department: string]: number };
    appointmentTypeDistribution: { [type: string]: number };
    statusDistribution: { [status: string]: number };
  };
  filters: {
    appliedFilters: string[];
    availableFilters: {
      departments: string[];
      appointmentTypes: string[];
      statuses: string[];
      priorities: string[];
    };
  };
}

/**
 * Appointment Response Mapper
 * Maps domain objects to response DTOs with Vietnamese localization
 */
export class AppointmentResponseMapper {
  
  /**
   * Map appointment to response DTO
   */
  public static mapToDto(
    appointment: any, // Would be Appointment domain object
    includePatientInfo: boolean = true,
    includeProviderInfo: boolean = true,
    includeDetails: boolean = true,
    includeHistory: boolean = false,
    anonymizeData: boolean = false,
    accessLevel: string = 'standard'
  ): AppointmentResponseDto {
    const dto: AppointmentResponseDto = {
      id: appointment.id,
      appointmentId: appointment.appointmentId.value,
      appointmentType: appointment.appointmentId.appointmentType,
      appointmentTypeVietnamese: appointment.appointmentId.getAppointmentTypeVietnamese(),
      priority: appointment.priority,
      priorityVietnamese: appointment.appointmentId.getPriorityVietnamese(),
      status: appointment.status,
      statusVietnamese: appointment.getStatusVietnamese(),
      
      timeSlot: AppointmentResponseMapper.mapTimeSlotToDto(appointment.timeSlot),
      
      roomId: appointment.roomId,
      roomName: AppointmentResponseMapper.getRoomName(appointment.roomId),
      
      createdAt: appointment.createdAt.toISOString(),
      createdAtVietnamese: AppointmentResponseMapper.formatDateTimeVietnamese(appointment.createdAt),
      updatedAt: appointment.updatedAt.toISOString(),
      updatedAtVietnamese: AppointmentResponseMapper.formatDateTimeVietnamese(appointment.updatedAt),
      createdBy: appointment.createdBy,
      
      confirmedAt: appointment.confirmedAt?.toISOString(),
      confirmedAtVietnamese: appointment.confirmedAt ? 
        AppointmentResponseMapper.formatDateTimeVietnamese(appointment.confirmedAt) : undefined,
      completedAt: appointment.completedAt?.toISOString(),
      completedAtVietnamese: appointment.completedAt ? 
        AppointmentResponseMapper.formatDateTimeVietnamese(appointment.completedAt) : undefined,
      cancelledAt: appointment.cancelledAt?.toISOString(),
      cancelledAtVietnamese: appointment.cancelledAt ? 
        AppointmentResponseMapper.formatDateTimeVietnamese(appointment.cancelledAt) : undefined,
      cancellationReason: appointment.cancellationReason,
      
      remindersSent: appointment.remindersSent,
      lastReminderSent: appointment.lastReminderSent?.toISOString(),
      lastReminderSentVietnamese: appointment.lastReminderSent ? 
        AppointmentResponseMapper.formatDateTimeVietnamese(appointment.lastReminderSent) : undefined,
      
      // Business computed fields
      canBeCancelled: appointment.canBeCancelled(),
      canBeRescheduled: appointment.canBeRescheduled(),
      needsReminder: appointment.needsReminder(),
      isEmergency: appointment.appointmentId.isEmergency(),
      isUrgent: appointment.appointmentId.isUrgent(),
      timeUntilAppointment: AppointmentResponseMapper.mapTimeUntilAppointment(appointment.getTimeUntilAppointment()),
      
      // Compliance
      dataClassification: AppointmentResponseMapper.getDataClassification(appointment, accessLevel),
      accessLevel,
      lastAccessedAt: new Date().toISOString(),
      lastAccessedBy: 'system' // Would be actual user in real implementation
    };

    // Conditionally include patient info
    if (includePatientInfo && !anonymizeData) {
      dto.patient = AppointmentResponseMapper.mapPatientInfoToDto(
        appointment.patient, 
        accessLevel === 'full' || accessLevel === 'admin'
      );
    } else if (includePatientInfo && anonymizeData) {
      dto.patient = AppointmentResponseMapper.mapAnonymizedPatientInfo(appointment.patient);
    }

    // Conditionally include provider info
    if (includeProviderInfo) {
      dto.provider = AppointmentResponseMapper.mapProviderInfoToDto(appointment.provider);
    }

    // Conditionally include appointment details
    if (includeDetails) {
      dto.details = AppointmentResponseMapper.mapAppointmentDetailsToDto(appointment.details);
    }

    // Conditionally include history
    if (includeHistory) {
      dto.statusHistory = []; // Would map from domain
      dto.reminderHistory = []; // Would map from domain
    }

    return dto;
  }

  /**
   * Map patient info to DTO
   */
  private static mapPatientInfoToDto(
    patient: any,
    includeSensitiveData: boolean = false
  ): PatientInfoResponseDto {
    const dto: PatientInfoResponseDto = {
      patientId: patient.patientId,
      fullName: patient.fullName,
      phone: AppointmentResponseMapper.maskPhoneNumber(patient.phone),
      email: patient.email ? AppointmentResponseMapper.maskEmail(patient.email) : undefined
    };

    if (includeSensitiveData) {
      dto.dateOfBirth = patient.dateOfBirth?.toISOString().split('T')[0];
      dto.nationalId = AppointmentResponseMapper.maskNationalId(patient.nationalId);
      dto.age = AppointmentResponseMapper.calculateAge(patient.dateOfBirth);
    }

    return dto;
  }

  /**
   * Map anonymized patient info
   */
  private static mapAnonymizedPatientInfo(patient: any): PatientInfoResponseDto {
    return {
      patientId: `***${patient.patientId.slice(-4)}`,
      fullName: `${patient.fullName.charAt(0)}***`,
      phone: '***-***-****'
    };
  }

  /**
   * Map provider info to DTO
   */
  private static mapProviderInfoToDto(provider: any): ProviderInfoResponseDto {
    return {
      providerId: provider.providerId,
      fullName: provider.fullName,
      specialization: provider.specialization,
      department: provider.department,
      departmentVietnamese: AppointmentResponseMapper.getDepartmentVietnamese(provider.department),
      title: AppointmentResponseMapper.getProviderTitle(provider.specialization),
      availableLanguages: ['vi', 'en'] // Would come from provider data
    };
  }

  /**
   * Map time slot to DTO
   */
  private static mapTimeSlotToDto(timeSlot: any): TimeSlotResponseDto {
    return {
      startTime: timeSlot.startTime.toISOString(),
      endTime: timeSlot.endTime.toISOString(),
      startTimeVietnamese: AppointmentResponseMapper.formatTimeVietnamese(timeSlot.startTime),
      endTimeVietnamese: AppointmentResponseMapper.formatTimeVietnamese(timeSlot.endTime),
      duration: timeSlot.getDurationMinutes(),
      durationVietnamese: AppointmentResponseMapper.formatDurationVietnamese(timeSlot.getDurationMinutes()),
      status: timeSlot.status,
      statusVietnamese: timeSlot.getStatusVietnamese(),
      dayOfWeek: timeSlot.startTime.toLocaleDateString('en-US', { weekday: 'long' }),
      dayOfWeekVietnamese: timeSlot.getDayOfWeekVietnamese(),
      isToday: timeSlot.isToday(),
      isPast: timeSlot.isPast(),
      isWithinBusinessHours: timeSlot.isWithinBusinessHours()
    };
  }

  /**
   * Map appointment details to DTO
   */
  private static mapAppointmentDetailsToDto(details: any): AppointmentDetailsResponseDto {
    return {
      reason: details.reason,
      symptoms: details.symptoms,
      notes: details.notes,
      preparationInstructions: details.preparationInstructions,
      estimatedDuration: details.estimatedDuration,
      estimatedDurationVietnamese: AppointmentResponseMapper.formatDurationVietnamese(details.estimatedDuration),
      requiresPreparation: details.requiresPreparation,
      isFollowUp: details.isFollowUp,
      previousAppointmentId: details.previousAppointmentId
    };
  }

  /**
   * Helper methods for Vietnamese localization
   */

  private static formatDateTimeVietnamese(date: Date): string {
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  }

  private static formatTimeVietnamese(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  }

  private static formatDurationVietnamese(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} phút`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} giờ`;
      } else {
        return `${hours} giờ ${remainingMinutes} phút`;
      }
    }
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
      'ANES': 'Khoa Gây mê hồi sức'
    };

    return departmentMap[department] || department;
  }

  private static getProviderTitle(specialization: string): string {
    // Would map specialization to appropriate Vietnamese title
    return 'Bác sĩ';
  }

  private static getRoomName(roomId?: string): string | undefined {
    if (!roomId) return undefined;
    // Would map room ID to room name
    return `Phòng ${roomId}`;
  }

  private static mapTimeUntilAppointment(timeUntil: { hours: number; minutes: number }): any {
    const { hours, minutes } = timeUntil;
    
    let displayText = '';
    if (hours > 0) {
      displayText += `${hours} giờ`;
      if (minutes > 0) {
        displayText += ` ${minutes} phút`;
      }
    } else if (minutes > 0) {
      displayText = `${minutes} phút`;
    } else {
      displayText = 'Đã đến giờ';
    }

    return {
      hours,
      minutes,
      displayText
    };
  }

  /**
   * Data masking methods
   */

  private static maskPhoneNumber(phone: string): string {
    if (phone.length <= 4) return phone;
    return `${phone.substring(0, 3)}***${phone.substring(phone.length - 2)}`;
  }

  private static maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local.charAt(0)}***@${domain}`;
  }

  private static maskNationalId(nationalId: string): string {
    if (nationalId.length <= 6) return nationalId;
    return `${nationalId.substring(0, 3)}***${nationalId.substring(nationalId.length - 3)}`;
  }

  private static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  private static getDataClassification(appointment: any, accessLevel: string): 'public' | 'internal' | 'confidential' | 'restricted' {
    if (accessLevel === 'admin') return 'restricted';
    if (accessLevel === 'full') return 'confidential';
    if (appointment.appointmentId.isEmergency()) return 'confidential';
    return 'internal';
  }
}
