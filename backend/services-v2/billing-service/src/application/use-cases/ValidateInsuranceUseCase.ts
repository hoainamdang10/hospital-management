/**
 * ValidateInsuranceUseCase - Application Layer
 * Use case for validating insurance information
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Insurance Standards
 */

import { Insurance, InsuranceType, BHYTBeneficiaryType, BHTNAccidentType } from '../../domain/value-objects/Insurance';
import { Money } from '../../domain/value-objects/Money';

export interface ValidateInsuranceRequest {
  type: InsuranceType;
  number: string;
  validUntil: Date;
  coverageLevel: number;
  issuedBy?: string;
  beneficiaryType?: BHYTBeneficiaryType;
  accidentType?: BHTNAccidentType;
  accidentDate?: Date;
  employerInfo?: string;
  insuranceCompany?: string;
  policyType?: string;
  patientId?: string;
  treatmentAmount?: number;
  treatmentCurrency?: string;
}

export interface ValidateInsuranceResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    insurance: {
      type: string;
      number: string;
      vietnameseType: string;
      coverageLevel: number;
      coverageLevelDisplay: string;
      validityStatus: string;
      isExpired: boolean;
      isExpiringSoon: boolean;
      daysUntilExpiry: number;
      bhytRegionCode?: string;
      bhytRegionName?: string;
    };
    coverage?: {
      treatmentAmount: number;
      coverageAmount: number;
      patientPayment: number;
      currency: string;
      coveragePercentage: number;
      vietnameseCoverageDisplay: string;
      vietnamesePatientPaymentDisplay: string;
    };
    validation: {
      formatValid: boolean;
      expiryValid: boolean;
      coverageLevelValid: boolean;
      specificValidation: Record<string, boolean>;
    };
    requirements: {
      requiredDocuments: string[];
      requiresAdditionalDocumentation: boolean;
      processingTime: string;
      expectedProcessingDays: number;
    };
    warnings: string[];
    recommendations: string[];
    vietnameseSummary: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
  message: string;
}

/**
 * ValidateInsuranceUseCase
 * Handles insurance validation and coverage calculation
 */
export class ValidateInsuranceUseCase {

  /**
   * Execute use case
   */
  async execute(request: ValidateInsuranceRequest): Promise<ValidateInsuranceResponse> {
    try {
      // Validate request
      const validationErrors = this.validateRequest(request);
      if (validationErrors.length > 0) {
        return {
          success: false,
          errors: validationErrors,
          message: 'Dữ liệu bảo hiểm không hợp lệ'
        };
      }

      // Create insurance object
      const insurance = this.createInsurance(request);
      
      // Perform validation
      const validation = this.performValidation(insurance, request);
      const warnings = this.generateWarnings(insurance);
      const recommendations = this.generateRecommendations(insurance);

      // Calculate coverage if treatment amount provided
      let coverage: any = undefined;
      if (request.treatmentAmount && request.treatmentAmount > 0) {
        const treatmentAmount = Money.create(
          request.treatmentAmount, 
          request.treatmentCurrency || 'VND'
        );
        coverage = this.calculateCoverage(insurance, treatmentAmount);
      }

      // Generate response
      return {
        success: true,
        data: {
          isValid: validation.isValid,
          insurance: {
            type: insurance.type,
            number: insurance.number,
            vietnameseType: insurance.getVietnameseTypeDisplay(),
            coverageLevel: insurance.coverageLevel,
            coverageLevelDisplay: insurance.getCoverageLevelDisplay(),
            validityStatus: insurance.getValidityStatusDisplay(),
            isExpired: insurance.isExpired(),
            isExpiringSoon: insurance.isExpiringSoon(),
            daysUntilExpiry: insurance.getDaysUntilExpiry(),
            bhytRegionCode: insurance.getBHYTRegionCode(),
            bhytRegionName: insurance.getBHYTRegionName()
          },
          coverage,
          validation: {
            formatValid: validation.formatValid,
            expiryValid: validation.expiryValid,
            coverageLevelValid: validation.coverageLevelValid,
            specificValidation: validation.specificValidation
          },
          requirements: {
            requiredDocuments: insurance.getRequiredDocuments(),
            requiresAdditionalDocumentation: insurance.requiresAdditionalDocumentation(),
            processingTime: this.getProcessingTime(insurance),
            expectedProcessingDays: this.getExpectedProcessingDays(insurance)
          },
          warnings,
          recommendations,
          vietnameseSummary: this.generateVietnameseSummary(insurance, coverage)
        },
        message: 'Xác thực bảo hiểm thành công'
      };

    } catch (error) {
      console.error('Error in ValidateInsuranceUseCase:', error);
      
      if (error instanceof Error) {
        return {
          success: false,
          errors: [{ field: 'general', message: error.message, severity: 'error' }],
          message: 'Lỗi xác thực bảo hiểm'
        };
      }

      return {
        success: false,
        errors: [{ field: 'general', message: 'Lỗi hệ thống khi xác thực bảo hiểm', severity: 'error' }],
        message: 'Không thể xác thực bảo hiểm'
      };
    }
  }

