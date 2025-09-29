/**
 * BHYTAPIService - Infrastructure Layer
 * Service for integrating with BHYT (Vietnamese Social Health Insurance) API
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Vietnamese Healthcare Standards, BHYT Integration
 */

import { Insurance } from '../../domain/value-objects/Insurance';
import { Money } from '../../domain/value-objects/Money';

export interface BHYTConfig {
  apiUrl: string;
  username: string;
  password: string;
  hospitalCode: string;
  departmentCode: string;
  environment: 'test' | 'production';
  timeout: number;
}

export interface BHYTCardInfo {
  cardNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  validFrom: string;
  validTo: string;
  beneficiaryType: string;
  regionCode: string;
  regionName: string;
  issuedBy: string;
  coverageLevel: number;
  isActive: boolean;
  remainingBenefit: number;
  usedBenefit: number;
}

export interface BHYTValidationRequest {
  cardNumber: string;
  patientName: string;
  dateOfBirth: string;
  treatmentDate: string;
}

export interface BHYTValidationResponse {
  success: boolean;
  data?: {
    isValid: boolean;
    cardInfo: BHYTCardInfo;
    coverageInfo: {
      coverageLevel: number;
      copaymentRate: number;
      maxBenefit: number;
      remainingBenefit: number;
      benefitPeriod: string;
    };
    warnings: string[];
    restrictions: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface BHYTClaimRequest {
  cardNumber: string;
  patientInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    address: string;
  };
  treatmentInfo: {
    admissionDate: string;
    dischargeDate: string;
    diagnosis: string;
    icdCode: string;
    treatmentResult: string;
  };
  serviceDetails: Array<{
    serviceCode: string;
    serviceName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    isCovered: boolean;
  }>;
  totalAmount: number;
  claimAmount: number;
  hospitalInfo: {
    code: string;
    name: string;
    level: string;
  };
  doctorInfo: {
    code: string;
    name: string;
    specialization: string;
  };
}

export interface BHYTClaimResponse {
  success: boolean;
  data?: {
    claimId: string;
    claimNumber: string;
    status: 'submitted' | 'processing' | 'approved' | 'rejected';
    submittedAt: string;
    expectedProcessingDays: number;
    approvedAmount?: number;
    rejectionReason?: string;
    nextSteps: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * BHYTAPIService
 * Handles integration with Vietnamese BHYT system
 */
export class BHYTAPIService {
  private readonly config: BHYTConfig;
  private authToken?: string;
  private tokenExpiry?: Date;

  constructor(config: BHYTConfig) {
    this.config = config;
  }

  /**
   * Validate BHYT card
   */
  async validateCard(request: BHYTValidationRequest): Promise<BHYTValidationResponse> {
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

      // Call BHYT API
      const response = await this.callBHYTAPI('/api/card/validate', {
        method: 'POST',
        body: JSON.stringify({
          cardNumber: request.cardNumber,
          patientName: request.patientName,
          dateOfBirth: request.dateOfBirth,
          treatmentDate: request.treatmentDate,
          hospitalCode: this.config.hospitalCode
        })
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHYT_API_ERROR',
            message: response.errorMessage || 'Lỗi từ hệ thống BHYT',
            details: response
          }
        };
      }

      // Process response
      const cardInfo = this.mapCardInfo(response.data);
      const coverageInfo = this.calculateCoverage(cardInfo, request);

      return {
        success: true,
        data: {
          isValid: response.data.isValid,
          cardInfo,
          coverageInfo,
          warnings: this.generateWarnings(cardInfo),
          restrictions: this.generateRestrictions(cardInfo)
        }
      };

    } catch (error) {
      console.error('BHYTAPIService validateCard error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi xác thực thẻ BHYT'
        }
      };
    }
  }

  /**
   * Submit insurance claim
   */
  async submitClaim(request: BHYTClaimRequest): Promise<BHYTClaimResponse> {
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
        departmentCode: this.config.departmentCode,
        submissionDate: new Date().toISOString(),
        claimType: 'outpatient' // or 'inpatient' based on treatment
      };

