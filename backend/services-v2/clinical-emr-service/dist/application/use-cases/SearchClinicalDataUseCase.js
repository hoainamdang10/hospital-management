"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchClinicalDataUseCase = void 0;
class SearchClinicalDataUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(request) {
        try {
            const limit = request.limit || 50;
            if (!request.searchTerm || request.searchTerm.trim().length < 2) {
                return {
                    success: false,
                    error: "Search term must be at least 2 characters long"
                };
            }
            const results = await this.repository.searchClinicalData(request.searchTerm, limit);
            return {
                success: true,
                data: results
            };
        }
        catch (error) {
            console.error("Error searching clinical data:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}
exports.SearchClinicalDataUseCase = SearchClinicalDataUseCase;