  /**
   * Validate request
   */
  private validateRequest(request: ValidateInsuranceRequest): Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];

    // Required fields
    if (!request.type) {
      errors.push({ field: 'type', message: 'Loại bảo hiểm không được để trống', severity: 'error' });
    }

    if (!request.number) {
      errors.push({ field: 'number', message: 'Số bảo hiểm không được để trống', severity: 'error' });
    }

    if (!request.validUntil) {
      errors.push({ field: 'validUntil', message: 'Ngày hết hạn không được để trống', severity: 'error' });
    }

    if (request.coverageLevel < 0 || request.coverageLevel > 100) {
      errors.push({ field: 'coverageLevel', message: 'Mức bảo hiểm phải từ 0% đến 100%', severity: 'error' });
    }

    // Type-specific validation
    if (request.type === InsuranceType.BHYT) {
      if (!request.beneficiaryType) {
        errors.push({ field: 'beneficiaryType', message: 'Loại đối tượng BHYT không được để trống', severity: 'error' });
      }
    }

    if (request.type === InsuranceType.BHTN) {
      if (!request.accidentType) {
        errors.push({ field: 'accidentType', message: 'Loại tai nạn không được để trống', severity: 'error' });
      }

      if (!request.accidentDate) {
        errors.push({ field: 'accidentDate', message: 'Ngày tai nạn không được để trống', severity: 'error' });
      }
    }

    if (request.type === InsuranceType.PRIVATE) {
      if (!request.insuranceCompany) {
        errors.push({ field: 'insuranceCompany', message: 'Công ty bảo hiểm không được để trống', severity: 'error' });
      }

      if (!request.policyType) {
        errors.push({ field: 'policyType', message: 'Loại hợp đồng không được để trống', severity: 'error' });
      }
    }

    return errors;
  }

  /**
   * Create insurance object
   */
  private createInsurance(request: ValidateInsuranceRequest): Insurance {
    switch (request.type) {
      case InsuranceType.BHYT:
        return Insurance.createBHYT(
          request.number,
          request.validUntil,
          request.coverageLevel,
          request.beneficiaryType!,
          request.issuedBy || 'BHXH Việt Nam'
        );

      case InsuranceType.BHTN:
        return Insurance.createBHTN(
          request.number,
          request.validUntil,
          request.accidentType!,
          request.accidentDate!,
          request.employerInfo
        );

      case InsuranceType.PRIVATE:
        return Insurance.createPrivate(
          request.number,
          request.validUntil,
          request.coverageLevel,
          request.insuranceCompany!,
          request.policyType!
        );

      default:
        return Insurance.createSelfPay();
    }
  }

  /**
   * Perform validation
   */
  private performValidation(insurance: Insurance, request: ValidateInsuranceRequest): {
    isValid: boolean;
    formatValid: boolean;
    expiryValid: boolean;
    coverageLevelValid: boolean;
    specificValidation: Record<string, boolean>;
  } {
    const formatValid = this.validateFormat(insurance);
    const expiryValid = insurance.isValid();
    const coverageLevelValid = insurance.coverageLevel >= 0 && insurance.coverageLevel <= 100;
    const specificValidation = this.performSpecificValidation(insurance, request);

    const isValid = formatValid && expiryValid && coverageLevelValid && 
                   Object.values(specificValidation).every(v => v);

    return {
      isValid,
      formatValid,
      expiryValid,
      coverageLevelValid,
      specificValidation
    };
  }

  /**
   * Validate format
   */
  private validateFormat(insurance: Insurance): boolean {
    if (insurance.isBHYT()) {
      return /^HS\d{13}$/.test(insurance.number.toUpperCase());
    }

    if (insurance.isBHTN()) {
      return /^TN\d{13}$/.test(insurance.number.toUpperCase());
    }

    return true; // Private insurance and self-pay don't have strict format requirements
  }

  /**
   * Perform specific validation
   */
  private performSpecificValidation(insurance: Insurance, request: ValidateInsuranceRequest): Record<string, boolean> {
    const validation: Record<string, boolean> = {};

    if (insurance.isBHYT()) {
      validation.bhytNumberFormat = this.validateFormat(insurance);
      validation.bhytBeneficiaryType = !!request.beneficiaryType;
      validation.bhytRegionCode = !!insurance.getBHYTRegionCode();
    }

    if (insurance.isBHTN()) {
      validation.bhtnNumberFormat = this.validateFormat(insurance);
      validation.bhtnAccidentType = !!request.accidentType;
      validation.bhtnAccidentDate = !!request.accidentDate && request.accidentDate <= new Date();
    }

    if (insurance.isPrivate()) {
      validation.privateInsuranceCompany = !!request.insuranceCompany;
      validation.privatePolicyType = !!request.policyType;
    }

    return validation;
  }

  /**
   * Calculate coverage
   */
  private calculateCoverage(insurance: Insurance, treatmentAmount: Money): any {
    const coverageAmount = insurance.calculateCoverage(treatmentAmount);
    const patientPayment = insurance.calculatePatientPayment(treatmentAmount);

    return {
      treatmentAmount: treatmentAmount.amount,
      coverageAmount: coverageAmount.amount,
      patientPayment: patientPayment.amount,
      currency: treatmentAmount.currency,
      coveragePercentage: insurance.coverageLevel,
      vietnameseCoverageDisplay: coverageAmount.formatVND(),
      vietnamesePatientPaymentDisplay: patientPayment.formatVND()
    };
  }

  /**
   * Generate warnings
   */
  private generateWarnings(insurance: Insurance): string[] {
    const warnings: string[] = [];

    if (insurance.isExpired()) {
      warnings.push('Bảo hiểm đã hết hạn');
    } else if (insurance.isExpiringSoon()) {
      warnings.push(`Bảo hiểm sắp hết hạn trong ${insurance.getDaysUntilExpiry()} ngày`);
    }

    if (insurance.coverageLevel < 50) {
      warnings.push('Mức bảo hiểm thấp (dưới 50%)');
    }

    if (insurance.requiresAdditionalDocumentation()) {
      warnings.push('Yêu cầu giấy tờ bổ sung');
    }

    return warnings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(insurance: Insurance): string[] {
    const recommendations: string[] = [];

    if (insurance.isExpiringSoon()) {
      recommendations.push('Nên gia hạn bảo hiểm trước khi hết hạn');
    }

    if (insurance.isBHYT() && insurance.coverageLevel < 100) {
      recommendations.push('Kiểm tra lại mức bảo hiểm BHYT');
    }

    if (insurance.requiresAdditionalDocumentation()) {
      recommendations.push('Chuẩn bị đầy đủ giấy tờ yêu cầu');
    }

    return recommendations;
  }

  /**
   * Get processing time
   */
  private getProcessingTime(insurance: Insurance): string {
    if (insurance.isBHYT()) {
      return '15 ngày làm việc';
    }

    if (insurance.isBHTN()) {
      return '30 ngày làm việc';
    }

    if (insurance.isPrivate()) {
      return '7 ngày làm việc';
    }

    return 'Không áp dụng';
  }

  /**
   * Get expected processing days
   */
  private getExpectedProcessingDays(insurance: Insurance): number {
    if (insurance.isBHYT()) return 15;
    if (insurance.isBHTN()) return 30;
    if (insurance.isPrivate()) return 7;
    return 0;
  }

  /**
   * Generate Vietnamese summary
   */
  private generateVietnameseSummary(insurance: Insurance, coverage?: any): string {
    let summary = `${insurance.getVietnameseTypeDisplay()} số ${insurance.number}. `;
    summary += `Mức bảo hiểm: ${insurance.getCoverageLevelDisplay()}. `;
    summary += `Trạng thái: ${insurance.getValidityStatusDisplay()}. `;

    if (coverage) {
      summary += `Với chi phí điều trị ${coverage.vietnameseCoverageDisplay}, `;
      summary += `bảo hiểm chi trả ${coverage.vietnameseCoverageDisplay}, `;
      summary += `bệnh nhân thanh toán ${coverage.vietnamesePatientPaymentDisplay}.`;
    }

    return summary;
  }
}
