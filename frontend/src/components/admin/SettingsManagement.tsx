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
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Globe,
  Clock,
  Mail,
  Phone,
  MapPin,
  Building,
  Save,
  Upload,
  Key,
  Users,
  Calendar,
  DollarSign,
} from "lucide-react";

export function SettingsManagement() {
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    appointments: true,
    payments: true,
    system: false,
  });

  const [hospitalInfo, setHospitalInfo] = useState({
    name: "Bệnh viện Đa khoa Quốc tế",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "028 1234 5678",
    email: "info@hospital.com",
    website: "www.hospital.com",
    logo: "",
    description:
      "Bệnh viện hàng đầu với đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại.",
  });

  const [systemSettings, setSystemSettings] = useState({
    timeZone: "Asia/Ho_Chi_Minh",
    language: "vi",
    currency: "VND",
    appointmentDuration: 30,
    workingHours: {
      start: "08:00",
      end: "17:00",
    },
    maxAppointmentsPerDay: 50,
  });

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Cài đặt Hệ thống
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý cấu hình và tùy chỉnh hệ thống
          </p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4" />
          Lưu tất cả
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">Chung</TabsTrigger>
          <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
          <TabsTrigger value="notifications">Thông báo</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="system">Hệ thống</TabsTrigger>
          <TabsTrigger value="backup">Sao lưu</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Thông tin bệnh viện
              </CardTitle>
              <CardDescription>
                Cấu hình thông tin cơ bản của bệnh viện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Tên bệnh viện</Label>
                  <Input
                    id="hospitalName"
                    value={hospitalInfo.name}
                    onChange={(e) =>
                      setHospitalInfo({ ...hospitalInfo, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalPhone">Số điện thoại</Label>
                  <Input
                    id="hospitalPhone"
                    value={hospitalInfo.phone}
                    onChange={(e) =>
                      setHospitalInfo({
                        ...hospitalInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalAddress">Địa chỉ</Label>
                <Input
                  id="hospitalAddress"
                  value={hospitalInfo.address}
                  onChange={(e) =>
                    setHospitalInfo({
                      ...hospitalInfo,
                      address: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hospitalEmail">Email</Label>
                  <Input
                    id="hospitalEmail"
                    type="email"
                    value={hospitalInfo.email}
                    onChange={(e) =>
                      setHospitalInfo({
                        ...hospitalInfo,
                        email: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalWebsite">Website</Label>
                  <Input
                    id="hospitalWebsite"
                    value={hospitalInfo.website}
                    onChange={(e) =>
                      setHospitalInfo({
                        ...hospitalInfo,
                        website: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hospitalDescription">Mô tả</Label>
                <Textarea
                  id="hospitalDescription"
                  value={hospitalInfo.description}
                  onChange={(e) =>
                    setHospitalInfo({
                      ...hospitalInfo,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Logo bệnh viện</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={hospitalInfo.logo} />
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      <Building className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Tải lên logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Thông tin cá nhân
              </CardTitle>
              <CardDescription>
                Quản lý thông tin tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="/api/placeholder/100/100" />
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    AD
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Thay đổi ảnh
                  </Button>
                  <p className="text-sm text-gray-500">JPG, PNG tối đa 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Họ</Label>
                  <Input id="firstName" defaultValue="Nguyễn" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Tên</Label>
                  <Input id="lastName" defaultValue="Văn A" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    defaultValue="admin@hospital.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Số điện thoại</Label>
                  <Input id="userPhone" defaultValue="0123456789" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="userRole">Vai trò</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">ADMIN</Badge>
                  <span className="text-sm text-gray-500">
                    Quản trị viên hệ thống
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Cài đặt thông báo
              </CardTitle>
              <CardDescription>
                Chọn cách bạn muốn nhận thông báo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Phương thức thông báo</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email</Label>
                      <p className="text-sm text-gray-500">
                        Nhận thông báo qua email
                      </p>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, email: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS</Label>
                      <p className="text-sm text-gray-500">
                        Nhận thông báo qua tin nhắn
                      </p>
                    </div>
                    <Switch
                      checked={notifications.sms}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, sms: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push notification</Label>
                      <p className="text-sm text-gray-500">
                        Thông báo đẩy trên trình duyệt
                      </p>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, push: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Loại thông báo</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lịch hẹn mới</Label>
                      <p className="text-sm text-gray-500">
                        Thông báo khi có lịch hẹn mới
                      </p>
                    </div>
                    <Switch
                      checked={notifications.appointments}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          appointments: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Thanh toán</Label>
                      <p className="text-sm text-gray-500">
                        Thông báo về thanh toán và hóa đơn
                      </p>
                    </div>
                    <Switch
                      checked={notifications.payments}
                      onCheckedChange={(checked) =>
                        setNotifications({
                          ...notifications,
                          payments: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Hệ thống</Label>
                      <p className="text-sm text-gray-500">
                        Cập nhật và bảo trì hệ thống
                      </p>
                    </div>
                    <Switch
                      checked={notifications.system}
                      onCheckedChange={(checked) =>
                        setNotifications({ ...notifications, system: checked })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Bảo mật tài khoản
              </CardTitle>
              <CardDescription>
                Quản lý mật khẩu và bảo mật tài khoản
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Thay đổi mật khẩu</h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Xác nhận mật khẩu mới
                    </Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button className="w-full md:w-auto">
                    Cập nhật mật khẩu
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Xác thực 2 lớp</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bật xác thực 2 lớp</Label>
                    <p className="text-sm text-gray-500">
                      Tăng cường bảo mật với OTP
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Phiên đăng nhập</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Chrome trên Windows</p>
                      <p className="text-sm text-gray-500">
                        IP: 192.168.1.100 • Hiện tại
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      Đang hoạt động
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">Mobile App</p>
                      <p className="text-sm text-gray-500">
                        IP: 192.168.1.101 • 2 giờ trước
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Đăng xuất
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Cài đặt chung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Múi giờ</Label>
                  <Select
                    value={systemSettings.timeZone}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, timeZone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Ho_Chi_Minh">
                        GMT+7 (Việt Nam)
                      </SelectItem>
                      <SelectItem value="Asia/Bangkok">
                        GMT+7 (Bangkok)
                      </SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Ngôn ngữ</Label>
                  <Select
                    value={systemSettings.language}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Đơn vị tiền tệ</Label>
                  <Select
                    value={systemSettings.currency}
                    onValueChange={(value) =>
                      setSystemSettings({ ...systemSettings, currency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND (Việt Nam Đồng)</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Cài đặt lịch hẹn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDuration">
                    Thời gian khám (phút)
                  </Label>
                  <Input
                    id="appointmentDuration"
                    type="number"
                    value={systemSettings.appointmentDuration}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        appointmentDuration: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="workStart">Giờ bắt đầu</Label>
                    <Input
                      id="workStart"
                      type="time"
                      value={systemSettings.workingHours.start}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          workingHours: {
                            ...systemSettings.workingHours,
                            start: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="workEnd">Giờ kết thúc</Label>
                    <Input
                      id="workEnd"
                      type="time"
                      value={systemSettings.workingHours.end}
                      onChange={(e) =>
                        setSystemSettings({
                          ...systemSettings,
                          workingHours: {
                            ...systemSettings.workingHours,
                            end: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxAppointments">
                    Số lịch hẹn tối đa/ngày
                  </Label>
                  <Input
                    id="maxAppointments"
                    type="number"
                    value={systemSettings.maxAppointmentsPerDay}
                    onChange={(e) =>
                      setSystemSettings({
                        ...systemSettings,
                        maxAppointmentsPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Sao lưu & Phục hồi
              </CardTitle>
              <CardDescription>
                Quản lý sao lưu dữ liệu hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Sao lưu tự động</Label>
                    <p className="text-sm text-gray-500">
                      Tự động sao lưu dữ liệu hàng ngày
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupTime">Thời gian sao lưu</Label>
                  <Input id="backupTime" type="time" defaultValue="02:00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionDays">Lưu trữ (ngày)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 ngày</SelectItem>
                      <SelectItem value="30">30 ngày</SelectItem>
                      <SelectItem value="90">90 ngày</SelectItem>
                      <SelectItem value="365">1 năm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Sao lưu thủ công</h4>
                <div className="flex gap-3">
                  <Button className="gap-2">
                    <Database className="h-4 w-4" />
                    Sao lưu ngay
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Phục hồi từ file
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Lịch sử sao lưu</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">backup_2024_01_20.sql</p>
                      <p className="text-sm text-gray-500">
                        20/01/2024 02:00 • 156 MB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Tải xuống
                      </Button>
                      <Button variant="outline" size="sm">
                        Phục hồi
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">backup_2024_01_19.sql</p>
                      <p className="text-sm text-gray-500">
                        19/01/2024 02:00 • 154 MB
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Tải xuống
                      </Button>
                      <Button variant="outline" size="sm">
                        Phục hồi
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
