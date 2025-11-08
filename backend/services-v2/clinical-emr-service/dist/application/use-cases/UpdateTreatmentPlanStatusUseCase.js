"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTreatmentPlanStatusUseCase = void 0;
const joi_1 = __importDefault(require("joi"));
const TreatmentPlan_1 = require("../../domain/entities/TreatmentPlan");
const ApplicationError_1 = require("../errors/ApplicationError");
const mappers_1 = require("../dto/mappers");
const schema = joi_1.default.object({
    planId: joi_1.default.string().uuid().required(),
    recordId: joi_1.default.string().uuid().required(),
    status: joi_1.default.string().valid("draft", "active", "completed").required(),
});
class UpdateTreatmentPlanStatusUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const payload = await schema.validateAsync(request);
        const existing = await this.repository.getById(payload.planId);
        if (!existing) {
            throw new ApplicationError_1.ApplicationError(404, "Không tìm thấy treatment plan");
        }
        if (existing.recordId !== payload.recordId) {
            throw new ApplicationError_1.ApplicationError(403, "Plan không thuộc hồ sơ này");
        }
        const entity = TreatmentPlan_1.TreatmentPlan.create(existing);
        entity.update({ status: payload.status });
        const persisted = await this.repository.update(entity.toJSON());
        return mappers_1.mappers.treatmentPlan(persisted);
    }
}
exports.UpdateTreatmentPlanStatusUseCase = UpdateTreatmentPlanStatusUseCase;
