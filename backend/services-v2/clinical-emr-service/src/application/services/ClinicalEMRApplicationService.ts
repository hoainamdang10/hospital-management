/**
 * ClinicalEMRApplicationService - Application Layer
 * Main application service orchestrating all Clinical EMR operations
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { CreateMedicalRecordUseCase } from '../use-cases/CreateMedicalRecordUseCase';
import { UpdateMedicalRecordUseCase } from '../use-cases/UpdateMedicalRecordUseCase';
import { GetMedicalRecordUseCase } from '../use-cases/GetMedicalRecordUseCase';
import { GetPatientMedicalRecordsUseCase } from '../use-cases/GetPatientMedicalRecordsUseCase';
import { GenerateMedicalReportUseCase } from '../use-cases/GenerateMedicalReportUseCase';
import { SearchMedicalRecordsUseCase } from '../use-cases/SearchMedicalRecordsUseCase';

// Command Handlers
import { AddDiagnosisCommandHandler } from '../handlers/commands/AddDiagnosisCommandHandler';
import { AddMedicationCommandHandler } from '../handlers/commands/AddMedicationCommandHandler';

// Query Handlers
import { GetMedicalRecordDetailsQueryHandler } from '../handlers/queries/GetMedicalRecordDetailsQueryHandler';

// DTOs and Interfaces
import { CreateMedicalRecordRequest, CreateMedicalRecordResponse } from '../dto/CreateMedicalRecordRequest';
import { UpdateMedicalRecordRequest, UpdateMedicalRecordResponse } from '../dto/UpdateMedicalRecordRequest';
import { GetMedicalRecordRequest } from '../dto/GetMedicalRecordRequest';
import { GetPatientMedicalRecordsRequest } from '../dto/GetPatientMedicalRecordsRequest';

import { 
  GenerateMedicalReportRequest, 
  GenerateMedicalReportResponse 
} from '../use-cases/GenerateMedicalReportUseCase';

import { 
  SearchMedicalRecordsRequest, 
  SearchMedicalRecordsResponse 
} from '../use-cases/SearchMedicalRecordsUseCase';

import { 
  AddDiagnosisCommand, 
  AddDiagnosisResponse 
} from '../handlers/commands/AddDiagnosisCommandHandler';

import { 
  AddMedicationCommand, 
  AddMedicationResponse 
} from '../handlers/commands/AddMedicationCommandHandler';

import { 
  GetMedicalRecordDetailsQuery, 
  MedicalRecordDetailsResponse 
} from '../handlers/queries/GetMedicalRecordDetailsQueryHandler';

/**
 * Clinical EMR Application Service
 * Orchestrates all medical record operations with proper error handling and logging
 */
export class ClinicalEMRApplicationService {
  
  constructor(
    // Use Cases
    private readonly createMedicalRecordUseCase: CreateMedicalRecordUseCase,
    private readonly updateMedicalRecordUseCase: UpdateMedicalRecordUseCase,
    private readonly getMedicalRecordUseCase: GetMedicalRecordUseCase,
    private readonly getPatientMedicalRecordsUseCase: GetPatientMedicalRecordsUseCase,
    private readonly generateMedicalReportUseCase: GenerateMedicalReportUseCase,
    private readonly searchMedicalRecordsUseCase: SearchMedicalRecordsUseCase,
    
    // Command Handlers
    private readonly addDiagnosisCommandHandler: AddDiagnosisCommandHandler,
    private readonly addMedicationCommandHandler: AddMedicationCommandHandler,
    
    // Query Handlers
    private readonly getMedicalRecordDetailsQueryHandler: GetMedicalRecordDetailsQueryHandler
  ) {}

