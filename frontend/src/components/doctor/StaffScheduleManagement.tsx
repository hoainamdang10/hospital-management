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
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Clock,
  Calendar as CalendarIcon,
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  TimerIcon,
  Coffee,
  Moon,
  Sun,
} from "lucide-react";

interface Staff {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  email: string;
  phone: string;
  status: "active" | "leave" | "off";
}

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: "morning" | "afternoon" | "night";
  color: string;
}

interface ScheduleEntry {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  status: "scheduled" | "completed" | "absent" | "late";
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  type: "sick" | "vacation" | "personal" | "emergency";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
}

const mockStaff: Staff[] = [
  {
    id: "1",
    name: "BS. Nguyễn Văn An",
    position: "Bác sĩ",
    department: "Tim mạch",
    avatar:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    email: "bs.an@hospital.com",
    phone: "0123456789",
    status: "active",
  },
  {
    id: "2",
    name: "Y tá Trần Thị Bình",
    position: "Y tá trưởng",
    department: "Nội khoa",
    avatar:
      "https://images.unsplash.com/photo-1594824475548-2c1085aed7aa?w=150&h=150&fit=crop&crop=face",
    email: "yta.binh@hospital.com",
    phone: "0123456790",
    status: "active",
  },
  {
    id: "3",
    name: "Lê Minh Châu",
    position: "Kỹ thuật viên",
    department: "Xét nghiệm",
    avatar:
      "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=150&h=150&fit=crop&crop=face",
    email: "ktv.chau@hospital.com",
    phone: "0123456791",
    status: "leave",
  },
  {
    id: "4",
    name: "Phạm Văn Dũng",
    position: "Lễ tân",
    department: "Tiếp nhận",
    avatar:
      "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    email: "letan.dung@hospital.com",
    phone: "0123456792",
    status: "active",
  },
];

const shifts: Shift[] = [
  {
    id: "1",
    name: "Ca sáng",
    startTime: "07:00",
    endTime: "15:00",
    type: "morning",
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    id: "2",
    name: "Ca chiều",
    startTime: "15:00",
    endTime: "23:00",
    type: "afternoon",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "3",
    name: "Ca đêm",
    startTime: "23:00",
    endTime: "07:00",
    type: "night",
    color: "bg-purple-100 text-purple-800",
  },
];

const mockSchedule: ScheduleEntry[] = [
  {
    id: "1",
    staffId: "1",
    shiftId: "1",
    date: "2024-01-15",
    status: "completed",
    checkIn: "07:05",
    checkOut: "15:10",
    notes: "Hoàn thành tốt",
  },
  {
    id: "2",
    staffId: "2",
    shiftId: "2",
    date: "2024-01-15",
    status: "scheduled",
  },
  {
    id: "3",
    staffId: "1",
    shiftId: "1",
    date: "2024-01-16",
    status: "scheduled",
  },
];

const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "1",
    staffId: "3",
    staffName: "Lê Minh Châu",
    type: "sick",
    startDate: "2024-01-15",
    endDate: "2024-01-17",
    reason: "Bị cảm cúm",
    status: "approved",
    approvedBy: "BS. Nguyễn Văn An",
  },
  {
    id: "2",
    staffId: "2",
    staffName: "Y tá Trần Thị Bình",
    type: "vacation",
    startDate: "2024-01-20",
    endDate: "2024-01-22",
    reason: "Nghỉ phép năm",
    status: "pending",
  },
];

