"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { appointmentServiceAPI } from "../../services/appointment/AppointmentServiceAPI";
import { CheckCircle, XCircle, Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Appointment } from "../types";

interface AppointmentOperationsProps {
  appointment: Appointment;
  onSuccess?: () => void;
}

export function AppointmentOperations({
  appointment,
  onSuccess,
}: AppointmentOperationsProps) {
  const [loading, setLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({
    newDate: "",
    newTime: "",
    reason: "",
  });

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await appointmentServiceAPI.confirmAppointment(
        appointment.id
      );
      if (response.success) {
        toast.success("Đã xác nhận lịch hẹn thành công!");
        onSuccess?.();
      } else {
        toast.error(response.error || "Không thể xác nhận lịch hẹn");
      }
    } catch (err) {
      toast.error("Lỗi xác nhận lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Vui lòng nhập lý do hủy");
      return;
    }

    setLoading(true);
    try {
      const response = await appointmentServiceAPI.cancelAppointment(
        appointment.id,
        cancelReason
      );
      if (response.success) {
        toast.success("Đã hủy lịch hẹn thành công!");
        setShowCancelDialog(false);
        setCancelReason("");
        onSuccess?.();
      } else {
        toast.error(response.error || "Không thể hủy lịch hẹn");
      }
    } catch (err) {
      toast.error("Lỗi hủy lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleData.newDate || !rescheduleData.newTime) {
      toast.error("Vui lòng chọn ngày và giờ mới");
      return;
    }

    setLoading(true);
    try {
      const response = await appointmentServiceAPI.rescheduleAppointment(
        appointment.id,
        rescheduleData.newDate,
        rescheduleData.newTime,
        rescheduleData.reason
      );
      if (response.success) {
        toast.success("Đã đổi lịch hẹn thành công!");
        setShowRescheduleDialog(false);
        setRescheduleData({ newDate: "", newTime: "", reason: "" });
        onSuccess?.();
      } else {
        toast.error(response.error || "Không thể đổi lịch hẹn");
      }
    } catch (err) {
      toast.error("Lỗi đổi lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      const response = await appointmentServiceAPI.checkInAppointment(
        appointment.id
      );
      if (response.success) {
        toast.success("Đã check-in thành công!");
        onSuccess?.();
      } else {
        toast.error(response.error || "Không thể check-in");
      }
    } catch (err) {
      toast.error("Lỗi check-in");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const response = await appointmentServiceAPI.completeAppointment(
        appointment.id
      );
      if (response.success) {
        toast.success("Đã hoàn thành lịch hẹn!");
        onSuccess?.();
      } else {
        toast.error(response.error || "Không thể hoàn thành lịch hẹn");
      }
    } catch (err) {
      toast.error("Lỗi hoàn thành lịch hẹn");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      scheduled: "default",
      "in-progress": "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status === "scheduled" && "Đã đặt lịch"}
        {status === "in-progress" && "Đang diễn ra"}
        {status === "completed" && "Hoàn thành"}
        {status === "cancelled" && "Đã hủy"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Thao tác lịch hẹn</CardTitle>
        <CardDescription>
          Quản lý và thực hiện các thao tác với lịch hẹn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label className="text-sm text-gray-500">Bệnh nhân</Label>
            <p className="font-medium">{appointment.patientName}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Bác sĩ</Label>
            <p className="font-medium">{appointment.doctorName}</p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Ngày giờ</Label>
            <p className="font-medium">
              {new Date(appointment.date).toLocaleDateString("vi-VN")} -{" "}
              {appointment.time}
            </p>
          </div>
          <div>
            <Label className="text-sm text-gray-500">Trạng thái</Label>
            <div className="mt-1">{getStatusBadge(appointment.status)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {appointment.status === "scheduled" && (
            <>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                variant="default"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Xác nhận
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowCancelDialog(true)}
                disabled={loading}
                variant="destructive"
                size="sm"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Hủy
              </Button>
              <Button
                onClick={() => setShowRescheduleDialog(true)}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Đổi lịch
              </Button>
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                variant="secondary"
                size="sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-4 w-4" />
                    Check-in
                  </>
                )}
              </Button>
            </>
          )}

          {appointment.status === "in-progress" && (
            <Button
              onClick={handleComplete}
              disabled={loading}
              variant="default"
              size="sm"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Hoàn thành
                </>
              )}
            </Button>
          )}
        </div>

        {/* Cancel Dialog */}
        <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hủy lịch hẹn</AlertDialogTitle>
              <AlertDialogDescription>
                Vui lòng nhập lý do hủy lịch hẹn này.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Label htmlFor="cancel-reason">Lý do hủy</Label>
              <Textarea
                id="cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Nhập lý do hủy lịch hẹn..."
                rows={3}
                className="mt-2"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
              <AlertDialogAction onClick={handleCancel} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  "Xác nhận hủy"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reschedule Dialog */}
        <Dialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi lịch hẹn</DialogTitle>
              <DialogDescription>
                Chọn ngày và giờ mới cho lịch hẹn này.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="new-date">Ngày mới</Label>
                <Input
                  id="new-date"
                  type="date"
                  value={rescheduleData.newDate}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      newDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div>
                <Label htmlFor="new-time">Giờ mới</Label>
                <Input
                  id="new-time"
                  type="time"
                  value={rescheduleData.newTime}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      newTime: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="reschedule-reason">
                  Lý do đổi lịch (tùy chọn)
                </Label>
                <Textarea
                  id="reschedule-reason"
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData({
                      ...rescheduleData,
                      reason: e.target.value,
                    })
                  }
                  placeholder="Nhập lý do đổi lịch..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRescheduleDialog(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button onClick={handleReschedule} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xác nhận đổi lịch"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
