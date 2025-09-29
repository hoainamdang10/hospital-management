/**
 * Insurance Info Value Object - Healthcare Domain
 * Encapsulates patient insurance information with validation
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance HIPAA, Healthcare Standards
 */

import { ValueObject } from '../base/value-object';

interface InsuranceInfoProps {
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberDateOfBirth: Date;
  relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  expirationDate?: Date;
  copayAmount?: number;
  deductibleAmount?: number;
  coverageType: 'basic' | 'standard' | 'premium' | 'comprehensive';
  isActive: boolean;
}

/**
 * Insurance Info Value Object
 * Contains validated insurance information for patients
 */
export class InsuranceInfo extends ValueObject<InsuranceInfoProps> {
  private static readonly POLICY_NUMBER_PATTERN = /^[A-Z0-9\-]{6,20}$/;
  private static readonly GROUP_NUMBER_PATTERN = /^[A-Z0-9\-]{3,15}$/;

  private constructor(props: InsuranceInfoProps) {
    super(props);
  }

  /**
   * Create insurance info with validation
   */
  public static create(
    provider: string,
    policyNumber: string,
    subscriberName: string,
    subscriberDateOfBirth: Date,
    relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other',
    effectiveDate: Date,
    coverageType: 'basic' | 'standard' | 'premium' | 'comprehensive',
    groupNumber?: string,
    expirationDate?: Date,
    copayAmount?: number,
    deductibleAmount?: number,
    isActive: boolean = true
  ): InsuranceInfo {
    const insuranceInfo = new InsuranceInfo({
      provider: provider.trim(),
      policyNumber: policyNumber.trim().toUpperCase(),
      groupNumber: groupNumber?.trim().toUpperCase(),
      subscriberName: subscriberName.trim(),
      subscriberDateOfBirth,
      relationshipToSubscriber,
      effectiveDate,
      expirationDate,
      copayAmount,
      deductibleAmount,
      coverageType,
      isActive,
    });

    if (!insuranceInfo.isValid()) {
      throw new Error('Thông tin bảo hiểm không hợp lệ');
    }

    return insuranceInfo;
  }

