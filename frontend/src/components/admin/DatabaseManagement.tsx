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
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import {
  Database,
  Server,
  HardDrive,
  Activity,
  Download,
  Upload,
  RefreshCw,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  FileText,
  BarChart3,
  Shield,
  Trash2,
  Copy,
} from "lucide-react";

interface DatabaseInfo {
  name: string;
  size: string;
  tables: number;
  lastBackup: string;
  status: "healthy" | "warning" | "error";
  connections: number;
}

interface BackupInfo {
  id: string;
  name: string;
  date: string;
  size: string;
  type: "manual" | "auto";
  status: "completed" | "failed" | "in-progress";
}

const mockDatabases: DatabaseInfo[] = [
  {
    name: "hospital_main",
    size: "2.4 GB",
    tables: 45,
    lastBackup: "2024-01-15 03:00:00",
    status: "healthy",
    connections: 12,
  },
  {
    name: "hospital_backup",
    size: "2.3 GB",
    tables: 45,
    lastBackup: "2024-01-15 03:15:00",
    status: "healthy",
    connections: 2,
  },
  {
    name: "hospital_archive",
    size: "15.7 GB",
    tables: 45,
    lastBackup: "2024-01-14 03:00:00",
    status: "warning",
    connections: 0,
  },
];

const mockBackups: BackupInfo[] = [
  {
    id: "1",
    name: "daily_backup_20240115",
    date: "2024-01-15 03:00:00",
    size: "2.4 GB",
    type: "auto",
    status: "completed",
  },
  {
    id: "2",
    name: "manual_backup_20240114",
    date: "2024-01-14 14:30:00",
    size: "2.3 GB",
    type: "manual",
    status: "completed",
  },
  {
    id: "3",
    name: "weekly_backup_20240113",
    date: "2024-01-13 03:00:00",
    size: "2.4 GB",
    type: "auto",
    status: "completed",
  },
  {
    id: "4",
    name: "backup_in_progress",
    date: "2024-01-15 15:30:00",
    size: "1.2 GB",
    type: "manual",
    status: "in-progress",
  },
];

