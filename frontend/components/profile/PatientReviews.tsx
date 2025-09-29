'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  Star, 
  ThumbsUp, 
  Filter, 
  TrendingUp,
  MessageSquare,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

interface Review {
  id: string;
  patient_id: string;
  rating: number;
  review_text: string;
  review_date: string;
  is_anonymous: boolean;
  is_verified: boolean;
  helpful_count: number;
  patients?: {
    patient_id: string;
    full_name: string;
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recent_reviews_count: number;
  recent_average_rating: number;
  satisfaction_rate: number;
}

interface PatientReviewsProps {
  doctorId: string;
}

export default function PatientReviews({ doctorId }: PatientReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews(true);
    fetchStats();
  }, [doctorId, ratingFilter]);

  const fetchReviews = async (reset = false) => {
    try {
      if (reset) setLoading(true);
      
      const currentPage = reset ? 1 : page;
      const response = await doctorsApi.getDoctorReviews(doctorId, currentPage, 10, ratingFilter || undefined);
      
      if (response.success && response.data) {
        const newReviews = response.data.reviews || [];
        
        if (reset) {
          setReviews(newReviews);
        } else {
          setReviews(prev => [...prev, ...newReviews]);
        }
        
        setHasMore(newReviews.length === 10);
        setPage(reset ? 2 : currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải đánh giá",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await doctorsApi.getReviewsSummary(doctorId);
      
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching review stats:', error);
    }
  };

  const handleMarkHelpful = async (reviewId: string) => {
    try {
      const response = await doctorsApi.markReviewHelpful(doctorId, reviewId);
      
      if (response.success) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId 
            ? { ...review, helpful_count: review.helpful_count + 1 }
            : review
        ));
        toast({
          title: "Thành công",
          description: "Đã đánh dấu đánh giá hữu ích",
        });
      }
    } catch (error) {
      console.error('Error marking review helpful:', error);
      toast({
        title: "Lỗi",
        description: "Không thể đánh dấu đánh giá",
        variant: "destructive"
      });
    }
  };

  const renderStars = (rating: number, size = 'sm') => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading && reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Đánh giá từ bệnh nhân</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Xem phản hồi và đánh giá từ bệnh nhân
                </p>
              </div>
            </div>
            {stats && (
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.average_rating.toFixed(1)}</div>
                  <div className="flex items-center gap-1">
                    {renderStars(Math.round(stats.average_rating))}
                  </div>
                  <div className="text-xs text-gray-500">{stats.total_reviews} đánh giá</div>
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-semibold">{stats.total_reviews}</div>
                <div className="text-xs text-gray-600">Tổng đánh giá</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-semibold">{stats.satisfaction_rate}%</div>
                <div className="text-xs text-gray-600">Hài lòng</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
                <div className="text-lg font-semibold">{stats.recent_average_rating.toFixed(1)}</div>
                <div className="text-xs text-gray-600">Gần đây</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-semibold">{stats.recent_reviews_count}</div>
                <div className="text-xs text-gray-600">30 ngày qua</div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="mt-6">
              <h4 className="font-medium mb-3">Phân bố đánh giá</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = stats.rating_distribution[rating as keyof typeof stats.rating_distribution];
                  const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                  
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12">
                        <span className="text-sm">{rating}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Lọc theo:</span>
            <Button
              variant={ratingFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setRatingFilter(null)}
            >
              Tất cả
            </Button>
            {[5, 4, 3, 2, 1].map(rating => (
              <Button
                key={rating}
                variant={ratingFilter === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter(rating)}
                className="flex items-center gap-1"
              >
                {rating} <Star className="h-3 w-3" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chưa có đánh giá nào</p>
              <p className="text-sm text-gray-500 mt-1">
                Đánh giá sẽ xuất hiện sau khi bệnh nhân hoàn thành khám
              </p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${review.patients?.full_name || 'patient'}`}
                      alt={review.is_anonymous ? 'Ẩn danh' : review.patients?.full_name || 'Bệnh nhân'}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {review.is_anonymous ? 'ẨN' : getInitials(review.patients?.full_name || 'Patient')}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">
                          {review.is_anonymous ? 'Bệnh nhân ẩn danh' : review.patients?.full_name || 'Bệnh nhân'}
                        </h4>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Đã xác thực
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.review_date)}
                        </span>
                      </div>
                    </div>

                    {review.review_text && (
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {review.review_text}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkHelpful(review.id)}
                        className="flex items-center gap-2 text-gray-500 hover:text-blue-600"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Hữu ích ({review.helpful_count})
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Load More */}
        {hasMore && reviews.length > 0 && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => fetchReviews(false)}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Xem thêm đánh giá'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
