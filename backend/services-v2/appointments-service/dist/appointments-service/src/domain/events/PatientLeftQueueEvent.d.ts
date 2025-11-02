/**
 * Patient Left Queue Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientLeftQueueEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId: string | undefined;
    queueNumber: number;
    reason: string;
    removedBy: string;
    leftTime: Date;
}
export declare class PatientLeftQueueEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    readonly reason: string;
    readonly removedBy: string;
    readonly leftTime: Date;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, reason: string, removedBy: string, leftTime: Date, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): PatientLeftQueueEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=PatientLeftQueueEvent.d.ts.map