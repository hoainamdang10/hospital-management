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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  Clock,
  Target,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Mock data for charts
const revenueData = [
  { month: "T1", revenue: 125000000, patients: 450 },
  { month: "T2", revenue: 148000000, patients: 520 },
  { month: "T3", revenue: 156000000, patients: 580 },
  { month: "T4", revenue: 142000000, patients: 510 },
  { month: "T5", revenue: 168000000, patients: 620 },
  { month: "T6", revenue: 175000000, patients: 680 },
];

const departmentData = [
  { name: "Khoa Nội", patients: 320, revenue: 45000000 },
  { name: "Khoa Ngoại", patients: 280, revenue: 52000000 },
  { name: "Khoa Nhi", patients: 150, revenue: 28000000 },
  { name: "Khoa Sản", patients: 95, revenue: 35000000 },
  { name: "Khoa Mắt", patients: 180, revenue: 22000000 },
  { name: "Khoa TMH", patients: 120, revenue: 18000000 },
];

const serviceTypeData = [
  { name: "Khám tổng quát", value: 35, color: "#3b82f6" },
  { name: "Chuyên khoa", value: 25, color: "#10b981" },
  { name: "Xét nghiệm", value: 20, color: "#f59e0b" },
  { name: "Chẩn đoán hình ảnh", value: 15, color: "#ef4444" },
  { name: "Khác", value: 5, color: "#8b5cf6" },
];

const dailyPatientsData = [
  { day: "T2", patients: 45, appointments: 52 },
  { day: "T3", patients: 38, appointments: 48 },
  { day: "T4", patients: 52, appointments: 58 },
  { day: "T5", patients: 48, appointments: 55 },
  { day: "T6", patients: 65, appointments: 72 },
  { day: "T7", patients: 28, appointments: 35 },
  { day: "CN", patients: 15, appointments: 22 },
];

const topDoctorsData = [
  { name: "Dr. Nguyễn Văn A", patients: 156, rating: 4.9, revenue: 25000000 },
  { name: "Dr. Trần Thị B", patients: 142, rating: 4.8, revenue: 22000000 },
  { name: "Dr. Lê Văn C", patients: 128, rating: 4.7, revenue: 20000000 },
  { name: "Dr. Phạm Thị D", patients: 118, rating: 4.8, revenue: 18000000 },
  { name: "Dr. Hoàng Văn E", patients: 105, rating: 4.6, revenue: 16000000 },
];

export function ReportsManagement() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-pink-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-gray-600 mt-1">
            Phân tích hoạt động và hiệu suất bệnh viện
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Tuần này</SelectItem>
              <SelectItem value="month">Tháng này</SelectItem>
              <SelectItem value="quarter">Quý này</SelectItem>
              <SelectItem value="year">Năm này</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng doanh thu
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₫168M</div>
            <p className="text-xs text-green-600 mt-1">
              +12.5% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tổng bệnh nhân
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">2,847</div>
            <p className="text-xs text-green-600 mt-1">
              +8.2% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lịch hẹn
            </CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">1,425</div>
            <p className="text-xs text-purple-600 mt-1">96% tỷ lệ hoàn thành</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Mức độ hài lòng
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">4.8⭐</div>
            <p className="text-xs text-orange-600 mt-1">Từ 1,234 đánh giá</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="patients">Bệnh nhân</TabsTrigger>
          <TabsTrigger value="departments">Khoa phòng</TabsTrigger>
          <TabsTrigger value="performance">Hiệu suất</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Doanh thu theo tháng</CardTitle>
                <CardDescription>
                  Biểu đồ doanh thu 6 tháng gần nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Phân bố dịch vụ</CardTitle>
                <CardDescription>
                  Tỷ lệ các loại dịch vụ được sử dụng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={serviceTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {serviceTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Bệnh nhân theo ngày</CardTitle>
                <CardDescription>
                  Số lượng bệnh nhân và lịch hẹn trong tuần
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyPatientsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="patients"
                      fill="#10b981"
                      name="Bệnh nhân đã khám"
                    />
                    <Bar
                      dataKey="appointments"
                      fill="#3b82f6"
                      name="Lịch hẹn"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Xu hướng bệnh nhân</CardTitle>
                <CardDescription>Số lượng bệnh nhân theo tháng</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="patients"
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Doanh thu theo khoa</CardTitle>
                <CardDescription>
                  So sánh doanh thu các khoa phòng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tickFormatter={(value) => `${value / 1000000}M`}
                    />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="revenue" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Bệnh nhân theo khoa</CardTitle>
                <CardDescription>
                  Số lượng bệnh nhân của từng khoa
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={departmentData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="patients" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Top bác sĩ</CardTitle>
                <CardDescription>Bác sĩ có hiệu suất cao nhất</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDoctorsData.map((doctor, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-700">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {doctor.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {doctor.patients} bệnh nhân • {doctor.rating}⭐
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(doctor.revenue)}
                        </p>
                        <p className="text-sm text-gray-600">Doanh thu</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Chỉ số hiệu suất</CardTitle>
                <CardDescription>
                  Các chỉ số quan trọng của bệnh viện
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tỷ lệ hoàn thành lịch hẹn</span>
                      <span>96%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "96%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Thời gian chờ trung bình</span>
                      <span>12 phút</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: "75%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Mức độ hài lòng</span>
                      <span>4.8/5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: "96%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tỷ lệ tái khám</span>
                      <span>78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: "78%" }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hiệu quả điều trị</span>
                      <span>94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: "94%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reports */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Báo cáo nhanh</CardTitle>
          <CardDescription>
            Tạo và tải xuống các báo cáo thường dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <FileText className="h-5 w-5" />
              <span>Báo cáo doanh thu</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Users className="h-5 w-5" />
              <span>Báo cáo bệnh nhân</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Activity className="h-5 w-5" />
              <span>Báo cáo hoạt động</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <BarChart3 className="h-5 w-5" />
              <span>Báo cáo khoa phòng</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <Clock className="h-5 w-5" />
              <span>Báo cáo hiệu suất</span>
            </Button>
            <Button variant="outline" className="h-16 flex flex-col gap-2">
              <DollarSign className="h-5 w-5" />
              <span>Báo cáo tài chính</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
