"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  User,
  Calendar,
  Phone,
  Mail,
  Activity,
  Save,
  ArrowLeft,
  AlertCircle,
  Thermometer,
  Heart,
  Weight,
  Ruler,
  Zap,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { patientsApi } from "@/lib/api/patients"
import { medicalRecordsApi } from "@/lib/api/medical-records"
import { toast } from "sonner"

interface Patient {
  patient_id: string
  full_name: string
  date_of_birth: string
  gender: string
  phone_number?: string
  email?: string
  address?: string
  medical_conditions?: string[]
  allergies?: string[]
}

interface VitalSignsForm {
  temperature?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  weight?: number
  height?: number
  notes: string
}

interface VitalSignsHistory {
  vital_id: string
  temperature?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number
  respiratory_rate?: number
  oxygen_saturation?: number
  weight?: number
  height?: number
  bmi?: number
  recorded_at: string
  recorded_by: string
  notes?: string
}

export default function VitalSignsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useEnhancedAuth()
  const patientId = params.patient_id as string

  // State management
  const [patient, setPatient] = useState<Patient | null>(null)
  const [vitalSignsHistory, setVitalSignsHistory] = useState<VitalSignsHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<VitalSignsForm>({
    notes: ''
  })

  // Load patient data and vital signs history
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

      // Load vital signs history (if available)
      try {
        // This would be implemented when the API is available
        // const historyResponse = await medicalRecordsApi.getVitalSignsByPatientId(patientId)
        // if (historyResponse.success && historyResponse.data) {
        //   setVitalSignsHistory(historyResponse.data)
        // }
      } catch (error) {
        console.error('Error loading vital signs history:', error)
      }

    } catch (error) {
      console.error('Error loading patient data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu bệnh nhân')
    } finally {
      setLoading(false)
    }
  }

  // Update form field
  const updateFormField = (field: keyof VitalSignsForm, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Calculate BMI
  const calculateBMI = () => {
    const { weight, height } = formData
    if (weight && height) {
      const heightInMeters = height / 100
      return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10
    }
    return null
  }

  // Get BMI category
  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: 'Thiếu cân', color: 'text-blue-600' }
    if (bmi < 25) return { text: 'Bình thường', color: 'text-green-600' }
    if (bmi < 30) return { text: 'Thừa cân', color: 'text-yellow-600' }
    return { text: 'Béo phì', color: 'text-red-600' }
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

  // Check for abnormal values
  const getVitalSignAlert = (type: string, value: number) => {
    switch (type) {
      case 'temperature':
        if (value > 38) return { type: 'high', message: 'Sốt cao' }
        if (value < 36) return { type: 'low', message: 'Hạ thân nhiệt' }
        break
      case 'blood_pressure_systolic':
        if (value > 140) return { type: 'high', message: 'Huyết áp tâm thu cao' }
        if (value < 90) return { type: 'low', message: 'Huyết áp tâm thu thấp' }
        break
      case 'blood_pressure_diastolic':
        if (value > 90) return { type: 'high', message: 'Huyết áp tâm trương cao' }
        if (value < 60) return { type: 'low', message: 'Huyết áp tâm trương thấp' }
        break
      case 'heart_rate':
        if (value > 100) return { type: 'high', message: 'Nhịp tim nhanh' }
        if (value < 60) return { type: 'low', message: 'Nhịp tim chậm' }
        break
      case 'respiratory_rate':
        if (value > 20) return { type: 'high', message: 'Nhịp thở nhanh' }
        if (value < 12) return { type: 'low', message: 'Nhịp thở chậm' }
        break
      case 'oxygen_saturation':
        if (value < 95) return { type: 'low', message: 'SpO2 thấp' }
        break
    }
    return null
  }

  // Save vital signs
  const saveVitalSigns = async () => {
    if (!patient || !user) return

    // Validation - at least one vital sign must be entered
    const hasVitalSigns = Object.entries(formData).some(([key, value]) => 
      key !== 'notes' && value !== undefined && value !== ''
    )

    if (!hasVitalSigns) {
      toast.error('Vui lòng nhập ít nhất một sinh hiệu')
      return
    }

    try {
      setSaving(true)

      // Create a medical record with vital signs
      const medicalRecordData = {
        patient_id: patient.patient_id,
        doctor_id: user.doctor_id || user.id,
        visit_date: new Date().toISOString().split('T')[0],
        chief_complaint: 'Đo sinh hiệu',
        vital_signs: {
          ...formData,
          bmi: calculateBMI()
        },
        notes: formData.notes || 'Đo sinh hiệu định kỳ'
      }

      const response = await medicalRecordsApi.create(medicalRecordData)
      
      if (response.success) {
        toast.success('Đã lưu sinh hiệu thành công')
        
        // Reset form
        setFormData({ notes: '' })
        
        // Redirect to patient profile
        setTimeout(() => {
          router.push(`/doctors/patients/${patient.patient_id}`)
        }, 1500)
      } else {
        toast.error('Không thể lưu sinh hiệu')
      }
    } catch (error) {
      console.error('Error saving vital signs:', error)
      toast.error('Có lỗi xảy ra khi lưu sinh hiệu')
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Đo sinh hiệu" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    )
  }

  // Access control
  if (!user || user.role !== 'doctor') {
    return (
      <DoctorLayout title="Đo sinh hiệu" activePage="patients">
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
      <DoctorLayout title="Đo sinh hiệu" activePage="patients">
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
      title="Đo sinh hiệu"
      activePage="patients"
      subtitle={`${patient.full_name} - ${calculateAge(patient.date_of_birth)} tuổi`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/doctors/patients/${patient.patient_id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button
            onClick={saveVitalSigns}
            disabled={saving}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu sinh hiệu
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Patient Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin bệnh nhân
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback>
                  {patient.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{patient.full_name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {calculateAge(patient.date_of_birth)} tuổi
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

            {/* Medical Conditions & Allergies Alert */}
            {((patient.medical_conditions && patient.medical_conditions.length > 0) || 
              (patient.allergies && patient.allergies.length > 0)) && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 mb-1">Lưu ý quan trọng:</p>
                    {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                      <p className="text-yellow-700">
                        <strong>Bệnh lý:</strong> {patient.medical_conditions.join(', ')}
                      </p>
                    )}
                    {patient.allergies && patient.allergies.length > 0 && (
                      <p className="text-yellow-700">
                        <strong>Dị ứng:</strong> {patient.allergies.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vital Signs Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sinh hiệu sống
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Temperature */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Thermometer className="h-4 w-4 text-red-500" />
                  Nhiệt độ (°C)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={formData.temperature || ''}
                  onChange={(e) => updateFormField('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                {formData.temperature && getVitalSignAlert('temperature', formData.temperature) && (
                  <div className="flex items-center gap-1 text-xs">
                    {getVitalSignAlert('temperature', formData.temperature)?.type === 'high' ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-500" />
                    )}
                    <span className={getVitalSignAlert('temperature', formData.temperature)?.type === 'high' ? 'text-red-600' : 'text-blue-600'}>
                      {getVitalSignAlert('temperature', formData.temperature)?.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Blood Pressure */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Huyết áp (mmHg)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="120"
                    value={formData.blood_pressure_systolic || ''}
                    onChange={(e) => updateFormField('blood_pressure_systolic', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                  <span className="flex items-center">/</span>
                  <Input
                    type="number"
                    placeholder="80"
                    value={formData.blood_pressure_diastolic || ''}
                    onChange={(e) => updateFormField('blood_pressure_diastolic', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                {(formData.blood_pressure_systolic && getVitalSignAlert('blood_pressure_systolic', formData.blood_pressure_systolic)) && (
                  <div className="flex items-center gap-1 text-xs">
                    {getVitalSignAlert('blood_pressure_systolic', formData.blood_pressure_systolic)?.type === 'high' ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-500" />
                    )}
                    <span className={getVitalSignAlert('blood_pressure_systolic', formData.blood_pressure_systolic)?.type === 'high' ? 'text-red-600' : 'text-blue-600'}>
                      {getVitalSignAlert('blood_pressure_systolic', formData.blood_pressure_systolic)?.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Heart Rate */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Nhịp tim (bpm)
                </Label>
                <Input
                  type="number"
                  placeholder="72"
                  value={formData.heart_rate || ''}
                  onChange={(e) => updateFormField('heart_rate', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                {formData.heart_rate && getVitalSignAlert('heart_rate', formData.heart_rate) && (
                  <div className="flex items-center gap-1 text-xs">
                    {getVitalSignAlert('heart_rate', formData.heart_rate)?.type === 'high' ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-500" />
                    )}
                    <span className={getVitalSignAlert('heart_rate', formData.heart_rate)?.type === 'high' ? 'text-red-600' : 'text-blue-600'}>
                      {getVitalSignAlert('heart_rate', formData.heart_rate)?.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Respiratory Rate */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  Nhịp thở (lần/phút)
                </Label>
                <Input
                  type="number"
                  placeholder="16"
                  value={formData.respiratory_rate || ''}
                  onChange={(e) => updateFormField('respiratory_rate', e.target.value ? parseInt(e.target.value) : undefined)}
                />
                {formData.respiratory_rate && getVitalSignAlert('respiratory_rate', formData.respiratory_rate) && (
                  <div className="flex items-center gap-1 text-xs">
                    {getVitalSignAlert('respiratory_rate', formData.respiratory_rate)?.type === 'high' ? (
                      <TrendingUp className="h-3 w-3 text-red-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-blue-500" />
                    )}
                    <span className={getVitalSignAlert('respiratory_rate', formData.respiratory_rate)?.type === 'high' ? 'text-red-600' : 'text-blue-600'}>
                      {getVitalSignAlert('respiratory_rate', formData.respiratory_rate)?.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  SpO2 (%)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="98"
                  value={formData.oxygen_saturation || ''}
                  onChange={(e) => updateFormField('oxygen_saturation', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                {formData.oxygen_saturation && getVitalSignAlert('oxygen_saturation', formData.oxygen_saturation) && (
                  <div className="flex items-center gap-1 text-xs">
                    <TrendingDown className="h-3 w-3 text-red-500" />
                    <span className="text-red-600">
                      {getVitalSignAlert('oxygen_saturation', formData.oxygen_saturation)?.message}
                    </span>
                  </div>
                )}
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-green-500" />
                  Cân nặng (kg)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="70"
                  value={formData.weight || ''}
                  onChange={(e) => updateFormField('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>

              {/* Height */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-purple-500" />
                  Chiều cao (cm)
                </Label>
                <Input
                  type="number"
                  placeholder="170"
                  value={formData.height || ''}
                  onChange={(e) => updateFormField('height', e.target.value ? parseFloat(e.target.value) : undefined)}
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
                    <div className={`text-xs mt-1 ${getBMICategory(calculateBMI()!).color}`}>
                      {getBMICategory(calculateBMI()!).text}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                placeholder="Ghi chú về quá trình đo sinh hiệu, tình trạng bệnh nhân..."
                value={formData.notes}
                onChange={(e) => updateFormField('notes', e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vui lòng nhập ít nhất một sinh hiệu để lưu. Hệ thống sẽ tự động tính toán BMI nếu có đủ thông tin cân nặng và chiều cao.
          </AlertDescription>
        </Alert>
      </div>
    </DoctorLayout>
  )
}
