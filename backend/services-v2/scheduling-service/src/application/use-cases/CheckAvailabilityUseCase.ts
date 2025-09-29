/**
 * Check Availability Use Case - Application Layer
 * V2 Clean Architecture + DDD + CQRS Implementation
 * Vietnamese healthcare provider availability checking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { ISchedulingRepository } from '../interfaces/ISchedulingRepository';
import { IAvailabilityService } from '../interfaces/IAvailabilityService';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';

export interface CheckAvailabilityRequest {
  providerId?: string;
  departmentCode?: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  appointmentType?: string;
  duration?: number; // in minutes
  includeUnavailable?: boolean;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'available' | 'booked' | 'blocked' | 'maintenance';
  providerId: string;
  providerName: string;
  department: string;
  roomId?: string;
  roomName?: string;
  appointmentId?: string;
  notes?: string;
}

export interface CheckAvailabilityResponse {
  success: boolean;
  message: string;
  data?: {
    date: Date;
    providerId?: string;
    departmentCode?: string;
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
    slots: AvailabilitySlot[];
    recommendations?: {
      alternativeTimes: Date[];
      alternativeProviders: string[];
      nextAvailableDate: Date;
    };
  };
  errors?: string[];
}

/**
 * Check Availability Use Case
 * Handles provider and department availability checking with Vietnamese healthcare rules
 */
export class CheckAvailabilityUseCase {
  constructor(
    private readonly schedulingRepository: ISchedulingRepository,
    private readonly availabilityService: IAvailabilityService
  ) {}

  async execute(request: CheckAvailabilityRequest): Promise<CheckAvailabilityResponse> {
    try {
      // 1. Validate request
      this.validateRequest(request);

      // 2. Apply Vietnamese healthcare business rules
      const businessRulesValidation = this.validateVietnameseBusinessRules(request.date);
      if (!businessRulesValidation.isValid) {
        return {
          success: false,
          message: businessRulesValidation.message,
          errors: businessRulesValidation.errors
        };
      }

      // 3. Get availability data
      let availabilitySlots: AvailabilitySlot[] = [];

      if (request.providerId) {
        // Check specific provider availability
        availabilitySlots = await this.getProviderAvailability(request);
      } else if (request.departmentCode) {
        // Check department availability
        availabilitySlots = await this.getDepartmentAvailability(request);
      } else {
        // Check general availability
        availabilitySlots = await this.getGeneralAvailability(request);
      }

      // 4. Filter slots based on request criteria
      const filteredSlots = this.filterSlots(availabilitySlots, request);

      // 5. Calculate statistics
      const stats = this.calculateStatistics(filteredSlots);

      // 6. Generate recommendations if no availability
      const recommendations = stats.availableSlots === 0 
        ? await this.generateRecommendations(request)
        : undefined;

      // 7. Generate response
      return {
        success: true,
        message: stats.availableSlots > 0 
          ? `Tìm thấy ${stats.availableSlots} khung thời gian khả dụng`
          : 'Không có khung thời gian khả dụng',
        data: {
          date: request.date,
          providerId: request.providerId,
          departmentCode: request.departmentCode,
          totalSlots: stats.totalSlots,
          availableSlots: stats.availableSlots,
          bookedSlots: stats.bookedSlots,
          blockedSlots: stats.blockedSlots,
          slots: filteredSlots,
          recommendations
        }
      };

    } catch (error) {
      return {
        success: false,
        message: 'Có lỗi xảy ra khi kiểm tra lịch trống',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }

  private validateRequest(request: CheckAvailabilityRequest): void {
    if (!request.date) {
      throw new Error('Ngày kiểm tra không được để trống');
    }

    if (request.startTime && request.endTime && request.startTime >= request.endTime) {
      throw new Error('Thời gian bắt đầu phải trước thời gian kết thúc');
    }

    if (request.duration && (request.duration <= 0 || request.duration > 480)) {
      throw new Error('Thời gian khám phải từ 1 phút đến 8 giờ');
    }

    if (!request.providerId && !request.departmentCode) {
      // Allow general availability check
    }
  }

  private validateVietnameseBusinessRules(date: Date): { isValid: boolean; message: string; errors: string[] } {
    const now = new Date();
    const requestDate = new Date(date);

    // Rule 1: Cannot check availability for past dates
    if (requestDate < now) {
      return {
        isValid: false,
        message: 'Không thể kiểm tra lịch trống cho ngày trong quá khứ',
        errors: ['PAST_DATE_NOT_ALLOWED']
      };
    }

    // Rule 2: Cannot check availability more than 60 days in advance
    const daysDifference = (requestDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDifference > 60) {
      return {
        isValid: false,
        message: 'Không thể kiểm tra lịch trống quá 60 ngày trong tương lai',
        errors: ['TOO_FAR_IN_FUTURE']
      };
    }

    // Rule 3: No appointments on Sundays (Vietnamese healthcare standard)
    if (requestDate.getDay() === 0) {
      return {
        isValid: false,
        message: 'Không có lịch khám vào Chủ nhật',
        errors: ['NO_SUNDAY_APPOINTMENTS']
      };
    }

    return {
      isValid: true,
      message: 'Ngày kiểm tra hợp lệ',
      errors: []
    };
  }

  private async getProviderAvailability(request: CheckAvailabilityRequest): Promise<AvailabilitySlot[]> {
    // Get provider's schedule for the date
    const providerSchedule = await this.availabilityService.getProviderSchedule(
      request.providerId!,
      request.date
    );

    // Get existing appointments for the provider on that date
    const existingAppointments = await this.schedulingRepository.findByProviderAndDate(
      request.providerId!,
      request.date
    );

    // Generate time slots based on provider's working hours
    const slots: AvailabilitySlot[] = [];
    const workingHours = providerSchedule.workingHours || { start: 8, end: 17 }; // 8 AM - 5 PM default

    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += 30) { // 30-minute slots
        const slotStart = new Date(request.date);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + 30);

        // Check if slot is booked
        const isBooked = existingAppointments.some(apt => 
          apt.timeSlot.startTime <= slotStart && apt.timeSlot.endTime > slotStart
        );

        slots.push({
          startTime: slotStart,
          endTime: slotEnd,
          duration: 30,
          status: isBooked ? 'booked' : 'available',
          providerId: request.providerId!,
          providerName: providerSchedule.providerName,
          department: providerSchedule.department,
          roomId: providerSchedule.roomId,
          roomName: providerSchedule.roomName,
          appointmentId: isBooked ? existingAppointments.find(apt => 
            apt.timeSlot.startTime <= slotStart && apt.timeSlot.endTime > slotStart
          )?.appointmentId.value : undefined
        });
      }
    }

