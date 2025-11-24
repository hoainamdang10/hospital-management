/**
 * Rescheduling Service - Handles appointment conflict resolution
 * Follows medical compliance and proper audit trail requirements
 */
import { IReschedulingQueueRepository, ReschedulingQueueEntry, PatientResponse, ReschedulingPriority } from '../../domain/interfaces/IReschedulingQueueRepository';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IReminderService } from './IReminderService';
import { IEventPublisher } from './IEventPublisher';
import { Appointment } from '../../domain/aggregates/Appointment.aggregate';
export interface ReschedulingRequest {
    appointment: Appointment;
    conflictReason: string;
    conflictDetails?: Record<string, any>;
    priority?: ReschedulingPriority;
}
export interface PatientReschedulingResponse {
    queueEntryId: string;
    patientResponse: PatientResponse;
    respondedBy?: string;
    notes?: string;
}
export declare class ReschedulingService {
    private reschedulingQueueRepository;
    private appointmentRepository;
    private reminderService;
    private eventPublisher?;
    constructor(reschedulingQueueRepository: IReschedulingQueueRepository, appointmentRepository: IAppointmentRepository, reminderService: IReminderService, eventPublisher?: IEventPublisher);
    setEventPublisher(eventPublisher: IEventPublisher): void;
    private getEventPublisher;
    /**
     * Handle appointment conflict detection
     * Creates rescheduling queue entry and notifies relevant parties
     */
    handleConflictDetected(request: ReschedulingRequest): Promise<ReschedulingQueueEntry>;
    /**
     * Process patient response to rescheduling notification
     */
    processPatientResponse(response: PatientReschedulingResponse): Promise<ReschedulingQueueEntry>;
    /**
     * Find available time slots for rescheduling
     */
    findAvailableSlotsForRescheduling(queueEntryId: string): Promise<any[]>;
    /**
     * Complete rescheduling with new appointment
     */
    completeRescheduling(queueEntryId: string, newAppointmentId: string, resolvedBy: string): Promise<ReschedulingQueueEntry>;
    /**
     * Process expired rescheduling entries
     */
    processExpiredEntries(): Promise<void>;
    /**
     * Get rescheduling queue statistics
     */
    getQueueStatistics(): Promise<any>;
    private determinePriorityFromReason;
    private updateAppointmentConflictStatus;
    private handlePatientAcceptance;
    private handlePatientRejection;
    private handlePatientPending;
    private searchAlternativeSlots;
}
//# sourceMappingURL=ReschedulingService.d.ts.map