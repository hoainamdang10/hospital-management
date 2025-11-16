/**
 * Get Patient Statistics Use Case
 *
 * Provides statistical data about patients for dashboard and reporting
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
export interface PatientStatisticsResponse {
    total: number;
    byGender: {
        male: number;
        female: number;
        other: number;
        unknown: number;
    };
    byAgeRange: {
        '0-18': number;
        '19-40': number;
        '41-60': number;
        '60+': number;
    };
    byInsuranceType: {
        bhyt: number;
        bhtn: number;
        private: number;
        selfPay: number;
    };
    byStatus: {
        active: number;
        inactive: number;
        deceased: number;
        merged: number;
    };
    registrationTrend: Array<{
        month: string;
        count: number;
    }>;
}
export declare class GetPatientStatisticsUseCase {
    private readonly patientRepository;
    constructor(patientRepository: IPatientRepository);
    execute(): Promise<PatientStatisticsResponse>;
}
//# sourceMappingURL=GetPatientStatisticsUseCase.d.ts.map