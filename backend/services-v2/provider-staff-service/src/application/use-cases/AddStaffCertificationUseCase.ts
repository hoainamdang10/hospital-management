/**
 * AddStaffCertificationUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Adds certification to staff profile
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IUseCase } from '@shared/application/use-cases/base/use-case.interface';
import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { StaffCertification } from '../../domain/entities/StaffCertification';
import { ILogger } from '../interfaces/ILogger';

export interface AddStaffCertificationRequest {
  staffId: string;
  certification: {
    certificationNumber: string;
    certificationType: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate?: string;
    isValid: boolean;
    verificationUrl?: string;
  };
  addedBy: string;
  addedByRole: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface AddStaffCertificationResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    staffId: string;
    certificationId: string;
    addedAt: string;
  };
}

/**
 * Add Staff Certification Use Case
 */
export class AddStaffCertificationUseCase implements IUseCase<AddStaffCertificationRequest, AddStaffCertificationResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: AddStaffCertificationRequest): Promise<AddStaffCertificationResponse> {
    return await this.executeImpl(request);
  }

  private async executeImpl(request: AddStaffCertificationRequest): Promise<AddStaffCertificationResponse> {
    try {
      this.logger.info('Adding staff certification', {
        staffId: request.staffId,
        certificationType: request.certification.certificationType,
        addedBy: request.addedBy
      });

      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          message: validationError
        };
      }

      // Find staff
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy nhân viên'
        };
      }

      // Create certification entity
      const certification = StaffCertification.create({
        certificationName: request.certification.certificationType,
        issuingOrganization: request.certification.issuingAuthority,
        issueDate: new Date(request.certification.issueDate),
        expiryDate: request.certification.expiryDate ? new Date(request.certification.expiryDate) : undefined,
        credentialId: request.certification.certificationNumber,
        verificationUrl: request.certification.verificationUrl
      });

      // Add certification to staff
      staff.addCertification(certification);

      // Save
      await this.staffRepository.save(staff);

      // Audit logging
      await this.auditCertificationAdd(staff, request, certification);

      this.logger.info('Staff certification added successfully', {
        staffId: staff.id.value,
        certificationId: certification.id,
        addedBy: request.addedBy
      });

      return {
        success: true,
        message: 'Thêm chứng chỉ thành công',
        data: {
          staffId: staff.id.value,
          certificationId: certification.id,
          addedAt: staff.updatedAt.toISOString()
        }
      };

    } catch (error) {
      this.logger.error('Error adding staff certification', {
        staffId: request.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi hệ thống khi thêm chứng chỉ'
      };
    }
  }

  private validateRequest(request: AddStaffCertificationRequest): string | null {
    if (!request.staffId?.trim()) {
      return 'ID nhân viên không được để trống';
    }

    if (!request.certification) {
      return 'Thông tin chứng chỉ không được để trống';
    }

    if (!request.certification.certificationNumber?.trim()) {
      return 'Số chứng chỉ không được để trống';
    }

    if (!request.certification.certificationType?.trim()) {
      return 'Loại chứng chỉ không được để trống';
    }

    if (!request.certification.issuingAuthority?.trim()) {
      return 'Cơ quan cấp không được để trống';
    }

    if (!request.certification.issueDate) {
      return 'Ngày cấp không được để trống';
    }

    if (!request.addedBy?.trim()) {
      return 'Người thêm chứng chỉ không được để trống';
    }

    if (!request.addedByRole?.trim()) {
      return 'Vai trò người thêm không được để trống';
    }

    return null;
  }

  private async auditCertificationAdd(
    staff: ProviderStaff,
    request: AddStaffCertificationRequest,
    certification: StaffCertification
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff certification added', {
      action: 'ADD_STAFF_CERTIFICATION',
      staffId: staff.id.value,
      certificationId: certification.id,
      certificationType: request.certification.certificationType,
      addedBy: request.addedBy,
      addedByRole: request.addedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      userAgent: request.requestMetadata?.userAgent,
      sessionId: request.requestMetadata?.sessionId
    });
  }
}
