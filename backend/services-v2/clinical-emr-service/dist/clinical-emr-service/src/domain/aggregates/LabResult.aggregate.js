"use strict";
/**
 * LabResult Aggregate - Clinical EMR Service
 * Core aggregate for managing laboratory test results
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA, FHIR R4
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResult = exports.LabTestPriority = exports.LabResultStatus = exports.LabTestType = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const LabResultCreatedEvent_1 = require("../events/LabResultCreatedEvent");
const LabResultUpdatedEvent_1 = require("../events/LabResultUpdatedEvent");
const LabResultVerifiedEvent_1 = require("../events/LabResultVerifiedEvent");
const LabResultId_1 = require("../value-objects/LabResultId");
var LabTestType;
(function (LabTestType) {
    LabTestType["HEMATOLOGY"] = "hematology";
    LabTestType["BIOCHEMISTRY"] = "biochemistry";
    LabTestType["MICROBIOLOGY"] = "microbiology";
    LabTestType["IMMUNOLOGY"] = "immunology";
    LabTestType["SEROLOGY"] = "serology";
    LabTestType["URINALYSIS"] = "urinalysis";
    LabTestType["COAGULATION"] = "coagulation";
    LabTestType["ENDOCRINOLOGY"] = "endocrinology";
    LabTestType["TOXICOLOGY"] = "toxicology";
    LabTestType["MOLECULAR"] = "molecular";
    LabTestType["GENETICS"] = "genetics";
    LabTestType["OTHER"] = "other";
})(LabTestType || (exports.LabTestType = LabTestType = {}));
var LabResultStatus;
(function (LabResultStatus) {
    LabResultStatus["ORDERED"] = "ordered";
    LabResultStatus["SPECIMEN_COLLECTED"] = "specimen_collected";
    LabResultStatus["IN_PROGRESS"] = "in_progress";
    LabResultStatus["PRELIMINARY"] = "preliminary";
    LabResultStatus["FINAL"] = "final";
    LabResultStatus["VERIFIED"] = "verified";
    LabResultStatus["AMENDED"] = "amended";
    LabResultStatus["CANCELLED"] = "cancelled";
})(LabResultStatus || (exports.LabResultStatus = LabResultStatus = {}));
var LabTestPriority;
(function (LabTestPriority) {
    LabTestPriority["ROUTINE"] = "routine";
    LabTestPriority["URGENT"] = "urgent";
    LabTestPriority["STAT"] = "stat";
    LabTestPriority["ASAP"] = "asap";
})(LabTestPriority || (exports.LabTestPriority = LabTestPriority = {}));
/**
 * LabResult Aggregate Root
 * Manages laboratory test results with business rules and invariants
 */
