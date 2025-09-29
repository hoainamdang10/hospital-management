"use client"

import { useState, useEffect } from "react"
import {
  Activity,
  Heart,
  Thermometer,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Plus,
  Edit,
  Download,
  Filter,
  BarChart3,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { toast } from "sonner"

interface HealthMetric {
  metric_id: string
  type: 'blood_pressure' | 'weight' | 'height' | 'temperature' | 'heart_rate' | 'blood_sugar' | 'cholesterol'
  value: string
  unit: string
  recorded_date: string
  recorded_by: 'patient' | 'doctor' | 'nurse'
  notes?: string
  status: 'normal' | 'warning' | 'critical'
  reference_range?: string
}

interface HealthGoal {
  goal_id: string
  type: string
  target_value: number
  current_value: number
  unit: string
  deadline: string
  status: 'active' | 'completed' | 'paused'
  progress: number
}

interface MedicalEvent {
  event_id: string
  type: 'appointment' | 'prescription' | 'lab_result' | 'surgery' | 'vaccination'
  title: string
  description: string
  date: string
  doctor_name?: string
  department?: string
  status: 'completed' | 'upcoming' | 'cancelled'
}

// Mock data
const mockMetrics: HealthMetric[] = [
  {
    metric_id: "1",
    type: "blood_pressure",
    value: "120/80",
    unit: "mmHg",
    recorded_date: "2025-01-03",
    recorded_by: "patient",
    status: "normal",
    reference_range: "90-120/60-80"
  },
  {
    metric_id: "2",
    type: "weight",
    value: "68.5",
    unit: "kg",
    recorded_date: "2025-01-03",
    recorded_by: "patient",
    status: "normal",
    reference_range: "60-75"
  },
  {
    metric_id: "3",
    type: "heart_rate",
    value: "72",
    unit: "bpm",
    recorded_date: "2025-01-02",
    recorded_by: "doctor",
    status: "normal",
    reference_range: "60-100"
  },
  {
    metric_id: "4",
    type: "blood_sugar",
    value: "95",
    unit: "mg/dL",
    recorded_date: "2025-01-01",
    recorded_by: "patient",
    status: "normal",
    reference_range: "70-100"
  }
]

const mockGoals: HealthGoal[] = [
  {
    goal_id: "1",
    type: "Giảm cân",
    target_value: 65,
    current_value: 68.5,
    unit: "kg",
    deadline: "2025-03-01",
    status: "active",
    progress: 30
  },
  {
    goal_id: "2",
    type: "Huyết áp",
    target_value: 120,
    current_value: 125,
    unit: "mmHg",
    deadline: "2025-02-15",
    status: "active",
    progress: 60
  }
]

const mockEvents: MedicalEvent[] = [
  {
    event_id: "1",
    type: "appointment",
    title: "Khám định kỳ Tim mạch",
    description: "Khám sức khỏe định kỳ với bác sĩ chuyên khoa tim mạch",
    date: "2025-01-05",
    doctor_name: "BS. Nguyễn Văn An",
    department: "Khoa Tim mạch",
    status: "upcoming"
  },
  {
    event_id: "2",
    type: "lab_result",
    title: "Kết quả xét nghiệm máu",
    description: "Xét nghiệm tổng quát: Công thức máu, sinh hóa máu",
    date: "2025-01-02",
    doctor_name: "BS. Trần Thị Bình",
    status: "completed"
  },
  {
    event_id: "3",
    type: "prescription",
    title: "Đơn thuốc điều trị",
    description: "Thuốc hỗ trợ tim mạch và vitamin",
    date: "2024-12-28",
    doctor_name: "BS. Nguyễn Văn An",
    status: "completed"
  }
]

const metricTypes = [
  { id: 'blood_pressure', name: 'Huyết áp', icon: Heart, unit: 'mmHg', color: 'text-red-600' },
  { id: 'weight', name: 'Cân nặng', icon: Scale, unit: 'kg', color: 'text-blue-600' },
  { id: 'height', name: 'Chiều cao', icon: Ruler, unit: 'cm', color: 'text-green-600' },
  { id: 'temperature', name: 'Nhiệt độ', icon: Thermometer, unit: '°C', color: 'text-orange-600' },
  { id: 'heart_rate', name: 'Nhịp tim', icon: Activity, unit: 'bpm', color: 'text-purple-600' },
  { id: 'blood_sugar', name: 'Đường huyết', icon: Target, unit: 'mg/dL', color: 'text-yellow-600' }
]

export default function HealthHistoryPage() {
  const { user, loading } = useEnhancedAuth()
  const [activeTab, setActiveTab] = useState("metrics")
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [goals, setGoals] = useState<HealthGoal[]>([])
  const [events, setEvents] = useState<MedicalEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetricType, setSelectedMetricType] = useState("all")
  const [dateRange, setDateRange] = useState("30")

  // New metric form
  const [newMetric, setNewMetric] = useState({
    type: "",
    value: "",
    notes: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // In real app, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMetrics(mockMetrics)
        setGoals(mockGoals)
        setEvents(mockEvents)
      } catch (error) {
        console.error('Error fetching health history:', error)
        setMetrics(mockMetrics)
        setGoals(mockGoals)
        setEvents(mockEvents)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredMetrics = metrics.filter(metric => {
    if (selectedMetricType === "all") return true
    return metric.type === selectedMetricType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'critical': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return CheckCircle
      case 'warning': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Info
    }
  }

  const getMetricIcon = (type: string) => {
    const metricType = metricTypes.find(m => m.id === type)
    return metricType?.icon || Activity
  }

  const getMetricName = (type: string) => {
    const metricType = metricTypes.find(m => m.id === type)
    return metricType?.name || type
  }

  const handleAddMetric = async () => {
    if (!newMetric.type || !newMetric.value) {
      toast.error("Vui lòng điền đầy đủ thông tin")
      return
    }

    try {
      const metric: HealthMetric = {
        metric_id: Date.now().toString(),
        type: newMetric.type as any,
        value: newMetric.value,
        unit: metricTypes.find(m => m.id === newMetric.type)?.unit || "",
        recorded_date: new Date().toISOString().split('T')[0],
        recorded_by: "patient",
        status: "normal", // In real app, calculate based on reference ranges
        notes: newMetric.notes
      }

      setMetrics(prev => [metric, ...prev])
      setNewMetric({ type: "", value: "", notes: "" })
      toast.success("Đã thêm chỉ số sức khỏe mới")
    } catch (error) {
      toast.error("Có lỗi xảy ra khi thêm chỉ số")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar
      case 'prescription': return Plus
      case 'lab_result': return BarChart3
      case 'surgery': return Activity
      case 'vaccination': return CheckCircle
      default: return Info
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'appointment': return 'Lịch khám'
      case 'prescription': return 'Đơn thuốc'
      case 'lab_result': return 'Xét nghiệm'
      case 'surgery': return 'Phẫu thuật'
      case 'vaccination': return 'Tiêm chủng'
      default: return type
    }
  }

  if (loading || isLoading) {
    return (
      <PatientLayout title="Lịch sử sức khỏe" activePage="health-history">
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
    <PatientLayout title="Lịch sử sức khỏe" activePage="health-history">
      {/* Health Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metricTypes.slice(0, 4).map((metricType) => {
          const IconComponent = metricType.icon
          const latestMetric = metrics.find(m => m.type === metricType.id)
          return (
            <Card key={metricType.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100`}>
                    <IconComponent className={`w-5 h-5 ${metricType.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600">{metricType.name}</p>
                    <p className="font-bold">
                      {latestMetric ? `${latestMetric.value} ${latestMetric.unit}` : '--'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metrics">Chỉ số sức khỏe</TabsTrigger>
          <TabsTrigger value="goals">Mục tiêu</TabsTrigger>
          <TabsTrigger value="timeline">Dòng thời gian</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>

        {/* Health Metrics */}
        <TabsContent value="metrics">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Chỉ số sức khỏe</h2>
              <div className="flex gap-2">
                <Select value={selectedMetricType} onValueChange={setSelectedMetricType}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Lọc theo loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {metricTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm chỉ số
                </Button>
              </div>
            </div>

            {/* Add New Metric Form */}
            <Card>
              <CardHeader>
                <CardTitle>Thêm chỉ số sức khỏe mới</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label>Loại chỉ số</Label>
                    <Select value={newMetric.type} onValueChange={(value) => 
                      setNewMetric(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại chỉ số" />
                      </SelectTrigger>
                      <SelectContent>
                        {metricTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name} ({type.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Giá trị</Label>
                    <Input
                      placeholder="Nhập giá trị"
                      value={newMetric.value}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Ghi chú (tùy chọn)</Label>
                    <Input
                      placeholder="Ghi chú thêm"
                      value={newMetric.notes}
                      onChange={(e) => setNewMetric(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleAddMetric} className="bg-blue-600 hover:bg-blue-700">
                  Thêm chỉ số
                </Button>
              </CardContent>
            </Card>

            {/* Metrics List */}
            <div className="grid gap-4">
              {filteredMetrics.map((metric) => {
                const IconComponent = getMetricIcon(metric.type)
                const StatusIcon = getStatusIcon(metric.status)
                return (
                  <Card key={metric.metric_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <IconComponent className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{getMetricName(metric.type)}</h3>
                            <p className="text-2xl font-bold">
                              {metric.value} <span className="text-sm text-gray-600">{metric.unit}</span>
                            </p>
                            {metric.reference_range && (
                              <p className="text-sm text-gray-600">
                                Bình thường: {metric.reference_range} {metric.unit}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={`${getStatusColor(metric.status)} mb-2`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {metric.status === 'normal' ? 'Bình thường' : 
                             metric.status === 'warning' ? 'Cảnh báo' : 'Nguy hiểm'}
                          </Badge>
                          <p className="text-sm text-gray-600">
                            {formatDate(metric.recorded_date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ghi nhận bởi: {metric.recorded_by === 'patient' ? 'Bệnh nhân' : 'Bác sĩ'}
                          </p>
                        </div>
                      </div>
                      {metric.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{metric.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* Health Goals */}
        <TabsContent value="goals">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mục tiêu sức khỏe</h2>
              <Button className="bg-green-600 hover:bg-green-700">
                <Target className="w-4 h-4 mr-2" />
                Thêm mục tiêu
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {goals.map((goal) => (
                <Card key={goal.goal_id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg">{goal.type}</h3>
                      <Badge variant={goal.status === 'active' ? 'default' : 'secondary'}>
                        {goal.status === 'active' ? 'Đang thực hiện' : 
                         goal.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Hiện tại: {goal.current_value} {goal.unit}</span>
                        <span>Mục tiêu: {goal.target_value} {goal.unit}</span>
                      </div>
                      
                      <Progress value={goal.progress} className="h-2" />
                      
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{goal.progress}% hoàn thành</span>
                        <span>Hạn: {formatDate(goal.deadline)}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline">
                        <Edit className="w-3 h-3 mr-1" />
                        Chỉnh sửa
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="w-3 h-3 mr-1" />
                        Xem tiến độ
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Medical Timeline */}
        <TabsContent value="timeline">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dòng thời gian y tế</h2>
            
            <div className="space-y-4">
              {events.map((event, index) => {
                const IconComponent = getEventIcon(event.type)
                return (
                  <div key={event.event_id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`p-2 rounded-full ${
                        event.status === 'upcoming' ? 'bg-blue-100' : 
                        event.status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${
                          event.status === 'upcoming' ? 'text-blue-600' : 
                          event.status === 'completed' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      {index < events.length - 1 && (
                        <div className="w-px h-16 bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    
                    <Card className="flex-1">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">
                            {getEventTypeLabel(event.type)}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <h3 className="font-medium mb-1">{event.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        {event.doctor_name && (
                          <p className="text-sm text-gray-500">
                            Bác sĩ: {event.doctor_name}
                            {event.department && ` - ${event.department}`}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </TabsContent>

        {/* Health Reports */}
        <TabsContent value="reports">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Báo cáo sức khỏe</h2>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Download className="w-4 h-4 mr-2" />
                Xuất báo cáo
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5" />
                    Xu hướng chỉ số
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Huyết áp</span>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Cải thiện</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Cân nặng</span>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">Giảm</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nhịp tim</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        <span className="text-blue-600">Ổn định</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tiến độ mục tiêu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Giảm cân</span>
                        <span>30%</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Kiểm soát huyết áp</span>
                        <span>60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Tóm tắt sức khỏe tháng này</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">85%</div>
                    <p className="text-sm text-gray-600">Chỉ số bình thường</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">12</div>
                    <p className="text-sm text-gray-600">Lần ghi nhận</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">2</div>
                    <p className="text-sm text-gray-600">Mục tiêu đang thực hiện</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </PatientLayout>
  )
}
