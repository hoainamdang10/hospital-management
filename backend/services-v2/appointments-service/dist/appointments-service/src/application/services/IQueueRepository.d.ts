/**
 * Queue Repository Interface - Application Layer
 * Manages appointment-related queues for quality control and processing
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Healthcare Standards
 */
export interface QueueItem {
    id: string;
    appointmentId: string;
    patientId: string;
    queueType: 'clinical_review' | 'urgent_care' | 'rescheduling' | 'follow_up';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    assignedTo?: string;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    metadata?: Record<string, any>;
}
export interface ClinicalReviewData {
    appointmentId: string;
    patientId: string;
    reviewType: 'quality_check' | 'complex_case' | 'adverse_event';
    priority: 'normal' | 'high' | 'urgent';
    reason: string;
    requestedBy: string;
    dueDate?: Date;
}
/**
 * Queue Repository Interface
 * Handles appointment-related queue operations
 */
export interface IQueueRepository {
    /**
     * Add item to clinical review queue
     * Clinical review queue for appointment quality control
     */
    addToClinicalReviewQueue(data: ClinicalReviewData): Promise<string>;
    /**
     * Add item to urgent care queue
     * Urgent care queue management
     */
    addToUrgentCareQueue(data: {
        appointmentId: string;
        patientId: string;
        urgency: 'urgent' | 'emergency';
        symptoms?: string;
        estimatedDuration: number;
    }): Promise<string>;
    /**
     * Add item to rescheduling queue
     * Rescheduling queue for appointment changes
     */
    addToReschedulingQueue(data: {
        appointmentId: string;
        patientId: string;
        reason: string;
        requestedBy: string;
        preferredDates?: Date[];
    }): Promise<string>;
    /**
     * Get next item from queue
     * Retrieve next pending item from specific queue
     */
    getNextFromQueue(queueType: string, assignedTo?: string): Promise<QueueItem | null>;
    /**
     * Update queue item status
     * Update status of queue item
     */
    updateQueueStatus(queueItemId: string, status: QueueItem['status'], assignedTo?: string): Promise<void>;
    /**
     * Get queue items by appointment
     * Get all queue items for specific appointment
     */
    getQueueItemsByAppointment(appointmentId: string): Promise<QueueItem[]>;
    /**
     * Get queue statistics
     * Get statistics for queue management
     */
    getQueueStatistics(queueType?: string): Promise<{
        pending: number;
        inProgress: number;
        completed: number;
        overdue: number;
    }>;
}
//# sourceMappingURL=IQueueRepository.d.ts.map