export function StaffScheduleManagement() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [scheduleView, setScheduleView] = useState<
    "daily" | "weekly" | "monthly"
  >("weekly");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "absent":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "late":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "active":
        return <UserCheck className="h-4 w-4 text-green-600" />;
      case "leave":
        return <UserX className="h-4 w-4 text-yellow-600" />;
      case "off":
        return <Coffee className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "late":
        return "bg-yellow-100 text-yellow-800";
      case "active":
        return "bg-green-100 text-green-800";
      case "leave":
        return "bg-yellow-100 text-yellow-800";
      case "off":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case "morning":
        return <Sun className="h-4 w-4" />;
      case "afternoon":
        return <TimerIcon className="h-4 w-4" />;
      case "night":
        return <Moon className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Quản lý Lịch làm việc
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Quản lý lịch trình và chấm công nhân viên
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import lịch
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export báo cáo
          </Button>
          <Dialog
            open={isScheduleDialogOpen}
            onOpenChange={setIsScheduleDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Tạo lịch trình
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tạo lịch trình mới</DialogTitle>
                <DialogDescription>
                  Phân công ca làm việc cho nhân viên
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="staff">Nhân viên</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn nhân viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockStaff.map((staff) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name} - {staff.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">Ca làm việc</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn ca" />
                    </SelectTrigger>
                    <SelectContent>
                      {shifts.map((shift) => (
                        <SelectItem key={shift.id} value={shift.id}>
                          {shift.name} ({shift.startTime} - {shift.endTime})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ngày bắt đầu</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate
                          ? format(selectedDate, "dd/MM/yyyy", { locale: vi })
                          : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="repeat">Lặp lại</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chu kỳ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không lặp</SelectItem>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="monthly">Hàng tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsScheduleDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Tạo lịch trình
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Nhân viên đang làm
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              24
            </div>
            <p className="text-xs text-green-600 mt-1">+2 từ hôm qua</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang nghỉ phép
            </CardTitle>
            <UserX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              3
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              2 nghỉ bệnh, 1 nghỉ phép
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ca làm hôm nay
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              156
            </div>
            <p className="text-xs text-blue-600 mt-1">125 đã hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tỷ lệ chấm công
            </CardTitle>
            <TimerIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              96.5%
            </div>
            <p className="text-xs text-purple-600 mt-1">Đúng giờ</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Lịch trình</TabsTrigger>
          <TabsTrigger value="attendance">Chấm công</TabsTrigger>
          <TabsTrigger value="leave">Nghỉ phép</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                value={scheduleView}
                onValueChange={(value: any) => setScheduleView(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Theo ngày</SelectItem>
                  <SelectItem value="weekly">Theo tuần</SelectItem>
                  <SelectItem value="monthly">Theo tháng</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff List */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Danh sách nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStaff.map((staff) => (
                    <div
                      key={staff.id}
                      className={`p-3 border border-gray-200 rounded-lg cursor-pointer transition-all ${
                        selectedStaff?.id === staff.id
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedStaff(staff)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar} />
                          <AvatarFallback>
                            {staff.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{staff.name}</h3>
                          <p className="text-xs text-gray-600">
                            {staff.position}
                          </p>
                          <p className="text-xs text-gray-500">
                            {staff.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(staff.status)}
                          <Badge
                            className={`text-xs ${getStatusColor(
                              staff.status
                            )}`}
                          >
                            {staff.status === "active"
                              ? "Đang làm"
                              : staff.status === "leave"
                              ? "Nghỉ phép"
                              : "Nghỉ"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Schedule Calendar */}
            <Card className="lg:col-span-2 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Lịch trình tuần này
                </CardTitle>
                <CardDescription>
                  {selectedStaff
                    ? `Lịch làm việc của ${selectedStaff.name}`
                    : "Chọn nhân viên để xem lịch trình"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedStaff ? (
                  <div className="space-y-4">
                    {/* Week Days */}
                    <div className="grid grid-cols-7 gap-2 text-sm">
                      {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(
                        (day, index) => (
                          <div
                            key={index}
                            className="text-center font-medium text-gray-600 p-2"
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }, (_, index) => {
                        const shift = shifts[index % 3]; // Mock data
                        return (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-2 min-h-[80px]"
                          >
                            <div className="text-xs text-gray-600 mb-1">
                              {15 + index}/01
                            </div>
                            {index < 5 && (
                              <div
                                className={`text-xs px-2 py-1 rounded ${shift.color} flex items-center gap-1`}
                              >
                                {getShiftIcon(shift.type)}
                                <span>{shift.name}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>Chọn nhân viên để xem lịch trình</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Bảng chấm công hôm nay</CardTitle>
              <CardDescription>
                Theo dõi giờ vào/ra của nhân viên
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockSchedule.map((entry) => {
                  const staff = mockStaff.find((s) => s.id === entry.staffId);
                  const shift = shifts.find((s) => s.id === entry.shiftId);
                  if (!staff || !shift) return null;

                  return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={staff.avatar} />
                          <AvatarFallback>
                            {staff.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{staff.name}</h3>
                          <p className="text-sm text-gray-600">
                            {staff.position} • {shift.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {shift.startTime} - {shift.endTime}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {entry.checkIn && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-green-600">
                              Vào: {entry.checkIn}
                            </p>
                            {entry.checkOut && (
                              <p className="text-sm font-medium text-blue-600">
                                Ra: {entry.checkOut}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {getStatusIcon(entry.status)}
                          <Badge className={getStatusColor(entry.status)}>
                            {entry.status === "completed"
                              ? "Hoàn thành"
                              : entry.status === "scheduled"
                              ? "Đã phân công"
                              : entry.status === "absent"
                              ? "Vắng mặt"
                              : "Muộn"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Tab */}
        <TabsContent value="leave" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Quản lý nghỉ phép</h2>
            <Dialog
              open={isLeaveDialogOpen}
              onOpenChange={setIsLeaveDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo đơn nghỉ phép
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo đơn nghỉ phép</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nhân viên</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhân viên" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockStaff.map((staff) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Từ ngày</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Đến ngày</Label>
                      <Input type="date" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Loại nghỉ phép</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sick">Nghỉ bệnh</SelectItem>
                        <SelectItem value="vacation">Nghỉ phép năm</SelectItem>
                        <SelectItem value="personal">Việc cá nhân</SelectItem>
                        <SelectItem value="emergency">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Lý do</Label>
                    <Input placeholder="Nhập lý do nghỉ phép..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsLeaveDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button>Gửi đơn</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách đơn nghỉ phép</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{request.staffName}</h3>
                        <p className="text-sm text-gray-600">
                          {request.startDate} - {request.endDate}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {request.reason}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status === "pending"
                            ? "Chờ duyệt"
                            : request.status === "approved"
                            ? "Đã duyệt"
                            : "Từ chối"}
                        </Badge>
                        {request.status === "pending" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                            >
                              Từ chối
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Báo cáo chấm công</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng giờ làm việc:</span>
                    <span className="font-medium">1,680 giờ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tỷ lệ đúng giờ:</span>
                    <span className="font-medium text-green-600">96.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng ngày nghỉ:</span>
                    <span className="font-medium">45 ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tăng ca:</span>
                    <span className="font-medium">120 giờ</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top nhân viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStaff.slice(0, 3).map((staff, index) => (
                    <div key={staff.id} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : "bg-orange-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={staff.avatar} />
                        <AvatarFallback>
                          {staff.name.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{staff.name}</p>
                        <p className="text-xs text-gray-600">98.5% đúng giờ</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
