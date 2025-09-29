/**
 * Schedule Appointment Command Handler - Application Layer
 * V2 Clean Architecture + CQRS + DDD Implementation
 * Handles appointment scheduling commands with Vietnamese healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */

import { ScheduleAppointmentCommand } from '../commands/ScheduleAppointmentCommand';
import { ScheduleAppointmentUseCase, ScheduleAppointmentRequest, ScheduleAppointmentResponse } from '../use-cases/ScheduleAppointmentUseCase';
import { ICommandHandler } from '../interfaces/ICommandHandler';
import { AppointmentType, AppointmentPriority } from '../../domain/value-objects/AppointmentId';
import { AppointmentReason } from '../../domain/value-objects/AppointmentDetails';

/**
 * Schedule Appointment Command Handler
 * Processes appointment scheduling commands using CQRS pattern
 */
export class ScheduleAppointmentCommandHandler implements ICommandHandler<ScheduleAppointmentCommand, ScheduleAppointmentResponse> {
  constructor(
    private readonly scheduleAppointmentUseCase: ScheduleAppointmentUseCase
  ) {}

  async handle(command: ScheduleAppointmentCommand): Promise<ScheduleAppointmentResponse> {
    try {
      // 1. Validate command
      this.validateCommand(command);

      // 2. Transform command to use case request
      const request = this.transformCommandToRequest(command);

      // 3. Execute use case
      const response = await this.scheduleAppointmentUseCase.execute(request);

      return response;

    } catch (error) {
      return {
        success: false,
        appointmentId: '',
        message: 'Có lỗi xảy ra khi xử lý lệnh đặt lịch hẹn',
        errors: [error instanceof Error ? error.message : 'COMMAND_PROCESSING_ERROR']
      };
    }
  }

  private validateCommand(command: ScheduleAppointmentCommand): void {
    // Basic command validation
    if (!command) {
      throw new Error('Lệnh không được để trống');
    }

    if (!command.commandId) {
      throw new Error('ID lệnh không được để trống');
    }

    if (!command.aggregateId) {
      throw new Error('ID aggregate không được để trống');
    }

    if (!command.issuedBy) {
      throw new Error('Người thực hiện lệnh không được để trống');
    }

    // Patient info validation
    if (!command.patient) {
      throw new Error('Thông tin bệnh nhân không được để trống');
    }

    if (!command.patient.patientId || !command.patient.fullName) {
      throw new Error('ID và tên bệnh nhân không được để trống');
    }

    // Provider info validation
    if (!command.provider) {
      throw new Error('Thông tin nhà cung cấp không được để trống');
    }

    if (!command.provider.providerId || !command.provider.fullName) {
      throw new Error('ID và tên nhà cung cấp không được để trống');
    }

    // Time slot validation
    if (!command.timeSlot) {
      throw new Error('Thông tin khung thời gian không được để trống');
    }

    if (!command.timeSlot.startTime || !command.timeSlot.endTime) {
      throw new Error('Thời gian bắt đầu và kết thúc không được để trống');
    }

    // Appointment details validation
    if (!command.appointmentDetails) {
      throw new Error('Chi tiết cuộc hẹn không được để trống');
    }

    if (!command.appointmentDetails.reason) {
      throw new Error('Lý do khám không được để trống');
    }

    // Appointment type and priority validation
    if (!command.appointmentType) {
      throw new Error('Loại cuộc hẹn không được để trống');
    }

    if (!command.priority) {
      throw new Error('Mức độ ưu tiên không được để trống');
    }

    // Department validation
    if (!command.departmentCode) {
      throw new Error('Mã khoa không được để trống');
    }
  }

