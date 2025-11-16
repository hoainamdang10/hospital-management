/**
 * GetWaitlistUseCase - Application Layer
 * Retrieves waitlist entries with filters
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IAppointmentWaitlistRepository, WaitlistFilterCriteria } from '../../domain/repositories/IAppointmentWaitlistRepository';
import { WaitlistPriority, WaitlistStatus } from '../../domain/entities/AppointmentWaitlist.entity';

/**
 * Query DTO
 */
export interface GetWaitlistQuery {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  date?: Date;
  appointmentType?: string;
  priority?: WaitlistPriority;
  status?: WaitlistStatus;
  isExpired?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Waitlist entry DTO
 */
export interface WaitlistEntryDTO {
  waitlistId: string;
  patientId: string;
  preferredDoctorId?: string;
  preferredDepartmentId?: string;
  preferredDate?: string;
  preferredTimeSlot?: string;
  appointmentType: string;
  priority: string;
  status: string;
  notes?: string;
  reason?: string;
  isFlexibleDate: boolean;
  isFlexibleTime: boolean;
  isFlexibleDoctor: boolean;
  matchedAppointmentId?: string;
  matchedAt?: string;
  expiresAt?: string;
  contactPhone?: string;
  contactEmail?: string;
  preferredContactMethod: string;
  createdAt: string;
  updatedAt: string;
  position?: number;
}

/**
 * Result DTO
 */
export interface GetWaitlistResult {
  success: boolean;
  entries?: WaitlistEntryDTO[];
  total?: number;
  error?: string;
}

/**
 * Use case for retrieving waitlist entries
 */
export class GetWaitlistUseCase {
  constructor(
    private readonly waitlistRepository: IAppointmentWaitlistRepository
  ) {}

  async execute(query: GetWaitlistQuery): Promise<GetWaitlistResult> {
    try {
      // Build filter criteria
      const criteria: WaitlistFilterCriteria = {
        patientId: query.patientId,
        doctorId: query.doctorId,
        departmentId: query.departmentId,
        date: query.date,
        appointmentType: query.appointmentType,
        priority: query.priority,
        status: query.status,
        isExpired: query.isExpired
      };

      // Get entries
      const entries = await this.waitlistRepository.findWithFilters(
        criteria,
        query.limit || 50,
        query.offset || 0
      );

      // Get total count
      const total = await this.waitlistRepository.count(criteria);

      // Map to DTOs with position
      const entryDTOs: WaitlistEntryDTO[] = await Promise.all(
        entries.map(async (entry) => {
          let position: number | undefined;
          
          // Get position only for WAITING entries
          if (entry.status === WaitlistStatus.WAITING) {
            try {
              position = await this.waitlistRepository.getWaitlistPosition(entry.waitlistId);
            } catch (error) {
              // Ignore position errors
              position = undefined;
            }
          }

          return {
            waitlistId: entry.waitlistId,
            patientId: entry.patientId,
            preferredDoctorId: entry.preferredDoctorId,
            preferredDepartmentId: entry.preferredDepartmentId,
            preferredDate: entry.preferredDate?.toISOString().split('T')[0],
            preferredTimeSlot: entry.preferredTimeSlot,
            appointmentType: entry.appointmentType,
            priority: entry.priority,
            status: entry.status,
            notes: entry.notes,
            reason: entry.reason,
            isFlexibleDate: entry.isFlexibleDate,
            isFlexibleTime: entry.isFlexibleTime,
            isFlexibleDoctor: entry.isFlexibleDoctor,
            matchedAppointmentId: entry.matchedAppointmentId,
            matchedAt: entry.matchedAt?.toISOString(),
            expiresAt: entry.expiresAt?.toISOString(),
            contactPhone: entry.contactPhone,
            contactEmail: entry.contactEmail,
            preferredContactMethod: entry.preferredContactMethod,
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString(),
            position
          };
        })
      );

      return {
        success: true,
        entries: entryDTOs,
        total
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to retrieve waitlist'
      };
    }
  }
}