class LabResult extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method to create new lab result
     */
    static create(props) {
        const labResult = new LabResult({
            ...props,
            resultId: LabResultId_1.LabResultId.create(),
            status: LabResultStatus.ORDERED,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        labResult.addDomainEvent(new LabResultCreatedEvent_1.LabResultCreatedEvent({
            resultId: labResult.props.resultId.value,
            patientId: labResult.props.patientId,
            medicalRecordId: labResult.props.medicalRecordId,
            testType: labResult.props.testType,
            orderedBy: labResult.props.orderedBy,
            priority: labResult.props.priority,
            timestamp: new Date(),
        }));
        return labResult;
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props, id) {
        return new LabResult(props, id);
    }
    // =====================================================
    // GETTERS
    // =====================================================
    get resultId() {
        return this.props.resultId;
    }
    get medicalRecordId() {
        return this.props.medicalRecordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get testName() {
        return this.props.testName;
    }
    get testType() {
        return this.props.testType;
    }
    get status() {
        return this.props.status;
    }
    get resultValue() {
        return this.props.resultValue;
    }
    get priority() {
        return this.props.priority;
    }
    // =====================================================
    // BUSINESS METHODS
    // =====================================================
    /**
     * Update lab result with test results
     */
    updateResults(resultValue, referenceRange, unit, interpretation, performedBy, updatedBy) {
        if (this.props.status === LabResultStatus.CANCELLED) {
            throw new Error('Cannot update cancelled lab result');
        }
        if (this.props.status === LabResultStatus.VERIFIED) {
            throw new Error('Cannot update verified lab result. Create amendment instead.');
        }
        this.props.resultValue = resultValue;
        this.props.referenceRange = referenceRange;
        this.props.unit = unit;
        this.props.interpretation = interpretation;
        this.props.performedBy = performedBy;
        this.props.testPerformedAt = new Date();
        this.props.status = LabResultStatus.PRELIMINARY;
        this.props.updatedAt = new Date();
        this.props.updatedBy = updatedBy;
        this.addDomainEvent(new LabResultUpdatedEvent_1.LabResultUpdatedEvent({
            resultId: this.props.resultId.value,
            patientId: this.props.patientId,
            status: this.props.status,
            updatedBy: updatedBy || 'system',
            timestamp: new Date(),
        }));
    }
    /**
     * Verify lab result (doctor confirmation)
     */
    verify(verifiedBy) {
        if (this.props.status === LabResultStatus.CANCELLED) {
            throw new Error('Cannot verify cancelled lab result');
        }
        if (!this.props.resultValue) {
            throw new Error('Cannot verify lab result without results');
        }
        this.props.verifiedBy = verifiedBy;
        this.props.verifiedAt = new Date();
        this.props.status = LabResultStatus.VERIFIED;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new LabResultVerifiedEvent_1.LabResultVerifiedEvent({
            resultId: this.props.resultId.value,
            patientId: this.props.patientId,
            verifiedBy,
            timestamp: new Date(),
        }));
    }
    /**
     * Mark specimen as collected
     */
    markSpecimenCollected(collectedBy) {
        if (this.props.status !== LabResultStatus.ORDERED) {
            throw new Error('Can only mark specimen collected for ordered tests');
        }
        this.props.specimenCollectedAt = new Date();
        this.props.specimenCollectedBy = collectedBy;
        this.props.status = LabResultStatus.SPECIMEN_COLLECTED;
        this.props.updatedAt = new Date();
    }
    /**
     * Cancel lab result
     */
    cancel(reason, cancelledBy) {
        if (this.props.status === LabResultStatus.VERIFIED) {
            throw new Error('Cannot cancel verified lab result');
        }
        this.props.status = LabResultStatus.CANCELLED;
        this.props.notes = `Cancelled: ${reason}`;
        this.props.updatedAt = new Date();
        this.props.updatedBy = cancelledBy;
    }
    /**
     * Log access for HIPAA compliance
     */
    logAccess(accessedBy, accessPurpose, ipAddress) {
        if (!this.props.accessLog) {
            this.props.accessLog = [];
        }
        this.props.accessLog.push({
            accessedBy,
            accessedAt: new Date(),
            accessPurpose,
            ipAddress,
        });
        this.props.lastAccessedAt = new Date();
        this.props.lastAccessedBy = accessedBy;
    }
    /**
     * Check if result is critical
     */
    isCritical() {
        return this.props.interpretation?.toLowerCase().includes('critical') || false;
    }
    /**
     * Check if result is abnormal
     */
    isAbnormal() {
        const interpretation = this.props.interpretation?.toLowerCase();
        return interpretation?.includes('abnormal') || interpretation?.includes('critical') || false;
    }
    /**
     * Validate business rules
     */
    validate() {
        if (!this.props.testName) {
            throw new Error('Test name is required');
        }
        if (!this.props.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!this.props.medicalRecordId) {
            throw new Error('Medical record ID is required');
        }
        if (!this.props.orderedBy) {
            throw new Error('Ordered by is required');
        }
    }
}
exports.LabResult = LabResult;
//# sourceMappingURL=LabResult.aggregate.js.map