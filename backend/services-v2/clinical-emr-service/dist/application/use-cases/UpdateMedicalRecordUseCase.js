"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMedicalRecordUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const MedicalRecord_1 = require("../../domain/entities/MedicalRecord");
const ApplicationError_1 = require("../errors/ApplicationError");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    patientId: joi_1.default.string().uuid(),
    doctorId: joi_1.default.string().uuid(),
    encounterType: joi_1.default.string().valid('inpatient', 'outpatient'),
    encounterDate: joi_1.default.date().iso(),
    diagnosis: joi_1.default.object({
        primary: joi_1.default.string().required(),
        secondary: joi_1.default.array().items(joi_1.default.string()).optional(),
    }),
    treatmentSummary: joi_1.default.string().allow('', null),
    vitalSigns: joi_1.default.object({
        temperature: joi_1.default.number(),
        heartRate: joi_1.default.number(),
        respiratoryRate: joi_1.default.number(),
        systolic: joi_1.default.number(),
        diastolic: joi_1.default.number(),
        spo2: joi_1.default.number(),
    }),
    status: joi_1.default.string().valid('draft', 'final', 'archived'),
});
class UpdateMedicalRecordUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ id, payload }) {
        if (!id) {
            throw new ApplicationError_1.ApplicationError(400, 'recordId là bắt buộc');
        }
        const value = await schema.validateAsync(payload, { abortEarly: false });
        const existing = await this.repository.getById(id);
        if (!existing) {
            throw new ApplicationError_1.ApplicationError(404, 'Không tìm thấy hồ sơ');
        }
        const entity = MedicalRecord_1.MedicalRecord.create(existing);
        entity.update({
            patientId: value.patientId ?? existing.patientId,
            doctorId: value.doctorId ?? existing.doctorId,
            encounterType: value.encounterType ?? existing.encounterType,
            encounterDate: value.encounterDate ? new Date(value.encounterDate) : existing.encounterDate,
            diagnosis: value.diagnosis ?? existing.diagnosis,
            treatmentSummary: value.treatmentSummary ?? existing.treatmentSummary,
            vitalSigns: value.vitalSigns ?? existing.vitalSigns,
            status: (value.status ?? existing.status),
        });
        const persisted = await this.repository.update(entity);
        return mappers_1.mappers.medicalRecord(persisted);
    }
}
exports.UpdateMedicalRecordUseCase = UpdateMedicalRecordUseCase;
