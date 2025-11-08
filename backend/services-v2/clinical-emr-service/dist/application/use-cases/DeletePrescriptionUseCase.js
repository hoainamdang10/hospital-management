"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePrescriptionUseCase = void 0;
class DeletePrescriptionUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ recordId, prescriptionId, }) {
        await this.repository.delete(recordId, prescriptionId);
    }
}
exports.DeletePrescriptionUseCase = DeletePrescriptionUseCase;
