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
  FileText,
  Calendar,
  User,
  Heart,
  Activity,
  Stethoscope,
  ClipboardList,
  Eye,
} from "lucide-react";

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  respiratoryRate: string;
}

interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  date: string;
  visitType: "consultation" | "followup" | "emergency" | "routine";
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory: string;
  physicalExamination: string;
  vitalSigns: VitalSigns;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
  nextAppointment?: string;
  status: "active" | "completed" | "pending";
}

export function MedicalRecordsManagement() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const { medicalRecordServiceAPI } = await import("../../services/medical-record");
        const response = await medicalRecordServiceAPI.getAllMedicalRecords();
        if (response.success && response.data) {
          const recordsData = Array.isArray(response.data) ? response.data : [response.data];
          setRecords(recordsData as MedicalRecord[]);
        }
      } catch (error) {
        console.error("Error fetching medical records:", error);
      }
    };
    fetchRecords();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(
    null
  );

  const handleAddRecord = () => {
    setEditingRecord({
      id: "",
      patientId: "",
      patientName: "",
      patientAge: 0,
      patientGender: "",
      doctorId: "",
      doctorName: "",
      date: new Date().toISOString().split("T")[0],
      visitType: "consultation",
      chiefComplaint: "",
      presentIllness: "",
      pastMedicalHistory: "",
      physicalExamination: "",
      vitalSigns: {
        bloodPressure: "",
        heartRate: "",
        temperature: "",
        weight: "",
        height: "",
        respiratoryRate: "",
      },
      diagnosis: "",
      treatment: "",
      medications: "",
      notes: "",
      status: "pending",
    } as MedicalRecord);
    setIsDialogOpen(true);
  };

  const handleEditRecord = (record: MedicalRecord) => {
    setEditingRecord({ ...record });
    setIsDialogOpen(true);
  };

  const handleSaveRecord = () => {
    if (!editingRecord) return;

    if (editingRecord.id) {
      setRecords(
        records.map((r) => (r.id === editingRecord.id ? editingRecord : r))
      );
    } else {
      const newRecord = {
        ...editingRecord,
        id: `MR${String(records.length + 1).padStart(3, "0")}`,
      };
      setRecords([...records, newRecord]);
    }

    setIsDialogOpen(false);
    setEditingRecord(null);
  };

  const handleDeleteRecord = () => {
    if (selectedRecord) {
      setRecords(records.filter((r) => r.id !== selectedRecord.id));
      setIsDeleteDialogOpen(false);
      setSelectedRecord(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;
    const matchesVisitType =
      visitTypeFilter === "all" || record.visitType === visitTypeFilter;

    return matchesSearch && matchesStatus && matchesVisitType;
  });

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800 hover:bg-green-200",
      completed: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
    };

    const statusLabels = {
      active: "Đang điều trị",
      completed: "Hoàn thành",
      pending: "Chờ xử lý",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const getVisitTypeBadge = (visitType: string) => {
    const visitTypeStyles = {
      consultation: "bg-primary/10 text-primary hover:bg-primary/20",
      followup: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      emergency: "bg-red-100 text-red-800 hover:bg-red-200",
      routine: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };

    const visitTypeLabels = {
      consultation: "Khám bệnh",
      followup: "Tái khám",
      emergency: "Cấp cứu",
      routine: "Định kỳ",
    };

    return (
      <Badge
        className={visitTypeStyles[visitType as keyof typeof visitTypeStyles]}
      >
        {visitTypeLabels[visitType as keyof typeof visitTypeLabels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ sơ Bệnh án</h1>
            <p className="text-gray-600 mt-1">
              Quản lý hồ sơ bệnh án và thông tin khám bệnh
            </p>
          </div>
          <Button
            onClick={handleAddRecord}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo hồ sơ mới
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Tổng hồ sơ</p>
                  <p className="text-2xl font-bold">{records.length}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Đang điều trị</p>
                  <p className="text-2xl font-bold">
                    {records.filter((r) => r.status === "active").length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Hoàn thành</p>
                  <p className="text-2xl font-bold">
                    {records.filter((r) => r.status === "completed").length}
                  </p>
                </div>
                <ClipboardList className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Chờ xử lý</p>
                  <p className="text-2xl font-bold">
                    {records.filter((r) => r.status === "pending").length}
                  </p>
                </div>
                <Heart className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên bệnh nhân, mã hồ sơ, chẩn đoán..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang điều trị</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="pending">Chờ xử lý</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={visitTypeFilter}
                onValueChange={setVisitTypeFilter}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Loại khám" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại khám</SelectItem>
                  <SelectItem value="consultation">Khám bệnh</SelectItem>
                  <SelectItem value="followup">Tái khám</SelectItem>
                  <SelectItem value="emergency">Cấp cứu</SelectItem>
                  <SelectItem value="routine">Định kỳ</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Records Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Mã hồ sơ</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Ngày khám</TableHead>
                  <TableHead>Loại khám</TableHead>
                  <TableHead>Chẩn đoán</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{record.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.patientName}</div>
                        <div className="text-sm text-gray-500">
                          {record.patientAge} tuổi - {record.patientGender}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(record.date).toLocaleDateString("vi-VN")}
                      </div>
                    </TableCell>
                    <TableCell>{getVisitTypeBadge(record.visitType)}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="truncate" title={record.diagnosis}>
                        {record.diagnosis}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-gray-400" />
                        {record.doctorName}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
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

        {/* View Record Dialog */}
        {selectedRecord && (
          <Dialog
            open={!!selectedRecord && !isDeleteDialogOpen}
            onOpenChange={() => setSelectedRecord(null)}
          >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Chi tiết hồ sơ bệnh án - {selectedRecord.id}
                </DialogTitle>
                <DialogDescription>
                  Thông tin chi tiết về lần khám bệnh của{" "}
                  {selectedRecord.patientName}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                  <TabsTrigger value="examination">Khám lâm sàng</TabsTrigger>
                  <TabsTrigger value="vitals">Sinh hiệu</TabsTrigger>
                  <TabsTrigger value="treatment">Điều trị</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Bệnh nhân</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.patientName}
                      </p>
                    </div>
                    <div>
                      <Label>Tuổi - Giới tính</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.patientAge} tuổi -{" "}
                        {selectedRecord.patientGender}
                      </p>
                    </div>
                    <div>
                      <Label>Bác sĩ</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.doctorName}
                      </p>
                    </div>
                    <div>
                      <Label>Ngày khám</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {new Date(selectedRecord.date).toLocaleDateString(
                          "vi-VN"
                        )}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label>Lý do khám bệnh</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.chiefComplaint}
                    </p>
                  </div>

                  <div>
                    <Label>Tiền sử bệnh</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.pastMedicalHistory}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="examination" className="space-y-4">
                  <div>
                    <Label>Bệnh sử hiện tại</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.presentIllness}
                    </p>
                  </div>

                  <div>
                    <Label>Khám thể lực</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.physicalExamination}
                    </p>
                  </div>

                  <div>
                    <Label>Chẩn đoán</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.diagnosis}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="vitals" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Huyết áp</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.bloodPressure} mmHg
                      </p>
                    </div>
                    <div>
                      <Label>Nhịp tim</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.heartRate} lần/phút
                      </p>
                    </div>
                    <div>
                      <Label>Nhiệt độ</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.temperature}°C
                      </p>
                    </div>
                    <div>
                      <Label>Nhịp thở</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.respiratoryRate} lần/phút
                      </p>
                    </div>
                    <div>
                      <Label>Cân nặng</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.weight} kg
                      </p>
                    </div>
                    <div>
                      <Label>Chiều cao</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded">
                        {selectedRecord.vitalSigns.height} cm
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="treatment" className="space-y-4">
                  <div>
                    <Label>Điều trị</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.treatment}
                    </p>
                  </div>

                  <div>
                    <Label>Thuốc kê đơn</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.medications}
                    </p>
                  </div>

                  <div>
                    <Label>Ghi chú</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedRecord.notes}
                    </p>
                  </div>

                  {selectedRecord.nextAppointment && (
                    <div>
                      <Label>Lịch tái khám</Label>
                      <p className="text-sm bg-gray-50 p-2 rounded mt-1">
                        {new Date(
                          selectedRecord.nextAppointment
                        ).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}

        {/* Add/Edit Record Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRecord?.id
                  ? "Chỉnh sửa hồ sơ bệnh án"
                  : "Tạo hồ sơ bệnh án mới"}
              </DialogTitle>
              <DialogDescription>
                {editingRecord?.id
                  ? "Cập nhật thông tin hồ sơ bệnh án"
                  : "Nhập thông tin để tạo hồ sơ bệnh án mới"}
              </DialogDescription>
            </DialogHeader>

            {editingRecord && (
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">Thông tin chung</TabsTrigger>
                  <TabsTrigger value="examination">Khám lâm sàng</TabsTrigger>
                  <TabsTrigger value="vitals">Sinh hiệu</TabsTrigger>
                  <TabsTrigger value="treatment">Điều trị</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="patientName">Tên bệnh nhân *</Label>
                      <Input
                        id="patientName"
                        value={editingRecord.patientName}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            patientName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên bệnh nhân"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientAge">Tuổi *</Label>
                      <Input
                        id="patientAge"
                        type="number"
                        value={editingRecord.patientAge}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            patientAge: parseInt(e.target.value),
                          })
                        }
                        placeholder="Nhập tuổi"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patientGender">Giới tính *</Label>
                      <Select
                        value={editingRecord.patientGender}
                        onValueChange={(value) =>
                          setEditingRecord({
                            ...editingRecord,
                            patientGender: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn giới tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Nam">Nam</SelectItem>
                          <SelectItem value="Nữ">Nữ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="doctorName">Bác sĩ *</Label>
                      <Input
                        id="doctorName"
                        value={editingRecord.doctorName}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            doctorName: e.target.value,
                          })
                        }
                        placeholder="Nhập tên bác sĩ"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Ngày khám *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={editingRecord.date}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="visitType">Loại khám</Label>
                      <Select
                        value={editingRecord.visitType}
                        onValueChange={(value: any) =>
                          setEditingRecord({
                            ...editingRecord,
                            visitType: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại khám" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consultation">
                            Khám bệnh
                          </SelectItem>
                          <SelectItem value="followup">Tái khám</SelectItem>
                          <SelectItem value="emergency">Cấp cứu</SelectItem>
                          <SelectItem value="routine">Định kỳ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="chiefComplaint">Lý do khám bệnh *</Label>
                    <Textarea
                      id="chiefComplaint"
                      value={editingRecord.chiefComplaint}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          chiefComplaint: e.target.value,
                        })
                      }
                      placeholder="Nhập lý do khám bệnh"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="examination" className="space-y-4">
                  <div>
                    <Label htmlFor="presentIllness">Bệnh sử hiện tại</Label>
                    <Textarea
                      id="presentIllness"
                      value={editingRecord.presentIllness}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          presentIllness: e.target.value,
                        })
                      }
                      placeholder="Mô tả tình trạng bệnh hiện tại"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="pastMedicalHistory">Tiền sử bệnh</Label>
                    <Textarea
                      id="pastMedicalHistory"
                      value={editingRecord.pastMedicalHistory}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          pastMedicalHistory: e.target.value,
                        })
                      }
                      placeholder="Nhập tiền sử bệnh"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="physicalExamination">Khám thể lực</Label>
                    <Textarea
                      id="physicalExamination"
                      value={editingRecord.physicalExamination}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          physicalExamination: e.target.value,
                        })
                      }
                      placeholder="Kết quả khám thể lực"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="diagnosis">Chẩn đoán *</Label>
                    <Textarea
                      id="diagnosis"
                      value={editingRecord.diagnosis}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          diagnosis: e.target.value,
                        })
                      }
                      placeholder="Nhập chẩn đoán"
                      rows={2}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="vitals" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bloodPressure">Huyết áp (mmHg)</Label>
                      <Input
                        id="bloodPressure"
                        value={editingRecord.vitalSigns.bloodPressure}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              bloodPressure: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 120/80"
                      />
                    </div>
                    <div>
                      <Label htmlFor="heartRate">Nhịp tim (lần/phút)</Label>
                      <Input
                        id="heartRate"
                        value={editingRecord.vitalSigns.heartRate}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              heartRate: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 72"
                      />
                    </div>
                    <div>
                      <Label htmlFor="temperature">Nhiệt độ (°C)</Label>
                      <Input
                        id="temperature"
                        value={editingRecord.vitalSigns.temperature}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              temperature: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 36.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="respiratoryRate">
                        Nhịp thở (lần/phút)
                      </Label>
                      <Input
                        id="respiratoryRate"
                        value={editingRecord.vitalSigns.respiratoryRate}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              respiratoryRate: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 18"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight">Cân nặng (kg)</Label>
                      <Input
                        id="weight"
                        value={editingRecord.vitalSigns.weight}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              weight: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 65"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Chiều cao (cm)</Label>
                      <Input
                        id="height"
                        value={editingRecord.vitalSigns.height}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            vitalSigns: {
                              ...editingRecord.vitalSigns,
                              height: e.target.value,
                            },
                          })
                        }
                        placeholder="VD: 165"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="treatment" className="space-y-4">
                  <div>
                    <Label htmlFor="treatment">Điều trị</Label>
                    <Textarea
                      id="treatment"
                      value={editingRecord.treatment}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          treatment: e.target.value,
                        })
                      }
                      placeholder="Nhập phương pháp điều trị"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="medications">Thuốc kê đơn</Label>
                    <Textarea
                      id="medications"
                      value={editingRecord.medications}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          medications: e.target.value,
                        })
                      }
                      placeholder="Nhập danh sách thuốc và liều dùng"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Ghi chú</Label>
                    <Textarea
                      id="notes"
                      value={editingRecord.notes}
                      onChange={(e) =>
                        setEditingRecord({
                          ...editingRecord,
                          notes: e.target.value,
                        })
                      }
                      placeholder="Nhập ghi chú thêm"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nextAppointment">Lịch tái khám</Label>
                      <Input
                        id="nextAppointment"
                        type="date"
                        value={editingRecord.nextAppointment || ""}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            nextAppointment: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Trạng thái</Label>
                      <Select
                        value={editingRecord.status}
                        onValueChange={(value: any) =>
                          setEditingRecord({ ...editingRecord, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Chờ xử lý</SelectItem>
                          <SelectItem value="active">Đang điều trị</SelectItem>
                          <SelectItem value="completed">Hoàn thành</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                onClick={handleSaveRecord}
                className="bg-primary hover:bg-primary/90"
              >
                {editingRecord?.id ? "Cập nhật" : "Tạo mới"}
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
                Bạn có chắc chắn muốn xóa hồ sơ bệnh án này? Hành động này không
                thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecord}
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
