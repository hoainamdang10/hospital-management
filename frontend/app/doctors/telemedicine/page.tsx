"use client"

import { useState, useEffect } from "react"
import {
  Video,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  User,
  Monitor,
  Wifi,
  Camera,
  Mic,
  MicOff,
  VideoOff,
  PhoneOff,
  Settings,
  FileText,
  Upload,
  Download,
  Star,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  MoreVertical,
  Users,
  Activity,
  TrendingUp
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { toast } from "sonner"

interface TelemedicineSession {
  session_id: string
  patient_id: string
  patient_name: string
  patient_age: number
  patient_avatar?: string
  scheduled_time: string
  duration: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  session_type: 'video' | 'audio' | 'chat'
  symptoms: string
  notes?: string
  prescription_id?: string
  follow_up_required?: boolean
  consultation_fee: number
}

interface SessionStats {
  total_sessions: number
  completed_today: number
  upcoming_today: number
  total_revenue: number
  average_rating: number
  total_patients: number
}

// Mock data
const mockSessions: TelemedicineSession[] = [
  {
    session_id: "1",
    patient_id: "1",
    patient_name: "Nguyễn Văn A",
    patient_age: 45,
    scheduled_time: "2025-01-04T10:00:00",
    duration: 30,
    status: "scheduled",
    session_type: "video",
    symptoms: "Đau ngực, khó thở",
    consultation_fee: 300000
  },
  {
    session_id: "2",
    patient_id: "2",
    patient_name: "Trần Thị B",
    patient_age: 32,
    scheduled_time: "2025-01-04T14:30:00",
    duration: 45,
    status: "scheduled",
    session_type: "video",
    symptoms: "Kiểm tra định kỳ",
    consultation_fee: 250000
  },
  {
    session_id: "3",
    patient_id: "3",
    patient_name: "Lê Văn C",
    patient_age: 28,
    scheduled_time: "2025-01-03T16:00:00",
    duration: 30,
    status: "completed",
    session_type: "video",
    symptoms: "Tư vấn kết quả xét nghiệm",
    notes: "Kết quả bình thường, tiếp tục theo dõi",
    consultation_fee: 200000,
    follow_up_required: false
  },
  {
    session_id: "4",
    patient_id: "4",
    patient_name: "Phạm Thị D",
    patient_age: 55,
    scheduled_time: "2025-01-03T11:30:00",
    duration: 60,
    status: "completed",
    session_type: "video",
    symptoms: "Tăng huyết áp, đau đầu",
    notes: "Điều chỉnh thuốc huyết áp, tái khám sau 2 tuần",
    consultation_fee: 350000,
    follow_up_required: true
  }
]

const mockStats: SessionStats = {
  total_sessions: 156,
  completed_today: 3,
  upcoming_today: 2,
  total_revenue: 45600000,
  average_rating: 4.8,
  total_patients: 89
}

export default function DoctorTelemedicinePage() {
  const { user, loading } = useEnhancedAuth()
  const [activeTab, setActiveTab] = useState("today")
  const [sessions, setSessions] = useState<TelemedicineSession[]>([])
  const [stats, setStats] = useState<SessionStats>(mockStats)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string>("")
  const [sessionNotes, setSessionNotes] = useState("")
  const [followUpRequired, setFollowUpRequired] = useState(false)

  // Mock device status
  const [deviceStatus, setDeviceStatus] = useState({
    camera: true,
    microphone: true,
    internet: true
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // In real app, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setSessions(mockSessions)
        setStats(mockStats)
      } catch (error) {
        console.error('Error fetching telemedicine data:', error)
        setSessions(mockSessions)
        setStats(mockStats)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.scheduled_time).toDateString()
    const today = new Date().toDateString()
    return sessionDate === today
  })

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  const handleStartSession = (sessionId: string) => {
    // In real app, start video call
    toast.success("Bắt đầu phiên tư vấn")
    setSessions(prev => prev.map(s => 
      s.session_id === sessionId 
        ? { ...s, status: 'active' as const }
        : s
    ))
  }

  const handleCompleteSession = async (sessionId: string) => {
    if (!sessionNotes.trim()) {
      toast.error("Vui lòng nhập ghi chú cho phiên tư vấn")
      return
    }

    try {
      setSessions(prev => prev.map(s => 
        s.session_id === sessionId 
          ? { 
              ...s, 
              status: 'completed' as const,
              notes: sessionNotes,
              follow_up_required: followUpRequired
            }
          : s
      ))
      
      setSessionNotes("")
      setFollowUpRequired(false)
      setSelectedSession("")
      toast.success("Đã hoàn thành phiên tư vấn")
    } catch (error) {
      toast.error("Có lỗi xảy ra khi hoàn thành phiên tư vấn")
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const getSessionTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'audio': return Phone
      case 'chat': return MessageCircle
      default: return Video
    }
  }

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Video call'
      case 'audio': return 'Cuộc gọi'
      case 'chat': return 'Chat'
      default: return 'Video call'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch'
      case 'active': return 'Đang diễn ra'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      default: return status
    }
  }

  if (loading || isLoading) {
    return (
      <DoctorLayout title="Telemedicine" activePage="telemedicine">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout title="Tư vấn từ xa" activePage="telemedicine">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Hôm nay</p>
                <p className="font-bold text-lg">{stats.completed_today}/{stats.upcoming_today + stats.completed_today}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng phiên</p>
                <p className="font-bold text-lg">{stats.total_sessions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bệnh nhân</p>
                <p className="font-bold text-lg">{stats.total_patients}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đánh giá</p>
                <p className="font-bold text-lg">{stats.average_rating}/5.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Device Status Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Trạng thái thiết bị
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${deviceStatus.camera ? 'bg-green-100' : 'bg-red-100'}`}>
                <Camera className={`w-5 h-5 ${deviceStatus.camera ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium">Camera</p>
                <p className={`text-sm ${deviceStatus.camera ? 'text-green-600' : 'text-red-600'}`}>
                  {deviceStatus.camera ? 'Hoạt động tốt' : 'Không khả dụng'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${deviceStatus.microphone ? 'bg-green-100' : 'bg-red-100'}`}>
                <Mic className={`w-5 h-5 ${deviceStatus.microphone ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium">Microphone</p>
                <p className={`text-sm ${deviceStatus.microphone ? 'text-green-600' : 'text-red-600'}`}>
                  {deviceStatus.microphone ? 'Hoạt động tốt' : 'Không khả dụng'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${deviceStatus.internet ? 'bg-green-100' : 'bg-red-100'}`}>
                <Wifi className={`w-5 h-5 ${deviceStatus.internet ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <p className="font-medium">Kết nối Internet</p>
                <p className={`text-sm ${deviceStatus.internet ? 'text-green-600' : 'text-red-600'}`}>
                  {deviceStatus.internet ? 'Ổn định' : 'Không ổn định'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hôm nay</TabsTrigger>
          <TabsTrigger value="upcoming">Sắp tới</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Today's Sessions */}
        <TabsContent value="today">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Phiên tư vấn hôm nay</h2>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {todaySessions.length} phiên
                </Badge>
                <Badge variant="outline">
                  {formatCurrency(todaySessions.reduce((sum, s) => sum + s.consultation_fee, 0))}
                </Badge>
              </div>
            </div>

            {todaySessions.length > 0 ? (
              <div className="grid gap-6">
                {todaySessions.map((session) => {
                  const SessionIcon = getSessionTypeIcon(session.session_type)
                  return (
                    <Card key={session.session_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={session.patient_avatar} />
                              <AvatarFallback>
                                <User className="w-6 h-6" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-lg">{session.patient_name}</h3>
                              <p className="text-gray-600">{session.patient_age} tuổi</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(session.status)}>
                              {getStatusLabel(session.status)}
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatCurrency(session.consultation_fee)}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDateTime(session.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <SessionIcon className="w-4 h-4" />
                            <span>{getSessionTypeLabel(session.session_type)} - {session.duration} phút</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <FileText className="w-4 h-4" />
                            <span>{session.symptoms}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          {session.status === 'scheduled' && (
                            <Button 
                              onClick={() => handleStartSession(session.session_id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Bắt đầu
                            </Button>
                          )}
                          {session.status === 'active' && (
                            <Button 
                              onClick={() => setSelectedSession(session.session_id)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Video className="w-4 h-4 mr-2" />
                              Tham gia
                            </Button>
                          )}
                          <Button variant="outline">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Nhắn tin
                          </Button>
                          <Button variant="outline">
                            <FileText className="w-4 h-4 mr-2" />
                            Hồ sơ
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Không có phiên tư vấn nào hôm nay
                  </h3>
                  <p className="text-gray-500">
                    Các phiên tư vấn đã lên lịch sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Phiên tư vấn sắp tới</h2>

            {upcomingSessions.length > 0 ? (
              <div className="grid gap-4">
                {upcomingSessions.map((session) => {
                  const SessionIcon = getSessionTypeIcon(session.session_type)
                  return (
                    <Card key={session.session_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={session.patient_avatar} />
                              <AvatarFallback>
                                <User className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-medium">{session.patient_name}</h3>
                              <p className="text-sm text-gray-600">{session.patient_age} tuổi</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatDateTime(session.scheduled_time)}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <SessionIcon className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">{session.duration} phút</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{session.symptoms}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Không có phiên tư vấn nào sắp tới
                  </h3>
                  <p className="text-gray-500">
                    Các phiên tư vấn được đặt lịch sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Lịch sử tư vấn</h2>

            {completedSessions.length > 0 ? (
              <div className="space-y-4">
                {completedSessions.map((session) => {
                  const SessionIcon = getSessionTypeIcon(session.session_type)
                  return (
                    <Card key={session.session_id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={session.patient_avatar} />
                              <AvatarFallback>
                                <User className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold">{session.patient_name}</h3>
                              <p className="text-gray-600">{session.patient_age} tuổi</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Hoàn thành
                            </Badge>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatCurrency(session.consultation_fee)}
                            </p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(session.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <SessionIcon className="w-4 h-4" />
                            <span>{getSessionTypeLabel(session.session_type)} - {session.duration} phút</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <p className="text-sm"><strong>Triệu chứng:</strong> {session.symptoms}</p>
                          {session.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm"><strong>Ghi chú:</strong></p>
                              <p className="text-sm text-gray-700">{session.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Button>
                          {session.prescription_id && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Đơn thuốc
                            </Button>
                          )}
                          {session.follow_up_required && (
                            <Badge variant="outline" className="border-orange-500 text-orange-600">
                              Cần tái khám
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Chưa có lịch sử tư vấn
                  </h3>
                  <p className="text-gray-500">
                    Các phiên tư vấn đã hoàn thành sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Completion Modal */}
      {selectedSession && (
        <Card className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Hoàn thành phiên tư vấn</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Ghi chú phiên tư vấn *</Label>
                <Textarea
                  id="notes"
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Nhập ghi chú về phiên tư vấn..."
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                />
                <Label htmlFor="followUp">Cần tái khám</Label>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleCompleteSession(selectedSession)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Hoàn thành
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSession("")}
                  className="flex-1"
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </DoctorLayout>
  )
}
