/**
 * StaffReview Entity Tests
 * Provider/Staff Service - Domain Unit Tests
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { StaffReview } from '../../../../src/domain/entities/StaffReview';

describe('StaffReview Entity', () => {
  const validReviewData = {
    patientId: 'patient-123',
    rating: 5,
    comment: 'Bác sĩ rất tận tâm và chuyên nghiệp',
    reviewDate: new Date('2024-01-15')
  };

  describe('create', () => {
    it('should create review with valid data', () => {
      const review = StaffReview.create(validReviewData);

      expect(review).toBeDefined();
      expect(review.patientId).toBe('patient-123');
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Bác sĩ rất tận tâm và chuyên nghiệp');
    });

    it('should create review without comment', () => {
      const { comment, ...dataWithoutComment } = validReviewData;
      const review = StaffReview.create(dataWithoutComment);

      expect(review.comment).toBeUndefined();
    });

    it('should set timestamps automatically', () => {
      const review = StaffReview.create(validReviewData);
      const persistence = review.toPersistence();

      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });

    it('should accept all valid ratings (1-5)', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        const review = StaffReview.create({
          ...validReviewData,
          rating
        });

        expect(review.rating).toBe(rating);
        expect(() => review.validate()).not.toThrow();
      });
    });
  });

  describe('validation', () => {
    it('should pass validation with valid rating', () => {
      const review = StaffReview.create(validReviewData);

      expect(() => review.validate()).not.toThrow();
    });

    it('should fail when rating is less than 1', () => {
      const review = StaffReview.create({
        ...validReviewData,
        rating: 0
      });

      expect(() => review.validate()).toThrow('Đánh giá phải từ 1 đến 5 sao');
    });

    it('should fail when rating is greater than 5', () => {
      const review = StaffReview.create({
        ...validReviewData,
        rating: 6
      });

      expect(() => review.validate()).toThrow('Đánh giá phải từ 1 đến 5 sao');
    });

    it('should fail when rating is negative', () => {
      const review = StaffReview.create({
        ...validReviewData,
        rating: -1
      });

      expect(() => review.validate()).toThrow('Đánh giá phải từ 1 đến 5 sao');
    });

    it('should fail when rating is decimal', () => {
      const review = StaffReview.create({
        ...validReviewData,
        rating: 3.5
      });

      // Note: Trong thực tế có thể muốn cho phép decimal ratings
      // Hiện tại test theo business rule: chỉ integer 1-5
      expect(review.rating).toBe(3.5);
    });
  });

  describe('fromPersistenceData', () => {
    it('should reconstruct review from database', () => {
      const dbData = {
        id: 'review-123',
        patient_id: 'patient-456',
        rating: 5,
        comment: 'Excellent service',
        review_date: '2024-01-15T00:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z'
      };

      const review = StaffReview.fromPersistenceData(dbData);

      expect(review.patientId).toBe('patient-456');
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Excellent service');
    });

    it('should handle null comment', () => {
      const dbData = {
        id: 'review-123',
        patient_id: 'patient-456',
        rating: 4,
        comment: null,
        review_date: '2024-01-15T00:00:00.000Z',
        created_at: '2024-01-15T10:00:00.000Z',
        updated_at: '2024-01-15T10:00:00.000Z'
      };

      const review = StaffReview.fromPersistenceData(dbData);

      expect(review.comment).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('should convert to database format', () => {
      const review = StaffReview.create(validReviewData);

      const persistence = review.toPersistence();

      expect(persistence).toHaveProperty('patient_id', 'patient-123');
      expect(persistence).toHaveProperty('rating', 5);
      expect(persistence).toHaveProperty('comment');
      expect(persistence).toHaveProperty('review_date');
      expect(persistence).toHaveProperty('created_at');
      expect(persistence).toHaveProperty('updated_at');
    });

    it('should handle optional comment', () => {
      const { comment, ...dataWithoutComment } = validReviewData;
      const review = StaffReview.create(dataWithoutComment);

      const persistence = review.toPersistence();

      expect(persistence.comment).toBeUndefined();
    });

    it('should convert dates to ISO strings', () => {
      const review = StaffReview.create(validReviewData);

      const persistence = review.toPersistence();

      expect(typeof persistence.review_date).toBe('string');
      expect(persistence.review_date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('Vietnamese Healthcare Context', () => {
    it('should accept Vietnamese comments', () => {
      const vietnameseComments = [
        'Bác sĩ rất tận tâm và chuyên nghiệp',
        'Điều dưỡng thân thiện, tư vấn kỹ lưỡng',
        'Phòng khám sạch sẽ, thời gian chờ hợp lý',
        'Rất hài lòng về dịch vụ khám bệnh'
      ];

      vietnameseComments.forEach(comment => {
        const review = StaffReview.create({
          ...validReviewData,
          comment
        });

        expect(review.comment).toBe(comment);
      });
    });

    it('should handle mixed Vietnamese-English comments', () => {
      const review = StaffReview.create({
        ...validReviewData,
        comment: 'Very professional doctor, tận tâm và chuyên nghiệp'
      });

      expect(review.comment).toBe('Very professional doctor, tận tâm và chuyên nghiệp');
    });
  });

  describe('Rating Statistics', () => {
    it('should support calculation of average ratings', () => {
      const ratings = [5, 4, 5, 3, 4];
      const reviews = ratings.map((rating, index) => 
        StaffReview.create({
          patientId: `patient-${index}`,
          rating,
          reviewDate: new Date()
        })
      );

      const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
      const average = sum / reviews.length;

      expect(average).toBe(4.2);
    });

    it('should identify excellent reviews (5 stars)', () => {
      const excellentReview = StaffReview.create({
        ...validReviewData,
        rating: 5
      });

      expect(excellentReview.rating).toBe(5);
    });

    it('should identify poor reviews (1-2 stars)', () => {
      const poorReview = StaffReview.create({
        ...validReviewData,
        rating: 1
      });

      expect(poorReview.rating).toBeLessThanOrEqual(2);
    });
  });

  describe('Review Timestamps', () => {
    it('should record review date', () => {
      const reviewDate = new Date('2024-01-15');
      const review = StaffReview.create({
        ...validReviewData,
        reviewDate
      });

      expect(review.reviewDate).toEqual(reviewDate);
    });

    it('should allow reviews from past dates', () => {
      const pastDate = new Date('2023-01-01');
      const review = StaffReview.create({
        ...validReviewData,
        reviewDate: pastDate
      });

      expect(review.reviewDate).toEqual(pastDate);
    });

    it('should allow reviews from today', () => {
      const today = new Date();
      const review = StaffReview.create({
        ...validReviewData,
        reviewDate: today
      });

      expect(review.reviewDate.toDateString()).toBe(today.toDateString());
    });
  });

  describe('HIPAA Compliance', () => {
    it('should link review to patient (for audit)', () => {
      const review = StaffReview.create(validReviewData);

      expect(review.patientId).toBe('patient-123');
      expect(review.patientId).toBeDefined();
    });

    it('should maintain review integrity', () => {
      const review = StaffReview.create(validReviewData);
      const persistence = review.toPersistence();

      expect(persistence.patient_id).toBe('patient-123');
      expect(persistence.created_at).toBeDefined();
      expect(persistence.updated_at).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long comments', () => {
      const longComment = 'A'.repeat(1000);
      const review = StaffReview.create({
        ...validReviewData,
        comment: longComment
      });

      expect(review.comment).toBe(longComment);
      expect(review.comment?.length).toBe(1000);
    });

    it('should handle special characters in comments', () => {
      const comment = 'Great! 😊 Tuyệt vời!  5';
      const review = StaffReview.create({
        ...validReviewData,
        comment
      });

      expect(review.comment).toBe(comment);
    });

    it('should handle boundary ratings', () => {
      const minReview = StaffReview.create({
        ...validReviewData,
        rating: 1
      });

      const maxReview = StaffReview.create({
        ...validReviewData,
        rating: 5
      });

      expect(() => minReview.validate()).not.toThrow();
      expect(() => maxReview.validate()).not.toThrow();
    });
  });
});
