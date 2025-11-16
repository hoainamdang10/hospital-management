"use strict";
/**
 * Get Patient Statistics Use Case
 *
 * Provides statistical data about patients for dashboard and reporting
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientStatisticsUseCase = void 0;
class GetPatientStatisticsUseCase {
    constructor(patientRepository) {
        this.patientRepository = patientRepository;
    }
    async execute() {
        // Get all statistics from repository
        const stats = await this.patientRepository.getStatistics();
        return {
            total: stats.total,
            byGender: stats.byGender,
            byAgeRange: stats.byAgeRange,
            byInsuranceType: stats.byInsuranceType,
            byStatus: stats.byStatus,
            registrationTrend: stats.registrationTrend
        };
    }
}
exports.GetPatientStatisticsUseCase = GetPatientStatisticsUseCase;
//# sourceMappingURL=GetPatientStatisticsUseCase.js.map