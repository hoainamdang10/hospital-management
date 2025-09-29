'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  Clock,
  User,
  Stethoscope,
  Edit,
  X,
  RotateCcw,
  FileText,
  Filter
} from 'lucide-react';

interface Appointment {
  appointment_id: string;
  patient_name: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  appointment_type: string;
  notes?: string;
  receptionist_notes?: string;
  insurance_verified: boolean;
}

export function AppointmentManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  // Mock data
  const mockAppointments: Appointment[] = [
    {
      appointment_id: 'APT-202501-001',
      patient_name: 'Nguyễn Văn An',
      doctor_name: 'BS. Trần Thị Bình',
      appointment_date: '2025-01-09',
      appointment_time: '09:00',
      status: 'scheduled',
      appointment_type: 'Khám tổng quát',
      insurance_verified: false
    },
    {
      appointment_id: 'APT-202501-002',
      patient_name: 'Lê Thị Cẩm',
      doctor_name: 'BS. Phạm Văn Đức',
      appointment_date: '2025-01-09',
      appointment_time: '09:30',
      status: 'checked_in',
      appointment_type: 'Khám chuyên khoa',
      insurance_verified: true,
      receptionist_notes: 'Bệnh nhân đã check-in đúng giờ'
    },
    {
      appointment_id: 'APT-202501-003',
      patient_name: 'Hoàng Minh Tuấn',
      doctor_name: 'BS. Nguyễn Thị Lan',
      appointment_date: '2025-01-09',
      appointment_time: '10:00',
      status: 'in_progress',
      appointment_type: 'Tái khám',
      insurance_verified: true
    }
  ];

  useEffect(() => {
    loadTodayAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, selectedStatus, searchQuery]);

  const loadTodayAppointments = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setAppointments(mockAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = appointments;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(apt => 
        apt.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.doctor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.appointment_id.includes(searchQuery)
      );
    }

    setFilteredAppointments(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: 'Đã đặt lịch', variant: 'default' as const },
      checked_in: { label: 'Đã check-in', variant: 'secondary' as const },
      in_progress: { label: 'Đang khám', variant: 'default' as const },
      completed: { label: 'Hoàn thành', variant: 'default' as const },
      cancelled: { label: 'Đã hủy', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const updateAppointmentNotes = async (appointmentId: string, notes: string, insuranceVerified: boolean) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          receptionist_notes: notes,
          insurance_verified: insuranceVerified
        })
      });

      if (response.ok) {
        // Update local state
        setAppointments(prev => prev.map(apt => 
          apt.appointment_id === appointmentId 
            ? { ...apt, receptionist_notes: notes, insurance_verified: insuranceVerified }
            : apt
        ));
        setEditingAppointment(null);
        alert('Cập nhật thành công!');
      } else {
        alert('Lỗi khi cập nhật');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Lỗi kết nối');
    }
  };

  const rescheduleAppointment = async (appointmentId: string, newDate: string, newTime: string, reason: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          new_date: newDate,
          new_time: newTime,
          reason: reason
        })
      });

      if (response.ok) {
        loadTodayAppointments(); // Reload data
        alert('Đổi lịch thành công!');
      } else {
        alert('Lỗi khi đổi lịch');
      }
    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      alert('Lỗi kết nối');
    }
  };

  const cancelAppointment = async (appointmentId: string, reason: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        loadTodayAppointments(); // Reload data
        alert('Hủy lịch thành công!');
      } else {
        alert('Lỗi khi hủy lịch');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Lỗi kết nối');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Tìm kiếm</Label>
              <Input
                placeholder="Tên bệnh nhân, bác sĩ hoặc mã lịch hẹn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="scheduled">Đã đặt lịch</SelectItem>
                  <SelectItem value="checked_in">Đã check-in</SelectItem>
                  <SelectItem value="in_progress">Đang khám</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch hẹn hôm nay ({filteredAppointments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có lịch hẹn nào
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div key={appointment.appointment_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{appointment.appointment_time}</span>
                        </div>
                        {getStatusBadge(appointment.status)}
                        {appointment.insurance_verified && (
                          <Badge variant="outline" className="text-green-600">
                            Đã xác minh BH
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{appointment.patient_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          <span>{appointment.doctor_name}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1">
                        {appointment.appointment_type}
                      </p>
                      
                      {appointment.receptionist_notes && (
                        <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                          <strong>Ghi chú:</strong> {appointment.receptionist_notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingAppointment(appointment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt('Lý do hủy lịch:');
                          if (reason) cancelAppointment(appointment.appointment_id, reason);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingAppointment && (
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa lịch hẹn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Ghi chú lễ tân</Label>
                <Textarea
                  value={editingAppointment.receptionist_notes || ''}
                  onChange={(e) => setEditingAppointment(prev => 
                    prev ? { ...prev, receptionist_notes: e.target.value } : null
                  )}
                  placeholder="Nhập ghi chú..."
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingAppointment.insurance_verified}
                  onChange={(e) => setEditingAppointment(prev => 
                    prev ? { ...prev, insurance_verified: e.target.checked } : null
                  )}
                />
                <Label>Đã xác minh bảo hiểm</Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => updateAppointmentNotes(
                    editingAppointment.appointment_id,
                    editingAppointment.receptionist_notes || '',
                    editingAppointment.insurance_verified
                  )}
                >
                  Lưu
                </Button>
                <Button variant="outline" onClick={() => setEditingAppointment(null)}>
                  Hủy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
