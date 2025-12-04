/**
 * Appointment Read Model Repository Interface - Domain Layer
 * CQRS Read Model Repository for querying denormalized appointment data
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

import {
  AppointmentReadModel,
  CreateAppointmentReadModelData,
  PatientData,
  DoctorData,
  AppointmentReadModelFilters,
} from "../read-models/AppointmentReadModel";

export interface IAppointmentReadModelRepository {
  /**
   * Create new read model entry
   */
  create(data: CreateAppointmentReadModelData): Promise<AppointmentReadModel>;

  /**
   * Update patient data for all appointments with this patientId
   */
  updatePatientData(
    patientId: string,
    patientData: PatientData,
  ): Promise<number>;

  /**
   * Update doctor data for all appointments with this doctorId
   */
  updateDoctorData(doctorId: string, doctorData: DoctorData): Promise<number>;

  /**
   * Update appointment status
   */
  updateStatus(appointmentId: string, status: string): Promise<void>;

  /**
   * Update payment status
   */
  updatePaymentStatus(
    appointmentId: string,
    paymentStatus: string,
  ): Promise<void>;

  /**
   * Update cancellation metadata (timestamp + reason)
   */
  updateCancellationDetails(
    appointmentId: string,
    cancelledAt?: Date,
    cancellationReason?: string,
  ): Promise<void>;

  /**
   * Update appointment core schedule fields when rescheduled
   */
  updateSchedule(
    appointmentId: string,
    appointmentDate: Date,
    appointmentTime: string,
    durationMinutes: number,
    status?: string,
  ): Promise<void>;

  /**
   * Find by appointment ID
   */
  findById(appointmentId: string): Promise<AppointmentReadModel | null>;

  /**
   * Find by patient ID
   */
  findByPatientId(patientId: string): Promise<AppointmentReadModel[]>;

  /**
   * Find by doctor ID
   */
  findByDoctorId(doctorId: string): Promise<AppointmentReadModel[]>;

  /**
   * Find by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<AppointmentReadModel[]>;

  /**
   * Find with filters
   */
  findWithFilters(
    filters: AppointmentReadModelFilters,
  ): Promise<AppointmentReadModel[]>;

  /**
   * Count appointments with filters
   */
  countWithFilters(filters: AppointmentReadModelFilters): Promise<number>;

  /**
   * Delete read model entry
   */
  delete(appointmentId: string): Promise<void>;
}
