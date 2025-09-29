// =====================================================
// ENUM TYPES - VIETNAMESE ONLY VERSION
// =====================================================
// Phiên bản đơn giản chỉ sử dụng tiếng Việt

// Base interface for status_values table (main enum table)
export interface BaseEnum {
  status_id: string;
  status_type: string;
  status_value: string;
  status_label: string;
  description?: string;
  color_code?: string;
  icon_name?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  code?: string;
  name?: string;
  applies_to?: string;
}

// Individual enum table interfaces
export interface Specialty extends BaseEnum {}

export interface DepartmentEnum extends BaseEnum {}

export interface RoomType extends BaseEnum {}

export interface Diagnosis extends BaseEnum {
  icd_code?: string;
}

export interface Medication extends BaseEnum {
  drug_class?: string;
  dosage_form?: string;
}

export interface StatusValue extends BaseEnum {
  applies_to?: string;
}

export interface PaymentMethod extends BaseEnum {
  requires_verification: boolean;
  processing_fee: number;
}

// Enum option for UI components
export interface EnumOption {
  value: string | number;
  label: string;
  description?: string;
  color?: string;
  icon?: string;
  // Additional fields for specialty-department mapping
  department_id?: string;
  department_name?: string;
}

// Service response types
export interface GetEnumsResponse<T> {
  success: boolean;
  data: T[];
  error?: string;
}

// Helper functions for enum display (Vietnamese only)
export function getEnumDisplayName(enumItem: BaseEnum): string {
  return enumItem.name; // Changed from name_vi to name
}

export function getEnumDescription(enumItem: BaseEnum): string | undefined {
  return enumItem.description; // Changed from description_vi to description
}

// Convert enum to option format for UI components
export function enumToOption(enumItem: BaseEnum): EnumOption {
  return {
    value: enumItem.code,
    label: enumItem.name, // Changed from name_vi to name
    description: enumItem.description, // Changed from description_vi to description
    color: enumItem.color_code,
    icon: enumItem.icon_name,
  };
}
