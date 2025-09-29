'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Search,
  UserCheck,
  Clock,
  FileText,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Patient {
  patient_id: string;
  full_name: string;
  phone_number: string;
  appointment_id: string;
  appointment_time: string;
  doctor_name: string;
  status: string;
}

interface CheckInFormData {
  appointmentId: string;
  patientId: string;
  insuranceVerified: boolean;
  documentsComplete: boolean;
  notes: string;
}

export function CheckInSystem() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkInForm, setCheckInForm] = useState<CheckInFormData>({
    appointmentId: '',
    patientId: '',
    insuranceVerified: false,
    documentsComplete: true,
    notes: ''
  });

  // Mock data for demonstration
  const mockPatients: Patient[] = [
    {
      patient_id: 'PAT-202501-001',
      full_name: 'Nguyễn Văn An',
      phone_number: '0987654321',
      appointment_id: 'APT-202501-001',
      appointment_time: '09:00',
      doctor_name: 'BS. Trần Thị Bình',
      status: 'scheduled'
    },
    {
      patient_id: 'PAT-202501-002',
      full_name: 'Lê Thị Cẩm',
      phone_number: '0976543210',
      appointment_id: 'APT-202501-002',
      appointment_time: '09:30',
      doctor_name: 'BS. Phạm Văn Đức',
      status: 'scheduled'
    }
  ];

  const searchPatients = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      const results = mockPatients.filter(patient => 
        patient.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone_number.includes(searchQuery) ||
        patient.patient_id.includes(searchQuery)
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setCheckInForm({
      appointmentId: patient.appointment_id,
      patientId: patient.patient_id,
      insuranceVerified: false,
      documentsComplete: true,
      notes: ''
    });
  };

  const handleCheckIn = async () => {
    if (!selectedPatient) return;

    setLoading(true);
    try {
      const response = await fetch('/api/receptionist/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(checkInForm)
      });

      if (response.ok) {
        alert('Check-in thành công!');
        setSelectedPatient(null);
        setSearchQuery('');
        setSearchResults([]);
        setCheckInForm({
          appointmentId: '',
          patientId: '',
          insuranceVerified: false,
          documentsComplete: true,
          notes: ''
        });
      } else {
        alert('Lỗi khi thực hiện check-in');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      alert('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tìm kiếm bệnh nhân
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tên, số điện thoại hoặc mã bệnh nhân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPatients()}
            />
            <Button onClick={searchPatients} disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-medium">Kết quả tìm kiếm:</h4>
              {searchResults.map((patient) => (
                <div
                  key={patient.patient_id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => selectPatient(patient)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{patient.full_name}</p>
                      <p className="text-sm text-gray-600">
                        {patient.patient_id} • {patient.phone_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        Lịch hẹn: {patient.appointment_time} - {patient.doctor_name}
                      </p>
                    </div>
                    <Badge variant={patient.status === 'scheduled' ? 'default' : 'secondary'}>
                      {patient.status === 'scheduled' ? 'Đã đặt lịch' : patient.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Form */}
      {selectedPatient && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Check-in cho {selectedPatient.full_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Patient Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Thông tin bệnh nhân</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Mã bệnh nhân:</span> {selectedPatient.patient_id}
                </div>
                <div>
                  <span className="font-medium">Số điện thoại:</span> {selectedPatient.phone_number}
                </div>
                <div>
                  <span className="font-medium">Mã lịch hẹn:</span> {selectedPatient.appointment_id}
                </div>
                <div>
                  <span className="font-medium">Thời gian:</span> {selectedPatient.appointment_time}
                </div>
              </div>
            </div>

            {/* Check-in Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>Đã xác minh bảo hiểm</Label>
                </div>
                <Switch
                  checked={checkInForm.insuranceVerified}
                  onCheckedChange={(checked) => 
                    setCheckInForm(prev => ({ ...prev, insuranceVerified: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <Label>Hồ sơ đầy đủ</Label>
                </div>
                <Switch
                  checked={checkInForm.documentsComplete}
                  onCheckedChange={(checked) => 
                    setCheckInForm(prev => ({ ...prev, documentsComplete: checked }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  placeholder="Nhập ghi chú nếu có..."
                  value={checkInForm.notes}
                  onChange={(e) => 
                    setCheckInForm(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleCheckIn} disabled={loading} className="flex-1">
                {loading ? 'Đang xử lý...' : 'Xác nhận Check-in'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPatient(null)}
                className="flex-1"
              >
                Hủy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Chờ check-in</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Đã check-in</p>
                <p className="text-2xl font-bold">8</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Cần xử lý</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
