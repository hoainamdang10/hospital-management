"use client";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { Calendar } from "lucide-react";
import { Doctor, AppointmentForm } from "./types";
import { timeSlots } from "./data";

interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDoctor: Doctor | null;
  appointmentForm: AppointmentForm;
  onFormChange: (form: AppointmentForm) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function BookingDialog({
  isOpen,
  onClose,
  selectedDoctor,
  appointmentForm,
  onFormChange,
  onSubmit,
}: BookingDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Đặt lịch hẹn
          </DialogTitle>
          <DialogDescription>
            {selectedDoctor &&
              `Đặt lịch hẹn với ${selectedDoctor.name} - ${selectedDoctor.specialty}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Họ và tên *</Label>
              <Input
                id="patientName"
                value={appointmentForm.patientName}
                onChange={(e) =>
                  onFormChange({
                    ...appointmentForm,
                    patientName: e.target.value,
                  })
                }
                required
                placeholder="Nhập họ và tên"
              />
            </div>
            <div>
              <Label htmlFor="phone">Số điện thoại *</Label>
              <Input
                id="phone"
                value={appointmentForm.phone}
                onChange={(e) =>
                  onFormChange({
                    ...appointmentForm,
                    phone: e.target.value,
                  })
                }
                required
                placeholder="Nhập số điện thoại"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={appointmentForm.email}
              onChange={(e) =>
                onFormChange({
                  ...appointmentForm,
                  email: e.target.value,
                })
              }
              placeholder="Nhập địa chỉ email"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="appointmentDate">Ngày hẹn *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={appointmentForm.appointmentDate}
                onChange={(e) =>
                  onFormChange({
                    ...appointmentForm,
                    appointmentDate: e.target.value,
                  })
                }
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="appointmentTime">Giờ hẹn *</Label>
              <Select
                value={appointmentForm.appointmentTime}
                onValueChange={(value) =>
                  onFormChange({
                    ...appointmentForm,
                    appointmentTime: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giờ" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="symptoms">Triệu chứng / Lý do khám</Label>
            <Textarea
              id="symptoms"
              value={appointmentForm.symptoms}
              onChange={(e) =>
                onFormChange({
                  ...appointmentForm,
                  symptoms: e.target.value,
                })
              }
              placeholder="Mô tả triệu chứng hoặc lý do cần khám..."
              rows={3}
            />
          </div>

          {selectedDoctor && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">
                Thông tin bác sĩ
              </h5>
              <div className="flex items-center gap-3">
                <ImageWithFallback
                  src={selectedDoctor.avatar}
                  alt={selectedDoctor.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedDoctor.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedDoctor.specialty}
                  </p>
                  <div className="text-xs text-blue-600">
                    {selectedDoctor.schedules.map((schedule, index) => (
                      <div key={index}>{schedule}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Xác nhận đặt lịch
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
