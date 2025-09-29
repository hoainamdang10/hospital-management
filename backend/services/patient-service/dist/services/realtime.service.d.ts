import { Server as HttpServer } from 'http';
export interface PatientRealtimeEvent {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    patient_id: string;
    profile_id?: string;
    old_status?: string;
    new_status?: string;
    medical_history_updated?: boolean;
    emergency_contact_updated?: boolean;
    insurance_updated?: boolean;
    timestamp: string;
}
export declare class PatientRealtimeService {
    private subscription;
    private profileSubscription;
    private eventBus;
    private wsManager;
    private isConnected;
    constructor();
    initialize(httpServer?: HttpServer): Promise<void>;
    private setupSupabaseSubscriptions;
    private handlePatientChange;
    private handleProfileChange;
    private processPatientEvent;
    private broadcastToWebSocket;
    private publishToEventBus;
    private handleSpecificEventType;
    private handleNewPatient;
    private handlePatientUpdate;
    private handlePatientDeletion;
    private checkMedicalHistoryUpdate;
    private checkEmergencyContactUpdate;
    private checkInsuranceUpdate;
    private findPatientByProfileId;
    private triggerWelcomeNotifications;
    private updatePatientStatistics;
    private handleMedicalHistoryUpdate;
    private handleEmergencyContactUpdate;
    private cleanupPatientData;
    private updateCache;
    isRealtimeConnected(): boolean;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=realtime.service.d.ts.map