  /**
   * Validate insurance information
   */
  public isValid(): boolean {
    // Validate provider
    if (!this.props.provider || this.props.provider.trim().length < 2) {
      return false;
    }

    // Validate policy number
    if (!this.props.policyNumber || !InsuranceInfo.POLICY_NUMBER_PATTERN.test(this.props.policyNumber)) {
      return false;
    }

    // Validate group number if provided
    if (this.props.groupNumber && !InsuranceInfo.GROUP_NUMBER_PATTERN.test(this.props.groupNumber)) {
      return false;
    }

    // Validate subscriber name
    if (!this.props.subscriberName || this.props.subscriberName.trim().length < 2) {
      return false;
    }

    // Validate subscriber date of birth
    if (!this.props.subscriberDateOfBirth || this.props.subscriberDateOfBirth > new Date()) {
      return false;
    }

    // Validate relationship
    if (!['self', 'spouse', 'child', 'other'].includes(this.props.relationshipToSubscriber)) {
      return false;
    }

    // Validate effective date
    if (!this.props.effectiveDate) {
      return false;
    }

    // Validate expiration date if provided
    if (this.props.expirationDate && this.props.expirationDate <= this.props.effectiveDate) {
      return false;
    }

    // Validate coverage type
    if (!['basic', 'standard', 'premium', 'comprehensive'].includes(this.props.coverageType)) {
      return false;
    }

    // Validate monetary amounts
    if (this.props.copayAmount !== undefined && this.props.copayAmount < 0) {
      return false;
    }

    if (this.props.deductibleAmount !== undefined && this.props.deductibleAmount < 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if insurance is currently valid
   */
  public isCurrentlyValid(): boolean {
    if (!this.props.isActive) return false;
    
    const now = new Date();
    
    // Check if effective date has passed
    if (this.props.effectiveDate > now) return false;
    
    // Check if not expired
    if (this.props.expirationDate && this.props.expirationDate <= now) return false;
    
    return true;
  }

  /**
   * Check if insurance will expire soon (within 30 days)
   */
  public isExpiringSoon(): boolean {
    if (!this.props.expirationDate) return false;
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return this.props.expirationDate <= thirtyDaysFromNow && this.props.expirationDate > now;
  }

  /**
   * Get days until expiration
   */
  public getDaysUntilExpiration(): number | null {
    if (!this.props.expirationDate) return null;
    
    const now = new Date();
    const diffTime = this.props.expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Get relationship display text in Vietnamese
   */
  public getRelationshipDisplayText(): string {
    switch (this.props.relationshipToSubscriber) {
      case 'self':
        return 'Bản thân';
      case 'spouse':
        return 'Vợ/Chồng';
      case 'child':
        return 'Con';
      case 'other':
        return 'Khác';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Get coverage type display text in Vietnamese
   */
  public getCoverageTypeDisplayText(): string {
    switch (this.props.coverageType) {
      case 'basic':
        return 'Cơ bản';
      case 'standard':
        return 'Tiêu chuẩn';
      case 'premium':
        return 'Cao cấp';
      case 'comprehensive':
        return 'Toàn diện';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Get coverage level score (1-4, higher is better)
   */
  public getCoverageLevelScore(): number {
    switch (this.props.coverageType) {
      case 'basic':
        return 1;
      case 'standard':
        return 2;
      case 'premium':
        return 3;
      case 'comprehensive':
        return 4;
      default:
        return 0;
    }
  }

  /**
   * Get formatted policy number for display
   */
  public getFormattedPolicyNumber(): string {
    const policy = this.props.policyNumber;
    if (policy.length <= 8) return policy;
    
    // Format as XXXX-XXXX-XXXX
    return policy.replace(/(.{4})/g, '$1-').slice(0, -1);
  }

  /**
   * Get masked policy number for privacy
   */
  public getMaskedPolicyNumber(): string {
    const policy = this.props.policyNumber;
    if (policy.length <= 4) return '****';
    
    return `****${policy.slice(-4)}`;
  }

  /**
   * Calculate estimated coverage percentage
   */
  public getEstimatedCoveragePercentage(): number {
    const basePercentages = {
      basic: 60,
      standard: 75,
      premium: 85,
      comprehensive: 95
    };
    
    return basePercentages[this.props.coverageType];
  }

  /**
   * Get insurance status summary
   */
  public getStatusSummary(): {
    status: 'active' | 'inactive' | 'expired' | 'expiring_soon';
    message: string;
  } {
    if (!this.props.isActive) {
      return { status: 'inactive', message: 'Bảo hiểm không hoạt động' };
    }
    
    if (!this.isCurrentlyValid()) {
      return { status: 'expired', message: 'Bảo hiểm đã hết hạn' };
    }
    
    if (this.isExpiringSoon()) {
      const days = this.getDaysUntilExpiration();
      return { 
        status: 'expiring_soon', 
        message: `Bảo hiểm sẽ hết hạn trong ${days} ngày` 
      };
    }
    
    return { status: 'active', message: 'Bảo hiểm đang hoạt động' };
  }

  // Getters
  get provider(): string {
    return this.props.provider;
  }

  get policyNumber(): string {
    return this.props.policyNumber;
  }

  get groupNumber(): string | undefined {
    return this.props.groupNumber;
  }

  get subscriberName(): string {
    return this.props.subscriberName;
  }

  get subscriberDateOfBirth(): Date {
    return this.props.subscriberDateOfBirth;
  }

  get relationshipToSubscriber(): string {
    return this.props.relationshipToSubscriber;
  }

  get effectiveDate(): Date {
    return this.props.effectiveDate;
  }

  get expirationDate(): Date | undefined {
    return this.props.expirationDate;
  }

  get copayAmount(): number | undefined {
    return this.props.copayAmount;
  }

  get deductibleAmount(): number | undefined {
    return this.props.deductibleAmount;
  }

  get coverageType(): string {
    return this.props.coverageType;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }
}
