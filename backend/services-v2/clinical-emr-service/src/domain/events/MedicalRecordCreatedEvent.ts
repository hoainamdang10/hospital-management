/**
 * MedicalRecordCreatedEvent - Domain Event
 * Published when a new medical record is created
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from '@shared/domain/base/domain-event';

export interface MedicalRecordCreatedEventData {
  recordId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  visitDate: Date;
  symptoms?: string;
  diagnosis?: string;
  createdBy: string;
  createdAt: Date;
}

export class MedicalRecordCreatedEvent extends DomainEvent {
  public readonly recordId: string;
  public readonly patientId: string;
  public readonly doctorId: string;
  public readonly appointmentId?: string;
  public readonly visitDate: Date;
  public readonly symptoms?: string;
  public readonly diagnosis?: string;
  public readonly createdBy: string;

  constructor(data: MedicalRecordCreatedEventData) {
    super(
      'MedicalRecordCreated',
      data.recordId,
      'MedicalRecord',
      {
        recordId: data.recordId,
        patientId: data.patientId,
        doctorId: data.doctorId,
        appointmentId: data.appointmentId,
        visitDate: data.visitDate.toISOString(),
        symptoms: data.symptoms,
        diagnosis: data.diagnosis,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toISOString()
      },
      1, // eventVersion
      undefined, // correlationId
      undefined, // causationId
      data.createdBy, // userId
      {
        priority: 'high',
        source: 'healthcare-domain',
        complianceLevel: 'HIPAA',
        retryable: true
      }
    );

    this.recordId = data.recordId;
    this.patientId = data.patientId;
    this.doctorId = data.doctorId;
    this.appointmentId = data.appointmentId;
    this.visitDate = data.visitDate;
    this.symptoms = data.symptoms;
    this.diagnosis = data.diagnosis;
    this.createdBy = data.createdBy;
  }

  getEventData(): any {
    return {
      recordId: this.recordId,
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentId: this.appointmentId,
      visitDate: this.visitDate.toISOString(),
      symptoms: this.symptoms,
      diagnosis: this.diagnosis,
      createdBy: this.createdBy
    };
  }

  containsPHI(): boolean {
    return true;
  }

  getPatientId(): string | null {
    return this.patientId;
  }

  /**
   * Get event summary in Vietnamese
   */
  public getVietnameseSummary(): string {
    return `Hồ sơ bệnh án ${this.recordId} đã được tạo cho bệnh nhân ${this.patientId} bởi bác sĩ ${this.doctorId}`;
  }

  /**
   * Get notification message for patient
   */
  public getPatientNotificationMessage(): string {
    return `Hồ sơ khám bệnh của bạn đã được tạo. Mã hồ sơ: ${this.recordId}`;
  }

  /**
   * Get notification message for doctor
   */
  public getDoctorNotificationMessage(): string {
    return `Bạn đã tạo thành công hồ sơ bệnh án ${this.recordId}`;
  }

  /**
   * Check if event should trigger billing
   */
  public shouldTriggerBilling(): boolean {
    return !!this.appointmentId; // Only trigger billing if linked to appointment
  }

  /**
   * Check if event should trigger notifications
   */
  public shouldTriggerNotifications(): boolean {
    return true; // Always send notifications for medical record creation
  }

  /**
   * Get integration event data for other services
   */
  public getIntegrationEventData(): any {
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
  public getAuditTrailData(): any {
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
  public getFHIREventData(): any {
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
  public serialize(): string {
    return JSON.stringify(this.getIntegrationEventData());
  }

  /**
   * Deserialize event from message queue
   */
  public static deserialize(data: string): MedicalRecordCreatedEvent {
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
