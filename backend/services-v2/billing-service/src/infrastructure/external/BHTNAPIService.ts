/**
 * BHTNAPIService - Infrastructure Layer
 * Service for integrating with BHTN (Vietnamese Work Accident Insurance) API
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards, BHTN Integration
 */

import { Insurance } from '../../domain/value-objects/Insurance';
import { Money } from '../../domain/value-objects/Money';

export interface BHTNConfig {
  apiUrl: string;
  username: string;
  password: string;
  hospitalCode: string;
  environment: 'test' | 'production';
  timeout: number;
}

export interface BHTNAccidentInfo {
  accidentId: string;
  accidentDate: string;
  accidentType: 'work_accident' | 'traffic_accident' | 'occupational_disease' | 'other';
  accidentLocation: string;
  accidentDescription: string;
  employerInfo: {
    companyName: string;
    companyCode: string;
    contactPerson: string;
    contactPhone: string;
  };
  victimInfo: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    position: string;
    workingYears: number;
  };
  insuranceInfo: {
    policyNumber: string;
    validFrom: string;
    validTo: string;
    coverageAmount: number;
  };
  status: 'reported' | 'investigating' | 'approved' | 'rejected' | 'closed';
}

export interface BHTNValidationRequest {
  policyNumber: string;
  victimName: string;
  dateOfBirth: string;
  accidentDate: string;
  accidentType: string;
  employerCode?: string;
}

export interface BHTNValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    accidentInfo: BHTNAccidentInfo;
    coverageInfo: {
      maxCoverage: number;
      usedAmount: number;
      remainingAmount: number;
      coverageTypes: string[];
    };
    approvalStatus: {
      isApproved: boolean;
      approvalDate?: string;
      approvalNumber?: string;
      restrictions: string[];
    };
    warnings: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BHTNClaimRequest {
  policyNumber: string;
  accidentId: string;
  patientInfo: {
    fullName: string;
    dateOfBirth: string;
    idNumber: string;
    address: string;
    phone: string;
  };
  accidentDetails: {
    accidentDate: string;
    accidentType: string;
    accidentLocation: string;
    accidentDescription: string;
    policeReportNumber?: string;
    witnessInfo?: string;
  };
  treatmentInfo: {
    admissionDate: string;
    dischargeDate?: string;
    diagnosis: string;
    treatmentType: 'outpatient' | 'inpatient' | 'emergency';
    treatmentResult: string;
    disability?: {
      level: number;
      description: string;
      permanentDisability: boolean;
    };
  };
  medicalExpenses: Array<{
    category: 'medical_treatment' | 'rehabilitation' | 'prosthetics' | 'transportation' | 'other';
    description: string;
    amount: number;
    receiptNumber: string;
    date: string;
  }>;
  totalClaimAmount: number;
  supportingDocuments: string[];
}

export interface BHTNClaimResponse {
  success: boolean;
  data?: {
    claimId: string;
    claimNumber: string;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'requires_additional_info';
    submittedAt: string;
    expectedProcessingDays: number;
    approvedAmount?: number;
    rejectionReason?: string;
    additionalInfoRequired?: string[];
    nextReviewDate?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * BHTNAPIService
 * Handles integration with Vietnamese BHTN system
 */
export class BHTNAPIService {
  private readonly config: BHTNConfig;
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(config: BHTNConfig) {
    this.config = config;
  }

  /**
   * Validate BHTN policy and accident
   */
  async validatePolicy(request: BHTNValidationRequest): Promise<BHTNValidationResponse> {
    try {
      // Ensure authentication
      await this.ensureAuthenticated();

      // Validate request
      const validationError = this.validateRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError
          }
        };
      }

      // Call BHTN API
      const response = await this.callBHTNAPI('/api/policy/validate', {
        method: 'POST',
        body: JSON.stringify({
          policyNumber: request.policyNumber,
          victimName: request.victimName,
          dateOfBirth: request.dateOfBirth,
          accidentDate: request.accidentDate,
          accidentType: request.accidentType,
          employerCode: request.employerCode,
          hospitalCode: this.config.hospitalCode
        })
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHTN_API_ERROR',
            message: response.errorMessage || 'Lỗi từ hệ thống BHTN',
            details: response
          }
        };
      }

      // Process response
      const accidentInfo = this.mapAccidentInfo(response.data);
      const coverageInfo = this.calculateCoverage(accidentInfo);
      const approvalStatus = this.checkApprovalStatus(response.data);

