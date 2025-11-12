"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryPatientRepository = void 0;
const Patient_1 = require("../../src/domain/aggregates/Patient");
const PatientStatus_1 = require("../../src/domain/value-objects/PatientStatus");
class InMemoryPatientRepository {
    constructor() {
        this.patients = new Map();
    }
    async findById(patientId) {
        return this.patients.get(patientId.getValue())?.patient ?? null;
    }
    async findByUserId(userId) {
        for (const record of this.patients.values()) {
            if (record.patient.getProps().userId === userId) {
                return record.patient;
            }
        }
        return null;
    }
    async findByNationalId(nationalId) {
        for (const record of this.patients.values()) {
            if (record.patient.getProps().personalInfo.nationalId === nationalId) {
                return record.patient;
            }
        }
        return null;
    }
    async save(patient) {
        this.patients.set(patient.getPatientId(), { patient });
    }
    async delete(patientId) {
        const existing = this.patients.get(patientId.getValue());
        if (existing) {
            const props = existing.patient.getProps();
            props.status = PatientStatus_1.PatientStatus.INACTIVE;
            this.patients.set(patientId.getValue(), { patient: existing.patient });
        }
    }
    async findWithFilters() {
        const patients = Array.from(this.patients.values()).map(record => record.patient);
        return { patients, total: patients.length };
    }
    async searchPatients(searchTerm, _filters, _pagination) {
        const term = searchTerm.trim().toLowerCase();
        const patients = Array.from(this.patients.values())
            .map(record => record.patient)
            .filter(patient => {
            const props = patient.getProps();
            return props.personalInfo.fullName.toLowerCase().includes(term) ||
                props.personalInfo.nationalId.includes(term) ||
                (props.contactInfo.email?.toLowerCase().includes(term) ?? false);
        });
        return { patients, total: patients.length };
    }
    async matchPatients() {
        return [];
    }
    async findByBHYTNumber(bhytNumber) {
        for (const record of this.patients.values()) {
            if (record.patient.getProps().insuranceInfo?.bhytNumber === bhytNumber) {
                return record.patient;
            }
        }
        return null;
    }
    async getHealthStatus() {
        return { status: 'healthy' };
    }
    async getStatistics() {
        const patients = Array.from(this.patients.values()).map(record => record.patient);
        return {
            total: patients.length,
            byGender: { male: 0, female: 0, other: 0, unknown: 0 },
            byAgeRange: { '0-18': 0, '19-40': 0, '41-60': 0, '60+': 0 },
            byInsuranceType: { bhyt: 0, bhtn: 0, private: 0, selfPay: 0 },
            byStatus: { active: patients.length, inactive: 0, deceased: 0, merged: 0 },
            registrationTrend: []
        };
    }
    async getPatientHistory(_patientId, _options) {
        // In-memory implementation returns empty history for tests
        return { history: [], total: 0 };
    }
    async createFromUserEvent(userData) {
        // Create patient using the same logic as SupabasePatientRepository
        const PersonalInfo = (await Promise.resolve().then(() => __importStar(require('../../src/domain/value-objects/PersonalInfo')))).PersonalInfo;
        const ContactInfo = (await Promise.resolve().then(() => __importStar(require('../../src/domain/value-objects/ContactInfo')))).ContactInfo;
        const BasicMedicalInfo = (await Promise.resolve().then(() => __importStar(require('../../src/domain/value-objects/BasicMedicalInfo')))).BasicMedicalInfo;
        const patient = Patient_1.Patient.register(userData.userId, PersonalInfo.create({
            fullName: userData.fullName,
            dateOfBirth: userData.dateOfBirth || new Date('2000-01-01'),
            gender: userData.gender || 'other',
            nationalId: userData.citizenId || '',
            nationality: 'VN',
            ethnicity: undefined,
            occupation: undefined,
            maritalStatus: undefined
        }), ContactInfo.create({
            primaryPhone: userData.phoneNumber || '',
            email: userData.email,
            address: {
                street: userData.address || '',
                ward: userData.ward || 'Chưa cập nhật',
                district: userData.district || 'Chưa cập nhật',
                city: userData.city || 'Chưa cập nhật',
                province: userData.province || 'Chưa cập nhật',
                postalCode: undefined,
                country: 'Vietnam'
            },
            preferredContactMethod: 'email'
        }), BasicMedicalInfo.create({
            bloodType: undefined,
            knownAllergies: [], // Use correct property name
            emergencyMedicalInfo: undefined
        }), undefined, // insuranceInfo
        [], // emergencyContacts
        'system' // Created by system during user activation
        );
        // Save to in-memory storage
        const savedPatient = {
            patient,
        };
        this.patients.set(patient.getPatientIdObject().getValue(), savedPatient);
        return patient;
    }
    /**
     * Utility helpers for tests
     */
    clear() {
        this.patients.clear();
    }
    getAllPatients() {
        return Array.from(this.patients.values()).map(record => record.patient);
    }
}
exports.InMemoryPatientRepository = InMemoryPatientRepository;
//# sourceMappingURL=InMemoryPatientRepository.js.map