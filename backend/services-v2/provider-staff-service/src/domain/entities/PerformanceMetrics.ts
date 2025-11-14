/**
 * Performance Metrics - Domain Entity
 * Provider/Staff Service V2
 * 
 * Represents staff performance evaluation metrics
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards
 */

import { Entity } from "@shared/domain/base/entity";

// Performance Metrics ID Generator following service pattern
// Format: PERF-{STAFFID}-YYYYMM-XXX
class PerformanceMetricsId {
  public static generate(staffId: string): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const sequence = Math.floor(Math.random() * 999) + 1;
    const sequenceStr = sequence.toString().padStart(3, "0");
    
    // Extract staff ID short version (last 8 chars to keep it reasonable)
    const staffShortId = staffId.slice(-8);
    
    return `PERF-${staffShortId}-${year}${month}-${sequenceStr}`;
  }
}

export interface PerformanceMetricsProps {
  id?: string;
  staffId: string;
  period: {
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
  achievements: string[];
  areasForImprovement: string[];
  goals: Array<{
    description: string;
    targetDate: Date;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  reviewedBy: string;
  reviewedByRole: string;
  reviewDate: Date;
  nextReviewDate?: Date;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PerformanceMetrics extends Entity<PerformanceMetricsProps> {
  private readonly _staffId: string;
  private readonly _period: { startDate: Date; endDate: Date };
  private readonly _metrics: PerformanceMetricsProps['metrics'];
  private readonly _achievements: string[];
  private readonly _areasForImprovement: string[];
  private readonly _goals: PerformanceMetricsProps['goals'];
  private readonly _reviewedBy: string;
  private readonly _reviewedByRole: string;
  private readonly _reviewDate: Date;
  private readonly _nextReviewDate?: Date;
  private readonly _comments?: string;

  constructor(props: PerformanceMetricsProps) {
    super(props, props.id || PerformanceMetricsId.generate(props.staffId));
    this._staffId = props.staffId;
    this._period = props.period;
    this._metrics = props.metrics;
    this._achievements = props.achievements;
    this._areasForImprovement = props.areasForImprovement;
    this._goals = props.goals;
    this._reviewedBy = props.reviewedBy;
    this._reviewedByRole = props.reviewedByRole;
    this._reviewDate = props.reviewDate;
    this._nextReviewDate = props.nextReviewDate;
    this._comments = props.comments;
  }

  static create(props: PerformanceMetricsProps): PerformanceMetrics {
    const now = new Date();
    
    // Validate performance period
    if (props.period.startDate >= props.period.endDate) {
      throw new Error("Performance start date must be before end date");
    }

    // Validate score ranges
    const scoreFields = [
      'patientSatisfactionScore', 'clinicalQualityScore', 
      'productivityScore', 'attendanceScore', 'teamworkScore', 'overallScore'
    ];

    for (const field of scoreFields) {
      const score = props.metrics[field as keyof typeof props.metrics];
      if (score !== undefined && (score < 1 || score > 5)) {
        throw new Error(`${field} must be between 1 and 5`);
      }
    }

    return new PerformanceMetrics({
      ...props,
      id: props.id || PerformanceMetricsId.generate(props.staffId),
      createdAt: props.createdAt || now,
      updatedAt: props.updatedAt || now
    });
  }

  // Getters
  get staffId(): string {
    return this._staffId;
  }

  get period(): { startDate: Date; endDate: Date } {
    return this._period;
  }

  get metrics(): PerformanceMetricsProps['metrics'] {
    return this._metrics;
  }

  get achievements(): string[] {
    return [...this._achievements];
  }

  get areasForImprovement(): string[] {
    return [...this._areasForImprovement];
  }

  get goals(): PerformanceMetricsProps['goals'] {
    return [...this._goals];
  }

  get reviewedBy(): string {
    return this._reviewedBy;
  }

  get reviewedByRole(): string {
    return this._reviewedByRole;
  }

  get reviewDate(): Date {
    return this._reviewDate;
  }

  get nextReviewDate(): Date | undefined {
    return this._nextReviewDate;
  }

  get comments(): string | undefined {
    return this._comments;
  }

  get overallScore(): number {
    return this._metrics.overallScore || this.calculateOverallScore();
  }

  // Business logic methods
  private calculateOverallScore(): number {
    const scores = [
      this._metrics.patientSatisfactionScore,
      this._metrics.clinicalQualityScore,
      this._metrics.productivityScore,
      this._metrics.attendanceScore,
      this._metrics.teamworkScore
    ].filter(score => score !== undefined) as number[];

    if (scores.length === 0) {
      return 3; // Default neutral score
    }

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 100) / 100; // Round to 2 decimal places
  }

  isHighPerformer(): boolean {
    return this.overallScore >= 4.5;
  }

  needsImprovement(): boolean {
    return this.overallScore <= 2.5;
  }

  hasOutstandingAchievements(): boolean {
    return this._achievements.length > 0;
  }

  hasCriticalAreasForImprovement(): boolean {
    return this._areasForImprovement.length > 0;
  }

  isReviewOverdue(): boolean {
    if (!this._nextReviewDate) {
      return false;
    }
    return new Date() > this._nextReviewDate;
  }

  getDaysUntilNextReview(): number {
    if (!this._nextReviewDate) {
      return -1;
    }
    const now = new Date();
    const diffTime = this._nextReviewDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Validation methods
  validate(): void {
    if (!this._staffId || this._staffId.length === 0) {
      throw new Error("Staff ID is required");
    }
    if (!this._period.startDate || !this._period.endDate) {
      throw new Error("Performance period is required");
    }
    if (this._period.startDate >= this._period.endDate) {
      throw new Error("Performance start date must be before end date");
    }
  }

  // Serialization for persistence
  toPersistence(): PerformanceMetricsProps {
    return {
      id: this.id,
      staffId: this._staffId,
      period: this._period,
      metrics: this._metrics,
      achievements: this._achievements,
      areasForImprovement: this._areasForImprovement,
      goals: this._goals,
      reviewedBy: this._reviewedBy,
      reviewedByRole: this._reviewedByRole,
      reviewDate: this._reviewDate,
      nextReviewDate: this._nextReviewDate,
      comments: this._comments,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
