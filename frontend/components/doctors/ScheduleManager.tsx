"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { 
  Clock, 
  Calendar, 
  Save, 
  RotateCcw, 
  Plus, 
  Trash2,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { doctorsApi } from "@/lib/api/doctors"
import { toast } from "react-hot-toast"

interface DoctorSchedule {
  schedule_id: string
  doctor_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
  break_start?: string
  break_end?: string
  max_appointments: number
  slot_duration: number
}

interface ScheduleManagerProps {
  doctorId: string
  onScheduleUpdate?: (schedules: DoctorSchedule[]) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Chủ nhật', short: 'CN' },
  { value: 1, label: 'Thứ hai', short: 'T2' },
  { value: 2, label: 'Thứ ba', short: 'T3' },
  { value: 3, label: 'Thứ tư', short: 'T4' },
  { value: 4, label: 'Thứ năm', short: 'T5' },
  { value: 5, label: 'Thứ sáu', short: 'T6' },
  { value: 6, label: 'Thứ bảy', short: 'T7' }
]

export function ScheduleManager({ doctorId, onScheduleUpdate }: ScheduleManagerProps) {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSchedules()
  }, [doctorId])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const response = await doctorsApi.getWeeklySchedule(doctorId)
      if (response.success) {
        setSchedules(response.data)
      } else {
        toast.error('Không thể tải lịch làm việc')
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast.error('Lỗi khi tải lịch làm việc')
    } finally {
      setLoading(false)
    }
  }

  const updateSchedule = (dayOfWeek: number, field: string, value: any) => {
    setSchedules(prev => {
      const updated = prev.map(schedule => {
        if (schedule.day_of_week === dayOfWeek) {
          return { ...schedule, [field]: value }
        }
        return schedule
      })
      setHasChanges(true)
      return updated
    })
  }

  const saveSchedules = async () => {
    try {
      setSaving(true)
      const scheduleUpdates = schedules.map(schedule => ({
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        is_available: schedule.is_available,
        break_start: schedule.break_start,
        break_end: schedule.break_end,
        max_appointments: schedule.max_appointments,
        slot_duration: schedule.slot_duration
      }))

      const response = await doctorsApi.updateSchedule(doctorId, scheduleUpdates)
      
      if (response.success) {
        toast.success('Lịch làm việc đã được cập nhật')
        setHasChanges(false)
        onScheduleUpdate?.(response.data)
      } else {
        toast.error('Không thể cập nhật lịch làm việc')
      }
    } catch (error) {
      console.error('Error saving schedules:', error)
      toast.error('Lỗi khi lưu lịch làm việc')
    } finally {
      setSaving(false)
    }
  }

  const resetChanges = () => {
    loadSchedules()
    setHasChanges(false)
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Lịch làm việc hàng tuần</h3>
          <p className="text-sm text-gray-600">Thiết lập thời gian làm việc cho từng ngày trong tuần</p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button onClick={resetChanges} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Hủy thay đổi
            </Button>
          )}
          <Button 
            onClick={saveSchedules} 
            disabled={!hasChanges || saving}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu lịch'}
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid gap-4">
        {DAYS_OF_WEEK.map(day => {
          const schedule = schedules.find(s => s.day_of_week === day.value)
          
          return (
            <Card key={day.value} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-medium">
                      {day.short}
                    </Badge>
                    <h4 className="font-medium text-gray-900">{day.label}</h4>
                  </div>
                  <Switch
                    checked={schedule?.is_available || false}
                    onCheckedChange={(checked) => updateSchedule(day.value, 'is_available', checked)}
                  />
                </div>

                {schedule?.is_available && (
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Working Hours */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Giờ làm việc</Label>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={schedule.start_time || '08:00'}
                          onChange={(e) => updateSchedule(day.value, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                        <span className="flex items-center text-gray-400">-</span>
                        <Input
                          type="time"
                          value={schedule.end_time || '17:00'}
                          onChange={(e) => updateSchedule(day.value, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Break Time */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Giờ nghỉ trưa</Label>
                      <div className="flex gap-2">
                        <Input
                          type="time"
                          value={schedule.break_start || '12:00'}
                          onChange={(e) => updateSchedule(day.value, 'break_start', e.target.value)}
                          className="text-sm"
                        />
                        <span className="flex items-center text-gray-400">-</span>
                        <Input
                          type="time"
                          value={schedule.break_end || '13:00'}
                          onChange={(e) => updateSchedule(day.value, 'break_end', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Max Appointments */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Số cuộc hẹn tối đa</Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={schedule.max_appointments || 10}
                        onChange={(e) => updateSchedule(day.value, 'max_appointments', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>

                    {/* Slot Duration */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-gray-600">Thời gian mỗi slot (phút)</Label>
                      <Input
                        type="number"
                        min="15"
                        max="120"
                        step="15"
                        value={schedule.slot_duration || 30}
                        onChange={(e) => updateSchedule(day.value, 'slot_duration', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}

                {!schedule?.is_available && (
                  <div className="text-center py-4 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Không làm việc</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Lưu ý:</p>
              <ul className="space-y-1 text-xs">
                <li>• Thời gian slot sẽ ảnh hưởng đến số lượng cuộc hẹn có thể đặt</li>
                <li>• Giờ nghỉ trưa sẽ không có cuộc hẹn nào được đặt</li>
                <li>• Thay đổi lịch làm việc sẽ ảnh hưởng đến các cuộc hẹn trong tương lai</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
