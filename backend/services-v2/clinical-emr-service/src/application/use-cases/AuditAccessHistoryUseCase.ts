/**
 * AuditAccessHistoryUseCase - Application Layer
 * Use case for auditing access history of medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';

export interface AuditAccessHistoryRequest {
  recordId: string;
  requestedBy: string;
  dateFrom?: string;
  dateTo?: string;
  accessType?: 'read' | 'write' | 'print' | 'export';
  accessedBy?: string;
}

export interface AuditAccessHistoryResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    accessLog: Array<{
      accessedAt: string;
      accessedBy: string;
      accessType: string;
      ipAddress?: string;
      userAgent?: string;
      purpose?: string;
    }>;
    summary: {
      totalAccesses: number;
      uniqueUsers: number;
      readAccesses: number;
      writeAccesses: number;
      printAccesses: number;
      exportAccesses: number;
      firstAccessAt?: string;
      lastAccessAt?: string;
    };
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class AuditAccessHistoryUseCase extends BaseHealthcareUseCase<AuditAccessHistoryRequest, AuditAccessHistoryResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: AuditAccessHistoryRequest): Promise<AuditAccessHistoryResponse> {
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

  protected async executeInternal(request: AuditAccessHistoryRequest): Promise<AuditAccessHistoryResponse> {
    try {
      const recordId = RecordId.create(request.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return {
          success: false,
          message: 'Không tìm thấy hồ sơ bệnh án',
          errors: [{ field: 'recordId', message: 'Hồ sơ không tồn tại', code: 'NOT_FOUND' }]
        };
      }

      let accessLog = medicalRecord.accessLog || [];

      // Filter by date range
      if (request.dateFrom) {
        const fromDate = new Date(request.dateFrom);
        accessLog = accessLog.filter(log => new Date(log.accessedAt) >= fromDate);
      }

      if (request.dateTo) {
        const toDate = new Date(request.dateTo);
        accessLog = accessLog.filter(log => new Date(log.accessedAt) <= toDate);
      }

      // Filter by access type
      if (request.accessType) {
        accessLog = accessLog.filter(log => log.accessType === request.accessType);
      }

      // Filter by user
      if (request.accessedBy) {
        accessLog = accessLog.filter(log => log.accessedBy === request.accessedBy);
      }

      // Calculate summary
      const uniqueUsers = new Set(accessLog.map(log => log.accessedBy)).size;
      const readAccesses = accessLog.filter(log => log.accessType === 'read').length;
      const writeAccesses = accessLog.filter(log => log.accessType === 'write').length;
      const printAccesses = accessLog.filter(log => log.accessType === 'print').length;
      const exportAccesses = accessLog.filter(log => log.accessType === 'export').length;

      const sortedLogs = [...accessLog].sort((a, b) => 
        new Date(a.accessedAt).getTime() - new Date(b.accessedAt).getTime()
      );

      return {
        success: true,
        message: `Tìm thấy ${accessLog.length} lượt truy cập`,
        data: {
          recordId: request.recordId,
          accessLog: accessLog.map(log => ({
            accessedAt: log.accessedAt.toISOString ? log.accessedAt.toISOString() : log.accessedAt.toString(),
            accessedBy: log.accessedBy,
            accessType: log.accessType,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            purpose: log.purpose
          })),
          summary: {
            totalAccesses: accessLog.length,
            uniqueUsers,
            readAccesses,
            writeAccesses,
            printAccesses,
            exportAccesses,
            firstAccessAt: sortedLogs[0]?.accessedAt.toISOString ? sortedLogs[0].accessedAt.toISOString() : sortedLogs[0]?.accessedAt.toString(),
            lastAccessAt: sortedLogs[sortedLogs.length - 1]?.accessedAt.toISOString ? sortedLogs[sortedLogs.length - 1].accessedAt.toISOString() : sortedLogs[sortedLogs.length - 1]?.accessedAt.toString()
          }
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi kiểm tra lịch sử truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: AuditAccessHistoryRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.requestedBy) errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: AuditAccessHistoryRequest, userId: string): Promise<boolean> {
    return request.requestedBy === userId;
  }

  involvesPHI(request: AuditAccessHistoryRequest): boolean {
    return true;
  }

  getPatientId(request: AuditAccessHistoryRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Kiểm tra lịch sử truy cập hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:audit', 'admin'];
  }
}


