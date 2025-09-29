import { Server as HttpServer } from 'http';
export interface MedicalRecordRealtimeEvent {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    record_id: string;
    patient_id?: string;
    doctor_id?: string;
    vital_signs_updated?: boolean;
    lab_results_updated?: boolean;
    diagnosis_updated?: boolean;
    treatment_updated?: boolean;
    timestamp: string;
}
export declare class MedicalRecordRealtimeService {
    private subscription;
    private vitalSignsSubscription;
    private labResultsSubscription;
    private eventBus;
    private wsManager;
    private isConnected;
    constructor();
    /**
     * Initialize real-time subscriptions for medical records
     */
    initialize(httpServer?: HttpServer): Promise<void>;
    /**
     * Setup Supabase real-time subscriptions for medical records, vital signs, and lab results tables
     */
    private setupSupabaseSubscriptions;
    /**
     * Handle medical record table changes
     */
    private handleMedicalRecordChange;
    /**
     * Handle vital signs table changes
     */
    private handleVitalSignsChange;
    /**
     * Handle lab results table changes
     */
    private handleLabResultsChange;
    /**
     * Process medical record events and broadcast to relevant channels
     */
    private processMedicalRecordEvent;
    /**
     * Broadcast event to WebSocket clients
     */
    private broadcastToWebSocket;
    /**
     * Publish event to event bus for other services
     */
    private publishToEventBus;
    /**
     * Handle specific event types
     */
    private handleSpecificEventType;
    /**
     * Handle new medical record creation
     */
    private handleNewMedicalRecord;
    /**
     * Handle medical record updates
     */
    private handleMedicalRecordUpdate;
    /**
     * Handle medical record deletion
     */
    private handleMedicalRecordDeletion;
    /**
     * Handle vital signs updates
     */
    private handleVitalSignsUpdate;
    /**
     * Handle lab results updates
     */
    private handleLabResultsUpdate;
    /**
     * Handle diagnosis updates
     */
    private handleDiagnosisUpdate;
    /**
     * Handle treatment updates
     */
    private handleTreatmentUpdate;
    /**
     * Check if diagnosis was updated
     */
    private checkDiagnosisUpdate;
    /**
     * Check if treatment was updated
     */
    private checkTreatmentUpdate;
    /**
     * Update cache
     */
    private updateCache;
    /**
     * Check if real-time service is connected
     */
    isRealtimeConnected(): boolean;
    /**
     * Disconnect and cleanup
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=realtime.service.d.ts.map