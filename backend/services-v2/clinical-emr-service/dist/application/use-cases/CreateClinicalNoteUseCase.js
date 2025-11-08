"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateClinicalNoteUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const ClinicalNote_1 = require("../../domain/entities/ClinicalNote");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    authorId: joi_1.default.string().uuid().required(),
    type: joi_1.default.string().valid('soap', 'progress', 'discharge').required(),
    content: joi_1.default.object().required(),
});
class CreateClinicalNoteUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = ClinicalNote_1.ClinicalNote.create({
            recordId: payload.recordId,
            authorId: payload.authorId,
            type: payload.type,
            content: payload.content,
        });
        const persisted = await this.repository.save(entity.toJSON());
        return mappers_1.mappers.clinicalNote(persisted);
    }
}
exports.CreateClinicalNoteUseCase = CreateClinicalNoteUseCase;
