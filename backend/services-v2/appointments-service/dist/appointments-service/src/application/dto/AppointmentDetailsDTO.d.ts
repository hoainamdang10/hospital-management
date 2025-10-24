/**
 * Appointment Details DTO - Application Layer
 * Data Transfer Object for appointment details with patient/doctor info
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */
export interface AppointmentDetailsDTO {
    appointmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    roomId?: string;
    departmentId?: string;
    patient: {
        patientId: string;
        fullName?: string;
        phone?: string;
        email?: string;
        dateOfBirth?: string;
        gender?: string;
        nationalId?: string;
        insuranceNumber?: string;
        insuranceType?: string;
        address?: string;
    };
    doctor: {
        doctorId: string;
        fullName?: string;
        specialization?: string;
        department?: string;
        licenseNumber?: string;
        phone?: string;
        email?: string;
    };
    reason?: string;
    chiefComplaint?: string;
    symptoms?: string[];
    notes?: string;
    specialInstructions?: string;
    requiredEquipment?: string[];
    consultationFee: number;
    additionalFees?: number;
    paymentStatus: string;
    checkedInAt?: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
    createdAt: string;
    updatedAt: string;
}
export interface AppointmentListItemDTO {
    appointmentId: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    patientId: string;
    patientFullName?: string;
    patientPhone?: string;
    doctorId: string;
    doctorFullName?: string;
    doctorSpecialization?: string;
    consultationFee: number;
    paymentStatus: string;
    createdAt: string;
}
export interface AppointmentListResponseDTO {
    appointments: AppointmentListItemDTO[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}
//# sourceMappingURL=AppointmentDetailsDTO.d.ts.map