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
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Download,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Receipt,
  FileText,
  Calendar,
} from "lucide-react";

interface Invoice {
  id: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  services: string[];
  totalAmount: number;
  paidAmount: number;
  status: "paid" | "pending" | "overdue" | "partial";
  paymentMethod?: "cash" | "card" | "transfer" | "insurance";
  createdDate: string;
  dueDate: string;
  paidDate?: string;
  notes?: string;
}

const statusColors = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-blue-100 text-blue-800",
};

const statusIcons = {
  paid: CheckCircle,
  pending: Clock,
  overdue: XCircle,
  partial: AlertCircle,
};

const paymentMethodColors = {
  cash: "bg-green-100 text-green-800",
  card: "bg-blue-100 text-blue-800",
  transfer: "bg-purple-100 text-purple-800",
  insurance: "bg-orange-100 text-orange-800",
};

export function BillingManagement() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const { billingServiceAPI } = await import("../../services/billing");
        const response = await billingServiceAPI.getAllInvoices();
        if (response.success && response.data) {
          const invoicesData = Array.isArray(response.data) ? response.data : [response.data];
          setInvoices(invoicesData);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      selectedStatus === "all" || invoice.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
    pendingAmount: invoices
      .filter((inv) => inv.status === "pending" || inv.status === "partial")
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0),
    overdueCount: invoices.filter((inv) => inv.status === "overdue").length,
    todayRevenue: invoices
      .filter((inv) => new Date(inv.createdDate).toDateString() === new Date().toDateString())
      .reduce((sum, inv) => sum + inv.paidAmount, 0),
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Quản lý Thanh toán
          </h1>
          <p className="text-gray-600 mt-1">
            Theo dõi hóa đơn và thanh toán của bệnh viện
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
              <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4" />
                Tạo hóa đơn
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Tạo hóa đơn mới</DialogTitle>
                <DialogDescription>
                  Tạo hóa đơn thanh toán cho bệnh nhân
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientSelect">Bệnh nhân</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bệnh nhân" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="P001">
                          Nguyễn Văn A (P001)
                        </SelectItem>
                        <SelectItem value="P002">Lê Thị C (P002)</SelectItem>
                        <SelectItem value="P003">Phạm Văn E (P003)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doctorSelect">Bác sĩ khám</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bác sĩ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D001">Dr. Nguyễn Văn A</SelectItem>
                        <SelectItem value="D002">Dr. Trần Thị B</SelectItem>
                        <SelectItem value="D003">Dr. Lê Văn C</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dịch vụ</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <Input placeholder="Tên dịch vụ" className="flex-1" />
                      <Input
                        placeholder="Giá tiền"
                        type="number"
                        className="w-32"
                      />
                      <Button variant="outline" size="sm">
                        Thêm
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Ghi chú</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ghi chú thêm về hóa đơn..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Hạn thanh toán</Label>
                    <Input id="dueDate" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Tổng tiền</Label>
                    <Input id="totalAmount" type="number" placeholder="0" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Tạo hóa đơn
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
              Doanh thu tổng
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              +15% so với tháng trước
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Doanh thu hôm nay
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.todayRevenue)}
            </div>
            <p className="text-xs text-blue-600 mt-1">+8% so với hôm qua</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chờ thanh toán
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Cần thu</p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Quá hạn
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.overdueCount}
            </div>
            <p className="text-xs text-red-600 mt-1">Hóa đơn</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Danh sách hóa đơn</CardTitle>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm hóa đơn..."
                  className="pl-9 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="paid">Đã thanh toán</SelectItem>
                  <SelectItem value="pending">Chờ thanh toán</SelectItem>
                  <SelectItem value="partial">Thanh toán một phần</SelectItem>
                  <SelectItem value="overdue">Quá hạn</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Mã HĐ</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Bác sĩ</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Đã thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Hạn TT</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusIcons[invoice.status];
                  return (
                    <TableRow key={invoice.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-gray-400" />
                          {invoice.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.patientName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {invoice.patientId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {invoice.doctorName}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-32">
                          <p className="text-sm truncate">
                            {invoice.services.join(", ")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {invoice.services.length} dịch vụ
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(invoice.paidAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            statusColors[invoice.status]
                          } flex items-center gap-1 w-fit`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {invoice.status === "paid"
                            ? "Đã thanh toán"
                            : invoice.status === "pending"
                            ? "Chờ thanh toán"
                            : invoice.status === "overdue"
                            ? "Quá hạn"
                            : "Một phần"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status !== "paid" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không tìm thấy hóa đơn nào phù hợp
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thanh toán hóa đơn</DialogTitle>
            <DialogDescription>
              Ghi nhận thanh toán cho hóa đơn {selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid gap-4 py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Bệnh nhân:</div>
                  <div className="font-medium">
                    {selectedInvoice.patientName}
                  </div>
                  <div>Tổng tiền:</div>
                  <div className="font-medium">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </div>
                  <div>Đã thanh toán:</div>
                  <div className="font-medium text-green-600">
                    {formatCurrency(selectedInvoice.paidAmount)}
                  </div>
                  <div>Còn lại:</div>
                  <div className="font-medium text-red-600">
                    {formatCurrency(
                      selectedInvoice.totalAmount - selectedInvoice.paidAmount
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentAmount">Số tiền thanh toán</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder="Nhập số tiền"
                  defaultValue={
                    selectedInvoice.totalAmount - selectedInvoice.paidAmount
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Phương thức thanh toán</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn phương thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="card">Thẻ ngân hàng</SelectItem>
                    <SelectItem value="transfer">Chuyển khoản</SelectItem>
                    <SelectItem value="insurance">Bảo hiểm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentNotes">Ghi chú</Label>
                <Textarea
                  id="paymentNotes"
                  placeholder="Ghi chú về thanh toán..."
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Xác nhận thanh toán
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