      return {
        success: true,
        data: {
          isValid: response.data.isValid,
          accidentInfo,
          coverageInfo,
          approvalStatus,
          warnings: this.generateWarnings(accidentInfo, approvalStatus)
        }
      };

    } catch (error) {
      console.error('BHTNAPIService validatePolicy error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi xác thực bảo hiểm BHTN'
        }
      };
    }
  }

  /**
   * Submit BHTN claim
   */
  async submitClaim(request: BHTNClaimRequest): Promise<BHTNClaimResponse> {
    try {
      // Ensure authentication
      await this.ensureAuthenticated();

      // Validate claim request
      const validationError = this.validateClaimRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validationError
          }
        };
      }

      // Prepare claim data
      const claimData = {
        ...request,
        hospitalCode: this.config.hospitalCode,
        submissionDate: new Date().toISOString(),
        claimType: this.determineClaimType(request)
      };

      // Call BHTN API
      const response = await this.callBHTNAPI('/api/claim/submit', {
        method: 'POST',
        body: JSON.stringify(claimData)
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHTN_CLAIM_ERROR',
            message: response.errorMessage || 'Lỗi khi gửi yêu cầu bồi thường BHTN',
            details: response
          }
        };
      }

      return {
        success: true,
        data: {
          claimId: response.data.claimId,
          claimNumber: response.data.claimNumber,
          status: response.data.status,
          submittedAt: response.data.submittedAt,
          expectedProcessingDays: response.data.expectedProcessingDays || 30,
          additionalInfoRequired: response.data.additionalInfoRequired,
          nextReviewDate: response.data.nextReviewDate
        }
      };

    } catch (error) {
      console.error('BHTNAPIService submitClaim error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi gửi yêu cầu bồi thường BHTN'
        }
      };
    }
  }

  /**
   * Get claim status
   */
  async getClaimStatus(claimId: string): Promise<{
    success: boolean;
    data?: {
      claimId: string;
      claimNumber: string;
      status: string;
      submittedAt: string;
      lastUpdated: string;
      approvedAmount?: number;
      paidAmount?: number;
      rejectionReason?: string;
      investigationNotes?: string;
      processingHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
        officer?: string;
      }>;
      nextSteps: string[];
    };
    error?: { code: string; message: string };
  }> {
    try {
      await this.ensureAuthenticated();

      const response = await this.callBHTNAPI(`/api/claim/status/${claimId}`, {
        method: 'GET'
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHTN_API_ERROR',
            message: response.errorMessage || 'Lỗi khi lấy trạng thái yêu cầu bồi thường'
          }
        };
      }

      return {
        success: true,
        data: {
          ...response.data,
          nextSteps: this.generateNextSteps(response.data.status)
        }
      };

    } catch (error) {
      console.error('BHTNAPIService getClaimStatus error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi lấy trạng thái yêu cầu bồi thường'
        }
      };
    }
  }

  /**
   * Get accident report
   */
  async getAccidentReport(accidentId: string): Promise<{
    success: boolean;
    data?: BHTNAccidentInfo;
    error?: { code: string; message: string };
  }> {
    try {
      await this.ensureAuthenticated();

      const response = await this.callBHTNAPI(`/api/accident/report/${accidentId}`, {
        method: 'GET'
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHTN_API_ERROR',
            message: response.errorMessage || 'Lỗi khi lấy báo cáo tai nạn'
          }
        };
      }

      return {
        success: true,
        data: this.mapAccidentInfo(response.data)
      };

    } catch (error) {
      console.error('BHTNAPIService getAccidentReport error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi lấy báo cáo tai nạn'
        }
      };
    }
  }

  /**
   * Authenticate with BHTN system
   */
  private async authenticate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.password,
          hospitalCode: this.config.hospitalCode
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.authToken = data.token;
        this.tokenExpiry = new Date(Date.now() + (data.expiresIn * 1000));
        return true;
      }

      console.error('BHTN authentication failed:', data);
      return false;

    } catch (error) {
      console.error('BHTN authentication error:', error);
      return false;
    }
  }

  /**
   * Ensure authentication token is valid
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.authToken || !this.tokenExpiry || this.tokenExpiry <= new Date()) {
      const success = await this.authenticate();
      if (!success) {
        throw new Error('Không thể xác thực với hệ thống BHTN');
      }
    }
  }

  /**
   * Call BHTN API with authentication
   */
  private async callBHTNAPI(endpoint: string, options: RequestInit): Promise<any> {
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    return await response.json();
  }

  /**
   * Validate policy validation request
   */
  private validateRequest(request: BHTNValidationRequest): string | null {
    if (!request.policyNumber || !/^TN\d{13}$/.test(request.policyNumber)) {
      return 'Số bảo hiểm BHTN không đúng định dạng';
    }

    if (!request.victimName) {
      return 'Tên nạn nhân không được để trống';
    }

    if (!request.dateOfBirth) {
      return 'Ngày sinh không được để trống';
    }

    if (!request.accidentDate) {
      return 'Ngày tai nạn không được để trống';
    }

    if (!request.accidentType) {
      return 'Loại tai nạn không được để trống';
    }

    return null;
  }

  /**
   * Validate claim request
   */
  private validateClaimRequest(request: BHTNClaimRequest): string | null {
    if (!request.policyNumber) {
      return 'Số bảo hiểm BHTN không được để trống';
    }

    if (!request.accidentId) {
      return 'Mã tai nạn không được để trống';
    }

    if (!request.patientInfo.fullName) {
      return 'Tên bệnh nhân không được để trống';
    }

    if (!request.accidentDetails.accidentDate) {
      return 'Ngày tai nạn không được để trống';
    }

    if (!request.treatmentInfo.diagnosis) {
      return 'Chẩn đoán không được để trống';
    }

    if (!request.medicalExpenses || request.medicalExpenses.length === 0) {
      return 'Chi phí y tế không được để trống';
    }

    if (request.totalClaimAmount <= 0) {
      return 'Tổng tiền yêu cầu bồi thường phải lớn hơn 0';
    }

    return null;
  }

  /**
   * Map BHTN API response to accident info
   */
  private mapAccidentInfo(data: any): BHTNAccidentInfo {
    return {
      accidentId: data.accidentId,
      accidentDate: data.accidentDate,
      accidentType: data.accidentType,
      accidentLocation: data.accidentLocation,
      accidentDescription: data.accidentDescription,
      employerInfo: data.employerInfo,
      victimInfo: data.victimInfo,
      insuranceInfo: data.insuranceInfo,
      status: data.status
    };
  }

  /**
   * Calculate coverage information
   */
  private calculateCoverage(accidentInfo: BHTNAccidentInfo): any {
    return {
      maxCoverage: accidentInfo.insuranceInfo.coverageAmount,
      usedAmount: 0, // Would be calculated from previous claims
      remainingAmount: accidentInfo.insuranceInfo.coverageAmount,
      coverageTypes: this.getCoverageTypes(accidentInfo.accidentType)
    };
  }

  /**
   * Check approval status
   */
  private checkApprovalStatus(data: any): any {
    return {
      isApproved: data.approvalStatus?.isApproved || false,
      approvalDate: data.approvalStatus?.approvalDate,
      approvalNumber: data.approvalStatus?.approvalNumber,
      restrictions: data.approvalStatus?.restrictions || []
    };
  }

  /**
   * Generate warnings
   */
  private generateWarnings(accidentInfo: BHTNAccidentInfo, approvalStatus: any): string[] {
    const warnings: string[] = [];

    if (!approvalStatus.isApproved) {
      warnings.push('Tai nạn chưa được phê duyệt bồi thường');
    }

    const accidentDate = new Date(accidentInfo.accidentDate);
    const daysSinceAccident = Math.floor((Date.now() - accidentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceAccident > 365) {
      warnings.push('Tai nạn đã xảy ra hơn 1 năm, có thể ảnh hưởng đến việc bồi thường');
    }

    return warnings;
  }

  /**
   * Get coverage types based on accident type
   */
  private getCoverageTypes(accidentType: string): string[] {
    switch (accidentType) {
      case 'work_accident':
        return ['Chi phí y tế', 'Trợ cấp thương tật', 'Phục hồi chức năng'];
      case 'traffic_accident':
        return ['Chi phí y tế', 'Trợ cấp thương tật'];
      case 'occupational_disease':
        return ['Chi phí y tế', 'Điều trị dài hạn', 'Phục hồi chức năng'];
      default:
        return ['Chi phí y tế'];
    }
  }

  /**
   * Determine claim type
   */
  private determineClaimType(request: BHTNClaimRequest): string {
    if (request.treatmentInfo.disability) {
      return 'disability_claim';
    }
    
    if (request.treatmentInfo.treatmentType === 'inpatient') {
      return 'inpatient_claim';
    }

    return 'medical_expense_claim';
  }

  /**
   * Generate next steps based on status
   */
  private generateNextSteps(status: string): string[] {
    switch (status) {
      case 'submitted':
        return [
          'Chờ hệ thống BHTN xem xét hồ sơ',
          'Thời gian xử lý dự kiến: 30 ngày làm việc',
          'Chuẩn bị thêm giấy tờ nếu được yêu cầu'
        ];
      case 'under_review':
        return [
          'Hồ sơ đang được điều tra và xem xét',
          'Có thể được yêu cầu cung cấp thêm thông tin',
          'Theo dõi thông báo từ BHTN'
        ];
      case 'requires_additional_info':
        return [
          'Cung cấp thêm thông tin theo yêu cầu',
          'Nộp bổ sung giấy tờ trong thời hạn quy định',
          'Liên hệ với cán bộ phụ trách'
        ];
      case 'approved':
        return [
          'Yêu cầu đã được phê duyệt',
          'Chờ thanh toán từ BHTN',
          'Theo dõi tiến độ thanh toán'
        ];
      case 'rejected':
        return [
          'Xem xét lý do từ chối',
          'Có thể khiếu nại nếu không đồng ý',
          'Chuẩn bị hồ sơ khiếu nại'
        ];
      default:
        return ['Liên hệ bộ phận BHTN để biết thêm chi tiết'];
    }
  }
}
