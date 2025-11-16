"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportPatientDataUseCase = void 0;
class ExportPatientDataUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        try {
            const format = request.format || 'json';
            if (format !== 'json') {
                return {
                    success: false,
                    error: "Only JSON format is currently supported"
                };
            }
            const exportData = await this.repository.exportPatientData(request.patientId);
            if (!exportData) {
                return {
                    success: false,
                    error: "Patient not found or no clinical data available"
                };
            }
            return {
                success: true,
                data: exportData
            };
        }
        catch (error) {
            console.error("Error exporting patient data:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}
exports.ExportPatientDataUseCase = ExportPatientDataUseCase;
