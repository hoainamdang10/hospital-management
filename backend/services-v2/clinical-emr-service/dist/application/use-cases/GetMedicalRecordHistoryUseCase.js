"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMedicalRecordHistoryUseCase = void 0;
class GetMedicalRecordHistoryUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        try {
            const history = await this.repository.getMedicalRecordHistory(request.recordId);
            return {
                success: true,
                data: history
            };
        }
        catch (error) {
            console.error("Error getting medical record history:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}
exports.GetMedicalRecordHistoryUseCase = GetMedicalRecordHistoryUseCase;
