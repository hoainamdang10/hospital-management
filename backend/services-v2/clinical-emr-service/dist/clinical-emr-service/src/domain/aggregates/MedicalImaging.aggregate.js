"use strict";
/**
 * MedicalImaging - Aggregate Root
 * Represents a medical imaging study (X-Ray, CT, MRI, Ultrasound, etc.)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Aggregate Pattern, DICOM Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalImaging = exports.ImagingPriority = exports.ImagingStatus = exports.ImagingModality = exports.ImagingType = void 0;
const AggregateRoot_1 = require("@shared/domain/AggregateRoot");
const MedicalImagingId_1 = require("../value-objects/MedicalImagingId");
const MedicalImagingCreatedEvent_1 = require("../events/MedicalImagingCreatedEvent");
const MedicalImagingUpdatedEvent_1 = require("../events/MedicalImagingUpdatedEvent");
const MedicalImagingReportedEvent_1 = require("../events/MedicalImagingReportedEvent");
var ImagingType;
(function (ImagingType) {
    ImagingType["X_RAY"] = "x_ray";
    ImagingType["CT_SCAN"] = "ct_scan";
    ImagingType["MRI"] = "mri";
    ImagingType["ULTRASOUND"] = "ultrasound";
    ImagingType["PET_SCAN"] = "pet_scan";
    ImagingType["MAMMOGRAPHY"] = "mammography";
    ImagingType["FLUOROSCOPY"] = "fluoroscopy";
    ImagingType["NUCLEAR_MEDICINE"] = "nuclear_medicine";
    ImagingType["OTHER"] = "other";
})(ImagingType || (exports.ImagingType = ImagingType = {}));
var ImagingModality;
(function (ImagingModality) {
    ImagingModality["CR"] = "CR";
    ImagingModality["DX"] = "DX";
    ImagingModality["CT"] = "CT";
    ImagingModality["MR"] = "MR";
    ImagingModality["US"] = "US";
    ImagingModality["PT"] = "PT";
    ImagingModality["MG"] = "MG";
    ImagingModality["XA"] = "XA";
    ImagingModality["NM"] = "NM";
    ImagingModality["OTHER"] = "OTHER";
})(ImagingModality || (exports.ImagingModality = ImagingModality = {}));
var ImagingStatus;
(function (ImagingStatus) {
    ImagingStatus["ORDERED"] = "ordered";
    ImagingStatus["SCHEDULED"] = "scheduled";
    ImagingStatus["IN_PROGRESS"] = "in_progress";
    ImagingStatus["COMPLETED"] = "completed";
    ImagingStatus["REPORTED"] = "reported";
    ImagingStatus["VERIFIED"] = "verified";
    ImagingStatus["CANCELLED"] = "cancelled";
})(ImagingStatus || (exports.ImagingStatus = ImagingStatus = {}));
var ImagingPriority;
(function (ImagingPriority) {
    ImagingPriority["ROUTINE"] = "routine";
    ImagingPriority["URGENT"] = "urgent";
    ImagingPriority["STAT"] = "stat";
    ImagingPriority["ASAP"] = "asap";
})(ImagingPriority || (exports.ImagingPriority = ImagingPriority = {}));
class MedicalImaging extends AggregateRoot_1.AggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    get imagingId() {
        return this.props.imagingId;
    }
    get medicalRecordId() {
        return this.props.medicalRecordId;
    }
    get patientId() {
        return this.props.patientId;
    }
    get imagingType() {
        return this.props.imagingType;
    }
    get modality() {
        return this.props.modality;
    }
    get bodyPart() {
        return this.props.bodyPart;
    }
    get status() {
        return this.props.status;
    }
    get priority() {
        return this.props.priority;
    }
    get imageUrls() {
        return this.props.imageUrls;
    }
    get findings() {
        return this.props.findings;
    }
    get impression() {
        return this.props.impression;
    }
    /**
     * Create new medical imaging study
     */
    static create(props) {
        const imagingId = MedicalImagingId_1.MedicalImagingId.create();
        const now = new Date();
        const imaging = new MedicalImaging({
            ...props,
            imagingId,
            status: ImagingStatus.ORDERED,
            createdAt: now,
            updatedAt: now,
            accessLog: [],
        });
        imaging.addDomainEvent(new MedicalImagingCreatedEvent_1.MedicalImagingCreatedEvent({
            imagingId: imagingId.value,
            patientId: props.patientId,
            imagingType: props.imagingType,
            modality: props.modality,
            timestamp: now,
        }));
        return imaging;
    }
    /**
     * Reconstitute from persistence
     */
    static reconstitute(props, id) {
        return new MedicalImaging(props, id);
    }
    /**
     * Update imaging results
     */
    updateResults(findings, impression, radiologistId, technique, updatedBy) {
        this.props.findings = findings;
        this.props.impression = impression;
        this.props.radiologistId = radiologistId;
        this.props.technique = technique;
        this.props.reportedAt = new Date();
        this.props.status = ImagingStatus.REPORTED;
        this.props.updatedBy = updatedBy || radiologistId;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new MedicalImagingReportedEvent_1.MedicalImagingReportedEvent({
            imagingId: this.imagingId.value,
            patientId: this.patientId,
            radiologistId,
            timestamp: new Date(),
        }));
    }
    /**
     * Verify imaging report
     */
    verify(verifiedBy) {
        if (this.props.status !== ImagingStatus.REPORTED) {
            throw new Error('Can only verify reported imaging studies');
        }
        this.props.verifiedBy = verifiedBy;
        this.props.verifiedAt = new Date();
        this.props.status = ImagingStatus.VERIFIED;
        this.props.updatedBy = verifiedBy;
        this.props.updatedAt = new Date();
        this.addDomainEvent(new MedicalImagingUpdatedEvent_1.MedicalImagingUpdatedEvent({
            imagingId: this.imagingId.value,
            patientId: this.patientId,
            status: this.props.status,
            timestamp: new Date(),
        }));
    }
    /**
     * Add image URLs
     */
    addImageUrls(urls, updatedBy) {
        if (!this.props.imageUrls) {
            this.props.imageUrls = [];
        }
        this.props.imageUrls.push(...urls);
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
    }
    /**
     * Update DICOM metadata
     */
    updateDicomMetadata(dicomStudyUid, seriesCount, instanceCount, updatedBy) {
        this.props.dicomStudyUid = dicomStudyUid;
        this.props.seriesCount = seriesCount;
        this.props.instanceCount = instanceCount;
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
    }
    /**
     * Mark as completed
     */
    markCompleted(updatedBy) {
        this.props.status = ImagingStatus.COMPLETED;
        this.props.updatedBy = updatedBy;
        this.props.updatedAt = new Date();
    }
    /**
     * Cancel imaging study
     */
    cancel(reason, cancelledBy) {
        this.props.status = ImagingStatus.CANCELLED;
        this.props.notes = this.props.notes
            ? `${this.props.notes}\n\nCancelled: ${reason}`
            : `Cancelled: ${reason}`;
        this.props.updatedBy = cancelledBy;
        this.props.updatedAt = new Date();
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
    }
    /**
     * Check if imaging uses contrast
     */
    usesContrast() {
        return this.props.contrastUsed === true;
    }
    /**
     * Check if imaging is urgent
     */
    isUrgent() {
        return this.props.priority === ImagingPriority.URGENT ||
            this.props.priority === ImagingPriority.STAT ||
            this.props.priority === ImagingPriority.ASAP;
    }
    /**
     * Validate business rules
     */
    validate() {
        if (!this.props.medicalRecordId) {
            throw new Error('Medical record ID is required');
        }
        if (!this.props.patientId) {
            throw new Error('Patient ID is required');
        }
        if (!this.props.bodyPart || this.props.bodyPart.trim().length === 0) {
            throw new Error('Body part is required');
        }
        if (!this.props.orderedBy) {
            throw new Error('Ordered by is required');
        }
        if (!this.props.createdBy) {
            throw new Error('Created by is required');
        }
    }
}
exports.MedicalImaging = MedicalImaging;
//# sourceMappingURL=MedicalImaging.aggregate.js.map