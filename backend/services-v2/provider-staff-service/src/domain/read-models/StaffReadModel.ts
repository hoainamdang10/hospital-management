/**
 * StaffReadModel - CQRS Read Model
 * Provider/Staff Service V2
 *
 * Denormalized read model for staff profiles with rating data from Review Service
 * Implements CQRS pattern for optimized query performance
 *
 * NOTE: Rating fields are denormalized from Review Service for query optimization
 * This follows CQRS best practice - read models can contain data from multiple sources
 * Updated via ReviewCreated/ReviewUpdated events (eventual consistency)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */

export interface RatingDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface StaffReadModel {
  staffId: string;
  userId: string;
  fullName: string;
  department: string | null;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  lastReviewDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffReadModelCreateProps {
  staffId: string;
  userId: string;
  fullName: string;
  department?: string;
}

export interface StaffReadModelUpdateProps {
  averageRating?: number;
  totalReviews?: number;
  ratingDistribution?: RatingDistribution;
  lastReviewDate?: Date;
}
