import { Server as HttpServer } from "http";
export interface AppointmentRealtimeEvent {
    type: "INSERT" | "UPDATE" | "DELETE";
    appointment_id: string;
    doctor_id?: string;
    patient_id?: string;
    old_status?: string;
    new_status?: string;
    appointment_date?: string;
    start_time?: string;
    end_time?: string;
    timestamp: string;
}
export declare class AppointmentRealtimeService {
    private subscription;
    private eventBus;
    private wsManager;
    private isConnected;
    constructor();
    initialize(httpServer?: HttpServer): Promise<void>;
    private setupSupabaseSubscription;
    private handleAppointmentChange;
    private processAppointmentEvent;
    private broadcastToWebSocket;
    private publishToEventBus;
    private handleSpecificEventType;
    private handleNewAppointment;
    private handleAppointmentUpdate;
    private handleAppointmentCancellation;
    private checkRealtimeConflicts;
    private triggerNewAppointmentNotifications;
    private handleStatusChange;
    private handleTimeChange;
    private triggerCancellationNotifications;
    private updateDoctorAvailability;
    private updateCache;
    isRealtimeConnected(): boolean;
    disconnect(): Promise<void>;
}
//# sourceMappingURL=realtime.service.d.ts.map