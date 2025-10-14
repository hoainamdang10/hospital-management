/**
 * AddStaffCertificationUseCase - Application Use Case
 * V2 Clean Architecture + DDD Implementation
 * Adds certification to staff profile
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { BaseHealthcareUseCase } from '../../../../shared/application/base/base-healthcare-use-case';
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
export class AddStaffCertificationUseCase extends BaseHealthcareUseCase<AddStaffCertificationRequest, AddStaffCertificationResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected async executeImpl(request: AddStaffCertificationRequest): Promise<AddStaffCertificationResponse> {
    try {
      this.logger.info('Adding staff certification', {
        staffId: request.staffId,
        certificationType: request.certification.certificationType,
        addedBy: request.addedBy
      });

      // Validate request
      const validationResult = this.validateRequest(request);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Yêu cầu không hợp lệ',
          errors: validationResult.errors
        };
      }

      // Find staff
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Không tìm thấy thông tin nhân viên'
        };
      }

      // Check authorization
      if (!this.checkAuthorization(staff, request)) {
        return {
          success: false,
          message: 'Không có quyền thêm chứng chỉ cho nhân viên này'
        };
      }

      // Create certification
      const certification = StaffCertification.create({
        certificationNumber: request.certification.certificationNumber,
        certificationType: request.certification.certificationType,
        issuingAuthority: request.certification.issuingAuthority,
        issueDate: new Date(request.certification.issueDate),
        expiryDate: request.certification.expiryDate ? new Date(request.certification.expiryDate) : undefined,
        isValid: request.certification.isValid,
        verificationUrl: request.certification.verificationUrl
      });

      // Add certification to staff
      staff.addCertification(certification);

      // Update metadata
      staff.props.updatedAt = new Date();
      staff.props.updatedBy = request.addedBy;

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
          addedAt: staff.props.updatedAt.toISOString()
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

  private validateRequest(request: AddStaffCertificationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.staffId?.trim()) {
      errors.push('ID nhân viên không được để trống');
    }

    if (!request.certification) {
      errors.push('Thông tin chứng chỉ không được để trống');
    } else {
      if (!request.certification.certificationNumber?.trim()) {
        errors.push('Số chứng chỉ không được để trống');
      }
      if (!request.certification.certificationType?.trim()) {
        errors.push('Loại chứng chỉ không được để trống');
      }
      if (!request.certification.issuingAuthority?.trim()) {
        errors.push('Cơ quan cấp không được để trống');
      }
      if (!request.certification.issueDate) {
        errors.push('Ngày cấp không được để trống');
      }
    }

    if (!request.addedBy?.trim()) {
      errors.push('Thông tin người thêm không được để trống');
    }

    return { isValid: errors.length === 0, errors };
  }

  private checkAuthorization(staff: ProviderStaff, request: AddStaffCertificationRequest): boolean {
    const { addedByRole } = request;
    return addedByRole === 'admin' || addedByRole === 'hr' || addedByRole === 'department_head';
  }

  private async auditCertificationAdd(
    staff: ProviderStaff,
    request: AddStaffCertificationRequest,
    certification: StaffCertification
  ): Promise<void> {
    this.logger.info('HIPAA Audit: Staff certification added', {
      action: 'STAFF_CERTIFICATION_ADD',
      staffId: staff.id.value,
      certificationId: certification.id,
      certificationType: certification.certificationType,
      addedBy: request.addedBy,
      addedByRole: request.addedByRole,
      timestamp: new Date().toISOString(),
      ipAddress: request.requestMetadata?.ipAddress,
      complianceLevel: 'hipaa'
    });
  }
}

