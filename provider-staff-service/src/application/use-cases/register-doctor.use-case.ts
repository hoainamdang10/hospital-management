/**
 * Register Doctor Use Case - Application Layer
 * CQRS Command Handler for doctor registration with healthcare compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase } from '../../../shared/application/use-cases/base/use-case.interface';
import { RegisterDoctorCommand } from '../commands/register-doctor.command';
import { RegisterDoctorResponse } from '../dtos/doctor-response.dto';
import { Doctor, PersonalInfo, EmploymentInfo } from '../../domain/aggregates/doctor.aggregate';
import { MedicalCredentials } from '../../domain/value-objects/medical-credentials';
import { WorkSchedule } from '../../domain/value-objects/work-schedule';
import { IDoctorRepository } from '../../domain/repositories/doctor.repository';
import { IEventPublisher } from '../../../shared/domain/events/event-publisher.interface';
import { ILogger } from '../../../shared/infrastructure/logging/logger.interface';
import { IAuthorizationService } from '../../../shared/application/services/authorization.service.interface';
import { IAuditService } from '../../../shared/application/services/audit.service.interface';
import { StaffFactoryRegistry } from '../../domain/factories/staff.factory';
import { ProviderType } from '../../domain/strategies/provider-type.strategy';

export interface RegisterDoctorUseCaseDependencies {
  doctorRepository: IDoctorRepository;
  eventPublisher: IEventPublisher;
  logger: ILogger;
  authorizationService: IAuthorizationService;
  auditService: IAuditService;
}

/**
 * Register Doctor Use Case
 * Handles the complete workflow of registering a new doctor
 */
export class RegisterDoctorUseCase implements BaseHealthcareUseCase<RegisterDoctorCommand, RegisterDoctorResponse> {
  constructor(private dependencies: RegisterDoctorUseCaseDependencies) {}

