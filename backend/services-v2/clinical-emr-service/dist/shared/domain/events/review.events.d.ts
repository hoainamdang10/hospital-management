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
export declare class ReviewCreatedEvent extends DomainEvent<{
    reviewId: string;
    staffId: string;
    patientId: string;
    rating: number;
    comment?: string;
    appointmentId?: string;
    createdAt: Date;
}> {
    constructor(reviewId: string, staffId: string, patientId: string, rating: number, comment?: string, appointmentId?: string, timestamp?: Date);
    get reviewId(): string;
    get staffId(): string;
    get patientId(): string;
    get rating(): number;
    get comment(): string | undefined;
}
/**
 * ReviewUpdated Event
 * Published when an existing review is updated
 */
export declare class ReviewUpdatedEvent extends DomainEvent<{
    reviewId: string;
    staffId: string;
    patientId: string;
    oldRating: number;
    newRating: number;
    comment?: string;
    updatedAt: Date;
}> {
    constructor(reviewId: string, staffId: string, patientId: string, oldRating: number, newRating: number, comment?: string, timestamp?: Date);
    get reviewId(): string;
    get staffId(): string;
    get oldRating(): number;
    get newRating(): number;
}
/**
 * ReviewDeleted Event
 * Published when a review is deleted
 */
export declare class ReviewDeletedEvent extends DomainEvent<{
    reviewId: string;
    staffId: string;
    patientId: string;
    rating: number;
    deletedAt: Date;
    deletedBy?: string;
    reason?: string;
}> {
    constructor(reviewId: string, staffId: string, patientId: string, rating: number, deletedBy?: string, reason?: string, timestamp?: Date);
    get reviewId(): string;
    get staffId(): string;
    get rating(): number;
}
/**
 * StaffRatingRecalculated Event
 * Published when staff's aggregate rating is recalculated
 * This is the primary event for updating read models
 */
export declare class StaffRatingRecalculatedEvent extends DomainEvent<{
    staffId: string;
    averageRating: number;
    totalReviews: number;
    ratingDistribution: RatingDistribution;
    lastReviewDate: Date;
    recalculatedAt: Date;
}> {
    constructor(staffId: string, averageRating: number, totalReviews: number, ratingDistribution: RatingDistribution, lastReviewDate: Date, timestamp?: Date);
    get staffId(): string;
    get averageRating(): number;
    get totalReviews(): number;
    get ratingDistribution(): RatingDistribution;
    get lastReviewDate(): Date;
}
//# sourceMappingURL=review.events.d.ts.map