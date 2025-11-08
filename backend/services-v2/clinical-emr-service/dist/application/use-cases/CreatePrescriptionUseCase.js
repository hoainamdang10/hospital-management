"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePrescriptionUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const Prescription_1 = require("../../domain/entities/Prescription");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    medicationName: joi_1.default.string().required(),
    dosage: joi_1.default.string().required(),
    frequency: joi_1.default.string().required(),
    route: joi_1.default.string().required(),
    startDate: joi_1.default.date().iso().required(),
    endDate: joi_1.default.date().iso().optional(),
    instructions: joi_1.default.string().allow('', null),
});
class CreatePrescriptionUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = Prescription_1.Prescription.create({
            recordId: payload.recordId,
            medicationName: payload.medicationName,
            dosage: payload.dosage,
            frequency: payload.frequency,
            route: payload.route,
            startDate: new Date(payload.startDate),
            endDate: payload.endDate ? new Date(payload.endDate) : undefined,
            instructions: payload.instructions,
            status: 'active',
        });
        const persisted = await this.repository.save(entity.toJSON());
        return mappers_1.mappers.prescription(persisted);
    }
}
exports.CreatePrescriptionUseCase = CreatePrescriptionUseCase;
