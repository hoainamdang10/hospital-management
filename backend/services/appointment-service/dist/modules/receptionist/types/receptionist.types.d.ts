export interface Receptionist {
    receptionist_id: string;
    profile_id: string;
    full_name: string;
    department_id?: string;
    shift_schedule: ShiftSchedule;
    access_permissions: AccessPermissions;
    can_manage_appointments: boolean;
    can_manage_patients: boolean;
    can_view_medical_records: boolean;
    languages_spoken: string[];
    status: 'active' | 'inactive' | 'on_leave';
    is_active: boolean;
    created_at: string;
    updated_at: string;
    created_by?: string;
}
export interface ShiftSchedule {
    monday?: ShiftTime;
    tuesday?: ShiftTime;
    wednesday?: ShiftTime;
    thursday?: ShiftTime;
    friday?: ShiftTime;
    saturday?: ShiftTime;
    sunday?: ShiftTime;
    breaks?: BreakTime[];
    overtime_allowed?: boolean;
}
export interface ShiftTime {
    start_time: string;
    end_time: string;
    is_working: boolean;
}
export interface BreakTime {
    start_time: string;
    end_time: string;
    description?: string;
}
export interface AccessPermissions {
    can_manage_appointments: boolean;
    can_manage_patients: boolean;
    can_view_medical_records: boolean;
    can_access_reports: boolean;
    can_manage_queue: boolean;
    can_call_patients: boolean;
    departments_access?: string[];
}
export interface CheckInData {
    patient_id: string;
    appointment_id: string;
    receptionist_id: string;
    check_in_time: string;
    insurance_verified: boolean;
    documents_complete: boolean;
    notes?: string;
    status: CheckInStatus;
    priority_level?: 'normal' | 'urgent' | 'emergency';
    special_requirements?: string[];
}
export type CheckInStatus = 'checked_in' | 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show';
export interface PatientCheckIn {
    check_in_id: string;
    patient_id: string;
    appointment_id: string;
    receptionist_id: string;
    check_in_time: string;
    insurance_verified: boolean;
    documents_complete: boolean;
    notes?: string;
    status: CheckInStatus;
    priority_level: 'normal' | 'urgent' | 'emergency';
    special_requirements: string[];
    created_at: string;
    updated_at: string;
}
export interface QueueItem {
    id: string;
    patient_id: string;
    appointment_id: string;
    patient_name: string;
    doctor_name: string;
    appointment_time: string;
    status: CheckInStatus;
    check_in_time?: string;
    queue_number: number;
    estimated_wait_time: number;
    priority_level: 'normal' | 'urgent' | 'emergency';
    special_requirements?: string[];
    room_number?: string;
    department?: string;
}
export interface QueueStatus {
    total_patients: number;
    waiting_patients: number;
    in_progress_patients: number;
    completed_patients: number;
    average_wait_time: number;
    longest_wait_time: number;
    queue_items: QueueItem[];
    last_updated: string;
}
export interface CallNextPatientRequest {
    doctor_id: string;
    room_number?: string;
    department?: string;
    priority_override?: boolean;
}
export interface CallNextPatientResponse {
    success: boolean;
    patient?: QueueItem;
    message: string;
    room_assignment?: string;
    estimated_duration?: number;
}
export interface DashboardStats {
    today: DailyStats;
    current_shift: ShiftStats;
    queue_status: QueueStatus;
    performance_metrics: PerformanceMetrics;
    alerts: Alert[];
}
export interface DailyStats {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    no_show_appointments: number;
    total_check_ins: number;
    average_wait_time: number;
    patient_satisfaction: number;
    busiest_hour: string;
}
export interface ShiftStats {
    shift_start: string;
    shift_end: string;
    patients_served: number;
    current_queue_length: number;
    average_service_time: number;
    efficiency_rating: number;
}
export interface PerformanceMetrics {
    check_in_speed: number;
    queue_management_efficiency: number;
    patient_satisfaction_score: number;
    error_rate: number;
    productivity_score: number;
}
export interface Alert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    is_read: boolean;
    action_required?: boolean;
    action_url?: string;
}
export interface PatientSearchCriteria {
    query?: string;
    phone?: string;
    patient_id?: string;
    insurance_number?: string;
    date_of_birth?: string;
    page?: number;
    limit?: number;
}
export interface PatientSearchResult {
    patient_id: string;
    full_name: string;
    phone_number?: string;
    date_of_birth?: string;
    insurance_number?: string;
    last_visit?: string;
    upcoming_appointments?: number;
    status: 'active' | 'inactive';
}
export interface EmergencyContact {
    name: string;
    relationship: string;
    phone_number: string;
    address?: string;
    is_primary: boolean;
}
export interface InsuranceInfo {
    provider: string;
    policy_number: string;
    group_number?: string;
    expiry_date: string;
    coverage_type: string;
    is_verified: boolean;
    verification_date?: string;
    notes?: string;
}
export interface DailyReport {
    date: string;
    statistics: DailyReportStats;
    appointments: AppointmentSummary[];
    check_ins: CheckInSummary[];
    performance_summary: PerformanceSummary;
}
export interface DailyReportStats {
    total_appointments: number;
    completed_appointments: number;
    cancelled_appointments: number;
    no_show_appointments: number;
    total_check_ins: number;
    average_wait_time: number;
    busy_hours: BusyHour[];
    department_stats: DepartmentStats[];
}
export interface WeeklyReport {
    start_date: string;
    end_date: string;
    summary_stats: WeeklySummaryStats;
    daily_breakdown: DailyStats[];
    trends: TrendAnalysis;
    recommendations: string[];
}
export interface BusyHour {
    hour: string;
    appointment_count: number;
    average_wait_time: number;
}
export interface DepartmentStats {
    department_name: string;
    total_appointments: number;
    average_wait_time: number;
    patient_satisfaction: number;
}
export interface AppointmentSummary {
    appointment_id: string;
    patient_name: string;
    doctor_name: string;
    appointment_time: string;
    status: string;
    check_in_time?: string;
    completion_time?: string;
}
export interface CheckInSummary {
    check_in_id: string;
    patient_name: string;
    check_in_time: string;
    wait_time: number;
    status: CheckInStatus;
}
export interface PerformanceSummary {
    efficiency_score: number;
    patient_satisfaction: number;
    average_service_time: number;
    queue_management_score: number;
}
export interface WeeklySummaryStats {
    total_appointments: number;
    total_patients_served: number;
    average_daily_appointments: number;
    peak_day: string;
    overall_satisfaction: number;
}
export interface TrendAnalysis {
    appointment_trend: 'increasing' | 'decreasing' | 'stable';
    wait_time_trend: 'improving' | 'worsening' | 'stable';
    satisfaction_trend: 'improving' | 'worsening' | 'stable';
    efficiency_trend: 'improving' | 'worsening' | 'stable';
}
export interface CreateCheckInRequest {
    appointment_id: string;
    patient_id: string;
    insurance_verified?: boolean;
    documents_complete?: boolean;
    notes?: string;
    priority_level?: 'normal' | 'urgent' | 'emergency';
    special_requirements?: string[];
}
export interface UpdateAppointmentNotesRequest {
    receptionist_notes: string;
    insurance_verified?: boolean;
    priority_level?: 'normal' | 'urgent' | 'emergency';
}
export interface RescheduleAppointmentRequest {
    new_date: string;
    new_time: string;
    reason: string;
    notify_patient?: boolean;
}
export interface UpdatePatientInfoRequest {
    emergency_contact?: EmergencyContact;
    insurance_info?: InsuranceInfo;
    notes?: string;
}
export interface ReceptionistFilters {
    department_id?: string;
    status?: 'active' | 'inactive' | 'on_leave';
    shift_time?: 'morning' | 'afternoon' | 'evening' | 'night';
    languages_spoken?: string[];
}
export interface AppointmentFilters {
    date?: string;
    status?: string;
    doctor_id?: string;
    department?: string;
    priority_level?: 'normal' | 'urgent' | 'emergency';
}
export interface PaginationParams {
    page: number;
    limit: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}
export declare class ReceptionistError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class CheckInError extends ReceptionistError {
    constructor(message: string, code?: string);
}
export declare class QueueError extends ReceptionistError {
    constructor(message: string, code?: string);
}
//# sourceMappingURL=receptionist.types.d.ts.map