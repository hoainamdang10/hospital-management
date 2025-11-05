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
  Filter,
  Download,
  Pill,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

interface PrescriptionDetail {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescriptionRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: "active" | "completed" | "cancelled";
  medications: PrescriptionDetail[];
  notes: string;
  diagnosis: string;
  totalCost: number;
}

export function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        const { prescriptionServiceAPI } = await import("../../services/prescription");
        const response = await prescriptionServiceAPI.getAllPrescriptions();
        if (response.success && response.data) {
          const prescriptionsData = Array.isArray(response.data) ? response.data : [response.data];
          setPrescriptions(prescriptionsData);
        }
      } catch (error) {
        console.error("Error fetching prescriptions:", error);
      }
    };
    fetchPrescriptions();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] =
    useState<PrescriptionRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPrescription, setNewPrescription] = useState<
    Partial<PrescriptionRecord>
  >({
    patientName: "",
    doctorName: "",
    diagnosis: "",
    notes: "",
    medications: [
      {
        id: "",
        medicationName: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
      },
    ],
  });

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.patientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.doctorName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || prescription.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300">
            Đang hiệu lực
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            Hoàn thành
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-300">
            Đã hủy
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleCreatePrescription = () => {
    const prescription: PrescriptionRecord = {
      id: `PRE${String(prescriptions.length + 1).padStart(3, "0")}`,
      patientId: `PAT${Math.floor(Math.random() * 1000)}`,
      doctorId: `DOC${Math.floor(Math.random() * 100)}`,
      date: new Date().toISOString().split("T")[0],
      status: "active",
      totalCost: Math.floor(Math.random() * 500000) + 100000,
      patientName: newPrescription.patientName || "",
      doctorName: newPrescription.doctorName || "",
      diagnosis: newPrescription.diagnosis || "",
      notes: newPrescription.notes || "",
      medications:
        newPrescription.medications?.map((med, index) => ({
          ...med,
          id: `MED${String(Date.now() + index).slice(-6)}`,
        })) || [],
    };

    setPrescriptions([prescription, ...prescriptions]);
    setIsCreateDialogOpen(false);
    setNewPrescription({
      patientName: "",
      doctorName: "",
      diagnosis: "",
      notes: "",
      medications: [
        {
          id: "",
          medicationName: "",
          dosage: "",
          frequency: "",
          duration: "",
          instructions: "",
        },
      ],
    });
  };

  const handleEditPrescription = () => {
    if (!editingPrescription) return;

    setPrescriptions(
      prescriptions.map((p) =>
        p.id === editingPrescription.id ? editingPrescription : p
      )
    );
    setIsEditDialogOpen(false);
    setEditingPrescription(null);
  };

  const handleDeletePrescription = () => {
    if (deleteId) {
      setPrescriptions(prescriptions.filter((p) => p.id !== deleteId));
      setDeleteId(null);
    }
  };

  const addMedication = (isEdit = false) => {
    const newMedication = {
      id: "",
      medicationName: "",
      dosage: "",
      frequency: "",
      duration: "",
      instructions: "",
    };

    if (isEdit && editingPrescription) {
      setEditingPrescription({
        ...editingPrescription,
        medications: [...editingPrescription.medications, newMedication],
      });
    } else {
      setNewPrescription({
        ...newPrescription,
        medications: [...(newPrescription.medications || []), newMedication],
      });
    }
  };

  const removeMedication = (index: number, isEdit = false) => {
    if (isEdit && editingPrescription) {
      const updatedMedications = editingPrescription.medications.filter(
        (_, i) => i !== index
      );
      setEditingPrescription({
        ...editingPrescription,
        medications: updatedMedications,
      });
    } else {
      const updatedMedications =
        newPrescription.medications?.filter((_, i) => i !== index) || [];
      setNewPrescription({
        ...newPrescription,
        medications: updatedMedications,
      });
    }
  };

  const PrescriptionForm = ({
    prescription,
    setPrescription,
    isEdit = false,
  }: {
    prescription: Partial<PrescriptionRecord>;
    setPrescription: (prescription: Partial<PrescriptionRecord>) => void;
    isEdit?: boolean;
  }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="patientName">Tên bệnh nhân</Label>
          <Input
            id="patientName"
            value={prescription.patientName || ""}
            onChange={(e) =>
              setPrescription({ ...prescription, patientName: e.target.value })
            }
            placeholder="Nhập tên bệnh nhân"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="doctorName">Bác sĩ kê đơn</Label>
          <Input
            id="doctorName"
            value={prescription.doctorName || ""}
            onChange={(e) =>
              setPrescription({ ...prescription, doctorName: e.target.value })
            }
            placeholder="Nhập tên bác sĩ"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Chẩn đoán</Label>
        <Input
          id="diagnosis"
          value={prescription.diagnosis || ""}
          onChange={(e) =>
            setPrescription({ ...prescription, diagnosis: e.target.value })
          }
          placeholder="Nhập chẩn đoán"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Danh sách thuốc</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addMedication(isEdit)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm thuốc
          </Button>
        </div>

        {prescription.medications?.map((medication, index) => (
          <Card key={index} className="p-4 border-gray-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Thuốc {index + 1}
                </h4>
                {(prescription.medications?.length || 0) > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMedication(index, isEdit)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên thuốc</Label>
                  <Input
                    value={medication.medicationName}
                    onChange={(e) => {
                      const updatedMedications =
                        prescription.medications?.map((med, i) =>
                          i === index
                            ? { ...med, medicationName: e.target.value }
                            : med
                        ) || [];
                      setPrescription({
                        ...prescription,
                        medications: updatedMedications,
                      });
                    }}
                    placeholder="Tên thuốc"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Liều lượng</Label>
                  <Input
                    value={medication.dosage}
                    onChange={(e) => {
                      const updatedMedications =
                        prescription.medications?.map((med, i) =>
                          i === index ? { ...med, dosage: e.target.value } : med
                        ) || [];
                      setPrescription({
                        ...prescription,
                        medications: updatedMedications,
                      });
                    }}
                    placeholder="VD: 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tần suất</Label>
                  <Input
                    value={medication.frequency}
                    onChange={(e) => {
                      const updatedMedications =
                        prescription.medications?.map((med, i) =>
                          i === index
                            ? { ...med, frequency: e.target.value }
                            : med
                        ) || [];
                      setPrescription({
                        ...prescription,
                        medications: updatedMedications,
                      });
                    }}
                    placeholder="VD: 3 lần/ngày"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Thời gian</Label>
                  <Input
                    value={medication.duration}
                    onChange={(e) => {
                      const updatedMedications =
                        prescription.medications?.map((med, i) =>
                          i === index
                            ? { ...med, duration: e.target.value }
                            : med
                        ) || [];
                      setPrescription({
                        ...prescription,
                        medications: updatedMedications,
                      });
                    }}
                    placeholder="VD: 7 ngày"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Hướng dẫn sử dụng</Label>
                <Input
                  value={medication.instructions}
                  onChange={(e) => {
                    const updatedMedications =
                      prescription.medications?.map((med, i) =>
                        i === index
                          ? { ...med, instructions: e.target.value }
                          : med
                      ) || [];
                    setPrescription({
                      ...prescription,
                      medications: updatedMedications,
                    });
                  }}
                  placeholder="VD: Uống sau ăn"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Ghi chú</Label>
        <Textarea
          id="notes"
          value={prescription.notes || ""}
          onChange={(e) =>
            setPrescription({ ...prescription, notes: e.target.value })
          }
          placeholder="Ghi chú thêm..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Quản lý Đơn thuốc
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý và theo dõi tất cả đơn thuốc trong hệ thống
          </p>
        </div>
        <div className="flex gap-3">
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
                Tạo đơn thuốc
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo đơn thuốc mới</DialogTitle>
                <DialogDescription>
                  Điền thông tin để tạo đơn thuốc mới cho bệnh nhân
                </DialogDescription>
              </DialogHeader>
              <PrescriptionForm
                prescription={newPrescription}
                setPrescription={setNewPrescription}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreatePrescription}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Tạo đơn thuốc
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng đơn thuốc</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đang hiệu lực</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.filter((p) => p.status === "active").length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Hoàn thành</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {prescriptions.filter((p) => p.status === "completed").length}
                </p>
              </div>
              <div className="p-3 bg-cyan-100 rounded-lg">
                <User className="h-6 w-6 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng giá trị</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(
                    prescriptions.reduce((sum, p) => sum + p.totalCost, 0) /
                    1000000
                  ).toFixed(1)}
                  M
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Pill className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm theo bệnh nhân, bác sĩ, mã đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hiệu lực</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prescriptions Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Danh sách đơn thuốc</CardTitle>
          <CardDescription>
            Hiển thị {filteredPrescriptions.length} trên tổng số{" "}
            {prescriptions.length} đơn thuốc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Ngày kê đơn</TableHead>
                  <TableHead>Chẩn đoán</TableHead>
                  <TableHead>Số loại thuốc</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrescriptions.map((prescription) => (
                  <TableRow key={prescription.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {prescription.id}
                    </TableCell>
                    <TableCell>{prescription.patientName}</TableCell>
                    <TableCell>{prescription.doctorName}</TableCell>
                    <TableCell>
                      {new Date(prescription.date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>{prescription.diagnosis}</TableCell>
                    <TableCell className="text-center">
                      {prescription.medications.length}
                    </TableCell>
                    <TableCell>
                      {prescription.totalCost.toLocaleString("vi-VN")} ₫
                    </TableCell>
                    <TableCell>{getStatusBadge(prescription.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPrescription(prescription);
                            setIsEditDialogOpen(true);
                          }}
                          className="text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(prescription.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredPrescriptions.length === 0 && (
            <div className="text-center py-8">
              <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy đơn thuốc
              </h3>
              <p className="text-gray-500">
                Không có đơn thuốc nào phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đơn thuốc</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin đơn thuốc {editingPrescription?.id}
            </DialogDescription>
          </DialogHeader>
          {editingPrescription && (
            <PrescriptionForm
              prescription={editingPrescription}
              setPrescription={(prescription) => {
                setEditingPrescription((prev) => prev ? { ...prev, ...prescription } : null);
              }}
              isEdit={true}
            />
          )}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleEditPrescription}
              className="bg-green-600 hover:bg-green-700"
            >
              Cập nhật
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Xác nhận xóa đơn thuốc
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đơn thuốc <strong>{deleteId}</strong>{" "}
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePrescription}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
