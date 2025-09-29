/**
 * Insurance Value Object - Domain Layer
 * Represents Vietnamese insurance information (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Insurance Standards
 */

import { ValueObject } from "../../../../shared/domain/ValueObject";
import { Money } from "./Money";

export enum InsuranceType {
  BHYT = "BHYT", // Bảo hiểm Y tế
  BHTN = "BHTN", // Bảo hiểm Tai nạn
  PRIVATE = "Private", // Bảo hiểm tư nhân
  SELF_PAY = "Self-pay", // Tự chi trả
}

export enum BHYTBeneficiaryType {
  EMPLOYEE = "Người lao động",
  RETIREE = "Người về hưu",
  STUDENT = "Học sinh, sinh viên",
  CHILD = "Trẻ em dưới 6 tuổi",
  ELDERLY = "Người cao tuổi",
  POOR = "Hộ nghèo",
  ETHNIC_MINORITY = "Dân tộc thiểu số",
  DISABLED = "Người khuyết tật",
  OTHER = "Khác",
}

export enum BHTNAccidentType {
  WORK_ACCIDENT = "Tai nạn lao động",
  TRAFFIC_ACCIDENT = "Tai nạn giao thông",
  OCCUPATIONAL_DISEASE = "Bệnh nghề nghiệp",
  OTHER_ACCIDENT = "Tai nạn khác",
}

interface InsuranceProps {
  type: InsuranceType;
  number: string;
  validUntil: Date;
  coverageLevel: number; // Percentage (0-100)
  issuedBy?: string;
  beneficiaryType?: BHYTBeneficiaryType;
  accidentType?: BHTNAccidentType;
  accidentDate?: Date;
  employerInfo?: string;
  insuranceCompany?: string;
  policyType?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Insurance Value Object
 * Handles Vietnamese insurance types with proper validation
 */
export class Insurance extends ValueObject<InsuranceProps> {
  private constructor(props: InsuranceProps) {
    super(props);
  }

  /**
   * Create BHYT insurance
   */
  static createBHYT(
    number: string,
    validUntil: Date,
    coverageLevel: number,
    beneficiaryType: BHYTBeneficiaryType,
    issuedBy: string
  ): Insurance {
    if (!this.isValidBHYTNumber(number)) {
      throw new Error(
        "Số thẻ BHYT không đúng định dạng. Định dạng hợp lệ: HS + 13 chữ số"
      );
    }

    if (coverageLevel < 0 || coverageLevel > 100) {
      throw new Error("Mức bảo hiểm phải từ 0% đến 100%");
    }

    return new Insurance({
      type: InsuranceType.BHYT,
      number: number.toUpperCase(),
      validUntil,
      coverageLevel,
      issuedBy,
      beneficiaryType,
    });
  }

  /**
   * Create BHTN insurance
   */
  static createBHTN(
    number: string,
    validUntil: Date,
    accidentType: BHTNAccidentType,
    accidentDate: Date,
    employerInfo?: string
  ): Insurance {
    if (!this.isValidBHTNNumber(number)) {
      throw new Error(
        "Số bảo hiểm BHTN không đúng định dạng. Định dạng hợp lệ: TN + năm + 9 chữ số"
      );
    }

    if (accidentDate > new Date()) {
      throw new Error("Ngày tai nạn không được trong tương lai");
    }

    return new Insurance({
      type: InsuranceType.BHTN,
      number: number.toUpperCase(),
      validUntil,
      coverageLevel: 100, // BHTN usually covers 100%
      accidentType,
      accidentDate,
      employerInfo,
    });
  }

  /**
   * Create private insurance
   */
  static createPrivate(
    number: string,
    validUntil: Date,
    coverageLevel: number,
    insuranceCompany: string,
    policyType: string
  ): Insurance {
    if (coverageLevel < 0 || coverageLevel > 100) {
      throw new Error("Mức bảo hiểm phải từ 0% đến 100%");
    }

    return new Insurance({
      type: InsuranceType.PRIVATE,
      number,
      validUntil,
      coverageLevel,
      insuranceCompany,
      policyType,
    });
  }

  /**
   * Create self-pay (no insurance)
   */
  static createSelfPay(): Insurance {
    return new Insurance({
      type: InsuranceType.SELF_PAY,
      number: "SELF-PAY",
      validUntil: new Date(2099, 11, 31), // Far future date
      coverageLevel: 0,
    });
  }

