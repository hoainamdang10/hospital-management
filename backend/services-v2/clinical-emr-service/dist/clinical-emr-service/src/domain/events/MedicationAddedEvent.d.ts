/**
 * MedicationAddedEvent - Domain Event
 * Published when a medication is added to a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface MedicationAddedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    medicationCode: string;
    medicationName: string;
    genericName?: string;
    brandName?: string;
    dosage: string;
    frequency: string;
    route: string;
    instructions: string;
    prescribedBy: string;
    prescribedAt: Date;
    startDate?: Date;
    endDate?: Date;
    isHighPriority: boolean;
    hasContraindications: boolean;
    hasInteractions: boolean;
    hasAllergies: boolean;
    vietnameseDrugCode?: string;
    registrationNumber?: string;
}
export declare class MedicationAddedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly medicationCode: string;
    readonly medicationName: string;
    readonly genericName?: string;
    readonly brandName?: string;
    readonly dosage: string;
    readonly frequency: string;
    readonly route: string;
    readonly instructions: string;
    readonly prescribedBy: string;
    readonly prescribedAt: Date;
    readonly startDate?: Date;
    readonly endDate?: Date;
    readonly isHighPriority: boolean;
    readonly hasContraindications: boolean;
    readonly hasInteractions: boolean;
    readonly hasAllergies: boolean;
    readonly vietnameseDrugCode?: string;
    readonly registrationNumber?: string;
    constructor(data: MedicationAddedEventData);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=MedicationAddedEvent.d.ts.map