    return slots;
  }

  private async getDepartmentAvailability(request: CheckAvailabilityRequest): Promise<AvailabilitySlot[]> {
    // Get all providers in the department
    const departmentProviders = await this.availabilityService.getDepartmentProviders(
      request.departmentCode!
    );

    // Get availability for each provider
    const allSlots: AvailabilitySlot[] = [];
    for (const provider of departmentProviders) {
      const providerRequest = { ...request, providerId: provider.id };
      const providerSlots = await this.getProviderAvailability(providerRequest);
      allSlots.push(...providerSlots);
    }

    return allSlots;
  }

  private async getGeneralAvailability(request: CheckAvailabilityRequest): Promise<AvailabilitySlot[]> {
    // Get availability across all providers and departments
    const allProviders = await this.availabilityService.getAllProviders();
    
    const allSlots: AvailabilitySlot[] = [];
    for (const provider of allProviders) {
      const providerRequest = { ...request, providerId: provider.id };
      const providerSlots = await this.getProviderAvailability(providerRequest);
      allSlots.push(...providerSlots);
    }

    return allSlots;
  }

  private filterSlots(slots: AvailabilitySlot[], request: CheckAvailabilityRequest): AvailabilitySlot[] {
    let filteredSlots = slots;

    // Filter by time range if specified
    if (request.startTime && request.endTime) {
      filteredSlots = filteredSlots.filter(slot => 
        slot.startTime >= request.startTime! && slot.endTime <= request.endTime!
      );
    }

    // Filter by duration if specified
    if (request.duration) {
      filteredSlots = filteredSlots.filter(slot => slot.duration >= request.duration!);
    }

    // Filter by status
    if (!request.includeUnavailable) {
      filteredSlots = filteredSlots.filter(slot => slot.status === 'available');
    }

    return filteredSlots;
  }

  private calculateStatistics(slots: AvailabilitySlot[]): {
    totalSlots: number;
    availableSlots: number;
    bookedSlots: number;
    blockedSlots: number;
  } {
    return {
      totalSlots: slots.length,
      availableSlots: slots.filter(s => s.status === 'available').length,
      bookedSlots: slots.filter(s => s.status === 'booked').length,
      blockedSlots: slots.filter(s => s.status === 'blocked' || s.status === 'maintenance').length
    };
  }

  private async generateRecommendations(request: CheckAvailabilityRequest): Promise<any> {
    // Generate alternative recommendations when no availability found
    const nextDay = new Date(request.date);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      alternativeTimes: [], // Would be populated with actual alternative times
      alternativeProviders: [], // Would be populated with alternative providers
      nextAvailableDate: nextDay
    };
  }
}
