"use strict";
/**
 * MedicalRecordCreatedEvent - Domain Event
 * Published when a new medical record is created
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordCreatedEvent = void 0;
const domain_event_1 = require("../../../shared/domain/base/domain-event");
class MedicalRecordCreatedEvent extends domain_event_1.DomainEvent {
    constructor(data) {
        super('MedicalRecordCreated', data.recordId, 'MedicalRecord', {
            recordId: data.recordId,
            patientId: data.patientId,
            doctorId: data.doctorId,
            appointmentId: data.appointmentId,
            visitDate: data.visitDate.toISOString(),
            symptoms: data.symptoms,
            diagnosis: data.diagnosis,
            createdBy: data.createdBy,
            createdAt: data.createdAt.toISOString()
        }, {
            priority: 'high',
            complianceLevel: 'hipaa',
            containsPHI: true,
            patientId: data.patientId,
            eventCategory: 'clinical',
            eventSubcategory: 'medical_record',
            vietnameseDescription: 'Hồ sơ bệnh án mới được tạo'
        });
        this.recordId = data.recordId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.appointmentId = data.appointmentId;
        this.visitDate = data.visitDate;
        this.symptoms = data.symptoms;
        this.diagnosis = data.diagnosis;
        this.createdBy = data.createdBy;
    }
    /**
     * Get event summary in Vietnamese
     */
    getVietnameseSummary() {
        return `Hồ sơ bệnh án ${this.recordId} đã được tạo cho bệnh nhân ${this.patientId} bởi bác sĩ ${this.doctorId}`;
    }
    /**
     * Get notification message for patient
     */
    getPatientNotificationMessage() {
        return `Hồ sơ khám bệnh của bạn đã được tạo. Mã hồ sơ: ${this.recordId}`;
    }
    /**
     * Get notification message for doctor
     */
    getDoctorNotificationMessage() {
        return `Bạn đã tạo thành công hồ sơ bệnh án ${this.recordId}`;
    }
    /**
     * Check if event should trigger billing
     */
    shouldTriggerBilling() {
        return !!this.appointmentId; // Only trigger billing if linked to appointment
    }
    /**
     * Check if event should trigger notifications
     */
    shouldTriggerNotifications() {
        return true; // Always send notifications for medical record creation
    }
    /**
     * Get integration event data for other services
     */
    getIntegrationEventData() {
        return {
            eventType: 'clinical.medical_record_created',
            eventVersion: '1.0',
            eventId: this.eventId,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            occurredAt: this.occurredAt.toISOString(),
            data: {
                recordId: this.recordId,
                patientId: this.patientId,
                doctorId: this.doctorId,
                appointmentId: this.appointmentId,
                visitDate: this.visitDate.toISOString(),
                hasSymptoms: !!this.symptoms,
                hasDiagnosis: !!this.diagnosis,
                createdBy: this.createdBy
            },
            metadata: {
                priority: 'high',
                complianceLevel: 'hipaa',
                containsPHI: true,
                patientId: this.patientId,
                eventCategory: 'clinical',
                eventSubcategory: 'medical_record',
                vietnameseDescription: 'Hồ sơ bệnh án mới được tạo',
                correlationId: this.correlationId,
                causationId: this.causationId
            }
        };
    }
    /**
     * Get audit trail data
     */
    getAuditTrailData() {
        return {
            eventType: 'MEDICAL_RECORD_CREATED',
            eventId: this.eventId,
            aggregateId: this.aggregateId,
            aggregateType: this.aggregateType,
            occurredAt: this.occurredAt,
            userId: this.createdBy,
            patientId: this.patientId,
            action: 'CREATE',
            resource: 'MedicalRecord',
            resourceId: this.recordId,
            details: {
                doctorId: this.doctorId,
                appointmentId: this.appointmentId,
                visitDate: this.visitDate,
                hasSymptoms: !!this.symptoms,
                hasDiagnosis: !!this.diagnosis
            },
            complianceLevel: 'HIPAA',
            vietnameseDescription: 'Tạo hồ sơ bệnh án mới'
        };
    }
    /**
     * Get FHIR event data (for future FHIR compliance)
     */
    getFHIREventData() {
        return {
            resourceType: 'AuditEvent',
            type: {
                system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
                code: 'rest',
                display: 'RESTful Operation'
            },
            subtype: [
                {
                    system: 'http://hl7.org/fhir/restful-interaction',
                    code: 'create',
                    display: 'create'
                }
            ],
            action: 'C',
            recorded: this.occurredAt.toISOString(),
            outcome: '0',
            agent: [
                {
                    type: {
                        coding: [
                            {
                                system: 'http://terminology.hl7.org/CodeSystem/extra-security-role-type',
                                code: 'humanuser',
                                display: 'human user'
                            }
                        ]
                    },
                    who: {
                        identifier: {
                            value: this.createdBy
                        }
                    },
                    requestor: true
                }
            ],
            source: {
                site: 'clinical-emr-service',
                identifier: {
                    value: 'hospital-management-system'
                },
                type: [
                    {
                        system: 'http://terminology.hl7.org/CodeSystem/security-source-type',
                        code: '4',
                        display: 'Application Server'
                    }
                ]
            },
            entity: [
                {
                    what: {
                        identifier: {
                            value: this.recordId
                        }
                    },
                    type: {
                        system: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
                        code: '2',
                        display: 'System Object'
                    },
                    role: {
                        system: 'http://terminology.hl7.org/CodeSystem/object-role',
                        code: '4',
                        display: 'Domain Resource'
                    }
                }
            ]
        };
    }
    /**
     * Serialize event for message queue
     */
    serialize() {
        return JSON.stringify(this.getIntegrationEventData());
    }
    /**
     * Deserialize event from message queue
     */
    static deserialize(data) {
        const eventData = JSON.parse(data);
        return new MedicalRecordCreatedEvent({
            recordId: eventData.data.recordId,
            patientId: eventData.data.patientId,
            doctorId: eventData.data.doctorId,
            appointmentId: eventData.data.appointmentId,
            visitDate: new Date(eventData.data.visitDate),
            symptoms: eventData.data.hasSymptoms ? 'Present' : undefined,
            diagnosis: eventData.data.hasDiagnosis ? 'Present' : undefined,
            createdBy: eventData.data.createdBy,
            createdAt: new Date(eventData.occurredAt)
        });
    }
}
exports.MedicalRecordCreatedEvent = MedicalRecordCreatedEvent;
//# sourceMappingURL=MedicalRecordCreatedEvent.js.map