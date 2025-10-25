/**
 * GetDoctorMedicalRecordsUseCase - Application Layer
 * Use case for retrieving all medical records by doctor
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';

export interface GetDoctorMedicalRecordsRequest {
  doctorId: string;
  status?: MedicalRecordStatus;
  page?: number;
  pageSize?: number;
  requestedBy: string;
}

export interface GetDoctorMedicalRecordsResponse {
  success: boolean;
  message: string;
  data?: {
    records: any[];
    pagination: {
      totalCount: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    statistics: {
      totalRecords: number;
      totalPatients: number;
      recordsThisMonth: number;
    };
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetDoctorMedicalRecordsUseCase extends BaseHealthcareUseCase<GetDoctorMedicalRecordsRequest, GetDoctorMedicalRecordsResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: GetDoctorMedicalRecordsRequest): Promise<GetDoctorMedicalRecordsResponse> {
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        data: {
          records: [],
          pagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
          statistics: { totalRecords: 0, totalPatients: 0, recordsThisMonth: 0 }
        },
        errors: validation.errors
      };
    }
    
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: GetDoctorMedicalRecordsRequest): Promise<GetDoctorMedicalRecordsResponse> {
    try {
      const page = request.page || 1;
      const pageSize = request.pageSize || 20;
      const offset = (page - 1) * pageSize;

      const records = await this.medicalRecordRepository.findByDoctorId(request.doctorId, {
        status: request.status,
        limit: pageSize,
        offset
      });

      const totalCount = await this.medicalRecordRepository.countByDoctorId(request.doctorId, request.status);
      const statistics = await this.medicalRecordRepository.getDoctorStatistics(request.doctorId);

      return {
        success: true,
        message: `Tìm thấy ${records.length} hồ sơ bệnh án`,
        data: {
          records: records.map(r => r.toJSON()),
          pagination: {
            totalCount,
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize)
          },
          statistics: {
            totalRecords: statistics.totalRecords,
            totalPatients: statistics.uniquePatients,
            recordsThisMonth: statistics.recordsThisMonth
          }
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách hồ sơ bác sĩ: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: GetDoctorMedicalRecordsRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.doctorId) errors.push({ field: 'doctorId', message: 'DoctorId là bắt buộc', code: 'REQUIRED' });
    if (!request.requestedBy) errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: GetDoctorMedicalRecordsRequest, userId: string): Promise<boolean> {
    return request.requestedBy === userId && request.doctorId === userId;
  }

  involvesPHI(request: GetDoctorMedicalRecordsRequest): boolean {
    return true;
  }

  getPatientId(request: GetDoctorMedicalRecordsRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Lấy danh sách hồ sơ bệnh án của bác sĩ';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:read'];
  }
}
