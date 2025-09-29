import { AxiosRequestConfig } from "axios";
/**
 * REST API Service Configuration
 */
interface RestApiConfig {
    baseURL: string;
    token?: string;
    requestId: string;
    language: "vi" | "en";
    timeout?: number;
}
/**
 * Standard API Response from microservices
 */
interface StandardApiResponse<T = any> {
    success: boolean;
    data: T;
    error?: {
        message: string;
        code: string;
        details?: any;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    meta?: {
        timestamp: string;
        requestId: string;
        version: string;
        service: string;
    };
}
/**
 * REST API Service
 * Handles communication with existing microservices
 */
export declare class RestApiService {
    private client;
    private config;
    constructor(config: RestApiConfig);
    /**
     * Doctor Service API calls
     */
    getDoctors(params?: {
        page?: number;
        limit?: number;
        search?: string;
        specialization?: string;
        departmentId?: string;
    }): Promise<StandardApiResponse>;
    getDoctor(id: string): Promise<StandardApiResponse>;
    createDoctor(data: any): Promise<StandardApiResponse>;
    updateDoctor(id: string, data: any): Promise<StandardApiResponse>;
    deleteDoctor(id: string): Promise<StandardApiResponse>;
    getDoctorSchedule(doctor_id: string, date?: string): Promise<StandardApiResponse>;
    getDoctorStats(doctor_id: string): Promise<StandardApiResponse>;
    /**
     * Patient Service API calls
     */
    getPatients(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<StandardApiResponse>;
    getPatient(id: string): Promise<StandardApiResponse>;
    createPatient(data: any): Promise<StandardApiResponse>;
    updatePatient(id: string, data: any): Promise<StandardApiResponse>;
    deletePatient(id: string): Promise<StandardApiResponse>;
    getPatientByProfile(profileId: string): Promise<StandardApiResponse>;
    searchPatients(params: {
        query: string;
        limit?: number;
        offset?: number;
        [key: string]: any;
    }): Promise<StandardApiResponse>;
    getPatientMedicalSummary(patient_id: string): Promise<StandardApiResponse>;
    getPatientStats(patient_id: string): Promise<StandardApiResponse>;
    getPatientDoctorHistory(patient_id: string, doctor_id: string, limit: number): Promise<StandardApiResponse>;
    activatePatient(id: string): Promise<StandardApiResponse>;
    deactivatePatient(id: string): Promise<StandardApiResponse>;
    updatePatientMedicalInfo(id: string, medicalInfo: any): Promise<StandardApiResponse>;
    updatePatientInsurance(id: string, insuranceInfo: any): Promise<StandardApiResponse>;
    /**
     * Appointment Service API calls
     */
    getAppointments(params?: {
        page?: number;
        limit?: number;
        doctor_id?: string;
        patient_id?: string;
        status?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    getAppointment(id: string): Promise<StandardApiResponse>;
    createAppointment(data: any): Promise<StandardApiResponse>;
    updateAppointment(id: string, data: any): Promise<StandardApiResponse>;
    cancelAppointment(id: string, reason: string): Promise<StandardApiResponse>;
    getAvailableSlots(doctor_id: string, date: string): Promise<StandardApiResponse>;
    getTodayAppointments(params: {
        doctor_id?: string;
        departmentId?: string;
        status?: string;
        date: string;
    }): Promise<StandardApiResponse>;
    getUpcomingAppointments(params: {
        doctor_id?: string;
        patient_id?: string;
        days?: number;
        limit?: number;
    }): Promise<StandardApiResponse>;
    getAppointmentStats(params: {
        doctor_id?: string;
        patient_id?: string;
        departmentId?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    confirmAppointment(id: string): Promise<StandardApiResponse>;
    rescheduleAppointment(id: string, data: {
        newDate: string;
        newTime: string;
    }): Promise<StandardApiResponse>;
    checkInAppointment(id: string): Promise<StandardApiResponse>;
    completeAppointment(id: string, notes?: string): Promise<StandardApiResponse>;
    /**
     * Department Service API calls
     */
    getDepartments(params?: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<StandardApiResponse>;
    getDepartment(id: string): Promise<StandardApiResponse>;
    createDepartment(data: any): Promise<StandardApiResponse>;
    updateDepartment(id: string, data: any): Promise<StandardApiResponse>;
    /**
     * Medical Records Service API calls
     */
    getMedicalRecords(params?: {
        limit?: number;
        offset?: number;
        sortBy?: string;
        sortOrder?: string;
        [key: string]: any;
    }): Promise<StandardApiResponse>;
    getMedicalRecord(id: string): Promise<StandardApiResponse>;
    createMedicalRecord(data: any): Promise<StandardApiResponse>;
    updateMedicalRecord(id: string, data: any): Promise<StandardApiResponse>;
    deleteMedicalRecord(id: string): Promise<StandardApiResponse>;
    getPatientMedicalRecords(params: {
        patient_id: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    getDoctorMedicalRecords(params: {
        doctor_id: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    searchMedicalRecords(params: {
        query: string;
        limit?: number;
        offset?: number;
        [key: string]: any;
    }): Promise<StandardApiResponse>;
    getVitalSignsHistory(params: {
        patient_id: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    getLabResults(params: {
        patient_id: string;
        testType?: string;
        limit?: number;
        offset?: number;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<StandardApiResponse>;
    /**
     * Authentication Service API calls
     */
    validateToken(token: string): Promise<StandardApiResponse>;
    refreshToken(refreshToken: string): Promise<StandardApiResponse>;
    /**
     * Generic API call method
     */
    request<T = any>(config: AxiosRequestConfig): Promise<StandardApiResponse<T>>;
    /**
     * Batch requests for DataLoader
     */
    batchRequest<T = any>(requests: AxiosRequestConfig[]): Promise<StandardApiResponse<T>[]>;
    /**
     * Format axios errors to GraphQL errors
     */
    private formatError;
    /**
     * Translate error messages to Vietnamese
     */
    private translateErrorMessage;
    /**
     * Update authentication token
     */
    updateToken(token: string): void;
    /**
     * Remove authentication token
     */
    removeToken(): void;
    getDoctorReviews(params: any): Promise<StandardApiResponse>;
    createDoctorReview(data: any): Promise<StandardApiResponse>;
    updateDoctorReview(id: string, data: any): Promise<StandardApiResponse>;
    deleteDoctorReview(id: string): Promise<StandardApiResponse>;
    getRoom(id: string): Promise<StandardApiResponse>;
    getRooms(params: any): Promise<StandardApiResponse>;
    /**
     * Receptionist Service API calls
     */
    getReceptionistQueue(params?: {
        date?: string;
        doctor_id?: string;
        department_id?: string;
    }): Promise<StandardApiResponse>;
}
export default RestApiService;
//# sourceMappingURL=rest-api.service.d.ts.map