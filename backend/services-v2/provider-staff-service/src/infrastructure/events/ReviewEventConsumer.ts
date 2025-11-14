/**
 * Review Event Consumer - Infrastructure Layer
 * Consumes review events from Review Service
 * Handles staff performance reviews, ratings, and feedback
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { connect, ConsumeMessage, ChannelModel, Channel } from 'amqplib';
import { ILogger } from '../../application/interfaces/ILogger';
import { UpdateStaffPerformanceUseCase } from "../../application/use-cases/UpdateStaffPerformanceUseCase";
import { GetStaffProfileUseCase } from '../../application/use-cases/GetStaffProfileUseCase';

// Helper function to create GetStaffProfileRequest from staffId
function createStaffProfileRequest(staffId: string, requestedBy: string = 'system', requestedByRole: string = 'review-service') {
  return {
    staffId,
    requestedBy,
    requestedByRole,
    includeFullSchedule: false,
    includeSensitiveInfo: false
  };
}

export interface ReviewEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface StaffReviewCreatedEventData {
  reviewId: string;
  staffId: string;
  patientId?: string;
  reviewerId: string;
  reviewerType: 'patient' | 'peer' | 'supervisor' | 'self';
  rating: number;
  maxRating: number;
  categories: {
    communication?: number;
    professionalism?: number;
    clinicalSkills?: number;
    bedsideManner?: number;
    efficiency?: number;
  };
  comment?: string;
  reviewedAt: Date;
  appointmentId?: string;
  departmentId?: string;
  isAnonymous: boolean;
}

export interface StaffReviewUpdatedEventData {
  reviewId: string;
  staffId: string;
  previousRating: number;
  newRating: number;
  maxRating: number;
  updatedCategories?: {
    communication?: number;
    professionalism?: number;
    clinicalSkills?: number;
    bedsideManner?: number;
    efficiency?: number;
  };
  comment?: string;
  updatedAt: Date;
  updatedBy: string;
  updateReason?: string;
}

export interface StaffReviewDeletedEventData {
  reviewId: string;
  staffId: string;
  deletedAt: Date;
  deletedBy: string;
  reason: string;
  previousRating: number;
  maxRating: number;
}

export interface StaffRatingRecalculatedEventData {
  staffId: string;
  previousAverageRating: number;
  newAverageRating: number;
  totalReviews: number;
  ratingBreakdown: {
    communication: number;
    professionalism: number;
    clinicalSkills: number;
    bedsideManner: number;
    efficiency: number;
  };
  recalculatedAt: Date;
  triggeredBy: 'review_added' | 'review_updated' | 'review_removed' | 'manual_recalculation';
}

/**
 * ReviewEventConsumer - Handles review events for staff performance management
 */
export class ReviewEventConsumer {
  private connection?: ChannelModel;
  private channel?: Channel;
  private isConnected = false;