  /**
   * Execute the use case
   */
  async execute(command: RegisterDoctorCommand): Promise<RegisterDoctorResponse> {
    const { doctorRepository, eventPublisher, logger, authorizationService, auditService } = this.dependencies;

    try {
      // 1. Validate command
      logger.info('Validating register doctor command', { 
        commandId: command.commandId,
        doctorName: command.getPersonalInfo().fullName,
        department: command.getEmployment().department
      });

      const validation = command.validate();
      if (!validation.isValid) {
        logger.warn('Command validation failed', { 
          commandId: command.commandId,
          errors: validation.errors 
        });

        return {
          success: false,
          doctorId: '',
          doctor: {} as any,
          validationResults: {
            errors: validation.errors,
            warnings: validation.warnings,
            recommendations: validation.recommendations
          },
          integrationEvents: {
            userAccountCreated: false,
            schedulingSetup: false,
            notificationsInitialized: false
          },
          nextSteps: [],
          message: `Đăng ký bác sĩ thất bại: ${validation.errors.join(', ')}`
        };
      }

      // 2. Authorization check
      logger.info('Checking authorization', { 
        commandId: command.commandId,
        userId: command.userId 
      });

      const isAuthorized = await authorizationService.authorize(
        command.userId!,
        ['create_doctor', 'manage_staff'],
        'doctor_registration',
        command.correlationId
      );

      if (!isAuthorized) {
        logger.warn('Authorization failed', { 
          commandId: command.commandId,
          userId: command.userId 
        });

        await auditService.logUnauthorizedAccess(
          command.userId!,
          'register_doctor',
          'Attempted to register doctor without permission',
          command.correlationId
        );

        throw new Error('Không có quyền đăng ký bác sĩ');
      }

      // 3. Check for duplicate doctor
      logger.info('Checking for duplicate doctor', { 
        commandId: command.commandId,
        email: command.getPersonalInfo().email,
        nationalId: command.getPersonalInfo().nationalId
      });

      const existingDoctorByEmail = await doctorRepository.findByEmail(command.getPersonalInfo().email);
      if (existingDoctorByEmail) {
        logger.warn('Doctor with email already exists', { 
          commandId: command.commandId,
          email: command.getPersonalInfo().email,
          existingDoctorId: existingDoctorByEmail.doctorId.value
        });

        return {
          success: false,
          doctorId: '',
          doctor: {} as any,
          validationResults: {
            errors: [`Bác sĩ với email ${command.getPersonalInfo().email} đã tồn tại`],
            warnings: validation.warnings,
            recommendations: validation.recommendations
          },
          integrationEvents: {
            userAccountCreated: false,
            schedulingSetup: false,
            notificationsInitialized: false
          },
          nextSteps: [],
          message: 'Đăng ký bác sĩ thất bại: Email đã được sử dụng'
        };
      }

      const existingDoctorByNationalId = await doctorRepository.findByNationalId(command.getPersonalInfo().nationalId);
      if (existingDoctorByNationalId) {
        logger.warn('Doctor with national ID already exists', { 
          commandId: command.commandId,
          nationalId: command.getPersonalInfo().nationalId,
          existingDoctorId: existingDoctorByNationalId.doctorId.value
        });

        return {
          success: false,
          doctorId: '',
          doctor: {} as any,
          validationResults: {
            errors: [`Bác sĩ với CMND/CCCD ${command.getPersonalInfo().nationalId} đã tồn tại`],
            warnings: validation.warnings,
            recommendations: validation.recommendations
          },
          integrationEvents: {
            userAccountCreated: false,
            schedulingSetup: false,
            notificationsInitialized: false
          },
          nextSteps: [],
          message: 'Đăng ký bác sĩ thất bại: CMND/CCCD đã được sử dụng'
        };
      }

      // 4. Create doctor using domain factory
      logger.info('Creating doctor aggregate', { 
        commandId: command.commandId,
        department: command.getEmployment().department
      });

      const personalInfo = this.mapToPersonalInfo(command.getPersonalInfo());
      const credentials = this.mapToMedicalCredentials(command.getCredentials());
      const employmentInfo = this.mapToEmploymentInfo(command.getEmployment());
      const workSchedule = this.generateWorkSchedule(command);

      const doctor = Doctor.create(
        personalInfo,
        credentials,
        command.getEmployment().department,
        employmentInfo,
        workSchedule,
        command.getData().notes
      );

      // 5. Additional validation using factory
      logger.info('Validating doctor using factory patterns', { 
        commandId: command.commandId,
        doctorId: doctor.doctorId.value
      });

      const factoryValidation = StaffFactoryRegistry.validateStaffRequest({
        fullName: personalInfo.fullName,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        nationalId: personalInfo.nationalId,
        phone: personalInfo.phone,
        email: personalInfo.email,
        address: personalInfo.address,
        emergencyContact: personalInfo.emergencyContact,
        providerType: ProviderType.DOCTOR,
        department: command.getEmployment().department,
        specializations: credentials.specializations,
        medicalLicenseNumber: credentials.medicalLicenseNumber,
        licenseType: credentials.licenseType,
        educationLevel: credentials.educationLevel,
        medicalSchool: credentials.medicalSchool,
        graduationYear: credentials.graduationYear,
        certifications: credentials.certifications.map(cert => ({
          name: cert.name,
          issuingOrganization: cert.issuingOrganization,
          issueDate: cert.issueDate,
          expirationDate: cert.expirationDate,
          certificationNumber: cert.certificationNumber
        })),
        preferredShifts: command.getWorkPreferences().preferredShifts,
        canWorkNightShifts: command.getWorkPreferences().canWorkNightShifts,
        canWorkWeekends: command.getWorkPreferences().canWorkWeekends,
        emergencyAvailability: command.getWorkPreferences().emergencyAvailability,
        maxWeeklyHours: command.getWorkPreferences().maxWeeklyHours,
        hireDate: employmentInfo.hireDate,
        salary: employmentInfo.salary,
        employmentType: employmentInfo.employmentType,
        probationPeriod: command.getEmployment().probationPeriodMonths
      });

      if (factoryValidation.length > 0) {
        logger.warn('Factory validation failed', { 
          commandId: command.commandId,
          factoryErrors: factoryValidation
        });

        validation.warnings.push(...factoryValidation);
      }

      // 6. Save doctor to repository
      logger.info('Saving doctor to repository', { 
        commandId: command.commandId,
        doctorId: doctor.doctorId.value
      });

      await doctorRepository.save(doctor);

      // 7. Publish domain events
      logger.info('Publishing domain events', { 
        commandId: command.commandId,
        doctorId: doctor.doctorId.value,
        eventCount: doctor.getDomainEvents().length
      });

      const domainEvents = doctor.getDomainEvents();
      for (const event of domainEvents) {
        await eventPublisher.publish(event);
      }

      doctor.clearDomainEvents();

      // 8. Audit logging
      await auditService.logDoctorRegistration(
        doctor.doctorId.value,
        command.userId!,
        'Doctor registered successfully',
        {
          department: doctor.department,
          specializations: doctor.credentials.specializations,
          competencyScore: doctor.competencyScore
        },
        command.correlationId
      );

      // 9. Generate response
      logger.info('Doctor registration completed successfully', { 
        commandId: command.commandId,
        doctorId: doctor.doctorId.value,
        competencyScore: doctor.competencyScore
      });

      const response: RegisterDoctorResponse = {
        success: true,
        doctorId: doctor.doctorId.value,
        doctor: {
          id: doctor.id!,
          doctorId: doctor.doctorId.value,
          fullName: doctor.personalInfo.fullName,
          department: doctor.department,
          departmentNameVietnamese: doctor.doctorId.getDepartmentNameVietnamese(),
          specializations: doctor.credentials.specializations,
          status: doctor.status,
          statusVietnamese: 'Đang hoạt động',
          competencyScore: doctor.competencyScore,
          isActive: doctor.isActive(),
          lastActiveDate: doctor.lastActiveDate?.toISOString()
        },
        validationResults: {
          errors: [],
          warnings: validation.warnings,
          recommendations: validation.recommendations
        },
        integrationEvents: {
          userAccountCreated: true, // Will be handled by event handlers
          schedulingSetup: true,    // Will be handled by event handlers
          notificationsInitialized: true // Will be handled by event handlers
        },
        nextSteps: this.generateNextSteps(doctor, command),
        message: `Đăng ký bác sĩ ${doctor.personalInfo.fullName} thành công với ID: ${doctor.doctorId.value}`
      };

      return response;

    } catch (error) {
      logger.error('Error in register doctor use case', {
        commandId: command.commandId,
        error: error.message,
        stack: error.stack
      });

      // Audit error
      await auditService.logError(
        command.userId!,
        'register_doctor',
        error.message,
        command.correlationId
      );

      return {
        success: false,
        doctorId: '',
        doctor: {} as any,
        validationResults: {
          errors: [error.message],
          warnings: [],
          recommendations: []
        },
        integrationEvents: {
          userAccountCreated: false,
          schedulingSetup: false,
          notificationsInitialized: false
        },
        nextSteps: ['Liên hệ quản trị viên hệ thống'],
        message: `Đăng ký bác sĩ thất bại: ${error.message}`
      };
    }
  }

