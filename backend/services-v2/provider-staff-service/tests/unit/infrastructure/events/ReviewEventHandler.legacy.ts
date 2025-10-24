/**
 * ReviewEventHandler Unit Tests
 * Provider/Staff Service V2
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { ReviewEventHandler } from '../../../../src/infrastructure/events/ReviewEventHandler';
import {
  ReviewCreatedEvent,
  ReviewUpdatedEvent,
  ReviewDeletedEvent,
  StaffRatingRecalculatedEvent,
  RatingDistribution
} from '@shared/domain/events/review.events';
import { IStaffReadModelRepository } from '../../../../src/infrastructure/repositories/StaffReadModelRepository';
import { ILogger } from '../../../../src/application/interfaces/ILogger';
import { IAuditService } from '../../../../src/application/interfaces/IAuditService';

describe('ReviewEventHandler', () => {
  let handler: ReviewEventHandler;
  let mockReadModelRepository: jest.Mocked<IStaffReadModelRepository>;
  let mockLogger: jest.Mocked<ILogger>;
  let mockAuditService: jest.Mocked<IAuditService>;

  beforeEach(() => {
    // Mock dependencies
    mockReadModelRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDepartment: jest.fn(),
      findTopRated: jest.fn(),
      create: jest.fn(),
      updateRating: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IStaffReadModelRepository>;

    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      log: jest.fn()
    } as jest.Mocked<ILogger>;

    mockAuditService = {
      logEvent: jest.fn(),
      logDataAccess: jest.fn(),
      logDataModification: jest.fn(),
      logSecurityEvent: jest.fn()
    } as jest.Mocked<IAuditService>;

    handler = new ReviewEventHandler(
      mockReadModelRepository,
      mockLogger,
      mockAuditService
    );
  });

  describe('handleReviewCreated', () => {
    it('should update read model with new review rating', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new ReviewCreatedEvent(
        'review-1',
        staffId,
        'patient-1',
        5,
        'Excellent doctor!',
        'appointment-1'
      );

      const existingReadModel = {
        staffId,
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 4.0,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 } as RatingDistribution,
        lastReviewDate: new Date('2025-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act
      await handler.handleReviewCreated(event);

      // Assert
      expect(mockReadModelRepository.findById).toHaveBeenCalledWith(staffId);
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        expect.objectContaining({
          averageRating: 4.09, // (4.0 * 10 + 5) / 11 = 4.09
          totalReviews: 11,
          ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 6 }
        })
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });

    it('should handle first review correctly', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new ReviewCreatedEvent(
        'review-1',
        staffId,
        'patient-1',
        5
      );

      const existingReadModel = {
        staffId,
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as RatingDistribution,
        lastReviewDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act
      await handler.handleReviewCreated(event);

      // Assert
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        expect.objectContaining({
          averageRating: 5.0,
          totalReviews: 1,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 }
        })
      );
    });

    it('should skip if staff read model not found', async () => {
      // Arrange
      const event = new ReviewCreatedEvent(
        'review-1',
        'staff-999',
        'patient-1',
        5
      );

      mockReadModelRepository.findById.mockResolvedValue(null);

      // Act
      await handler.handleReviewCreated(event);

      // Assert
      expect(mockReadModelRepository.updateRating).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should implement idempotency - skip duplicate events', async () => {
      // Arrange
      const event = new ReviewCreatedEvent(
        'review-1',
        'staff-123',
        'patient-1',
        5
      );

      const existingReadModel = {
        staffId: 'staff-123',
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 4.0,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 } as RatingDistribution,
        lastReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act - Process same event twice
      await handler.handleReviewCreated(event);
      await handler.handleReviewCreated(event);

      // Assert - Should only process once
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleReviewUpdated', () => {
    it('should recalculate rating when review is updated', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new ReviewUpdatedEvent(
        'review-1',
        staffId,
        'patient-1',
        3, // old rating
        5  // new rating
      );

      const existingReadModel = {
        staffId,
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 4.0,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 0, 3: 3, 4: 2, 5: 5 } as RatingDistribution,
        lastReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act
      await handler.handleReviewUpdated(event);

      // Assert
      // (4.0 * 10 - 3 + 5) / 10 = 4.2
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        expect.objectContaining({
          averageRating: 4.2,
          ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 2, 5: 6 }
        })
      );
    });
  });

  describe('handleReviewDeleted', () => {
    it('should recalculate rating when review is deleted', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new ReviewDeletedEvent(
        'review-1',
        staffId,
        'patient-1',
        5, // deleted rating
        'admin-1',
        'Spam review'
      );

      const existingReadModel = {
        staffId,
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 4.5,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 } as RatingDistribution,
        lastReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act
      await handler.handleReviewDeleted(event);

      // Assert
      // (4.5 * 10 - 5) / 9 = 4.44
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        expect.objectContaining({
          averageRating: 4.44,
          totalReviews: 9,
          ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 4 }
        })
      );
    });

    it('should handle deletion of last review', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new ReviewDeletedEvent(
        'review-1',
        staffId,
        'patient-1',
        5
      );

      const existingReadModel = {
        staffId,
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 5.0,
        totalReviews: 1,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 1 } as RatingDistribution,
        lastReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);

      // Act
      await handler.handleReviewDeleted(event);

      // Assert
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        expect.objectContaining({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        })
      );
    });
  });

  describe('handleStaffRatingRecalculated', () => {
    it('should sync rating data from Review Service', async () => {
      // Arrange
      const staffId = 'staff-123';
      const event = new StaffRatingRecalculatedEvent(
        staffId,
        4.75,
        20,
        { 1: 0, 2: 1, 3: 2, 4: 5, 5: 12 } as RatingDistribution,
        new Date()
      );

      // Act
      await handler.handleStaffRatingRecalculated(event);

      // Assert
      expect(mockReadModelRepository.updateRating).toHaveBeenCalledWith(
        staffId,
        {
          averageRating: 4.75,
          totalReviews: 20,
          ratingDistribution: { 1: 0, 2: 1, 3: 2, 4: 5, 5: 12 },
          lastReviewDate: event.lastReviewDate
        }
      );
      expect(mockAuditService.logDataModification).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw error if update fails', async () => {
      // Arrange
      const event = new ReviewCreatedEvent(
        'review-1',
        'staff-123',
        'patient-1',
        5
      );

      const existingReadModel = {
        staffId: 'staff-123',
        userId: 'user-123',
        fullName: 'Dr. John Doe',
        specialization: 'Cardiology',
        department: 'Cardiology',
        averageRating: 4.0,
        totalReviews: 10,
        ratingDistribution: { 1: 0, 2: 0, 3: 2, 4: 3, 5: 5 } as RatingDistribution,
        lastReviewDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockReadModelRepository.findById.mockResolvedValue(existingReadModel);
      mockReadModelRepository.updateRating.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(handler.handleReviewCreated(event)).rejects.toThrow('Database error');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
