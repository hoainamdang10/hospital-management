/**
 * PatientLink Value Object
 * 
 * FHIR-style patient linking for duplicate management
 * Based on HL7 FHIR R5 Patient.link specification
 */

import { ValueObject } from '@shared/domain/base/value-object';
import { PatientId } from './PatientId';

export type PatientLinkType = 'replaced-by' | 'replaces' | 'refer' | 'seealso';

export interface PatientLinkProps {
  otherPatientId: PatientId;
  linkType: PatientLinkType;
  createdAt: Date;
  createdBy: string;
}

export class PatientLink extends ValueObject<PatientLinkProps> {
  private constructor(props: PatientLinkProps) {
    super(props);
  }

  /**
   * Create new patient link
   */
  public static create(
    otherPatientId: PatientId,
    linkType: PatientLinkType,
    createdBy: string = 'system'
  ): PatientLink {
    return new PatientLink({
      otherPatientId,
      linkType,
      createdAt: new Date(),
      createdBy
    });
  }

  /**
   * Create "replaced-by" link (this patient is duplicate, use other patient)
   */
  public static createReplacedBy(otherPatientId: PatientId, createdBy: string): PatientLink {
    return PatientLink.create(otherPatientId, 'replaced-by', createdBy);
  }

  /**
   * Create "replaces" link (this patient replaces other patient)
   */
  public static createReplaces(otherPatientId: PatientId, createdBy: string): PatientLink {
    return PatientLink.create(otherPatientId, 'replaces', createdBy);
  }

  /**
   * Create "refer" link (refer to authoritative record)
   */
  public static createRefer(otherPatientId: PatientId, createdBy: string): PatientLink {
    return PatientLink.create(otherPatientId, 'refer', createdBy);
  }

  /**
   * Create "seealso" link (related record)
   */
  public static createSeeAlso(otherPatientId: PatientId, createdBy: string): PatientLink {
    return PatientLink.create(otherPatientId, 'seealso', createdBy);
  }

  // Getters
  public get otherPatientId(): PatientId {
    return this.props.otherPatientId;
  }

  public get linkType(): PatientLinkType {
    return this.props.linkType;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get createdBy(): string {
    return this.props.createdBy;
  }

  // Business Methods
  public isReplacedBy(): boolean {
    return this.props.linkType === 'replaced-by';
  }

  public isReplaces(): boolean {
    return this.props.linkType === 'replaces';
  }

  public isRefer(): boolean {
    return this.props.linkType === 'refer';
  }

  public isSeeAlso(): boolean {
    return this.props.linkType === 'seealso';
  }

  /**
   * Get link description in Vietnamese
   */
  public getDescription(): string {
    switch (this.props.linkType) {
      case 'replaced-by':
        return `Bản ghi trùng lặp, sử dụng bệnh nhân ${this.props.otherPatientId.getValue()}`;
      case 'replaces':
        return `Thay thế bệnh nhân ${this.props.otherPatientId.getValue()}`;
      case 'refer':
        return `Tham chiếu đến bệnh nhân ${this.props.otherPatientId.getValue()}`;
      case 'seealso':
        return `Liên quan đến bệnh nhân ${this.props.otherPatientId.getValue()}`;
      default:
        return `Liên kết với bệnh nhân ${this.props.otherPatientId.getValue()}`;
    }
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): any {
    return {
      otherPatientId: this.props.otherPatientId.getValue(),
      linkType: this.props.linkType,
      createdAt: this.props.createdAt.toISOString(),
      createdBy: this.props.createdBy
    };
  }
}

