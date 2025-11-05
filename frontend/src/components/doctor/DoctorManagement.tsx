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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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
import { useAuth } from "../auth/AuthContext";
import { doctorServiceAPI, type Doctor as DoctorType, type DoctorSchedule } from "../../services/doctor";
import { useEffect } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Download,
  Stethoscope,
  Calendar,
  Users,
  Clock,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  experience: number;
  status: "active" | "inactive" | "on-leave";
  avatar?: string;
  rating?: number;
  patientsCount?: number;
  scheduleToday?: number;
  education: string;
  bio?: string;
  joinDate: string;
}

const departments = [
  "Khoa Nội",
  "Khoa Ngoại",
  "Khoa Nhi",
  "Khoa Sản",
  "Khoa Mắt",
  "Khoa Tai Mũi Họng",
  "Khoa Da liễu",
  "Khoa Thần kinh",
];

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  "on-leave": "bg-yellow-100 text-yellow-800",
};

export function DoctorManagement() {
  const { user } = useAuth();
  const isPatient = user?.role === "PATIENT";

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [doctorSchedule, setDoctorSchedule] = useState<DoctorSchedule[]>([]);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    specialization: "",
    experience: 0,
    status: "active" as "active" | "inactive" | "on-leave",
    education: "",
    bio: "",
  });

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await doctorServiceAPI.getAllDoctors();
        if (response.success && response.data) {
          const doctorsData = Array.isArray(response.data) ? response.data : [response.data];
          setDoctors(doctorsData as Doctor[]);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor && isScheduleDialogOpen) {
      const fetchSchedule = async () => {
        try {
          const response = await doctorServiceAPI.getDoctorSchedule(selectedDoctor.id);
          if (response.success && response.data) {
            setDoctorSchedule(response.data);
          }
        } catch (error) {
          console.error("Error fetching schedule:", error);
        }
      };
      fetchSchedule();
    }
  }, [selectedDoctor, isScheduleDialogOpen]);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch =
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment =
      selectedDepartment === "all" || doctor.department === selectedDepartment;
    const matchesStatus =
      selectedStatus === "all" || doctor.status === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const stats = {
    total: doctors.length,
    active: doctors.filter((d) => d.status === "active").length,
    onLeave: doctors.filter((d) => d.status === "on-leave").length,
    avgRating: doctors.length > 0
      ? (doctors.reduce((sum, d) => sum + (d.rating || 0), 0) / doctors.length).toFixed(1)
      : "0",
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setEditForm({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      department: doctor.department,
      specialization: doctor.specialization,
      experience: doctor.experience,
      status: doctor.status,
      education: doctor.education,
      bio: doctor.bio || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteDoctor = async () => {
    if (selectedDoctor) {
      try {
        const response = await doctorServiceAPI.deleteDoctor(selectedDoctor.id);
        if (response.success) {
          setDoctors(doctors.filter((d) => d.id !== selectedDoctor.id));
          setIsDeleteDialogOpen(false);
          setSelectedDoctor(null);
        }
      } catch (error) {
        console.error("Error deleting doctor:", error);
      }
    }
  };

  const handleUpdateDoctor = async () => {
    if (selectedDoctor) {
      try {
        const response = await doctorServiceAPI.updateDoctor(selectedDoctor.id, editForm);
        if (response.success && response.data) {
          setDoctors(
            doctors.map((d) =>
              d.id === selectedDoctor.id ? response.data as Doctor : d
            )
          );
          setIsEditDialogOpen(false);
          setSelectedDoctor(null);
        }
      } catch (error) {
        console.error("Error updating doctor:", error);
      }
    }
  };

  const handleCreateDoctor = async () => {
    try {
      const response = await doctorServiceAPI.createDoctor(editForm);
      if (response.success && response.data) {
        setDoctors([...doctors, response.data as Doctor]);
        setIsCreateDialogOpen(false);
        setEditForm({
          name: "",
          email: "",
          phone: "",
          department: "",
          specialization: "",
          experience: 0,
          status: "active",
          education: "",
          bio: "",
        });
      }
    } catch (error) {
      console.error("Error creating doctor:", error);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {isPatient ? "Tìm Bác sĩ" : "Quản lý Bác sĩ"}
          </h1>
          <p className="text-gray-600 mt-1">
            {isPatient
              ? "Tìm kiếm và xem thông tin bác sĩ"
              : "Quản lý thông tin và lịch làm việc của bác sĩ"}
          </p>
        </div>
        <div className="flex gap-3">
          {!isPatient && (
            <>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Xuất báo cáo
              </Button>
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4" />
                    Thêm bác sĩ
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Thêm bác sĩ mới</DialogTitle>
                    <DialogDescription>
                      Tạo hồ sơ bác sĩ mới trong hệ thống
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctorName">Họ và tên</Label>
                        <Input 
                          id="doctorName" 
                          placeholder="Dr. Nguyễn Văn A" 
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doctorEmail">Email</Label>
                        <Input
                          id="doctorEmail"
                          type="email"
                          placeholder="doctor@hospital.com"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="doctorPhone">Số điện thoại</Label>
                        <Input 
                          id="doctorPhone" 
                          placeholder="0123456789" 
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Kinh nghiệm (năm)</Label>
                        <Input 
                          id="experience" 
                          type="number" 
                          placeholder="10" 
                          value={editForm.experience}
                          onChange={(e) => setEditForm({ ...editForm, experience: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="department">Khoa</Label>
                        <Select value={editForm.department} onValueChange={(value) => setEditForm({ ...editForm, department: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn khoa" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Chuyên khoa</Label>
                        <Input
                          id="specialization"
                          placeholder="Tim mạch, Nhi khoa..."
                          value={editForm.specialization}
                          onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Trình độ học vấn</Label>
                      <Input
                        id="education"
                        placeholder="Bác sĩ CK2, ĐH Y Hà Nội"
                        value={editForm.education}
                        onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Giới thiệu</Label>
                      <Textarea
                        id="bio"
                        placeholder="Mô tả ngắn về kinh nghiệm và chuyên môn..."
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                    <Button onClick={handleCreateDoctor} className="bg-green-600 hover:bg-green-700">
                      Thêm bác sĩ
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng bác sĩ
            </CardTitle>
            <Stethoscope className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.total}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +3 bác sĩ mới tháng này
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang hoạt động
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.active}
            </div>
            <p className="text-xs text-blue-600 mt-1">85% tổng số bác sĩ</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đang nghỉ phép
            </CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.onLeave}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Tạm thời không khám</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Đánh giá TB
            </CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.avgRating}
            </div>
            <p className="text-xs text-purple-600 mt-1">⭐ Rất tốt</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctors List */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách bác sĩ</CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm bác sĩ..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedDepartment}
                  onValueChange={setSelectedDepartment}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khoa</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="on-leave">Nghỉ phép</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-white"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={doctor.avatar} />
                          <AvatarFallback className="bg-green-100 text-green-700">
                            {doctor.name
                              .split(" ")
                              .slice(-2)
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {doctor.specialization}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doctor.department}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-gray-600">
                                {doctor.rating}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {doctor.patientsCount} BN
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {doctor.scheduleToday} lịch hôm nay
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={statusColors[doctor.status]}>
                          {doctor.status === "active"
                            ? "Hoạt động"
                            : doctor.status === "inactive"
                            ? "Không hoạt động"
                            : "Nghỉ phép"}
                        </Badge>
                        {!isPatient && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDoctor(doctor);
                              }}
                              className="hover:bg-blue-100 hover:text-blue-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-100 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoctor(doctor);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy bác sĩ nào phù hợp
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Doctor Details */}
        <div>
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Chi tiết bác sĩ</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDoctor ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <Avatar className="h-16 w-16 mx-auto">
                      <AvatarImage src={selectedDoctor.avatar} />
                      <AvatarFallback className="bg-green-100 text-green-700">
                        {selectedDoctor.name
                          .split(" ")
                          .slice(-2)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold mt-2">
                      {selectedDoctor.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedDoctor.specialization}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedDoctor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedDoctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedDoctor.department}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Thông tin chuyên môn</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Kinh nghiệm:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedDoctor.experience} năm
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Đánh giá:</span>
                        <span className="text-sm font-medium">
                          {selectedDoctor.rating} ⭐
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Bệnh nhân:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedDoctor.patientsCount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Học vấn</h4>
                    <p className="text-sm text-gray-600">
                      {selectedDoctor.education}
                    </p>
                  </div>

                  {selectedDoctor.bio && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Giới thiệu</h4>
                      <p className="text-sm text-gray-600">
                        {selectedDoctor.bio}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setIsScheduleDialogOpen(true);
                      }}
                    >
                      Xem lịch
                    </Button>
                    {!isPatient && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEditDoctor(selectedDoctor)}
                      >
                        Chỉnh sửa
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chọn một bác sĩ để xem chi tiết
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Doctor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-600" />
              Chỉnh sửa thông tin bác sĩ
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho bác sĩ {selectedDoctor?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Họ tên</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-phone">Số điện thoại</Label>
                <Input
                  id="edit-phone"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-department">Khoa</Label>
                <Select
                  value={editForm.department}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, department: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-specialization">Chuyên khoa</Label>
                <Input
                  id="edit-specialization"
                  value={editForm.specialization}
                  onChange={(e) =>
                    setEditForm({ ...editForm, specialization: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-experience">Kinh nghiệm (năm)</Label>
                <Input
                  id="edit-experience"
                  type="number"
                  value={editForm.experience}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      experience: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-status">Trạng thái</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Hoạt động</SelectItem>
                    <SelectItem value="inactive">Không hoạt động</SelectItem>
                    <SelectItem value="on-leave">Nghỉ phép</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-education">Học vấn</Label>
                <Input
                  id="edit-education"
                  value={editForm.education}
                  onChange={(e) =>
                    setEditForm({ ...editForm, education: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-bio">Mô tả</Label>
              <Textarea
                id="edit-bio"
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateDoctor}
              className="bg-green-600 hover:bg-green-700"
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Doctor Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa bác sĩ
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bác sĩ{" "}
              <strong>{selectedDoctor?.name}</strong>?
              <br />
              <span className="text-red-600 mt-2 block">
                Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên
                quan, bao gồm lịch hẹn và hồ sơ bệnh án.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDoctor}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa bác sĩ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Dialog */}
      <Dialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Lịch làm việc - {selectedDoctor?.name}
            </DialogTitle>
            <DialogDescription>
              Xem lịch làm việc và khả năng khám bệnh của bác sĩ
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedDoctor && doctorSchedule.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-3">
                  {doctorSchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        schedule.status === "available"
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900">
                              {schedule.day}
                            </span>
                            <span className="text-sm text-gray-600">
                              {schedule.time}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {schedule.type}
                          </p>
                        </div>
                        <Badge
                          className={
                            schedule.status === "available"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {schedule.status === "available"
                            ? "Có thể đặt lịch"
                            : "Bận"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {isPatient && (
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Thông tin đặt lịch
                      </h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Để đặt lịch khám với bác sĩ {selectedDoctor.name}, vui
                        lòng liên hệ:
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-blue-600" />
                          <span>Hotline: {selectedDoctor.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span>Email: {selectedDoctor.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p>Không có thông tin lịch làm việc</p>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(false)}
            >
              Đóng
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
