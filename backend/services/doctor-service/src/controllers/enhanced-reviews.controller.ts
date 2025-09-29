import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/database.config';
import logger from '@hospital/shared/dist/utils/logger';

interface ReviewData {
  review_id: string;
  patient_name: string;
  patient_initial: string;
  rating: number;
  review_text: string;
  review_date: string;
  is_verified: boolean;
  helpful_count: number;
  appointment_date?: string;
  appointment_type?: string;
  review_category?: string;
  doctor_response?: string;
  response_date?: string;
}

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface MonthlyTrend {
  month: string;
  month_name: string;
  average_rating: number;
  review_count: number;
}

interface ReviewSummary {
  total_reviews: number;
  average_rating: number;
  rating_distribution: RatingDistribution;
  recent_trends: MonthlyTrend[];
  verified_reviews_count: number;
  response_rate: number;
}

interface EnhancedReviewsResponse {
  reviews: ReviewData[];
  summary: ReviewSummary;
  pagination: {
    current_page: number;
    total_pages: number;
    total_reviews: number;
    per_page: number;
  };
}

export class EnhancedReviewsController {

  /**
   * Lấy reviews chi tiết với Vietnamese support
   * GET /api/doctors/:doctorId/reviews
   */
  async getDoctorReviews(req: Request, res: Response): Promise<void> {
    try {
      const { doctor_id } = req.params;
      const { 
        page = 1, 
        limit = 10, 
        sort = 'newest',
        rating_filter,
        verified_only = 'false'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      logger.info('📝 [EnhancedReviews] Getting reviews for doctor', {
        doctor_id,
        page: pageNum,
        limit: limitNum,
        sort,
        rating_filter,
        verified_only
      });

      // 1. Lấy tổng số reviews để tính pagination
      let countQuery = supabaseAdmin
        .from('doctor_reviews')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', doctor_id);

      if (rating_filter) {
        countQuery = countQuery.eq('rating', parseInt(rating_filter as string));
      }

      if (verified_only === 'true') {
        countQuery = countQuery.eq('is_verified', true);
      }

      const { count: totalReviews, error: countError } = await countQuery;

      if (countError) {
        logger.error('❌ [EnhancedReviews] Error counting reviews:', countError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi đếm số lượng đánh giá' }
        });
        return;
      }

      // 2. Lấy reviews với thông tin chi tiết
      let reviewsQuery = supabaseAdmin
        .from('doctor_reviews')
        .select(`
          review_id,
          rating,
          review_text,
          review_date,
          is_verified,
          helpful_count,
          review_category,
          doctor_response,
          response_date,
          appointment_id,
          patients!inner(
            patient_id,
            profiles!inner(full_name)
          ),
          appointments(
            appointment_date,
            appointment_type
          )
        `)
        .eq('doctor_id', doctor_id);

      // Apply filters
      if (rating_filter) {
        reviewsQuery = reviewsQuery.eq('rating', parseInt(rating_filter as string));
      }

      if (verified_only === 'true') {
        reviewsQuery = reviewsQuery.eq('is_verified', true);
      }

      // Apply sorting
      switch (sort) {
        case 'oldest':
          reviewsQuery = reviewsQuery.order('review_date', { ascending: true });
          break;
        case 'rating_high':
          reviewsQuery = reviewsQuery.order('rating', { ascending: false });
          break;
        case 'rating_low':
          reviewsQuery = reviewsQuery.order('rating', { ascending: true });
          break;
        case 'helpful':
          reviewsQuery = reviewsQuery.order('helpful_count', { ascending: false });
          break;
        default: // newest
          reviewsQuery = reviewsQuery.order('review_date', { ascending: false });
      }

      reviewsQuery = reviewsQuery.range(offset, offset + limitNum - 1);

      const { data: reviewsData, error: reviewsError } = await reviewsQuery;

      if (reviewsError) {
        logger.error('❌ [EnhancedReviews] Error getting reviews:', reviewsError);
        res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi lấy danh sách đánh giá' }
        });
        return;
      }

      // 3. Lấy thống kê tổng quan
      const summary = await this.getReviewSummary(doctor_id);

      // 4. Format reviews data
      const reviews: ReviewData[] = (reviewsData || []).map(review => ({
        review_id: review.review_id,
        patient_name: (review.patients as any)?.profiles?.full_name || 'Bệnh nhân ẩn danh',
        patient_initial: this.getPatientInitial((review.patients as any)?.profiles?.full_name),
        rating: review.rating,
        review_text: review.review_text || '',
        review_date: review.review_date,
        is_verified: review.is_verified || false,
        helpful_count: review.helpful_count || 0,
        appointment_date: (review.appointments as any)?.appointment_date,
        appointment_type: this.translateAppointmentType((review.appointments as any)?.appointment_type),
        review_category: review.review_category || 'general',
        doctor_response: review.doctor_response,
        response_date: review.response_date
      }));

