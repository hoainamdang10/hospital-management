"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteTreatmentPlanUseCase = void 0;
class DeleteTreatmentPlanUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ recordId, planId, }) {
        await this.repository.delete(recordId, planId);
    }
}
exports.DeleteTreatmentPlanUseCase = DeleteTreatmentPlanUseCase;
