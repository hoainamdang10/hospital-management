"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTreatmentPlanUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const TreatmentPlan_1 = require("../../domain/entities/TreatmentPlan");
const mappers_1 = require("../dto/mappers");
const taskSchema = joi_1.default.object({
    description: joi_1.default.string().required(),
    type: joi_1.default.string().valid('medication', 'procedure', 'therapy').required(),
    status: joi_1.default.string().valid('pending', 'in_progress', 'completed').required(),
});
const schema = joi_1.default.object({
    recordId: joi_1.default.string().uuid().required(),
    summary: joi_1.default.string().required(),
    tasks: joi_1.default.array().items(taskSchema).min(1).required(),
});
class CreateTreatmentPlanUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request, { abortEarly: false });
        const entity = TreatmentPlan_1.TreatmentPlan.create({
            recordId: payload.recordId,
            summary: payload.summary,
            tasks: payload.tasks,
            status: 'draft',
        });
        const persisted = await this.repository.save(entity.toJSON());
        return mappers_1.mappers.treatmentPlan(persisted);
    }
}
exports.CreateTreatmentPlanUseCase = CreateTreatmentPlanUseCase;