export function DatabaseManagement() {
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseInfo | null>(
    null
  );
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupInfo | null>(null);
  const [backupProgress, setBackupProgress] = useState(0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleBackupDatabase = () => {
    setIsBackupDialogOpen(false);
    // Simulate backup progress
    setBackupProgress(0);
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Quản lý Cơ sở dữ liệu
          </h1>
          <p className="text-gray-600 mt-1">
            Giám sát và quản lý cơ sở dữ liệu hệ thống
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Dialog
            open={isBackupDialogOpen}
            onOpenChange={setIsBackupDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4" />
                Sao lưu ngay
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo bản sao lưu</DialogTitle>
                <DialogDescription>
                  Tạo bản sao lưu dữ liệu hệ thống
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backup-name">Tên bản sao lưu</Label>
                  <Input
                    id="backup-name"
                    placeholder="manual_backup_20240115"
                  />
                </div>
                <div>
                  <Label htmlFor="backup-type">Loại sao lưu</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại sao lưu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Sao lưu đầy đủ</SelectItem>
                      <SelectItem value="incremental">
                        Sao lưu gia tăng
                      </SelectItem>
                      <SelectItem value="differential">
                        Sao lưu khác biệt
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backup-description">Mô tả</Label>
                  <Textarea
                    id="backup-description"
                    placeholder="Mô tả bản sao lưu..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsBackupDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleBackupDatabase}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Tạo sao lưu
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
              Tổng dung lượng
            </CardTitle>
            <HardDrive className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">20.4 GB</div>
            <p className="text-xs text-green-600 mt-1">
              +1.2 GB từ tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Kết nối hiện tại
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">14</div>
            <p className="text-xs text-blue-600 mt-1">Tối đa 100 kết nối</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hiệu suất
            </CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">98.5%</div>
            <p className="text-xs text-purple-600 mt-1">Hoạt động tốt</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sao lưu gần nhất
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2h trước</div>
            <p className="text-xs text-orange-600 mt-1">Thành công</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="databases" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="databases">Cơ sở dữ liệu</TabsTrigger>
          <TabsTrigger value="backups">Sao lưu</TabsTrigger>
          <TabsTrigger value="monitoring">Giám sát</TabsTrigger>
        </TabsList>

        <TabsContent value="databases" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database List */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Danh sách cơ sở dữ liệu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockDatabases.map((db, index) => (
                    <div
                      key={index}
                      className={`p-4 border border-gray-200 rounded-lg cursor-pointer transition-all ${
                        selectedDatabase?.name === db.name
                          ? "bg-blue-50 border-blue-300"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedDatabase(db)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Database className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {db.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {db.tables} bảng • {db.size}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(db.status)}
                          <Badge className={getStatusColor(db.status)}>
                            {db.status === "healthy"
                              ? "Khỏe mạnh"
                              : db.status === "warning"
                              ? "Cảnh báo"
                              : "Lỗi"}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Kết nối: {db.connections}</span>
                          <span>Sao lưu: {db.lastBackup}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Database Details */}
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Chi tiết cơ sở dữ liệu
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDatabase ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Database className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-lg">
                        {selectedDatabase.name}
                      </h3>
                      <Badge
                        className={getStatusColor(selectedDatabase.status)}
                      >
                        {selectedDatabase.status === "healthy"
                          ? "Khỏe mạnh"
                          : selectedDatabase.status === "warning"
                          ? "Cảnh báo"
                          : "Lỗi"}
                      </Badge>
                    </div>

                    <div className="space-y-3 border-t pt-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Dung lượng:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedDatabase.size}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Số bảng:</span>
                        <span className="text-sm font-medium">
                          {selectedDatabase.tables}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Kết nối:</span>
                        <span className="text-sm font-medium">
                          {selectedDatabase.connections}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Sao lưu cuối:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedDatabase.lastBackup}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Sao lưu
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Settings className="h-4 w-4 mr-2" />
                        Cài đặt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p>Chọn một cơ sở dữ liệu để xem chi tiết</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Danh sách bản sao lưu</CardTitle>
              <CardDescription>Quản lý các bản sao lưu dữ liệu</CardDescription>
            </CardHeader>
            <CardContent>
              {backupProgress > 0 && backupProgress < 100 && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-900">
                      Đang sao lưu...
                    </span>
                  </div>
                  <Progress value={backupProgress} className="h-2" />
                  <p className="text-xs text-blue-700 mt-1">
                    {backupProgress}% hoàn thành
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {mockBackups.map((backup) => (
                  <div
                    key={backup.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Download className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {backup.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {backup.date} • {backup.size}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.status === "completed"
                            ? "Hoàn thành"
                            : backup.status === "failed"
                            ? "Thất bại"
                            : "Đang xử lý"}
                        </Badge>
                        <Badge variant="outline">
                          {backup.type === "auto" ? "Tự động" : "Thủ công"}
                        </Badge>
                      </div>
                    </div>

                    {backup.status === "completed" && (
                      <div className="flex gap-2 mt-3">
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4 mr-2" />
                          Khôi phục
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Tải xuống
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Hiệu suất hệ thống</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">CPU</span>
                      <span className="text-sm font-medium">24%</span>
                    </div>
                    <Progress value={24} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">RAM</span>
                      <span className="text-sm font-medium">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Ổ đĩa</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Mạng</span>
                      <span className="text-sm font-medium">12%</span>
                    </div>
                    <Progress value={12} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Nhật ký hoạt động</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Sao lưu tự động hoàn thành - 03:00</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <span>Hệ thống khởi động - 02:45</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>Cảnh báo dung lượng ổ đĩa - 01:30</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                    <Users className="h-4 w-4 text-green-600" />
                    <span>Người dùng mới kết nối - 01:15</span>
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
