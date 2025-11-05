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
  Clock,
  User,
  Calendar,
  MapPin,
  Phone,
  ArrowUp,
  ArrowDown,
  PlayCircle,
  PauseCircle,
  Users,
  Timer,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
  Eye,
} from "lucide-react";

interface QueueItem {
  id: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  appointmentId?: string;
  appointmentTime?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  room: string;
  visitType: "scheduled" | "walkin" | "emergency";
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "waiting"
    | "called"
    | "in-progress"
    | "completed"
    | "no-show"
    | "cancelled";
  checkedInAt: string;
  calledAt?: string;
  estimatedWaitTime: number; // in minutes
  notes?: string;
}

export function QueueManagement() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  useEffect(() => {
    const fetchQueueItems = async () => {
      try {
        const { queueServiceAPI } = await import("../../services/queue");
        const response = await queueServiceAPI.getAllQueueItems();
        if (response.success && response.data) {
          const itemsData = Array.isArray(response.data) ? response.data : [response.data];
          setQueueItems(itemsData);
        }
      } catch (error) {
        console.error("Error fetching queue items:", error);
      }
    };
    fetchQueueItems();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "call" | "complete" | "cancel" | "noshow" | null
  >(null);
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);

  const handleCallNext = (item: QueueItem) => {
    const updatedItems = queueItems.map((qi) =>
      qi.id === item.id
        ? {
            ...qi,
            status: "called" as const,
            calledAt: new Date().toISOString(),
          }
        : qi
    );
    setQueueItems(updatedItems);
  };

  const handleCompleteVisit = (item: QueueItem) => {
    const updatedItems = queueItems.map((qi) =>
      qi.id === item.id ? { ...qi, status: "completed" as const } : qi
    );
    setQueueItems(updatedItems);
  };

  const handleNoShow = (item: QueueItem) => {
    const updatedItems = queueItems.map((qi) =>
      qi.id === item.id ? { ...qi, status: "no-show" as const } : qi
    );
    setQueueItems(updatedItems);
  };

  const handleCancelVisit = (item: QueueItem) => {
    const updatedItems = queueItems.map((qi) =>
      qi.id === item.id ? { ...qi, status: "cancelled" as const } : qi
    );
    setQueueItems(updatedItems);
  };

  const handleMoveUp = (item: QueueItem) => {
    const currentIndex = queueItems.findIndex((qi) => qi.id === item.id);
    if (currentIndex > 0) {
      const newItems = [...queueItems];
      [newItems[currentIndex], newItems[currentIndex - 1]] = [
        newItems[currentIndex - 1],
        newItems[currentIndex],
      ];

      // Update queue numbers
      newItems[currentIndex].queueNumber = currentIndex + 1;
      newItems[currentIndex - 1].queueNumber = currentIndex;

      setQueueItems(newItems);
    }
  };

  const handleMoveDown = (item: QueueItem) => {
    const currentIndex = queueItems.findIndex((qi) => qi.id === item.id);
    if (currentIndex < queueItems.length - 1) {
      const newItems = [...queueItems];
      [newItems[currentIndex], newItems[currentIndex + 1]] = [
        newItems[currentIndex + 1],
        newItems[currentIndex],
      ];

      // Update queue numbers
      newItems[currentIndex].queueNumber = currentIndex + 1;
      newItems[currentIndex + 1].queueNumber = currentIndex + 2;

      setQueueItems(newItems);
    }
  };

  const handleAddToQueue = () => {
    setEditingItem({
      id: "",
      queueNumber: queueItems.length + 1,
      patientId: "",
      patientName: "",
      patientPhone: "",
      patientAge: 0,
      doctorId: "",
      doctorName: "",
      department: "",
      room: "",
      visitType: "walkin",
      priority: "normal",
      status: "waiting",
      checkedInAt: new Date().toISOString(),
      estimatedWaitTime: 0,
    } as QueueItem);
    setIsAddDialogOpen(true);
  };

  const handleSaveQueueItem = () => {
    if (!editingItem) return;

    if (editingItem.id) {
      setQueueItems((items) =>
        items.map((item) => (item.id === editingItem.id ? editingItem : item))
      );
    } else {
      const newItem = {
        ...editingItem,
        id: `Q${String(queueItems.length + 1).padStart(3, "0")}`,
      };
      setQueueItems([...queueItems, newItem]);
    }

    setIsAddDialogOpen(false);
    setEditingItem(null);
  };

  const confirmActionHandler = () => {
    if (!selectedItem || !confirmAction) return;

    switch (confirmAction) {
      case "call":
        handleCallNext(selectedItem);
        break;
      case "complete":
        handleCompleteVisit(selectedItem);
        break;
      case "cancel":
        handleCancelVisit(selectedItem);
        break;
      case "noshow":
        handleNoShow(selectedItem);
        break;
    }

    setIsConfirmDialogOpen(false);
    setConfirmAction(null);
    setSelectedItem(null);
  };

  const filteredItems = queueItems.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.queueNumber.toString().includes(searchTerm) ||
      item.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || item.priority === priorityFilter;
    const matchesDepartment =
      departmentFilter === "all" || item.department === departmentFilter;

    return (
      matchesSearch && matchesStatus && matchesPriority && matchesDepartment
    );
  });

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      waiting: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
      called: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      "in-progress": "bg-green-100 text-green-800 hover:bg-green-200",
      completed: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      "no-show": "bg-orange-100 text-orange-800 hover:bg-orange-200",
      cancelled: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    const statusLabels = {
      waiting: "Đang chờ",
      called: "Đã gọi",
      "in-progress": "Đang khám",
      completed: "Hoàn thành",
      "no-show": "Vắng mặt",
      cancelled: "Đã hủy",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityStyles = {
      low: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      normal: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      high: "bg-orange-100 text-orange-800 hover:bg-orange-200",
      urgent: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    const priorityLabels = {
      low: "Thấp",
      normal: "Bình thường",
      high: "Cao",
      urgent: "Khẩn cấp",
    };

    return (
      <Badge
        className={priorityStyles[priority as keyof typeof priorityStyles]}
      >
        {priorityLabels[priority as keyof typeof priorityLabels]}
      </Badge>
    );
  };

  const getVisitTypeBadge = (visitType: string) => {
    const visitTypeStyles = {
      scheduled: "bg-primary/10 text-primary hover:bg-primary/20",
      walkin: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      emergency: "bg-red-100 text-red-800 hover:bg-red-200",
    };

    const visitTypeLabels = {
      scheduled: "Đã hẹn",
      walkin: "Đến thẳng",
      emergency: "Cấp cứu",
    };

    return (
      <Badge
        className={visitTypeStyles[visitType as keyof typeof visitTypeStyles]}
      >
        {visitTypeLabels[visitType as keyof typeof visitTypeLabels]}
      </Badge>
    );
  };

  const getQueueStats = () => {
    return {
      total: queueItems.length,
      waiting: queueItems.filter((item) => item.status === "waiting").length,
      called: queueItems.filter((item) => item.status === "called").length,
      inProgress: queueItems.filter((item) => item.status === "in-progress")
        .length,
      completed: queueItems.filter((item) => item.status === "completed")
        .length,
      avgWaitTime:
        Math.round(
          queueItems.reduce((acc, item) => acc + item.estimatedWaitTime, 0) /
            queueItems.length
        ) || 0,
    };
  };

  const stats = getQueueStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý Hàng đợi
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý và điều phối hàng đợi bệnh nhân
            </p>
          </div>
          <Button
            onClick={handleAddToQueue}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Thêm vào hàng đợi
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Tổng số</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Đang chờ</p>
                  <p className="text-2xl font-bold">{stats.waiting}</p>
                </div>
                <Clock className="w-6 h-6 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Đã gọi</p>
                  <p className="text-2xl font-bold">{stats.called}</p>
                </div>
                <PlayCircle className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Đang khám</p>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                </div>
                <UserCheck className="w-6 h-6 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Hoàn thành</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-gray-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Thời gian chờ TB</p>
                  <p className="text-2xl font-bold">{stats.avgWaitTime}p</p>
                </div>
                <Timer className="w-6 h-6 text-purple-200" />
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
                  placeholder="Tìm kiếm theo tên bệnh nhân, số thứ tự, bác sĩ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="waiting">Đang chờ</SelectItem>
                  <SelectItem value="called">Đã gọi</SelectItem>
                  <SelectItem value="in-progress">Đang khám</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="no-show">Vắng mặt</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Ưu tiên" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full md:w-[140px]">
                  <SelectValue placeholder="Khoa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khoa</SelectItem>
                  <SelectItem value="Nội khoa">Nội khoa</SelectItem>
                  <SelectItem value="Tim mạch">Tim mạch</SelectItem>
                  <SelectItem value="Sản phụ khoa">Sản phụ khoa</SelectItem>
                  <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Xuất
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Queue Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-20">STT</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Thời gian hẹn</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Khoa/Phòng</TableHead>
                  <TableHead>Loại khám</TableHead>
                  <TableHead>Ưu tiên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian chờ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item, index) => (
                  <TableRow key={item.id} className="hover:bg-gray-50">
                    <TableCell className="font-bold text-lg">
                      <div className="flex items-center gap-2">
                        {item.queueNumber}
                        {item.priority === "urgent" && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.patientName}</div>
                        <div className="text-sm text-gray-500">
                          {item.patientAge} tuổi • {item.patientPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.appointmentTime ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {item.appointmentTime}
                        </div>
                      ) : (
                        <span className="text-gray-400">Không có hẹn</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {item.doctorName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.department}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.room}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getVisitTypeBadge(item.visitType)}</TableCell>
                    <TableCell>{getPriorityBadge(item.priority)}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {item.estimatedWaitTime}p
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {item.status === "waiting" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setConfirmAction("call");
                                setIsConfirmDialogOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveUp(item)}
                              disabled={index === 0}
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMoveDown(item)}
                              disabled={index === filteredItems.length - 1}
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>
                          </>
                        )}

                        {(item.status === "called" ||
                          item.status === "in-progress") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setConfirmAction("complete");
                              setIsConfirmDialogOpen(true);
                            }}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}

                        {item.status === "waiting" ||
                        item.status === "called" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setConfirmAction("noshow");
                                setIsConfirmDialogOpen(true);
                              }}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setConfirmAction("cancel");
                                setIsConfirmDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Chi tiết hàng đợi - Số {selectedItem?.queueNumber}
              </DialogTitle>
              <DialogDescription>
                Thông tin chi tiết về bệnh nhân trong hàng đợi
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tên bệnh nhân</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.patientName}
                    </p>
                  </div>
                  <div>
                    <Label>Tuổi</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.patientAge} tuổi
                    </p>
                  </div>
                  <div>
                    <Label>Số điện thoại</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.patientPhone}
                    </p>
                  </div>
                  <div>
                    <Label>Thời gian check-in</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {new Date(selectedItem.checkedInAt).toLocaleString(
                        "vi-VN"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label>Bác sĩ</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.doctorName}
                    </p>
                  </div>
                  <div>
                    <Label>Khoa</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.department}
                    </p>
                  </div>
                  <div>
                    <Label>Phòng khám</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.room}
                    </p>
                  </div>
                  <div>
                    <Label>Thời gian hẹn</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {selectedItem.appointmentTime || "Không có hẹn"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Loại khám</Label>
                    <div className="mt-1">
                      {getVisitTypeBadge(selectedItem.visitType)}
                    </div>
                  </div>
                  <div>
                    <Label>Ưu tiên</Label>
                    <div className="mt-1">
                      {getPriorityBadge(selectedItem.priority)}
                    </div>
                  </div>
                  <div>
                    <Label>Trạng thái</Label>
                    <div className="mt-1">
                      {getStatusBadge(selectedItem.status)}
                    </div>
                  </div>
                </div>

                {selectedItem.notes && (
                  <div>
                    <Label>Ghi chú</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                      {selectedItem.notes}
                    </p>
                  </div>
                )}

                {selectedItem.calledAt && (
                  <div>
                    <Label>Thời gian gọi</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {new Date(selectedItem.calledAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add to Queue Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Thêm vào hàng đợi</DialogTitle>
              <DialogDescription>
                Nhập thông tin bệnh nhân để thêm vào hàng đợi
              </DialogDescription>
            </DialogHeader>

            {editingItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="patientName">Tên bệnh nhân *</Label>
                    <Input
                      id="patientName"
                      value={editingItem.patientName}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
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
                      value={editingItem.patientAge}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          patientAge: parseInt(e.target.value),
                        })
                      }
                      placeholder="Nhập tuổi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="patientPhone">Số điện thoại *</Label>
                    <Input
                      id="patientPhone"
                      value={editingItem.patientPhone}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          patientPhone: e.target.value,
                        })
                      }
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <Label htmlFor="appointmentTime">Thời gian hẹn</Label>
                    <Input
                      id="appointmentTime"
                      type="time"
                      value={editingItem.appointmentTime || ""}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          appointmentTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="doctorName">Bác sĩ *</Label>
                    <Input
                      id="doctorName"
                      value={editingItem.doctorName}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          doctorName: e.target.value,
                        })
                      }
                      placeholder="Nhập tên bác sĩ"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Khoa *</Label>
                    <Select
                      value={editingItem.department}
                      onValueChange={(value) =>
                        setEditingItem({ ...editingItem, department: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khoa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nội khoa">Nội khoa</SelectItem>
                        <SelectItem value="Tim mạch">Tim mạch</SelectItem>
                        <SelectItem value="Sản phụ khoa">
                          Sản phụ khoa
                        </SelectItem>
                        <SelectItem value="Nhi khoa">Nhi khoa</SelectItem>
                        <SelectItem value="Thần kinh">Thần kinh</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="room">Phòng khám *</Label>
                    <Input
                      id="room"
                      value={editingItem.room}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, room: e.target.value })
                      }
                      placeholder="Nhập phòng khám"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visitType">Loại khám</Label>
                    <Select
                      value={editingItem.visitType}
                      onValueChange={(value: any) =>
                        setEditingItem({ ...editingItem, visitType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại khám" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Đã hẹn</SelectItem>
                        <SelectItem value="walkin">Đến thẳng</SelectItem>
                        <SelectItem value="emergency">Cấp cứu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Mức ưu tiên</Label>
                    <Select
                      value={editingItem.priority}
                      onValueChange={(value: any) =>
                        setEditingItem({ ...editingItem, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mức ưu tiên" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Thấp</SelectItem>
                        <SelectItem value="normal">Bình thường</SelectItem>
                        <SelectItem value="high">Cao</SelectItem>
                        <SelectItem value="urgent">Khẩn cấp</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="estimatedWaitTime">
                      Thời gian chờ dự kiến (phút)
                    </Label>
                    <Input
                      id="estimatedWaitTime"
                      type="number"
                      value={editingItem.estimatedWaitTime}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          estimatedWaitTime: parseInt(e.target.value),
                        })
                      }
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    value={editingItem.notes || ""}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, notes: e.target.value })
                    }
                    placeholder="Nhập ghi chú (tùy chọn)"
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveQueueItem}
                className="bg-primary hover:bg-primary/90"
              >
                Thêm vào hàng đợi
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirm Action Dialog */}
        <AlertDialog
          open={isConfirmDialogOpen}
          onOpenChange={setIsConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {confirmAction === "call" && "Gọi bệnh nhân"}
                {confirmAction === "complete" && "Hoàn thành khám"}
                {confirmAction === "cancel" && "Hủy lịch khám"}
                {confirmAction === "noshow" && "Đánh dấu vắng mặt"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {confirmAction === "call" &&
                  `Bạn có muốn gọi bệnh nhân ${selectedItem?.patientName} (số ${selectedItem?.queueNumber})?`}
                {confirmAction === "complete" &&
                  `Bạn có muốn đánh dấu hoàn thành khám cho bệnh nhân ${selectedItem?.patientName}?`}
                {confirmAction === "cancel" &&
                  `Bạn có muốn hủy lịch khám của bệnh nhân ${selectedItem?.patientName}?`}
                {confirmAction === "noshow" &&
                  `Bạn có muốn đánh dấu bệnh nhân ${selectedItem?.patientName} vắng mặt?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmActionHandler}
                className="bg-primary hover:bg-primary/90"
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
