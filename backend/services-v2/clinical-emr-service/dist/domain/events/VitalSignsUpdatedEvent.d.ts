/**
 * VitalSignsUpdatedEvent - Domain Event
 * Published when vital signs are updated in a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
import { DomainEvent } from '../../../shared/domain/base/domain-event';
export interface VitalSignsUpdatedEventData {
    recordId: string;
    patientId: string;
    doctorId: string;
    vitalSigns: {
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
        weight?: number;
        height?: number;
        bmi?: number;
    };
    hasCompleteVitalSigns: boolean;
    hasAbnormalVitals: boolean;
    criticalVitals: string[];
    updatedBy: string;
    updatedAt: Date;
}
export declare class VitalSignsUpdatedEvent extends DomainEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly vitalSigns: any;
    readonly hasCompleteVitalSigns: boolean;
    readonly hasAbnormalVitals: boolean;
    readonly criticalVitals: string[];
    readonly updatedBy: string;
    readonly updatedAt: Date;
    constructor(data: VitalSignsUpdatedEventData);
    toPrimitives(): VitalSignsUpdatedEventData;
}
//# sourceMappingURL=VitalSignsUpdatedEvent.d.ts.map