  private transformCommandToRequest(command: ScheduleAppointmentCommand): ScheduleAppointmentRequest {
    return {
      // Patient Information
      patientId: command.patient.patientId,
      patientName: command.patient.fullName,
      patientPhone: command.patient.phone,
      patientDateOfBirth: command.patient.dateOfBirth,
      patientNationalId: command.patient.nationalId,
      patientEmail: command.patient.email,
      patientAddress: command.patient.address,
      patientEmergencyContact: command.patient.emergencyContact,
      patientInsuranceNumber: command.patient.insuranceNumber,
      patientInsuranceType: command.patient.insuranceType,

      // Provider Information
      providerId: command.provider.providerId,
      providerName: command.provider.fullName,
      department: command.provider.specialization,
      departmentCode: command.departmentCode,

      // Appointment Details
      appointmentType: this.mapAppointmentType(command.appointmentType),
      priority: this.mapAppointmentPriority(command.priority),
      startTime: new Date(command.timeSlot.startTime),
      endTime: new Date(command.timeSlot.endTime),
      roomId: command.timeSlot.roomId,
      reason: command.appointmentDetails.reason,
      reasonCode: this.mapAppointmentReason(command.appointmentDetails.reasonCode),
      symptoms: command.appointmentDetails.symptoms,
      notes: command.appointmentDetails.notes,
      preparationInstructions: command.appointmentDetails.preparationInstructions,
      estimatedDuration: command.appointmentDetails.estimatedDuration,
      requiresPreparation: command.appointmentDetails.requiresPreparation,
      isFollowUp: command.appointmentDetails.isFollowUp,
      previousAppointmentId: command.appointmentDetails.previousAppointmentId,
      urgencyLevel: command.appointmentDetails.urgencyLevel,
      specialRequirements: command.appointmentDetails.specialRequirements,
      interpreterRequired: command.appointmentDetails.interpreterRequired,
      wheelchairAccessible: command.appointmentDetails.wheelchairAccessible,
      fasting: command.appointmentDetails.fasting,
      medicationRestrictions: command.appointmentDetails.medicationRestrictions,

      // System Information
      createdBy: command.issuedBy
    };
  }

  private mapAppointmentType(type: string): AppointmentType {
    switch (type.toLowerCase()) {
      case 'consultation':
        return AppointmentType.CONSULTATION;
      case 'follow_up':
        return AppointmentType.FOLLOW_UP;
      case 'emergency':
        return AppointmentType.EMERGENCY;
      case 'surgery':
        return AppointmentType.SURGERY;
      case 'diagnostic':
        return AppointmentType.DIAGNOSTIC;
      case 'therapy':
        return AppointmentType.THERAPY;
      case 'vaccination':
        return AppointmentType.VACCINATION;
      case 'checkup':
        return AppointmentType.CHECKUP;
      case 'prescription':
        return AppointmentType.PRESCRIPTION;
      case 'referral':
        return AppointmentType.REFERRAL;
      default:
        return AppointmentType.CONSULTATION;
    }
  }

  private mapAppointmentPriority(priority: string): AppointmentPriority {
    switch (priority.toLowerCase()) {
      case 'low':
        return AppointmentPriority.LOW;
      case 'normal':
        return AppointmentPriority.NORMAL;
      case 'high':
        return AppointmentPriority.HIGH;
      case 'urgent':
        return AppointmentPriority.URGENT;
      case 'emergency':
        return AppointmentPriority.EMERGENCY;
      default:
        return AppointmentPriority.NORMAL;
    }
  }

  private mapAppointmentReason(reasonCode?: string): AppointmentReason | undefined {
    if (!reasonCode) return undefined;

    switch (reasonCode.toLowerCase()) {
      case 'consultation':
        return AppointmentReason.CONSULTATION;
      case 'follow_up':
        return AppointmentReason.FOLLOW_UP;
      case 'emergency':
        return AppointmentReason.EMERGENCY;
      case 'surgery':
        return AppointmentReason.SURGERY;
      case 'diagnostic':
        return AppointmentReason.DIAGNOSTIC;
      case 'therapy':
        return AppointmentReason.THERAPY;
      case 'vaccination':
        return AppointmentReason.VACCINATION;
      case 'checkup':
        return AppointmentReason.CHECKUP;
      case 'prescription':
        return AppointmentReason.PRESCRIPTION;
      case 'referral':
        return AppointmentReason.REFERRAL;
      default:
        return AppointmentReason.CONSULTATION;
    }
  }

  /**
   * Get handler name for logging/debugging
   */
  getHandlerName(): string {
    return 'ScheduleAppointmentCommandHandler';
  }

  /**
   * Check if handler can handle the command
   */
  canHandle(command: any): boolean {
    return command instanceof ScheduleAppointmentCommand || 
           (command && command.commandType === 'ScheduleAppointment');
  }
}
