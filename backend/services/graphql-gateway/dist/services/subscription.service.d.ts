import { PubSub } from 'graphql-subscriptions';
export declare enum SubscriptionEvents {
    APPOINTMENT_UPDATED = "APPOINTMENT_UPDATED",
    APPOINTMENT_STATUS_CHANGED = "APPOINTMENT_STATUS_CHANGED",
    DOCTOR_APPOINTMENT_UPDATED = "DOCTOR_APPOINTMENT_UPDATED",
    PATIENT_APPOINTMENT_UPDATED = "PATIENT_APPOINTMENT_UPDATED",
    NEW_APPOINTMENT_CREATED = "NEW_APPOINTMENT_CREATED",
    WAITING_QUEUE_UPDATED = "WAITING_QUEUE_UPDATED",
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER",
    DOCTOR_STATUS_CHANGED = "DOCTOR_STATUS_CHANGED",
    DOCTOR_SCHEDULE_CHANGED = "DOCTOR_SCHEDULE_CHANGED",
    DOCTOR_AVAILABILITY_CHANGED = "DOCTOR_AVAILABILITY_CHANGED",
    DOCTOR_NOTIFICATION = "DOCTOR_NOTIFICATION",
    DOCTOR_REVIEW_ADDED = "DOCTOR_REVIEW_ADDED",
    DOCTOR_SHIFT_CHANGED = "DOCTOR_SHIFT_CHANGED",
    DOCTOR_WORKLOAD_UPDATED = "DOCTOR_WORKLOAD_UPDATED",
    PATIENT_STATUS_CHANGED = "PATIENT_STATUS_CHANGED",
    PATIENT_UPDATED = "PATIENT_UPDATED",
    PATIENT_MEDICAL_RECORD_ADDED = "PATIENT_MEDICAL_RECORD_ADDED",
    PATIENT_PRESCRIPTION_ADDED = "PATIENT_PRESCRIPTION_ADDED",
    PATIENT_VITAL_SIGNS_UPDATED = "PATIENT_VITAL_SIGNS_UPDATED",
    PATIENT_LAB_RESULT_ADDED = "PATIENT_LAB_RESULT_ADDED",
    PATIENT_NOTIFICATION = "PATIENT_NOTIFICATION",
    PATIENT_QUEUE_STATUS = "PATIENT_QUEUE_STATUS",
    DEPARTMENT_UPDATED = "DEPARTMENT_UPDATED",
    DEPARTMENT_STATS_UPDATED = "DEPARTMENT_STATS_UPDATED",
    ROOM_AVAILABILITY_CHANGED = "ROOM_AVAILABILITY_CHANGED",
    EQUIPMENT_STATUS_CHANGED = "EQUIPMENT_STATUS_CHANGED",
    SYSTEM_NOTIFICATION = "SYSTEM_NOTIFICATION",
    GLOBAL_UPDATE = "GLOBAL_UPDATE"
}
declare class SubscriptionService {
    private pubsub;
    private isInitialized;
    constructor();
    /**
     * Initialize the subscription service
     */
    initialize(): Promise<void>;
    /**
     * Setup event listeners for microservice events
     */
    private setupEventListeners;
    /**
     * Publish appointment update event
     */
    publishAppointmentUpdate(appointment: any): Promise<void>;
    /**
     * Publish appointment status change event
     */
    publishAppointmentStatusChange(appointment: any): Promise<void>;
    /**
     * Publish new appointment created event
     */
    publishNewAppointment(appointment: any): Promise<void>;
    /**
     * Publish waiting queue update event
     */
    publishWaitingQueueUpdate(doctor_id: string, queue: any[]): Promise<void>;
    /**
     * Publish doctor status change event
     */
    publishDoctorStatusChange(doctor: any): Promise<void>;
    /**
     * Publish doctor schedule change event
     */
    publishDoctorScheduleChange(schedule: any): Promise<void>;
    /**
     * Publish doctor availability change event
     */
    publishDoctorAvailabilityChange(doctor: any): Promise<void>;
    /**
     * Publish doctor notification event
     */
    publishDoctorNotification(doctor_id: string, notification: any): Promise<void>;
    /**
     * Publish patient status change event
     */
    publishPatientStatusChange(patient: any): Promise<void>;
    /**
     * Publish patient update event
     */
    publishPatientUpdate(patient: any): Promise<void>;
    /**
     * Publish system notification event
     */
    publishSystemNotification(notification: any): Promise<void>;
    /**
     * Get PubSub instance for direct access
     */
    getPubSub(): PubSub;
    /**
     * Check if service is initialized
     */
    isReady(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
export declare const subscriptionService: SubscriptionService;
export default subscriptionService;
//# sourceMappingURL=subscription.service.d.ts.map