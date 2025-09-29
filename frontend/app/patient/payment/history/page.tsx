"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  Eye, 
  Search, 
  Filter,
  CreditCard,
  Banknote,
  Calendar,
  TrendingUp,
  FileText
} from "lucide-react";
import { PatientLayout } from "@/components/layout/UniversalLayout";
import { paymentsApi, paymentUtils, PaymentHistoryItem } from "@/lib/api/payments";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import { toast } from "sonner";

interface Payment {
  id: string;
  orderCode: string;
  amount: number;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  paymentMethod: 'payos' | 'cash';
  transactionId?: string;
  createdAt: string;
  appointmentId: string;
  description: string;
  doctorName: string;
  department: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  successfulPayments: number;
  pendingPayments: number;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm, statusFilter, methodFilter, dateFilter]);

  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/payments/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      setPayments(data.data || []);
      calculateStats(data.data || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error("Không thể tải lịch sử thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (paymentData: Payment[]) => {
    const stats: PaymentStats = {
      totalPayments: paymentData.length,
      totalAmount: paymentData.reduce((sum, payment) => sum + payment.amount, 0),
      successfulPayments: paymentData.filter(p => p.status === 'success').length,
      pendingPayments: paymentData.filter(p => p.status === 'pending').length
    };
    setStats(stats);
  };

  const applyFilters = () => {
    let filtered = payments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter(payment => payment.paymentMethod === methodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter(payment => new Date(payment.createdAt) >= filterDate);
      }
    }

    setFilteredPayments(filtered);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { label: "Thành công", variant: "default" as const, color: "text-green-700 bg-green-100" },
      failed: { label: "Thất bại", variant: "destructive" as const, color: "text-red-700 bg-red-100" },
      pending: { label: "Đang xử lý", variant: "secondary" as const, color: "text-yellow-700 bg-yellow-100" },
      cancelled: { label: "Đã hủy", variant: "outline" as const, color: "text-gray-700 bg-gray-100" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const downloadReceipt = async (paymentId: string, orderCode: string) => {
    try {
      const response = await fetch(`/api/payments/receipt/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${orderCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải hóa đơn thành công");
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error("Không thể tải hóa đơn");
    }
  };

  const viewPaymentDetails = (payment: Payment) => {
    router.push(`/patient/payment/receipt/${payment.id}`);
  };

  if (isLoading) {
    return (
      <PatientLayout title="Lịch sử thanh toán" activePage="payment">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-200 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="animate-pulse">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Lịch sử thanh toán" activePage="payment">
      <div className="space-y-6">
        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng giao dịch</p>
                    <p className="text-xl font-bold">{stats.totalPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tổng số tiền</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thành công</p>
                    <p className="text-xl font-bold text-green-600">{stats.successfulPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Đang xử lý</p>
                    <p className="text-xl font-bold text-yellow-600">{stats.pendingPayments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="success">Thành công</SelectItem>
                  <SelectItem value="pending">Đang xử lý</SelectItem>
                  <SelectItem value="failed">Thất bại</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>

              {/* Method Filter */}
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả phương thức</SelectItem>
                  <SelectItem value="payos">PayOS</SelectItem>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                </SelectContent>
              </Select>

              {/* Date Filter */}
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">7 ngày qua</SelectItem>
                  <SelectItem value="month">30 ngày qua</SelectItem>
                  <SelectItem value="quarter">3 tháng qua</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setMethodFilter("all");
                  setDateFilter("all");
                }}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>
              Lịch sử thanh toán ({filteredPayments.length} giao dịch)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-2">
                  {payments.length === 0 ? "Chưa có giao dịch nào" : "Không tìm thấy giao dịch phù hợp"}
                </p>
                {payments.length === 0 && (
                  <Button 
                    onClick={() => router.push('/patient/appointments')}
                    className="mt-4"
                  >
                    Đặt lịch khám ngay
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{payment.description}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          Mã: <span className="font-mono">{payment.orderCode}</span>
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>BS. {payment.doctorName}</span>
                          <span>•</span>
                          <span>{payment.department}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg text-blue-600 mb-1">
                          {formatCurrency(payment.amount)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          {payment.paymentMethod === 'payos' ? (
                            <CreditCard className="h-4 w-4" />
                          ) : (
                            <Banknote className="h-4 w-4" />
                          )}
                          <span>{payment.paymentMethod === 'payos' ? 'PayOS' : 'Tiền mặt'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {formatDateTime(payment.createdAt)}
                      </span>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewPaymentDetails(payment)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        {payment.status === 'success' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadReceipt(payment.id, payment.orderCode)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Tải
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
