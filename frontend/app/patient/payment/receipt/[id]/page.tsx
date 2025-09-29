"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, 
  Print, 
  ArrowLeft,
  Building2,
  User,
  Calendar,
  CreditCard,
  FileText,
  CheckCircle
} from "lucide-react";
import { PatientLayout } from "@/components/layout/UniversalLayout";
import { toast } from "sonner";

interface ReceiptData {
  id: string;
  orderCode: string;
  amount: number;
  status: string;
  paymentMethod: 'payos' | 'cash';
  transactionId?: string;
  createdAt: string;
  appointmentId: string;
  description: string;
  
  // Patient Info
  patientName: string;
  patientId: string;
  patientPhone: string;
  patientEmail: string;
  
  // Appointment Info
  doctorName: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;
  
  // Billing Details
  consultationFee: number;
  serviceFee: number;
  vat: number;
  total: number;
  
  // Hospital Info
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalTaxCode: string;
}

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const receiptId = params.id as string;
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (receiptId) {
      fetchReceiptData();
    }
  }, [receiptId]);

  const fetchReceiptData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/payments/receipt/${receiptId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch receipt data');
      }

      const data = await response.json();
      setReceipt(data.data);
    } catch (error) {
      console.error('Error fetching receipt:', error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setIsLoading(false);
    }
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
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const downloadPDF = async () => {
    if (!receipt) return;

    try {
      const response = await fetch(`/api/payments/receipt/${receiptId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `receipt-${receipt.orderCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Đã tải hóa đơn PDF thành công");
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error("Không thể tải hóa đơn PDF");
    }
  };

  const printReceipt = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <PatientLayout title="Hóa đơn thanh toán" activePage="payment">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!receipt) {
    return (
      <PatientLayout title="Hóa đơn thanh toán" activePage="payment">
        <div className="max-w-4xl mx-auto text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Không tìm thấy hóa đơn</p>
          <Button onClick={() => router.push('/patient/payment/history')}>
            Quay lại lịch sử thanh toán
          </Button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Hóa đơn thanh toán" activePage="payment">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={printReceipt} className="flex items-center gap-2">
              <Print className="h-4 w-4" />
              In hóa đơn
            </Button>
            <Button onClick={downloadPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Tải PDF
            </Button>
          </div>
        </div>

        {/* Receipt Content */}
        <Card className="print:shadow-none print:border-none">
          <CardContent className="p-8">
            {/* Hospital Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Building2 className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-blue-900">
                  {receipt.hospitalName || "BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG"}
                </h1>
              </div>
              <p className="text-gray-600">
                {receipt.hospitalAddress || "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh"}
              </p>
              <p className="text-gray-600">
                Điện thoại: {receipt.hospitalPhone || "028-1234-5678"} | 
                Mã số thuế: {receipt.hospitalTaxCode || "0123456789"}
              </p>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">HÓA ĐƠN THANH TOÁN</h2>
              <div className="flex items-center justify-center gap-2">
                <span className="text-gray-600">Mã hóa đơn:</span>
                <span className="font-mono font-bold">{receipt.orderCode}</span>
                <Badge variant={receipt.status === 'success' ? 'default' : 'secondary'}>
                  {receipt.status === 'success' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                </Badge>
              </div>
            </div>

            {/* Patient & Appointment Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Patient Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Thông tin bệnh nhân
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="font-medium">{receipt.patientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã BN:</span>
                    <span className="font-mono">{receipt.patientId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Điện thoại:</span>
                    <span>{receipt.patientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span>{receipt.patientEmail}</span>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Thông tin lịch khám
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bác sĩ:</span>
                    <span className="font-medium">{receipt.doctorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Khoa:</span>
                    <span>{receipt.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ngày khám:</span>
                    <span>{formatDate(receipt.appointmentDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giờ khám:</span>
                    <span>{receipt.timeSlot}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Details */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Chi tiết dịch vụ</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Dịch vụ</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Số lượng</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Đơn giá</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm">Phí khám bệnh</td>
                      <td className="px-4 py-3 text-sm text-right">1</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receipt.consultationFee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receipt.consultationFee)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm">Phí dịch vụ</td>
                      <td className="px-4 py-3 text-sm text-right">1</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receipt.serviceFee)}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatCurrency(receipt.serviceFee)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mb-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span>{formatCurrency(receipt.consultationFee + receipt.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">VAT (10%):</span>
                    <span>{formatCurrency(receipt.vat)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Tổng cộng:</span>
                    <span className="text-blue-600">{formatCurrency(receipt.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Thông tin thanh toán
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức:</span>
                  <span className="font-medium">
                    {receipt.paymentMethod === 'payos' ? 'PayOS' : 'Tiền mặt'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Thời gian:</span>
                  <span>{formatDateTime(receipt.createdAt)}</span>
                </div>
                {receipt.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-mono">{receipt.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Trạng thái:</span>
                  <div className="flex items-center gap-2">
                    {receipt.status === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className={receipt.status === 'success' ? 'text-green-600 font-medium' : 'text-gray-600'}>
                      {receipt.status === 'success' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 border-t pt-6">
              <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
              <p className="mt-1">
                Hóa đơn được tạo tự động vào {formatDateTime(receipt.createdAt)}
              </p>
              <p className="mt-2 text-xs">
                Để được hỗ trợ, vui lòng liên hệ: {receipt.hospitalPhone || "028-1234-5678"} 
                hoặc email: support@hospital.vn
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
