"use client";

import { FileUploadZone } from "@/components/files/FileUploadZone";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { departmentsApi, doctorsApi } from "@/lib/api";
import { appointmentsApi } from "@/lib/api/appointments";
import { availabilityApi } from "@/lib/api/availability";
import { type UploadResult } from "@/lib/api/files";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Filter,
  Mail,
  Phone,
  Search,
  Star,
  Stethoscope,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Doctor {
  doctor_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  specialization: string;
  phone?: string;
  email?: string;
  department_id?: string;
  department_name?: string;
  experience_years?: number;
  rating?: number;
  available_times?: string[];
  next_available?: string;
}

interface Department {
  department_id: string;
  name: string;
  description?: string;
}

interface BookingForm {
  selectedDoctor: string;
  selectedDate: string;
  selectedTime: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  symptoms: string;
  urgency: string;
}

// Available time slots will be fetched from API based on selected doctor and date

export default function BookAppointmentPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Time, 3: Patient Info, 4: Confirmation
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingForm>({
    selectedDoctor: "",
    selectedDate: "",
    selectedTime: "",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    symptoms: "",
    urgency: "normal",
  });
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadResult[]>(
    []
  );

  // Get selected doctor info
  const selectedDoctor = doctors.find(
    (doc) => doc.doctor_id === bookingForm.selectedDoctor
  );

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [doctorsData, departmentsData] = await Promise.all([
          doctorsApi.getAllDoctors(),
          departmentsApi.getAllDepartments(),
        ]);
        setDoctors(doctorsData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        // Mock data fallback
        setDoctors([
          {
            doctor_id: "1",
            user_id: "1",
            first_name: "Nguyễn",
            last_name: "Văn An",
            specialization: "Tim mạch",
            department_name: "Khoa Tim mạch",
            experience_years: 15,
            rating: 4.8,
            next_available: "2025-01-04",
          },
          {
            doctor_id: "2",
            user_id: "2",
            first_name: "Trần",
            last_name: "Thị Bình",
            specialization: "Nhi khoa",
            department_name: "Khoa Nhi",
            experience_years: 12,
            rating: 4.9,
            next_available: "2025-01-04",
          },
        ]);
        setDepartments([
          { department_id: "1", name: "Khoa Tim mạch" },
          { department_id: "2", name: "Khoa Nhi" },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      searchTerm === "" ||
      `${doctor.first_name} ${doctor.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      doctor.department_name === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  // selectedDoctor already defined above, no need to redeclare

  const handleDoctorSelect = (doctorId: string) => {
    setBookingForm((prev) => ({ ...prev, selectedDoctor: doctorId }));
    setStep(2);
  };

  // Fetch available time slots when doctor and date are selected
  const fetchAvailableTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;

    setIsLoadingTimeSlots(true);
    try {
      console.log("🔄 Fetching real-time availability for:", {
        doctorId,
        date,
      });

      // Use new availability API for real-time data
      const response = await availabilityApi.getAvailableTimeSlots(
        doctorId,
        date,
        30
      );

      if (response.success && response.data) {
        // Extract time strings from TimeSlot objects
        const timeSlots = response.data.map((slot) => slot.time);
        setAvailableTimeSlots(timeSlots);
        console.log("✅ Real-time available slots loaded:", timeSlots);
      } else {
        console.error("❌ Failed to fetch real-time slots:", response.error);

        // Fallback: Try legacy appointment API
        try {
          const fallbackResponse = await appointmentsApi.getAvailableSlots(
            doctorId,
            date
          );
          if (fallbackResponse.success && fallbackResponse.data) {
            setAvailableTimeSlots(fallbackResponse.data);
            console.log("⚠️ Using fallback appointment API");
          } else {
            throw new Error("Both APIs failed");
          }
        } catch (fallbackError) {
          console.warn("⚠️ Using mock data due to API failures");
          // Enhanced mock data with realistic hospital hours
          setAvailableTimeSlots([
            "08:00",
            "08:30",
            "09:00",
            "09:30",
            "10:00",
            "10:30",
            "11:00",
            "11:30",
            "13:00",
            "13:30",
            "14:00",
            "14:30",
            "15:00",
            "15:30",
            "16:00",
            "16:30",
          ]);
        }
      }
    } catch (error) {
      console.error("💥 Critical error fetching time slots:", error);
      // Emergency fallback
      setAvailableTimeSlots([
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "14:00",
        "15:00",
        "16:00",
      ]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const handleTimeSelect = (date: string, time: string) => {
    setBookingForm((prev) => ({
      ...prev,
      selectedDate: date,
      selectedTime: time,
    }));
    setStep(3);
  };

  const handleFormSubmit = async () => {
    try {
      console.log("🔄 Submitting booking form:", bookingForm);

      // Validate required fields
      if (
        !bookingForm.selectedDoctor ||
        !bookingForm.selectedDate ||
        !bookingForm.selectedTime
      ) {
        console.error("❌ Missing required booking information");
        alert("Vui lòng chọn đầy đủ bác sĩ, ngày và giờ khám!");
        return;
      }

      // Check availability one more time before submitting
      console.log("🔍 Final availability check...");
      const [hours, minutes] = bookingForm.selectedTime.split(":");
      const startTime = `${hours}:${minutes}`;
      const endTime = `${String(
        parseInt(hours) + (parseInt(minutes) + 30) / 60
      ).padStart(2, "0")}:${String((parseInt(minutes) + 30) % 60).padStart(
        2,
        "0"
      )}`;

      const availabilityCheck = await availabilityApi.checkTimeSlotAvailability(
        bookingForm.selectedDoctor,
        {
          date: bookingForm.selectedDate,
          start_time: startTime,
          end_time: endTime,
        }
      );

      if (!availabilityCheck.success || !availabilityCheck.data?.available) {
        console.error("❌ Time slot no longer available");
        alert(
          "Xin lỗi, khung giờ này đã được đặt bởi người khác. Vui lòng chọn giờ khác!"
        );

        // Refresh time slots
        await fetchAvailableTimeSlots(
          bookingForm.selectedDoctor,
          bookingForm.selectedDate
        );
        setStep(2); // Go back to time selection
        return;
      }

      console.log("✅ Time slot confirmed available");

      // Store booking info with validation timestamp
      const bookingData = {
        ...bookingForm,
        doctorInfo: selectedDoctor,
        timestamp: new Date().toISOString(),
        validatedAt: new Date().toISOString(),
        startTime,
        endTime,
        uploadedDocuments: uploadedDocuments.filter((doc) => doc.success),
      };

      localStorage.setItem("pendingBooking", JSON.stringify(bookingData));

      console.log("✅ Booking prepared successfully");
      setStep(4);
    } catch (error) {
      console.error("💥 Error preparing booking:", error);
      alert("Có lỗi xảy ra khi chuẩn bị đặt lịch. Vui lòng thử lại!");
    }
  };

  const handleLoginRedirect = () => {
    // Store booking info in localStorage for after login
    localStorage.setItem("pendingBooking", JSON.stringify(bookingForm));
    router.push("/auth/login?redirect=booking");
  };

  // Get next 7 days for date selection
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
      });
    }
    return dates;
  };

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#003087] to-[#0066CC] text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Đặt lịch khám bệnh
          </h1>
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            Đặt lịch khám với bác sĩ chuyên khoa một cách nhanh chóng và tiện
            lợi
          </p>

          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mt-8">
            {[
              { num: 1, label: "Chọn bác sĩ" },
              { num: 2, label: "Chọn thời gian" },
              { num: 3, label: "Thông tin" },
              { num: 4, label: "Xác nhận" },
            ].map((stepItem, index) => (
              <div key={stepItem.num} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= stepItem.num
                      ? "bg-white text-[#003087]"
                      : "bg-white/30 text-white"
                  }`}
                >
                  {step > stepItem.num ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    stepItem.num
                  )}
                </div>
                <span className="ml-2 text-sm hidden md:inline">
                  {stepItem.label}
                </span>
                {index < 3 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-white/60" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#003087] mb-4">
                Chọn bác sĩ chuyên khoa
              </h2>

              {/* Search and Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Tìm kiếm bác sĩ hoặc chuyên khoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger className="w-full md:w-64">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Chọn khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khoa</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.department_id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Doctors Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDoctors.map((doctor) => (
                <Card
                  key={doctor.doctor_id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleDoctorSelect(doctor.doctor_id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#003087]/10 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-[#003087]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">
                          BS. {doctor.first_name} {doctor.last_name}
                        </CardTitle>
                        <p className="text-[#003087] font-medium">
                          {doctor.specialization}
                        </p>
                        {doctor.department_name && (
                          <p className="text-sm text-gray-600">
                            {doctor.department_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {doctor.experience_years && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Stethoscope className="w-4 h-4" />
                          <span>{doctor.experience_years} năm kinh nghiệm</span>
                        </div>
                      )}
                      {doctor.rating && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{doctor.rating}/5.0</span>
                        </div>
                      )}
                      {doctor.next_available && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Có lịch từ{" "}
                            {new Date(doctor.next_available).toLocaleDateString(
                              "vi-VN"
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button className="w-full bg-[#003087] hover:bg-[#002266]">
                      Chọn bác sĩ này
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600 mb-2">
                  Không tìm thấy bác sĩ nào
                </h3>
                <p className="text-gray-500">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 2 && selectedDoctor && (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setStep(1)}
                className="mb-4 text-[#003087]"
              >
                ← Quay lại chọn bác sĩ
              </Button>

              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-[#003087] mb-2">
                  Bác sĩ đã chọn:
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#003087]/10 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-[#003087]" />
                  </div>
                  <div>
                    <p className="font-medium">
                      BS. {selectedDoctor.first_name} {selectedDoctor.last_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedDoctor.specialization}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-[#003087] mb-4">
                Chọn ngày và giờ khám
              </h2>
            </div>

            {/* Date Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">Chọn ngày:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {getAvailableDates().map((date) => (
                  <Button
                    key={date.value}
                    variant={
                      bookingForm.selectedDate === date.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setBookingForm((prev) => ({
                        ...prev,
                        selectedDate: date.value,
                        selectedTime: "", // Reset selected time when date changes
                      }));
                      // Fetch available time slots for selected doctor and date
                      fetchAvailableTimeSlots(
                        bookingForm.selectedDoctor,
                        date.value
                      );
                    }}
                    className={`p-4 h-auto flex flex-col ${
                      bookingForm.selectedDate === date.value
                        ? "bg-[#003087] text-white"
                        : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                    }`}
                  >
                    <span className="text-xs">{date.label.split(",")[0]}</span>
                    <span className="font-medium">
                      {date.label.split(",")[1]}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {bookingForm.selectedDate && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Chọn giờ:</h3>
                {isLoadingTimeSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003087]"></div>
                    <span className="ml-2 text-gray-600">
                      Đang tải khung giờ khả dụng...
                    </span>
                  </div>
                ) : availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        variant={
                          bookingForm.selectedTime === time
                            ? "default"
                            : "outline"
                        }
                        onClick={() =>
                          handleTimeSelect(bookingForm.selectedDate, time)
                        }
                        className={`${
                          bookingForm.selectedTime === time
                            ? "bg-[#003087] text-white"
                            : "border-[#003087] text-[#003087] hover:bg-[#003087] hover:text-white"
                        }`}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-2">
                      Không có khung giờ khả dụng cho ngày này
                    </p>
                    <p className="text-sm text-gray-500">
                      Vui lòng chọn ngày khác
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Patient Information */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <Button
                variant="ghost"
                onClick={() => setStep(2)}
                className="mb-4 text-[#003087]"
              >
                ← Quay lại chọn thời gian
              </Button>

              <h2 className="text-2xl font-bold text-[#003087] mb-4">
                Thông tin bệnh nhân
              </h2>

              {/* Booking Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium text-[#003087] mb-2">
                  Thông tin đặt lịch:
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Bác sĩ:</strong> BS. {selectedDoctor?.first_name}{" "}
                    {selectedDoctor?.last_name}
                  </p>
                  <p>
                    <strong>Chuyên khoa:</strong>{" "}
                    {selectedDoctor?.specialization}
                  </p>
                  <p>
                    <strong>Ngày:</strong>{" "}
                    {new Date(bookingForm.selectedDate).toLocaleDateString(
                      "vi-VN",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                  <p>
                    <strong>Giờ:</strong> {bookingForm.selectedTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Form */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cá nhân</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Họ và tên *</Label>
                  <Input
                    id="patientName"
                    value={bookingForm.patientName}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        patientName: e.target.value,
                      }))
                    }
                    placeholder="Nhập họ và tên đầy đủ"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patientPhone">Số điện thoại *</Label>
                  <Input
                    id="patientPhone"
                    type="tel"
                    value={bookingForm.patientPhone}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        patientPhone: e.target.value,
                      }))
                    }
                    placeholder="Nhập số điện thoại"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="patientEmail">Email</Label>
                  <Input
                    id="patientEmail"
                    type="email"
                    value={bookingForm.patientEmail}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        patientEmail: e.target.value,
                      }))
                    }
                    placeholder="Nhập địa chỉ email (tùy chọn)"
                  />
                </div>

                <div>
                  <Label htmlFor="urgency">Mức độ khẩn cấp</Label>
                  <Select
                    value={bookingForm.urgency}
                    onValueChange={(value) =>
                      setBookingForm((prev) => ({ ...prev, urgency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Bình thường</SelectItem>
                      <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      <SelectItem value="emergency">Cấp cứu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="symptoms">Triệu chứng hoặc lý do khám</Label>
                  <Textarea
                    id="symptoms"
                    value={bookingForm.symptoms}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        symptoms: e.target.value,
                      }))
                    }
                    placeholder="Mô tả ngắn gọn triệu chứng hoặc lý do cần khám..."
                    rows={4}
                  />
                </div>

                {/* Medical Documents Upload */}
                <div>
                  <Label>Tài liệu y tế liên quan (tùy chọn)</Label>
                  <p className="text-sm text-gray-600 mb-3">
                    Có thể đính kèm kết quả xét nghiệm, hình ảnh, đơn thuốc cũ
                    để bác sĩ tham khảo
                  </p>
                  <FileUploadZone
                    onUploadSuccess={(results) => {
                      setUploadedDocuments((prev) => [...prev, ...results]);
                    }}
                    onUploadError={(error) => {
                      console.error("Upload error:", error);
                    }}
                    documentType="medical_report"
                    maxFiles={3}
                    maxSize={3 * 1024 * 1024} // 3MB
                    className="border-dashed border-2 border-gray-200"
                  />
                  {uploadedDocuments.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-green-600">
                        ✓ Đã tải lên{" "}
                        {uploadedDocuments.filter((doc) => doc.success).length}{" "}
                        tài liệu
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 mb-1">
                        Lưu ý quan trọng:
                      </p>
                      <ul className="text-yellow-700 space-y-1">
                        <li>• Vui lòng đến trước giờ hẹn 15 phút</li>
                        <li>
                          • Mang theo CMND/CCCD và thẻ bảo hiểm y tế (nếu có)
                        </li>
                        <li>• Liên hệ hotline nếu cần thay đổi lịch hẹn</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  <Button
                    onClick={handleFormSubmit}
                    disabled={
                      !bookingForm.patientName || !bookingForm.patientPhone
                    }
                    className="flex-1 bg-[#003087] hover:bg-[#002266]"
                  >
                    Xác nhận đặt lịch
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Đặt lịch thành công!
              </h2>
              <p className="text-gray-600 mb-8">
                Thông tin đặt lịch của bạn đã được ghi nhận. Để hoàn tất quy
                trình, vui lòng đăng nhập hoặc tạo tài khoản.
              </p>
            </div>

            {/* Booking Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Thông tin lịch hẹn</CardTitle>
              </CardHeader>
              <CardContent className="text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bác sĩ:</span>
                  <span className="font-medium">
                    BS. {selectedDoctor?.first_name} {selectedDoctor?.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Chuyên khoa:</span>
                  <span className="font-medium">
                    {selectedDoctor?.specialization}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày:</span>
                  <span className="font-medium">
                    {new Date(bookingForm.selectedDate).toLocaleDateString(
                      "vi-VN",
                      {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Giờ:</span>
                  <span className="font-medium">
                    {bookingForm.selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Bệnh nhân:</span>
                  <span className="font-medium">{bookingForm.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điện thoại:</span>
                  <span className="font-medium">
                    {bookingForm.patientPhone}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={handleLoginRedirect}
                className="w-full bg-[#003087] hover:bg-[#002266] text-lg py-6"
              >
                Đăng nhập để hoàn tất
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <div className="text-sm text-gray-600">
                <p>
                  Chưa có tài khoản?
                  <Button
                    variant="link"
                    onClick={() =>
                      router.push("/auth/register?redirect=booking")
                    }
                    className="text-[#003087] p-0 ml-1"
                  >
                    Đăng ký ngay
                  </Button>
                </p>
              </div>

              <div className="border-t pt-4 mt-6">
                <p className="text-sm text-gray-600 mb-2">Cần hỗ trợ?</p>
                <div className="flex justify-center gap-4">
                  <Button variant="outline" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Gọi hotline
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="w-4 h-4 mr-2" />
                    Gửi email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
