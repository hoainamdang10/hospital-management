import { DoctorReview, CreateReviewRequest, ReviewStats } from '@hospital/shared/dist/types/doctor.types';
export declare class ReviewRepository {
    private supabase;
    constructor();
    findByDoctorId(doctor_id: string, limit?: number, offset?: number): Promise<DoctorReview[]>;
    findByPatientId(patient_id: string, limit?: number, offset?: number): Promise<DoctorReview[]>;
    findById(reviewId: string): Promise<DoctorReview | null>;
    create(reviewData: CreateReviewRequest): Promise<DoctorReview>;
    update(reviewId: string, updateData: Partial<CreateReviewRequest>): Promise<DoctorReview | null>;
    delete(reviewId: string): Promise<boolean>;
    findByAppointment(appointment_id: string): Promise<DoctorReview | null>;
    getReviewStats(doctor_id: string): Promise<ReviewStats>;
    incrementHelpfulCount(reviewId: string): Promise<DoctorReview | null>;
    getTopRatedDoctors(limit?: number): Promise<Array<{
        doctor_id: string;
        average_rating: number;
        total_reviews: number;
    }>>;
    getReviewsByRating(doctor_id: string, rating: number, limit?: number): Promise<DoctorReview[]>;
    searchReviews(doctor_id: string, searchTerm: string, limit?: number): Promise<DoctorReview[]>;
    getVerifiedReviews(doctor_id: string, limit?: number): Promise<DoctorReview[]>;
    private mapSupabaseReviewToReview;
}
//# sourceMappingURL=review.repository.d.ts.map