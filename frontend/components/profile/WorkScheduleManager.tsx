'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast-provider';
import { doctorsApi } from '@/lib/api/doctors';
import { 
  Clock, 
  Calendar, 
  Save, 
  RotateCcw, 
  Users, 
  Coffee,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface WorkSchedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  lunch_start_time?: string;
  lunch_end_time?: string;
  max_patients_per_day: number;
  is_active: boolean;
}

interface WorkScheduleManagerProps {
  doctorId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Thứ 2', short: 'T2' },
  { value: 2, label: 'Thứ 3', short: 'T3' },
  { value: 3, label: 'Thứ 4', short: 'T4' },
  { value: 4, label: 'Thứ 5', short: 'T5' },
  { value: 5, label: 'Thứ 6', short: 'T6' },
  { value: 6, label: 'Thứ 7', short: 'T7' },
  { value: 0, label: 'Chủ nhật', short: 'CN' }
];

export default function WorkScheduleManager({ doctorId }: WorkScheduleManagerProps) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();
  }, [doctorId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getWorkSchedule(doctorId);
      
      if (response.success && response.data) {
        setSchedules(response.data);
      } else {
        // Initialize with default schedule if none exists
        initializeDefaultSchedule();
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải lịch làm việc",
        variant: "destructive"
      });
      initializeDefaultSchedule();
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultSchedule = () => {
    const defaultSchedules: WorkSchedule[] = DAYS_OF_WEEK.slice(0, 5).map(day => ({
      day_of_week: day.value,
      start_time: '08:00',
      end_time: '17:00',
      lunch_start_time: '12:00',
      lunch_end_time: '13:00',
      max_patients_per_day: 20,
      is_active: true
    }));
    setSchedules(defaultSchedules);
  };

  const updateSchedule = (dayOfWeek: number, field: keyof WorkSchedule, value: any) => {
    setSchedules(prev => {
      const updated = prev.map(schedule => 
        schedule.day_of_week === dayOfWeek 
          ? { ...schedule, [field]: value }
          : schedule
      );
      
      // If day doesn't exist, add it
      if (!updated.find(s => s.day_of_week === dayOfWeek)) {
        updated.push({
          day_of_week: dayOfWeek,
          start_time: '08:00',
          end_time: '17:00',
          lunch_start_time: '12:00',
          lunch_end_time: '13:00',
          max_patients_per_day: 20,
          is_active: true,
          [field]: value
        });
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  const toggleDay = (dayOfWeek: number) => {
    const schedule = schedules.find(s => s.day_of_week === dayOfWeek);
    if (schedule) {
      updateSchedule(dayOfWeek, 'is_active', !schedule.is_active);
    } else {
      updateSchedule(dayOfWeek, 'is_active', true);
    }
  };

  const saveSchedules = async () => {
    try {
      setSaving(true);
      const activeSchedules = schedules.filter(s => s.is_active);
      
      const response = await doctorsApi.updateWorkSchedule(doctorId, activeSchedules);
      
      if (response.success) {
        setHasChanges(false);
        toast({
          title: "Thành công",
          description: "Đã cập nhật lịch làm việc",
        });
        fetchSchedules(); // Refresh data
      } else {
        throw new Error(response.error?.message || 'Không thể cập nhật lịch làm việc');
      }
    } catch (error) {
      console.error('Error saving schedules:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : "Không thể lưu lịch làm việc",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetSchedules = () => {
    fetchSchedules();
    setHasChanges(false);
  };

  const getScheduleForDay = (dayOfWeek: number): WorkSchedule | undefined => {
    return schedules.find(s => s.day_of_week === dayOfWeek);
  };

  const calculateWorkingHours = (schedule: WorkSchedule): number => {
    if (!schedule.is_active) return 0;
    
    const start = new Date(`2000-01-01T${schedule.start_time}`);
    const end = new Date(`2000-01-01T${schedule.end_time}`);
    const lunchStart = schedule.lunch_start_time ? new Date(`2000-01-01T${schedule.lunch_start_time}`) : null;
    const lunchEnd = schedule.lunch_end_time ? new Date(`2000-01-01T${schedule.lunch_end_time}`) : null;
    
    let totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    if (lunchStart && lunchEnd) {
      const lunchHours = (lunchEnd.getTime() - lunchStart.getTime()) / (1000 * 60 * 60);
      totalHours -= lunchHours;
    }
    
    return Math.max(0, totalHours);
  };

  const getTotalWeeklyHours = (): number => {
    return schedules.reduce((total, schedule) => total + calculateWorkingHours(schedule), 0);
  };

  if (loading) {
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Quản lý lịch làm việc</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Thiết lập lịch làm việc hàng tuần của bạn
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getTotalWeeklyHours().toFixed(1)}h/tuần
              </Badge>
              {hasChanges && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Có thay đổi
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={saveSchedules} 
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
            <Button 
              variant="outline" 
              onClick={resetSchedules}
              disabled={!hasChanges || saving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Hủy thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <div className="grid gap-4">
        {DAYS_OF_WEEK.map(day => {
          const schedule = getScheduleForDay(day.value);
          const isActive = schedule?.is_active || false;
          
          return (
            <Card key={day.value} className={`transition-all ${isActive ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => toggleDay(day.value)}
                      />
                      <Label className="font-medium">{day.label}</Label>
                    </div>
                    {isActive && (
                      <Badge variant="outline" className="text-xs">
                        {calculateWorkingHours(schedule!).toFixed(1)}h
                      </Badge>
                    )}
                  </div>
                  {isActive && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                {isActive && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Working Hours */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Giờ làm việc
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule?.start_time || '08:00'}
                          onChange={(e) => updateSchedule(day.value, 'start_time', e.target.value)}
                          className="text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="time"
                          value={schedule?.end_time || '17:00'}
                          onChange={(e) => updateSchedule(day.value, 'end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Lunch Break */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Coffee className="h-4 w-4" />
                        Giờ nghỉ trưa
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={schedule?.lunch_start_time || '12:00'}
                          onChange={(e) => updateSchedule(day.value, 'lunch_start_time', e.target.value)}
                          className="text-sm"
                        />
                        <span className="text-gray-500">-</span>
                        <Input
                          type="time"
                          value={schedule?.lunch_end_time || '13:00'}
                          onChange={(e) => updateSchedule(day.value, 'lunch_end_time', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Max Patients */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Số BN tối đa
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={schedule?.max_patients_per_day || 20}
                        onChange={(e) => updateSchedule(day.value, 'max_patients_per_day', parseInt(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
