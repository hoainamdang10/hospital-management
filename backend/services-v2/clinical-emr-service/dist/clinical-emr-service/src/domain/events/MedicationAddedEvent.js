"use strict";
/**
 * MedicationAddedEvent - Domain Event
 * Published when a medication is added to a medical record
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationAddedEvent = void 0;
const domain_event_1 = require("@shared/domain/base/domain-event");
class MedicationAddedEvent extends domain_event_1.DomainEvent {
    constructor(data) {
        super('MedicationAdded', data.recordId, 'MedicalRecord', {
            medicationCode: data.medicationCode,
            medicationName: data.medicationName,
            dosage: data.dosage,
            frequency: data.frequency,
            route: data.route,
            isHighPriority: data.isHighPriority,
            hasContraindications: data.hasContraindications,
            hasInteractions: data.hasInteractions,
            hasAllergies: data.hasAllergies
        }, 1, // eventVersion
        undefined, // correlationId
        undefined, // causationId
        data.prescribedBy // userId
        );
        this.recordId = data.recordId;
        this.patientId = data.patientId;
        this.doctorId = data.doctorId;
        this.medicationCode = data.medicationCode;
        this.medicationName = data.medicationName;
        this.genericName = data.genericName;
        this.brandName = data.brandName;
        this.dosage = data.dosage;
        this.frequency = data.frequency;
        this.route = data.route;
        this.instructions = data.instructions;
        this.prescribedBy = data.prescribedBy;
        this.prescribedAt = data.prescribedAt;
        this.startDate = data.startDate;
        this.endDate = data.endDate;
        this.isHighPriority = data.isHighPriority;
        this.hasContraindications = data.hasContraindications;
        this.hasInteractions = data.hasInteractions;
        this.hasAllergies = data.hasAllergies;
        this.vietnameseDrugCode = data.vietnameseDrugCode;
        this.registrationNumber = data.registrationNumber;
    }
    getEventData() {
        return {
            recordId: this.recordId,
            patientId: this.patientId,
            doctorId: this.doctorId,
            medicationCode: this.medicationCode,
            medicationName: this.medicationName,
            genericName: this.genericName,
            brandName: this.brandName,
            dosage: this.dosage,
            frequency: this.frequency,
            route: this.route,
            instructions: this.instructions,
            prescribedBy: this.prescribedBy,
            prescribedAt: this.prescribedAt.toISOString(),
            startDate: this.startDate?.toISOString(),
            endDate: this.endDate?.toISOString(),
            isHighPriority: this.isHighPriority,
            hasContraindications: this.hasContraindications,
            hasInteractions: this.hasInteractions,
            hasAllergies: this.hasAllergies,
            vietnameseDrugCode: this.vietnameseDrugCode,
            registrationNumber: this.registrationNumber
        };
    }
    containsPHI() {
        return true; // Medication prescription is PHI
    }
    getPatientId() {
        return this.patientId;
    }
}
exports.MedicationAddedEvent = MedicationAddedEvent;
//# sourceMappingURL=MedicationAddedEvent.js.map