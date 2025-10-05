/**
 * InsuranceInfo Entity - Patient Registry
 * Patient insurance information with Vietnamese healthcare standards (BHYT/BHTN)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';
import { v4 as uuidv4 } from 'uuid';

export interface InsuranceInfoProps {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validFrom: Date;
  validTo: Date;
  coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
  isActive: boolean;
  isPrimary: boolean;
  isVietnameseInsurance: boolean;
  bhytNumber?: string; // Vietnamese social health insurance number
  createdAt: Date;
  updatedAt: Date;
}

export class InsuranceInfo extends Entity<InsuranceInfoProps> {
  private constructor(props: InsuranceInfoProps, id?: string) {
    super(props, id);
  }

  /**
   * Create new insurance info
   */
  public static create(props: Omit<InsuranceInfoProps, 'id' | 'createdAt' | 'updatedAt'>): InsuranceInfo {
    const now = new Date();
    const id = uuidv4();

    return new InsuranceInfo({
      ...props,
      id,
      createdAt: now,
      updatedAt: now
    }, id);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: InsuranceInfoProps): InsuranceInfo {
    return new InsuranceInfo(props);
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public get provider(): string {
    return this.props.provider;
  }

  public get policyNumber(): string {
    return this.props.policyNumber;
  }

  public get groupNumber(): string | undefined {
    return this.props.groupNumber;
  }

  public get validFrom(): Date {
    return this.props.validFrom;
  }

  public get validTo(): Date {
    return this.props.validTo;
  }

  public get coverageType(): 'BHYT' | 'BHTN' | 'private' | 'self_pay' {
    return this.props.coverageType;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  public get isVietnameseInsurance(): boolean {
    return this.props.isVietnameseInsurance;
  }

  public get bhytNumber(): string | undefined {
    return this.props.bhytNumber;
  }

  // Business methods
  public isNotExpired(): boolean {
    return this.props.validTo >= new Date();
  }

  public isExpired(): boolean {
    return !this.isNotExpired();
  }

  public isValidOn(date: Date): boolean {
    return date >= this.props.validFrom && date <= this.props.validTo;
  }

  public getDaysUntilExpiry(): number {
    const today = new Date();
    const diffTime = this.props.validTo.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public isExpiringWithin(days: number): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry();
    return daysUntilExpiry > 0 && daysUntilExpiry <= days;
  }

  public activate(): void {
    this.props.isActive = true;
    this.props.updatedAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public setPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  public removePrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
  }

  // Vietnamese healthcare specific methods
  public isBHYT(): boolean {
    return this.props.coverageType === 'BHYT';
  }

  public isBHTN(): boolean {
    return this.props.coverageType === 'BHTN';
  }

  public isPrivate(): boolean {
    return this.props.coverageType === 'private';
  }

  public isSelfPay(): boolean {
    return this.props.coverageType === 'self_pay';
  }

  public getVietnameseInsuranceNumber(): string | null {
    if (this.isVietnameseInsurance && this.props.bhytNumber) {
      return this.props.bhytNumber;
    }
    return null;
  }

  // Validation methods
  public isValid(): boolean {
    return (
      this.props.provider.length > 0 &&
      this.props.policyNumber.length > 0 &&
      this.props.validFrom < this.props.validTo &&
      this.isNotExpired()
    );
  }

  public isVietnameseCompliant(): boolean {
    if (this.isVietnameseInsurance) {
      return (
        (this.isBHYT() || this.isBHTN()) &&
        !!this.props.bhytNumber &&
        this.props.bhytNumber.length > 0
      );
    }
    return true;
  }

  public isHIPAACompliant(): boolean {
    return (
      this.props.provider.length > 0 &&
      this.props.policyNumber.length > 0 &&
      this.props.validFrom < this.props.validTo
    );
  }

  // Validation
  override validate(): void {
    if (!this.isValidInsurance()) {
      throw new Error('Invalid insurance info');
    }
  }

  private isValidInsurance(): boolean {
    return (
      this.props.provider.length > 0 &&
      this.props.policyNumber.length > 0 &&
      this.props.validFrom < this.props.validTo
    );
  }

  // Persistence methods
  override toPersistence(): {
    id: string;
    provider: string;
    policy_number: string;
    group_number?: string;
    valid_from: string;
    valid_to: string;
    coverage_type: string;
    is_active: boolean;
    is_primary: boolean;
    is_vietnamese_insurance: boolean;
    bhyt_number?: string;
    created_at: string;
    updated_at: string;
    } {
    return {
      id: this.id,
      provider: this.props.provider,
      policy_number: this.props.policyNumber,
      group_number: this.props.groupNumber,
      valid_from: this.props.validFrom.toISOString(),
      valid_to: this.props.validTo.toISOString(),
      coverage_type: this.props.coverageType,
      is_active: this.props.isActive,
      is_primary: this.props.isPrimary,
      is_vietnamese_insurance: this.props.isVietnameseInsurance,
      bhyt_number: this.props.bhytNumber,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
  }

  // Logging methods
  public getSummaryForLogging(): object {
    return {
      id: this.props.id,
      provider: this.props.provider,
      coverageType: this.props.coverageType,
      isActive: this.props.isActive,
      isPrimary: this.props.isPrimary,
      isExpired: this.isExpired(),
      daysUntilExpiry: this.getDaysUntilExpiry()
    };
  }

  public getMaskedPolicyNumber(): string {
    const policy = this.props.policyNumber;
    if (policy.length <= 4) {
      return '***';
    }
    return '***' + policy.slice(-4);
  }
}

