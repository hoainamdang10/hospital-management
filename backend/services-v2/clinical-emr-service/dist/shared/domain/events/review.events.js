"use strict";
/**
 * Review Service Domain Events
 * Shared event definitions for cross-service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffRatingRecalculatedEvent = exports.ReviewDeletedEvent = exports.ReviewUpdatedEvent = exports.ReviewCreatedEvent = void 0;
const DomainEvent_1 = require("./DomainEvent");
/**
 * ReviewCreated Event
 * Published when a new review is created for a staff member
 */
class ReviewCreatedEvent extends DomainEvent_1.DomainEvent {
    constructor(reviewId, staffId, patientId, rating, comment, appointmentId, timestamp = new Date()) {
        super('review.created', {
            reviewId,
            staffId,
            patientId,
            rating,
            comment,
            appointmentId,
            createdAt: timestamp
        }, timestamp);
    }
    get reviewId() {
        return this.data.reviewId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get patientId() {
        return this.data.patientId;
    }
    get rating() {
        return this.data.rating;
    }
    get comment() {
        return this.data.comment;
    }
}
exports.ReviewCreatedEvent = ReviewCreatedEvent;
/**
 * ReviewUpdated Event
 * Published when an existing review is updated
 */
class ReviewUpdatedEvent extends DomainEvent_1.DomainEvent {
    constructor(reviewId, staffId, patientId, oldRating, newRating, comment, timestamp = new Date()) {
        super('review.updated', {
            reviewId,
            staffId,
            patientId,
            oldRating,
            newRating,
            comment,
            updatedAt: timestamp
        }, timestamp);
    }
    get reviewId() {
        return this.data.reviewId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get oldRating() {
        return this.data.oldRating;
    }
    get newRating() {
        return this.data.newRating;
    }
}
exports.ReviewUpdatedEvent = ReviewUpdatedEvent;
/**
 * ReviewDeleted Event
 * Published when a review is deleted
 */
class ReviewDeletedEvent extends DomainEvent_1.DomainEvent {
    constructor(reviewId, staffId, patientId, rating, deletedBy, reason, timestamp = new Date()) {
        super('review.deleted', {
            reviewId,
            staffId,
            patientId,
            rating,
            deletedAt: timestamp,
            deletedBy,
            reason
        }, timestamp);
    }
    get reviewId() {
        return this.data.reviewId;
    }
    get staffId() {
        return this.data.staffId;
    }
    get rating() {
        return this.data.rating;
    }
}
exports.ReviewDeletedEvent = ReviewDeletedEvent;
/**
 * StaffRatingRecalculated Event
 * Published when staff's aggregate rating is recalculated
 * This is the primary event for updating read models
 */
class StaffRatingRecalculatedEvent extends DomainEvent_1.DomainEvent {
    constructor(staffId, averageRating, totalReviews, ratingDistribution, lastReviewDate, timestamp = new Date()) {
        super('review.rating.recalculated', {
            staffId,
            averageRating,
            totalReviews,
            ratingDistribution,
            lastReviewDate,
            recalculatedAt: timestamp
        }, timestamp);
    }
    get staffId() {
        return this.data.staffId;
    }
    get averageRating() {
        return this.data.averageRating;
    }
    get totalReviews() {
        return this.data.totalReviews;
    }
    get ratingDistribution() {
        return this.data.ratingDistribution;
    }
    get lastReviewDate() {
        return this.data.lastReviewDate;
    }
}
exports.StaffRatingRecalculatedEvent = StaffRatingRecalculatedEvent;
//# sourceMappingURL=review.events.js.map