/**
 * Patient Constants
 * Shared constants for patient data management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards
 */

/**
 * Default value for unupdated patient fields
 */
export const UNUPDATED = 'Chưa cập nhật';

/**
 * Helper function to check if a value is unupdated
 */
export const isUnupdated = (value?: string | null): boolean => {
  return !value || value === UNUPDATED;
};

/**
 * Helper function to get value or default
 */
export const getValueOrDefault = (value?: string | null, defaultValue?: string): string => {
  if (isUnupdated(value)) {
    return defaultValue || UNUPDATED;
  }
  return value || defaultValue || UNUPDATED;
};

/**
 * Fields that should use "Chưa cập nhật" as default
 */
export const PATIENT_FIELDS_WITH_DEFAULTS = [
  'nationality',
  'ethnicity', 
  'occupation',
  'maritalStatus',
  'ward',
  'district',
  'city',
  'province'
] as const;

/**
 * Critical fields that should not use "Chưa cập nhật" without validation
 */
export const CRITICAL_PATIENT_FIELDS = [
  'fullName',
  'dateOfBirth',
  'gender',
  'primaryPhone',
  'email'
] as const;
