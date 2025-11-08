"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTreatmentPlansUseCase = void 0;
const mappers_1 = require("../dto/mappers");
class ListTreatmentPlansUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        const { page = 1, limit = 20 } = request;
        const plans = await this.repository.listByRecord(request.recordId, {
            page,
            limit,
        });
        return plans.map((plan) => mappers_1.mappers.treatmentPlan(plan));
    }
}
exports.ListTreatmentPlansUseCase = ListTreatmentPlansUseCase;
