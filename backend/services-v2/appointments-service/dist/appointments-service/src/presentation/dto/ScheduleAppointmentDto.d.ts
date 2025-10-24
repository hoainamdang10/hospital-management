/**
 * Schedule Appointment DTOs - Presentation Layer
 * V2 Clean Architecture + DDD Implementation
 * Request/Response DTOs for appointment scheduling API
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API, Vietnamese Healthcare Standards
 */
/**
 * Schedule Appointment Request DTO
 */
export interface ScheduleAppointmentRequestDto {
    patient: {
        patientId: string;
        fullName: string;
        phone: string;
        dateOfBirth: string;
        nationalId: string;
        email?: string;
        address?: string;
        emergencyContact?: string;
        insuranceNumber?: string;
        insuranceType?: 'BHYT' | 'BHTN' | 'PRIVATE' | 'NONE';
    };
    provider: {
        providerId: string;
        fullName?: string;
        specialization?: string;
        department?: string;
    };
    appointment: {
        appointmentType: 'consultation' | 'follow_up' | 'emergency' | 'surgery' | 'diagnostic' | 'therapy' | 'vaccination' | 'checkup' | 'prescription' | 'referral';
        priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
        startTime: string;
        endTime: string;
        roomId?: string;
        reason: string;
        reasonCode?: 'consultation' | 'follow_up' | 'emergency' | 'surgery' | 'diagnostic' | 'therapy' | 'vaccination' | 'checkup' | 'prescription' | 'referral';
        symptoms?: string;
        notes?: string;
        preparationInstructions?: string;
        estimatedDuration: number;
        requiresPreparation?: boolean;
        isFollowUp?: boolean;
        previousAppointmentId?: string;
        urgencyLevel?: 'routine' | 'urgent' | 'emergency';
        specialRequirements?: string[];
        interpreterRequired?: boolean;
        wheelchairAccessible?: boolean;
        fasting?: boolean;
        medicationRestrictions?: string[];
    };
    departmentCode: string;
    createdBy?: string;
}
/**
 * Schedule Appointment Response DTO
 */
export interface ScheduleAppointmentResponseDto {
    success: boolean;
    message: string;
    data?: {
        appointment: {
            id: string;
            appointmentId: string;
            patientId: string;
            patientName: string;
            providerId: string;
            providerName: string;
            startTime: string;
            endTime: string;
            status: string;
            roomId?: string;
            reason: string;
            estimatedDuration: number;
            urgencyLevel: string;
            createdAt: string;
            createdBy: string;
        };
        nextSteps: string[];
        reminders: {
            smsReminder: boolean;
            emailReminder: boolean;
            reminderTimes: string[];
        };
        qrCode?: string;
        appointmentUrl?: string;
    };
    errors?: string[];
    validationErrors?: {
        field: string;
        message: string;
    }[];
}
/**
 * Reschedule Appointment Request DTO
 */
export interface RescheduleAppointmentRequestDto {
    appointmentId: string;
    newStartTime: string;
    newEndTime: string;
    newRoomId?: string;
    reason: string;
    notifyPatient?: boolean;
    notifyProvider?: boolean;
    rescheduledBy?: string;
}
/**
 * Reschedule Appointment Response DTO
 */
export interface RescheduleAppointmentResponseDto {
    success: boolean;
    message: string;
    data?: {
        appointmentId: string;
        oldStartTime: string;
        oldEndTime: string;
        newStartTime: string;
        newEndTime: string;
        status: string;
        rescheduledAt: string;
        rescheduledBy: string;
        reason: string;
        notificationsSent: {
            patient: boolean;
            provider: boolean;
            channels: string[];
        };
    };
    errors?: string[];
    validationErrors?: {
        field: string;
        message: string;
    }[];
}
/**
 * Check Availability Request DTO
 */
export interface CheckAvailabilityRequestDto {
    providerId?: string;
    departmentCode?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    appointmentType?: string;
    duration?: number;
    includeUnavailable?: boolean;
}
/**
 * Check Availability Response DTO
 */
export interface CheckAvailabilityResponseDto {
    success: boolean;
    message: string;
    data?: {
        date: string;
        providerId?: string;
        providerName?: string;
        departmentCode?: string;
        departmentName?: string;
        totalSlots: number;
        availableSlots: number;
        bookedSlots: number;
        blockedSlots: number;
        slots: AvailabilitySlotDto[];
        recommendations?: {
            alternativeTimes: string[];
            alternativeProviders: {
                providerId: string;
                providerName: string;
                department: string;
                nextAvailableTime: string;
            }[];
            nextAvailableDate: string;
        };
    };
    errors?: string[];
}
/**
 * Availability Slot DTO
 */
export interface AvailabilitySlotDto {
    startTime: string;
    endTime: string;
    duration: number;
    status: 'available' | 'booked' | 'blocked' | 'maintenance';
    providerId: string;
    providerName: string;
    department: string;
    roomId?: string;
    roomName?: string;
    appointmentId?: string;
    notes?: string;
    conflictReason?: string;
}
/**
 * Appointment Details Response DTO
 */
export interface AppointmentDetailsResponseDto {
    success: boolean;
    message: string;
    data?: {
        id: string;
        appointmentId: string;
        patient: {
            patientId: string;
            fullName: string;
            phone: string;
            email?: string;
            insuranceNumber?: string;
            insuranceType?: string;
        };
        provider: {
            providerId: string;
            fullName: string;
            specialization: string;
            department: string;
            phone?: string;
            email?: string;
        };
        appointment: {
            startTime: string;
            endTime: string;
            status: string;
            roomId?: string;
            roomName?: string;
            reason: string;
            symptoms?: string;
            notes?: string;
            estimatedDuration: number;
            urgencyLevel: string;
            specialRequirements?: string[];
            preparationInstructions?: string;
        };
        timeline: {
            createdAt: string;
            createdBy: string;
            confirmedAt?: string;
            confirmedBy?: string;
            completedAt?: string;
            completedBy?: string;
            cancelledAt?: string;
            cancelledBy?: string;
            cancellationReason?: string;
        };
        reminders: {
            sent: number;
            scheduled: number;
            lastSent?: string;
            nextScheduled?: string;
        };
    };
    errors?: string[];
}
/**
 * Common Error Response DTO
 */
export interface ErrorResponseDto {
    success: false;
    message: string;
    errorCode?: string;
    errors?: string[];
    validationErrors?: {
        field: string;
        message: string;
        code?: string;
    }[];
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
}
/**
 * Success Response DTO
 */
export interface SuccessResponseDto<T = any> {
    success: true;
    message: string;
    data?: T;
    timestamp: string;
    path: string;
    method: string;
    statusCode: number;
}
//# sourceMappingURL=ScheduleAppointmentDto.d.ts.map