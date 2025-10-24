/**
 * ReviewEventHandler - Event Handler for Review Service Events
 * Provider/Staff Service V2
 * 
 * Handles domain events from Review Service to update staff read model
 * Implements eventual consistency pattern for CQRS
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Event-Driven Architecture
 */

import { IStaffReadModelRepository } from '../../infrastructure/repositories/StaffReadModelRepository';
import { ILogger } from '../interfaces/ILogger';
import { RatingDistribution } from '../../domain/read-models/StaffReadModel';

export interface ReviewCreatedEvent {
  eventType: 'review.created';
  staffId: string;
  rating: number;
  reviewId: string;
  timestamp: Date;
}

export interface ReviewUpdatedEvent {
  eventType: 'review.updated';
  staffId: string;
  oldRating: number;
  newRating: number;
  reviewId: string;
  timestamp: Date;
}

export interface ReviewDeletedEvent {
  eventType: 'review.deleted';
  staffId: string;
  rating: number;
  reviewId: string;
  timestamp: Date;
}

export interface StaffRatingRecalculatedEvent {
  eventType: 'staff.rating.recalculated';
  staffId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  timestamp: Date;
}

export class ReviewEventHandler {
  constructor(
    private readonly readModelRepository: IStaffReadModelRepository,
    private readonly logger: ILogger
  ) {}

  async handleReviewCreated(event: ReviewCreatedEvent): Promise<void> {
    try {
      this.logger.info('Handling ReviewCreated event', { 
        staffId: event.staffId, 
        reviewId: event.reviewId 
      });

      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found for review event', { 
          staffId: event.staffId 
        });
        return;
      }

      const newTotalReviews = readModel.totalReviews + 1;
      const newAverageRating = (
        (readModel.averageRating * readModel.totalReviews + event.rating) / 
        newTotalReviews
      );

      const newDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.rating as keyof RatingDistribution]++;

      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        totalReviews: newTotalReviews,
        ratingDistribution: newDistribution,
        lastReviewDate: event.timestamp
      });

      this.logger.info('Staff read model updated after review created', { 
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2),
        newTotalReviews
      });
    } catch (error) {
      this.logger.error('Error handling ReviewCreated event', { event, error });
      throw error;
    }
  }

  async handleReviewUpdated(event: ReviewUpdatedEvent): Promise<void> {
    try {
      this.logger.info('Handling ReviewUpdated event', { 
        staffId: event.staffId, 
        reviewId: event.reviewId 
      });

      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found for review event', { 
          staffId: event.staffId 
        });
        return;
      }

      const totalRating = readModel.averageRating * readModel.totalReviews;
      const newTotalRating = totalRating - event.oldRating + event.newRating;
      const newAverageRating = newTotalRating / readModel.totalReviews;

      const newDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.oldRating as keyof RatingDistribution]--;
      newDistribution[event.newRating as keyof RatingDistribution]++;

      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        ratingDistribution: newDistribution,
        lastReviewDate: event.timestamp
      });

      this.logger.info('Staff read model updated after review updated', { 
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2)
      });
    } catch (error) {
      this.logger.error('Error handling ReviewUpdated event', { event, error });
      throw error;
    }
  }

  async handleReviewDeleted(event: ReviewDeletedEvent): Promise<void> {
    try {
      this.logger.info('Handling ReviewDeleted event', { 
        staffId: event.staffId, 
        reviewId: event.reviewId 
      });

      const readModel = await this.readModelRepository.findById(event.staffId);
      
      if (!readModel) {
        this.logger.warn('Staff read model not found for review event', { 
          staffId: event.staffId 
        });
        return;
      }

      const newTotalReviews = Math.max(0, readModel.totalReviews - 1);
      let newAverageRating = 0;

      if (newTotalReviews > 0) {
        const totalRating = readModel.averageRating * readModel.totalReviews;
        const newTotalRating = totalRating - event.rating;
        newAverageRating = newTotalRating / newTotalReviews;
      }

      const newDistribution = { ...readModel.ratingDistribution };
      newDistribution[event.rating as keyof RatingDistribution] = Math.max(
        0, 
        newDistribution[event.rating as keyof RatingDistribution] - 1
      );

      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: parseFloat(newAverageRating.toFixed(2)),
        totalReviews: newTotalReviews,
        ratingDistribution: newDistribution,
        lastReviewDate: event.timestamp
      });

      this.logger.info('Staff read model updated after review deleted', { 
        staffId: event.staffId,
        newAverageRating: newAverageRating.toFixed(2),
        newTotalReviews
      });
    } catch (error) {
      this.logger.error('Error handling ReviewDeleted event', { event, error });
      throw error;
    }
  }

  async handleStaffRatingRecalculated(event: StaffRatingRecalculatedEvent): Promise<void> {
    try {
      this.logger.info('Handling StaffRatingRecalculated event', { 
        staffId: event.staffId 
      });

      await this.readModelRepository.updateRating(event.staffId, {
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        ratingDistribution: event.ratingDistribution,
        lastReviewDate: event.timestamp
      });

      this.logger.info('Staff read model synchronized with recalculated rating', { 
        staffId: event.staffId,
        averageRating: event.averageRating,
        totalReviews: event.totalReviews
      });
    } catch (error) {
      this.logger.error('Error handling StaffRatingRecalculated event', { event, error });
      throw error;
    }
  }
}
