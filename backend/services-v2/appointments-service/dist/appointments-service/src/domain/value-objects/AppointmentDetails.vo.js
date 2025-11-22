"use strict";
/**
 * AppointmentDetails Value Object - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 * Matches database columns: reason, chief_complaint, symptoms, notes, special_instructions
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentDetails = void 0;
const value_object_1 = require("@shared/domain/base/value-object");
/**
 * AppointmentDetails Value Object
 * Contains clinical information about the appointment
 */
class AppointmentDetails extends value_object_1.HealthcareValueObject {
    constructor(props) {
        super(props);
    }
    /**
     * Create AppointmentDetails
     */
    static create(reason, chiefComplaint, symptoms, notes, specialInstructions) {
        // Validate inputs
        if (reason && reason.length > 500) {
            throw new Error('Reason must be less than 500 characters');
        }
        if (chiefComplaint && chiefComplaint.length > 500) {
            throw new Error('Chief complaint must be less than 500 characters');
        }
        if (notes && notes.length > 2000) {
            throw new Error('Notes must be less than 2000 characters');
        }
        if (specialInstructions && specialInstructions.length > 1000) {
            throw new Error('Special instructions must be less than 1000 characters');
        }
        return new AppointmentDetails({
            reason,
            chiefComplaint,
            symptoms: symptoms || [],
            notes,
            specialInstructions
        });
    }
    /**
     * Create empty details
     */
    static empty() {
        return new AppointmentDetails({
            symptoms: []
        });
    }
    /**
     * Validate value object format (required by ValueObject base class)
     */
    validateFormat() {
        // All fields are optional, so no strict validation needed
        // Length validations are done in create() method
    }
    /**
     * Get reason
     */
    get reason() {
        return this.props.reason;
    }
    /**
     * Get chief complaint
     */
    get chiefComplaint() {
        return this.props.chiefComplaint;
    }
    /**
     * Get symptoms
     */
    get symptoms() {
        return this.props.symptoms || [];
    }
    /**
     * Get notes
     */
    get notes() {
        return this.props.notes;
    }
    /**
     * Get special instructions
     */
    get specialInstructions() {
        return this.props.specialInstructions;
    }
    /**
     * Check if details are empty
     */
    isEmpty() {
        return !this.props.reason &&
            !this.props.chiefComplaint &&
            (!this.props.symptoms || this.props.symptoms.length === 0) &&
            !this.props.notes &&
            !this.props.specialInstructions;
    }
    /**
     * Add symptom
     */
    addSymptom(symptom) {
        const symptoms = [...(this.props.symptoms || []), symptom];
        return new AppointmentDetails({
            ...this.props,
            symptoms
        });
    }
    /**
     * Remove symptom
     */
    removeSymptom(symptom) {
        const symptoms = (this.props.symptoms || []).filter(s => s !== symptom);
        return new AppointmentDetails({
            ...this.props,
            symptoms
        });
    }
    /**
     * Update reason
     */
    updateReason(reason) {
        if (reason.length > 500) {
            throw new Error('Reason must be less than 500 characters');
        }
        return new AppointmentDetails({
            ...this.props,
            reason
        });
    }
    /**
     * Update chief complaint
     */
    updateChiefComplaint(chiefComplaint) {
        if (chiefComplaint.length > 500) {
            throw new Error('Chief complaint must be less than 500 characters');
        }
        return new AppointmentDetails({
            ...this.props,
            chiefComplaint
        });
    }
    /**
     * Update notes
     */
    updateNotes(notes) {
        if (notes.length > 2000) {
            throw new Error('Notes must be less than 2000 characters');
        }
        return new AppointmentDetails({
            ...this.props,
            notes
        });
    }
    /**
     * Update special instructions
     */
    updateSpecialInstructions(specialInstructions) {
        if (specialInstructions.length > 1000) {
            throw new Error('Special instructions must be less than 1000 characters');
        }
        return new AppointmentDetails({
            ...this.props,
            specialInstructions
        });
    }
    /**
     * Healthcare-specific: Contains PHI
     */
    containsPHI() {
        return true; // Clinical information is PHI
    }
    /**
     * Anonymize for logging
     */
    anonymize() {
        return AppointmentDetails.create('[REDACTED]', '[REDACTED]', ['[REDACTED]'], '[REDACTED]', '[REDACTED]');
    }
    /**
     * String representation
     */
    toString() {
        const parts = [];
        if (this.props.reason) {
            parts.push(`Reason: ${this.props.reason}`);
        }
        if (this.props.chiefComplaint) {
            parts.push(`Chief Complaint: ${this.props.chiefComplaint}`);
        }
        if (this.props.symptoms && this.props.symptoms.length > 0) {
            parts.push(`Symptoms: ${this.props.symptoms.join(', ')}`);
        }
        return parts.join(' | ') || 'No details';
    }
}
exports.AppointmentDetails = AppointmentDetails;
//# sourceMappingURL=AppointmentDetails.vo.js.map