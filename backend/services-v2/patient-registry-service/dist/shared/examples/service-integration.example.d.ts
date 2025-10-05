/**
 * Service Integration Examples
 * Demonstrates how to integrate Identity & Access Service with existing services
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Service Integration, Authentication Flow, Healthcare Security
 */
/**
 * EXAMPLE 1: PATIENT REGISTRY SERVICE INTEGRATION
 * Shows how to protect Patient Registry endpoints with authentication
 */
export declare class PatientRegistryServiceIntegration {
    private app;
    private authMiddleware;
    private logger;
    constructor();
    private setupAuthentication;
    private setupRoutes;
    private checkPatientAccess;
    private createPatient;
    private getPatientById;
    private updatePatient;
    private getPatientMedicalHistory;
    private getOwnPatientData;
}
/**
 * EXAMPLE 2: SCHEDULING SERVICE INTEGRATION
 * Shows how to integrate with Scheduling Service for appointment management
 */
export declare class SchedulingServiceIntegration {
    private app;
    private authMiddleware;
    private logger;
    constructor();
    private setupAuthentication;
    private setupRoutes;
    private createAppointment;
    private getAppointments;
    private updateAppointmentStatus;
    private cancelAppointment;
    private getPatientAppointments;
    private getProviderAppointments;
    private getAllAppointments;
    private getAppointmentById;
}
/**
 * EXAMPLE 3: UNIFIED AUTHENTICATION FLOW
 * Shows complete authentication flow across all services
 */
export declare class UnifiedAuthenticationFlow {
    /**
     * Step 1: User logs in through Identity & Access Service
     */
    static loginFlow(): Promise<void>;
    /**
     * Step 2: Frontend stores token and makes authenticated requests
     */
    static authenticatedRequestFlow(): Promise<void>;
    /**
     * Step 3: Cross-service communication with authentication
     */
    static crossServiceFlow(): Promise<void>;
}
export { PatientRegistryServiceIntegration, SchedulingServiceIntegration, UnifiedAuthenticationFlow };
//# sourceMappingURL=service-integration.example.d.ts.map