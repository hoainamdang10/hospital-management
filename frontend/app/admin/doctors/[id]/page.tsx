"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Clock,
  Star,
  Briefcase,
  GraduationCap,
  Award,
  Stethoscope,
  Edit,
  ArrowLeft
} from "lucide-react"
import { doctorsApi } from "@/lib/api/doctors"
import { ScheduleManager } from "@/components/doctors/ScheduleManager"
import { ReviewsDisplay } from "@/components/doctors/ReviewsDisplay"
import { ShiftManager } from "@/components/doctors/ShiftManager"
import { ExperienceManager } from "@/components/doctors/ExperienceManager"
import { toast } from "react-hot-toast"
import Link from "next/link"

interface DoctorProfile {
  doctor_id: string
  full_name: string
  email: string
  phone_number?: string
  specialty: string
  license_number: string
  department_id: string
  bio?: string
  experience_years?: number
  consultation_fee?: number
  languages_spoken?: string[]
  certifications?: string[]
  awards?: string[]
  research_interests?: string[]
  status: string
  created_at: string
  schedule?: any[]
  review_stats?: any
  experiences?: any[]
  current_shifts?: any[]
}

export default function DoctorProfilePage() {
  const params = useParams()
  const doctorId = params.id as string
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (doctorId) {
      loadDoctorProfile()
    }
  }, [doctorId])

  const loadDoctorProfile = async () => {
    try {
      setLoading(true)
      const response = await doctorsApi.getProfile(doctorId)
      
      if (response.success) {
        setDoctor(response.data)
      } else {
        toast.error('Không thể tải thông tin bác sĩ')
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error)
      toast.error('Lỗi khi tải thông tin bác sĩ')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy bác sĩ</h2>
            <p className="text-gray-600 mb-4">Bác sĩ với ID {doctorId} không tồn tại.</p>
            <Link href="/admin/doctors">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại danh sách
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/doctors">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Hồ sơ bác sĩ</h1>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Edit className="h-4 w-4 mr-2" />
          Chỉnh sửa
        </Button>
      </div>

      {/* Doctor Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${doctor.full_name}`} />
              <AvatarFallback className="text-lg">
                {doctor.full_name ? doctor.full_name.split(' ').map(n => n[0]).join('') : 'DR'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{doctor.full_name}</h2>
                <Badge variant={doctor.status === 'active' ? 'default' : 'secondary'}>
                  {doctor.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Stethoscope className="h-4 w-4" />
                  <span>{doctor.specialization}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{doctor.email || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{doctor.phone_number || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Award className="h-4 w-4" />
                  <span>Giấy phép: {doctor.license_number}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{doctor.experience_years || 0} năm kinh nghiệm</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia: {formatDate(doctor.created_at)}</span>
                </div>
              </div>

              {doctor.bio && (
                <div className="mt-4">
                  <p className="text-gray-700 leading-relaxed">{doctor.bio}</p>
                </div>
              )}

              {/* Quick Stats */}
              {doctor.review_stats && (
                <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{doctor.review_stats.average_rating?.toFixed(1) || 0}</span>
                    <span className="text-sm text-gray-600">({doctor.review_stats.total_reviews || 0} đánh giá)</span>
                  </div>
                  {doctor.consultation_fee && (
                    <div className="text-sm text-gray-600">
                      Phí tư vấn: <span className="font-medium">{doctor.consultation_fee.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  )}
                  {doctor.languages_spoken && doctor.languages_spoken.length > 0 && (
                    <div className="text-sm text-gray-600">
                      Ngôn ngữ: <span className="font-medium">{doctor.languages_spoken.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="schedule">Lịch làm việc</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
          <TabsTrigger value="shifts">Ca trực</TabsTrigger>
          <TabsTrigger value="experience">Kinh nghiệm</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Certifications & Awards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Chứng chỉ & Giải thưởng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doctor.certifications && doctor.certifications.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Chứng chỉ:</h4>
                    <ul className="space-y-1">
                      {doctor.certifications.map((cert, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
                          {cert}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có chứng chỉ nào được thêm</p>
                )}

                {doctor.awards && doctor.awards.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-medium text-gray-900">Giải thưởng:</h4>
                    <ul className="space-y-1">
                      {doctor.awards.map((award, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 bg-yellow-500 rounded-full"></div>
                          {award}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Research Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                  Lĩnh vực nghiên cứu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doctor.research_interests && doctor.research_interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {doctor.research_interests.map((interest, index) => (
                      <Badge key={index} variant="outline">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Chưa có lĩnh vực nghiên cứu nào được thêm</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ReviewsDisplay doctorId={doctorId} showStats={true} maxReviews={5} />
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleManager doctorId={doctorId} onScheduleUpdate={loadDoctorProfile} />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsDisplay doctorId={doctorId} showStats={true} maxReviews={20} />
        </TabsContent>

        <TabsContent value="shifts">
          <ShiftManager doctorId={doctorId} departmentId={doctor.department_id} />
        </TabsContent>

        <TabsContent value="experience">
          <ExperienceManager doctorId={doctorId} editable={true} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
