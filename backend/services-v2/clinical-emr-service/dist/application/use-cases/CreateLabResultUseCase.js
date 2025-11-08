"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLabResultUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const LabResult_1 = require("../../domain/entities/LabResult");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    testName: joi_1.default.string().required(),
    category: joi_1.default.string().valid('hematology', 'chemistry', 'immunology', 'microbiology', 'other').required(),
    resultValue: joi_1.default.string().required(),
    unit: joi_1.default.string().allow('', null),
    referenceRange: joi_1.default.string().allow('', null),
    attachments: joi_1.default.array().items(joi_1.default.string().uri()),
});
class CreateLabResultUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = LabResult_1.LabResult.create({
            recordId: payload.recordId,
            testName: payload.testName,
            category: payload.category,
            resultValue: payload.resultValue,
            unit: payload.unit,
            referenceRange: payload.referenceRange,
            status: 'completed',
            attachments: payload.attachments,
        });
        const persisted = await this.repository.save(entity.toJSON());
        return mappers_1.mappers.labResult(persisted);
    }
}
exports.CreateLabResultUseCase = CreateLabResultUseCase;
