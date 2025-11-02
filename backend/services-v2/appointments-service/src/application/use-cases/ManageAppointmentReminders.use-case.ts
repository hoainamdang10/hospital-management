/**
 * Manage Appointment Reminders Use Case - Application Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService, CustomReminderWindow, ReminderChannel } from '../services/IReminderService';
import { IAuthorizationService } from '../services/IAuthorizationService';

export interface ManageAppointmentRemindersRequest {
  appointmentId: string;
  action: 'enable' | 'disable' | 'reschedule';
  reminderWindows?: CustomReminderWindow[];
}

export interface ManageAppointmentRemindersResponse {
  success: boolean;
  message: string;
  reminders?: {
    appointmentId: string;
    enabled: boolean;
    windows: Array<{
      window: string;
      scheduledFor: string;
      channels: string[];
    }>;
  };
  errors?: string[];
}

/**
 * Manage Appointment Reminders Use Case
 * 
 * Business Rules:
 * 1. Default reminders: 24h, 2h, 30m before appointment
 * 2. Channels: SMS, Email, App notification
 * 3. Respect quiet hours (21:00 - 06:00)
 * 4. Can enable/disable/reschedule reminders
 * 5. Integration with Scheduler Service
 */
export class ManageAppointmentRemindersUseCase extends BaseHealthcareUseCase<
  ManageAppointmentRemindersRequest,
  ManageAppointmentRemindersResponse
> {
  private readonly DEFAULT_REMINDER_WINDOWS: CustomReminderWindow[] = [
    { window: '24h', channels: [ReminderChannel.EMAIL, ReminderChannel.IN_APP] },
    { window: '2h', channels: [ReminderChannel.SMS, ReminderChannel.IN_APP] },
    { window: '30m', channels: [ReminderChannel.IN_APP] }
  ];

  constructor(
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly reminderService: IReminderService,
    private readonly authorizationService: IAuthorizationService
  ) {
    super();
  }

  protected async executeInternal(
    request: ManageAppointmentRemindersRequest
  ): Promise<ManageAppointmentRemindersResponse> {
    try {
      // 1. Find appointment
      const appointment = await this.appointmentRepository.findByAppointmentId(
        request.appointmentId
      );

      if (!appointment) {
        return {
          success: false,
          message: 'Không tìm thấy lịch hẹn',
          errors: ['Appointment not found']
        };
      }

      // 2. Handle action
      switch (request.action) {
        case 'enable':
          return await this.enableReminders(appointment, request);
        case 'disable':
          return await this.disableReminders(appointment);
        case 'reschedule':
          return await this.rescheduleReminders(appointment, request);
        default:
          return {
            success: false,
            message: 'Hành động không hợp lệ',
            errors: ['Invalid action']
          };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Quản lý nhắc nhở thất bại',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Enable reminders
   */
  private async enableReminders(
    appointment: any,
    request: ManageAppointmentRemindersRequest
  ): Promise<ManageAppointmentRemindersResponse> {
    const windows = request.reminderWindows || this.DEFAULT_REMINDER_WINDOWS;
    const appointmentDateTime = new Date(
      `${appointment.timeSlot.appointmentDate}T${appointment.timeSlot.appointmentTime}`
    );

    // Calculate scheduled times
    const scheduledReminders = windows.map(window => {
      const scheduledFor = this.calculateReminderTime(appointmentDateTime, window.window);
      return {
        window: window.window,
        scheduledFor: scheduledFor.toISOString(),
        channels: window.channels
      };
    });

    // Call Scheduler Service to schedule reminders with custom windows
    try {
      await this.reminderService.scheduleReminders(
        appointment.appointmentId.value,
        appointment.patientId,
        appointmentDateTime,
        appointment.priority,
        windows // ✅ Pass custom windows
      );
      console.log(`[ManageReminders] Scheduled reminders for appointment ${appointment.appointmentId.value} with ${windows.length} custom windows`);
    } catch (error) {
      console.error('[ManageReminders] Failed to schedule reminders:', error);
      throw new Error('Failed to schedule reminders in scheduler service');
    }

    return {
      success: true,
      message: 'Đã bật nhắc nhở',
      reminders: {
        appointmentId: appointment.appointmentId.value,
        enabled: true,
        windows: scheduledReminders
      }
    };
  }

  /**
   * Disable reminders
   */
  private async disableReminders(appointment: any): Promise<ManageAppointmentRemindersResponse> {
    // Call Scheduler Service to cancel reminders
    try {
      await this.reminderService.cancelReminders(appointment.appointmentId.value);
      console.log(`[ManageReminders] Cancelled reminders for appointment ${appointment.appointmentId.value}`);
    } catch (error) {
      console.error('[ManageReminders] Failed to cancel reminders:', error);
      throw new Error('Failed to cancel reminders in scheduler service');
    }

    return {
      success: true,
      message: 'Đã tắt nhắc nhở',
      reminders: {
        appointmentId: appointment.appointmentId.value,
        enabled: false,
        windows: []
      }
    };
  }

  /**
   * Reschedule reminders
   */
  private async rescheduleReminders(
    appointment: any,
    request: ManageAppointmentRemindersRequest
  ): Promise<ManageAppointmentRemindersResponse> {
    // Cancel old reminders
    await this.disableReminders(appointment);

    // Schedule new reminders
    return await this.enableReminders(appointment, request);
  }

  /**
   * Calculate reminder time based on window
   */
  private calculateReminderTime(appointmentTime: Date, window: string): Date {
    const match = window.match(/^(\d+)(h|m)$/);
    if (!match) {
      throw new Error(`Invalid window format: ${window}`);
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const reminderTime = new Date(appointmentTime);

    if (unit === 'h') {
      reminderTime.setHours(reminderTime.getHours() - value);
    } else if (unit === 'm') {
      reminderTime.setMinutes(reminderTime.getMinutes() - value);
    }

    // Respect quiet hours (21:00 - 06:00)
    return this.adjustForQuietHours(reminderTime);
  }

  /**
   * Adjust time to avoid quiet hours
   */
  private adjustForQuietHours(time: Date): Date {
    const hour = time.getHours();

    // If in quiet hours (21:00 - 06:00), move to 06:05
    if (hour >= 21 || hour < 6) {
      const adjusted = new Date(time);
      if (hour >= 21) {
        adjusted.setDate(adjusted.getDate() + 1);
      }
      adjusted.setHours(6, 5, 0, 0);
      return adjusted;
    }

    return time;
  }

  async authorize(request: ManageAppointmentRemindersRequest, userId: string): Promise<boolean> {
    try {
      // Get appointment to check patient ID
      const appointment = await this.appointmentRepository.findByAppointmentId(request.appointmentId);
      if (!appointment) {
        // Let executeInternal handle "not found" case
        return true;
      }

      // Check if user has permission to manage reminders
      // Patient can manage their own reminders, Staff can manage any reminders
      const canManage = await this.authorizationService.canManageAppointmentReminders(
        userId,
        appointment.patientId
      );

      return canManage;
    } catch (error) {
      console.error('[ManageReminders] Authorization check failed:', error);
      return false;
    }
  }

  involvesPHI(request: ManageAppointmentRemindersRequest): boolean {
    return true;
  }

  getPatientId(request: ManageAppointmentRemindersRequest): string | null {
    // Will be retrieved from appointment
    return null;
  }
}