  /**
   * Private helper methods
   */

  private mapToPersonalInfo(commandPersonalInfo: any): PersonalInfo {
    return {
      fullName: commandPersonalInfo.fullName,
      dateOfBirth: new Date(commandPersonalInfo.dateOfBirth),
      gender: commandPersonalInfo.gender,
      nationalId: commandPersonalInfo.nationalId,
      phone: commandPersonalInfo.phone,
      email: commandPersonalInfo.email,
      address: commandPersonalInfo.address,
      emergencyContact: {
        name: commandPersonalInfo.emergencyContact.name,
        relationship: commandPersonalInfo.emergencyContact.relationship,
        phone: commandPersonalInfo.emergencyContact.phone,
        email: commandPersonalInfo.emergencyContact.email
      }
    };
  }

  private mapToMedicalCredentials(commandCredentials: any): MedicalCredentials {
    return MedicalCredentials.create(
      commandCredentials.medicalLicenseNumber,
      commandCredentials.licenseType,
      commandCredentials.issuingAuthority,
      new Date(commandCredentials.licenseIssueDate),
      new Date(commandCredentials.licenseExpirationDate),
      commandCredentials.specializations,
      commandCredentials.certifications.map((cert: any) => ({
        name: cert.name,
        issuingOrganization: cert.issuingOrganization,
        issueDate: new Date(cert.issueDate),
        expirationDate: cert.expirationDate ? new Date(cert.expirationDate) : undefined,
        certificationNumber: cert.certificationNumber,
        isValid: true
      })),
      commandCredentials.educationLevel,
      commandCredentials.medicalSchool,
      commandCredentials.graduationYear,
      commandCredentials.residencyProgram,
      commandCredentials.fellowshipProgram
    );
  }

