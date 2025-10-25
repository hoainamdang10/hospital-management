/**
 * MedicalRecordArchivedEvent - Domain Event
 * Published when a medical record is archived
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
export interface MedicalRecordArchivedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    previousStatus: string;
    archivedBy: string;
    archivedAt: Date;
    archiveReason?: string;
}
export declare class MedicalRecordArchivedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentId?: string;
    readonly previousStatus: string;
    readonly archivedBy: string;
    readonly archivedAt: Date;
    readonly archiveReason?: string;
    constructor(data: MedicalRecordArchivedEventData);
    toPrimitives(): MedicalRecordArchivedEventData;
}
//# sourceMappingURL=MedicalRecordArchivedEvent.d.ts.map