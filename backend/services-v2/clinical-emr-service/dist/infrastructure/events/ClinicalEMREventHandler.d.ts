/**
 * ClinicalEMREventHandler - Clinical EMR Service Event Handler
 * Handles cross-service events for medical record operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards, FHIR R4
 */
import { BaseEventHandler, EventProcessingResult } from '../../../shared/events/BaseEventHandler';
import { IntegrationEvent } from '../../../shared/events/EventBusConfiguration';
import { CreateMedicalRecordUseCase } from '../../application/use-cases/CreateMedicalRecordUseCase';
import { UpdateMedicalRecordUseCase } from '../../application/use-cases/UpdateMedicalRecordUseCase';
import { GenerateMedicalReportUseCase } from '../../application/use-cases/GenerateMedicalReportUseCase';
export declare class ClinicalEMREventHandler extends BaseEventHandler {
    private createMedicalRecordUseCase;
    private updateMedicalRecordUseCase;
    private generateMedicalReportUseCase;
    constructor(createMedicalRecordUseCase: CreateMedicalRecordUseCase, updateMedicalRecordUseCase: UpdateMedicalRecordUseCase, generateMedicalReportUseCase: GenerateMedicalReportUseCase, logger?: any);
    /**
     * Process integration events
     */
    protected processEvent(event: IntegrationEvent): Promise<EventProcessingResult>;
    /**
     * Handle appointment completed event
     */
    private handleAppointmentCompleted;
    /**
     * Handle patient registered event
     */
    private handlePatientRegistered;
    /**
     * Handle test results ready event
     */
    private handleTestResultsReady;
    /**
     * Handle diagnosis confirmed event
     */
    private handleDiagnosisConfirmed;
    /**
     * Handle medication prescribed event
     */
    private handleMedicationPrescribed;
    /**
     * Handle lab sample collected event
     */
    private handleLabSampleCollected;
    /**
     * Handle imaging study completed event
     */
    private handleImagingStudyCompleted;
    /**
     * Generate Vietnamese interpretation for test results
     */
    private generateVietnameseInterpretation;
    /**
     * Get handler status with clinical-specific metrics
     */
    getClinicalStatus(): any;
}
//# sourceMappingURL=ClinicalEMREventHandler.d.ts.map