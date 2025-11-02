/**
 * Patient Joined Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
import { QueuePriority } from '../entities/QueueEntry.entity';
export interface PatientJoinedQueueEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId: string | undefined;
    queueNumber: number;
    priority: QueuePriority;
    estimatedWaitMinutes: number;
    checkInTime: Date;
}
export declare class PatientJoinedQueueEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    readonly priority: QueuePriority;
    readonly estimatedWaitMinutes: number;
    readonly checkInTime: Date;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, priority: QueuePriority, estimatedWaitMinutes: number, checkInTime: Date, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): PatientJoinedQueueEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=PatientJoinedQueueEvent.d.ts.map