/**
 * ReviewEventHandler - Handle Review Service Events
 * Provider/Staff Service V2
 * 
 * Handles review-related events from Review Service
 * Updates StaffReadModel with rating data (CQRS pattern)
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import {
  ReviewCreatedEvent,
  ReviewUpdatedEvent,
  ReviewDeletedEvent,
  StaffRatingRecalculatedEvent,
  RatingDistribution
} from '@shared/domain/events/review.events';
import { IStaffReadModelRepository } from '../repositories/StaffReadModelRepository';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';

/**
 * Handler for Review Service Events
 * Updates read model only, does NOT modify domain aggregate
 */
export class ReviewEventHandler {
  // Idempotency tracking
  private processedEvents: Set<string> = new Set();
  private readonly maxProcessedEvents = 10000;

  constructor(
    private readModelRepository: IStaffReadModelRepository,
    private logger: ILogger,
    private auditService: IAuditService
  ) {}

  /**
   * Handle ReviewCreated event
   * Recalculates rating incrementally
   */
  async handleReviewCreated(event: ReviewCreatedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info('ReviewCreated event already processed, skipping', {
          eventId: event.eventId,
          staffId: event.staffId
        });
        return;
      }

      this.logger.info('Handling ReviewCreated event from Review Service', {
        reviewId: event.reviewId,
        staffId: event.staffId,
        rating: event.rating,
        eventId: event.eventId
      });

