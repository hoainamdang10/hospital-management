/**
 * Review Service Domain Events
 * Shared event definitions for cross-service communication
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { DomainEvent } from './DomainEvent';

/**
 * Rating Distribution Interface
 */
export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

/**
 * ReviewCreated Event
 * Published when a new review is created for a staff member
 */
export class ReviewCreatedEvent extends DomainEvent<{
  reviewId: string;
  staffId: string;
  patientId: string;
  rating: number;
  comment?: string;
  appointmentId?: string;
  createdAt: Date;
}> {
  constructor(
    reviewId: string,
    staffId: string,
    patientId: string,
    rating: number,
    comment?: string,
    appointmentId?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'review.created',
      {
        reviewId,
        staffId,
        patientId,
        rating,
        comment,
        appointmentId,
        createdAt: timestamp
      },
      timestamp
    );
  }

  get reviewId(): string {
    return this.data.reviewId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get patientId(): string {
    return this.data.patientId;
  }

  get rating(): number {
    return this.data.rating;
  }

  get comment(): string | undefined {
    return this.data.comment;
  }
}

/**
 * ReviewUpdated Event
 * Published when an existing review is updated
 */
export class ReviewUpdatedEvent extends DomainEvent<{
  reviewId: string;
  staffId: string;
  patientId: string;
  oldRating: number;
  newRating: number;
  comment?: string;
  updatedAt: Date;
}> {
  constructor(
    reviewId: string,
    staffId: string,
    patientId: string,
    oldRating: number,
    newRating: number,
    comment?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'review.updated',
      {
        reviewId,
        staffId,
        patientId,
        oldRating,
        newRating,
        comment,
        updatedAt: timestamp
      },
      timestamp
    );
  }

  get reviewId(): string {
    return this.data.reviewId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get oldRating(): number {
    return this.data.oldRating;
  }

  get newRating(): number {
    return this.data.newRating;
  }
}

/**
 * ReviewDeleted Event
 * Published when a review is deleted
 */
export class ReviewDeletedEvent extends DomainEvent<{
  reviewId: string;
  staffId: string;
  patientId: string;
  rating: number;
  deletedAt: Date;
  deletedBy?: string;
  reason?: string;
}> {
  constructor(
    reviewId: string,
    staffId: string,
    patientId: string,
    rating: number,
    deletedBy?: string,
    reason?: string,
    timestamp: Date = new Date()
  ) {
    super(
      'review.deleted',
      {
        reviewId,
        staffId,
        patientId,
        rating,
        deletedAt: timestamp,
        deletedBy,
        reason
      },
      timestamp
    );
  }

  get reviewId(): string {
    return this.data.reviewId;
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get rating(): number {
    return this.data.rating;
  }
}

/**
 * StaffRatingRecalculated Event
 * Published when staff's aggregate rating is recalculated
 * This is the primary event for updating read models
 */
export class StaffRatingRecalculatedEvent extends DomainEvent<{
  staffId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  lastReviewDate: Date;
  recalculatedAt: Date;
}> {
  constructor(
    staffId: string,
    averageRating: number,
    totalReviews: number,
    ratingDistribution: RatingDistribution,
    lastReviewDate: Date,
    timestamp: Date = new Date()
  ) {
    super(
      'review.rating.recalculated',
      {
        staffId,
        averageRating,
        totalReviews,
        ratingDistribution,
        lastReviewDate,
        recalculatedAt: timestamp
      },
      timestamp
    );
  }

  get staffId(): string {
    return this.data.staffId;
  }

  get averageRating(): number {
    return this.data.averageRating;
  }

  get totalReviews(): number {
    return this.data.totalReviews;
  }

  get ratingDistribution(): RatingDistribution {
    return this.data.ratingDistribution;
  }

  get lastReviewDate(): Date {
    return this.data.lastReviewDate;
  }
}
