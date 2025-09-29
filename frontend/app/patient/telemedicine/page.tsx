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
  Play
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { toast } from "sonner"

interface TelemedicineSession {
  session_id: string
  doctor_id: string
  doctor_name: string
  doctor_specialization: string
  scheduled_time: string
  duration: number
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  session_type: 'video' | 'audio' | 'chat'
  notes?: string
  prescription_id?: string
  follow_up_required?: boolean
}

interface Doctor {
  doctor_id: string
  name: string
  specialization: string
  rating: number
  experience_years: number
  available_slots: string[]
  consultation_fee: number
  languages: string[]
}

// Mock data
const mockSessions: TelemedicineSession[] = [
  {
    session_id: "1",
    doctor_id: "1",
    doctor_name: "BS. Nguyễn Văn An",
    doctor_specialization: "Tim mạch",
    scheduled_time: "2025-01-04T10:00:00",
    duration: 30,
    status: "scheduled",
    session_type: "video"
  },
  {
    session_id: "2",
    doctor_id: "2",
    doctor_name: "BS. Trần Thị Bình",
    doctor_specialization: "Nhi khoa",
    scheduled_time: "2025-01-03T14:30:00",
    duration: 45,
    status: "completed",
    session_type: "video",
    notes: "Khám định kỳ, sức khỏe tốt. Tiếp tục theo dõi.",
    follow_up_required: true
  }
]

const mockDoctors: Doctor[] = [
  {
    doctor_id: "1",
    name: "BS. Nguyễn Văn An",
    specialization: "Tim mạch",
    rating: 4.8,
    experience_years: 15,
    available_slots: ["09:00", "10:00", "14:00", "15:00"],
    consultation_fee: 300000,
    languages: ["Tiếng Việt", "English"]
  },
  {
    doctor_id: "2",
    name: "BS. Trần Thị Bình",
    specialization: "Nhi khoa",
    rating: 4.9,
    experience_years: 12,
    available_slots: ["08:00", "09:30", "14:30", "16:00"],
    consultation_fee: 250000,
    languages: ["Tiếng Việt"]
  }
]

