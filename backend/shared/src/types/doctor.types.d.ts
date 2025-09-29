import { BaseEntity } from './common.types';
export interface Doctor extends BaseEntity {
    doctor_id: string;
    profile_id: string;
    full_name: string;
    email?: string;
    phone_number?: string;
    specialty: string;
    qualification: string;
    department_id: string;
    department_name?: string;
    department_description?: string;
    department_location?: string;
    license_number: string;
    gender: string;
    bio?: string;
    experience_years: number;
    consultation_fee?: number;
    address?: any;
    languages_spoken: string[];
    availability_status: string;
    rating: number;
    total_reviews: number;
}
export interface CreateDoctorRequest {
    full_name: string;
    specialty: string;
    qualification: string;
    department_id: string;
    license_number: string;
    gender: string;
    bio?: string;
    experience_years?: number;
    consultation_fee?: number;
    address?: any;
    languages_spoken?: string[];
    profile_id?: string;
}
export interface UpdateDoctorRequest {
    full_name?: string;
    specialty?: string;
    qualification?: string;
    working_hours?: string;
    department_id?: string;
    license_number?: string;
    gender?: string;
    photo_url?: string;
    phone_number?: string;
    email?: string;
}
export interface DoctorSchedule {
    doctor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
}
export interface DoctorAvailability {
    doctor_id: string;
    date: Date;
    start_time: string;
    end_time: string;
    is_available: boolean;
    reason?: string;
}
export interface DoctorSearchQuery {
    specialty?: string;
    department_id?: string;
    gender?: string;
    available_date?: string;
    available_time?: string;
    search?: string;
    min_rating?: number;
    max_consultation_fee?: number;
    languages?: string;
    availability_status?: string;
    experience_years?: number;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface DoctorWithDepartment extends Doctor {
    department_name?: string;
}
export interface DoctorStats {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    average_rating?: number;
    total_patients: number;
}
export interface DoctorSchedule {
    schedule_id: string;
    doctor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    break_start?: string;
    break_end?: string;
    max_appointments?: number;
    slot_duration?: number;
    created_at: Date;
    updated_at: Date;
}
export interface CreateScheduleRequest {
    doctor_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
    break_start?: string;
    break_end?: string;
    max_appointments?: number;
    slot_duration?: number;
}
export interface UpdateScheduleRequest {
    day_of_week?: number;
    start_time?: string;
    end_time?: string;
    is_available?: boolean;
    break_start?: string;
    break_end?: string;
    max_appointments?: number;
    slot_duration?: number;
}
export interface DoctorReview {
    review_id: string;
    doctor_id: string;
    patient_id: string;
    appointment_id?: string;
    rating: number;
    review_text?: string;
    review_date: Date;
    is_anonymous: boolean;
    is_verified: boolean;
    helpful_count: number;
    created_at: Date;
    updated_at: Date;
    patients?: {
        patient_id: string;
        full_name: string;
        phone_number?: string;
    };
}
export interface CreateReviewRequest {
    doctor_id: string;
    patient_id: string;
    appointment_id?: string;
    rating: number;
    review_text?: string;
    is_anonymous?: boolean;
}
export interface ReviewStats {
    total_reviews: number;
    average_rating: number;
    rating_distribution: {
        five_star: number;
        four_star: number;
        three_star: number;
        two_star: number;
        one_star: number;
    };
    recent_reviews: DoctorReview[];
}
export interface DoctorShift {
    shift_id: string;
    doctor_id: string;
    shift_type: 'morning' | 'afternoon' | 'night' | 'emergency';
    shift_date: Date;
    start_time: string;
    end_time: string;
    department_id: string;
    status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    is_emergency_shift: boolean;
    notes?: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreateShiftRequest {
    doctor_id: string;
    shift_type: 'morning' | 'afternoon' | 'night' | 'emergency';
    shift_date: Date;
    start_time: string;
    end_time: string;
    department_id: string;
    is_emergency_shift?: boolean;
    notes?: string;
}
export interface UpdateShiftRequest {
    shift_type?: 'morning' | 'afternoon' | 'night' | 'emergency';
    shift_date?: Date;
    start_time?: string;
    end_time?: string;
    department_id?: string;
    status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
    is_emergency_shift?: boolean;
    notes?: string;
}
export interface DoctorExperience {
    experience_id: string;
    doctor_id: string;
    institution_name: string;
    position: string;
    start_date: Date;
    end_date?: Date;
    is_current: boolean;
    description?: string;
    experience_type: 'work' | 'education' | 'certification' | 'research';
    created_at: Date;
    updated_at: Date;
}
export interface CreateExperienceRequest {
    doctor_id: string;
    institution_name: string;
    position: string;
    start_date: Date;
    end_date?: Date;
    is_current?: boolean;
    description?: string;
    experience_type: 'work' | 'education' | 'certification' | 'research';
}
export interface DoctorProfile extends Doctor {
    certifications?: string[];
    awards?: string[];
    research_interests?: string[];
    schedule?: DoctorSchedule[];
    reviews?: DoctorReview[];
    review_stats?: ReviewStats;
    experiences?: DoctorExperience[];
    current_shifts?: DoctorShift[];
}
//# sourceMappingURL=doctor.types.d.ts.map