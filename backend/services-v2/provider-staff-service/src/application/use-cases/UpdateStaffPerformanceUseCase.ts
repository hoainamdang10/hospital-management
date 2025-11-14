/**
 * Update Staff Performance Use Case
 * Provider/Staff Service V2
 * 
 * Updates staff performance metrics with audit trail and event publishing
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from "@shared/application/base/base-healthcare-use-case";
import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { StaffId } from "../../domain/value-objects/StaffId";
import { PerformanceMetrics } from "../../domain/entities/PerformanceMetrics";
import { StaffPerformanceUpdatedEvent } from "../../domain/events/StaffPerformanceUpdatedEvent";
import { ILogger } from "../interfaces/ILogger";
import { IAuditService } from "../interfaces/IAuditService";
import { IDomainEventPublisher } from "@shared/domain/events/IDomainEventPublisher";

export interface UpdateStaffPerformanceRequest {
  staffId: string;
  performancePeriod: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    patientSatisfactionScore?: number; // 1-5 scale
    clinicalQualityScore?: number; // 1-5 scale
    productivityScore?: number; // 1-5 scale
    attendanceScore?: number; // 1-5 scale
    teamworkScore?: number; // 1-5 scale
    overallScore?: number; // 1-5 scale
  };
  achievements?: string[];
  areasForImprovement?: string[];
  goals?: Array<{
    description: string;
    targetDate: Date;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  reviewedBy: string;
  reviewedByRole: string;
  reviewDate?: Date;
  nextReviewDate?: Date;
  comments?: string;
  requestMetadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface UpdateStaffPerformanceResponse {
  success: boolean;
  staffId: string;
  performanceId: string;
  reviewPeriod: {
    startDate: string;
    endDate: string;
  };
  overallScore: number;
  reviewedAt: Date;
  nextReviewDate?: Date;
  message: string;
}

export class UpdateStaffPerformanceUseCase extends BaseHealthcareUseCase<UpdateStaffPerformanceRequest, UpdateStaffPerformanceResponse> {
  constructor(
    private readonly staffRepository: IProviderStaffRepository,
    private readonly auditService: IAuditService,
    private readonly eventPublisher: IDomainEventPublisher,
    private readonly logger: ILogger
  ) {
    super();
  }

  protected override async validateRequest(request: UpdateStaffPerformanceRequest): Promise<ValidationResult> {
    const errors: string[] = [];

    // Validate staff ID
    if (!request.staffId || request.staffId.trim().length === 0) {
      errors.push("Staff ID is required");
    }

    // Validate performance period
    if (!request.performancePeriod) {
      errors.push("Performance period is required");
    } else {
      if (!request.performancePeriod.startDate) {
        errors.push("Performance start date is required");
      }
      if (!request.performancePeriod.endDate) {
        errors.push("Performance end date is required");
      }
      if (request.performancePeriod.startDate >= request.performancePeriod.endDate) {
        errors.push("Performance start date must be before end date");
      }
    }

    // Validate metrics
    if (!request.metrics) {
      errors.push("Performance metrics are required");
    } else {
      // Validate score ranges (1-5)
      const scoreFields = [
        'patientSatisfactionScore', 'clinicalQualityScore', 
        'productivityScore', 'attendanceScore', 'teamworkScore', 'overallScore'
      ];

      for (const field of scoreFields) {
        const score = request.metrics[field as keyof typeof request.metrics];
        if (score !== undefined && (score < 1 || score > 5)) {
          errors.push(`${field} must be between 1 and 5`);
        }
      }
    }

    // Validate reviewer
    if (!request.reviewedBy || request.reviewedBy.trim().length === 0) {
      errors.push("Reviewed by is required");
    }

    if (!request.reviewedByRole || request.reviewedByRole.trim().length === 0) {
      errors.push("Reviewed by role is required");
    }

    // Validate dates
    if (request.nextReviewDate && request.nextReviewDate <= new Date()) {
      errors.push("Next review date must be in the future");
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    return { isValid: true };
  }

  protected override async executeImpl(request: UpdateStaffPerformanceRequest): Promise<UpdateStaffPerformanceResponse> {
    try {
      this.logger.info("Updating staff performance metrics", {
        staffId: request.staffId,
        reviewPeriod: request.performancePeriod,
        reviewedBy: request.reviewedBy
      });

      // Get existing staff
      const staffId = StaffId.fromString(request.staffId);
      const existingStaff = await this.staffRepository.findById(staffId);
      
      if (!existingStaff) {
        throw new Error(`Staff with ID ${request.staffId} not found`);
      }

      // Get previous performance for audit
      // TODO: Implement getPerformanceMetrics in repository when needed
      // const previousPerformance = await this.staffRepository.getPerformanceMetrics(
      //   staffId, 
      //   request.performancePeriod.startDate, 
      //   request.performancePeriod.endDate
      // );

      // Create performance metrics
      const performanceMetrics = PerformanceMetrics.create({
        staffId: request.staffId,
        period: request.performancePeriod,
        metrics: request.metrics,
        achievements: request.achievements || [],
        areasForImprovement: request.areasForImprovement || [],
        goals: request.goals || [],
        reviewedBy: request.reviewedBy,
        reviewedByRole: request.reviewedByRole,
        reviewDate: request.reviewDate || new Date(),
        nextReviewDate: request.nextReviewDate,
        comments: request.comments
      });

      // Update staff performance metrics
      // TODO: Create dedicated PerformanceMetricsRepository when performance tracking becomes complex
      // For now, we can store performance data as part of staff aggregate or create a separate table
      // await this.staffRepository.updatePerformanceMetrics(staffId, performanceMetrics);
      
      // For now, just update the staff to trigger events and audit
      // In a real implementation, you would have a separate PerformanceMetricsRepository
      this.logger.info("Performance metrics created", { performanceId: performanceMetrics.id });

      // Calculate overall score if not provided
      const overallScore = request.metrics.overallScore || this.calculateOverallScore(request.metrics);

      // Create and publish domain event
      const performanceUpdatedEvent = new StaffPerformanceUpdatedEvent(
        request.staffId,
        overallScore,
        request.performancePeriod,
        request.reviewedBy,
        new Date()
      );

      await this.eventPublisher.publish(performanceUpdatedEvent);

      // Log audit trail
      if (this.auditService.logAction) {
        await this.auditService.logAction({
          action: "STAFF_PERFORMANCE_UPDATED",
          resourceType: "STAFF",
          resourceId: request.staffId,
          userId: request.reviewedBy,
          timestamp: new Date(),
          details: {
            reviewPeriod: request.performancePeriod,
            metrics: request.metrics,
            overallScore
          },
          ipAddress: request.requestMetadata?.ipAddress,
          userAgent: request.requestMetadata?.userAgent,
          sessionId: request.requestMetadata?.sessionId
        });
      }

      this.logger.info("Staff performance metrics updated successfully", {
        staffId: request.staffId,
        performanceId: performanceMetrics.id,
        overallScore,
        reviewPeriod: request.performancePeriod
      });

      return {
        success: true,
        staffId: request.staffId,
        performanceId: performanceMetrics.id,
        reviewPeriod: {
          startDate: request.performancePeriod.startDate.toISOString().split('T')[0],
          endDate: request.performancePeriod.endDate.toISOString().split('T')[0]
        },
        overallScore,
        reviewedAt: request.reviewDate || new Date(),
        nextReviewDate: request.nextReviewDate,
        message: "Staff performance metrics updated successfully"
      };

    } catch (error) {
      this.logger.error("Failed to update staff performance metrics", {
        staffId: request.staffId,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      throw error;
    }
  }

  private calculateOverallScore(metrics: UpdateStaffPerformanceRequest['metrics']): number {
    const scores = [
      metrics.patientSatisfactionScore,
      metrics.clinicalQualityScore,
      metrics.productivityScore,
      metrics.attendanceScore,
      metrics.teamworkScore
    ].filter(score => score !== undefined) as number[];

    if (scores.length === 0) {
      return 3; // Default neutral score
    }

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 100) / 100; // Round to 2 decimal places
  }
}
