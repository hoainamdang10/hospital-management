"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  Stethoscope,
  Activity,
  Clock,
  Plus,
  ArrowLeft,
  AlertCircle,
  Heart,
  Thermometer,
  Weight,
  Ruler,
  Eye,
  Edit,
  History
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { patientsApi } from "@/lib/api/patients"
import { medicalRecordsApi } from "@/lib/api/medical-records"
import { appointmentsApi } from "@/lib/api/appointments"
import { toast } from "sonner"

interface Patient {
  patient_id: string
  full_name: string
  date_of_birth: string
  gender: string
  phone_number?: string
  email?: string
  address?: string
  emergency_contact?: string
  medical_conditions?: string[]
  allergies?: string[]
  insurance_info?: any
  created_at: string
  updated_at: string
}

interface MedicalRecord {
  record_id: string
  patient_id: string
  doctor_id: string
  appointment_id?: string
  visit_date: string
  chief_complaint?: string
  present_illness?: string
  past_medical_history?: string
  physical_examination?: string
  vital_signs?: any
  diagnosis?: string
  treatment_plan?: string
  medications?: string
  follow_up_instructions?: string
  notes?: string
  status: 'active' | 'archived' | 'deleted'
  created_at: string
  updated_at: string
  doctor_name?: string
}

interface Appointment {
  appointment_id: string
  patient_id: string
  doctor_id: string
  appointment_date: string
  start_time: string
  end_time: string
  appointment_type: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  reason?: string
  notes?: string
  created_at: string
}

