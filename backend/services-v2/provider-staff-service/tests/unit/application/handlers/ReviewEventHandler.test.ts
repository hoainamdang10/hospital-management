import { ReviewEventHandler, ReviewCreatedEvent, ReviewUpdatedEvent, ReviewDeletedEvent, StaffRatingRecalculatedEvent } from '../../../../src/application/handlers/ReviewEventHandler';
import { RatingDistribution, StaffReadModel } from '../../../../src/domain/read-models/StaffReadModel';
import { IStaffReadModelRepository } from '../../../../src/infrastructure/repositories/StaffReadModelRepository';
import { createMockLogger } from '../../../helpers/mockFactories';

const buildReadModel = (overrides: Partial<StaffReadModel> = {}): StaffReadModel => ({
  staffId: 'DOC-CARD-202501-001',
  userId: 'user-1',
  fullName: 'Dr. Test',
  specialization: 'Cardiology',
  department: 'Cardiology',
  averageRating: 4,
  totalReviews: 2,
  ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
  lastReviewDate: new Date('2024-01-01T00:00:00.000Z'),
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

describe('ReviewEventHandler (Application Layer)', () => {
  let repository: jest.Mocked<IStaffReadModelRepository>;
  let logger: ReturnType<typeof createMockLogger>;
  let handler: ReviewEventHandler;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByDepartment: jest.fn(),
      findTopRated: jest.fn(),
      create: jest.fn(),
      updateRating: jest.fn(),
      delete: jest.fn()
    } as jest.Mocked<IStaffReadModelRepository>;
    logger = createMockLogger();
    handler = new ReviewEventHandler(repository, logger);
    jest.clearAllMocks();
  });

  describe('handleReviewCreated', () => {
    const event: ReviewCreatedEvent = {
      eventType: 'review.created',
      staffId: 'DOC-CARD-202501-001',
      rating: 5,
      reviewId: 'REV-001',
      timestamp: new Date('2025-01-10T00:00:00.000Z')
    };

    it('cập nhật rating khi tìm thấy read model', async () => {
      repository.findById.mockResolvedValue(buildReadModel());

      await handler.handleReviewCreated(event);

      expect(repository.updateRating).toHaveBeenCalledWith(event.staffId, {
        averageRating: 4.33,
        totalReviews: 3,
        ratingDistribution: expect.objectContaining({ 5: 2 }),
        lastReviewDate: event.timestamp
      });
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('ghi cảnh báo khi không tìm thấy read model', async () => {
      repository.findById.mockResolvedValue(null);

      await handler.handleReviewCreated(event);

      expect(repository.updateRating).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        'Staff read model not found for review event',
        expect.objectContaining({ staffId: event.staffId })
      );
    });
  });

  describe('handleReviewUpdated', () => {
    const event: ReviewUpdatedEvent = {
      eventType: 'review.updated',
      staffId: 'DOC-CARD-202501-001',
      oldRating: 4,
      newRating: 5,
      reviewId: 'REV-002',
      timestamp: new Date('2025-01-11T00:00:00.000Z')
    };

    it('điều chỉnh lại điểm trung bình và phân bố rating', async () => {
      repository.findById.mockResolvedValue(buildReadModel());

      await handler.handleReviewUpdated(event);

      expect(repository.updateRating).toHaveBeenCalledWith(event.staffId, {
        averageRating: 4.5,
        ratingDistribution: expect.objectContaining({ 4: 0, 5: 2 }),
        lastReviewDate: event.timestamp
      });
    });
  });

  describe('handleReviewDeleted', () => {
    const event: ReviewDeletedEvent = {
      eventType: 'review.deleted',
      staffId: 'DOC-CARD-202501-001',
      rating: 4,
      reviewId: 'REV-003',
      timestamp: new Date('2025-01-12T00:00:00.000Z')
    };

    it('giảm tổng số review và cập nhật rating', async () => {
      repository.findById.mockResolvedValue(
        buildReadModel({
          totalReviews: 2,
          averageRating: 4.5,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 }
        })
      );

      await handler.handleReviewDeleted(event);

      expect(repository.updateRating).toHaveBeenCalledWith(event.staffId, {
        averageRating: 5,
        totalReviews: 1,
        ratingDistribution: expect.objectContaining({ 4: 0 }),
        lastReviewDate: event.timestamp
      });
    });
  });

  describe('handleStaffRatingRecalculated', () => {
    const distribution: RatingDistribution = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5 };
    const event: StaffRatingRecalculatedEvent = {
      eventType: 'staff.rating.recalculated',
      staffId: 'DOC-CARD-202501-001',
      averageRating: 4.2,
      totalReviews: 12,
      ratingDistribution: distribution,
      timestamp: new Date('2025-01-13T00:00:00.000Z')
    };

    it('đồng bộ rating khi nhận sự kiện recalculated', async () => {
      await handler.handleStaffRatingRecalculated(event);

      expect(repository.updateRating).toHaveBeenCalledWith(event.staffId, {
        averageRating: event.averageRating,
        totalReviews: event.totalReviews,
        ratingDistribution: distribution,
        lastReviewDate: event.timestamp
      });
    });
  });

  it('ghi lỗi và ném lại exception khi repository lỗi', async () => {
    const event: ReviewCreatedEvent = {
      eventType: 'review.created',
      staffId: 'DOC-CARD-202501-001',
      rating: 5,
      reviewId: 'REV-ERR',
      timestamp: new Date()
    };

    repository.findById.mockRejectedValue(new Error('read failure'));

    await expect(handler.handleReviewCreated(event)).rejects.toThrow('read failure');
    expect(logger.error).toHaveBeenCalledWith(
      'Error handling ReviewCreated event',
      expect.objectContaining({ event })
    );
  });
});
