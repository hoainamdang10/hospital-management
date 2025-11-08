"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMedicalRecordUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const MedicalRecord_1 = require("../../domain/entities/MedicalRecord");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    patientId: joi_1.default.string().uuid().required(),
    doctorId: joi_1.default.string().uuid().required(),
    encounterType: joi_1.default.string().valid('inpatient', 'outpatient').required(),
    encounterDate: joi_1.default.date().iso().required(),
    diagnosis: joi_1.default.object({
        primary: joi_1.default.string().required(),
        secondary: joi_1.default.array().items(joi_1.default.string()).optional(),
    }).required(),
    treatmentSummary: joi_1.default.string().allow('', null),
    vitalSigns: joi_1.default.object({
        temperature: joi_1.default.number(),
        heartRate: joi_1.default.number(),
        respiratoryRate: joi_1.default.number(),
        systolic: joi_1.default.number(),
        diastolic: joi_1.default.number(),
        spo2: joi_1.default.number(),
    }).optional(),
});
class CreateMedicalRecordUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = MedicalRecord_1.MedicalRecord.create({
            patientId: payload.patientId,
            doctorId: payload.doctorId,
            encounterType: payload.encounterType,
            encounterDate: new Date(payload.encounterDate),
            diagnosis: payload.diagnosis,
            treatmentSummary: payload.treatmentSummary,
            vitalSigns: payload.vitalSigns,
            status: 'draft',
        });
        const persisted = await this.repository.save(entity);
        return mappers_1.mappers.medicalRecord(persisted);
    }
}
exports.CreateMedicalRecordUseCase = CreateMedicalRecordUseCase;
