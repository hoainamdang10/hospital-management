import { Server as HttpServer } from 'http';
export interface DoctorRealtimeEvent {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    doctor_id: string;
    profile_id?: string;
    old_status?: string;
    new_status?: string;
    availability_updated?: boolean;
    schedule_updated?: boolean;
    experience_updated?: boolean;
    shift_updated?: boolean;
    timestamp: string;
}
export declare class DoctorRealtimeService {
    private subscription;
    private profileSubscription;
    private shiftSubscription;
    private experienceSubscription;
    private eventBus;
    private wsManager;
    private isConnected;
    constructor();
    initialize(httpServer?: HttpServer): Promise<void>;
    private setupSupabaseSubscriptions;
    private handleDoctorChange;
    private handleProfileChange;
    private handleShiftChange;
    private handleExperienceChange;
    private processDoctorEvent;
    private broadcastToWebSocket;
    private publishToEventBus;
    private handleSpecificEventType;
    private handleNewDoctor;
    private handleDoctorUpdate;
    private handleDoctorDeletion;
    private checkAvailabilityUpdate;
    private checkScheduleUpdate;
    private findDoctorByProfileId;
    private triggerWelcomeNotifications;
    private updateDoctorStatistics;
    private handleAvailabilityUpdate;
    private handleScheduleUpdate;
    private cleanupDoctorData;
    private updateCache;
    isRealtimeConnected(): boolean;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=realtime.service.d.ts.map