      // Call BHYT API
      const response = await this.callBHYTAPI('/api/claim/submit', {
        method: 'POST',
        body: JSON.stringify(claimData)
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHYT_CLAIM_ERROR',
            message: response.errorMessage || 'Lỗi khi gửi yêu cầu bồi thường BHYT',
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
          expectedProcessingDays: response.data.expectedProcessingDays || 15,
          nextSteps: this.generateNextSteps(response.data.status)
        }
      };

    } catch (error) {
      console.error('BHYTAPIService submitClaim error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi gửi yêu cầu bồi thường BHYT'
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
      processedAt?: string;
      approvedAmount?: number;
      rejectionReason?: string;
      processingHistory: Array<{
        status: string;
        timestamp: string;
        note?: string;
      }>;
    };
    error?: { code: string; message: string };
  }> {
    try {
      await this.ensureAuthenticated();

      const response = await this.callBHYTAPI(`/api/claim/status/${claimId}`, {
        method: 'GET'
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHYT_API_ERROR',
            message: response.errorMessage || 'Lỗi khi lấy trạng thái yêu cầu bồi thường'
          }
        };
      }

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('BHYTAPIService getClaimStatus error:', error);
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
   * Get service coverage information
   */
  async getServiceCoverage(serviceCode: string, cardNumber: string): Promise<{
    success: boolean;
    data?: {
      serviceCode: string;
      serviceName: string;
      isCovered: boolean;
      coverageLevel: number;
      maxAmount?: number;
      copaymentRate: number;
      restrictions: string[];
    };
    error?: { code: string; message: string };
  }> {
    try {
      await this.ensureAuthenticated();

      const response = await this.callBHYTAPI('/api/service/coverage', {
        method: 'POST',
        body: JSON.stringify({
          serviceCode,
          cardNumber,
          hospitalCode: this.config.hospitalCode
        })
      });

      if (!response.success) {
        return {
          success: false,
          error: {
            code: response.errorCode || 'BHYT_API_ERROR',
            message: response.errorMessage || 'Lỗi khi lấy thông tin bảo hiểm dịch vụ'
          }
        };
      }

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('BHYTAPIService getServiceCoverage error:', error);
      return {
        success: false,
        error: {
          code: 'SYSTEM_ERROR',
          message: 'Lỗi hệ thống khi lấy thông tin bảo hiểm dịch vụ'
        }
      };
    }
  }

  /**
   * Authenticate with BHYT system
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

      console.error('BHYT authentication failed:', data);
      return false;

    } catch (error) {
      console.error('BHYT authentication error:', error);
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
        throw new Error('Không thể xác thực với hệ thống BHYT');
      }
    }
  }

  /**
   * Call BHYT API with authentication
   */
  private async callBHYTAPI(endpoint: string, options: RequestInit): Promise<any> {
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
   * Validate card validation request
   */
  private validateRequest(request: BHYTValidationRequest): string | null {
    if (!request.cardNumber || !/^HS\d{13}$/.test(request.cardNumber)) {
      return 'Số thẻ BHYT không đúng định dạng';
    }

    if (!request.patientName) {
      return 'Tên bệnh nhân không được để trống';
    }

    if (!request.dateOfBirth) {
      return 'Ngày sinh không được để trống';
    }

    if (!request.treatmentDate) {
      return 'Ngày khám không được để trống';
    }

    return null;
  }

  /**
   * Validate claim request
   */
  private validateClaimRequest(request: BHYTClaimRequest): string | null {
    if (!request.cardNumber) {
      return 'Số thẻ BHYT không được để trống';
    }

    if (!request.patientInfo.fullName) {
      return 'Tên bệnh nhân không được để trống';
    }

    if (!request.treatmentInfo.diagnosis) {
      return 'Chẩn đoán không được để trống';
    }

    if (!request.serviceDetails || request.serviceDetails.length === 0) {
      return 'Chi tiết dịch vụ không được để trống';
    }

    if (request.totalAmount <= 0) {
      return 'Tổng tiền phải lớn hơn 0';
    }

    return null;
  }

  /**
   * Map BHYT API response to card info
   */
  private mapCardInfo(data: any): BHYTCardInfo {
    return {
      cardNumber: data.cardNumber,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address,
      validFrom: data.validFrom,
      validTo: data.validTo,
      beneficiaryType: data.beneficiaryType,
      regionCode: data.regionCode,
      regionName: data.regionName,
      issuedBy: data.issuedBy,
      coverageLevel: data.coverageLevel,
      isActive: data.isActive,
      remainingBenefit: data.remainingBenefit,
      usedBenefit: data.usedBenefit
    };
  }

  /**
   * Calculate coverage information
   */
  private calculateCoverage(cardInfo: BHYTCardInfo, request: BHYTValidationRequest): any {
    return {
      coverageLevel: cardInfo.coverageLevel,
      copaymentRate: 100 - cardInfo.coverageLevel,
      maxBenefit: cardInfo.remainingBenefit,
      remainingBenefit: cardInfo.remainingBenefit,
      benefitPeriod: `${new Date(cardInfo.validFrom).getFullYear()}`
    };
  }

  /**
   * Generate warnings for card
   */
  private generateWarnings(cardInfo: BHYTCardInfo): string[] {
    const warnings: string[] = [];

    const validTo = new Date(cardInfo.validTo);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      warnings.push(`Thẻ BHYT sắp hết hạn trong ${daysUntilExpiry} ngày`);
    }

    if (validTo <= now) {
      warnings.push('Thẻ BHYT đã hết hạn');
    }

    if (cardInfo.remainingBenefit < 1000000) {
      warnings.push('Hạn mức bảo hiểm còn lại thấp');
    }

    return warnings;
  }

  /**
   * Generate restrictions for card
   */
  private generateRestrictions(cardInfo: BHYTCardInfo): string[] {
    const restrictions: string[] = [];

    if (!cardInfo.isActive) {
      restrictions.push('Thẻ BHYT không còn hiệu lực');
    }

    // Add more restrictions based on beneficiary type, region, etc.

    return restrictions;
  }

  /**
   * Generate next steps for claim
   */
  private generateNextSteps(status: string): string[] {
    switch (status) {
      case 'submitted':
        return [
          'Chờ hệ thống BHYT xử lý',
          'Thời gian xử lý dự kiến: 15 ngày làm việc',
          'Có thể kiểm tra trạng thái qua hệ thống'
        ];
      case 'processing':
        return [
          'Yêu cầu đang được xử lý',
          'Chuẩn bị thêm giấy tờ nếu cần thiết',
          'Theo dõi thông báo từ BHYT'
        ];
      default:
        return ['Liên hệ bộ phận BHYT để biết thêm chi tiết'];
    }
  }
}
