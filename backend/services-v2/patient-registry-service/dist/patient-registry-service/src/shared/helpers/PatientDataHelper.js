"use strict";
/**
 * Patient Data Helper
 * Utility functions for patient data processing with smart defaults
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Progressive Profiling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateProfileCompletion = exports.getMissingFields = exports.hasContactInfoChanged = exports.hasPersonalInfoChanged = exports.mergeContactInfoForUpdate = exports.mergePersonalInfoForUpdate = exports.buildContactInfoForCreate = exports.buildPersonalInfoForCreate = void 0;
const PatientConstants_1 = require("../constants/PatientConstants");
/**
 * Build personal info for CREATE operations
 * Uses "Chưa cập nhật" for missing fields
 */
const buildPersonalInfoForCreate = (data) => ({
    fullName: data.fullName || PatientConstants_1.UNUPDATED,
    dateOfBirth: data.dateOfBirth || PatientConstants_1.UNUPDATED,
    gender: data.gender || PatientConstants_1.UNUPDATED,
    nationalId: data.nationalId || PatientConstants_1.UNUPDATED,
    nationality: (0, PatientConstants_1.getValueOrDefault)(data.nationality),
    ethnicity: (0, PatientConstants_1.getValueOrDefault)(data.ethnicity),
    occupation: (0, PatientConstants_1.getValueOrDefault)(data.occupation),
    maritalStatus: (0, PatientConstants_1.getValueOrDefault)(data.maritalStatus),
});
exports.buildPersonalInfoForCreate = buildPersonalInfoForCreate;
/**
 * Build contact info for CREATE operations
 * Uses "Chưa cập nhật" for missing fields
 */
const buildContactInfoForCreate = (data) => ({
    primaryPhone: data.primaryPhone || PatientConstants_1.UNUPDATED,
    secondaryPhone: data.secondaryPhone,
    email: data.email || PatientConstants_1.UNUPDATED,
    preferredContactMethod: data.preferredContactMethod || 'phone',
    address: {
        street: (0, PatientConstants_1.getValueOrDefault)(data.address?.street),
        ward: (0, PatientConstants_1.getValueOrDefault)(data.address?.ward),
        district: (0, PatientConstants_1.getValueOrDefault)(data.address?.district),
        city: (0, PatientConstants_1.getValueOrDefault)(data.address?.city),
        province: (0, PatientConstants_1.getValueOrDefault)(data.address?.province),
        postalCode: data.address?.postalCode,
        country: (0, PatientConstants_1.getValueOrDefault)(data.address?.country, 'Vietnam'),
    },
});
exports.buildContactInfoForCreate = buildContactInfoForCreate;
/**
 * Merge personal info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
const mergePersonalInfoForUpdate = (existing, dto) => ({
    fullName: dto.fullName !== undefined ? dto.fullName : existing.fullName,
    dateOfBirth: dto.dateOfBirth !== undefined ? dto.dateOfBirth : existing.dateOfBirth,
    gender: dto.gender !== undefined ? dto.gender : existing.gender,
    nationalId: dto.nationalId !== undefined ? dto.nationalId : existing.nationalId,
    nationality: dto.nationality !== undefined ? dto.nationality : existing.nationality,
    ethnicity: dto.ethnicity !== undefined ? dto.ethnicity : existing.ethnicity,
    occupation: dto.occupation !== undefined ? dto.occupation : existing.occupation,
    maritalStatus: dto.maritalStatus !== undefined ? dto.maritalStatus : existing.maritalStatus,
});
exports.mergePersonalInfoForUpdate = mergePersonalInfoForUpdate;
/**
 * Merge contact info for UPDATE operations
 * Distinguishes between undefined (no change) and explicit values
 */
const mergeContactInfoForUpdate = (existing, dto) => ({
    primaryPhone: dto.primaryPhone !== undefined ? dto.primaryPhone : existing.primaryPhone,
    secondaryPhone: dto.secondaryPhone !== undefined ? dto.secondaryPhone : existing.secondaryPhone,
    email: dto.email !== undefined ? dto.email : existing.email,
    preferredContactMethod: dto.preferredContactMethod !== undefined
        ? dto.preferredContactMethod
        : existing.preferredContactMethod,
    address: {
        street: dto.address?.street !== undefined ? dto.address.street : existing.address.street,
        ward: dto.address?.ward !== undefined ? dto.address.ward : existing.address.ward,
        district: dto.address?.district !== undefined ? dto.address.district : existing.address.district,
        city: dto.address?.city !== undefined ? dto.address.city : existing.address.city,
        province: dto.address?.province !== undefined ? dto.address.province : existing.address.province,
        postalCode: dto.address?.postalCode !== undefined ? dto.address.postalCode : existing.address.postalCode,
        country: dto.address?.country !== undefined ? dto.address.country : existing.address.country,
    },
});
exports.mergeContactInfoForUpdate = mergeContactInfoForUpdate;
/**
 * Check if personal info has changed
 */
const hasPersonalInfoChanged = (existing, updated) => {
    return JSON.stringify(existing) !== JSON.stringify(updated);
};
exports.hasPersonalInfoChanged = hasPersonalInfoChanged;
/**
 * Check if contact info has changed
 */
const hasContactInfoChanged = (existing, updated) => {
    return JSON.stringify(existing) !== JSON.stringify(updated);
};
exports.hasContactInfoChanged = hasContactInfoChanged;
/**
 * Get missing fields list for UI prompts
 */
const getMissingFields = (personalInfo) => {
    return Object.entries(personalInfo)
        .filter(([_, value]) => value === PatientConstants_1.UNUPDATED)
        .map(([key]) => key);
};
exports.getMissingFields = getMissingFields;
/**
 * Calculate profile completion percentage
 */
const calculateProfileCompletion = (personalInfo) => {
    const totalFields = Object.keys(personalInfo).length;
    const completedFields = Object.values(personalInfo).filter(value => value !== PatientConstants_1.UNUPDATED).length;
    return Math.round((completedFields / totalFields) * 100);
};
exports.calculateProfileCompletion = calculateProfileCompletion;
//# sourceMappingURL=PatientDataHelper.js.map