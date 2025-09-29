"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Moon,
  Sun,
  Sunset,
  Zap,
  BarChart3
} from "lucide-react"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "react-hot-toast"

interface DoctorShift {
  shift_id: string
  doctor_id: string
  shift_type: 'morning' | 'afternoon' | 'night' | 'emergency'
  shift_date: string
  start_time: string
  end_time: string
  department_id: string
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  is_emergency_shift: boolean
  notes?: string
  created_at: string
}

interface ShiftStats {
  total_shifts: number
  completed_shifts: number
  cancelled_shifts: number
  emergency_shifts: number
  total_hours: number
}

interface ShiftManagerProps {
  doctorId: string
  departmentId?: string
}

const SHIFT_TYPES = [
  { value: 'morning', label: 'Ca sáng', icon: Sun, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'afternoon', label: 'Ca chiều', icon: Sunset, color: 'bg-orange-100 text-orange-800' },
  { value: 'night', label: 'Ca tối', icon: Moon, color: 'bg-blue-100 text-blue-800' },
  { value: 'emergency', label: 'Ca cấp cứu', icon: Zap, color: 'bg-red-100 text-red-800' }
]

const STATUS_CONFIG = {
  scheduled: { label: 'Đã lên lịch', color: 'bg-gray-100 text-gray-800' },
  confirmed: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-800' }
}

export function ShiftManager({ doctorId, departmentId }: ShiftManagerProps) {
  const [shifts, setShifts] = useState<DoctorShift[]>([])
  const [upcomingShifts, setUpcomingShifts] = useState<DoctorShift[]>([])
  const [stats, setStats] = useState<ShiftStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newShift, setNewShift] = useState({
    shift_type: 'morning' as const,
    shift_date: '',
    start_time: '08:00',
    end_time: '16:00',
    department_id: departmentId || '',
    is_emergency_shift: false,
    notes: ''
  })

  useEffect(() => {
    loadShiftsData()
  }, [doctorId])

  const loadShiftsData = async () => {
    try {
      setLoading(true)
      
      const [shiftsResponse, upcomingResponse] = await Promise.all([
        doctorsApi.getShifts(doctorId, 1, 20),
        doctorsApi.getUpcomingShifts(doctorId, 14) // Next 2 weeks
      ])

      if (shiftsResponse.success) {
        setShifts(shiftsResponse.data)
      }

      if (upcomingResponse.success) {
        setUpcomingShifts(upcomingResponse.data)
      }

      // Load stats for current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      const statsResponse = await doctorsApi.getShiftStats(
        doctorId,
        startOfMonth.toISOString().split('T')[0],
        endOfMonth.toISOString().split('T')[0]
      )

      if (statsResponse.success) {
        setStats(statsResponse.data)
      }
    } catch (error) {
      console.error('Error loading shifts:', error)
      toast.error('Không thể tải dữ liệu ca trực')
    } finally {
      setLoading(false)
    }
  }

  const createShift = async () => {
    try {
      const shiftData = {
        doctor_id: doctorId,
        ...newShift,
        shift_date: new Date(newShift.shift_date)
      }

      const response = await doctorsApi.createShift(shiftData)
      
      if (response.success) {
        toast.success('Ca trực đã được tạo thành công')
        setShowCreateDialog(false)
        setNewShift({
          shift_type: 'morning',
          shift_date: '',
          start_time: '08:00',
          end_time: '16:00',
          department_id: departmentId || '',
          is_emergency_shift: false,
          notes: ''
        })
        loadShiftsData()
      } else {
        toast.error('Không thể tạo ca trực')
      }
    } catch (error) {
      console.error('Error creating shift:', error)
      toast.error('Lỗi khi tạo ca trực')
    }
  }

  const confirmShift = async (shiftId: string) => {
    try {
      const response = await doctorsApi.confirmShift(shiftId)
      
      if (response.success) {
        toast.success('Ca trực đã được xác nhận')
        loadShiftsData()
      } else {
        toast.error('Không thể xác nhận ca trực')
      }
    } catch (error) {
      console.error('Error confirming shift:', error)
      toast.error('Lỗi khi xác nhận ca trực')
    }
  }

  const getShiftTypeConfig = (type: string) => {
    return SHIFT_TYPES.find(t => t.value === type) || SHIFT_TYPES[0]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return timeString.slice(0, 5) // Remove seconds
  }

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
      {/* Statistics */}
      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_shifts}</p>
                  <p className="text-sm text-gray-600">Tổng ca trực</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_shifts}</p>
                  <p className="text-sm text-gray-600">Hoàn thành</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Zap className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.emergency_shifts}</p>
                  <p className="text-sm text-gray-600">Ca cấp cứu</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.total_hours)}</p>
                  <p className="text-sm text-gray-600">Tổng giờ</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_shifts > 0 ? Math.round((stats.completed_shifts / stats.total_shifts) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Tỷ lệ hoàn thành</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Shifts */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              Ca trực sắp tới
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo ca trực
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo ca trực mới</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Loại ca</Label>
                      <Select 
                        value={newShift.shift_type} 
                        onValueChange={(value: any) => setNewShift(prev => ({ ...prev, shift_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIFT_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Ngày trực</Label>
                      <Input
                        type="date"
                        value={newShift.shift_date}
                        onChange={(e) => setNewShift(prev => ({ ...prev, shift_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Giờ bắt đầu</Label>
                      <Input
                        type="time"
                        value={newShift.start_time}
                        onChange={(e) => setNewShift(prev => ({ ...prev, start_time: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Giờ kết thúc</Label>
                      <Input
                        type="time"
                        value={newShift.end_time}
                        onChange={(e) => setNewShift(prev => ({ ...prev, end_time: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={newShift.notes}
                      onChange={(e) => setNewShift(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Ghi chú về ca trực..."
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Hủy
                    </Button>
                    <Button onClick={createShift} className="bg-green-600 hover:bg-green-700">
                      Tạo ca trực
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingShifts.length > 0 ? (
            <div className="space-y-3">
              {upcomingShifts.map((shift) => {
                const typeConfig = getShiftTypeConfig(shift.shift_type)
                const statusConfig = STATUS_CONFIG[shift.status]
                const Icon = typeConfig.icon

                return (
                  <div key={shift.shift_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{typeConfig.label}</span>
                          <Badge className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                          {shift.is_emergency_shift && (
                            <Badge variant="destructive">Cấp cứu</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          {formatDate(shift.shift_date)} • {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </p>
                        {shift.notes && (
                          <p className="text-sm text-gray-500 mt-1">{shift.notes}</p>
                        )}
                      </div>
                    </div>
                    
                    {shift.status === 'scheduled' && (
                      <Button 
                        size="sm" 
                        onClick={() => confirmShift(shift.shift_id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Xác nhận
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Không có ca trực nào sắp tới</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
