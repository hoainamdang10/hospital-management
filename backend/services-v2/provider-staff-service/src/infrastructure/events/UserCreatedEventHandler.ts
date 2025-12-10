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

import { UserCreatedEvent } from "@shared/domain/events/domain-events";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { ILogger } from "../../application/interfaces/ILogger";
import { IAuditService } from "../../application/interfaces/IAuditService";
import { ProviderStaff } from "../../domain/aggregates/ProviderStaff";
import { StaffId } from "../../domain/value-objects/StaffId";
import { PersonalInfo } from "../../domain/value-objects/PersonalInfo";
import { ProfessionalInfo } from "../../domain/value-objects/ProfessionalInfo";
import { WorkSchedule } from "../../domain/value-objects/WorkSchedule";
import { IStaffReadModelRepository } from "../repositories/StaffReadModelRepository";
import { IDepartmentRepository } from "../../domain/repositories/IDepartmentRepository";
import { DepartmentAssignment } from "../../domain/entities/DepartmentAssignment";

/**
 * Handler for UserCreated Event from Identity Service
 * Auto-creates staff profile when user has healthcare role
 */
export class UserCreatedEventHandler {
  constructor(
    private staffRepository: IProviderStaffRepository,
    private logger: ILogger,
    private auditService: IAuditService,
    private staffReadModelRepository: IStaffReadModelRepository,
    private departmentRepository: IDepartmentRepository,
  ) {}

  /**
   * Handle UserCreated event
   * Creates staff profile for healthcare roles
   */
  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      this.logger.info("Handling UserCreated event from Identity Service", {
        userId: event.userId,
        email: event.email,
        roleType: event.roleType,
        eventId: event.eventId,
      });

      // Only create staff profile for healthcare roles
      const healthcareRoles = ["doctor", "nurse"];

      // Check if roleType is defined
      if (!event.roleType) {
        this.logger.info(
          "User role is undefined, skipping staff profile creation",
          {
            userId: event.userId,
            roleType: event.roleType,
          },
        );
        return;
      }

      const normalizedRole = event.roleType.toLowerCase();
      if (!healthcareRoles.includes(normalizedRole)) {
        this.logger.info(
          "User role is not healthcare staff, skipping staff profile creation",
          {
            userId: event.userId,
            roleType: event.roleType,
            normalizedRole,
          },
        );
        return;
      }

      // Check if staff profile already exists
      const existingStaff = await this.staffRepository.findByUserId(
        event.userId,
      );
      if (existingStaff) {
        this.logger.warn("Staff profile already exists for this user", {
          userId: event.userId,
          staffId: existingStaff.id,
        });

        // Ensure read model stays in sync (idempotent)
        await this.staffReadModelRepository.upsertProfile({
          staffId: existingStaff.staffIdValue,
          userId: event.userId,
          fullName: event.fullName || existingStaff.personalInfo.fullName,
          department: event.department || undefined,
        });
        return;
      }

      // Map role type to staff type (use normalized lowercase role)
      const staffType = this.mapRoleToStaffType(normalizedRole);

      // Generate staff ID
      const staffId = await this.generateStaffId(staffType);

      // Fallback: Use email prefix if fullName is not provided
      const fullName = event.fullName || event.email.split("@")[0];

      // Prefer real professional data from event (invitation data)
      const department =
        typeof (event as any).department === "string" &&
        (event as any).department.trim().length > 0
          ? (event as any).department.trim().toUpperCase()
          : this.getDefaultDepartmentCode(staffType);
      const position =
        typeof (event as any).position === "string" &&
        (event as any).position.trim().length > 0
          ? (event as any).position
          : this.getDefaultPosition(staffType);
      const title =
        typeof (event as any).title === "string" &&
        (event as any).title.trim().length > 0
          ? (event as any).title
          : this.getDefaultTitle(staffType);
      const rawEducation = (event as any).education;
      const normalizedEducation = Array.isArray(rawEducation)
        ? rawEducation
        : rawEducation
          ? [String(rawEducation)]
          : [];
      const education =
        normalizedEducation.length > 0
          ? normalizedEducation
          : ["Pending verification"];
      // Ensure license number is unique to avoid violating the DB unique constraint.
      // Prefer invitation payload; otherwise, fall back to a TEMP value.
      let licenseNumber =
        (typeof event.licenseNumber === "string"
          ? event.licenseNumber.trim()
          : "") || `TEMP-${staffId.value}`;

      const existingLicenseOwner =
        licenseNumber.length > 0
          ? await this.staffRepository.findByLicenseNumber(licenseNumber)
          : null;

