"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateImagingStudyUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const ImagingStudy_1 = require("../../domain/entities/ImagingStudy");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    modality: joi_1.default.string().valid('xray', 'ct', 'mri', 'ultrasound', 'other').required(),
    bodyRegion: joi_1.default.string().allow('', null),
    findings: joi_1.default.string().allow('', null),
    impression: joi_1.default.string().allow('', null),
    imageUrls: joi_1.default.array().items(joi_1.default.string().uri()),
});
class CreateImagingStudyUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = ImagingStudy_1.ImagingStudy.create({
            recordId: payload.recordId,
            modality: payload.modality,
            bodyRegion: payload.bodyRegion,
            findings: payload.findings,
            impression: payload.impression,
            imageUrls: payload.imageUrls,
        });
        const persisted = await this.repository.save(entity.toJSON());
        return mappers_1.mappers.imagingStudy(persisted);
    }
}
exports.CreateImagingStudyUseCase = CreateImagingStudyUseCase;
