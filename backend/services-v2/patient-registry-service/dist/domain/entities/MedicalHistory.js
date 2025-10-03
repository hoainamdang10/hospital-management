"use strict";
/**
 * MedicalHistory Entity - Patient Registry
 * Patient medical history tracking
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalHistory = void 0;
const entity_1 = require("../../../../shared/domain/base/entity");
class MedicalHistory extends entity_1.Entity {
    constructor(props) {
        super(props);
    }
    /**
     * Create new medical history entry
     */
    static create(conditionName, diagnosedDate, severity, status, isChronic = false, notes, treatingPhysician) {
        const now = new Date();
        return new MedicalHistory({
            id: entity_1.Entity.generateId(),
            conditionName: conditionName.trim(),
            diagnosedDate,
            severity,
            status,
            isChronic,
            notes: notes?.trim(),
            treatingPhysician: treatingPhysician?.trim(),
            createdAt: now,
            updatedAt: now
        });
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props) {
        return new MedicalHistory(props);
    }
    // Getters
    get id() {
        return this.props.id;
    }
    get conditionName() {
        return this.props.conditionName;
    }
    get diagnosedDate() {
        return this.props.diagnosedDate;
    }
    get severity() {
        return this.props.severity;
    }
    get status() {
        return this.props.status;
    }
    get notes() {
        return this.props.notes;
    }
    get treatingPhysician() {
        return this.props.treatingPhysician;
    }
    // Business methods
    isActive() {
        return this.props.status === 'active' || this.props.status === 'chronic';
    }
    isResolved() {
        return this.props.status === 'resolved';
    }
    isChronic() {
        return this.props.isChronic || this.props.status === 'chronic';
    }
    isCritical() {
        return this.props.severity === 'critical';
    }
    updateStatus(status) {
        this.props.status = status;
        this.props.updatedAt = new Date();
    }
    updateSeverity(severity) {
        this.props.severity = severity;
        this.props.updatedAt = new Date();
    }
    addNotes(notes) {
        if (this.props.notes) {
            this.props.notes += '\n' + notes.trim();
        }
        else {
            this.props.notes = notes.trim();
        }
        this.props.updatedAt = new Date();
    }
    resolve() {
        this.props.status = 'resolved';
        this.props.updatedAt = new Date();
    }
    markAsChronic() {
        this.props.status = 'chronic';
        this.props.isChronic = true;
        this.props.updatedAt = new Date();
    }
    getDurationInDays() {
        const today = new Date();
        const diffTime = today.getTime() - this.props.diagnosedDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    getDurationInYears() {
        return Math.floor(this.getDurationInDays() / 365);
    }
    // Validation methods
    isValid() {
        return (this.props.conditionName.length > 0 &&
            this.props.diagnosedDate <= new Date());
    }
    // Persistence methods
    toPersistence() {
        return {
            id: this.props.id,
            conditionName: this.props.conditionName,
            diagnosedDate: this.props.diagnosedDate.toISOString(),
            severity: this.props.severity,
            status: this.props.status,
            isChronic: this.props.isChronic,
            notes: this.props.notes,
            treatingPhysician: this.props.treatingPhysician,
            createdAt: this.props.createdAt.toISOString(),
            updatedAt: this.props.updatedAt.toISOString()
        };
    }
    static fromPersistence(data) {
        return MedicalHistory.reconstitute({
            id: data.id,
            conditionName: data.conditionName,
            diagnosedDate: new Date(data.diagnosedDate),
            severity: data.severity,
            status: data.status,
            isChronic: data.isChronic,
            notes: data.notes,
            treatingPhysician: data.treatingPhysician,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt)
        });
    }
    // Logging methods
    getSummaryForLogging() {
        return {
            id: this.props.id,
            conditionName: this.props.conditionName,
            severity: this.props.severity,
            status: this.props.status,
            isChronic: this.props.isChronic,
            durationInDays: this.getDurationInDays()
        };
    }
}
exports.MedicalHistory = MedicalHistory;
//# sourceMappingURL=MedicalHistory.js.map