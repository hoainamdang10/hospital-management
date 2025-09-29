"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Clock,
  Phone,
  Mail,
  Calendar,
  Stethoscope,
  Heart,
  Activity,
  FileText,
  Save,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Timer,
  Thermometer,
  Weight,
  Ruler,
  Zap
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { appointmentsApi } from "@/lib/api/appointments"
import { medicalRecordsApi } from "@/lib/api/medical-records"
import { patientsApi } from "@/lib/api/patients"
import { toast } from "sonner"

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
  patient_name?: string
  patient_phone?: string
  patient_email?: string
  patient_age?: number
}

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
}

interface VitalSigns {
  temperature?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  weight?: number
  height?: number
}

interface ConsultationForm {
  chief_complaint: string
  present_illness: string
  past_medical_history: string
  physical_examination: string
  vital_signs: VitalSigns
  diagnosis: string
  treatment_plan: string
  medications: string
  follow_up_instructions: string
  notes: string
}

export default function ConsultationPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useEnhancedAuth()
  const appointmentId = params.appointment_id as string

  // State management
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [consultationStarted, setConsultationStarted] = useState(false)
  const [consultationStartTime, setConsultationStartTime] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Form state
  const [consultationForm, setConsultationForm] = useState<ConsultationForm>({
    chief_complaint: '',
    present_illness: '',
    past_medical_history: '',
    physical_examination: '',
    vital_signs: {},
    diagnosis: '',
    treatment_plan: '',
    medications: '',
    follow_up_instructions: '',
    notes: ''
  })

  // Load appointment and patient data
  useEffect(() => {
    if (appointmentId && user?.role === 'doctor') {
      loadAppointmentData()
    }
  }, [appointmentId, user])

  const loadAppointmentData = async () => {
    try {
      setLoading(true)
      
      // Get appointment details
      const appointmentResponse = await appointmentsApi.getById(appointmentId)
      if (!appointmentResponse.success || !appointmentResponse.data) {
        toast.error('Không thể tải thông tin cuộc hẹn')
        router.push('/doctors/appointments')
        return
      }

      const appointmentData = appointmentResponse.data
      setAppointment(appointmentData)

      // Check if consultation is already in progress
      if (appointmentData.status === 'in_progress') {
        setConsultationStarted(true)
        setConsultationStartTime(new Date())
      }

      // Get patient details
      if (appointmentData.patient_id) {
        const patientResponse = await patientsApi.getById(appointmentData.patient_id)
        if (patientResponse.success && patientResponse.data) {
          setPatient(patientResponse.data)
          
          // Pre-fill past medical history if available
          if (patientResponse.data.medical_conditions?.length > 0) {
            setConsultationForm(prev => ({
              ...prev,
              past_medical_history: patientResponse.data.medical_conditions?.join(', ') || ''
            }))
          }
        }
      }

    } catch (error) {
      console.error('Error loading appointment data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  // Start consultation
  const startConsultation = async () => {
    if (!appointment) return

    try {
      setSaving(true)
      
      // Update appointment status to in_progress
      const response = await appointmentsApi.updateStatus(appointment.appointment_id, 'in_progress')
      
      if (response.success) {
        setConsultationStarted(true)
        setConsultationStartTime(new Date())
        setAppointment(prev => prev ? { ...prev, status: 'in_progress' } : null)
        toast.success('Đã bắt đầu cuộc khám')
        setActiveTab("examination")
      } else {
        toast.error('Không thể bắt đầu cuộc khám')
      }
    } catch (error) {
      console.error('Error starting consultation:', error)
      toast.error('Có lỗi xảy ra khi bắt đầu cuộc khám')
    } finally {
      setSaving(false)
    }
  }

  // Update form field
  const updateFormField = (field: keyof ConsultationForm, value: any) => {
    setConsultationForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Update vital signs
  const updateVitalSigns = (field: keyof VitalSigns, value: number | undefined) => {
    setConsultationForm(prev => ({
      ...prev,
      vital_signs: {
        ...prev.vital_signs,
        [field]: value
      }
    }))
  }

  // Calculate BMI
  const calculateBMI = () => {
    const { weight, height } = consultationForm.vital_signs
    if (weight && height) {
      const heightInMeters = height / 100
      return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
    }
    return null
  }

  // Save medical record
  const saveMedicalRecord = async () => {
    if (!appointment || !patient || !user) return

    try {
      setSaving(true)

      const medicalRecordData = {
        patient_id: patient.patient_id,
        doctor_id: user.doctor_id || user.id,
        appointment_id: appointment.appointment_id,
        visit_date: appointment.appointment_date,
        ...consultationForm
      }

      const response = await medicalRecordsApi.create(medicalRecordData)
      
      if (response.success) {
        toast.success('Đã lưu hồ sơ bệnh án thành công')
        
        // Update appointment status to completed
        await appointmentsApi.updateStatus(appointment.appointment_id, 'completed')
        setAppointment(prev => prev ? { ...prev, status: 'completed' } : null)
        
        // Redirect to appointments page
        setTimeout(() => {
          router.push('/doctors/appointments')
        }, 2000)
      } else {
        toast.error('Không thể lưu hồ sơ bệnh án')
      }
    } catch (error) {
      console.error('Error saving medical record:', error)
      toast.error('Có lỗi xảy ra khi lưu hồ sơ bệnh án')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Cuộc khám" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Access control
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Cuộc khám" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không có quyền truy cập. Chỉ dành cho bác sĩ.</p>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  if (!appointment || !patient) {
    return (
      <DoctorLayout title="Cuộc khám" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin cuộc hẹn hoặc bệnh nhân.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => router.push('/doctors/appointments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách cuộc hẹn
            </Button>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout
      title="Cuộc khám bệnh"
      activePage="appointments"
      subtitle={`${patient.full_name} - ${appointment.appointment_date} ${appointment.start_time}`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/doctors/appointments')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          {consultationStarted && appointment.status !== 'completed' && (
            <Button
              onClick={saveMedicalRecord}
              disabled={saving}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Hoàn thành khám
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status Alert */}
        {appointment.status === 'completed' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Cuộc khám đã hoàn thành. Hồ sơ bệnh án đã được lưu.
            </AlertDescription>
          </Alert>
        )}

        {consultationStarted && consultationStartTime && appointment.status !== 'completed' && (
          <Alert className="border-blue-200 bg-blue-50">
            <Timer className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Cuộc khám đang diễn ra - Bắt đầu lúc {consultationStartTime.toLocaleTimeString('vi-VN')}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="examination" disabled={!consultationStarted}>Khám bệnh</TabsTrigger>
            <TabsTrigger value="vital-signs" disabled={!consultationStarted}>Sinh hiệu</TabsTrigger>
            <TabsTrigger value="diagnosis" disabled={!consultationStarted}>Chẩn đoán</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin bệnh nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      {patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{patient.full_name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(patient.date_of_birth).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {patient.phone_number || 'Chưa có'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {patient.email || 'Chưa có'}
                      </div>
                      <div>
                        <Badge variant="outline">
                          {patient.gender === 'male' ? 'Nam' : patient.gender === 'female' ? 'Nữ' : 'Khác'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Conditions & Allergies */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Tình trạng bệnh lý</Label>
                    <div className="mt-1">
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
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Dị ứng</Label>
                    <div className="mt-1">
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
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông tin cuộc hẹn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Ngày khám</Label>
                    <p className="text-sm">{new Date(appointment.appointment_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Thời gian</Label>
                    <p className="text-sm">{appointment.start_time} - {appointment.end_time}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Loại khám</Label>
                    <Badge variant="outline">{appointment.appointment_type}</Badge>
                  </div>
                </div>
                
                {appointment.reason && (
                  <div>
                    <Label className="text-sm font-medium">Lý do khám</Label>
                    <p className="text-sm mt-1">{appointment.reason}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Trạng thái:</Label>
                  <Badge 
                    variant={
                      appointment.status === 'completed' ? 'default' :
                      appointment.status === 'in_progress' ? 'secondary' :
                      appointment.status === 'confirmed' ? 'outline' : 'destructive'
                    }
                  >
                    {appointment.status === 'scheduled' && 'Đã lên lịch'}
                    {appointment.status === 'confirmed' && 'Đã xác nhận'}
                    {appointment.status === 'in_progress' && 'Đang khám'}
                    {appointment.status === 'completed' && 'Hoàn thành'}
                    {appointment.status === 'cancelled' && 'Đã hủy'}
                    {appointment.status === 'no_show' && 'Không đến'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Start Consultation Button */}
            {!consultationStarted && appointment.status !== 'completed' && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Button
                    onClick={startConsultation}
                    disabled={saving}
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Stethoscope className="h-5 w-5 mr-2" />
                    )}
                    Bắt đầu cuộc khám
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Nhấn để bắt đầu cuộc khám và ghi nhận hồ sơ bệnh án
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Examination Tab */}
          <TabsContent value="examination" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Chief Complaint */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lý do khám chính</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Mô tả lý do khám chính của bệnh nhân..."
                    value={consultationForm.chief_complaint}
                    onChange={(e) => updateFormField('chief_complaint', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Present Illness */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bệnh sử hiện tại</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Mô tả chi tiết về tình trạng bệnh hiện tại..."
                    value={consultationForm.present_illness}
                    onChange={(e) => updateFormField('present_illness', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Past Medical History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiền sử bệnh</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Tiền sử bệnh lý, phẫu thuật, dị ứng..."
                    value={consultationForm.past_medical_history}
                    onChange={(e) => updateFormField('past_medical_history', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Physical Examination */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Khám lâm sàng</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Kết quả khám lâm sàng, thăm khám các cơ quan..."
                    value={consultationForm.physical_examination}
                    onChange={(e) => updateFormField('physical_examination', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vital Signs Tab */}
          <TabsContent value="vital-signs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sinh hiệu sống
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4" />
                      Nhiệt độ (°C)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={consultationForm.vital_signs.temperature || ''}
                      onChange={(e) => updateVitalSigns('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Blood Pressure */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Huyết áp (mmHg)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="120"
                        value={consultationForm.vital_signs.blood_pressure_systolic || ''}
                        onChange={(e) => updateVitalSigns('blood_pressure_systolic', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                      <span className="flex items-center">/</span>
                      <Input
                        type="number"
                        placeholder="80"
                        value={consultationForm.vital_signs.blood_pressure_diastolic || ''}
                        onChange={(e) => updateVitalSigns('blood_pressure_diastolic', e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  {/* Heart Rate */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Nhịp tim (bpm)
                    </Label>
                    <Input
                      type="number"
                      placeholder="72"
                      value={consultationForm.vital_signs.heart_rate || ''}
                      onChange={(e) => updateVitalSigns('heart_rate', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Respiratory Rate */}
                  <div className="space-y-2">
                    <Label>Nhịp thở (lần/phút)</Label>
                    <Input
                      type="number"
                      placeholder="16"
                      value={consultationForm.vital_signs.respiratory_rate || ''}
                      onChange={(e) => updateVitalSigns('respiratory_rate', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Oxygen Saturation */}
                  <div className="space-y-2">
                    <Label>SpO2 (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="98"
                      value={consultationForm.vital_signs.oxygen_saturation || ''}
                      onChange={(e) => updateVitalSigns('oxygen_saturation', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Weight */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Weight className="h-4 w-4" />
                      Cân nặng (kg)
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70"
                      value={consultationForm.vital_signs.weight || ''}
                      onChange={(e) => updateVitalSigns('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  {/* Height */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Chiều cao (cm)
                    </Label>
                    <Input
                      type="number"
                      placeholder="170"
                      value={consultationForm.vital_signs.height || ''}
                      onChange={(e) => updateVitalSigns('height', e.target.value ? parseFloat(e.target.value) : undefined)}
                    />
                  </div>

                  {/* BMI Display */}
                  <div className="space-y-2">
                    <Label>BMI</Label>
                    <div className="p-3 bg-gray-50 rounded-md">
                      <span className="text-lg font-semibold">
                        {calculateBMI() || '--'}
                      </span>
                      {calculateBMI() && (
                        <div className="text-xs text-gray-600 mt-1">
                          {calculateBMI()! < 18.5 && 'Thiếu cân'}
                          {calculateBMI()! >= 18.5 && calculateBMI()! < 25 && 'Bình thường'}
                          {calculateBMI()! >= 25 && calculateBMI()! < 30 && 'Thừa cân'}
                          {calculateBMI()! >= 30 && 'Béo phì'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Health Alerts */}
                  <div className="md:col-span-3">
                    {(consultationForm.vital_signs.temperature && (consultationForm.vital_signs.temperature > 38 || consultationForm.vital_signs.temperature < 36)) && (
                      <Alert className="border-yellow-200 bg-yellow-50">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                          Nhiệt độ bất thường: {consultationForm.vital_signs.temperature}°C
                        </AlertDescription>
                      </Alert>
                    )}

                    {(consultationForm.vital_signs.blood_pressure_systolic && consultationForm.vital_signs.blood_pressure_systolic > 140) && (
                      <Alert className="border-red-200 bg-red-50 mt-2">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Huyết áp cao: {consultationForm.vital_signs.blood_pressure_systolic}/{consultationForm.vital_signs.blood_pressure_diastolic} mmHg
                        </AlertDescription>
                      </Alert>
                    )}

                    {(consultationForm.vital_signs.heart_rate && (consultationForm.vital_signs.heart_rate > 100 || consultationForm.vital_signs.heart_rate < 60)) && (
                      <Alert className="border-orange-200 bg-orange-50 mt-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          Nhịp tim bất thường: {consultationForm.vital_signs.heart_rate} bpm
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diagnosis Tab */}
          <TabsContent value="diagnosis" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Diagnosis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Chẩn đoán</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Chẩn đoán bệnh, mã ICD-10 nếu có..."
                    value={consultationForm.diagnosis}
                    onChange={(e) => updateFormField('diagnosis', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Treatment Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Kế hoạch điều trị</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Kế hoạch điều trị, can thiệp y tế..."
                    value={consultationForm.treatment_plan}
                    onChange={(e) => updateFormField('treatment_plan', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Medications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Đơn thuốc</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Danh sách thuốc, liều lượng, cách dùng..."
                    value={consultationForm.medications}
                    onChange={(e) => updateFormField('medications', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Follow-up Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hướng dẫn tái khám</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Hướng dẫn tái khám, lưu ý đặc biệt..."
                    value={consultationForm.follow_up_instructions}
                    onChange={(e) => updateFormField('follow_up_instructions', e.target.value)}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Ghi chú thêm</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Ghi chú thêm, quan sát đặc biệt..."
                    value={consultationForm.notes}
                    onChange={(e) => updateFormField('notes', e.target.value)}
                    rows={3}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Save Button */}
            <Card>
              <CardContent className="p-6 text-center">
                <Button
                  onClick={saveMedicalRecord}
                  disabled={saving || !consultationForm.chief_complaint || !consultationForm.diagnosis}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-5 w-5 mr-2" />
                  )}
                  Lưu hồ sơ bệnh án và hoàn thành khám
                </Button>
                <p className="text-sm text-gray-600 mt-2">
                  Lưu hồ sơ bệnh án và đánh dấu cuộc khám đã hoàn thành
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DoctorLayout>
  )
}
