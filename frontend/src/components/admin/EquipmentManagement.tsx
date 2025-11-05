import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Progress } from "../ui/progress";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Wrench,
  Calendar as CalendarIcon,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Activity,
  Zap,
  Wifi,
  WifiOff,
  Battery,
  Thermometer,
  Heart,
  Monitor,
  Stethoscope,
} from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  location: string;
  department: string;
  status: "active" | "maintenance" | "broken" | "inactive";
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  cost: number;
  condition: "excellent" | "good" | "fair" | "poor";
  batteryLevel?: number;
  isConnected?: boolean;
  temperature?: number;
}

interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: "preventive" | "corrective" | "emergency";
  date: string;
  technician: string;
  description: string;
  cost: number;
  partsReplaced: string[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  nextDue?: string;
}

export function EquipmentManagement() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMaintenanceDialogOpen, setIsMaintenanceDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "maintenance":
        return <Wrench className="h-4 w-4 text-yellow-600" />;
      case "broken":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "scheduled":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      case "broken":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "imaging":
        return <Monitor className="h-8 w-8 text-blue-600" />;
      case "ultrasound":
        return <Heart className="h-8 w-8 text-red-600" />;
      case "ventilator":
        return <Zap className="h-8 w-8 text-purple-600" />;
      case "monitoring":
        return <Activity className="h-8 w-8 text-green-600" />;
      default:
        return <Stethoscope className="h-8 w-8 text-gray-600" />;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { equipmentServiceAPI } = await import("../../services/equipment");
        const [equipmentRes, maintenanceRes] = await Promise.all([
          equipmentServiceAPI.getAllEquipment(),
          equipmentServiceAPI.getAllMaintenanceRecords(),
        ]);
        if (equipmentRes.success && equipmentRes.data) {
          const equipmentData = Array.isArray(equipmentRes.data) ? equipmentRes.data : [equipmentRes.data];
          setEquipment(equipmentData);
        }
        if (maintenanceRes.success && maintenanceRes.data) {
          const maintenanceData = Array.isArray(maintenanceRes.data) ? maintenanceRes.data : [maintenanceRes.data];
          setMaintenanceRecords(maintenanceData);
        }
      } catch (error) {
        console.error("Error fetching equipment data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredEquipment = equipment.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || eq.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            Quản lý Thiết bị
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Quản lý thiết bị y tế và lịch bảo dưỡng
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Thêm thiết bị
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Thêm thiết bị mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin thiết bị y tế mới
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên thiết bị</Label>
                  <Input id="name" placeholder="Nhập tên thiết bị" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Loại thiết bị</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imaging">
                        Chẩn đoán hình ảnh
                      </SelectItem>
                      <SelectItem value="ultrasound">Siêu âm</SelectItem>
                      <SelectItem value="ventilator">Máy thở</SelectItem>
                      <SelectItem value="monitoring">Theo dõi</SelectItem>
                      <SelectItem value="laboratory">Xét nghiệm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Nhà sản xuất</Label>
                  <Input id="manufacturer" placeholder="Nhập nhà sản xuất" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" placeholder="Nhập model" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Số serial</Label>
                  <Input id="serialNumber" placeholder="Nhập số serial" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Vị trí</Label>
                  <Input id="location" placeholder="Nhập vị trí đặt" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Khoa/phòng</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khoa/phòng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cardiology">Tim mạch</SelectItem>
                      <SelectItem value="neurology">Thần kinh</SelectItem>
                      <SelectItem value="radiology">
                        Chẩn đoán hình ảnh
                      </SelectItem>
                      <SelectItem value="icu">Hồi sức cấp cứu</SelectItem>
                      <SelectItem value="emergency">Cấp cứu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Giá trị (VNĐ)</Label>
                  <Input id="cost" type="number" placeholder="Nhập giá trị" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Thêm thiết bị
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
              Hoạt động bình thường
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              156
            </div>
            <p className="text-xs text-green-600 mt-1">+5 từ tuần trước</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang bảo dưỡng
            </CardTitle>
            <Wrench className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              8
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              3 định kỳ, 5 sửa chữa
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hỏng hóc
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              3
            </div>
            <p className="text-xs text-red-600 mt-1">Cần sửa chữa khẩn cấp</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng giá trị
            </CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ₫15.2B
            </div>
            <p className="text-xs text-blue-600 mt-1">Tài sản thiết bị</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="equipment">Thiết bị</TabsTrigger>
          <TabsTrigger value="maintenance">Bảo dưỡng</TabsTrigger>
          <TabsTrigger value="reports">Báo cáo</TabsTrigger>
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm thiết bị..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="maintenance">Bảo dưỡng</SelectItem>
                <SelectItem value="broken">Hỏng hóc</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Equipment List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Danh sách thiết bị</CardTitle>
                  <CardDescription>
                    {filteredEquipment.length} thiết bị được tìm thấy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredEquipment.map((equipment) => (
                      <div
                        key={equipment.id}
                        className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all ${
                          selectedEquipment?.id === equipment.id
                            ? "bg-blue-50 border-blue-300"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedEquipment(equipment)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {getEquipmentIcon(equipment.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {equipment.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {equipment.manufacturer} - {equipment.model}
                              </p>
                              <p className="text-xs text-gray-500">
                                {equipment.location}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  className={getStatusColor(
                                    equipment.condition
                                  )}
                                >
                                  {equipment.condition === "excellent"
                                    ? "Tuyệt vời"
                                    : equipment.condition === "good"
                                    ? "Tốt"
                                    : equipment.condition === "fair"
                                    ? "Khá"
                                    : "Kém"}
                                </Badge>
                                {equipment.batteryLevel && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Battery className="h-3 w-3" />
                                    {equipment.batteryLevel}%
                                  </div>
                                )}
                                {equipment.isConnected !== undefined &&
                                  (equipment.isConnected ? (
                                    <Wifi className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <WifiOff className="h-3 w-3 text-red-600" />
                                  ))}
                                {equipment.temperature && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <Thermometer className="h-3 w-3" />
                                    {equipment.temperature}°C
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(equipment.status)}
                            <Badge className={getStatusColor(equipment.status)}>
                              {equipment.status === "active"
                                ? "Hoạt động"
                                : equipment.status === "maintenance"
                                ? "Bảo dưỡng"
                                : equipment.status === "broken"
                                ? "Hỏng hóc"
                                : "Không hoạt động"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equipment Details */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Chi tiết thiết bị</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedEquipment ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                        {getEquipmentIcon(selectedEquipment.type)}
                      </div>
                      <h3 className="font-semibold text-lg">
                        {selectedEquipment.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {selectedEquipment.manufacturer}
                      </p>
                      <Badge
                        className={getStatusColor(selectedEquipment.status)}
                      >
                        {selectedEquipment.status === "active"
                          ? "Hoạt động"
                          : selectedEquipment.status === "maintenance"
                          ? "Bảo dưỡng"
                          : selectedEquipment.status === "broken"
                          ? "Hỏng hóc"
                          : "Không hoạt động"}
                      </Badge>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Model:</span>
                        <span className="text-sm font-medium">
                          {selectedEquipment.model}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Số serial:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedEquipment.serialNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Vị trí:</span>
                        <span className="text-sm font-medium">
                          {selectedEquipment.location}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Khoa/phòng:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedEquipment.department}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tình trạng:
                        </span>
                        <Badge
                          className={getStatusColor(
                            selectedEquipment.condition
                          )}
                        >
                          {selectedEquipment.condition === "excellent"
                            ? "Tuyệt vời"
                            : selectedEquipment.condition === "good"
                            ? "Tốt"
                            : selectedEquipment.condition === "fair"
                            ? "Khá"
                            : "Kém"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Bảo dưỡng cuối:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedEquipment.lastMaintenance}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Bảo dưỡng tiếp:
                        </span>
                        <span className="text-sm font-medium text-yellow-600">
                          {selectedEquipment.nextMaintenance}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Giá trị:</span>
                        <span className="text-sm font-medium">
                          ₫{(selectedEquipment.cost / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>

                    {selectedEquipment.batteryLevel && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Pin:</span>
                          <span>{selectedEquipment.batteryLevel}%</span>
                        </div>
                        <Progress
                          value={selectedEquipment.batteryLevel}
                          className="h-2"
                        />
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        Lên lịch bảo dưỡng
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Chỉnh sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>Chọn thiết bị để xem chi tiết</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lịch bảo dưỡng</h2>
            <Dialog
              open={isMaintenanceDialogOpen}
              onOpenChange={setIsMaintenanceDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo lịch bảo dưỡng
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tạo lịch bảo dưỡng</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Thiết bị</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thiết bị" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockEquipment.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.id}>
                            {equipment.name} - {equipment.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Loại bảo dưỡng</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">
                          Bảo dưỡng định kỳ
                        </SelectItem>
                        <SelectItem value="corrective">Sửa chữa</SelectItem>
                        <SelectItem value="emergency">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngày thực hiện</Label>
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
                    <Label>Kỹ thuật viên</Label>
                    <Input placeholder="Nhập tên kỹ thuật viên" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mô tả công việc</Label>
                    <Textarea placeholder="Mô tả chi tiết công việc bảo dưỡng..." />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsMaintenanceDialogOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button>Tạo lịch</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách bảo dưỡng</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {maintenanceRecords.map((record) => {
                  const equipmentItem = equipment.find(
                    (e) => e.id === record.equipmentId
                  );
                  return (
                    <div
                      key={record.id}
                      className="p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Wrench className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{equipmentItem?.name || "N/A"}</h3>
                            <p className="text-sm text-gray-600">
                              {record.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Kỹ thuật viên: {record.technician} • {record.date}
                            </p>
                            {record.partsReplaced.length > 0 && (
                              <p className="text-xs text-gray-500">
                                Thay thế: {record.partsReplaced.join(", ")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(record.type)}>
                            {record.type === "preventive"
                              ? "Định kỳ"
                              : record.type === "corrective"
                              ? "Sửa chữa"
                              : "Khẩn cấp"}
                          </Badge>
                          <Badge className={getStatusColor(record.status)}>
                            {record.status === "completed"
                              ? "Hoàn thành"
                              : record.status === "in-progress"
                              ? "Đang thực hiện"
                              : record.status === "scheduled"
                              ? "Đã lên lịch"
                              : "Đã hủy"}
                          </Badge>
                        </div>
                      </div>
                      {record.cost > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-600">
                            Chi phí:{" "}
                            <span className="font-medium">
                              ₫{record.cost.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Thống kê thiết bị</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Tổng số thiết bị:</span>
                    <span className="font-medium">167 thiết bị</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Giá trị tổng:</span>
                    <span className="font-medium">₫15.2 tỷ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tỷ lệ hoạt động:</span>
                    <span className="font-medium text-green-600">93.4%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chi phí bảo dưỡng tháng:</span>
                    <span className="font-medium">₫125 triệu</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Cảnh báo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">
                      3 thiết bị cần sửa chữa khẩn cấp
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">5 thiết bị sắp hết bảo hành</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Wrench className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">
                      12 thiết bị cần bảo dưỡng định kỳ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
