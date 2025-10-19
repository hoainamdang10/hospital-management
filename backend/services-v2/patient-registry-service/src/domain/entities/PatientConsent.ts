/**
 * PatientConsent Entity - Patient Registry
 * Patient consent management for HIPAA compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { Entity } from '@shared/domain/base/entity';
import { PatientId } from '../value-objects/PatientId';
import * as uuid from 'uuid';

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
  private constructor(props: PatientConsentProps, id?: string) {
    super(props, id);
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
    const id = uuid.v4();

    return new PatientConsent({
      id,
      patientId,
      consentType: consentType.trim(),
      isActive: true,
      grantedAt: now,
      witnessId,
      expiresAt,
      notes: notes?.trim(),
      createdAt: now,
      updatedAt: now
    }, id);
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(props: PatientConsentProps): PatientConsent {
    return new PatientConsent(props, props.id);
  }

  // Getters
  public getId(): string {
    return this.id;
  }

  public isGranted(): boolean {
    return this.props.isActive && !this.props.withdrawnAt;
  }

  public revokedAt(): Date | undefined {
    return this.props.withdrawnAt;
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
    if (!this.props.expiresAt) {
      return false;
    }
    return this.props.expiresAt < new Date();
  }

  public isValid(): boolean {
    return this.props.isActive && !this.isExpired();
  }

  public getDaysUntilExpiry(): number | null {
    if (!this.props.expiresAt) {
      return null;
    }

    const today = new Date();
    const diffTime = this.props.expiresAt.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public isExpiringWithin(days: number): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry();
    if (daysUntilExpiry === null) {
      return false;
    }
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
  override validate(): void {
    if (!this.isHIPAACompliant()) {
      throw new Error('Consent is not HIPAA compliant');
    }
  }

  public isHIPAACompliant(): boolean {
    return (
      this.props.consentType.length > 0 &&
      this.props.grantedAt <= new Date() &&
      (this.props.isActive || !!this.props.withdrawnAt)
    );
  }

  // Persistence methods
  override toPersistence(): {
    id: string;
    patient_id: string;
    consent_type: string;
    is_active: boolean;
    granted_at: string;
    withdrawn_at?: string;
    expires_at?: string;
    witness_id?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    } {
    return {
      id: this.id,
      patient_id: this.props.patientId.value,
      consent_type: this.props.consentType,
      is_active: this.props.isActive,
      granted_at: this.props.grantedAt.toISOString(),
      withdrawn_at: this.props.withdrawnAt?.toISOString(),
      expires_at: this.props.expiresAt?.toISOString(),
      witness_id: this.props.witnessId,
      notes: this.props.notes,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString()
    };
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

