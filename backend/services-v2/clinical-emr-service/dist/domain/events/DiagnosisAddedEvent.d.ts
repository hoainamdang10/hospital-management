/**
 * DiagnosisAddedEvent - Domain Event
 * Published when a diagnosis is added to a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
export interface DiagnosisAddedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    diagnosisCode: string;
    diagnosisDisplay: string;
    diagnosisCategory: string;
    diagnosisSeverity: string;
    diagnosisStatus: string;
    isCritical: boolean;
    isPrimary: boolean;
    addedBy: string;
    addedAt: Date;
    specialtyCode?: string;
    vietnameseClassification?: string;
}
export declare class DiagnosisAddedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly diagnosisCode: string;
    readonly diagnosisDisplay: string;
    readonly diagnosisCategory: string;
    readonly diagnosisSeverity: string;
    readonly diagnosisStatus: string;
    readonly isCritical: boolean;
    readonly isPrimary: boolean;
    readonly addedBy: string;
    readonly addedAt: Date;
    readonly specialtyCode?: string;
    readonly vietnameseClassification?: string;
    constructor(data: DiagnosisAddedEventData);
    toPrimitives(): DiagnosisAddedEventData;
}
//# sourceMappingURL=DiagnosisAddedEvent.d.ts.map