// Department types for the hospital management system

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
  phone_number?: string;          // Match database schema
  email?: string;
}

export interface UpdateDepartmentRequest {
  department_name?: string;
  department_code?: string;
  description?: string;
  parent_department_id?: string;
  head_doctor_id?: string;
  location?: string;
  phone_number?: string;          // Match database schema
  email?: string;
  is_active?: boolean;
}

export interface DepartmentSearchFilters {
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

// Specialty types
export interface Specialty {
  specialty_id: string;
  specialty_name: string;
  department_id: string;
  description?: string;
  required_certifications?: string[];
  average_consultation_time?: number;
  consultation_fee_range?: {
    min: number;
    max: number;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSpecialtyRequest {
  specialty_name: string;
  department_id: string;
  description?: string;
  required_certifications?: string[];
  average_consultation_time?: number;
  consultation_fee_range?: {
    min: number;
    max: number;
  };
}

export interface UpdateSpecialtyRequest {
  specialty_name?: string;
  department_id?: string;
  description?: string;
  required_certifications?: string[];
  average_consultation_time?: number;
  consultation_fee_range?: {
    min: number;
    max: number;
  };
  is_active?: boolean;
}

export interface SpecialtyWithDetails extends Specialty {
  department?: {
    department_id: string;
    department_name: string;
    department_code: string;
  };
  doctor_count?: number;
}

export interface SpecialtySearchFilters {
  search?: string;
  department_id?: string;
  is_active?: boolean;
  min_consultation_time?: number;
  max_consultation_time?: number;
}

export interface SpecialtyStats {
  total_specialties: number;
  active_specialties: number;
  inactive_specialties: number;
  average_consultation_time: number;
  departments_with_specialties: number;
  specialties_per_department: Record<string, number>;
}





// Room types
export interface Room {
  room_id: string;                 // CARD-ROOM-001
  room_number: string;
  department_id: string;
  room_type: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  capacity: number;
  equipment_ids?: string[];
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  location?: {
    floor: number;
    wing: string;
    coordinates?: { x: number; y: number; };
  };
  notes?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateRoomRequest {
  room_number: string;
  department_id: string;
  room_type?: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  room_type_id?: string; // For database compatibility
  capacity: number;
  equipment_ids?: string[];
  location?: {
    floor: number;
    wing: string;
    coordinates?: { x: number; y: number; };
  };
  notes?: string;
}

export interface UpdateRoomRequest {
  room_number?: string;
  department_id?: string;
  room_type?: 'consultation' | 'surgery' | 'emergency' | 'ward' | 'icu' | 'laboratory';
  capacity?: number;
  equipment_ids?: string[];
  status?: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  location?: {
    floor: number;
    wing: string;
    coordinates?: { x: number; y: number; };
  };
  notes?: string;
  is_active?: boolean;
}

export interface RoomWithDetails extends Room {
  department?: {
    department_id: string;
    department_name: string;
  };
  equipment?: Array<{
    equipment_id: string;
    name: string;
    type: string;
    status: string;
  }>;
  current_occupancy?: number;
  upcoming_bookings?: Array<{
    booking_id: string;
    start_time: Date;
    end_time: Date;
    purpose: string;
  }>;
}

// API Response types
export interface DepartmentResponse {
  success: boolean;
  data?: Department | Department[] | DepartmentWithDetails | DepartmentWithDetails[];
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SpecialtyResponse {
  success: boolean;
  data?: Specialty | Specialty[] | SpecialtyWithDetails | SpecialtyWithDetails[];
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RoomResponse {
  success: boolean;
  data?: Room | Room[] | RoomWithDetails | RoomWithDetails[];
  message?: string;
  timestamp: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
