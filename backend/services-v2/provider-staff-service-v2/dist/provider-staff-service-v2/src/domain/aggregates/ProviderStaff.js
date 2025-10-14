"use strict";
/**
 * ProviderStaff Aggregate Root
 * Manages healthcare provider staff members
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderStaff = void 0;
const aggregate_root_1 = require("../../../../shared/domain/base/aggregate-root");
const StaffId_1 = require("../value-objects/StaffId");
const StaffRegisteredEvent_1 = require("../events/StaffRegisteredEvent");
/**
 * ProviderStaff Aggregate Root
 */
class ProviderStaff extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    /**
     * Factory method for creating new staff members
     *
     * @param personalInfo - Personal information
     * @param professionalInfo - Professional information
     * @param staffType - Type of staff member
     * @returns ProviderStaff instance
     */
    static create(personalInfo, professionalInfo, staffType) {
        const staffId = StaffId_1.StaffId.generate();
        const now = new Date();
        const staff = new ProviderStaff({
            id: staffId,
            personalInfo,
            professionalInfo,
            staffType,
            isActive: true,
            createdAt: now,
            updatedAt: now
        });
        // Validate business invariants before creating
        staff.validateBusinessInvariants();
        // Domain event for staff registration
        staff.addDomainEvent(new StaffRegisteredEvent_1.StaffRegisteredEvent(staffId, staffType, personalInfo.fullName));
        return staff;
    }
    /**
     * Factory method for reconstituting from persistence
     * Used by infrastructure layer to rebuild domain object from database
     */
    static reconstitute(id, personalInfo, professionalInfo, staffType, isActive, createdAt, updatedAt) {
        const props = {
            id: StaffId_1.StaffId.fromString(id),
            personalInfo,
            professionalInfo,
            staffType,
            isActive,
            createdAt,
            updatedAt
        };
        const staff = new ProviderStaff(props, id);
        staff.validateBusinessInvariants();
        return staff;
    }
    /**
     * Activate staff member
     */
    activate() {
        this.props.isActive = true;
        this.props.updatedAt = new Date();
        this.validateBusinessInvariants();
    }
    /**
     * Deactivate staff member
     */
    deactivate() {
        this.props.isActive = false;
        this.props.updatedAt = new Date();
    }
    /**
     * Update personal information
     */
    updatePersonalInfo(personalInfo) {
        this.props.personalInfo = personalInfo;
        this.props.updatedAt = new Date();
        this.validateBusinessInvariants();
    }
    /**
     * Update professional information
     */
    updateProfessionalInfo(professionalInfo) {
        this.props.professionalInfo = professionalInfo;
        this.props.updatedAt = new Date();
        this.validateBusinessInvariants();
    }
    /**
     * Validate business-specific invariants
     */
    validateBusinessInvariants() {
        // Validate staff type
        const validTypes = ['doctor', 'nurse', 'technician', 'admin', 'other'];
        if (!validTypes.includes(this.props.staffType)) {
            throw new Error('Invalid staff type');
        }
        // Doctors must have license number
        if (this.props.staffType === 'doctor') {
            if (!this.props.professionalInfo.licenseNumber) {
                throw new Error('Doctors must have a license number');
            }
        }
    }
    /**
     * Get patient ID (Staff is not a patient)
     */
    getPatientId() {
        return null;
    }
    /**
     * Validate method required by base class
     */
    validate() {
        this.validateBusinessInvariants();
    }
    /**
     * Validate invariants
     */
    validateInvariants() {
        this.validateBusinessInvariants();
    }
    /**
     * Apply domain event (for event sourcing)
     */
    applyEvent(_event) {
        // Event sourcing not implemented yet
    }
    // Getters
    get id() {
        return this.props.id.value;
    }
    get staffId() {
        return this.props.id;
    }
    get personalInfo() {
        return this.props.personalInfo;
    }
    get professionalInfo() {
        return this.props.professionalInfo;
    }
    get staffType() {
        return this.props.staffType;
    }
    get isActive() {
        return this.props.isActive;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    /**
     * Convert to persistence format
     */
    toPersistence() {
        return {
            id: this.props.id.value,
            full_name: this.props.personalInfo.fullName,
            citizen_id: this.props.personalInfo.citizenId,
            date_of_birth: this.props.personalInfo.dateOfBirth?.toISOString(),
            gender: this.props.personalInfo.gender,
            phone_number: this.props.personalInfo.phoneNumber,
            email: this.props.personalInfo.email,
            address: this.props.personalInfo.address,
            license_number: this.props.professionalInfo.licenseNumber,
            specialization: this.props.professionalInfo.specialization,
            years_of_experience: this.props.professionalInfo.yearsOfExperience,
            qualifications: this.props.professionalInfo.qualifications,
            certifications: this.props.professionalInfo.certifications,
            staff_type: this.props.staffType,
            is_active: this.props.isActive,
            created_at: this.props.createdAt.toISOString(),
            updated_at: this.props.updatedAt.toISOString()
        };
    }
}
exports.ProviderStaff = ProviderStaff;
//# sourceMappingURL=ProviderStaff.js.map