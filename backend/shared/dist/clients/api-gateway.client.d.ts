export interface ApiGatewayClientConfig {
    baseUrl: string;
    serviceName: string;
    timeout?: number;
    retries?: number;
}
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
/**
 * API Gateway Client for Service-to-Service Communication
 *
 * This client allows services to communicate through API Gateway
 * instead of making direct service-to-service calls.
 */
export declare class ApiGatewayClient {
    private client;
    private serviceName;
    private retries;
    constructor(config: ApiGatewayClientConfig);
    /**
     * Make GET request to Patient Service through API Gateway
     */
    getPatient(patientId: string): Promise<ServiceResponse>;
    /**
     * Get patient statistics for a doctor
     */
    getPatientStats(doctorId: string): Promise<ServiceResponse>;
    /**
     * Search patients
     */
    searchPatients(query: string, limit?: number): Promise<ServiceResponse>;
    /**
     * Make GET request to Appointment Service through API Gateway
     */
    getDoctorAppointments(doctorId: string, filters?: {
        date?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<ServiceResponse>;
    /**
     * Get appointment statistics for a doctor
     */
    getAppointmentStats(doctorId: string): Promise<ServiceResponse>;
    /**
     * Get doctor information through API Gateway
     */
    getDoctor(doctorId: string): Promise<ServiceResponse>;
    /**
     * Get doctor availability
     */
    getDoctorAvailability(doctorId: string, date: string): Promise<ServiceResponse>;
    /**
     * Get available time slots for a doctor
     */
    getDoctorTimeSlots(doctorId: string, date: string, duration?: number): Promise<ServiceResponse>;
    /**
     * Get department information
     */
    getDepartment(departmentId: string): Promise<ServiceResponse>;
    /**
     * Get all departments
     */
    getDepartments(): Promise<ServiceResponse>;
    /**
     * Generic method to make requests with retry logic
     */
    private makeRequest;
    /**
     * Generate unique request ID for tracing
     */
    private generateRequestId;
    /**
     * Check if a service is available through health check
     */
    checkServiceHealth(serviceName: string): Promise<boolean>;
    /**
     * Get service discovery information
     */
    getServiceDiscovery(): Promise<ServiceResponse>;
}
/**
 * Factory function to create API Gateway client instances
 */
export declare function createApiGatewayClient(config: ApiGatewayClientConfig): ApiGatewayClient;
/**
 * Default API Gateway client configuration
 */
export declare const defaultApiGatewayConfig: {
    baseUrl: string;
    timeout: number;
    retries: number;
};
//# sourceMappingURL=api-gateway.client.d.ts.map