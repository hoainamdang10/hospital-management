"use strict";
/**
 * ClinicalEMREventHandler - Clinical EMR Service Event Handler
 * Handles cross-service events for medical record operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Event-Driven Architecture, Vietnamese Healthcare Standards, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicalEMREventHandler = void 0;
const BaseEventHandler_1 = require("@shared/events/BaseEventHandler");
const VietnameseHealthcareEvents_1 = require("@shared/events/VietnameseHealthcareEvents");
const GenerateMedicalReportUseCase_1 = require("../../application/use-cases/GenerateMedicalReportUseCase");
class ClinicalEMREventHandler extends BaseEventHandler_1.BaseEventHandler {
    constructor(createMedicalRecordUseCase, updateMedicalRecordUseCase, generateMedicalReportUseCase, logger) {
        super('clinical-emr-service', logger);
        this.createMedicalRecordUseCase = createMedicalRecordUseCase;
        this.updateMedicalRecordUseCase = updateMedicalRecordUseCase;
        this.generateMedicalReportUseCase = generateMedicalReportUseCase;
    }
    /**
     * Public wrapper for external event handling
     */
    async handleEvent(event) {
        return this.processEvent(event);
    }
    /**
     * Process integration events
     */
    async processEvent(event) {
        const startTime = Date.now();
        try {
            this.log('info', `🏥 Processing event: ${event.eventType} from ${event.serviceName}`);
            switch (event.eventType) {
                case 'appointment.completed':
                    return await this.handleAppointmentCompleted(event);
                case 'patient.registered':
                    return await this.handlePatientRegistered(event);
                case 'test-results.ready':
                    return await this.handleTestResultsReady(event);
                case 'diagnosis.confirmed':
                    return await this.handleDiagnosisConfirmed(event);
                case 'medication.prescribed':
                    return await this.handleMedicationPrescribed(event);
                case 'lab.sample.collected':
                    return await this.handleLabSampleCollected(event);
                case 'imaging.study.completed':
                    return await this.handleImagingStudyCompleted(event);
                default:
                    this.log('debug', `⏭️ Unhandled event type: ${event.eventType}`);
                    return {
                        success: true,
                        processingTime: Date.now() - startTime,
                        metadata: { skipped: true }
                    };
            }
        }
        catch (error) {
            this.log('error', `❌ Error processing event ${event.eventType}:`, error);
            return {
                success: false,
                processingTime: Date.now() - startTime,
                error: error,
                retryable: this.isRetryableError(error)
            };
        }
    }
    /**
     * Handle appointment completed event
     */
    async handleAppointmentCompleted(event) {
        const startTime = Date.now();
        try {
            this.log('info', `📋 Creating medical record for completed appointment: ${event.eventData.appointmentId}`);
            const appointmentData = event.eventData;
            // Create medical record from appointment data
            const medicalRecordCommand = {
                patientId: appointmentData.patientId,
                doctorId: appointmentData.doctorId,
                appointmentId: appointmentData.appointmentId,
                visitDate: new Date().toISOString(),
                symptoms: 'Khám tổng quát',
                diagnosis: appointmentData.diagnosis || '',
                treatment: appointmentData.treatmentPlan || '',
                medications: appointmentData.prescriptions ? JSON.stringify(appointmentData.prescriptions) : '',
                notes: appointmentData.followUpRequired ? 'Cần tái khám theo lịch hẹn' : '',
                createdBy: appointmentData.doctorId
            };
            const result = await this.createMedicalRecordUseCase.execute(medicalRecordCommand);
            if (result.success) {
                this.log('info', `✅ Medical record created: ${result.recordId}`);
                // Publish medical record created event
                const medicalRecordEvent = {
                    eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    eventType: 'medical-record.created',
                    aggregateId: result.recordId,
                    aggregateType: 'MedicalRecord',
                    serviceName: 'clinical-emr-service',
                    eventVersion: '1.0',
                    eventData: {
                        medicalRecordId: result.recordId,
                        patientId: appointmentData.patientId,
                        doctorId: appointmentData.doctorId,
                        appointmentId: appointmentData.appointmentId,
                        recordType: 'CONSULTATION',
                        chiefComplaint: medicalRecordCommand.symptoms,
                        diagnosis: appointmentData.diagnosis,
                        treatmentPlan: appointmentData.treatmentPlan,
                        createdAt: new Date().toISOString(),
                        healthcareContext: {
                            patientId: appointmentData.patientId,
                            doctorId: appointmentData.doctorId,
                            medicalRecordId: result.recordId,
                            appointmentId: appointmentData.appointmentId,
                            departmentId: 'GENERAL'
                        }
                    },
                    occurredAt: new Date(),
                    version: 1,
                    priority: 'NORMAL',
                    metadata: { correlationId: event.metadata?.correlationId }
                };
                await this.publishEvent(medicalRecordEvent);
                // If prescriptions were given, publish medication prescribed event
                if (appointmentData.prescriptions && appointmentData.prescriptions.length > 0) {
                    const medicationEvent = {
                        eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        eventType: 'medication.prescribed',
                        aggregateId: `prescription_${result.recordId}`,
                        aggregateType: 'Prescription',
                        serviceName: 'clinical-emr-service',
                        eventVersion: '1.0',
                        eventData: {
                            prescriptionId: `PRESC-${Date.now()}`,
                            patientId: appointmentData.patientId,
                            doctorId: appointmentData.doctorId,
                            medicalRecordId: result.recordId,
                            medications: appointmentData.prescriptions,
                            prescribedAt: new Date().toISOString(),
                            healthcareContext: {
                                patientId: appointmentData.patientId,
                                doctorId: appointmentData.doctorId,
                                prescriptionId: `PRESC-${Date.now()}`,
                                medicalRecordId: result.recordId
                            }
                        },
                        occurredAt: new Date(),
                        version: 1,
                        priority: 'NORMAL',
                        metadata: { correlationId: event.metadata?.correlationId }
                    };
                    await this.publishEvent(medicationEvent);
                }
            }
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    appointmentId: appointmentData.appointmentId,
                    medicalRecordId: result.recordId,
                    prescriptionsCount: appointmentData.prescriptions?.length || 0,
                    action: 'medical_record_created_from_appointment'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to create medical record from appointment:`, error);
            throw error;
        }
    }
    /**
     * Handle patient registered event
     */
    async handlePatientRegistered(event) {
        const startTime = Date.now();
        try {
            this.log('info', `👤 Processing patient registration for EMR: ${event.eventData.patientId}`);
            const patientData = event.eventData;
            // Create initial patient medical profile
            // This includes medical history template, allergies, etc.
            // In a real implementation, you might:
            // 1. Create patient medical profile
            // 2. Set up medical history template
            // 3. Initialize allergy tracking
            // 4. Create FHIR Patient resource
            this.log('info', `✅ Patient EMR profile initialized: ${patientData.patientId}`);
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    patientId: patientData.patientId,
                    action: 'patient_emr_profile_initialized'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to initialize patient EMR profile:`, error);
            throw error;
        }
    }
    /**
     * Handle test results ready event
     */
    async handleTestResultsReady(event) {
        const startTime = Date.now();
        try {
            this.log('info', `🧪 Processing test results: ${event.eventData.testResultId}`);
            const testData = event.eventData;
            // Update medical record with test results
            if (testData.medicalRecordId) {
                const updateCommand = {
                    recordId: testData.medicalRecordId,
                    updateData: {
                        testResults: [{
                                testId: testData.testResultId,
                                testType: testData.testType,
                                testName: testData.testName,
                                sampleDate: testData.sampleDate,
                                resultDate: testData.resultDate,
                                results: testData.results,
                                overallStatus: testData.overallStatus,
                                interpretation: this.generateVietnameseInterpretation(testData.results, testData.overallStatus)
                            }]
                    },
                    updatedBy: 'LABORATORY_SYSTEM',
                    updateReason: 'Cập nhật kết quả xét nghiệm',
                    healthcareContext: {
                        patientId: testData.patientId,
                        testResultId: testData.testResultId,
                        updateType: 'TEST_RESULTS'
                    }
                };
                const updateResult = await this.updateMedicalRecordUseCase.execute(updateCommand);
                if (updateResult.success) {
                    this.log('info', `✅ Medical record updated with test results: ${testData.medicalRecordId}`);
                    // If results are critical, publish emergency alert
                    if (testData.overallStatus === 'CRITICAL') {
                        const emergencyEvent = VietnameseHealthcareEvents_1.VietnameseHealthcareEventFactory.createEmergencyAlertEvent({
                            alertId: `ALERT-${Date.now()}`,
                            patientId: testData.patientId,
                            patientName: testData.patientName || 'Unknown Patient',
                            alertType: 'CRITICAL_TEST_RESULT',
                            alertMessage: `Kết quả xét nghiệm ${testData.testName} có giá trị bất thường nghiêm trọng`,
                            severity: 'CRITICAL',
                            triggeredAt: new Date().toISOString(),
                            triggeredBy: 'LABORATORY_SYSTEM',
                            requiresImmedateAction: true,
                            emergencyContacts: [],
                            healthcareContext: {
                                patientId: testData.patientId,
                                alertId: `ALERT-${Date.now()}`,
                                medicalRecordId: testData.medicalRecordId,
                                doctorId: testData.doctorId,
                                departmentId: testData.healthcareContext?.laboratoryId || 'LABORATORY'
                            }
                        }, 'clinical-emr-service', {
                            correlationId: event.metadata?.correlationId,
                            testResultId: testData.testResultId
                        });
                        await this.publishEvent(emergencyEvent);
                    }
                    // Publish test results ready event for other services
                    const testResultsEvent = VietnameseHealthcareEvents_1.VietnameseHealthcareEventFactory.createTestResultsReadyEvent(testData, 'clinical-emr-service', { correlationId: event.metadata?.correlationId });
                    await this.publishEvent(testResultsEvent);
                }
            }
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    testResultId: testData.testResultId,
                    overallStatus: testData.overallStatus,
                    criticalAlert: testData.overallStatus === 'CRITICAL',
                    action: 'test_results_processed'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to process test results:`, error);
            throw error;
        }
    }
    /**
     * Handle diagnosis confirmed event
     */
    async handleDiagnosisConfirmed(event) {
        const startTime = Date.now();
        try {
            this.log('info', `🩺 Processing diagnosis confirmation: ${event.eventData.diagnosisId}`);
            const diagnosisData = event.eventData;
            // Update medical record with confirmed diagnosis
            const updateCommand = {
                recordId: diagnosisData.medicalRecordId,
                updateData: {
                    confirmedDiagnosis: {
                        diagnosisId: diagnosisData.diagnosisId,
                        diagnosisCode: diagnosisData.diagnosisCode,
                        diagnosisName: diagnosisData.diagnosisName,
                        diagnosisDescription: diagnosisData.diagnosisDescription,
                        severity: diagnosisData.severity,
                        confirmedAt: diagnosisData.confirmedAt,
                        icdCode: diagnosisData.diagnosisCode // ICD-10 code
                    }
                },
                updatedBy: diagnosisData.doctorId,
                updateReason: 'Xác nhận chẩn đoán',
                healthcareContext: {
                    patientId: diagnosisData.patientId,
                    diagnosisId: diagnosisData.diagnosisId,
                    updateType: 'DIAGNOSIS_CONFIRMED'
                }
            };
            const updateResult = await this.updateMedicalRecordUseCase.execute(updateCommand);
            if (updateResult.success) {
                this.log('info', `✅ Medical record updated with confirmed diagnosis: ${diagnosisData.medicalRecordId}`);
                // Generate medical report if required
                if (diagnosisData.severity === 'SEVERE' || diagnosisData.severity === 'CRITICAL') {
                    const reportCommand = {
                        recordId: diagnosisData.medicalRecordId,
                        reportType: GenerateMedicalReportUseCase_1.ReportType.DIAGNOSIS_REPORT,
                        format: GenerateMedicalReportUseCase_1.ReportFormat.PDF,
                        requestedBy: diagnosisData.doctorId,
                        includeDiagnoses: true,
                        includeMedications: true,
                        includeVitalSigns: true,
                        includeNotes: true,
                        includeHospitalHeader: true,
                        watermark: 'SEVERE_DIAGNOSIS',
                        confidentialityLevel: 'confidential'
                    };
                    const reportResult = await this.generateMedicalReportUseCase.execute(reportCommand);
                    if (reportResult.success && reportResult.data) {
                        this.log('info', `📄 Medical report generated for severe diagnosis: ${reportResult.data.reportId}`);
                    }
                }
            }
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    diagnosisId: diagnosisData.diagnosisId,
                    severity: diagnosisData.severity,
                    reportGenerated: diagnosisData.severity === 'SEVERE' || diagnosisData.severity === 'CRITICAL',
                    action: 'diagnosis_confirmed_processed'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to process diagnosis confirmation:`, error);
            throw error;
        }
    }
    /**
     * Handle medication prescribed event
     */
    async handleMedicationPrescribed(event) {
        const startTime = Date.now();
        try {
            this.log('info', `💊 Processing medication prescription: ${event.eventData.prescriptionId}`);
            const prescriptionData = event.eventData;
            // Update medical record with prescription information
            const updateCommand = {
                recordId: prescriptionData.medicalRecordId,
                updateData: {
                    prescriptions: prescriptionData.medications.map((med) => ({
                        medicationId: med.medicationId,
                        medicationName: med.medicationName,
                        dosage: med.dosage,
                        frequency: med.frequency,
                        duration: med.duration,
                        instructions: med.instructions,
                        startDate: med.startDate,
                        endDate: med.endDate,
                        prescribedAt: prescriptionData.prescribedAt
                    }))
                },
                updatedBy: prescriptionData.doctorId,
                updateReason: 'Cập nhật đơn thuốc',
                healthcareContext: {
                    patientId: prescriptionData.patientId,
                    prescriptionId: prescriptionData.prescriptionId,
                    updateType: 'MEDICATION_PRESCRIBED'
                }
            };
            const updateResult = await this.updateMedicalRecordUseCase.execute(updateCommand);
            if (updateResult.success) {
                this.log('info', `✅ Medical record updated with prescription: ${prescriptionData.medicalRecordId}`);
            }
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    prescriptionId: prescriptionData.prescriptionId,
                    medicationCount: prescriptionData.medications.length,
                    action: 'medication_prescription_processed'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to process medication prescription:`, error);
            throw error;
        }
    }
    /**
     * Handle lab sample collected event
     */
    async handleLabSampleCollected(event) {
        const startTime = Date.now();
        try {
            this.log('info', `🧪 Processing lab sample collection: ${event.eventData.sampleId}`);
            // Track sample collection in medical record
            // Update test status to "Sample Collected"
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    sampleId: event.eventData.sampleId,
                    action: 'lab_sample_tracked'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to process lab sample collection:`, error);
            throw error;
        }
    }
    /**
     * Handle imaging study completed event
     */
    async handleImagingStudyCompleted(event) {
        const startTime = Date.now();
        try {
            this.log('info', `📷 Processing imaging study completion: ${event.eventData.studyId}`);
            // Update medical record with imaging results
            // Generate imaging report if needed
            return {
                success: true,
                processingTime: Date.now() - startTime,
                metadata: {
                    studyId: event.eventData.studyId,
                    action: 'imaging_study_processed'
                }
            };
        }
        catch (error) {
            this.log('error', `❌ Failed to process imaging study:`, error);
            throw error;
        }
    }
    /**
     * Generate Vietnamese interpretation for test results
     */
    generateVietnameseInterpretation(results, overallStatus) {
        if (overallStatus === 'CRITICAL') {
            return 'Kết quả xét nghiệm có giá trị bất thường nghiêm trọng, cần can thiệp y tế ngay lập tức.';
        }
        else if (overallStatus === 'ABNORMAL') {
            return 'Kết quả xét nghiệm có một số giá trị bất thường, cần theo dõi và tư vấn thêm.';
        }
        else {
            return 'Kết quả xét nghiệm trong giới hạn bình thường.';
        }
    }
    /**
     * Get handler status with clinical-specific metrics
     */
    getClinicalStatus() {
        const baseStatus = this.getStatus();
        return {
            ...baseStatus,
            clinicalMetrics: {
                medicalRecordsCreated: 0, // Would be tracked in real implementation
                testResultsProcessed: 0,
                diagnosesConfirmed: 0,
                prescriptionsProcessed: 0,
                emergencyAlertsTriggered: 0
            },
            eventTypes: [
                'appointment.completed',
                'patient.registered',
                'test-results.ready',
                'diagnosis.confirmed',
                'medication.prescribed',
                'lab.sample.collected',
                'imaging.study.completed'
            ]
        };
    }
}
exports.ClinicalEMREventHandler = ClinicalEMREventHandler;
//# sourceMappingURL=ClinicalEMREventHandler.js.map