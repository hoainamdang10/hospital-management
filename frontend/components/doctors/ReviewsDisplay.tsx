"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  Star, 
  ThumbsUp, 
  MessageCircle, 
  Filter,
  TrendingUp,
  Users,
  Award,
  Calendar
} from "lucide-react"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "react-hot-toast"

interface Review {
  review_id: string
  doctor_id: string
  patient_id: string
  appointment_id?: string
  rating: number
  review_text?: string
  review_date: string
  is_anonymous: boolean
  is_verified: boolean
  helpful_count: number
  created_at: string
}

interface ReviewStats {
  total_reviews: number
  average_rating: number
  rating_distribution: {
    five_star: number
    four_star: number
    three_star: number
    two_star: number
    one_star: number
  }
  recent_reviews: Review[]
}

interface ReviewsDisplayProps {
  doctorId: string
  showStats?: boolean
  maxReviews?: number
}

export function ReviewsDisplay({ doctorId, showStats = true, maxReviews = 10 }: ReviewsDisplayProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState<number | null>(null)

  useEffect(() => {
    loadReviewsData()
  }, [doctorId])

  const loadReviewsData = async () => {
    try {
      setLoading(true)
      
      const [reviewsResponse, statsResponse] = await Promise.all([
        doctorsApi.getReviews(doctorId, 1, maxReviews),
        showStats ? doctorsApi.getReviewStats(doctorId) : Promise.resolve({ success: true, data: null })
      ])

      if (reviewsResponse.success) {
        setReviews(reviewsResponse.data)
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Không thể tải đánh giá')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-3 w-3',
      md: 'h-4 w-4',
      lg: 'h-5 w-5'
    }

    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const filteredReviews = filterRating 
    ? reviews.filter(review => review.rating === filterRating)
    : reviews

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      {showStats && stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.average_rating.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-600">Điểm trung bình</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_reviews}
                  </p>
                  <p className="text-sm text-gray-600">Tổng đánh giá</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.rating_distribution.five_star}
                  </p>
                  <p className="text-sm text-gray-600">Đánh giá 5 sao</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((stats.rating_distribution.five_star / stats.total_reviews) * 100)}%
                  </p>
                  <p className="text-sm text-gray-600">Tỷ lệ hài lòng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rating Distribution */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Phân bố đánh giá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.rating_distribution[`${rating === 5 ? 'five' : rating === 4 ? 'four' : rating === 3 ? 'three' : rating === 2 ? 'two' : 'one'}_star` as keyof typeof stats.rating_distribution]
                const percentage = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0

                return (
                  <div key={rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <span className="text-sm font-medium">{rating}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              Đánh giá từ bệnh nhân
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={filterRating === null ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(null)}
              >
                Tất cả
              </Button>
              {[5, 4, 3, 2, 1].map((rating) => (
                <Button
                  key={rating}
                  variant={filterRating === rating ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterRating(rating)}
                  className="flex items-center gap-1"
                >
                  {rating}
                  <Star className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length > 0 ? (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.review_id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {review.is_anonymous ? '?' : 'BN'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {review.is_anonymous ? 'Bệnh nhân ẩn danh' : 'Bệnh nhân'}
                        </span>
                        {review.is_verified && (
                          <Badge variant="secondary" className="text-xs">
                            Đã xác thực
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          {formatDate(review.review_date)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                        <span className="text-sm font-medium text-gray-700">
                          {review.rating}/5
                        </span>
                      </div>

                      {review.review_text && (
                        <p className="text-gray-700 text-sm leading-relaxed mb-3">
                          {review.review_text}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                          <ThumbsUp className="h-3 w-3" />
                          Hữu ích ({review.helpful_count})
                        </button>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Chưa có đánh giá nào</p>
              {filterRating && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilterRating(null)}
                  className="mt-2"
                >
                  Xem tất cả đánh giá
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
