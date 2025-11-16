"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientSummaryUseCase = void 0;
class GetPatientSummaryUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        try {
            const patientSummary = await this.repository.getPatientSummary(request.patientId);
            if (!patientSummary) {
                return {
                    success: false,
                    error: "Patient not found or no clinical data available"
                };
            }
            return {
                success: true,
                data: patientSummary
            };
        }
        catch (error) {
            console.error("Error getting patient summary:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}
exports.GetPatientSummaryUseCase = GetPatientSummaryUseCase;
