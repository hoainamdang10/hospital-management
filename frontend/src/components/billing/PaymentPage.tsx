import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import {
  CreditCard,
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  Calendar,
  Stethoscope,
  QrCode,
  Smartphone,
  Building2,
  Banknote,
} from "lucide-react";
import { motion } from "framer-motion";

interface PaymentPageProps {
  appointmentData: {
    patientName: string;
    phone: string;
    specialty: string;
    doctor: string;
    date: string;
    time: string;
  };
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export function PaymentPage({
  appointmentData,
  onBack,
  onPaymentSuccess,
}: PaymentPageProps) {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardData, setCardData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardholderName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const appointmentFee = 300000; // 300,000 VND for specialist consultation
  const serviceFee = 15000; // 15,000 VND service fee
  const total = appointmentFee + serviceFee;

  const handleCardInputChange = (field: string, value: string) => {
    if (field === "cardNumber") {
      // Format card number with spaces
      const formatted = value
        .replace(/\s/g, "")
        .replace(/(.{4})/g, "$1 ")
        .trim();
      if (formatted.length <= 19) {
        setCardData((prev) => ({ ...prev, [field]: formatted }));
      }
    } else if (field === "expiryDate") {
      // Format expiry date MM/YY
      const formatted = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d{1,2})/, "$1/$2");
      if (formatted.length <= 5) {
        setCardData((prev) => ({ ...prev, [field]: formatted }));
      }
    } else if (field === "cvv") {
      // Only allow 3-4 digits
      if (value.length <= 4 && /^\d*$/.test(value)) {
        setCardData((prev) => ({ ...prev, [field]: value }));
      }
    } else {
      setCardData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handlePayment = async () => {
    if (!agreedToTerms) {
      alert("Vui lòng đồng ý với điều khoản dịch vụ");
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsProcessing(false);
    setIsCompleted(true);

    // Call success callback after showing success message
    setTimeout(() => {
      onPaymentSuccess();
    }, 2000);
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="text-center">
            <CardContent className="p-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
                className="mb-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
              </motion.div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Thanh toán thành công!
              </h2>

              <p className="text-gray-600 mb-6">
                Lịch hẹn của bạn đã được xác nhận. Chúng tôi sẽ gửi thông tin
                chi tiết qua SMS và email.
              </p>

              <div className="bg-blue-50 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-blue-800 mb-2">
                  Thông tin lịch hẹn:
                </h3>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>
                    📅 {appointmentData.date} lúc {appointmentData.time}
                  </p>
                  <p>👨‍⚕️ {appointmentData.doctor}</p>
                  <p>🏥 Khoa {appointmentData.specialty}</p>
                  <p>🎫 Mã lịch hẹn: #MED{Date.now().toString().slice(-6)}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Vui lòng có mặt trước 15 phút và mang theo giấy tờ tùy thân.
              </p>

              <Button
                onClick={onBack}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Quay về trang chủ
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          <h1 className="text-3xl font-bold text-gray-800">
            Thanh toán lịch hẹn
          </h1>
          <p className="text-gray-600 mt-2">
            Hoàn tất đặt lịch khám bệnh của bạn
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Appointment Summary */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Calendar className="h-5 w-5" />
                  Thông tin lịch hẹn
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{appointmentData.patientName}</p>
                    <p className="text-sm text-gray-500">Bệnh nhân</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{appointmentData.phone}</p>
                    <p className="text-sm text-gray-500">Số điện thoại</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Stethoscope className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">
                      Khoa {appointmentData.specialty}
                    </p>
                    <p className="text-sm text-gray-500">
                      {appointmentData.doctor}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{appointmentData.date}</p>
                    <p className="text-sm text-gray-500">
                      {appointmentData.time}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="font-medium">Bệnh viện MediCare</p>
                    <p className="text-sm text-gray-500">
                      123 Đường ABC, Quận 1, TP.HCM
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cost Breakdown */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-blue-600">
                  Chi tiết thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Phí khám chuyên khoa</span>
                    <span>{appointmentFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí dịch vụ</span>
                    <span>{serviceFee.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <hr />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Tổng cộng</span>
                    <span className="text-blue-600">
                      {total.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <CreditCard className="h-5 w-5" />
                  Phương thức thanh toán
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="card" id="card" />
                      <Label
                        htmlFor="card"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4" />
                        Thẻ tín dụng/ghi nợ
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="momo" id="momo" />
                      <Label
                        htmlFor="momo"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Smartphone className="h-4 w-4" />
                        Ví MoMo
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="banking" id="banking" />
                      <Label
                        htmlFor="banking"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Building2 className="h-4 w-4" />
                        Internet Banking
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="qr" id="qr" />
                      <Label
                        htmlFor="qr"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <QrCode className="h-4 w-4" />
                        Quét mã QR
                      </Label>
                    </div>
                  </div>
                </RadioGroup>

                {/* Card Payment Form */}
                {paymentMethod === "card" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div>
                      <Label htmlFor="cardNumber">Số thẻ</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardData.cardNumber}
                        onChange={(e) =>
                          handleCardInputChange("cardNumber", e.target.value)
                        }
                        className="font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Ngày hết hạn</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={cardData.expiryDate}
                          onChange={(e) =>
                            handleCardInputChange("expiryDate", e.target.value)
                          }
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          value={cardData.cvv}
                          onChange={(e) =>
                            handleCardInputChange("cvv", e.target.value)
                          }
                          className="font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cardholderName">Tên chủ thẻ</Label>
                      <Input
                        id="cardholderName"
                        placeholder="NGUYEN VAN A"
                        value={cardData.cardholderName}
                        onChange={(e) =>
                          handleCardInputChange(
                            "cardholderName",
                            e.target.value.toUpperCase()
                          )
                        }
                      />
                    </div>
                  </motion.div>
                )}

                {/* Alternative Payment Methods */}
                {paymentMethod === "momo" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-center p-6 bg-pink-50 rounded-lg"
                  >
                    <Smartphone className="h-12 w-12 text-pink-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Thanh toán qua MoMo</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Bạn sẽ được chuyển đến ứng dụng MoMo để hoàn tất thanh
                      toán
                    </p>
                    <Badge
                      variant="outline"
                      className="text-pink-600 border-pink-300"
                    >
                      Số tiền: {total.toLocaleString("vi-VN")}đ
                    </Badge>
                  </motion.div>
                )}

                {paymentMethod === "banking" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-center p-6 bg-blue-50 rounded-lg"
                  >
                    <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Internet Banking</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Chọn ngân hàng của bạn để thanh toán trực tuyến
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Badge variant="outline">Vietcombank</Badge>
                      <Badge variant="outline">Techcombank</Badge>
                      <Badge variant="outline">BIDV</Badge>
                      <Badge variant="outline">VietinBank</Badge>
                      <Badge variant="outline">ACB</Badge>
                      <Badge variant="outline">Sacombank</Badge>
                    </div>
                  </motion.div>
                )}

                {paymentMethod === "qr" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-center p-6 bg-green-50 rounded-lg"
                  >
                    <QrCode className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Quét mã QR</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Sử dụng ứng dụng ngân hàng để quét mã QR thanh toán
                    </p>
                    <div className="w-32 h-32 bg-white border-2 border-green-300 rounded-lg mx-auto flex items-center justify-center">
                      <QrCode className="h-20 w-20 text-green-600" />
                    </div>
                  </motion.div>
                )}

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-2 p-4 bg-gray-50 rounded-lg">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={setAgreedToTerms}
                  />
                  <Label
                    htmlFor="terms"
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    Tôi đồng ý với{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      điều khoản dịch vụ
                    </a>{" "}
                    và{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      chính sách bảo mật
                    </a>{" "}
                    của MediCare. Tôi xác nhận thông tin đặt lịch là chính xác.
                  </Label>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-blue-700">
                    Thông tin thanh toán của bạn được bảo mật với chuẩn mã hóa
                    SSL 256-bit
                  </p>
                </div>

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={!agreedToTerms || isProcessing}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-lg"
                >
                  {isProcessing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Đang xử lý...
                    </div>
                  ) : (
                    `Thanh toán ${total.toLocaleString("vi-VN")}đ`
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
