/**
 * AppointmentDetails Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches database columns: reason, chief_complaint, symptoms, notes, special_instructions
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { HealthcareValueObject } from '@shared/domain/base/value-object';

export interface AppointmentDetailsProps {
  reason?: string;
  chiefComplaint?: string;
  symptoms?: string[]; // Stored as JSONB in database
  notes?: string;
  specialInstructions?: string;
}

/**
 * AppointmentDetails Value Object
 * Contains clinical information about the appointment
 */
export class AppointmentDetails extends HealthcareValueObject<AppointmentDetailsProps> {
  private constructor(props: AppointmentDetailsProps) {
    super(props);
  }

  /**
   * Create AppointmentDetails
   */
  public static create(
    reason?: string,
    chiefComplaint?: string,
    symptoms?: string[],
    notes?: string,
    specialInstructions?: string
  ): AppointmentDetails {
    // Validate inputs
    if (reason && reason.length > 500) {
      throw new Error('Reason must be less than 500 characters');
    }

    if (chiefComplaint && chiefComplaint.length > 500) {
      throw new Error('Chief complaint must be less than 500 characters');
    }

    if (notes && notes.length > 2000) {
      throw new Error('Notes must be less than 2000 characters');
    }

    if (specialInstructions && specialInstructions.length > 1000) {
      throw new Error('Special instructions must be less than 1000 characters');
    }

    return new AppointmentDetails({
      reason,
      chiefComplaint,
      symptoms: symptoms || [],
      notes,
      specialInstructions
    });
  }

  /**
   * Create empty details
   */
  public static empty(): AppointmentDetails {
    return new AppointmentDetails({
      symptoms: []
    });
  }

  /**
   * Validate value object format (required by ValueObject base class)
   */
  protected validateFormat(): void {
    // All fields are optional, so no strict validation needed
    // Length validations are done in create() method
  }

  /**
   * Get reason
   */
  get reason(): string | undefined {
    return this.props.reason;
  }

  /**
   * Get chief complaint
   */
  get chiefComplaint(): string | undefined {
    return this.props.chiefComplaint;
  }

  /**
   * Get symptoms
   */
  get symptoms(): string[] {
    return this.props.symptoms || [];
  }

  /**
   * Get notes
   */
  get notes(): string | undefined {
    return this.props.notes;
  }

  /**
   * Get special instructions
   */
  get specialInstructions(): string | undefined {
    return this.props.specialInstructions;
  }

  /**
   * Check if details are empty
   */
  isEmpty(): boolean {
    return !this.props.reason && 
           !this.props.chiefComplaint && 
           (!this.props.symptoms || this.props.symptoms.length === 0) &&
           !this.props.notes && 
           !this.props.specialInstructions;
  }

  /**
   * Add symptom
   */
  addSymptom(symptom: string): AppointmentDetails {
    const symptoms = [...(this.props.symptoms || []), symptom];
    return new AppointmentDetails({
      ...this.props,
      symptoms
    });
  }

  /**
   * Remove symptom
   */
  removeSymptom(symptom: string): AppointmentDetails {
    const symptoms = (this.props.symptoms || []).filter(s => s !== symptom);
    return new AppointmentDetails({
      ...this.props,
      symptoms
    });
  }

  /**
   * Update reason
   */
  updateReason(reason: string): AppointmentDetails {
    if (reason.length > 500) {
      throw new Error('Reason must be less than 500 characters');
    }

    return new AppointmentDetails({
      ...this.props,
      reason
    });
  }

  /**
   * Update chief complaint
   */
  updateChiefComplaint(chiefComplaint: string): AppointmentDetails {
    if (chiefComplaint.length > 500) {
      throw new Error('Chief complaint must be less than 500 characters');
    }

    return new AppointmentDetails({
      ...this.props,
      chiefComplaint
    });
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): AppointmentDetails {
    if (notes.length > 2000) {
      throw new Error('Notes must be less than 2000 characters');
    }

    return new AppointmentDetails({
      ...this.props,
      notes
    });
  }

  /**
   * Update special instructions
   */
  updateSpecialInstructions(specialInstructions: string): AppointmentDetails {
    if (specialInstructions.length > 1000) {
      throw new Error('Special instructions must be less than 1000 characters');
    }

    return new AppointmentDetails({
      ...this.props,
      specialInstructions
    });
  }

  /**
   * Healthcare-specific: Contains PHI
   */
  override containsPHI(): boolean {
    return true; // Clinical information is PHI
  }

  /**
   * Anonymize for logging
   */
  override anonymize(): AppointmentDetails {
    return AppointmentDetails.create(
      '[REDACTED]',
      '[REDACTED]',
      ['[REDACTED]'],
      '[REDACTED]',
      '[REDACTED]'
    );
  }

  /**
   * String representation
   */
  override toString(): string {
    const parts: string[] = [];
    
    if (this.props.reason) {
      parts.push(`Reason: ${this.props.reason}`);
    }
    
    if (this.props.chiefComplaint) {
      parts.push(`Chief Complaint: ${this.props.chiefComplaint}`);
    }
    
    if (this.props.symptoms && this.props.symptoms.length > 0) {
      parts.push(`Symptoms: ${this.props.symptoms.join(', ')}`);
    }
    
    return parts.join(' | ') || 'No details';
  }
}

