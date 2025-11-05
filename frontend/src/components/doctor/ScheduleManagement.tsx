import { useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Textarea } from "../ui/textarea";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  MapPin,
  Filter,
  Download,
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Users,
  List,
} from "lucide-react";

interface ScheduleSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  type: "consultation" | "surgery" | "meeting" | "break" | "emergency";
  status: "available" | "booked" | "completed" | "cancelled";
  patientId?: string;
  patientName?: string;
  appointmentId?: string;
  location: string;
  notes?: string;
  isRecurring?: boolean;
  recurringPattern?: "daily" | "weekly" | "monthly";
  recurringEndDate?: string;
}

interface WorkingHours {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

const mockScheduleSlots: ScheduleSlot[] = [
  {
    id: "SCH001",
    date: "2024-01-22",
    startTime: "08:00",
    endTime: "08:30",
    type: "consultation",
    status: "booked",
    patientId: "PAT001",
    patientName: "Nguyễn Thị Lan",
    appointmentId: "APT001",
    location: "Phòng khám 1",
    notes: "Tái khám viêm họng",
  },
  {
    id: "SCH002",
    date: "2024-01-22",
    startTime: "08:30",
    endTime: "09:00",
    type: "consultation",
    status: "available",
    location: "Phòng khám 1",
  },
  {
    id: "SCH003",
    date: "2024-01-22",
    startTime: "09:00",
    endTime: "09:30",
    type: "consultation",
    status: "booked",
    patientId: "PAT002",
    patientName: "Lê Văn Hùng",
    appointmentId: "APT002",
    location: "Phòng khám 1",
    notes: "Khám định kỳ huyết áp",
  },
  {
    id: "SCH004",
    date: "2024-01-22",
    startTime: "10:00",
    endTime: "12:00",
    type: "surgery",
    status: "booked",
    patientId: "PAT003",
    patientName: "Trần Văn Nam",
    appointmentId: "APT003",
    location: "Phòng phẫu thuật 2",
    notes: "Phẫu thuật túi mật",
  },
  {
    id: "SCH005",
    date: "2024-01-22",
    startTime: "14:00",
    endTime: "14:30",
    type: "consultation",
    status: "completed",
    patientId: "PAT004",
    patientName: "Phạm Thị Hoa",
    appointmentId: "APT004",
    location: "Phòng khám 1",
    notes: "Khám tổng quát",
  },
  {
    id: "SCH006",
    date: "2024-01-22",
    startTime: "15:00",
    endTime: "16:00",
    type: "meeting",
    status: "booked",
    location: "Phòng họp A",
    notes: "Họp khoa nội",
  },
  {
    id: "SCH007",
    date: "2024-01-23",
    startTime: "08:00",
    endTime: "08:30",
    type: "consultation",
    status: "available",
    location: "Phòng khám 1",
  },
  {
    id: "SCH008",
    date: "2024-01-23",
    startTime: "08:30",
    endTime: "09:00",
    type: "consultation",
    status: "booked",
    patientId: "PAT005",
    patientName: "Hoàng Văn Đức",
    appointmentId: "APT005",
    location: "Phòng khám 1",
    notes: "Khám đau lưng",
  },
];

const defaultWorkingHours: WorkingHours[] = [
  {
    dayOfWeek: "Thứ 2",
    startTime: "08:00",
    endTime: "17:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Thứ 3",
    startTime: "08:00",
    endTime: "17:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Thứ 4",
    startTime: "08:00",
    endTime: "17:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Thứ 5",
    startTime: "08:00",
    endTime: "17:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Thứ 6",
    startTime: "08:00",
    endTime: "17:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Thứ 7",
    startTime: "08:00",
    endTime: "12:00",
    isWorkingDay: true,
  },
  {
    dayOfWeek: "Chủ nhật",
    startTime: "08:00",
    endTime: "12:00",
    isWorkingDay: false,
  },
];

export function ScheduleManagement() {
  const [scheduleSlots, setScheduleSlots] =
    useState<ScheduleSlot[]>(mockScheduleSlots);
  const [workingHours, setWorkingHours] =
    useState<WorkingHours[]>(defaultWorkingHours);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedSlot, setSelectedSlot] = useState<ScheduleSlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isWorkingHoursDialogOpen, setIsWorkingHoursDialogOpen] =
    useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [currentView, setCurrentView] = useState<"table" | "calendar">("table");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const handleAddSlot = () => {
    setEditingSlot({
      id: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "08:00",
      endTime: "08:30",
      type: "consultation",
      status: "available",
      location: "Phòng khám 1",
      isRecurring: false,
    } as ScheduleSlot);
    setIsDialogOpen(true);
  };

  const handleEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot({ ...slot });
    setIsDialogOpen(true);
  };

  const handleSaveSlot = () => {
    if (!editingSlot) return;

    if (editingSlot.id) {
      setScheduleSlots((slots) =>
        slots.map((s) => (s.id === editingSlot.id ? editingSlot : s))
      );
    } else {
      const newSlot = {
        ...editingSlot,
        id: `SCH${String(scheduleSlots.length + 1).padStart(3, "0")}`,
      };
      setScheduleSlots([...scheduleSlots, newSlot]);
    }

    setIsDialogOpen(false);
    setEditingSlot(null);
  };

  const handleDeleteSlot = () => {
    if (selectedSlot) {
      setScheduleSlots((slots) =>
        slots.filter((s) => s.id !== selectedSlot.id)
      );
      setIsDeleteDialogOpen(false);
      setSelectedSlot(null);
    }
  };

  const handleSaveWorkingHours = () => {
    // Save working hours logic here
    setIsWorkingHoursDialogOpen(false);
  };

  const filteredSlots = scheduleSlots.filter((slot) => {
    const matchesSearch =
      slot.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      slot.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || slot.date === dateFilter;
    const matchesStatus =
      statusFilter === "all" || slot.status === statusFilter;
    const matchesType = typeFilter === "all" || slot.type === typeFilter;

    return matchesSearch && matchesDate && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      available: "bg-green-100 text-green-800 hover:bg-green-200",
      booked: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      completed: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    const statusLabels = {
      available: "Có thể đặt",
      booked: "Đã đặt",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeStyles = {
      consultation: "bg-primary/10 text-primary hover:bg-primary/20",
      surgery: "bg-red-100 text-red-800 hover:bg-red-200",
      meeting: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      break: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      emergency: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };

    const typeLabels = {
      consultation: "Khám bệnh",
      surgery: "Phẫu thuật",
      meeting: "Họp",
      break: "Nghỉ",
      emergency: "Cấp cứu",
    };

    return (
      <Badge className={typeStyles[type as keyof typeof typeStyles]}>
        {typeLabels[type as keyof typeof typeLabels]}
      </Badge>
    );
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todaySlots = scheduleSlots.filter((slot) => slot.date === today);

    return {
      total: todaySlots.length,
      available: todaySlots.filter((s) => s.status === "available").length,
      booked: todaySlots.filter((s) => s.status === "booked").length,
      completed: todaySlots.filter((s) => s.status === "completed").length,
    };
  };

  const todayStats = getTodayStats();

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForComparison = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = formatDateForComparison(date);
    return filteredSlots.filter((slot) => slot.date === dateStr);
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day)
      );
    }

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCalendarDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const CalendarView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              Lịch làm việc -{" "}
              {calendarDate.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <CardDescription>Xem lịch làm việc theo dạng lịch</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
            >
              ←
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCalendarDate(new Date())}
            >
              Hôm nay
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
            >
              →
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-gray-500 text-sm"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {generateCalendarDays().map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2 h-32"></div>;
            }

            const slots = getSlotsForDate(day);
            const isToday =
              formatDateForComparison(day) ===
              formatDateForComparison(new Date());

            return (
              <div
                key={index}
                className={`p-2 h-32 border rounded-lg hover:bg-gray-50 overflow-y-auto ${
                  isToday ? "bg-blue-50 border-blue-200" : "border-gray-200"
                }`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    isToday ? "text-blue-600" : "text-gray-900"
                  }`}
                >
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {slots.map((slot, slotIndex) => (
                    <div
                      key={slotIndex}
                      className={`text-xs p-1 rounded cursor-pointer ${
                        slot.status === "available"
                          ? "bg-green-100 text-green-800"
                          : slot.status === "booked"
                          ? "bg-blue-100 text-blue-800"
                          : slot.status === "completed"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-red-100 text-red-800"
                      }`}
                      onClick={() => handleEditSlot(slot)}
                      title={`${slot.startTime}-${slot.endTime} ${
                        slot.patientName || "Trống"
                      }`}
                    >
                      <div className="font-medium">
                        {slot.startTime}-{slot.endTime}
                      </div>
                      {slot.patientName && (
                        <div className="truncate">{slot.patientName}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Lịch làm việc</h1>
            <p className="text-gray-600 mt-1">
              Quản lý lịch làm việc và cuộc hẹn khám bệnh
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsWorkingHoursDialogOpen(true)}
            >
              <Clock className="w-4 h-4 mr-2" />
              Giờ làm việc
            </Button>
            <Button
              onClick={handleAddSlot}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm lịch trình
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Tổng lịch hôm nay</p>
                  <p className="text-2xl font-bold">{todayStats.total}</p>
                </div>
                <CalendarDays className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Có thể đặt</p>
                  <p className="text-2xl font-bold">{todayStats.available}</p>
                </div>
                <CalendarCheck className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Đã đặt</p>
                  <p className="text-2xl font-bold">{todayStats.booked}</p>
                </div>
                <Users className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Hoàn thành</p>
                  <p className="text-2xl font-bold">{todayStats.completed}</p>
                </div>
                <CalendarX className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* View Toggle */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex gap-2">
                <Button
                  variant={currentView === "table" ? "default" : "outline"}
                  onClick={() => setCurrentView("table")}
                  size="sm"
                >
                  <List className="w-4 h-4 mr-2" />
                  Danh sách
                </Button>
                <Button
                  variant={currentView === "calendar" ? "default" : "outline"}
                  onClick={() => setCurrentView("calendar")}
                  size="sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Lịch
                </Button>
              </div>

              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo bệnh nhân, mã lịch, phòng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-auto"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="available">Có thể đặt</SelectItem>
                    <SelectItem value="booked">Đã đặt</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Loại" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="consultation">Khám bệnh</SelectItem>
                    <SelectItem value="surgery">Phẫu thuật</SelectItem>
                    <SelectItem value="meeting">Họp</SelectItem>
                    <SelectItem value="break">Nghỉ</SelectItem>
                    <SelectItem value="emergency">Cấp cứu</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Xuất
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content based on current view */}
        {currentView === "table" ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Mã lịch</TableHead>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Phòng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSlots.map((slot) => (
                    <TableRow key={slot.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{slot.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(slot.date).toLocaleDateString("vi-VN")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {slot.startTime} - {slot.endTime}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(slot.type)}</TableCell>
                      <TableCell>
                        {slot.patientName ? (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            {slot.patientName}
                          </div>
                        ) : (
                          <span className="text-gray-400">Chưa có</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {slot.location}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(slot.status)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={slot.notes}>
                          {slot.notes || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditSlot(slot)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <CalendarView />
        )}

        {/* Add/Edit Schedule Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSlot?.id
                  ? "Chỉnh sửa lịch trình"
                  : "Thêm lịch trình mới"}
              </DialogTitle>
              <DialogDescription>
                {editingSlot?.id
                  ? "Cập nhật thông tin lịch trình"
                  : "Nhập thông tin để tạo lịch trình mới"}
              </DialogDescription>
            </DialogHeader>

            {editingSlot && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Ngày *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={editingSlot.date}
                      onChange={(e) =>
                        setEditingSlot({ ...editingSlot, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Loại lịch trình *</Label>
                    <Select
                      value={editingSlot.type}
                      onValueChange={(value: any) =>
                        setEditingSlot({ ...editingSlot, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="consultation">Khám bệnh</SelectItem>
                        <SelectItem value="surgery">Phẫu thuật</SelectItem>
                        <SelectItem value="meeting">Họp</SelectItem>
                        <SelectItem value="break">Nghỉ</SelectItem>
                        <SelectItem value="emergency">Cấp cứu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Giờ bắt đầu *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={editingSlot.startTime}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          startTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Giờ kết thúc *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={editingSlot.endTime}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          endTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Phòng/Địa điểm *</Label>
                    <Input
                      id="location"
                      value={editingSlot.location}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          location: e.target.value,
                        })
                      }
                      placeholder="Nhập phòng hoặc địa điểm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select
                      value={editingSlot.status}
                      onValueChange={(value: any) =>
                        setEditingSlot({ ...editingSlot, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Có thể đặt</SelectItem>
                        <SelectItem value="booked">Đã đặt</SelectItem>
                        <SelectItem value="completed">Hoàn thành</SelectItem>
                        <SelectItem value="cancelled">Đã hủy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingSlot.status === "booked" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">Tên bệnh nhân</Label>
                      <Input
                        id="patientName"
                        value={editingSlot.patientName || ""}
                        onChange={(e) =>
                          setEditingSlot({
                            ...editingSlot,
                            patientName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên bệnh nhân"
                      />
                    </div>
                    <div>
                      <Label htmlFor="appointmentId">Mã cuộc hẹn</Label>
                      <Input
                        id="appointmentId"
                        value={editingSlot.appointmentId || ""}
                        onChange={(e) =>
                          setEditingSlot({
                            ...editingSlot,
                            appointmentId: e.target.value,
                          })
                        }
                        placeholder="Nhập mã cuộc hẹn"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={editingSlot.notes || ""}
                    onChange={(e) =>
                      setEditingSlot({ ...editingSlot, notes: e.target.value })
                    }
                    placeholder="Nhập ghi chú (tùy chọn)"
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isRecurring"
                      checked={editingSlot.isRecurring || false}
                      onChange={(e) =>
                        setEditingSlot({
                          ...editingSlot,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="isRecurring">Lịch trình lặp lại</Label>
                  </div>

                  {editingSlot.isRecurring && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="recurringPattern">Tần suất lặp</Label>
                        <Select
                          value={editingSlot.recurringPattern || "weekly"}
                          onValueChange={(value: any) =>
                            setEditingSlot({
                              ...editingSlot,
                              recurringPattern: value,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tần suất" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Hàng ngày</SelectItem>
                            <SelectItem value="weekly">Hàng tuần</SelectItem>
                            <SelectItem value="monthly">Hàng tháng</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="recurringEndDate">Ngày kết thúc</Label>
                        <Input
                          id="recurringEndDate"
                          type="date"
                          value={editingSlot.recurringEndDate || ""}
                          onChange={(e) =>
                            setEditingSlot({
                              ...editingSlot,
                              recurringEndDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveSlot}
                className="bg-primary hover:bg-primary/90"
              >
                {editingSlot?.id ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Working Hours Dialog */}
        <Dialog
          open={isWorkingHoursDialogOpen}
          onOpenChange={setIsWorkingHoursDialogOpen}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Cài đặt giờ làm việc</DialogTitle>
              <DialogDescription>
                Thiết lập giờ làm việc hàng tuần của bạn
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {workingHours.map((day, index) => (
                <div
                  key={day.dayOfWeek}
                  className="flex items-center space-x-4 p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={day.isWorkingDay}
                      onChange={(e) => {
                        const newWorkingHours = [...workingHours];
                        newWorkingHours[index].isWorkingDay = e.target.checked;
                        setWorkingHours(newWorkingHours);
                      }}
                      className="rounded"
                    />
                    <span className="w-20 text-sm font-medium">
                      {day.dayOfWeek}
                    </span>
                  </div>

                  {day.isWorkingDay && (
                    <>
                      <Input
                        type="time"
                        value={day.startTime}
                        onChange={(e) => {
                          const newWorkingHours = [...workingHours];
                          newWorkingHours[index].startTime = e.target.value;
                          setWorkingHours(newWorkingHours);
                        }}
                        className="w-auto"
                      />
                      <span className="text-gray-500">đến</span>
                      <Input
                        type="time"
                        value={day.endTime}
                        onChange={(e) => {
                          const newWorkingHours = [...workingHours];
                          newWorkingHours[index].endTime = e.target.value;
                          setWorkingHours(newWorkingHours);
                        }}
                        className="w-auto"
                      />
                    </>
                  )}

                  {!day.isWorkingDay && (
                    <span className="text-gray-500 italic">Nghỉ</span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsWorkingHoursDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveWorkingHours}
                className="bg-primary hover:bg-primary/90"
              >
                Lưu cài đặt
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa lịch trình này? Hành động này không
                thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSlot}
                className="bg-red-600 hover:bg-red-700"
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
