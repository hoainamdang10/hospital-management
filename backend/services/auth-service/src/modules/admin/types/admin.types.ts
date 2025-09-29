// Admin module types for Hospital Management System
// Consolidated types from Department Service integration

// =====================================================
// DEPARTMENT TYPES
// =====================================================

export interface Department {
  department_id: string;           // DEPT001, DEPT002, etc.
  department_name: string;         // Cardiology, Neurology, etc.
  department_code: string;         // CARD, NEUR, PEDI, etc.
  description?: string;
  parent_department_id?: string;   // For sub-departments
  head_doctor_id?: string;
  location?: string;
  phone_number?: string;           // Match database schema
  email?: string;
  level?: number;                  // Hierarchy level (1, 2, 3...)
  path?: string;                   // Full path for quick queries
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateDepartmentRequest {
  department_name: string;
  department_code: string;
  description?: string;
  parent_department_id?: string;
  head_doctor_id?: string;
  location?: string;
  phone_number?: string;
  email?: string;
}

export interface UpdateDepartmentRequest {
  department_name?: string;
  department_code?: string;
  description?: string;
  parent_department_id?: string;
  head_doctor_id?: string;
  location?: string;
  phone_number?: string;
  email?: string;
  is_active?: boolean;
}

export interface DepartmentFilters {
  search?: string;
  parent_department_id?: string;
  is_active?: boolean;
  head_doctor_id?: string;
}

export interface DepartmentWithDetails extends Department {
  head_doctor?: {
    doctor_id: string;
    full_name: string;
    specialty: string;
  };
  parent_department?: {
    department_id: string;
    department_name: string;
    department_code: string;
  };
  sub_departments?: Department[];
  children?: DepartmentWithDetails[];  // For tree structure
  doctor_count?: number;
  room_count?: number;
  total_sub_departments?: number;
  hierarchy_path?: Department[];       // Breadcrumb path
}

export interface DepartmentStats {
  total_departments: number;
  active_departments: number;
  departments_with_head: number;
  departments_without_head: number;
  total_doctors: number;
  total_rooms: number;
  average_doctors_per_department: number;
}

// =====================================================
// SPECIALTY TYPES
// =====================================================

export interface Specialty {
  specialty_id: string;
  specialty_name: string;
  specialty_code: string;
  description?: string;
  department_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSpecialtyRequest {
  specialty_name: string;
  specialty_code: string;
  description?: string;
  department_id?: string;
}

export interface UpdateSpecialtyRequest {
  specialty_name?: string;
  specialty_code?: string;
  description?: string;
  department_id?: string;
  is_active?: boolean;
}

export interface SpecialtyFilters {
  search?: string;
  department_id?: string;
  is_active?: boolean;
}

// =====================================================
// ROOM TYPES
// =====================================================

export interface Room {
  room_id: string;
  room_number: string;
  room_name?: string;
  room_type: 'consultation' | 'examination' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'other';
  department_id: string;
  floor?: number;
  building?: string;
  capacity?: number;
  equipment?: string[];
  is_available: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomRequest {
  room_number: string;
  room_name?: string;
  room_type: 'consultation' | 'examination' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'other';
  department_id: string;
  floor?: number;
  building?: string;
  capacity?: number;
  equipment?: string[];
}

export interface UpdateRoomRequest {
  room_number?: string;
  room_name?: string;
  room_type?: 'consultation' | 'examination' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'other';
  department_id?: string;
  floor?: number;
  building?: string;
  capacity?: number;
  equipment?: string[];
  is_available?: boolean;
  is_active?: boolean;
}

export interface RoomFilters {
  search?: string;
  department_id?: string;
  room_type?: string;
  is_available?: boolean;
  is_active?: boolean;
  floor?: number;
  building?: string;
}

// =====================================================
// PAGINATION & RESPONSE TYPES
// =====================================================

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by: string;
  sort_order: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export interface AdminDashboardStats {
  departments: DepartmentStats;
  specialties: {
    total_specialties: number;
    active_specialties: number;
  };
  rooms: {
    total_rooms: number;
    available_rooms: number;
    occupied_rooms: number;
    rooms_by_type: Record<string, number>;
  };
}

// =====================================================
// ADMIN USER MANAGEMENT TYPES
// =====================================================

export interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
  is_active: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAdminUserRequest {
  email: string;
  password: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  permissions: string[];
}

export interface UpdateAdminUserRequest {
  email?: string;
  full_name?: string;
  role?: 'admin' | 'super_admin';
  permissions?: string[];
  is_active?: boolean;
}

// =====================================================
// SYSTEM CONFIGURATION TYPES
// =====================================================

export interface SystemConfig {
  config_key: string;
  config_value: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UpdateSystemConfigRequest {
  config_value: string;
  description?: string;
}

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface AuditLog {
  log_id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

export interface AuditLogFilters {
  user_id?: string;
  action?: string;
  resource_type?: string;
  resource_id?: string;
  start_date?: Date;
  end_date?: Date;
}