      const totalPages = Math.ceil((totalReviews || 0) / limitNum);

      const response: EnhancedReviewsResponse = {
        reviews,
        summary,
        pagination: {
          current_page: pageNum,
          total_pages: totalPages,
          total_reviews: totalReviews || 0,
          per_page: limitNum
        }
      };

      logger.info('✅ [EnhancedReviews] Successfully retrieved reviews', {
        doctor_id,
        reviewCount: reviews.length,
        totalReviews: totalReviews || 0,
        averageRating: summary.average_rating
      });

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      logger.error('💥 [EnhancedReviews] Unexpected error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Lỗi server khi lấy đánh giá' }
      });
    }
  }

  /**
   * Lấy thống kê tổng quan về reviews
   */
  private async getReviewSummary(doctor_id: string): Promise<ReviewSummary> {
    try {
      // 1. Lấy tất cả reviews để tính thống kê
      const { data: allReviews, error } = await supabaseAdmin
        .from('doctor_reviews')
        .select('rating, review_date, is_verified, doctor_response')
        .eq('doctor_id', doctor_id);

      if (error || !allReviews) {
        logger.error('❌ [ReviewSummary] Error getting all reviews:', error);
        return this.getEmptyReviewSummary();
      }

      const totalReviews = allReviews.length;
      const averageRating = totalReviews > 0 
        ? allReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      // 2. Tính rating distribution
      const ratingDistribution: RatingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      allReviews.forEach(review => {
        ratingDistribution[review.rating as keyof RatingDistribution]++;
      });

      // 3. Tính verified reviews count
      const verifiedReviewsCount = allReviews.filter(review => review.is_verified).length;

      // 4. Tính response rate
      const reviewsWithResponse = allReviews.filter(review => review.doctor_response).length;
      const responseRate = totalReviews > 0 ? (reviewsWithResponse / totalReviews) * 100 : 0;

      // 5. Lấy trends theo tháng (6 tháng gần nhất)
      const recentTrends = this.calculateMonthlyTrends(allReviews);

      return {
        total_reviews: totalReviews,
        average_rating: Math.round(averageRating * 100) / 100,
        rating_distribution: ratingDistribution,
        recent_trends: recentTrends,
        verified_reviews_count: verifiedReviewsCount,
        response_rate: Math.round(responseRate * 100) / 100
      };

    } catch (error) {
      logger.error('💥 [ReviewSummary] Error:', error);
      return this.getEmptyReviewSummary();
    }
  }

  /**
   * Tính toán trends theo tháng
   */
  private calculateMonthlyTrends(reviews: any[]): MonthlyTrend[] {
    const monthlyData = new Map<string, { ratings: number[]; count: number }>();
    
    reviews.forEach(review => {
      const reviewDate = new Date(review.review_date);
      const monthKey = `${reviewDate.getFullYear()}-${(reviewDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { ratings: [], count: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.ratings.push(review.rating);
      monthData.count++;
    });

    // Lấy 6 tháng gần nhất
    const sortedMonths = Array.from(monthlyData.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6)
      .reverse();

    return sortedMonths.map(([monthKey, data]) => ({
      month: monthKey,
      month_name: this.getMonthNameInVietnamese(monthKey),
      average_rating: data.ratings.length > 0 
        ? Math.round((data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length) * 100) / 100
        : 0,
      review_count: data.count
    }));
  }

  /**
   * Lấy initials từ tên bệnh nhân (để bảo mật)
   */
  private getPatientInitial(fullName?: string): string {
    if (!fullName) return 'B.N';
    
    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase() + '.';
    }
    
    // Lấy chữ cái đầu của họ và tên
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return `${firstInitial}.${lastInitial}`;
  }

  /**
   * Dịch appointment type sang tiếng Việt
   */
  private translateAppointmentType(type?: string): string {
    if (!type) return 'Khám tổng quát';
    
    const translations: { [key: string]: string } = {
      'consultation': 'Khám tư vấn',
      'follow_up': 'Tái khám',
      'emergency': 'Cấp cứu',
      'routine_checkup': 'Khám định kỳ',
      'surgery': 'Phẫu thuật'
    };
    return translations[type] || type;
  }

  /**
   * Chuyển đổi tên tháng sang tiếng Việt
   */
  private getMonthNameInVietnamese(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  /**
   * Trả về summary rỗng khi có lỗi
   */
  private getEmptyReviewSummary(): ReviewSummary {
    return {
      total_reviews: 0,
      average_rating: 0,
      rating_distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      recent_trends: [],
      verified_reviews_count: 0,
      response_rate: 0
    };
  }
}