      if (
        existingLicenseOwner &&
        existingLicenseOwner.userId !== event.userId
      ) {
        // Collision detected -> generate a unique TEMP license number tied to this staffId
        this.logger.warn(
          "License number already in use, generating TEMP license",
          {
            licenseNumber,
            userId: event.userId,
            existingUserId: existingLicenseOwner.userId,
          },
        );
        licenseNumber = `TEMP-${staffId.value}-${Date.now().toString().slice(-6)}`;
      }
      const yearsOfExperience =
        typeof event.yearsOfExperience === "number" &&
        event.yearsOfExperience >= 0
          ? event.yearsOfExperience
          : 0;
      // Consultation fee: prefer event payload, fallback to default (500k VND)
      const consultationFee =
        typeof (event as any).consultationFee === "number"
          ? (event as any).consultationFee
          : 500_000;

      // Create PersonalInfo (prefer event data, fallback to safe defaults)
      const fallbackAddress = {
        street: "Chưa cập nhật",
        ward: "Chưa cập nhật",
        district: "Chưa cập nhật",
        city: "Chưa cập nhật",
        province: "Chưa cập nhật",
        country: "Vietnam",
      };

      const safeDateOfBirth = (() => {
        const rawDob = (event as any).dateOfBirth;
        if (rawDob) {
          const parsed = new Date(rawDob);
          if (!isNaN(parsed.getTime())) {
            return parsed;
          }
        }
        return new Date("1990-01-01");
      })();

      const address =
        (event as any).address && typeof (event as any).address === "object"
          ? ((event as any).address as any)
          : fallbackAddress;

      const personalInfo = PersonalInfo.create({
        fullName: fullName,
        dateOfBirth: safeDateOfBirth,
        gender: (event.gender as any) || "other",
        nationalId: event.citizenId || "000000000",
        nationality: "Vietnamese",
        phoneNumber: event.phoneNumber || "0000000000",
        email: event.email,
        address,
      });

      // Create ProfessionalInfo (use event data when available)
      const professionalInfo = ProfessionalInfo.create({
        title,
        department,
        position,
        education,
        languages:
          Array.isArray((event as any).languages) &&
          (event as any).languages.length > 0
            ? (event as any).languages
            : ["Vietnamese", "English"],
      });

