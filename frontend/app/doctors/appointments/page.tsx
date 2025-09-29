"use client";

import { DoctorLayout } from "@/components/layout/UniversalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appointmentsApi } from "@/lib/api/appointments";
import { doctorsApi } from "@/lib/api/doctors";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Appointment {
  appointment_id: string;
  patient_name: string;
  patient_phone?: string;
  patient_email?: string;
  patient_age?: number;
  appointment_date: string;
  start_time: string;
  end_time?: string;
  appointment_type: string;
  status: string;
  reason?: string;
  notes?: string;
}

export default function DoctorAppointments() {
  const { user, loading } = useEnhancedAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);

  // Fetch appointments when user is available
  useEffect(() => {
    if (user && user.role === "doctor") {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user?.doctor_id) {
      console.log("No doctor_id found for user:", user);
      setIsLoadingAppointments(false);
      return;
    }

    try {
      setIsLoadingAppointments(true);
      const response = await doctorsApi.getAppointments(user.doctor_id);

      if (response.success && response.data) {
        // Transform the data to match our interface
        const transformedAppointments: Appointment[] = response.data.map(
          (apt: any) => ({
            appointment_id: apt.appointment_id,
            patient_name:
              apt.patient_name || apt.patients?.full_name || "Unknown Patient",
            patient_phone: apt.patient_phone || apt.patients?.phone_number,
            patient_email: apt.patient_email || apt.patients?.email,
            patient_age: apt.patient_age,
            appointment_date: apt.appointment_date,
            start_time: apt.start_time,
            end_time: apt.end_time,
            appointment_type: apt.appointment_type || "General Consultation",
            status: apt.status,
            reason: apt.reason,
            notes: apt.notes,
          })
        );

        setAppointments(transformedAppointments);
      } else {
        toast.error("Không thể tải danh sách cuộc hẹn");
        setAppointments([]);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Lỗi khi tải danh sách cuộc hẹn");
      setAppointments([]);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  // Handle appointment status updates
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "confirmed"
      );

      if (response.success) {
        toast.success("Đã xác nhận cuộc hẹn thành công");
        fetchAppointments(); // Reload appointments
      } else {
        toast.error("Không thể xác nhận cuộc hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error confirming appointment:", error);
      toast.error("Lỗi khi xác nhận cuộc hẹn");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const confirmed = window.confirm(
        "Bạn có chắc chắn muốn hủy cuộc hẹn này không?"
      );
      if (!confirmed) return;

      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "cancelled"
      );

      if (response.success) {
        toast.success("Đã hủy cuộc hẹn thành công");
        fetchAppointments(); // Reload appointments
      } else {
        toast.error("Không thể hủy cuộc hẹn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Lỗi khi hủy cuộc hẹn");
    }
  };

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "in_progress"
      );

      if (response.success) {
        toast.success("Đã bắt đầu tư vấn");
        fetchAppointments(); // Reload appointments
      } else {
        toast.error("Không thể bắt đầu tư vấn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error starting consultation:", error);
      toast.error("Lỗi khi bắt đầu tư vấn");
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    try {
      const confirmed = window.confirm(
        "Bạn có chắc chắn đã hoàn thành tư vấn này không?"
      );
      if (!confirmed) return;

      const response = await appointmentsApi.updateStatus(
        appointmentId,
        "completed"
      );

      if (response.success) {
        toast.success("Đã hoàn thành tư vấn");
        fetchAppointments(); // Reload appointments
      } else {
        toast.error("Không thể hoàn thành tư vấn. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error completing consultation:", error);
      toast.error("Lỗi khi hoàn thành tư vấn");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
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
      case "in_progress":
        return <Clock className="h-4 w-4" />;
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
      appointment.patient_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      appointment.appointment_type
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || appointment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading || isLoadingAppointments) {
    return (
      <DoctorLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </DoctorLayout>
    );
  }

  if (!user || user.role !== "doctor") {
    return (
      <DoctorLayout title="My Appointments" activePage="appointments">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Access denied. Doctor role required.
            </p>
          </div>
        </div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout
      title="My Appointments"
      activePage="appointments"
      subtitle="Manage your patient appointments"
      headerActions={
        <Button className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Schedule New
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients or appointment types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Filter appointments by status"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <Card
              key={appointment.appointment_id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-semibold">
                          {appointment.patient_name}
                        </h3>
                        {appointment.patient_age && (
                          <span className="text-sm text-gray-500">
                            ({appointment.patient_age} years old)
                          </span>
                        )}
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">
                          {appointment.status}
                        </span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {appointment.appointment_date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">
                          {appointment.appointment_time ||
                            appointment.start_time}
                          {appointment.duration_minutes &&
                            ` (${appointment.duration_minutes} phút)`}
                          {appointment.end_time &&
                            !appointment.duration_minutes &&
                            ` - ${appointment.end_time}`}
                        </span>
                      </div>
                      {appointment.patient_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {appointment.patient_phone}
                          </span>
                        </div>
                      )}
                      {appointment.patient_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            {appointment.patient_email}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        Type: {appointment.appointment_type}
                      </p>
                      {appointment.reason && (
                        <p className="text-sm text-gray-600 mt-1">
                          Reason: {appointment.reason}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          Notes: {appointment.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {appointment.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleConfirmAppointment(appointment.appointment_id)
                          }
                        >
                          Confirm
                        </Button>
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
                      </>
                    )}
                    {appointment.status === "confirmed" && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() =>
                          handleStartConsultation(appointment.appointment_id)
                        }
                      >
                        Start Consultation
                      </Button>
                    )}
                    {appointment.status === "in_progress" && (
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() =>
                          handleCompleteConsultation(appointment.appointment_id)
                        }
                      >
                        Complete Consultation
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredAppointments.length === 0 && (
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
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule New Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
