"use client";

import { DoctorLayout } from "@/components/layout/UniversalLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { medicalRecordsApi } from "@/lib/api/medical-records";
import { patientsApi } from "@/lib/api/patients";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Heart,
  Mail,
  Phone,
  Ruler,
  Save,
  Thermometer,
  User,
  Weight,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Patient {
  patient_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
  email?: string;
  address?: string;
  emergency_contact?: string;
  medical_conditions?: string[];
  allergies?: string[];
  insurance_info?: any;
}

// Simplified Basic Vital Signs
interface BasicVitalSigns {
  temperature?: number; // Celsius
  blood_pressure?: string; // "120/80" format
  heart_rate?: number; // BPM
  weight?: number; // KG
  height?: number; // CM
}

// Simplified Medical Record Form
interface MedicalRecordForm {
  visit_date: string;
  symptoms: string; // Replaces: chief_complaint + present_illness
  examination_notes: string; // Replaces: physical_examination
  diagnosis: string;
  treatment: string; // Replaces: treatment_plan + follow_up_instructions
  medications: string;
  notes: string;
  basic_vitals: BasicVitalSigns; // Simplified vital signs
}

export default function CreateMedicalRecordPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useEnhancedAuth();
  const patientId = params.patient_id as string;

  // State management
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Simplified Form state
  const [formData, setFormData] = useState<MedicalRecordForm>({
    visit_date: new Date().toISOString().split("T")[0],
    symptoms: "",
    examination_notes: "",
    diagnosis: "",
    treatment: "",
    medications: "",
    notes: "",
    basic_vitals: {},
  });

  // Load patient data
  useEffect(() => {
    if (patientId && user?.role === "doctor") {
      loadPatientData();
    }
  }, [patientId, user]);

  const loadPatientData = async () => {
    try {
      setLoading(true);

      const response = await patientsApi.getById(patientId);
      if (!response.success || !response.data) {
        toast.error("Không thể tải thông tin bệnh nhân");
        router.push("/doctors/patients");
        return;
      }

      const patientData = response.data;
      setPatient(patientData);

      // Pre-fill past medical history if available
      if (patientData.medical_conditions?.length > 0) {
        setFormData((prev) => ({
          ...prev,
          past_medical_history:
            patientData.medical_conditions?.join(", ") || "",
        }));
      }
    } catch (error) {
      console.error("Error loading patient data:", error);
      toast.error("Có lỗi xảy ra khi tải dữ liệu bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  // Update form field
  const updateFormField = (field: keyof MedicalRecordForm, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Update vital signs
  const updateVitalSigns = (
    field: keyof VitalSigns,
    value: number | undefined
  ) => {
    setFormData((prev) => ({
      ...prev,
      vital_signs: {
        ...prev.vital_signs,
        [field]: value,
      },
    }));
  };

  // Calculate BMI
  const calculateBMI = () => {
    const { weight, height } = formData.vital_signs;
    if (weight && height) {
      const heightInMeters = height / 100;
      return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
    }
    return null;
  };

  // Calculate age
  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  };

  // Save medical record
  const saveMedicalRecord = async () => {
    if (!patient || !user) return;

    // Validation
    if (!formData.chief_complaint.trim()) {
      toast.error("Vui lòng nhập lý do khám chính");
      return;
    }

    if (!formData.diagnosis.trim()) {
      toast.error("Vui lòng nhập chẩn đoán");
      return;
    }

    try {
      setSaving(true);

      const medicalRecordData = {
        patient_id: patient.patient_id,
        doctor_id: user.doctor_id || user.id,
        visit_date: formData.visit_date,
        chief_complaint: formData.chief_complaint,
        present_illness: formData.present_illness,
        past_medical_history: formData.past_medical_history,
        physical_examination: formData.physical_examination,
        vital_signs: formData.vital_signs,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment_plan,
        medications: formData.medications,
        follow_up_instructions: formData.follow_up_instructions,
        notes: formData.notes,
      };

      const response = await medicalRecordsApi.create(medicalRecordData);

      if (response.success) {
        toast.success("Đã tạo hồ sơ bệnh án thành công");
        router.push(`/doctors/patients/${patient.patient_id}`);
      } else {
        toast.error("Không thể tạo hồ sơ bệnh án");
      }
    } catch (error) {
      console.error("Error saving medical record:", error);
      toast.error("Có lỗi xảy ra khi lưu hồ sơ bệnh án");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Tạo hồ sơ bệnh án" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  // Access control
  if (!user || user.role !== "doctor") {
    return (
      <DoctorLayout title="Tạo hồ sơ bệnh án" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Không có quyền truy cập. Chỉ dành cho bác sĩ.
            </p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  if (!patient) {
    return (
      <DoctorLayout title="Tạo hồ sơ bệnh án" activePage="patients">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Không tìm thấy thông tin bệnh nhân.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/doctors/patients")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại danh sách bệnh nhân
            </Button>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout
      title="Tạo hồ sơ bệnh án"
      activePage="patients"
      subtitle={`${patient.full_name} - ${calculateAge(
        patient.date_of_birth
      )} tuổi`}
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/doctors/patients/${patient.patient_id}`)
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <Button
            onClick={saveMedicalRecord}
            disabled={
              saving || !formData.chief_complaint || !formData.diagnosis
            }
            className="bg-teal-600 hover:bg-teal-700"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu hồ sơ bệnh án
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
                  {patient.full_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
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
                    {patient.phone_number || "Chưa có"}
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {patient.email || "Chưa có"}
                  </div>
                  <div>
                    <Badge variant="outline">
                      {patient.gender === "male"
                        ? "Nam"
                        : patient.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Conditions & Allergies */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label className="text-sm font-medium">
                  Tình trạng bệnh lý
                </Label>
                <div className="mt-1">
                  {patient.medical_conditions &&
                  patient.medical_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {patient.medical_conditions.map((condition, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
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
                        <Badge
                          key={index}
                          variant="destructive"
                          className="text-xs"
                        >
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

        {/* Visit Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thông tin khám
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visit_date">Ngày khám *</Label>
                <Input
                  id="visit_date"
                  type="date"
                  value={formData.visit_date}
                  onChange={(e) =>
                    updateFormField("visit_date", e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Examination Forms */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lý do khám chính *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Mô tả lý do khám chính của bệnh nhân..."
                value={formData.chief_complaint}
                onChange={(e) =>
                  updateFormField("chief_complaint", e.target.value)
                }
                rows={4}
                className={!formData.chief_complaint ? "border-red-200" : ""}
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
                value={formData.present_illness}
                onChange={(e) =>
                  updateFormField("present_illness", e.target.value)
                }
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
                value={formData.past_medical_history}
                onChange={(e) =>
                  updateFormField("past_medical_history", e.target.value)
                }
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
                value={formData.physical_examination}
                onChange={(e) =>
                  updateFormField("physical_examination", e.target.value)
                }
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Vital Signs */}
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
                  value={formData.vital_signs.temperature || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "temperature",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
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
                    value={formData.vital_signs.blood_pressure_systolic || ""}
                    onChange={(e) =>
                      updateVitalSigns(
                        "blood_pressure_systolic",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                  <span className="flex items-center">/</span>
                  <Input
                    type="number"
                    placeholder="80"
                    value={formData.vital_signs.blood_pressure_diastolic || ""}
                    onChange={(e) =>
                      updateVitalSigns(
                        "blood_pressure_diastolic",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
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
                  value={formData.vital_signs.heart_rate || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "heart_rate",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Respiratory Rate */}
              <div className="space-y-2">
                <Label>Nhịp thở (lần/phút)</Label>
                <Input
                  type="number"
                  placeholder="16"
                  value={formData.vital_signs.respiratory_rate || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "respiratory_rate",
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* Oxygen Saturation */}
              <div className="space-y-2">
                <Label>SpO2 (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="98"
                  value={formData.vital_signs.oxygen_saturation || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "oxygen_saturation",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
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
                  value={formData.vital_signs.weight || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "weight",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
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
                  value={formData.vital_signs.height || ""}
                  onChange={(e) =>
                    updateVitalSigns(
                      "height",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                />
              </div>

              {/* BMI Display */}
              <div className="space-y-2">
                <Label>BMI</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-lg font-semibold">
                    {calculateBMI() || "--"}
                  </span>
                  {calculateBMI() && (
                    <div className="text-xs text-gray-600 mt-1">
                      {calculateBMI()! < 18.5 && "Thiếu cân"}
                      {calculateBMI()! >= 18.5 &&
                        calculateBMI()! < 25 &&
                        "Bình thường"}
                      {calculateBMI()! >= 25 &&
                        calculateBMI()! < 30 &&
                        "Thừa cân"}
                      {calculateBMI()! >= 30 && "Béo phì"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Health Alerts */}
            <div className="mt-6 space-y-2">
              {formData.vital_signs.temperature &&
                (formData.vital_signs.temperature > 38 ||
                  formData.vital_signs.temperature < 36) && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      Nhiệt độ bất thường: {formData.vital_signs.temperature}°C
                    </AlertDescription>
                  </Alert>
                )}

              {formData.vital_signs.blood_pressure_systolic &&
                formData.vital_signs.blood_pressure_systolic > 140 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Huyết áp cao:{" "}
                      {formData.vital_signs.blood_pressure_systolic}/
                      {formData.vital_signs.blood_pressure_diastolic} mmHg
                    </AlertDescription>
                  </Alert>
                )}

              {formData.vital_signs.heart_rate &&
                (formData.vital_signs.heart_rate > 100 ||
                  formData.vital_signs.heart_rate < 60) && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Nhịp tim bất thường: {formData.vital_signs.heart_rate} bpm
                    </AlertDescription>
                  </Alert>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Diagnosis and Treatment */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Diagnosis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Chẩn đoán *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Chẩn đoán bệnh, mã ICD-10 nếu có..."
                value={formData.diagnosis}
                onChange={(e) => updateFormField("diagnosis", e.target.value)}
                rows={4}
                className={!formData.diagnosis ? "border-red-200" : ""}
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
                value={formData.treatment_plan}
                onChange={(e) =>
                  updateFormField("treatment_plan", e.target.value)
                }
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
                value={formData.medications}
                onChange={(e) => updateFormField("medications", e.target.value)}
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
                value={formData.follow_up_instructions}
                onChange={(e) =>
                  updateFormField("follow_up_instructions", e.target.value)
                }
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ghi chú thêm</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Ghi chú thêm, quan sát đặc biệt..."
              value={formData.notes}
              onChange={(e) => updateFormField("notes", e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Required Fields Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Các trường có dấu (*) là bắt buộc. Vui lòng điền đầy đủ thông tin
            trước khi lưu hồ sơ bệnh án.
          </AlertDescription>
        </Alert>
      </div>
    </DoctorLayout>
  );
}
