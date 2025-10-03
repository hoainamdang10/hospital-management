/**
 * PatientConsent Entity - Patient Registry
 * Patient consent management for HIPAA compliance
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '../../../../shared/domain/base/entity';
import { PatientId } from '../value-objects/PatientId';

export interface PatientConsentProps {
  id: string;
  patientId: PatientId;
  consentType: string; // 'treatment', 'data_sharing', 'research', 'hipaa', etc.
  isActive: boolean;
  grantedAt: Date;
  withdrawnAt?: Date;
  expiresAt?: Date;
  witnessId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PatientConsent extends Entity<PatientConsentProps> {
  private constructor(props: PatientConsentProps) {
    super(props);
  }

  /**
   * Grant new consent
   */
  public static grant(
    patientId: PatientId,
    consentType: string,
    witnessId?: string,
    expiresAt?: Date,
    notes?: string
  ): PatientConsent {
    const now = new Date();
    
    return new PatientConsent({
      id: Entity.generateId(),
      patientId,
      consentType: consentType.trim(),
      isActive: true,
      grantedAt: now,
      witnessId,
      expiresAt,
      notes: notes?.trim(),
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: PatientConsentProps): PatientConsent {
    return new PatientConsent(props);
  }

  // Getters
  public get id(): string {
    return this.props.id;
  }

  public get patientId(): PatientId {
    return this.props.patientId;
  }

  public get consentType(): string {
    return this.props.consentType;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get grantedAt(): Date {
    return this.props.grantedAt;
  }

  public get withdrawnAt(): Date | undefined {
    return this.props.withdrawnAt;
  }

  public get expiresAt(): Date | undefined {
    return this.props.expiresAt;
  }

  public get witnessId(): string | undefined {
    return this.props.witnessId;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  // Business methods
  public withdraw(): void {
    this.props.isActive = false;
    this.props.withdrawnAt = new Date();
    this.props.updatedAt = new Date();
  }

  public isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return this.props.expiresAt < new Date();
  }

  public isValid(): boolean {
    return this.props.isActive && !this.isExpired();
  }

  public getDaysUntilExpiry(): number | null {
    if (!this.props.expiresAt) return null;
    
    const today = new Date();
    const diffTime = this.props.expiresAt.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public isExpiringWithin(days: number): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry();
    if (daysUntilExpiry === null) return false;
    return daysUntilExpiry > 0 && daysUntilExpiry <= days;
  }

  // HIPAA specific methods
  public isHIPAAConsent(): boolean {
    return this.props.consentType === 'hipaa' || this.props.consentType === 'data_sharing';
  }

  public isTreatmentConsent(): boolean {
    return this.props.consentType === 'treatment';
  }

  public isResearchConsent(): boolean {
    return this.props.consentType === 'research';
  }

  // Validation methods
  public isHIPAACompliant(): boolean {
    return (
      this.props.consentType.length > 0 &&
      this.props.grantedAt <= new Date() &&
      (this.props.isActive || !!this.props.withdrawnAt)
    );
  }

  // Persistence methods
  public toPersistence(): any {
    return {
      id: this.props.id,
      patientId: this.props.patientId.value,
      consentType: this.props.consentType,
      isActive: this.props.isActive,
      grantedAt: this.props.grantedAt.toISOString(),
      withdrawnAt: this.props.withdrawnAt?.toISOString(),
      expiresAt: this.props.expiresAt?.toISOString(),
      witnessId: this.props.witnessId,
      notes: this.props.notes,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString()
    };
  }

  public static fromPersistence(data: any): PatientConsent {
    return PatientConsent.reconstitute({
      id: data.id,
      patientId: PatientId.fromString(data.patientId),
      consentType: data.consentType,
      isActive: data.isActive,
      grantedAt: new Date(data.grantedAt),
      withdrawnAt: data.withdrawnAt ? new Date(data.withdrawnAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      witnessId: data.witnessId,
      notes: data.notes,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  // Logging methods
  public getSummaryForLogging(): object {
    return {
      id: this.props.id,
      patientId: this.props.patientId.value,
      consentType: this.props.consentType,
      isActive: this.props.isActive,
      isExpired: this.isExpired(),
      grantedAt: this.props.grantedAt.toISOString(),
      withdrawnAt: this.props.withdrawnAt?.toISOString()
    };
  }
}