  /**
   * Get insurance type
   */
  get type(): InsuranceType {
    return this.props.type;
  }

  /**
   * Get insurance number
   */
  get number(): string {
    return this.props.number;
  }

  /**
   * Get valid until date
   */
  get validUntil(): Date {
    return this.props.validUntil;
  }

  /**
   * Get coverage level (percentage)
   */
  get coverageLevel(): number {
    return this.props.coverageLevel;
  }

  /**
   * Get issued by
   */
  get issuedBy(): string | undefined {
    return this.props.issuedBy;
  }

  /**
   * Get beneficiary type (for BHYT)
   */
  get beneficiaryType(): BHYTBeneficiaryType | undefined {
    return this.props.beneficiaryType;
  }

  /**
   * Get accident type (for BHTN)
   */
  get accidentType(): BHTNAccidentType | undefined {
    return this.props.accidentType;
  }

  /**
   * Get accident date (for BHTN)
   */
  get accidentDate(): Date | undefined {
    return this.props.accidentDate;
  }

  /**
   * Check if insurance is valid (not expired)
   */
  isValid(): boolean {
    return new Date() <= this.props.validUntil;
  }

  /**
   * Check if insurance is expired
   */
  isExpired(): boolean {
    return !this.isValid();
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(): number {
    const now = new Date();
    const diffTime = this.props.validUntil.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if expiring soon (within 30 days)
   */
  isExpiringSoon(): boolean {
    return this.getDaysUntilExpiry() <= 30 && this.getDaysUntilExpiry() > 0;
  }

  /**
   * Check if BHYT
   */
  isBHYT(): boolean {
    return this.props.type === InsuranceType.BHYT;
  }

  /**
   * Check if BHTN
   */
  isBHTN(): boolean {
    return this.props.type === InsuranceType.BHTN;
  }

  /**
   * Check if private insurance
   */
  isPrivate(): boolean {
    return this.props.type === InsuranceType.PRIVATE;
  }

  /**
   * Check if self-pay
   */
  isSelfPay(): boolean {
    return this.props.type === InsuranceType.SELF_PAY;
  }

  /**
   * Calculate coverage amount
   */
  calculateCoverage(totalAmount: Money): Money {
    if (this.isSelfPay() || !this.isValid()) {
      return Money.zero(totalAmount.currency);
    }

    return totalAmount.percentage(this.props.coverageLevel);
  }

  /**
   * Calculate patient payment (co-payment)
   */
  calculatePatientPayment(totalAmount: Money): Money {
    const coverage = this.calculateCoverage(totalAmount);
    return totalAmount.subtract(coverage);
  }

  /**
   * Get Vietnamese insurance type display
   */
  getVietnameseTypeDisplay(): string {
    switch (this.props.type) {
      case InsuranceType.BHYT:
        return "Bảo hiểm Y tế";
      case InsuranceType.BHTN:
        return "Bảo hiểm Tai nạn";
      case InsuranceType.PRIVATE:
        return "Bảo hiểm tư nhân";
      case InsuranceType.SELF_PAY:
        return "Tự chi trả";
      default:
        return "Không xác định";
    }
  }

  /**
   * Get coverage level display
   */
  getCoverageLevelDisplay(): string {
    if (this.isSelfPay()) {
      return "Không có bảo hiểm";
    }
    return `${this.props.coverageLevel}%`;
  }

  /**
   * Get validity status display
   */
  getValidityStatusDisplay(): string {
    if (this.isSelfPay()) {
      return "Không áp dụng";
    }

    if (this.isExpired()) {
      return "Đã hết hạn";
    }

    if (this.isExpiringSoon()) {
      return `Sắp hết hạn (${this.getDaysUntilExpiry()} ngày)`;
    }

    return "Còn hiệu lực";
  }

  /**
   * Get BHYT region code
   */
  getBHYTRegionCode(): string | null {
    if (!this.isBHYT()) return null;

    // BHYT number format: HS + 2 digit region + 11 digits
    return this.props.number.substring(2, 4);
  }

  /**
   * Get BHYT region name
   */
  getBHYTRegionName(): string | null {
    const regionCode = this.getBHYTRegionCode();
    if (!regionCode) return null;

    // Simplified mapping - in real app would have complete mapping
    const regionMap: Record<string, string> = {
      "01": "Hà Nội",
      "02": "Hồ Chí Minh",
      "03": "Hải Phòng",
      "04": "Đà Nẵng",
      "40": "Toàn quốc",
    };

    return regionMap[regionCode] || `Vùng ${regionCode}`;
  }

  /**
   * Check if requires additional documentation
   */
  requiresAdditionalDocumentation(): boolean {
    if (this.isBHTN()) {
      return (
        this.props.accidentType === BHTNAccidentType.TRAFFIC_ACCIDENT ||
        this.props.accidentType === BHTNAccidentType.WORK_ACCIDENT
      );
    }
    return false;
  }

  /**
   * Get required documents
   */
  getRequiredDocuments(): string[] {
    const documents: string[] = [];

    if (this.isBHYT()) {
      documents.push("Thẻ BHYT");
      documents.push("CMND/CCCD");
    }

    if (this.isBHTN()) {
      documents.push("Giấy chứng nhận BHTN");

      if (this.props.accidentType === BHTNAccidentType.TRAFFIC_ACCIDENT) {
        documents.push("Biên bản tai nạn giao thông");
        documents.push("Giấy chứng nhận của CSGT");
      }

      if (this.props.accidentType === BHTNAccidentType.WORK_ACCIDENT) {
        documents.push("Biên bản tai nạn lao động");
        documents.push("Xác nhận của công ty");
      }
    }

    if (this.isPrivate()) {
      documents.push("Hợp đồng bảo hiểm");
      documents.push("Thẻ bảo hiểm");
    }

    return documents;
  }

  /**
   * Validate BHYT number format
   */
  private static isValidBHYTNumber(number: string): boolean {
    // Format: HS + 13 digits (e.g., HS4010123456789)
    const pattern = /^HS\d{13}$/;
    return pattern.test(number.toUpperCase());
  }

  /**
   * Validate BHTN number format
   */
  private static isValidBHTNNumber(number: string): boolean {
    // Format: TN + year + 9 digits (e.g., TN2024123456789)
    const pattern = /^TN\d{13}$/;
    return pattern.test(number.toUpperCase());
  }

  /**
   * Get insurance summary for billing
   */
  getBillingSummary(totalAmount: Money): {
    insuranceType: string;
    insuranceNumber: string;
    coverageLevel: string;
    coverageAmount: Money;
    patientPayment: Money;
    validityStatus: string;
    requiresVerification: boolean;
  } {
    return {
      insuranceType: this.getVietnameseTypeDisplay(),
      insuranceNumber: this.props.number,
      coverageLevel: this.getCoverageLevelDisplay(),
      coverageAmount: this.calculateCoverage(totalAmount),
      patientPayment: this.calculatePatientPayment(totalAmount),
      validityStatus: this.getValidityStatusDisplay(),
      requiresVerification: this.isExpired() || this.isExpiringSoon(),
    };
  }

  /**
   * Convert to JSON
   */
  toJSON(): any {
    return {
      type: this.props.type,
      number: this.props.number,
      validUntil: this.props.validUntil.toISOString(),
      coverageLevel: this.props.coverageLevel,
      issuedBy: this.props.issuedBy,
      beneficiaryType: this.props.beneficiaryType,
      accidentType: this.props.accidentType,
      accidentDate: this.props.accidentDate?.toISOString(),
      employerInfo: this.props.employerInfo,
      insuranceCompany: this.props.insuranceCompany,
      policyType: this.props.policyType,
      vietnameseTypeDisplay: this.getVietnameseTypeDisplay(),
      coverageLevelDisplay: this.getCoverageLevelDisplay(),
      validityStatusDisplay: this.getValidityStatusDisplay(),
      isValid: this.isValid(),
      isExpired: this.isExpired(),
      isExpiringSoon: this.isExpiringSoon(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      bhytRegionCode: this.getBHYTRegionCode(),
      bhytRegionName: this.getBHYTRegionName(),
      requiresAdditionalDocumentation: this.requiresAdditionalDocumentation(),
      requiredDocuments: this.getRequiredDocuments(),
      additionalInfo: this.props.additionalInfo,
    };
  }

  /**
   * String representation
   */
  toString(): string {
    return `${this.getVietnameseTypeDisplay()} - ${this.props.number} (${this.getCoverageLevelDisplay()})`;
  }
}
