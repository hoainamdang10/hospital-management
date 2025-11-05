/**
 * GetInsuranceClaimsReportUseCase - Application Layer
 * Use case for generating insurance claims report
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface GetInsuranceClaimsReportRequest {
  dateFrom?: Date;
  dateTo?: Date;
  insuranceType?: string;
  status?: string;
}

export interface GetInsuranceClaimsReportResponse {
  success: boolean;
  data?: {
    period?: {
      from: Date;
      to: Date;
    };
    summary: {
      totalClaims: number;
      totalClaimAmount: number;
      totalApprovedAmount: number;
      totalRejectedAmount: number;
      approvalRate: number;
      averageClaimAmount: number;
      averageApprovedAmount: number;
      currency: string;
    };
    byStatus: {
      submitted: { count: number; amount: number };
      processing: { count: number; amount: number };
      approved: { count: number; amount: number };
      rejected: { count: number; amount: number };
      paid: { count: number; amount: number };
    };
    byInsuranceType: {
      bhyt: { count: number; claimAmount: number; approvedAmount: number };
      bhtn: { count: number; claimAmount: number; approvedAmount: number };
      private: { count: number; claimAmount: number; approvedAmount: number };
    };
    processingTime: {
      averageDays: number;
      fastest: number;
      slowest: number;
    };
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GetInsuranceClaimsReportUseCase extends BaseHealthcareUseCase<GetInsuranceClaimsReportRequest, GetInsuranceClaimsReportResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: GetInsuranceClaimsReportRequest): Promise<GetInsuranceClaimsReportResponse> {
    try {
      this.logger.info('Generating insurance claims report', { 
        dateFrom: request.dateFrom,
        dateTo: request.dateTo,
        insuranceType: request.insuranceType
      });

      // Validate date range if provided
      if (request.dateFrom && request.dateTo && request.dateFrom > request.dateTo) {
        return {
          success: false,
          message: 'Ngày bắt đầu không thể sau ngày kết thúc',
          errors: [{
            field: 'dateRange',
            message: 'Khoảng thời gian không hợp lệ',
            code: 'INVALID_DATE_RANGE'
          }]
        };
      }

      // TODO: Implement repository method findInsuranceClaims()
      const invoicesWithInsurance: any[] = [];

      // Calculate summary
      const summary = this.calculateSummary(invoicesWithInsurance);

      // Calculate by status
      const byStatus = this.calculateByStatus(invoicesWithInsurance);

      // Calculate by insurance type
      const byInsuranceType = this.calculateByInsuranceType(invoicesWithInsurance);

      // Calculate processing time
      const processingTime = this.calculateProcessingTime(invoicesWithInsurance);

      return {
        success: true,
        data: {
          period: request.dateFrom && request.dateTo ? {
            from: request.dateFrom,
            to: request.dateTo
          } : undefined,
          summary,
          byStatus,
          byInsuranceType,
          processingTime
        },
        message: 'Tạo báo cáo bảo hiểm thành công'
      };

    } catch (error) {
      this.logger.error('Error generating insurance claims report', { error, request });
      throw error;
    }
  }

  private calculateSummary(invoices: any[]) {
    const totalClaimAmount = invoices.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0);
    const approvedClaims = invoices.filter(inv => inv.insurance?.claimStatus === 'approved');
    const totalApprovedAmount = approvedClaims.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0);
    const rejectedClaims = invoices.filter(inv => inv.insurance?.claimStatus === 'rejected');
    const totalRejectedAmount = rejectedClaims.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0);

    return {
      totalClaims: invoices.length,
      totalClaimAmount,
      totalApprovedAmount,
      totalRejectedAmount,
      approvalRate: invoices.length > 0 ? (approvedClaims.length / invoices.length) * 100 : 0,
      averageClaimAmount: invoices.length > 0 ? totalClaimAmount / invoices.length : 0,
      averageApprovedAmount: approvedClaims.length > 0 ? totalApprovedAmount / approvedClaims.length : 0,
      currency: 'VND'
    };
  }

  private calculateByStatus(invoices: any[]) {
    const statuses = ['submitted', 'processing', 'approved', 'rejected', 'paid'];
    const result: any = {};

    for (const status of statuses) {
      const filtered = invoices.filter(inv => inv.insurance?.claimStatus === status);
      result[status] = {
        count: filtered.length,
        amount: filtered.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0)
      };
    }

    return result;
  }

  private calculateByInsuranceType(invoices: any[]) {
    const types = ['bhyt', 'bhtn', 'private'];
    const result: any = {};

    for (const type of types) {
      const filtered = invoices.filter(inv => inv.insurance?.type === type);
      const approved = filtered.filter(inv => inv.insurance?.claimStatus === 'approved');
      
      result[type] = {
        count: filtered.length,
        claimAmount: filtered.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0),
        approvedAmount: approved.reduce((sum, inv) => sum + (inv.insurance?.coverageAmount || 0), 0)
      };
    }

    return result;
  }

  private calculateProcessingTime(invoices: any[]) {
    // TODO: Calculate actual processing time from claim submission to approval/rejection
    return {
      averageDays: 0,
      fastest: 0,
      slowest: 0
    };
  }
}

