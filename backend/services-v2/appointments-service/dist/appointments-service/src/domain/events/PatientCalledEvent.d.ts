/**
 * Patient Called Event - Domain Event
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface PatientCalledEventData {
    queueId: string;
    doctorId: string;
    patientId: string;
    appointmentId: string | undefined;
    queueNumber: number;
    calledTime: Date;
    calledBy: string;
}
export declare class PatientCalledEvent extends DomainEvent {
    readonly queueId: string;
    readonly doctorId: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly queueNumber: number;
    readonly calledTime: Date;
    readonly calledBy: string;
    constructor(queueId: string, doctorId: string, patientId: string, appointmentId: string | undefined, queueNumber: number, calledTime: Date, calledBy: string, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): PatientCalledEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=PatientCalledEvent.d.ts.map