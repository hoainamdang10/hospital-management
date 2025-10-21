"use strict";
/**
 * PatientMapper - Infrastructure Layer
 * Maps between Patient aggregate and database records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientMapper = void 0;
const Patient_1 = require("../../domain/aggregates/Patient");
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ContactInfo_1 = require("../../domain/value-objects/ContactInfo");
const BasicMedicalInfo_1 = require("../../domain/value-objects/BasicMedicalInfo");
const PatientLink_1 = require("../../domain/value-objects/PatientLink");
const CommunicationPreference_1 = require("../../domain/value-objects/CommunicationPreference");
const InsuranceInfo_1 = require("../../domain/entities/InsuranceInfo");
const EmergencyContact_1 = require("../../domain/entities/EmergencyContact");
const PatientConsent_1 = require("../../domain/entities/PatientConsent");
/**
 * PatientMapper - Maps between domain and persistence
 */
class PatientMapper {
    /**
     * Map from database records to Patient aggregate
     */
    static toDomain(patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords) {
        try {
            // Map PersonalInfo from JSONB
            const personalInfo = PersonalInfo_1.PersonalInfo.create({
                fullName: patientRecord.personal_info.fullName,
                dateOfBirth: new Date(patientRecord.personal_info.dateOfBirth),
                gender: patientRecord.personal_info.gender,
                nationalId: patientRecord.personal_info.nationalId,
                nationality: patientRecord.personal_info.nationality,
                ethnicity: patientRecord.personal_info.ethnicity,
                occupation: patientRecord.personal_info.occupation,
                maritalStatus: patientRecord.personal_info.maritalStatus
            });
            // Map ContactInfo from JSONB
            const contactInfo = ContactInfo_1.ContactInfo.create({
                primaryPhone: patientRecord.contact_info.primaryPhone,
                secondaryPhone: patientRecord.contact_info.secondaryPhone,
                email: patientRecord.contact_info.email,
                address: patientRecord.contact_info.address,
                preferredContactMethod: patientRecord.contact_info.preferredContactMethod
            });
            // Map BasicMedicalInfo from JSONB
            const basicMedicalInfo = BasicMedicalInfo_1.BasicMedicalInfo.create({
                bloodType: patientRecord.basic_medical_info.bloodType,
                knownAllergies: patientRecord.basic_medical_info.knownAllergies || [],
                emergencyMedicalInfo: patientRecord.basic_medical_info.emergencyMedicalInfo
            });
            // Map InsuranceInfo if exists
            let insuranceInfo;
            if (insuranceRecord) {
                insuranceInfo = InsuranceInfo_1.InsuranceInfo.reconstitute({
                    id: insuranceRecord.id,
                    provider: insuranceRecord.provider,
                    policyNumber: insuranceRecord.policy_number,
                    groupNumber: insuranceRecord.group_number || undefined,
                    validFrom: new Date(insuranceRecord.valid_from),
                    validTo: new Date(insuranceRecord.valid_to),
                    coverageType: insuranceRecord.coverage_type,
                    isVietnameseInsurance: insuranceRecord.is_vietnamese_insurance,
                    bhytNumber: insuranceRecord.bhyt_number || undefined,
                    isPrimary: insuranceRecord.is_primary,
                    isActive: insuranceRecord.is_active,
                    createdAt: new Date(insuranceRecord.created_at),
                    updatedAt: new Date(insuranceRecord.updated_at)
                });
            }
            // Map EmergencyContacts
            const emergencyContacts = (emergencyContactRecords || []).map(record => EmergencyContact_1.EmergencyContact.reconstitute({
                id: record.id,
                name: record.name,
                relationship: record.relationship,
                primaryPhone: record.primary_phone,
                secondaryPhone: record.secondary_phone || undefined,
                email: record.email || undefined,
                address: record.address || undefined,
                isPrimary: record.is_primary,
                isActive: record.is_active ?? true,
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at)
            }));
            // Map PatientConsents
            const consents = (consentRecords || []).map(record => PatientConsent_1.PatientConsent.reconstitute({
                id: record.id,
                patientId: PatientId_1.PatientId.fromString(patientRecord.patient_id),
                consentType: record.consent_type,
                isActive: record.is_active ?? true,
                grantedAt: record.granted_at ? new Date(record.granted_at) : new Date(),
                withdrawnAt: record.revoked_at ? new Date(record.revoked_at) : undefined,
                expiresAt: record.expires_at ? new Date(record.expires_at) : undefined,
                createdAt: new Date(record.created_at),
                updatedAt: new Date(record.updated_at)
            }));
            // Map PatientLinks
            const links = (linkRecords || []).map(record => PatientLink_1.PatientLink.create(PatientId_1.PatientId.fromString(record.other_patient_id), record.link_type, record.created_by));
            // Map CommunicationPreference if exists
            let communicationPreference;
            if (patientRecord.communication_preference) {
                communicationPreference = CommunicationPreference_1.CommunicationPreference.create({
                    language: patientRecord.communication_preference.language,
                    preferred: patientRecord.communication_preference.preferred,
                    contactMethod: patientRecord.communication_preference.contactMethod,
                    timezone: patientRecord.communication_preference.timezone
                });
            }
            // Reconstitute Patient aggregate
            const patientProps = {
                id: PatientId_1.PatientId.fromString(patientRecord.patient_id),
                userId: patientRecord.user_id,
                personalInfo,
                contactInfo,
                photoUrl: patientRecord.photo_url || undefined,
                communicationPreference,
                basicMedicalInfo,
                insuranceInfo,
                emergencyContacts,
                consents,
                status: patientRecord.status,
                mergedInto: patientRecord.merged_into ? PatientId_1.PatientId.fromString(patientRecord.merged_into) : undefined,
                links,
                createdAt: new Date(patientRecord.created_at),
                updatedAt: new Date(patientRecord.updated_at),
                createdBy: patientRecord.created_by,
                updatedBy: patientRecord.updated_by
            };
            return Patient_1.Patient.reconstitute(patientProps);
        }
        catch (error) {
            throw new Error(`Failed to map patient to domain: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Map from Patient aggregate to database record
     */
    static toPersistence(patient) {
        const props = patient.getProps();
        // Map to patient record
        const patientRecord = {
            id: patient.id,
            patient_id: props.id.getValue(),
            user_id: props.userId,
            personal_info: {
                fullName: props.personalInfo.fullName,
                dateOfBirth: props.personalInfo.dateOfBirth.toISOString().split('T')[0],
                gender: props.personalInfo.gender,
                nationalId: props.personalInfo.nationalId,
                nationality: props.personalInfo.nationality,
                ethnicity: props.personalInfo.ethnicity,
                occupation: props.personalInfo.occupation,
                maritalStatus: props.personalInfo.maritalStatus
            },
            contact_info: {
                primaryPhone: props.contactInfo.primaryPhone,
                secondaryPhone: props.contactInfo.secondaryPhone,
                email: props.contactInfo.email,
                address: props.contactInfo.address,
                preferredContactMethod: props.contactInfo.preferredContactMethod
            },
            basic_medical_info: {
                bloodType: props.basicMedicalInfo.bloodType,
                knownAllergies: props.basicMedicalInfo.knownAllergies,
                emergencyMedicalInfo: props.basicMedicalInfo.emergencyMedicalInfo
            },
            photo_url: props.photoUrl || null,
            communication_preference: props.communicationPreference ? props.communicationPreference.toDTO() : null,
            status: props.status,
            merged_into: props.mergedInto?.value || null,
            created_at: props.createdAt.toISOString(),
            updated_at: props.updatedAt.toISOString(),
            created_by: props.createdBy,
            updated_by: props.updatedBy
        };
        // Map insurance info
        let insuranceRecord;
        if (props.insuranceInfo) {
            insuranceRecord = {
                id: props.insuranceInfo.id,
                patient_id: props.id.getValue(),
                provider: props.insuranceInfo.provider,
                policy_number: props.insuranceInfo.policyNumber,
                group_number: props.insuranceInfo.groupNumber || null,
                valid_from: props.insuranceInfo.validFrom.toISOString().split('T')[0],
                valid_to: props.insuranceInfo.validTo.toISOString().split('T')[0],
                coverage_type: props.insuranceInfo.coverageType,
                is_vietnamese_insurance: props.insuranceInfo.isVietnameseInsurance,
                bhyt_number: props.insuranceInfo.bhytNumber || null,
                is_primary: props.insuranceInfo.isPrimary,
                is_active: props.insuranceInfo.isActive
            };
        }
        // Map emergency contacts
        const emergencyContactRecords = props.emergencyContacts.map(contact => ({
            id: contact.id,
            patient_id: props.id.getValue(),
            name: contact.name,
            relationship: contact.relationship,
            primary_phone: contact.primaryPhone,
            secondary_phone: contact.secondaryPhone || null,
            email: contact.email || null,
            address: contact.address || null,
            is_primary: contact.isPrimary
        }));
        // Map consents
        const consentRecords = props.consents.map(consent => ({
            id: consent.getId(),
            patient_id: props.id.value,
            consent_type: consent.consentType,
            is_active: consent.isActive,
            is_granted: consent.isGranted(),
            granted_at: consent.grantedAt.toISOString(),
            revoked_at: consent.revokedAt()?.toISOString() || null,
            expires_at: consent.expiresAt?.toISOString() || null
        }));
        // Map links
        const linkRecords = props.links.map(link => ({
            patient_id: props.id.value,
            other_patient_id: link.otherPatientId.value,
            link_type: link.linkType,
            created_at: link.createdAt.toISOString(),
            created_by: link.createdBy
        }));
        return {
            patientRecord,
            insuranceRecord,
            emergencyContactRecords,
            consentRecords,
            linkRecords
        };
    }
}
exports.PatientMapper = PatientMapper;
//# sourceMappingURL=PatientMapper.js.map