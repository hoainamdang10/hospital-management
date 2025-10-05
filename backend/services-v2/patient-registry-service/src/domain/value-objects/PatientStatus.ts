/**
 * PatientStatus Enum
 *
 * Patient record status based on HL7 FHIR Patient.active specification
 */

export enum PatientStatus {
  ACTIVE = 'active',       // Patient record is in active use
  INACTIVE = 'inactive',   // Patient record is not in active use (e.g., moved away)
  DECEASED = 'deceased',   // Patient is deceased
  MERGED = 'merged'        // Patient record is duplicate and merged into another
}

export class PatientStatusHelper {
  /**
   * Get Vietnamese description for status
   */
  public static getDescription(status: PatientStatus): string {
    switch (status) {
      case PatientStatus.ACTIVE:
        return 'Đang hoạt động';
      case PatientStatus.INACTIVE:
        return 'Không hoạt động';
      case PatientStatus.DECEASED:
        return 'Đã qua đời';
      case PatientStatus.MERGED:
        return 'Đã gộp (trùng lặp)';
      default:
        return 'Không xác định';
    }
  }

  /**
   * Check if status is valid
   */
  public static isValid(status: string): boolean {
    return Object.values(PatientStatus).includes(status as PatientStatus);
  }

  /**
   * Parse string to PatientStatus
   */
  public static parse(status: string): PatientStatus {
    if (!this.isValid(status)) {
      throw new Error(`Invalid patient status: ${status}`);
    }
    return status as PatientStatus;
  }

  /**
   * Check if patient can be updated
   */
  public static canUpdate(status: PatientStatus): boolean {
    return status === PatientStatus.ACTIVE;
  }

  /**
   * Check if patient can be merged
   */
  public static canMerge(status: PatientStatus): boolean {
    return status === PatientStatus.ACTIVE || status === PatientStatus.INACTIVE;
  }

  /**
   * Check if patient can be deactivated
   */
  public static canDeactivate(status: PatientStatus): boolean {
    return status === PatientStatus.ACTIVE;
  }
}

