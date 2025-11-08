"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteLabResultUseCase = void 0;
class DeleteLabResultUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute({ recordId, resultId }) {
        await this.repository.delete(recordId, resultId);
    }
}
exports.DeleteLabResultUseCase = DeleteLabResultUseCase;
