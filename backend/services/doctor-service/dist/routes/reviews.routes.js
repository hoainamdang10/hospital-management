"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_config_1 = require("../config/database.config");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/:doctorId/reviews', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { doctor_id } = req.params;
        const { page = 1, limit = 10, rating_filter } = req.query;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền truy cập thông tin này' }
            });
        }
        let query = database_config_1.supabase
            .from('doctor_reviews')
            .select(`
        *,
        patients:patient_id (
          patient_id,
          profiles:profile_id (
            full_name
          )
        )
      `)
            .eq('doctor_id', doctor_id)
            .order('review_date', { ascending: false });
        if (rating_filter && rating_filter !== 'all') {
            query = query.eq('rating', parseInt(rating_filter));
        }
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        query = query.range(offset, offset + limitNum - 1);
        const { data: reviews, error } = await query;
        if (error) {
            console.error('❌ [Reviews] Database error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi truy vấn đánh giá' }
            });
        }
        const { data: stats, error: statsError } = await database_config_1.supabase
            .from('doctor_reviews')
            .select('rating')
            .eq('doctor_id', doctor_id);
        if (statsError) {
            console.error('❌ [Reviews] Stats error:', statsError);
        }
        const totalReviews = stats?.length || 0;
        const averageRating = totalReviews > 0 && stats
            ? stats.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const ratingDistribution = {
            5: stats?.filter(r => r.rating === 5).length || 0,
            4: stats?.filter(r => r.rating === 4).length || 0,
            3: stats?.filter(r => r.rating === 3).length || 0,
            2: stats?.filter(r => r.rating === 2).length || 0,
            1: stats?.filter(r => r.rating === 1).length || 0
        };
        res.json({
            success: true,
            data: {
                reviews: reviews || [],
                statistics: {
                    total_reviews: totalReviews,
                    average_rating: Math.round(averageRating * 10) / 10,
                    rating_distribution: ratingDistribution
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: totalReviews
                }
            }
        });
    }
    catch (error) {
        console.error('❌ [Reviews] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi lấy đánh giá' }
        });
    }
});
router.get('/:doctorId/reviews/summary', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { doctor_id } = req.params;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền truy cập thông tin này' }
            });
        }
        const { data: reviews, error } = await database_config_1.supabase
            .from('doctor_reviews')
            .select('rating, review_date')
            .eq('doctor_id', doctor_id);
        if (error) {
            console.error('❌ [ReviewsSummary] Database error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi truy vấn tóm tắt đánh giá' }
            });
        }
        const totalReviews = reviews?.length || 0;
        const averageRating = totalReviews > 0
            ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
            : 0;
        const ratingDistribution = {
            5: reviews?.filter(r => r.rating === 5).length || 0,
            4: reviews?.filter(r => r.rating === 4).length || 0,
            3: reviews?.filter(r => r.rating === 3).length || 0,
            2: reviews?.filter(r => r.rating === 2).length || 0,
            1: reviews?.filter(r => r.rating === 1).length || 0
        };
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentReviews = reviews?.filter(r => new Date(r.review_date) >= thirtyDaysAgo) || [];
        const recentAverageRating = recentReviews.length > 0
            ? recentReviews.reduce((sum, review) => sum + review.rating, 0) / recentReviews.length
            : 0;
        res.json({
            success: true,
            data: {
                total_reviews: totalReviews,
                average_rating: Math.round(averageRating * 10) / 10,
                rating_distribution: ratingDistribution,
                recent_reviews_count: recentReviews.length,
                recent_average_rating: Math.round(recentAverageRating * 10) / 10,
                satisfaction_rate: totalReviews > 0
                    ? Math.round(((ratingDistribution[4] + ratingDistribution[5]) / totalReviews) * 100)
                    : 0
            }
        });
    }
    catch (error) {
        console.error('❌ [ReviewsSummary] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi lấy tóm tắt đánh giá' }
        });
    }
});
router.post('/:doctorId/reviews/:reviewId/helpful', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { data: review, error } = await database_config_1.supabase
            .from('doctor_reviews')
            .update({
            helpful_count: 'helpful_count + 1'
        })
            .eq('id', reviewId)
            .select()
            .single();
        if (error) {
            console.error('❌ [ReviewsHelpful] Database error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi cập nhật đánh giá hữu ích' }
            });
        }
        res.json({
            success: true,
            data: review,
            message: 'Đánh dấu đánh giá hữu ích thành công'
        });
    }
    catch (error) {
        console.error('❌ [ReviewsHelpful] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi đánh dấu đánh giá hữu ích' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=reviews.routes.js.map