export default function TelemedicinePage() {
  const { user, loading } = useEnhancedAuth()
  const [activeTab, setActiveTab] = useState("upcoming")
  const [sessions, setSessions] = useState<TelemedicineSession[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [sessionType, setSessionType] = useState<"video" | "audio" | "chat">("video")
  const [symptoms, setSymptoms] = useState("")
  const [isBooking, setIsBooking] = useState(false)

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
        setDoctors(mockDoctors)
      } catch (error) {
        console.error('Error fetching telemedicine data:', error)
        setSessions(mockSessions)
        setDoctors(mockDoctors)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled')
  const completedSessions = sessions.filter(s => s.status === 'completed')

  const handleBookSession = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    setIsBooking(true)
    try {
      // In real app, call API to book session
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newSession: TelemedicineSession = {
        session_id: Date.now().toString(),
        doctor_id: selectedDoctor,
        doctor_name: doctors.find(d => d.doctor_id === selectedDoctor)?.name || "",
        doctor_specialization: doctors.find(d => d.doctor_id === selectedDoctor)?.specialization || "",
        scheduled_time: `${selectedDate}T${selectedTime}:00`,
        duration: 30,
        status: "scheduled",
        session_type: sessionType
      }

      setSessions(prev => [...prev, newSession])
      toast.success("Đặt lịch tư vấn từ xa thành công!")
      
      // Reset form
      setSelectedDoctor("")
      setSelectedDate("")
      setSelectedTime("")
      setSymptoms("")
      setActiveTab("upcoming")
    } catch (error) {
      toast.error("Có lỗi xảy ra khi đặt lịch")
    } finally {
      setIsBooking(false)
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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

  // Get next 7 days for date selection
  const getAvailableDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('vi-VN', { 
          weekday: 'short', 
          day: 'numeric', 
          month: 'numeric' 
        })
      })
    }
    return dates
  }

  if (loading || isLoading) {
    return (
      <PatientLayout title="Telemedicine" activePage="telemedicine">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout title="Khám bệnh từ xa" activePage="telemedicine">
      {/* Device Status Check */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Kiểm tra thiết bị
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
          <TabsTrigger value="upcoming">Lịch sắp tới</TabsTrigger>
          <TabsTrigger value="book">Đặt lịch mới</TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        {/* Upcoming Sessions */}
        <TabsContent value="upcoming">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Lịch tư vấn sắp tới</h2>
              <Button onClick={() => setActiveTab("book")} className="bg-blue-600 hover:bg-blue-700">
                <Video className="w-4 h-4 mr-2" />
                Đặt lịch mới
              </Button>
            </div>

            {upcomingSessions.length > 0 ? (
              <div className="grid gap-6">
                {upcomingSessions.map((session) => {
                  const SessionIcon = getSessionTypeIcon(session.session_type)
                  return (
                    <Card key={session.session_id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <SessionIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg">{session.doctor_name}</h3>
                              <p className="text-gray-600">{session.doctor_specialization}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="border-blue-500 text-blue-600">
                            {getSessionTypeLabel(session.session_type)}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(session.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration} phút</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Play className="w-4 h-4 mr-2" />
                            Tham gia
                          </Button>
                          <Button variant="outline">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Nhắn tin
                          </Button>
                          <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Cài đặt
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
                  <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">
                    Chưa có lịch tư vấn nào
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Đặt lịch tư vấn từ xa với bác sĩ chuyên khoa
                  </p>
                  <Button onClick={() => setActiveTab("book")} className="bg-blue-600 hover:bg-blue-700">
                    <Video className="w-4 h-4 mr-2" />
                    Đặt lịch ngay
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Book New Session */}
        <TabsContent value="book">
          <Card>
            <CardHeader>
              <CardTitle>Đặt lịch tư vấn từ xa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Type Selection */}
              <div>
                <Label className="text-base font-medium mb-3 block">Loại tư vấn</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { type: 'video', icon: Video, label: 'Video call', desc: 'Tư vấn qua video' },
                    { type: 'audio', icon: Phone, label: 'Cuộc gọi', desc: 'Tư vấn qua điện thoại' },
                    { type: 'chat', icon: MessageCircle, label: 'Chat', desc: 'Tư vấn qua tin nhắn' }
                  ].map((option) => {
                    const IconComponent = option.icon
                    return (
                      <Button
                        key={option.type}
                        variant={sessionType === option.type ? "default" : "outline"}
                        onClick={() => setSessionType(option.type as any)}
                        className={`h-auto p-4 flex flex-col gap-2 ${
                          sessionType === option.type ? "bg-blue-600" : ""
                        }`}
                      >
                        <IconComponent className="w-6 h-6" />
                        <div className="text-center">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs opacity-80">{option.desc}</div>
                        </div>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Doctor Selection */}
              <div>
                <Label htmlFor="doctor">Chọn bác sĩ</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bác sĩ tư vấn" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.doctor_id} value={doctor.doctor_id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="font-medium">{doctor.name}</div>
                            <div className="text-sm text-gray-600">{doctor.specialization}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{doctor.rating}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatCurrency(doctor.consultation_fee)}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div>
                <Label>Chọn ngày</Label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                  {getAvailableDates().map((date) => (
                    <Button
                      key={date.value}
                      variant={selectedDate === date.value ? "default" : "outline"}
                      onClick={() => setSelectedDate(date.value)}
                      className={`h-auto p-3 flex flex-col ${
                        selectedDate === date.value ? "bg-blue-600" : ""
                      }`}
                    >
                      <span className="text-xs">{date.label.split(' ')[0]}</span>
                      <span className="font-medium">{date.label.split(' ')[1]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDoctor && selectedDate && (
                <div>
                  <Label>Chọn giờ</Label>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-2">
                    {doctors.find(d => d.doctor_id === selectedDoctor)?.available_slots.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        onClick={() => setSelectedTime(time)}
                        className={selectedTime === time ? "bg-blue-600" : ""}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Symptoms */}
              <div>
                <Label htmlFor="symptoms">Triệu chứng hoặc lý do tư vấn</Label>
                <Textarea
                  id="symptoms"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Mô tả ngắn gọn triệu chứng hoặc lý do cần tư vấn..."
                  rows={4}
                />
              </div>

              {/* Booking Summary */}
              {selectedDoctor && selectedDate && selectedTime && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Thông tin đặt lịch:</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Bác sĩ:</strong> {doctors.find(d => d.doctor_id === selectedDoctor)?.name}</p>
                    <p><strong>Loại tư vấn:</strong> {getSessionTypeLabel(sessionType)}</p>
                    <p><strong>Thời gian:</strong> {selectedDate} lúc {selectedTime}</p>
                    <p><strong>Phí tư vấn:</strong> {formatCurrency(doctors.find(d => d.doctor_id === selectedDoctor)?.consultation_fee || 0)}</p>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleBookSession}
                disabled={!selectedDoctor || !selectedDate || !selectedTime || isBooking}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isBooking ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
              </Button>
            </CardContent>
          </Card>
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
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <SessionIcon className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-bold">{session.doctor_name}</h3>
                              <p className="text-gray-600">{session.doctor_specialization}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(session.scheduled_time)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{session.duration} phút</span>
                          </div>
                        </div>

                        {session.notes && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-sm"><strong>Ghi chú của bác sĩ:</strong></p>
                            <p className="text-sm text-gray-700">{session.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Xem báo cáo
                          </Button>
                          {session.prescription_id && (
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Tải đơn thuốc
                            </Button>
                          )}
                          {session.follow_up_required && (
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                              <Calendar className="w-4 h-4 mr-2" />
                              Đặt lịch tái khám
                            </Button>
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
                    Các buổi tư vấn đã hoàn thành sẽ hiển thị ở đây
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </PatientLayout>
  )
}