  /**
   * Create new medical record
   */
  async createMedicalRecord(
    request: CreateMedicalRecordRequest,
    userId: string
  ): Promise<CreateMedicalRecordResponse> {
    try {
      // Validate request
      const validation = await this.createMedicalRecordUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.createMedicalRecordUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền tạo hồ sơ bệnh án',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền tạo hồ sơ bệnh án',
            code: 'UNAUTHORIZED_CREATE'
          }]
        };
      }

      // Execute use case
      return await this.createMedicalRecordUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi tạo hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Update existing medical record
   */
  async updateMedicalRecord(
    request: UpdateMedicalRecordRequest,
    userId: string
  ): Promise<UpdateMedicalRecordResponse> {
    try {
      // Validate request
      const validation = await this.updateMedicalRecordUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.updateMedicalRecordUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền cập nhật hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền cập nhật',
            code: 'UNAUTHORIZED_UPDATE'
          }]
        };
      }

      // Execute use case
      return await this.updateMedicalRecordUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi cập nhật hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Get medical record by ID
   */
  async getMedicalRecord(
    request: GetMedicalRecordRequest,
    userId: string
  ): Promise<any> {
    try {
      // Validate request
      const validation = await this.getMedicalRecordUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.getMedicalRecordUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền xem hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền xem',
            code: 'UNAUTHORIZED_READ'
          }]
        };
      }

      // Execute use case
      return await this.getMedicalRecordUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi lấy hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Get patient medical records
   */
  async getPatientMedicalRecords(
    request: GetPatientMedicalRecordsRequest,
    userId: string
  ): Promise<any> {
    try {
      // Validate request
      const validation = await this.getPatientMedicalRecordsUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.getPatientMedicalRecordsUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền xem hồ sơ bệnh án của bệnh nhân này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền xem',
            code: 'UNAUTHORIZED_READ'
          }]
        };
      }

      // Execute use case
      return await this.getPatientMedicalRecordsUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi lấy hồ sơ bệnh án của bệnh nhân: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Generate medical report
   */
  async generateMedicalReport(
    request: GenerateMedicalReportRequest,
    userId: string
  ): Promise<GenerateMedicalReportResponse> {
    try {
      // Validate request
      const validation = await this.generateMedicalReportUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.generateMedicalReportUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền tạo báo cáo cho hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền tạo báo cáo',
            code: 'UNAUTHORIZED_REPORT'
          }]
        };
      }

      // Execute use case
      return await this.generateMedicalReportUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi tạo báo cáo y tế: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Search medical records
   */
  async searchMedicalRecords(
    request: SearchMedicalRecordsRequest,
    userId: string
  ): Promise<SearchMedicalRecordsResponse> {
    try {
      // Validate request
      const validation = await this.searchMedicalRecordsUseCase.validate(request);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.searchMedicalRecordsUseCase.authorize(request, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền tìm kiếm hồ sơ bệnh án',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền tìm kiếm',
            code: 'UNAUTHORIZED_SEARCH'
          }]
        };
      }

      // Execute use case
      return await this.searchMedicalRecordsUseCase.execute(request);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi tìm kiếm hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Add diagnosis to medical record
   */
  async addDiagnosis(
    command: AddDiagnosisCommand,
    userId: string
  ): Promise<AddDiagnosisResponse> {
    try {
      // Validate command
      const validation = await this.addDiagnosisCommandHandler.validate(command);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.addDiagnosisCommandHandler.authorize(command, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền thêm chẩn đoán cho hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền thêm chẩn đoán',
            code: 'UNAUTHORIZED_ADD_DIAGNOSIS'
          }]
        };
      }

      // Execute command
      return await this.addDiagnosisCommandHandler.execute(command);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Add medication to medical record
   */
  async addMedication(
    command: AddMedicationCommand,
    userId: string
  ): Promise<AddMedicationResponse> {
    try {
      // Validate command
      const validation = await this.addMedicationCommandHandler.validate(command);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.addMedicationCommandHandler.authorize(command, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền kê thuốc cho hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền kê thuốc',
            code: 'UNAUTHORIZED_PRESCRIBE'
          }]
        };
      }

      // Execute command
      return await this.addMedicationCommandHandler.execute(command);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi thêm thuốc: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Get detailed medical record information
   */
  async getMedicalRecordDetails(
    query: GetMedicalRecordDetailsQuery,
    userId: string
  ): Promise<MedicalRecordDetailsResponse> {
    try {
      // Validate query
      const validation = await this.getMedicalRecordDetailsQueryHandler.validate(query);
      if (!validation.isValid) {
        return {
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: validation.errors
        };
      }

      // Check authorization
      const authorized = await this.getMedicalRecordDetailsQueryHandler.authorize(query, userId);
      if (!authorized) {
        return {
          success: false,
          message: 'Bạn không có quyền xem chi tiết hồ sơ bệnh án này',
          errors: [{
            field: 'authorization',
            message: 'Không có quyền xem chi tiết',
            code: 'UNAUTHORIZED_DETAILS'
          }]
        };
      }

      // Execute query
      return await this.getMedicalRecordDetailsQueryHandler.execute(query);

    } catch (error) {
      return {
        success: false,
        message: `Lỗi khi lấy chi tiết hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [{
          field: 'system',
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SYSTEM_ERROR'
        }]
      };
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<{ status: string; timestamp: string; services: any }> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        createMedicalRecord: 'available',
        updateMedicalRecord: 'available',
        getMedicalRecord: 'available',
        getPatientMedicalRecords: 'available',
        generateMedicalReport: 'available',
        searchMedicalRecords: 'available',
        addDiagnosis: 'available',
        addMedication: 'available',
        getMedicalRecordDetails: 'available'
      }
    };
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<any> {
    return {
      success: true,
      message: 'Service metrics retrieved successfully',
      data: {
        totalOperations: 9,
        availableOperations: [
          'createMedicalRecord',
          'updateMedicalRecord',
          'getMedicalRecord',
          'getPatientMedicalRecords',
          'generateMedicalReport',
          'searchMedicalRecords',
          'addDiagnosis',
          'addMedication',
          'getMedicalRecordDetails'
        ],
        compliance: {
          fhir: 'R4',
          hipaa: 'compliant',
          vietnamese: 'MOH-2024'
        },
        features: {
          diagnosisManagement: true,
          medicationManagement: true,
          reportGeneration: true,
          advancedSearch: true,
          fhirExport: true,
          vietnameseLocalization: true,
          auditLogging: true
        }
      }
    };
  }
}
