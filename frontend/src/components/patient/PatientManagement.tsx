import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Search,
  Plus,
  Edit2,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Trash2,
  Edit,
} from "lucide-react";
import { Patient } from "../types";
import { patientServiceAPI } from "../../services/patient";
import { useEffect } from "react";

export function PatientManagement() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContact: "",
    bloodType: "",
    allergies: "",
    medicalHistory: "",
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await patientServiceAPI.getAllPatients();
        if (response.success && response.data) {
          const patientsData = Array.isArray(response.data) ? response.data : [response.data];
          setPatients(patientsData as Patient[]);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm)
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewDialogOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditForm({
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContact: patient.emergencyContact || "",
      bloodType: patient.bloodType || "",
      allergies: Array.isArray(patient.allergies) ? patient.allergies.join(", ") : (patient.allergies || ""),
      medicalHistory: Array.isArray(patient.medicalHistory) ? patient.medicalHistory.join(", ") : (patient.medicalHistory || ""),
    });
    setIsEditDialogOpen(true);
  };

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (selectedPatient) {
      try {
        const response = await patientServiceAPI.deletePatient(selectedPatient.id);
        if (response.success) {
          setPatients(patients.filter((p) => p.id !== selectedPatient.id));
          setIsDeleteDialogOpen(false);
          setSelectedPatient(null);
        }
      } catch (error) {
        console.error("Error deleting patient:", error);
      }
    }
  };

  const handleUpdatePatient = async () => {
    if (selectedPatient) {
      try {
        const updateData: any = {
          ...editForm,
          medicalHistory: editForm.medicalHistory ? editForm.medicalHistory.split(",").map(s => s.trim()).filter(Boolean) : [],
          allergies: editForm.allergies ? editForm.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
        };
        const response = await patientServiceAPI.updatePatient(selectedPatient.id, updateData);
        if (response.success && response.data) {
          setPatients(
            patients.map((p) =>
              p.id === selectedPatient.id ? response.data as Patient : p
            )
          );
          setIsEditDialogOpen(false);
          setSelectedPatient(null);
        }
      } catch (error) {
        console.error("Error updating patient:", error);
      }
    }
  };

  const handleCreatePatient = async () => {
    try {
      const newPatient: any = {
        ...editForm,
        medicalHistory: editForm.medicalHistory ? editForm.medicalHistory.split(",").map(s => s.trim()).filter(Boolean) : [],
        allergies: editForm.allergies ? editForm.allergies.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      const response = await patientServiceAPI.createPatient(newPatient);
      if (response.success && response.data) {
        setPatients([...patients, response.data as Patient]);
        setIsAddDialogOpen(false);
        setEditForm({
          name: "",
          email: "",
          phone: "",
          dateOfBirth: "",
          gender: "",
          address: "",
          emergencyContact: "",
          bloodType: "",
          allergies: "",
          medicalHistory: "",
        });
      }
    } catch (error) {
      console.error("Error creating patient:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Quản lý Bệnh nhân
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý thông tin và hồ sơ bệnh nhân
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm bệnh nhân
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm bệnh nhân mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin chi tiết của bệnh nhân mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Họ và tên</Label>
                <Input 
                  id="name" 
                  placeholder="Nhập họ tên" 
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Nhập email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input 
                  id="phone" 
                  placeholder="Nhập số điện thoại" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Ngày sinh</Label>
                <Input 
                  id="dob" 
                  type="date" 
                  value={editForm.dateOfBirth}
                  onChange={(e) => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Giới tính</Label>
                <Select value={editForm.gender} onValueChange={(value) => setEditForm({ ...editForm, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency">Liên hệ khẩn cấp</Label>
                <Input 
                  id="emergency" 
                  placeholder="Số điện thoại khẩn cấp" 
                  value={editForm.emergencyContact}
                  onChange={(e) => setEditForm({ ...editForm, emergencyContact: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="address">Địa chỉ</Label>
                <Textarea 
                  id="address" 
                  placeholder="Nhập địa chỉ đầy đủ" 
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="medical-history">Tiền sử bệnh</Label>
                <Textarea
                  id="medical-history"
                  placeholder="Nhập tiền sử bệnh (nếu có), phân cách bằng dấu phẩy"
                  value={editForm.medicalHistory}
                  onChange={(e) => setEditForm({ ...editForm, medicalHistory: e.target.value })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="allergies">Dị ứng</Label>
                <Textarea
                  id="allergies"
                  placeholder="Nhập thông tin dị ứng (nếu có), phân cách bằng dấu phẩy"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setEditForm({
                    name: "",
                    email: "",
                    phone: "",
                    dateOfBirth: "",
                    gender: "",
                    address: "",
                    emergencyContact: "",
                    bloodType: "",
                    allergies: "",
                    medicalHistory: "",
                  });
                }}
              >
                Hủy
              </Button>
              <Button onClick={handleCreatePatient}>
                Thêm bệnh nhân
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Tìm kiếm bệnh nhân</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm theo tên, email hoặc số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">Lọc</Button>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách bệnh nhân</CardTitle>
              <CardDescription>
                Tổng cộng {filteredPatients.length} bệnh nhân
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Tuổi</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Ngày đăng ký</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-gray-500">
                          ID: {patient.id}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="h-3 w-3 mr-1" />
                        {patient.phone}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Mail className="h-3 w-3 mr-1" />
                        {patient.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {calculateAge(patient.dateOfBirth)} tuổi
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        patient.gender === "male" ? "default" : "secondary"
                      }
                    >
                      {patient.gender === "male"
                        ? "Nam"
                        : patient.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(patient.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPatient(patient)}
                        className="hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePatient(patient)}
                        className="text-red-600 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Patient Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Thông tin bệnh nhân</span>
            </DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {selectedPatient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {selectedPatient.name}
                  </h3>
                  <p className="text-gray-500">ID: {selectedPatient.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Thông tin cơ bản
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedPatient.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{selectedPatient.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {new Date(
                          selectedPatient.dateOfBirth
                        ).toLocaleDateString("vi-VN")}
                        ({calculateAge(selectedPatient.dateOfBirth)} tuổi)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {selectedPatient.gender === "male"
                          ? "Nam"
                          : selectedPatient.gender === "female"
                          ? "Nữ"
                          : "Khác"}
                      </span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm">{selectedPatient.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Thông tin y tế</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Liên hệ khẩn cấp:
                      </p>
                      <p className="text-sm">
                        {selectedPatient.emergencyContact}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Tiền sử bệnh:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.medicalHistory.map(
                          (condition, index) => (
                            <Badge key={index} variant="outline">
                              {condition}
                            </Badge>
                          )
                        )}
                        {selectedPatient.medicalHistory.length === 0 && (
                          <span className="text-sm text-gray-500">
                            Không có
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Dị ứng:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedPatient.allergies.map((allergy, index) => (
                          <Badge key={index} variant="destructive">
                            {allergy}
                          </Badge>
                        ))}
                        {selectedPatient.allergies.length === 0 && (
                          <span className="text-sm text-gray-500">
                            Không có
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Đóng
                </Button>
                <Button>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Chỉnh sửa thông tin bệnh nhân
            </DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho bệnh nhân {selectedPatient?.name}
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
                <Label htmlFor="edit-dob">Ngày sinh</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editForm.dateOfBirth}
                  onChange={(e) =>
                    setEditForm({ ...editForm, dateOfBirth: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gender">Giới tính</Label>
                <Select
                  value={editForm.gender}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, gender: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-emergency">Liên hệ khẩn cấp</Label>
                <Input
                  id="edit-emergency"
                  value={editForm.emergencyContact}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      emergencyContact: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-blood">Nhóm máu</Label>
                <Input
                  id="edit-blood"
                  value={editForm.bloodType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bloodType: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-allergies">Dị ứng</Label>
                <Input
                  id="edit-allergies"
                  value={editForm.allergies}
                  onChange={(e) =>
                    setEditForm({ ...editForm, allergies: e.target.value })
                  }
                  placeholder="Phân cách bằng dấu phẩy"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-address">Địa chỉ</Label>
              <Textarea
                id="edit-address"
                value={editForm.address}
                onChange={(e) =>
                  setEditForm({ ...editForm, address: e.target.value })
                }
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-history">Tiền sử bệnh</Label>
              <Textarea
                id="edit-history"
                value={editForm.medicalHistory}
                onChange={(e) =>
                  setEditForm({ ...editForm, medicalHistory: e.target.value })
                }
                rows={3}
                placeholder="Phân cách bằng dấu phẩy"
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
              onClick={handleUpdatePatient}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Xác nhận xóa bệnh nhân
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bệnh nhân{" "}
              <strong>{selectedPatient?.name}</strong>?
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
              onClick={confirmDeletePatient}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa bệnh nhân
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
