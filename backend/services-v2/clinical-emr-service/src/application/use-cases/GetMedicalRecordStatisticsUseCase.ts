/**
 * GetMedicalRecordStatisticsUseCase - Application Layer
 * Use case for getting medical record statistics
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';

export interface GetMedicalRecordStatisticsRequest {
  requestedBy: string;
  patientId?: string;
  doctorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetMedicalRecordStatisticsResponse {
  success: boolean;
  message: string;
  data?: {
    overview: {
      totalRecords: number;
      activeRecords: number;
      archivedRecords: number;
      recordsThisMonth: number;
      recordsThisYear: number;
    };
    byStatus: Record<string, number>;
    bySpecialty: Record<string, number>;
    trends: {
      dailyAverage: number;
      weeklyAverage: number;
      monthlyAverage: number;
    };
    topDiagnoses: Array<{
      code: string;
      count: number;
    }>;
    topMedications: Array<{
      code: string;
      count: number;
    }>;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetMedicalRecordStatisticsUseCase extends BaseHealthcareUseCase<GetMedicalRecordStatisticsRequest, GetMedicalRecordStatisticsResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: GetMedicalRecordStatisticsRequest): Promise<GetMedicalRecordStatisticsResponse> {
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: GetMedicalRecordStatisticsRequest): Promise<GetMedicalRecordStatisticsResponse> {
    try {
      let statistics;

      if (request.patientId) {
        statistics = await this.medicalRecordRepository.getPatientStatistics(request.patientId);
      } else if (request.doctorId) {
        statistics = await this.medicalRecordRepository.getDoctorStatistics(request.doctorId);
      } else {
        // System-wide statistics not available, return empty stats
        statistics = {
          totalRecords: 0,
          activeRecords: 0,
          archivedRecords: 0
        } as any;
      }

      return {
        success: true,
        message: 'Thống kê hồ sơ bệnh án',
        data: {
          overview: {
            totalRecords: statistics.totalRecords || 0,
            activeRecords: statistics.activeRecords || 0,
            archivedRecords: statistics.archivedRecords || 0,
            recordsThisMonth: statistics.recordsThisMonth || 0,
            recordsThisYear: statistics.recordsThisYear || 0
          },
          byStatus: statistics.byStatus || {},
          bySpecialty: statistics.bySpecialty || {},
          trends: {
            dailyAverage: statistics.dailyAverage || 0,
            weeklyAverage: statistics.weeklyAverage || 0,
            monthlyAverage: statistics.monthlyAverage || 0
          },
          topDiagnoses: statistics.topDiagnoses || [],
          topMedications: statistics.topMedications || []
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy thống kê: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: GetMedicalRecordStatisticsRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.requestedBy) {
      errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });
    }

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: GetMedicalRecordStatisticsRequest, userId: string): Promise<boolean> {
    return request.requestedBy === userId;
  }

  involvesPHI(request: GetMedicalRecordStatisticsRequest): boolean {
    return false;
  }

  getPatientId(request: GetMedicalRecordStatisticsRequest): string | null {
    return request.patientId || null;
  }

  getDescription(): string {
    return 'Xem thống kê hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'statistics:view'];
  }
}


