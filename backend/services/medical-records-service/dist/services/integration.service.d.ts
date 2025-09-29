export declare class IntegrationService {
    private endpoints;
    private httpClient;
    constructor();
    validatePatient(patientId: string): Promise<boolean>;
    getPatientInfo(patientId: string): Promise<any>;
    updatePatientLastVisit(patientId: string): Promise<void>;
    validateDoctor(doctorId: string): Promise<boolean>;
    getDoctorInfo(doctorId: string): Promise<any>;
    updateDoctorStats(doctorId: string, recordCount: number): Promise<void>;
    getRelatedAppointment(patientId: string, doctorId: string, date: string): Promise<any>;
    updateAppointmentStatus(appointmentId: string, status: string): Promise<void>;
    createBillingRecord(recordData: {
        patient_id: string;
        doctor_id: string;
        record_id: string;
        services: string[];
        amount?: number;
    }): Promise<any>;
    sendNotification(notification: {
        type: "medical_record_created" | "medical_record_updated" | "critical_result";
        recipients: string[];
        patient_id: string;
        doctor_id: string;
        record_id: string;
        urgency?: "low" | "medium" | "high" | "critical";
        message?: string;
    }): Promise<void>;
    healthCheck(): Promise<{
        [key: string]: boolean;
    }>;
    validateMultiplePatients(patientIds: string[]): Promise<{
        [key: string]: boolean;
    }>;
    validateMultipleDoctors(doctorIds: string[]): Promise<{
        [key: string]: boolean;
    }>;
    private circuitBreakers;
    private executeWithCircuitBreaker;
}
export declare const integrationService: IntegrationService;
//# sourceMappingURL=integration.service.d.ts.map