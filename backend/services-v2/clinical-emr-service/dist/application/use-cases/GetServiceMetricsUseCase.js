"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetServiceMetricsUseCase = void 0;
class GetServiceMetricsUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(_request) {
        try {
            const metrics = await this.repository.getServiceMetrics();
            return {
                success: true,
                data: metrics
            };
        }
        catch (error) {
            console.error("Error getting service metrics:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }
}
exports.GetServiceMetricsUseCase = GetServiceMetricsUseCase;