      // Get current read model
      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found, cannot update rating', {
          staffId: event.staffId,
          reviewId: event.reviewId
        });
        return;
      }

      // Calculate new rating incrementally
      const newTotalReviews = readModel.totalReviews + 1;
      const newAverageRating = (
        (readModel.averageRating * readModel.totalReviews + event.rating) / 
        newTotalReviews
      );

      // Update rating distribution
      const newDistribution: RatingDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.rating as keyof RatingDistribution]++;

      // Update read model
      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        totalReviews: newTotalReviews,
        ratingDistribution: newDistribution,
        lastReviewDate: event.timestamp
      });

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: 'UPDATE_RATING',
        resourceType: 'STAFF_READ_MODEL',
        resourceId: event.staffId,
        userId: event.data.patientId,
        timestamp: new Date(),
        details: {
          eventType: 'REVIEW_CREATED',
          reviewId: event.reviewId,
          rating: event.rating,
          newAverageRating: newAverageRating.toFixed(2),
          newTotalReviews
        }
      });

      this.logger.info('ReviewCreated event processed successfully', {
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2),
        newTotalReviews,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle ReviewCreated event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle ReviewUpdated event
   * Recalculates rating when review is modified
   */
  async handleReviewUpdated(event: ReviewUpdatedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info('ReviewUpdated event already processed, skipping', {
          eventId: event.eventId,
          staffId: event.staffId
        });
        return;
      }

      this.logger.info('Handling ReviewUpdated event from Review Service', {
        reviewId: event.reviewId,
        staffId: event.staffId,
        oldRating: event.oldRating,
        newRating: event.newRating,
        eventId: event.eventId
      });

      // Get current read model
      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found, cannot update rating', {
          staffId: event.staffId,
          reviewId: event.reviewId
        });
        return;
      }

      // Calculate new rating (remove old, add new)
      const totalRatingPoints = readModel.averageRating * readModel.totalReviews;
      const newTotalRatingPoints = totalRatingPoints - event.oldRating + event.newRating;
      const newAverageRating = newTotalRatingPoints / readModel.totalReviews;

      // Update rating distribution
      const newDistribution: RatingDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.oldRating as keyof RatingDistribution]--;
      newDistribution[event.newRating as keyof RatingDistribution]++;

      // Update read model
      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        ratingDistribution: newDistribution,
        lastReviewDate: event.timestamp
      });

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: 'UPDATE_RATING',
        resourceType: 'STAFF_READ_MODEL',
        resourceId: event.staffId,
        userId: event.data.patientId,
        timestamp: new Date(),
        details: {
          eventType: 'REVIEW_UPDATED',
          reviewId: event.reviewId,
          oldRating: event.oldRating,
          newRating: event.newRating,
          newAverageRating: newAverageRating.toFixed(2)
        }
      });

      this.logger.info('ReviewUpdated event processed successfully', {
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2),
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle ReviewUpdated event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle ReviewDeleted event
   * Recalculates rating when review is removed
   */
  async handleReviewDeleted(event: ReviewDeletedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info('ReviewDeleted event already processed, skipping', {
          eventId: event.eventId,
          staffId: event.staffId
        });
        return;
      }

      this.logger.info('Handling ReviewDeleted event from Review Service', {
        reviewId: event.reviewId,
        staffId: event.staffId,
        rating: event.rating,
        eventId: event.eventId
      });

      // Get current read model
      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found, cannot update rating', {
          staffId: event.staffId,
          reviewId: event.reviewId
        });
        return;
      }

      // Calculate new rating (remove deleted review)
      const newTotalReviews = Math.max(0, readModel.totalReviews - 1);
      let newAverageRating = 0;

      if (newTotalReviews > 0) {
        const totalRatingPoints = readModel.averageRating * readModel.totalReviews;
        const newTotalRatingPoints = totalRatingPoints - event.rating;
        newAverageRating = newTotalRatingPoints / newTotalReviews;
      }

      // Update rating distribution
      const newDistribution: RatingDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.rating as keyof RatingDistribution] = Math.max(
        0,
        newDistribution[event.rating as keyof RatingDistribution] - 1
      );

      // Update read model
      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        totalReviews: newTotalReviews,
        ratingDistribution: newDistribution,
        lastReviewDate: newTotalReviews > 0 && readModel.lastReviewDate ? readModel.lastReviewDate : undefined
      });

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: 'UPDATE_RATING',
        resourceType: 'STAFF_READ_MODEL',
        resourceId: event.staffId,
        userId: event.data.deletedBy || 'SYSTEM',
        timestamp: new Date(),
        details: {
          eventType: 'REVIEW_DELETED',
          reviewId: event.reviewId,
          deletedRating: event.rating,
          newAverageRating: newAverageRating.toFixed(2),
          newTotalReviews,
          reason: event.data.reason
        }
      });

      this.logger.info('ReviewDeleted event processed successfully', {
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2),
        newTotalReviews,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle ReviewDeleted event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Handle StaffRatingRecalculated event
   * Primary event for syncing rating data (most reliable)
   */
  async handleStaffRatingRecalculated(event: StaffRatingRecalculatedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info('StaffRatingRecalculated event already processed, skipping', {
          eventId: event.eventId,
          staffId: event.staffId
        });
        return;
      }

      this.logger.info('Handling StaffRatingRecalculated event from Review Service', {
        staffId: event.staffId,
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        eventId: event.eventId
      });

      // Direct update with authoritative data from Review Service
      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        ratingDistribution: event.ratingDistribution,
        lastReviewDate: event.lastReviewDate
      });

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: 'SYNC_RATING',
        resourceType: 'STAFF_READ_MODEL',
        resourceId: event.staffId,
        userId: 'REVIEW_SERVICE',
        timestamp: new Date(),
        details: {
          eventType: 'STAFF_RATING_RECALCULATED',
          averageRating: event.averageRating,
          totalReviews: event.totalReviews,
          ratingDistribution: event.ratingDistribution
        }
      });

      this.logger.info('StaffRatingRecalculated event processed successfully', {
        staffId: event.staffId,
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        eventId: event.eventId
      });

    } catch (error) {
      this.logger.error('Failed to handle StaffRatingRecalculated event', {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Idempotency: Check if event already processed
   */
  private isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Idempotency: Mark event as processed
   */
  private markEventProcessed(eventId: string): void {
    this.processedEvents.add(eventId);

    // Prevent memory leak: remove oldest events if set grows too large
    if (this.processedEvents.size > this.maxProcessedEvents) {
      const iterator = this.processedEvents.values();
      const firstValue = iterator.next().value;
      if (firstValue) {
        this.processedEvents.delete(firstValue);
      }
    }
  }

  /**
   * Get handler name for logging
   */
  getHandlerName(): string {
    return 'ReviewEventHandler';
  }
}
