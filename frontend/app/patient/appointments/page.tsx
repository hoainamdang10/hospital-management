"use client";

import { PatientLayout } from "@/components/layout/UniversalLayout";
import { AppointmentBookingModal } from "@/components/patient/AppointmentBookingModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { appointmentsApi, patientsApi } from "@/lib/api";
import { availabilityApi } from "@/lib/api/availability";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  MapPin,
  Plus,
  Search,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  reason: string;
  notes?: string;
  consultation_fee: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  // Extended fields from API joins
  doctor_name?: string;
  doctor_specialization?: string;
  patient_name?: string;
  // Legacy fields for backward compatibility
  appointment_time?: string;
  treatment_description?: string;
}

export default function PatientAppointments() {
  const { user, loading } = useEnhancedAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Reschedule modal state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [appointmentToReschedule, setAppointmentToReschedule] =
    useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [availableTimeSlotsForReschedule, setAvailableTimeSlotsForReschedule] =
    useState<string[]>([]);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] =
    useState(false);

  // Get patient ID when user is loaded
  useEffect(() => {
    if (user && user.role === "patient" && user.profile_id) {
      loadPatientProfile();
    }
  }, [user]);

  const loadPatientProfile = async () => {
    try {
      if (!user?.profile_id) return;

      const response = await patientsApi.getByProfileId(user.profile_id);
      if (response.success && response.data) {
        setPatientId(response.data.patient_id);
        loadAppointments(response.data.patient_id);
      } else {
        toast.error("Không thể tải thông tin bệnh nhân");
      }
    } catch (error) {
      console.error("Error loading patient profile:", error);
      toast.error("Lỗi khi tải thông tin bệnh nhân");
    }
  };

  const loadAppointments = async (patientIdParam: string) => {
    try {
      setIsLoadingAppointments(true);
      const response = await appointmentsApi.getByPatientId(patientIdParam);

      if (response.success && response.data) {
        setAppointments(response.data);
      } else {
        toast.error("Không thể tải danh sách lịch hẹn");
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      toast.error("Lỗi khi tải danh sách lịch hẹn");
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Mock data removed - now using real API data

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn hủy lịch hẹn này không?"
      );
      if (!confirmed) return;

      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "cancelled"
      );

      if (response.success) {
        toast.success("Đã hủy lịch hẹn thành công");
        // Reload appointments to reflect changes
        if (patientId) {
          loadAppointments(patientId);
        }
      } else {
        toast.error("Không thể hủy lịch hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Lỗi khi hủy lịch hẹn");
    }
  };

  // Handle appointment rescheduling
  const handleRescheduleAppointment = async (appointmentId: string) => {
    const appointment = appointments.find(
      (apt) => apt.appointment_id === appointmentId
    );
    if (!appointment) {
      toast.error("Không tìm thấy thông tin lịch hẹn");
      return;
    }

    // Check if appointment can be rescheduled
    if (
      appointment.status !== "scheduled" &&
      appointment.status !== "confirmed"
    ) {
      toast.error(
        "Chỉ có thể đổi lịch các cuộc hẹn đã lên lịch hoặc đã xác nhận"
      );
      return;
    }

    setAppointmentToReschedule(appointment);
    setRescheduleDate("");
    setRescheduleTime("");
    setAvailableTimeSlotsForReschedule([]);
    setIsRescheduleModalOpen(true);
  };

  // Fetch available slots for rescheduling
  const fetchRescheduleTimeSlots = async (doctorId: string, date: string) => {
    if (!doctorId || !date) return;

    setIsLoadingRescheduleSlots(true);
    try {
      console.log("🔄 Fetching reschedule slots for:", { doctorId, date });

      const response = await availabilityApi.getAvailableTimeSlots(
        doctorId,
        date,
        30
      );
      if (response.success && response.data) {
        const timeSlots = response.data.map((slot) => slot.time);
        setAvailableTimeSlotsForReschedule(timeSlots);
        console.log("✅ Reschedule slots loaded:", timeSlots);
      } else {
        console.error("❌ Failed to fetch reschedule slots:", response.error);
        toast.error("Không thể tải danh sách giờ khám");
      }
    } catch (error) {
      console.error("💥 Error fetching reschedule slots:", error);
      toast.error("Lỗi khi tải danh sách giờ khám");
    } finally {
      setIsLoadingRescheduleSlots(false);
    }
  };

  // Handle reschedule date change
  const handleRescheduleDateChange = (date: string) => {
    setRescheduleDate(date);
    setRescheduleTime("");
    setAvailableTimeSlotsForReschedule([]);

    if (appointmentToReschedule && date) {
      fetchRescheduleTimeSlots(appointmentToReschedule.doctor_id, date);
    }
  };

  // Confirm reschedule
  const confirmReschedule = async () => {
    if (!appointmentToReschedule || !rescheduleDate || !rescheduleTime) {
      toast.error("Vui lòng chọn ngày và giờ mới");
      return;
    }

    try {
      console.log("🔄 Confirming reschedule...");

      // Check availability one more time
      const [hours, minutes] = rescheduleTime.split(":");
      const startTime = `${hours}:${minutes}`;
      const endTime = `${String(
        parseInt(hours) + (parseInt(minutes) + 30) / 60
      ).padStart(2, "0")}:${String((parseInt(minutes) + 30) % 60).padStart(
        2,
        "0"
      )}`;

      const availabilityCheck = await availabilityApi.checkTimeSlotAvailability(
        appointmentToReschedule.doctor_id,
        {
          date: rescheduleDate,
          start_time: startTime,
          end_time: endTime,
        }
      );

      if (!availabilityCheck.success || !availabilityCheck.data?.available) {
        toast.error(
          "Khung giờ đã được đặt bởi người khác. Vui lòng chọn giờ khác!"
        );
        await fetchRescheduleTimeSlots(
          appointmentToReschedule.doctor_id,
          rescheduleDate
        );
        return;
      }

      // Update appointment
      const updateData = {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
      };

      const response = await appointmentsApi.update(
        appointmentToReschedule.appointment_id,
        updateData
      );

      if (response.success) {
        toast.success("Đổi lịch hẹn thành công!");
        setIsRescheduleModalOpen(false);
        setAppointmentToReschedule(null);

        // Reload appointments
        if (patientId) {
          loadAppointments(patientId);
        }
      } else {
        toast.error("Không thể đổi lịch hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("💥 Error rescheduling appointment:", error);
      toast.error("Lỗi khi đổi lịch hẹn. Vui lòng thử lại.");
    }
  };

  // Handle opening booking modal
  const handleOpenBookingModal = () => {
    if (!patientId) {
      toast.error("Không thể xác định thông tin bệnh nhân");
      return;
    }
    setIsBookingModalOpen(true);
  };

  // Handle appointment booked successfully
  const handleAppointmentBooked = () => {
    if (patientId) {
      loadAppointments(patientId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch =
      (appointment.doctor_name &&
        appointment.doctor_name
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (appointment.treatment_description &&
        appointment.treatment_description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (appointment.doctor_specialization &&
        appointment.doctor_specialization
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));
    const matchesFilter =
      filterStatus === "all" ||
      appointment.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Sort appointments by date and time
  const sortedAppointments = filteredAppointments.sort((a, b) => {
    const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (loading || isLoadingAppointments) {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  if (!user || user.role !== "patient") {
    return (
      <PatientLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Access denied. Patient role required.
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="My Appointments" activePage="appointments">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              My Appointments
            </h2>
            <p className="text-gray-600">
              View and manage your medical appointments
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleOpenBookingModal}
          >
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search doctors, specializations, or appointment types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter appointments by status"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {sortedAppointments.map((appointment) => (
          <Card
            key={appointment.appointment_id}
            className="hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">
                        {appointment.doctor_name || "Bác sĩ chưa xác định"}
                      </h3>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusIcon(appointment.status)}
                      <span className="ml-1 capitalize">
                        {appointment.status}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {appointment.appointment_date}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {appointment.appointment_time
                          ? `${appointment.appointment_time}${
                              appointment.duration_minutes
                                ? ` (${appointment.duration_minutes} phút)`
                                : ""
                            }`
                          : "Chưa xác định"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Phòng khám</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">
                        {appointment.doctor_specialization ||
                          "Chuyên khoa chưa xác định"}
                      </span>
                      <span className="text-sm text-gray-500">
                        • Bệnh viện Đa khoa
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-700">
                      Lý do khám:{" "}
                      {appointment.reason ||
                        appointment.treatment_description ||
                        "Khám tổng quát"}
                    </p>
                    {appointment.appointment_type && (
                      <p className="text-sm text-gray-600">
                        Loại hẹn:{" "}
                        {appointment.appointment_type === "consultation"
                          ? "Khám tư vấn"
                          : appointment.appointment_type === "follow_up"
                          ? "Tái khám"
                          : appointment.appointment_type === "emergency"
                          ? "Cấp cứu"
                          : appointment.appointment_type === "routine_checkup"
                          ? "Khám định kỳ"
                          : appointment.appointment_type}
                      </p>
                    )}
                    {appointment.consultation_fee && (
                      <p className="text-sm text-gray-600">
                        Phí khám:{" "}
                        {appointment.consultation_fee.toLocaleString("vi-VN")}{" "}
                        VNĐ
                        {appointment.payment_status && (
                          <span
                            className={`ml-2 px-2 py-1 rounded-full text-xs ${
                              appointment.payment_status === "paid"
                                ? "bg-green-100 text-green-800"
                                : appointment.payment_status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {appointment.payment_status === "paid"
                              ? "Đã thanh toán"
                              : appointment.payment_status === "pending"
                              ? "Chờ thanh toán"
                              : appointment.payment_status === "refunded"
                              ? "Đã hoàn tiền"
                              : "Thất bại"}
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      Ngày tạo:{" "}
                      {new Date(appointment.created_at).toLocaleDateString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  {appointment.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() =>
                        handleCancelAppointment(appointment.appointment_id)
                      }
                    >
                      Cancel
                    </Button>
                  )}
                  {appointment.status === "confirmed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                      onClick={() =>
                        handleRescheduleAppointment(appointment.appointment_id)
                      }
                    >
                      Reschedule
                    </Button>
                  )}
                  {appointment.status === "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                    >
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {sortedAppointments.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "You don't have any appointments scheduled yet"}
              </p>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleOpenBookingModal}
              >
                <Plus className="h-4 w-4 mr-2" />
                Book Your First Appointment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Appointment Booking Modal */}
      {patientId && (
        <AppointmentBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          patientId={patientId}
          onAppointmentBooked={handleAppointmentBooked}
        />
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && appointmentToReschedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Đổi lịch hẹn</h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Lịch hẹn hiện tại:</p>
                <p className="font-medium">
                  {appointmentToReschedule.doctor_name}
                </p>
                <p className="text-sm">
                  {appointmentToReschedule.appointment_date} •{" "}
                  {appointmentToReschedule.appointment_time}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="reschedule-date">Chọn ngày mới</Label>
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => handleRescheduleDateChange(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                {rescheduleDate && (
                  <div>
                    <Label htmlFor="reschedule-time">Chọn giờ mới</Label>
                    {isLoadingRescheduleSlots ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-600 mt-2">
                          Đang tải giờ khám...
                        </p>
                      </div>
                    ) : availableTimeSlotsForReschedule.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {availableTimeSlotsForReschedule.map((time) => (
                          <Button
                            key={time}
                            variant={
                              rescheduleTime === time ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setRescheduleTime(time)}
                            className="text-xs"
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">
                        Không có giờ khám nào khả dụng trong ngày này
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsRescheduleModalOpen(false);
                    setAppointmentToReschedule(null);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  className="flex-1"
                  onClick={confirmReschedule}
                  disabled={!rescheduleDate || !rescheduleTime}
                >
                  Xác nhận đổi lịch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}