      // Create WorkSchedule (prefer event-provided)
      const eventWorkSchedule = (event as any).workSchedule as any;
      const workSchedule = eventWorkSchedule
        ? WorkSchedule.create({
            workingDays: eventWorkSchedule.workingDays || [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
            ],
            workingHours: {
              start: eventWorkSchedule?.workingHours?.start || "08:00",
              end: eventWorkSchedule?.workingHours?.end || "17:00",
            },
            timeZone: eventWorkSchedule.timeZone || "Asia/Ho_Chi_Minh",
            isFlexible: eventWorkSchedule.isFlexible ?? false,
          })
        : WorkSchedule.create({
            workingDays: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
            ],
            workingHours: {
              start: "08:00",
              end: "17:00",
            },
            timeZone: "Asia/Ho_Chi_Minh",
            isFlexible: false,
          });

      // Create ProviderStaff aggregate
      const staff = ProviderStaff.create(
        event.userId,
        staffType,
        personalInfo,
        professionalInfo,
        workSchedule,
        licenseNumber,
        (event as any).employmentType || "full_time",
        new Date(), // hireDate
        yearsOfExperience,
        undefined,
        undefined,
        department,
      );

      // Set default consultation fee for doctors (persisted to staff_profiles)
      if (staffType === "doctor") {
        staff.updateConsultationFee(
          (event as any).consultationFee ?? consultationFee,
        );
      }

      // Save staff profile
      await this.staffRepository.save(staff);

      // 🔧 FIX: Assign staff to department based on departmentCode from event
      // This populates department_assignments so staff appears in search results
      try {
        const departmentCode = department || "INTE"; // Fallback to INTE if no department
        const foundDepartment =
          await this.departmentRepository.findByCode(departmentCode);

        if (foundDepartment) {
          const departmentAssignment = DepartmentAssignment.create({
            departmentId: foundDepartment.id,
            departmentCode: foundDepartment.code,
            departmentNameEn: foundDepartment.nameEn,
            departmentNameVi: foundDepartment.nameVi,
            role: staffType === "doctor" ? "Doctor" : "Staff",
            isPrimary: true,
            isActive: true,
            startDate: new Date(),
          });

          staff.assignToDepartment(departmentAssignment);
          await this.staffRepository.save(staff); // Save again with department assignment

          this.logger.info("Staff assigned to department successfully", {
            userId: event.userId,
            staffId: staff.staffIdValue,
            departmentId: foundDepartment.id,
            departmentCode: foundDepartment.code,
          });
        } else {
          this.logger.warn(
            "Department not found for code, skipping assignment",
            {
              userId: event.userId,
              departmentCode,
            },
          );
        }
      } catch (err) {
        this.logger.error("Failed to assign staff to department", {
          userId: event.userId,
          staffId: staff.staffIdValue,
          error: err instanceof Error ? err.message : "Unknown error",
        });
        // Don't fail the whole process if department assignment fails
      }

      // Create read model entry (denormalized) for search/listing
      try {
        await this.staffReadModelRepository.upsertProfile({
          staffId: staff.staffIdValue,
          userId: event.userId,
          fullName,
          department: department || undefined,
        });
      } catch (err) {
        this.logger.error("Failed to create staff read model", {
          userId: event.userId,
          staffId: staff.id,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      this.logger.info(
        "Staff profile created successfully from UserCreated event",
        {
          userId: event.userId,
          staffId: staff.id,
          staffType,
        },
      );

      // HIPAA audit logging
      await this.auditService.logDataModification({
        action: "CREATE_STAFF_FROM_USER_EVENT",
        resourceType: "ProviderStaff",
        resourceId: staff.id,
        userId: event.userId,
        timestamp: new Date(),
        details: {
          eventId: event.eventId,
          eventType: "UserCreated",
          staffType,
          consultationFee,
          source: "identity-service",
          autoCreated: true,
        },
        ipAddress: undefined,
        userAgent: undefined,
        sessionId: undefined,
      });

      // Publish StaffRegistered event (domain events will be published by aggregate)
      // The aggregate's domain events will be handled by StaffDomainEventHandler
    } catch (error) {
      this.logger.error("Error handling UserCreated event", {
        userId: event.userId,
        eventId: event.eventId,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  /**
   * Map Identity Service role to Staff type (scope reduced to 2 types)
   */
  private mapRoleToStaffType(roleType: string): "doctor" | "receptionist" {
    const roleMap: Record<string, "doctor" | "receptionist"> = {
      DOCTOR: "doctor",
      RECEPTIONIST: "receptionist",
      ADMIN: "receptionist", // Admin staff are receptionists in provider context
      // Legacy support (fallback to receptionist)
      NURSE: "receptionist",
      doctor: "doctor",
      nurse: "receptionist",
      receptionist: "receptionist",
    };

    return roleMap[roleType] || "receptionist";
  }

  /**
   * Generate unique staff ID
   * Uses domain StaffId.generate() to avoid race conditions
   */
  private async generateStaffId(staffType: string): Promise<StaffId> {
    // Use domain's StaffId.generate() which handles sequence generation properly
    // Map string to StaffType enum for type safety (scope reduced to 2 types)
    const staffTypeMap: Record<string, "doctor" | "receptionist"> = {
      doctor: "doctor",
      receptionist: "receptionist",
      // Legacy mappings (fallback to receptionist)
      nurse: "receptionist",
      admin: "receptionist",
    };

    //  Map role to department for proper ID generation
    const departmentMap: Record<string, string> = {
      doctor: "INTE", // General practitioners -> Internal Medicine
      receptionist: "ADMI", // Receptionist -> Administration
      // Legacy mappings
      nurse: "ADMI",
      admin: "ADMI",
    };

    const validStaffType = staffTypeMap[staffType] || "receptionist";
    const departmentCode = departmentMap[staffType] || "ADMI";

    return StaffId.generate(validStaffType, departmentCode);
  }

  /**
   * Get default title based on staff type
   */
  private getDefaultTitle(staffType: string): string {
    const titleMap: Record<string, string> = {
      doctor: "Bác sĩ",
      nurse: "Điều dưỡng",
      admin: "Quản trị viên",
      receptionist: "Lễ tân",
    };

    return titleMap[staffType] || "Nhân viên";
  }

  /**
   * Get default position based on staff type
   */
  private getDefaultPosition(staffType: string): string {
    const positionMap: Record<string, string> = {
      doctor: "Bác sĩ điều trị",
      nurse: "Điều dưỡng viên",
      admin: "Quản trị viên hệ thống",
      receptionist: "Nhân viên lễ tân",
    };

    return positionMap[staffType] || "Nhân viên y tế";
  }

  private getDefaultDepartmentCode(staffType: string): string {
    return staffType === "doctor" ? "INTE" : "ADMI";
  }
}
