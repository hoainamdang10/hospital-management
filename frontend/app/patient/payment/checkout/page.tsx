"use client";

import { PatientLayout } from "@/components/layout/UniversalLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { paymentsApi, paymentUtils } from "@/lib/api/payments";
import { Banknote, CheckCircle, CreditCard, Shield } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Invoice {
  id: string;
  appointmentId: string;
  consultationFee: number;
  serviceFee: number;
  vat: number;
  total: number;
  doctorName: string;
  appointmentDate: string;
  timeSlot: string;
  department: string;
}

interface PaymentMethod {
  id: "payos" | "cash";
  name: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgColor: string;
}

export default function PaymentCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appointmentId = searchParams.get("appointmentId");
  const [selectedMethod, setSelectedMethod] = useState<"payos" | "cash">(
    "payos"
  );
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(true);

  const paymentMethods: PaymentMethod[] = [
    {
      id: "payos",
      name: "PayOS",
      description: "Thẻ ATM, Internet Banking, QR Code",
      icon: <CreditCard className="h-6 w-6" />,
      features: ["Bảo mật cao", "Thanh toán nhanh", "Hỗ trợ 24/7"],
      color: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200",
    },
    {
      id: "cash",
      name: "Tiền mặt",
      description: "Thanh toán tại quầy bệnh viện",
      icon: <Banknote className="h-6 w-6" />,
      features: [
        "Thanh toán trực tiếp",
        "Nhận hóa đơn ngay",
        "Không phí giao dịch",
      ],
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200",
    },
  ];

  useEffect(() => {
    if (appointmentId) {
      fetchInvoiceData();
    } else {
      toast.error("Không tìm thấy thông tin lịch khám");
      router.push("/patient/appointments");
    }
  }, [appointmentId]);

  const fetchInvoiceData = async () => {
    try {
      setIsLoadingInvoice(true);
      const response = await fetch(
        `/api/billing/invoice?appointmentId=${appointmentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch invoice data");
      }

      const data = await response.json();
      setInvoice(data.data);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error("Không thể tải thông tin hóa đơn");
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const formatCurrency = paymentUtils.formatCurrency;

  const formatDateTime = paymentUtils.formatDateTime;

  const handlePayOSPayment = async () => {
    if (!invoice) return;

    // Enhanced validation
    if (!paymentUtils.validateAmount(invoice.total)) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    if (invoice.total < 1000) {
      toast.error("Số tiền thanh toán tối thiểu là 1.000 VNĐ");
      return;
    }

    if (invoice.total > 50000000) {
      toast.error("Số tiền thanh toán không được vượt quá 50.000.000 VNĐ");
      return;
    }

    setIsLoading(true);
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        console.log(`🔄 PayOS payment attempt ${attempts + 1}/${maxAttempts}`);

        const response = await paymentsApi.createPayOSPayment({
          appointmentId: invoice.appointmentId,
          amount: invoice.total,
          description: `Thanh toán khám bệnh - ${invoice.appointmentId}`,
          serviceName: "Phí khám bệnh",
          patientInfo: {
            doctorName: invoice.doctorName,
            department: invoice.department,
            appointmentDate: invoice.appointmentDate,
            timeSlot: invoice.timeSlot,
          },
          returnUrl: `${window.location.origin}/patient/payment/result`,
          cancelUrl: `${window.location.origin}/patient/payment/checkout?appointmentId=${invoice.appointmentId}`,
        });

        if (response.success && response.data?.checkoutUrl) {
          console.log("✅ PayOS payment URL created successfully");

          // Enhanced payment tracking
          const paymentTrackingData = {
            orderCode: response.data.orderCode,
            appointmentId: invoice.appointmentId,
            amount: invoice.total,
            createdAt: new Date().toISOString(),
            paymentMethod: "PayOS",
            doctorName: invoice.doctorName,
            department: invoice.department,
            attemptNumber: attempts + 1,
          };

          localStorage.setItem(
            "pendingPayment",
            JSON.stringify(paymentTrackingData)
          );

          // Show success message before redirect
          toast.success("Đang chuyển hướng đến trang thanh toán...", {
            duration: 2000,
          });

          // Small delay for user experience
          setTimeout(() => {
            window.location.href = response.data.checkoutUrl;
          }, 1000);

          return; // Success, exit retry loop
        } else {
          throw new Error(response.message || "Không thể tạo link thanh toán");
        }
      } catch (error) {
        attempts++;
        console.error(`❌ PayOS payment attempt ${attempts} failed:`, error);

        if (attempts >= maxAttempts) {
          // Final attempt failed
          const errorMessage =
            error instanceof Error ? error.message : "Không xác định";
          console.error("💥 All PayOS payment attempts failed");

          toast.error(
            `Không thể tạo thanh toán sau ${maxAttempts} lần thử. Lỗi: ${errorMessage}`
          );
          break;
        } else {
          // Show retry message
          toast.loading(`Đang thử lại... (${attempts}/${maxAttempts})`, {
            duration: 1000,
          });

          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }

    setIsLoading(false);
  };

  const handleCashPayment = async () => {
    if (!invoice) return;

    // Enhanced validation for cash payment
    if (!paymentUtils.validateAmount(invoice.total)) {
      toast.error("Số tiền thanh toán không hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      console.log("🔄 Creating cash payment voucher...");

      const response = await paymentsApi.createCashPayment({
        appointmentId: invoice.appointmentId,
        amount: invoice.total,
        paymentMethod: "cash",
        notes: `Thanh toán tiền mặt cho lịch khám ${invoice.appointmentId}`,
        patientInfo: {
          doctorName: invoice.doctorName,
          department: invoice.department,
          appointmentDate: invoice.appointmentDate,
          timeSlot: invoice.timeSlot,
        },
      });

      if (response.success && response.data) {
        console.log("✅ Cash payment voucher created successfully");

        // Enhanced cash payment tracking
        const cashPaymentData = {
          orderCode: response.data.orderCode,
          appointmentId: invoice.appointmentId,
          amount: invoice.total,
          createdAt: new Date().toISOString(),
          paymentMethod: "cash",
          doctorName: invoice.doctorName,
          department: invoice.department,
          status: "PENDING",
        };

        localStorage.setItem("pendingPayment", JSON.stringify(cashPaymentData));

        toast.success("Đã tạo phiếu thanh toán tiền mặt thành công!");

        // Redirect with enhanced query params
        router.push(
          `/patient/payment/result?orderCode=${response.data.orderCode}&status=PENDING&method=cash&appointmentId=${invoice.appointmentId}`
        );
      } else {
        console.error("❌ Failed to create cash payment:", response.message);
        toast.error(
          "Lỗi tạo phiếu thanh toán: " + (response.message || "Không xác định")
        );
      }
    } catch (error) {
      console.error("💥 Cash payment error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi kết nối";
      toast.error(
        `Lỗi khi tạo phiếu thanh toán: ${errorMessage}. Vui lòng thử lại.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = () => {
    if (selectedMethod === "payos") {
      handlePayOSPayment();
    } else {
      handleCashPayment();
    }
  };

  if (isLoadingInvoice) {
    return (
      <PatientLayout title="Thanh toán" activePage="payment">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!invoice) {
    return (
      <PatientLayout title="Thanh toán" activePage="payment">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-gray-500">Không tìm thấy thông tin hóa đơn</p>
          <Button
            onClick={() => router.push("/patient/appointments")}
            className="mt-4"
          >
            Quay lại lịch khám
          </Button>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title="Thanh toán" activePage="payment">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Invoice Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Chi tiết hóa đơn
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Appointment Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Thông tin lịch khám
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-blue-700">Bác sĩ:</span>
                  <span className="ml-2 font-medium">{invoice.doctorName}</span>
                </div>
                <div>
                  <span className="text-blue-700">Khoa:</span>
                  <span className="ml-2 font-medium">{invoice.department}</span>
                </div>
                <div>
                  <span className="text-blue-700">Ngày khám:</span>
                  <span className="ml-2 font-medium">
                    {formatDateTime(invoice.appointmentDate)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Giờ khám:</span>
                  <span className="ml-2 font-medium">{invoice.timeSlot}</span>
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí khám bệnh:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.consultationFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phí dịch vụ:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.serviceFee)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">VAT (10%):</span>
                <span className="font-medium">
                  {formatCurrency(invoice.vat)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center text-lg font-bold">
                <span>Tổng cộng:</span>
                <span className="text-blue-600">
                  {formatCurrency(invoice.total)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedMethod === method.id
                    ? `${method.bgColor} border-current shadow-md`
                    : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      selectedMethod === method.id
                        ? method.bgColor
                        : "bg-gray-100"
                    }`}
                  >
                    <div
                      className={
                        selectedMethod === method.id
                          ? method.color
                          : "text-gray-600"
                      }
                    >
                      {method.icon}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {method.name}
                      </h3>
                      {selectedMethod === method.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {method.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {method.features.map((feature, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Payment Button */}
        <Card>
          <CardContent className="p-6">
            <Button
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              onClick={handlePayment}
              disabled={isLoading || !invoice}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  {selectedMethod === "payos" ? (
                    <CreditCard className="h-5 w-5 mr-2" />
                  ) : (
                    <Banknote className="h-5 w-5 mr-2" />
                  )}
                  Thanh toán {formatCurrency(invoice.total)}
                </>
              )}
            </Button>

            {/* Security Notice */}
            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Thanh toán được bảo mật bởi PayOS</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Thông tin thanh toán của bạn được mã hóa và bảo vệ
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PatientLayout>
  );
}
