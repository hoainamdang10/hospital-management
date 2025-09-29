"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { doctorsApi, appointmentsApi, departmentsApi } from "@/lib/api";
import { Doctor, Department, AppointmentForm } from "@/lib/types";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Building2,
  Search,
  Star,
  DollarSign,
  CheckCircle,
} from "lucide-react";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onAppointmentBooked: () => void;
}

export function AppointmentBookingModal({
  isOpen,
  onClose,
  patientId,
  onAppointmentBooked,
}: AppointmentBookingModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState<Partial<AppointmentForm>>({
    patient_id: patientId,
    appointment_date: "",
    appointment_time: "",
    duration_minutes: 30,
    type: "consultation",
    notes: "",
    symptoms: "",
  });

  // Load departments on mount
  useEffect(() => {
    if (isOpen) {
      loadDepartments();
      resetForm();
    }
  }, [isOpen]);

  // Load doctors when department changes
  useEffect(() => {
    if (selectedDepartment) {
      loadDoctors();
    }
  }, [selectedDepartment]);

  // Load available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && formData.appointment_date) {
      loadAvailableSlots();
    }
  }, [selectedDoctor, formData.appointment_date]);

  const resetForm = () => {
    setStep(1);
    setSelectedDepartment("");
    setSelectedDoctor(null);
    setSearchTerm("");
    setAvailableSlots([]);
    setFormData({
      patient_id: patientId,
      appointment_date: "",
      appointment_time: "",
      duration_minutes: 30,
      type: "consultation",
      notes: "",
      symptoms: "",
    });
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsApi.getAll();
      if (response.success && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Không thể tải danh sách khoa");
    }
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorsApi.getByDepartment(selectedDepartment);
      if (response.success && response.data) {
        setDoctors(response.data.filter((doctor) => doctor.status === "active"));
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      toast.error("Không thể tải danh sách bác sĩ");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDoctor || !formData.appointment_date) return;

    try {
      setLoading(true);
      const response = await appointmentsApi.getAvailableSlots(
        selectedDoctor.id,
        formData.appointment_date
      );
      if (response.success && response.data) {
        setAvailableSlots(response.data);
      }
    } catch (error) {
      console.error("Error loading available slots:", error);
      toast.error("Không thể tải lịch trống");
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      `${doctor.first_name} ${doctor.last_name}`.toLowerCase().includes(searchLower) ||
      doctor.specialization.toLowerCase().includes(searchLower)
    );
  });

  const handleDoctorSelect = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setFormData((prev) => ({ ...prev, doctor_id: doctor.id }));
    setStep(3);
  };

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({ ...prev, appointment_date: date }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData((prev) => ({ ...prev, appointment_time: time }));
  };

  const handleSubmit = async () => {
    if (!formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setLoading(true);
      const response = await appointmentsApi.create(formData as AppointmentForm);
      
      if (response.success) {
        toast.success("Đặt lịch hẹn thành công!");
        onAppointmentBooked();
        onClose();
      } else {
        toast.error("Không thể đặt lịch hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      toast.error("Lỗi khi đặt lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // Allow booking up to 30 days in advance
    return maxDate.toISOString().split("T")[0];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Đặt lịch khám bệnh
          </DialogTitle>
          <DialogDescription>
            Chọn bác sĩ và thời gian phù hợp cho lịch khám của bạn
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div
                    className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Chọn chuyên khoa
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {departments.map((department) => (
                  <Card
                    key={department.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedDepartment === department.id
                        ? "ring-2 ring-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedDepartment(department.id);
                      setStep(2);
                    }}
                  >
                    <CardContent className="p-4">
                      <h4 className="font-medium">{department.name}</h4>
                      {department.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {department.description}
                        </p>
                      )}
                      {department.location && (
                        <p className="text-sm text-gray-500 mt-2">
                          📍 {department.location}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Chọn bác sĩ
              </h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm bác sĩ theo tên hoặc chuyên môn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  {filteredDoctors.map((doctor) => (
                    <Card
                      key={doctor.id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => handleDoctorSelect(doctor)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">
                              BS. {doctor.first_name} {doctor.last_name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {doctor.specialization}
                            </p>
                            {doctor.experience_years && (
                              <p className="text-sm text-gray-500">
                                {doctor.experience_years} năm kinh nghiệm
                              </p>
                            )}
                            {doctor.consultation_fee && (
                              <div className="flex items-center gap-1 mt-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-600">
                                  {doctor.consultation_fee.toLocaleString("vi-VN")} VNĐ
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && selectedDoctor && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Chọn ngày và giờ khám
              </h3>
              
              {/* Selected Doctor Info */}
              <Card className="mb-4 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">
                        BS. {selectedDoctor.first_name} {selectedDoctor.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <div className="mb-4">
                <Label htmlFor="appointment-date">Chọn ngày khám</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={formData.appointment_date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Time Slots */}
              {formData.appointment_date && (
                <div>
                  <Label>Chọn giờ khám</Label>
                  {loading ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot}
                          variant={formData.appointment_time === slot ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTimeSelect(slot)}
                          className="text-sm"
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      Không có lịch trống cho ngày này. Vui lòng chọn ngày khác.
                    </p>
                  )}
                </div>
              )}

              {formData.appointment_time && (
                <Button
                  onClick={() => setStep(4)}
                  className="mt-4 w-full"
                >
                  Tiếp tục
                </Button>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Thông tin chi tiết
              </h3>

              {/* Appointment Summary */}
              <Card className="mb-4 bg-green-50">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Thông tin lịch hẹn</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Bác sĩ:</strong> BS. {selectedDoctor?.first_name} {selectedDoctor?.last_name}</p>
                    <p><strong>Chuyên khoa:</strong> {selectedDoctor?.specialization}</p>
                    <p><strong>Ngày khám:</strong> {formData.appointment_date}</p>
                    <p><strong>Giờ khám:</strong> {formData.appointment_time}</p>
                    {selectedDoctor?.consultation_fee && (
                      <p><strong>Phí khám:</strong> {selectedDoctor.consultation_fee.toLocaleString("vi-VN")} VNĐ</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="appointment-type">Loại khám</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Khám tư vấn</SelectItem>
                      <SelectItem value="follow_up">Tái khám</SelectItem>
                      <SelectItem value="routine_checkup">Khám định kỳ</SelectItem>
                      <SelectItem value="emergency">Cấp cứu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="symptoms">Triệu chứng</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Mô tả triệu chứng hoặc lý do khám..."
                    value={formData.symptoms}
                    onChange={(e) => setFormData(prev => ({ ...prev, symptoms: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú thêm</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thêm (tùy chọn)..."
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  Quay lại
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              {step === 4 && (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Đang đặt lịch..." : "Xác nhận đặt lịch"}
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
