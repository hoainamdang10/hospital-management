import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "../communication/NotificationSystem";
import { usePWA, useNetworkStatus } from "../common/PWAHooks";
import { StatusIndicator } from "../common/StatusIndicator";
import { dashboardServiceAPI } from "../../services/dashboard";
import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  Activity,
  Stethoscope,
  Bell,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart,
  Pie,
} from "recharts";

export function Dashboard() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const { isOnline, connectionType } = useNetworkStatus();
  const { isInstalled } = usePWA();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [appointmentStats, setAppointmentStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyPatients, setDailyPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, activitiesRes, appointmentStatsRes, monthlyRes, dailyRes] = await Promise.all([
          dashboardServiceAPI.getStats(user?.role),
          dashboardServiceAPI.getRecentActivities(10),
          dashboardServiceAPI.getAppointmentStats(),
          dashboardServiceAPI.getMonthlyData(6),
          dashboardServiceAPI.getDailyPatients(7),
        ]);

        if (statsRes.success && statsRes.data) {
          setDashboardStats(statsRes.data);
        }
        if (activitiesRes.success && activitiesRes.data) {
          setRecentActivities(activitiesRes.data);
        }
        if (appointmentStatsRes.success && appointmentStatsRes.data) {
          setAppointmentStats(appointmentStatsRes.data);
        }
        if (monthlyRes.success && monthlyRes.data) {
          setMonthlyData(monthlyRes.data);
        }
        if (dailyRes.success && dailyRes.data) {
          setDailyPatients(dailyRes.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getDashboardData = () => {
    if (dashboardStats) {
      return {
        title: dashboardStats.title || getDashboardDataDefault().title,
        cards: dashboardStats.cards || getDashboardDataDefault().cards,
      };
    }
    return getDashboardDataDefault();
  };

  const getDashboardDataDefault = () => {
    switch (user?.role) {
      case "SUPERADMIN":
      case "ADMIN":
        return {
          title: "Tổng quan Hệ thống",
          cards: [
            {
              title: "Tổng số bệnh nhân",
              value: "2,847",
              change: "+12%",
              icon: Users,
              color: "text-blue-600",
            },
            {
              title: "Lịch hẹn hôm nay",
              value: "156",
              change: "+5%",
              icon: Calendar,
              color: "text-green-600",
            },
            {
              title: "Bác sĩ đang làm việc",
              value: "24",
              change: "0%",
              icon: Stethoscope,
              color: "text-purple-600",
            },
            {
              title: "Doanh thu tháng",
              value: "₫485M",
              change: "+18%",
              icon: DollarSign,
              color: "text-orange-600",
            },
          ],
        };

      case "DOCTOR":
        return {
          title: `Chào mừng, ${user.name}`,
          cards: [
            {
              title: "Bệnh nhân hôm nay",
              value: "12",
              change: "+2",
              icon: Users,
              color: "text-blue-600",
            },
            {
              title: "Lịch hẹn đã hoàn thành",
              value: "8",
              change: "Còn 4",
              icon: Calendar,
              color: "text-green-600",
            },
            {
              title: "Hồ sơ cần xem",
              value: "5",
              change: "Mới",
              icon: FileText,
              color: "text-yellow-600",
            },
            {
              title: "Đánh giá trung bình",
              value: "4.8",
              change: "⭐⭐⭐⭐⭐",
              icon: TrendingUp,
              color: "text-purple-600",
            },
          ],
        };

      case "PATIENT":
        return {
          title: `Xin chào, ${user.name}`,
          cards: [
            {
              title: "Lịch hẹn sắp tới",
              value: "2",
              change: "Tuần này",
              icon: Calendar,
              color: "text-blue-600",
            },
            {
              title: "Hồ sơ khám",
              value: "15",
              change: "Tổng cộng",
              icon: FileText,
              color: "text-green-600",
            },
            {
              title: "Đơn thuốc",
              value: "3",
              change: "Đang dùng",
              icon: Activity,
              color: "text-purple-600",
            },
            {
              title: "Thanh toán",
              value: "₫250K",
              change: "Chưa thanh toán",
              icon: DollarSign,
              color: "text-orange-600",
            },
          ],
        };

      case "RECEPTIONIST":
        return {
          title: "Bảng điều khiển Lễ tân",
          cards: [
            {
              title: "Check-in hôm nay",
              value: "89",
              change: "+15",
              icon: Users,
              color: "text-blue-600",
            },
            {
              title: "Hàng đợi hiện tại",
              value: "12",
              change: "Đang chờ",
              icon: Clock,
              color: "text-yellow-600",
            },
            {
              title: "Lịch hẹn hôm nay",
              value: "156",
              change: "125 đã xác nhận",
              icon: Calendar,
              color: "text-green-600",
            },
            {
              title: "Thanh toán",
              value: "₫12.5M",
              change: "Hôm nay",
              icon: DollarSign,
              color: "text-purple-600",
            },
          ],
        };

      case "STAFF":
        return {
          title: "Bảng điều khiển Nhân viên",
          cards: [
            {
              title: "Báo cáo cần xử lý",
              value: "7",
              change: "Mới",
              icon: FileText,
              color: "text-blue-600",
            },
            {
              title: "Bệnh nhân đăng ký",
              value: "23",
              change: "Hôm nay",
              icon: Users,
              color: "text-green-600",
            },
            {
              title: "Công việc đã hoàn thành",
              value: "15",
              change: "85%",
              icon: TrendingUp,
              color: "text-purple-600",
            },
            {
              title: "Thời gian làm việc",
              value: "7.5h",
              change: "Hôm nay",
              icon: Clock,
              color: "text-orange-600",
            },
          ],
        };

      default:
        return {
          title: "Tổng quan",
          cards: [],
        };
    }
  };

  const { title, cards } = getDashboardData();

  const getRecentActivitiesData = () => {
    if (recentActivities.length > 0) {
      return recentActivities;
    }
    switch (user?.role) {
      case "DOCTOR":
        return [
          {
            time: "09:30",
            action: "Khám bệnh nhân Nguyễn Văn A",
            status: "completed",
          },
          {
            time: "10:15",
            action: "Cập nhật hồ sơ bệnh án",
            status: "completed",
          },
          { time: "11:00", action: "Tư vấn trực tuyến", status: "in-progress" },
          {
            time: "14:30",
            action: "Lịch hẹn với Trần Thị B",
            status: "upcoming",
          },
        ];
      case "PATIENT":
        return [
          {
            time: "2 ngày trước",
            action: "Khám tại khoa Tim mạch",
            status: "completed",
          },
          {
            time: "1 tuần trước",
            action: "Làm xét nghiệm máu",
            status: "completed",
          },
          {
            time: "3 ngày tới",
            action: "Tái khám với BS. Trần Thị Hương",
            status: "upcoming",
          },
          { time: "1 tuần tới", action: "Chụp X-quang", status: "upcoming" },
        ];
      default:
        return [
          {
            time: "10 phút trước",
            action: "Cập nhật hệ thống",
            status: "completed",
          },
          {
            time: "30 phút trước",
            action: "Backup dữ liệu",
            status: "completed",
          },
          {
            time: "1 giờ trước",
            action: "Đồng bộ dữ liệu",
            status: "completed",
          },
          {
            time: "2 giờ trước",
            action: "Kiểm tra bảo mật",
            status: "completed",
          },
        ];
    }
  };

  const recentActivitiesData = getRecentActivitiesData();

  const appointmentData = appointmentStats
    ? [
        { name: "Hoàn thành", value: appointmentStats.completed || 0, color: "#10b981" },
        { name: "Đang chờ", value: appointmentStats.pending || 0, color: "#f59e0b" },
        { name: "Đã hủy", value: appointmentStats.cancelled || 0, color: "#ef4444" },
      ]
    : [
        { name: "Hoàn thành", value: 65, color: "#10b981" },
        { name: "Đang chờ", value: 20, color: "#f59e0b" },
        { name: "Đã hủy", value: 15, color: "#ef4444" },
      ];

  const notifications = [
    {
      id: 1,
      title: "Cập nhật hệ thống",
      message: "Hệ thống sẽ được bảo trì vào 23:00 tối nay",
      type: "info",
      time: "2 giờ trước",
    },
    {
      id: 2,
      title: "Đào tạo mới",
      message: "Khóa đào tạo về quy trình mới bắt đầu tuần tới",
      type: "success",
      time: "1 ngày trước",
    },
    {
      id: 3,
      title: "Nhắc nhở",
      message: "Cần cập nhật thông tin cá nhân trước ngày 30/9",
      type: "warning",
      time: "3 ngày trước",
    },
    {
      id: 4,
      title: "Bảo mật",
      message: "Phát hiện đăng nhập bất thường từ IP lạ",
      type: "error",
      time: "1 tuần trước",
    },
  ];

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800 min-h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Theo dõi hoạt động và thống kê hệ thống
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusIndicator />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b">
                <h4 className="font-semibold text-gray-900">Thông báo</h4>
                <p className="text-sm text-gray-600">
                  {notifications.length} thông báo mới
                </p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="p-4 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <div
                      className={`border-l-4 pl-3 ${
                        notification.type === "info"
                          ? "border-blue-500"
                          : notification.type === "success"
                          ? "border-green-500"
                          : notification.type === "warning"
                          ? "border-yellow-500"
                          : "border-red-500"
                      }`}
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <Button variant="ghost" className="w-full text-sm">
                  Xem tất cả thông báo
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card
              key={index}
              className="bg-white/80 backdrop-blur-sm border-blue-200 hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
                <p className="text-xs text-green-600 mt-1">{card.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Hoạt động gần đây</CardTitle>
            <CardDescription>Các hoạt động và sự kiện mới nhất</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivitiesData.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                  <Badge
                    className={
                      activity.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : activity.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {activity.status === "completed"
                      ? "Hoàn thành"
                      : activity.status === "in-progress"
                      ? "Đang thực hiện"
                      : "Sắp tới"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Phân bố lịch hẹn
            </CardTitle>
            <CardDescription>
              Tỷ lệ trạng thái lịch hẹn trong tháng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Tỷ lệ"]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {appointmentData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Only show for ADMIN/SUPERADMIN */}
      {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Thống kê theo tháng
              </CardTitle>
              <CardDescription>
                Số lượng bệnh nhân và doanh thu 6 tháng gần đây
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData.length > 0 ? monthlyData : [
                    { month: "T1", patients: 420, revenue: 85 },
                    { month: "T2", patients: 380, revenue: 92 },
                    { month: "T3", patients: 450, revenue: 78 },
                    { month: "T4", patients: 520, revenue: 105 },
                    { month: "T5", patients: 490, revenue: 95 },
                    { month: "T6", patients: 560, revenue: 120 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Bar
                      yAxisId="left"
                      dataKey="patients"
                      fill="#3b82f6"
                      name="Bệnh nhân"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="#10b981"
                      name="Doanh thu (triệu)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
            <CardHeader>
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-600" />
                Lượng bệnh nhân theo ngày
              </CardTitle>
              <CardDescription>
                Thống kê bệnh nhân khám trong tuần
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyPatients.length > 0 ? dailyPatients : [
                    { day: "T2", count: 45 },
                    { day: "T3", count: 52 },
                    { day: "T4", count: 48 },
                    { day: "T5", count: 61 },
                    { day: "T6", count: 55 },
                    { day: "T7", count: 38 },
                    { day: "CN", count: 25 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Số bệnh nhân"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
