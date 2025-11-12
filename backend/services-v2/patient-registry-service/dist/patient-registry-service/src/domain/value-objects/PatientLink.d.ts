/**
 * PatientLink Value Object
 *
 * FHIR-style patient linking for duplicate management
 * Based on HL7 FHIR R5 Patient.link specification
 */
import { ValueObject } from '../../../../shared/domain/base/value-object';
import { PatientId } from './PatientId';
export type PatientLinkType = 'replaced-by' | 'replaces' | 'refer' | 'seealso';
export interface PatientLinkProps {
    otherPatientId: PatientId;
    linkType: PatientLinkType;
    createdAt: Date;
    createdBy: string;
}
export declare class PatientLink extends ValueObject<PatientLinkProps> {
    private constructor();
    protected validateFormat(): void;
    /**
     * Create new patient link
     */
    static create(otherPatientId: PatientId, linkType: PatientLinkType, createdBy?: string): PatientLink;
    /**
     * Create "replaced-by" link (this patient is duplicate, use other patient)
     */
    static createReplacedBy(otherPatientId: PatientId, createdBy: string): PatientLink;
    /**
     * Create "replaces" link (this patient replaces other patient)
     */
    static createReplaces(otherPatientId: PatientId, createdBy: string): PatientLink;
    /**
     * Create "refer" link (refer to authoritative record)
     */
    static createRefer(otherPatientId: PatientId, createdBy: string): PatientLink;
    /**
     * Create "seealso" link (related record)
     */
    static createSeeAlso(otherPatientId: PatientId, createdBy: string): PatientLink;
    get otherPatientId(): PatientId;
    get linkType(): PatientLinkType;
    get createdAt(): Date;
    get createdBy(): string;
    isReplacedBy(): boolean;
    isReplaces(): boolean;
    isRefer(): boolean;
    isSeeAlso(): boolean;
    /**
     * Get link description in Vietnamese
     */
    getDescription(): string;
    /**
     * Convert to plain object for serialization
     */
    toJSON(): {
        otherPatientId: string;
        linkType: PatientLinkType;
        createdAt: string;
        createdBy: string;
    };
}
//# sourceMappingURL=PatientLink.d.ts.map