export default function PatientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useEnhancedAuth()
  const patientId = params.patient_id as string

  // State management
  const [patient, setPatient] = useState<Patient | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  // Load patient data
  useEffect(() => {
    if (patientId && user?.role === 'doctor') {
      loadPatientData()
    }
  }, [patientId, user])

  const loadPatientData = async () => {
    try {
      setLoading(true)
      
      // Load patient details
      const patientResponse = await patientsApi.getById(patientId)
      if (!patientResponse.success || !patientResponse.data) {
        toast.error('Không thể tải thông tin bệnh nhân')
        router.push('/doctors/patients')
        return
      }

      setPatient(patientResponse.data)

      // Load medical records
      try {
        const recordsResponse = await medicalRecordsApi.getByPatientId(patientId)
        if (recordsResponse.success && recordsResponse.data) {
          setMedicalRecords(recordsResponse.data)
        }
      } catch (error) {
        console.error('Error loading medical records:', error)
      }

      // Load appointments
      try {
        const appointmentsResponse = await appointmentsApi.getByPatientId(patientId)
        if (appointmentsResponse.success && appointmentsResponse.data) {
          setAppointments(appointmentsResponse.data)
        }
      } catch (error) {
        console.error('Error loading appointments:', error)
      }

    } catch (error) {
      console.error('Error loading patient data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }

  // Get status badge color
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in_progress': return 'secondary'
      case 'confirmed': return 'outline'
      case 'scheduled': return 'outline'
      case 'cancelled': return 'destructive'
      case 'no_show': return 'destructive'
      default: return 'outline'
    }
  }

  // Format status text
  const formatStatus = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Đã lên lịch'
      case 'confirmed': return 'Đã xác nhận'
      case 'in_progress': return 'Đang khám'
      case 'completed': return 'Hoàn thành'
      case 'cancelled': return 'Đã hủy'
      case 'no_show': return 'Không đến'
      default: return status
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Hồ sơ bệnh nhân" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Access control
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Hồ sơ bệnh nhân" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không có quyền truy cập. Chỉ dành cho bác sĩ.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  if (!patient) {
    return (
      <DoctorLayout title="Hồ sơ bệnh nhân" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin bệnh nhân.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/doctors/patients')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách bệnh nhân
            </Button>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout
      title="Hồ sơ bệnh nhân"
      activePage="patients"
      subtitle={`${patient.full_name} - ${calculateAge(patient.date_of_birth)} tuổi`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/doctors/patients')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button
            onClick={() => router.push(`/doctors/medical-records/create/${patient.patient_id}`)}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo hồ sơ bệnh án
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Patient Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" />
                <AvatarFallback className="text-xl">
                  {patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{patient.full_name}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Tuổi:</span>
                    <span className="font-medium">{calculateAge(patient.date_of_birth)} tuổi</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Giới tính:</span>
                    <Badge variant="outline">
                      {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Điện thoại:</span>
                    <span className="font-medium">{patient.phone_number || 'Chưa có'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{patient.email || 'Chưa có'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Địa chỉ:</span>
                    <span className="font-medium">{patient.address || 'Chưa có'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Liên hệ khẩn cấp:</span>
                    <span className="font-medium">{patient.emergency_contact || 'Chưa có'}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Medical Conditions & Allergies */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Tình trạng bệnh lý</h4>
                    {patient.medical_conditions && patient.medical_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.medical_conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Không có</p>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dị ứng</h4>
                    {patient.allergies && patient.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {patient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive" className="text-xs">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Không có</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for detailed information */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="medical-records">Hồ sơ bệnh án ({medicalRecords.length})</TabsTrigger>
            <TabsTrigger value="appointments">Lịch hẹn ({appointments.length})</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Medical Records */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Hồ sơ bệnh án gần đây
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("medical-records")}
                    >
                      Xem tất cả
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {medicalRecords.length > 0 ? (
                    <div className="space-y-3">
                      {medicalRecords.slice(0, 3).map((record) => (
                        <div key={record.record_id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">{record.chief_complaint || 'Khám bệnh'}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(record.visit_date).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {record.diagnosis && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Chẩn đoán:</strong> {record.diagnosis}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Bác sĩ: {record.doctor_name || 'Không rõ'}
                            </span>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Chưa có hồ sơ bệnh án nào
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Recent Appointments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Lịch hẹn gần đây
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setActiveTab("appointments")}
                    >
                      Xem tất cả
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {appointments.length > 0 ? (
                    <div className="space-y-3">
                      {appointments.slice(0, 3).map((appointment) => (
                        <div key={appointment.appointment_id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-sm">
                                {new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {appointment.start_time} - {appointment.end_time}
                              </p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {formatStatus(appointment.status)}
                            </Badge>
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Lý do:</strong> {appointment.reason}
                            </p>
                          )}
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500">
                              Loại: {appointment.appointment_type}
                            </span>
                            {appointment.status === 'confirmed' && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/doctors/consultation/${appointment.appointment_id}`)}
                              >
                                <Stethoscope className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Chưa có lịch hẹn nào
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Medical Records Tab */}
          <TabsContent value="medical-records" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Hồ sơ bệnh án</h3>
              <Button
                onClick={() => router.push(`/doctors/medical-records/create/${patient.patient_id}`)}
                className="bg-teal-600 hover:bg-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo hồ sơ mới
              </Button>
            </div>

            {medicalRecords.length > 0 ? (
              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.record_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-lg font-semibold">
                              {record.chief_complaint || 'Khám bệnh'}
                            </h4>
                            <Badge variant="outline">
                              {new Date(record.visit_date).toLocaleDateString('vi-VN')}
                            </Badge>
                          </div>

                          {record.diagnosis && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Chẩn đoán: </span>
                              <span className="text-sm text-gray-900">{record.diagnosis}</span>
                            </div>
                          )}

                          {record.treatment_plan && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Kế hoạch điều trị: </span>
                              <span className="text-sm text-gray-900">{record.treatment_plan}</span>
                            </div>
                          )}

                          {record.medications && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Đơn thuốc: </span>
                              <span className="text-sm text-gray-900">{record.medications}</span>
                            </div>
                          )}

                          {/* Vital Signs Display */}
                          {record.vital_signs && Object.keys(record.vital_signs).length > 0 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                <Activity className="h-4 w-4" />
                                Sinh hiệu sống
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                {record.vital_signs.temperature && (
                                  <div className="flex items-center gap-1">
                                    <Thermometer className="h-3 w-3 text-red-500" />
                                    <span>{record.vital_signs.temperature}°C</span>
                                  </div>
                                )}
                                {record.vital_signs.blood_pressure_systolic && record.vital_signs.blood_pressure_diastolic && (
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3 text-red-500" />
                                    <span>{record.vital_signs.blood_pressure_systolic}/{record.vital_signs.blood_pressure_diastolic} mmHg</span>
                                  </div>
                                )}
                                {record.vital_signs.heart_rate && (
                                  <div className="flex items-center gap-1">
                                    <Activity className="h-3 w-3 text-blue-500" />
                                    <span>{record.vital_signs.heart_rate} bpm</span>
                                  </div>
                                )}
                                {record.vital_signs.weight && (
                                  <div className="flex items-center gap-1">
                                    <Weight className="h-3 w-3 text-green-500" />
                                    <span>{record.vital_signs.weight} kg</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Bác sĩ: {record.doctor_name || 'Không rõ'}</span>
                        <span>Tạo lúc: {new Date(record.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hồ sơ bệnh án</h3>
                  <p className="text-gray-600 mb-4">
                    Bệnh nhân này chưa có hồ sơ bệnh án nào. Tạo hồ sơ đầu tiên để bắt đầu theo dõi tình trạng sức khỏe.
                  </p>
                  <Button
                    onClick={() => router.push(`/doctors/medical-records/create/${patient.patient_id}`)}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo hồ sơ bệnh án đầu tiên
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Lịch hẹn</h3>
              <Button
                onClick={() => router.push('/doctors/appointments')}
                variant="outline"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Quản lý lịch hẹn
              </Button>
            </div>

            {appointments.length > 0 ? (
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <Card key={appointment.appointment_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h4 className="text-lg font-semibold">
                              {new Date(appointment.appointment_date).toLocaleDateString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h4>
                            <Badge variant={getStatusBadgeVariant(appointment.status)}>
                              {formatStatus(appointment.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>{appointment.start_time} - {appointment.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4" />
                              <span>{appointment.appointment_type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Tạo: {new Date(appointment.created_at).toLocaleDateString('vi-VN')}</span>
                            </div>
                          </div>

                          {appointment.reason && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Lý do khám: </span>
                              <span className="text-sm text-gray-900">{appointment.reason}</span>
                            </div>
                          )}

                          {appointment.notes && (
                            <div className="mb-3">
                              <span className="text-sm font-medium text-gray-700">Ghi chú: </span>
                              <span className="text-sm text-gray-900">{appointment.notes}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {appointment.status === 'confirmed' && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/doctors/consultation/${appointment.appointment_id}`)}
                              className="bg-teal-600 hover:bg-teal-700"
                            >
                              <Stethoscope className="h-4 w-4 mr-2" />
                              Bắt đầu khám
                            </Button>
                          )}
                          {appointment.status === 'completed' && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              Xem kết quả
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch hẹn</h3>
                  <p className="text-gray-600 mb-4">
                    Bệnh nhân này chưa có lịch hẹn nào với bạn.
                  </p>
                  <Button
                    onClick={() => router.push('/doctors/appointments')}
                    variant="outline"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Quản lý lịch hẹn
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  )
}