  private mapToEmploymentInfo(commandEmployment: any): EmploymentInfo {
    return {
      hireDate: new Date(commandEmployment.hireDate),
      employmentType: commandEmployment.employmentType,
      salary: commandEmployment.salary,
      probationEndDate: commandEmployment.probationPeriodMonths > 0 ? 
        new Date(new Date(commandEmployment.hireDate).getTime() + commandEmployment.probationPeriodMonths * 30 * 24 * 60 * 60 * 1000) : 
        undefined,
      contractEndDate: commandEmployment.contractEndDate ? new Date(commandEmployment.contractEndDate) : undefined,
      supervisorId: commandEmployment.supervisorId,
      mentorId: commandEmployment.mentorId
    };
  }

  private generateWorkSchedule(command: RegisterDoctorCommand): WorkSchedule {
    // Generate basic work schedule based on preferences
    const shifts = [];
    const workPrefs = command.getWorkPreferences();
    const employment = command.getEmployment();

    // Create default shifts based on department and preferences
    if (workPrefs.preferredShifts.includes('morning')) {
      // Add morning shifts Monday to Friday
      for (let day = 1; day <= 5; day++) {
        shifts.push({
          id: `shift-${Date.now()}-${day}`,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '17:00',
          shiftType: 'morning' as any,
          department: employment.department,
          isRecurring: true,
          effectiveDate: new Date(employment.hireDate)
        });
      }
    }

    return WorkSchedule.create(
      shifts,
      workPrefs.emergencyAvailability,
      workPrefs.canWorkNightShifts,
      workPrefs.canWorkWeekends
    );
  }

  private generateNextSteps(doctor: Doctor, command: RegisterDoctorCommand): string[] {
    const nextSteps: string[] = [];

    // Standard next steps
    nextSteps.push('Hoàn thành thủ tục nhân sự');
    nextSteps.push('Tham gia định hướng nhân viên mới');
    nextSteps.push('Thiết lập tài khoản hệ thống bệnh viện');

    // Experience-based steps
    if (command.isJuniorDoctor()) {
      nextSteps.push('Phân công mentor cho bác sĩ mới');
      nextSteps.push('Đăng ký chương trình đào tạo cho bác sĩ mới');
    }

    // Department-specific steps
    if (command.getEmployment().department === 'EMERGENCY') {
      nextSteps.push('Đào tạo quy trình cấp cứu của bệnh viện');
      nextSteps.push('Làm quen với thiết bị cấp cứu');
    }

    if (command.canPerformSurgery()) {
      nextSteps.push('Kiểm tra kỹ năng phẫu thuật');
      nextSteps.push('Làm quen với phòng mổ và thiết bị');
    }

    // License-related steps
    if (doctor.credentials.getDaysUntilExpiration() < 180) {
      nextSteps.push('Chuẩn bị gia hạn giấy phép hành nghề');
    }

    return nextSteps;
  }
}
