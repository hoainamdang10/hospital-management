"use client";

import { DoctorLayout } from "@/components/layout/UniversalLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appointmentsApi } from "@/lib/api/appointments";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Phone,
  Play,
  RefreshCw,
  Stethoscope,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface TodayAppointment {
  appointment_id: string;
  patient_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status:
    | "scheduled"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";
  reason?: string;
  notes?: string;
  created_at: string;
}

interface DayStats {
  total_appointments: number;
  completed: number;
  in_progress: number;
  upcoming: number;
  cancelled: number;
}

export default function TodayWorkflowPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useEnhancedAuth();

  // State management
  const [appointments, setAppointments] = useState<TodayAppointment[]>([]);
  const [stats, setStats] = useState<DayStats>({
    total_appointments: 0,
    completed: 0,
    in_progress: 0,
    upcoming: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Load today's appointments
  useEffect(() => {
    if (user?.role === "doctor") {
      loadTodayAppointments();
    }
  }, [user]);

  const loadTodayAppointments = async () => {
    try {
      setLoading(true);

      const today = new Date().toISOString().split("T")[0];

      // Get today's appointments for the doctor
      const response = await appointmentsApi.getByDoctorId(
        user?.doctor_id || user?.id || "",
        {
          date: today,
        }
      );

      if (response.success && response.data) {
        const todayAppointments = response.data;
        setAppointments(todayAppointments);

        // Calculate stats
        const newStats = {
          total_appointments: todayAppointments.length,
          completed: todayAppointments.filter(
            (apt) => apt.status === "completed"
          ).length,
          in_progress: todayAppointments.filter(
            (apt) => apt.status === "in_progress"
          ).length,
          upcoming: todayAppointments.filter(
            (apt) => apt.status === "confirmed" || apt.status === "scheduled"
          ).length,
          cancelled: todayAppointments.filter(
            (apt) => apt.status === "cancelled" || apt.status === "no_show"
          ).length,
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error("Error loading today appointments:", error);
      toast.error("Có lỗi xảy ra khi tải lịch hẹn hôm nay");
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadTodayAppointments();
    setRefreshing(false);
    toast.success("Đã cập nhật dữ liệu");
  };

  // Start consultation
  const startConsultation = (appointmentId: string) => {
    router.push(`/doctors/consultation/${appointmentId}`);
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "in_progress":
        return "secondary";
      case "confirmed":
        return "outline";
      case "scheduled":
        return "outline";
      case "cancelled":
        return "destructive";
      case "no_show":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Format status text
  const formatStatus = (status: string) => {
    switch (status) {
      case "scheduled":
        return "Đã lên lịch";
      case "confirmed":
        return "Đã xác nhận";
      case "in_progress":
        return "Đang khám";
      case "completed":
        return "Hoàn thành";
      case "cancelled":
        return "Đã hủy";
      case "no_show":
        return "Không đến";
      default:
        return status;
    }
  };

  // Check if appointment is current (within time range)
  const isCurrentAppointment = (appointment: TodayAppointment) => {
    const now = new Date();
    const appointmentStart = new Date(
      `${appointment.appointment_date}T${appointment.start_time}`
    );
    const appointmentEnd = new Date(
      `${appointment.appointment_date}T${appointment.end_time}`
    );

    return now >= appointmentStart && now <= appointmentEnd;
  };

  // Check if appointment is upcoming (starts within next hour)
  const isUpcomingAppointment = (appointment: TodayAppointment) => {
    const now = new Date();
    const appointmentTime =
      appointment.appointment_time || appointment.start_time;
    const appointmentStart = new Date(
      `${appointment.appointment_date}T${appointmentTime}`
    );
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    return appointmentStart > now && appointmentStart <= oneHourFromNow;
  };

  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    const timeA = a.appointment_time || a.start_time;
    const timeB = b.appointment_time || b.start_time;
    return timeA.localeCompare(timeB);
  });

  // Group appointments by status
  const currentAppointments = sortedAppointments.filter(
    (apt) => apt.status === "in_progress"
  );
  const upcomingAppointments = sortedAppointments.filter(
    (apt) =>
      (apt.status === "confirmed" || apt.status === "scheduled") &&
      new Date(`${apt.appointment_date}T${apt.start_time}`) > new Date()
  );
  const completedAppointments = sortedAppointments.filter(
    (apt) => apt.status === "completed"
  );

  // Loading state
  if (authLoading || loading) {
    return (
      <DoctorLayout title="Lịch làm việc hôm nay" activePage="today">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  // Access control
  if (!user || user.role !== "doctor") {
    return (
      <DoctorLayout title="Lịch làm việc hôm nay" activePage="today">
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

  return (
    <DoctorLayout
      title="Lịch làm việc hôm nay"
      activePage="today"
      subtitle={`${new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} - ${currentTime.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`}
      headerActions={
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang cập nhật..." : "Cập nhật"}
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Daily Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Tổng lịch hẹn
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_appointments}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đang khám</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.in_progress}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sắp tới</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.upcoming}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Hoàn thành
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.completed}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.cancelled}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Consultation Alert */}
        {currentAppointments.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <Timer className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Bạn đang có {currentAppointments.length} cuộc khám đang diễn ra.
            </AlertDescription>
          </Alert>
        )}

        {/* Appointment Sections */}
        <div className="space-y-6">
          {/* Current Consultations */}
          {currentAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5 text-orange-600" />
                  Đang khám ({currentAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentAppointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {appointment.patient_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patient_name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.start_time} - {appointment.end_time}
                            </span>
                            {appointment.patient_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {appointment.patient_phone}
                              </span>
                            )}
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Lý do:</strong> {appointment.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-orange-800"
                        >
                          Đang khám
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() =>
                            startConsultation(appointment.appointment_id)
                          }
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <Stethoscope className="h-4 w-4 mr-2" />
                          Tiếp tục khám
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Lịch hẹn sắp tới ({upcomingAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src="" />
                          <AvatarFallback>
                            {appointment.patient_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {appointment.patient_name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.start_time} - {appointment.end_time}
                            </span>
                            {appointment.patient_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {appointment.patient_phone}
                              </span>
                            )}
                            <span className="text-xs">
                              {appointment.appointment_type}
                            </span>
                          </div>
                          {appointment.reason && (
                            <p className="text-sm text-gray-700 mt-1">
                              <strong>Lý do:</strong> {appointment.reason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={getStatusBadgeVariant(appointment.status)}
                        >
                          {formatStatus(appointment.status)}
                        </Badge>
                        {appointment.status === "confirmed" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              startConsultation(appointment.appointment_id)
                            }
                            className="bg-teal-600 hover:bg-teal-700"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Bắt đầu khám
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/doctors/patients/${appointment.patient_id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Completed Appointments */}
          {completedAppointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Đã hoàn thành ({completedAppointments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {completedAppointments.map((appointment) => (
                  <div
                    key={appointment.appointment_id}
                    className="p-4 border border-green-200 bg-green-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="" />
                          <AvatarFallback className="text-sm">
                            {appointment.patient_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {appointment.patient_name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {appointment.start_time} - {appointment.end_time}
                            </span>
                            <span className="text-xs">
                              {appointment.appointment_type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-green-600">
                          Hoàn thành
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/doctors/patients/${appointment.patient_id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* No Appointments */}
          {appointments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có lịch hẹn hôm nay
                </h3>
                <p className="text-gray-600 mb-4">
                  Bạn không có lịch hẹn nào được lên lịch cho hôm nay. Hãy nghỉ
                  ngơi hoặc kiểm tra lịch hẹn tuần tới.
                </p>
                <Button
                  onClick={() => router.push("/doctors/appointments")}
                  variant="outline"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Xem tất cả lịch hẹn
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
