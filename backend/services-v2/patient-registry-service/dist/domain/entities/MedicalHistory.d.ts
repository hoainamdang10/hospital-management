/**
 * MedicalHistory Entity - Patient Registry
 * Patient medical history tracking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
import { Entity } from '../../../../shared/domain/base/entity';
export interface MedicalHistoryProps {
    id: string;
    conditionName: string;
    diagnosedDate: Date;
    severity: 'mild' | 'moderate' | 'severe' | 'critical';
    status: 'active' | 'resolved' | 'chronic' | 'in_remission';
    isChronic: boolean;
    notes?: string;
    treatingPhysician?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class MedicalHistory extends Entity<MedicalHistoryProps> {
    private constructor();
    /**
     * Create new medical history entry
     */
    static create(conditionName: string, diagnosedDate: Date, severity: 'mild' | 'moderate' | 'severe' | 'critical', status: 'active' | 'resolved' | 'chronic' | 'in_remission', isChronic?: boolean, notes?: string, treatingPhysician?: string): MedicalHistory;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props: MedicalHistoryProps): MedicalHistory;
    get id(): string;
    get conditionName(): string;
    get diagnosedDate(): Date;
    get severity(): 'mild' | 'moderate' | 'severe' | 'critical';
    get status(): 'active' | 'resolved' | 'chronic' | 'in_remission';
    get notes(): string | undefined;
    get treatingPhysician(): string | undefined;
    isActive(): boolean;
    isResolved(): boolean;
    isChronic(): boolean;
    isCritical(): boolean;
    updateStatus(status: 'active' | 'resolved' | 'chronic' | 'in_remission'): void;
    updateSeverity(severity: 'mild' | 'moderate' | 'severe' | 'critical'): void;
    addNotes(notes: string): void;
    resolve(): void;
    markAsChronic(): void;
    getDurationInDays(): number;
    getDurationInYears(): number;
    isValid(): boolean;
    toPersistence(): any;
    static fromPersistence(data: any): MedicalHistory;
    getSummaryForLogging(): object;
}
//# sourceMappingURL=MedicalHistory.d.ts.map