  constructor(
    private config: ReviewEventConsumerConfig,
    private logger: ILogger,
    private getStaffProfileUseCase: GetStaffProfileUseCase,
    private updateStaffPerformanceUseCase: UpdateStaffPerformanceUseCase,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Review events', {
        queueName: this.config.queueName,
      });
      
      this.connection = await connect(this.config.rabbitmqUrl);
      if (!this.connection) {
        throw new Error('Failed to connect to RabbitMQ');
      }
      
      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
        durable: true,
      });

      // Assert queue
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      // Bind queue to routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchangeName,
          routingKey,
        );
        this.logger.info('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info('Review event consumer connected successfully');

      // Handle connection errors
      if (this.connection) {
        this.connection.on('error', (error: Error) => {
          this.logger.error('RabbitMQ connection error', {
            error: error.message,
          });
        });
      }

      if (this.channel) {
        this.channel.on('error', (error: Error) => {
          this.logger.error('RabbitMQ channel error', {
            error: error.message,
          });
        });
      }

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;

      this.logger.debug('Received review event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      switch (routingKey) {
        case 'review.created':
          await this.handleReviewCreated(event.payload as StaffReviewCreatedEventData);
          break;

        case 'review.updated':
          await this.handleReviewUpdated(event.payload as StaffReviewUpdatedEventData);
          break;

        case 'review.deleted':
          await this.handleReviewDeleted(event.payload as StaffReviewDeletedEventData);
          break;

        case 'review.rating.recalculated':
          await this.handleRatingRecalculated(event.payload as StaffRatingRecalculatedEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing review event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle staff review created event
   */
  private async handleReviewCreated(data: StaffReviewCreatedEventData): Promise<void> {
    this.logger.info('Processing staff review creation', {
      reviewId: data.reviewId,
      staffId: data.staffId,
      rating: data.rating,
      reviewerType: data.reviewerType,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(
        createStaffProfileRequest(data.staffId, 'review-service', 'review-service')
      );
      if (!staffProfile) {
        this.logger.error('Staff not found for review creation', {
          staffId: data.staffId,
          reviewId: data.reviewId,
        });
        return;
      }

      // Update staff performance metrics
      await this.updateStaffPerformanceUseCase.execute({
        staffId: data.staffId,
        performancePeriod: {
          startDate: new Date(data.reviewedAt),
          endDate: new Date(data.reviewedAt)
        },
        metrics: {
          overallScore: data.rating,
          patientSatisfactionScore: data.categories?.bedsideManner || 0,
          clinicalQualityScore: data.categories?.clinicalSkills || 0,
          productivityScore: data.categories?.efficiency || 0,
          attendanceScore: 0, // Default since not provided
          teamworkScore: data.categories?.communication || 0
        },
        reviewedBy: data.reviewerId || 'system',
        reviewedByRole: data.reviewerType || 'external',
        reviewDate: new Date(data.reviewedAt),
        comments: `Review ID: ${data.reviewId}`
      });

      this.logger.info('Staff performance updated for new review', {
        staffId: data.staffId,
        reviewId: data.reviewId,
        rating: data.rating,
      });

    } catch (error) {
      this.logger.error('Failed to process staff review creation', {
        staffId: data.staffId,
        reviewId: data.reviewId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff review updated event
   */
  private async handleReviewUpdated(data: StaffReviewUpdatedEventData): Promise<void> {
    this.logger.info('Processing staff review update', {
      reviewId: data.reviewId,
      staffId: data.staffId,
      previousRating: data.previousRating,
      newRating: data.newRating,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(
        createStaffProfileRequest(data.staffId, 'review-service', 'review-service')
      );
      if (!staffProfile) {
        this.logger.error('Staff not found for review update', {
          staffId: data.staffId,
          reviewId: data.reviewId,
        });
        return;
      }

      // Update staff performance metrics
      await this.updateStaffPerformanceUseCase.execute({
        staffId: data.staffId,
        performancePeriod: {
          startDate: new Date(data.updatedAt),
          endDate: new Date(data.updatedAt)
        },
        metrics: {
          overallScore: data.newRating,
          patientSatisfactionScore: 0, // Default for update events
          clinicalQualityScore: 0,
          productivityScore: 0,
          attendanceScore: 0,
          teamworkScore: 0
        },
        reviewedBy: data.reviewId || 'system', // Use reviewId as fallback
        reviewedByRole: 'system', // Fallback since reviewerType not available in update event
        reviewDate: new Date(data.updatedAt),
        comments: `Updated Review ID: ${data.reviewId} (Previous: ${data.previousRating})`
      });

    } catch (error) {
      this.logger.error('Failed to process staff review update', {
        staffId: data.staffId,
        reviewId: data.reviewId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff review deleted event
   */
  private async handleReviewDeleted(data: StaffReviewDeletedEventData): Promise<void> {
    this.logger.info('Processing staff review deletion', {
      reviewId: data.reviewId,
      staffId: data.staffId,
      previousRating: data.previousRating,
      deletedBy: data.deletedBy,
      reason: data.reason,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(
        createStaffProfileRequest(data.staffId, 'review-service', 'review-service')
      );
      if (!staffProfile) {
        this.logger.error('Staff not found for review deletion', {
          staffId: data.staffId,
          reviewId: data.reviewId,
        });
        return;
      }

      // Update staff performance metrics
      await this.updateStaffPerformanceUseCase.execute({
        staffId: data.staffId,
        performancePeriod: {
          startDate: new Date(data.deletedAt),
          endDate: new Date(data.deletedAt)
        },
        metrics: {
          overallScore: 0, // Reset to 0 after deletion
          patientSatisfactionScore: 0,
          clinicalQualityScore: 0,
          productivityScore: 0,
          attendanceScore: 0,
          teamworkScore: 0
        },
        reviewedBy: data.deletedBy || 'system',
        reviewedByRole: 'system',
        reviewDate: new Date(data.deletedAt),
        comments: `Review deleted: ${data.reviewId} (Previous rating: ${data.previousRating})`
      });

      this.logger.info('Staff performance updated for review deletion', {
        staffId: data.staffId,
        reviewId: data.reviewId,
        previousRating: data.previousRating,
      });

    } catch (error) {
      this.logger.error('Failed to process staff review deletion', {
        staffId: data.staffId,
        reviewId: data.reviewId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle staff rating recalculated event
   */
  private async handleRatingRecalculated(data: StaffRatingRecalculatedEventData): Promise<void> {
    this.logger.info('Processing staff rating recalculation', {
      staffId: data.staffId,
      previousAverageRating: data.previousAverageRating,
      newAverageRating: data.newAverageRating,
      totalReviews: data.totalReviews,
      triggeredBy: data.triggeredBy,
    });

    try {
      // Check if staff exists
      const staffProfile = await this.getStaffProfileUseCase.execute(
        createStaffProfileRequest(data.staffId, 'review-service', 'review-service')
      );
      if (!staffProfile) {
        this.logger.error('Staff not found for rating recalculation', {
          staffId: data.staffId,
        });
        return;
      }

      // Update staff performance metrics with new averages
      await this.updateStaffPerformanceUseCase.execute({
        staffId: data.staffId,
        performancePeriod: {
          startDate: new Date(data.recalculatedAt),
          endDate: new Date(data.recalculatedAt)
        },
        metrics: {
          overallScore: data.newAverageRating,
          patientSatisfactionScore: 0,
          clinicalQualityScore: 0,
          productivityScore: 0,
          attendanceScore: 0,
          teamworkScore: 0
        },
        reviewedBy: data.triggeredBy || 'system',
        reviewedByRole: 'system',
        reviewDate: new Date(data.recalculatedAt),
        comments: `Rating recalculated: ${data.previousAverageRating} → ${data.newAverageRating} (${data.totalReviews} reviews)`
      });

      this.logger.info('Staff performance updated for rating recalculation', {
        staffId: data.staffId,
        previousAverageRating: data.previousAverageRating,
        newAverageRating: data.newAverageRating,
        totalReviews: data.totalReviews,
      });

    } catch (error) {
      this.logger.error('Failed to process staff rating recalculation', {
        staffId: data.staffId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info('Review event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting review event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
