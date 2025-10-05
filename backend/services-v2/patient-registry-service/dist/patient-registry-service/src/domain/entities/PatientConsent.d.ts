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
export interface PatientConsentProps {
    id: string;
    patientId: PatientId;
    consentType: string;
    isActive: boolean;
    grantedAt: Date;
    withdrawnAt?: Date;
    expiresAt?: Date;
    witnessId?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PatientConsent extends Entity<PatientConsentProps> {
    private constructor();
    /**
     * Grant new consent
     */
    static grant(patientId: PatientId, consentType: string, witnessId?: string, expiresAt?: Date, notes?: string): PatientConsent;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: PatientConsentProps): PatientConsent;
    getId(): string;
    isGranted(): boolean;
    revokedAt(): Date | undefined;
    get patientId(): PatientId;
    get consentType(): string;
    get isActive(): boolean;
    get grantedAt(): Date;
    get withdrawnAt(): Date | undefined;
    get expiresAt(): Date | undefined;
    get witnessId(): string | undefined;
    get notes(): string | undefined;
    withdraw(): void;
    isExpired(): boolean;
    isValid(): boolean;
    getDaysUntilExpiry(): number | null;
    isExpiringWithin(days: number): boolean;
    isHIPAAConsent(): boolean;
    isTreatmentConsent(): boolean;
    isResearchConsent(): boolean;
    validate(): void;
    isHIPAACompliant(): boolean;
    toPersistence(): {
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
    };
    getSummaryForLogging(): object;
}
//# sourceMappingURL=PatientConsent.d.ts.map