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

export class GetPatientStatisticsUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(): Promise<PatientStatisticsResponse> {
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

