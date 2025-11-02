/**
 * List Appointments Query - Application Layer
 * CQRS Query to list appointments with filters and pagination
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IAppointmentReadModelRepository } from '../../domain/repositories/IAppointmentReadModelRepository';
import { AppointmentReadModelFilters } from '../../domain/read-models/AppointmentReadModel';
import { AppointmentListItemDTO, AppointmentListResponseDTO } from '../dto/AppointmentDetailsDTO';

export interface ListAppointmentsQueryParams {
  patientId?: string;
  doctorId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: string;
  type?: string;
  priority?: string;
  departmentId?: string;
  page?: number;
  pageSize?: number;
}

export class ListAppointmentsQuery {
  constructor(
    private readModelRepo: IAppointmentReadModelRepository
  ) {}

  /**
   * Execute query to list appointments
   */
  async execute(params: ListAppointmentsQueryParams): Promise<AppointmentListResponseDTO> {
    // Default pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 20;
    const offset = (page - 1) * pageSize;

    // Build filters
    const filters: AppointmentReadModelFilters = {
      patientId: params.patientId,
      doctorId: params.doctorId,
      startDate: params.startDate,
      endDate: params.endDate,
      status: params.status,
      type: params.type,
      priority: params.priority,
      departmentId: params.departmentId,
      limit: pageSize,
      offset
    };

    // Query read model
    const [appointments, total] = await Promise.all([
      this.readModelRepo.findWithFilters(filters),
      this.readModelRepo.countWithFilters(filters)
    ]);

    // Map to DTOs
    const appointmentDTOs: AppointmentListItemDTO[] = appointments.map(readModel => ({
      appointmentId: readModel.appointmentId,
      appointmentDate: readModel.appointmentDate.toISOString().split('T')[0],
      appointmentTime: readModel.appointmentTime,
      durationMinutes: readModel.durationMinutes,
      type: readModel.type,
      priority: readModel.priority,
      status: readModel.status,

      patientId: readModel.patientId,
      patientFullName: readModel.patientFullName,
      patientPhone: readModel.patientPhone,

      doctorId: readModel.doctorId,
      doctorFullName: readModel.doctorFullName,
      doctorSpecialization: readModel.doctorSpecialization,

      consultationFee: readModel.consultationFee, // Billing reference only

      createdAt: readModel.createdAt.toISOString()
    }));

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize);

    return {
      appointments: appointmentDTOs,
      total,
      page,
      pageSize,
      totalPages
    };
  }
}

