/**
 * Get Appointment Details Query - Application Layer
 * CQRS Query to get appointment details with patient/doctor info
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import { AppointmentDetailsDTO } from '../dto/AppointmentDetailsDTO';

export class GetAppointmentDetailsQuery {
  constructor(
    private readModelRepo: IAppointmentReadModelRepository
  ) {}

  /**
   * Execute query to get appointment details
   */
  async execute(appointmentId: string): Promise<AppointmentDetailsDTO> {
    // Query read model
    const readModel = await this.readModelRepo.findById(appointmentId);

    if (!readModel) {
      throw new Error(`Appointment not found: ${appointmentId}`);
    }

    // Map to DTO
    return {
      // Appointment Core
      appointmentId: readModel.appointmentId,
      appointmentDate: readModel.appointmentDate.toISOString().split('T')[0],
      appointmentTime: readModel.appointmentTime,
      durationMinutes: readModel.durationMinutes,
      type: readModel.type,
      priority: readModel.priority,
      status: readModel.status,
      roomId: readModel.roomId,
      departmentId: readModel.departmentId,

      // Patient Information
      patient: {
        patientId: readModel.patientId,
        fullName: readModel.patientFullName,
        phone: readModel.patientPhone,
        email: readModel.patientEmail,
        dateOfBirth: readModel.patientDateOfBirth?.toISOString().split('T')[0],
        gender: readModel.patientGender,
        nationalId: readModel.patientNationalId,
        insuranceNumber: readModel.patientInsuranceNumber,
        insuranceType: readModel.patientInsuranceType,
        address: readModel.patientAddress
      },

      // Doctor Information
      doctor: {
        doctorId: readModel.doctorId,
        fullName: readModel.doctorFullName,
        specialization: readModel.doctorSpecialization,
        department: readModel.doctorDepartment,
        licenseNumber: readModel.doctorLicenseNumber,
        phone: readModel.doctorPhone,
        email: readModel.doctorEmail
      },

      // Appointment Details
      reason: readModel.reason,
      chiefComplaint: readModel.chiefComplaint,
      symptoms: readModel.symptoms,
      notes: readModel.notes,
      specialInstructions: readModel.specialInstructions,
      requiredEquipment: readModel.requiredEquipment,

      // Financial
      consultationFee: readModel.consultationFee,
      additionalFees: readModel.additionalFees,
      paymentStatus: readModel.paymentStatus,

      // Timestamps
      checkedInAt: readModel.checkedInAt?.toISOString(),
      startedAt: readModel.startedAt?.toISOString(),
      completedAt: readModel.completedAt?.toISOString(),
      cancelledAt: readModel.cancelledAt?.toISOString(),
      cancellationReason: readModel.cancellationReason,
      createdAt: readModel.createdAt.toISOString(),
      updatedAt: readModel.updatedAt.toISOString()
    };
  }
}

