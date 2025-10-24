/**
 * UserCreatedEventHandler - Identity Service Event Consumer
 * Provider/Staff Service V2
 * 
 * Handles UserCreated events from Identity Service to auto-create staff profiles
 * for users with healthcare roles (DOCTOR, NURSE, TECHNICIAN, PHARMACIST)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Clean Architecture, HIPAA
 */

import { UserCreatedEvent } from '@shared/domain/events/domain-events';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../domain/value-objects/ProfessionalInfo';
import { WorkSchedule } from '../../domain/value-objects/WorkSchedule';

/**
 * Handler for UserCreated Event from Identity Service
 * Auto-creates staff profile when user has healthcare role
 */
export class UserCreatedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService: IAuditService
  ) {}

  /**
   * Handle UserCreated event
   * Creates staff profile for healthcare roles
   */
  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      this.logger.info('Handling UserCreated event from Identity Service', {
        userId: event.userId,
        email: event.email,
        roleType: event.roleType,
        eventId: event.eventId
      });

      // Only create staff profile for healthcare roles
      const healthcareRoles = ['doctor', 'nurse', 'technician', 'pharmacist', 'therapist'];
      if (!healthcareRoles.includes(event.roleType)) {
        this.logger.info('User role is not healthcare staff, skipping staff profile creation', {
          userId: event.userId,
          roleType: event.roleType
        });
        return;
      }

      // Check if staff profile already exists
      const existingStaff = await this.staffRepository.findByUserId(event.userId);
      if (existingStaff) {
        this.logger.warn('Staff profile already exists for this user', {
          userId: event.userId,
          staffId: existingStaff.id
        });
        return;
      }

      // Map role type to staff type
      const staffType = this.mapRoleToStaffType(event.roleType);

      // Generate staff ID
      const staffId = await this.generateStaffId(staffType);

      // Create PersonalInfo
      const personalInfo = PersonalInfo.create({
        fullName: event.fullName,
        dateOfBirth: new Date('1990-01-01'), // Default, should be updated later
        gender: 'other', // Default, should be updated later
        nationalId: event.citizenId || '',
        nationality: 'Vietnamese',
        phoneNumber: event.phoneNumber || '',
        email: event.email,
        address: {
          street: '',
          ward: '',
          district: '',
          city: '',
          province: '',
          country: 'Vietnam'
        }
      });

      // Create ProfessionalInfo
      const professionalInfo = ProfessionalInfo.create({
        title: this.getDefaultTitle(staffType),
        department: 'GENERAL', // Default department
        position: this.getDefaultPosition(staffType),
        education: ['Pending verification'], // Should be updated later
        languages: ['Vietnamese', 'English']
      });

      // Create default WorkSchedule
      const workSchedule = WorkSchedule.create({
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        workingHours: {
          start: '08:00',
          end: '17:00'
        },
        timeZone: 'Asia/Ho_Chi_Minh',
        isFlexible: false
      });

      // Create ProviderStaff aggregate
      const staff = ProviderStaff.create(
        event.userId,
        staffType,
        personalInfo,
        professionalInfo,
        workSchedule,
        `TEMP-${staffId.value}`, // licenseNumber - Temporary, should be updated
        'full_time', // employmentType - Default
        new Date(), // hireDate
        0 // yearsOfExperience - Default
      );

      // Save staff profile
      await this.staffRepository.save(staff);

      this.logger.info('Staff profile created successfully from UserCreated event', {
        userId: event.userId,
        staffId: staff.id,
        staffType
      });

      // HIPAA audit logging
      await this.auditService.logDataModification({
        action: 'CREATE_STAFF_FROM_USER_EVENT',
        resourceType: 'ProviderStaff',
        resourceId: staff.id,
        userId: event.userId,
        timestamp: new Date(),
        details: {
          eventId: event.eventId,
          eventType: 'UserCreated',
          staffType,
          source: 'identity-service',
          autoCreated: true
        },
        ipAddress: undefined,
        userAgent: undefined,
        sessionId: undefined
      });

      // Publish StaffRegistered event (domain events will be published by aggregate)
      // The aggregate's domain events will be handled by StaffDomainEventHandler

    } catch (error) {
      this.logger.error('Error handling UserCreated event', {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Map Identity Service role to Staff type
   */
  private mapRoleToStaffType(roleType: string): 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist' {
    const roleMap: Record<string, 'doctor' | 'nurse' | 'technician' | 'pharmacist' | 'therapist'> = {
      'doctor': 'doctor',
      'nurse': 'nurse',
      'technician': 'technician',
      'pharmacist': 'pharmacist',
      'therapist': 'therapist'
    };

    return roleMap[roleType] || 'technician';
  }

  /**
   * Generate unique staff ID
   * Uses domain StaffId.generate() to avoid race conditions
   */
  private async generateStaffId(staffType: string): Promise<StaffId> {
    // Use domain's StaffId.generate() which handles sequence generation properly
    return StaffId.generate(staffType as any);
  }



  /**
   * Get default title based on staff type
   */
  private getDefaultTitle(staffType: string): string {
    const titleMap: Record<string, string> = {
      'doctor': 'Bác sĩ',
      'nurse': 'Điều dưỡng',
      'technician': 'Kỹ thuật viên',
      'pharmacist': 'Dược sĩ',
      'therapist': 'Chuyên viên trị liệu'
    };

    return titleMap[staffType] || 'Nhân viên';
  }

  /**
   * Get default position based on staff type
   */
  private getDefaultPosition(staffType: string): string {
    const positionMap: Record<string, string> = {
      'doctor': 'Bác sĩ điều trị',
      'nurse': 'Điều dưỡng viên',
      'technician': 'Kỹ thuật viên y tế',
      'pharmacist': 'Dược sĩ lâm sàng',
      'therapist': 'Chuyên viên trị liệu'
    };

    return positionMap[staffType] || 'Nhân viên y tế';
  }
}
