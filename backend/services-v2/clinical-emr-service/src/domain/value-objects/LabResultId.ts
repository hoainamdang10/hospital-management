/**
 * LabResultId Value Object
 * Unique identifier for lab results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ValueObject } from '@shared/domain/base/value-object';
import { v4 as uuidv4 } from 'uuid';

interface LabResultIdProps {
  value: string;
}

export class LabResultId extends ValueObject<LabResultIdProps> {
  private constructor(props: LabResultIdProps) {
    super(props);
  }

  public static create(id?: string): LabResultId {
    return new LabResultId({
      value: id || `LAB-${uuidv4()}`,
    });
  }

  public static fromString(id: string): LabResultId {
    if (!id || id.trim().length === 0) {
      throw new Error('LabResultId cannot be empty');
    }
    return new LabResultId({ value: id });
  }

  get value(): string {
    return this.props.value;
  }

  public equals(other: LabResultId): boolean {
    if (!other) return false;
    return this.props.value === other.props.value;
  }

  public toString(): string {
    return this.props.value;
  }
}

