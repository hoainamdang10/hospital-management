'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Copy, Loader2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/components/ui/toast-provider";
import { paymentApi } from '@/lib/api/payment';

interface PaymentGatewayProps {
    amount: number;
    description?: string;
    orderId?: string;
    doctorId?: string;
    doctorName?: string;
    recordId?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
    onCancel?: () => void;
    redirectUrl?: string;
    showBackButton?: boolean;
}

export default function PaymentGateway({
    amount,
    description = "Thanh toán khám bệnh",
    orderId,
    doctorId,
    doctorName,
    recordId,
    onSuccess,
    onError,
    onCancel,
    redirectUrl = '/payment/success',
    showBackButton = true
}: PaymentGatewayProps) {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [countdown, setCountdown] = useState<number>(300); // 5 minutes countdown

    // Get display order ID
    const displayOrderId = orderId || paymentData?.orderCode || `ORDER-${Date.now()}`;

    // Create payment on component mount
    useEffect(() => {
        const createPayment = async () => {
            if (amount <= 0) {
                setError('Số tiền thanh toán không hợp lệ');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                const paymentDescription = doctorName
                    ? `Thanh toán khám bệnh với BS ${doctorName}`
                    : description;

                const response = await paymentApi.createPayOSPayment({
                    appointmentId: recordId || `APT-${Date.now()}`,
                    amount,
                    description: paymentDescription,
                    serviceName: doctorName ? `Khám bệnh với ${doctorName}` : 'Dịch vụ y tế',
                    patientInfo: doctorName ? {
                        doctorName,
                        department: 'Khoa khám bệnh',
                        appointmentDate: new Date().toISOString().split('T')[0],
                        timeSlot: '09:00 - 10:00'
                    } : undefined
                });

                if (response.success && response.data) {
                    setPaymentData(response.data);

                    // Set session storage data for post-payment processing
                    const paymentInfo = {
                        orderCode: response.data.orderCode,
                        amount: amount,
                        recordId: recordId,
                        doctorId: doctorId,
                        doctorName: doctorName,
                        description: paymentDescription,
                        createdAt: new Date().toISOString()
                    };

                    sessionStorage.setItem('currentPaymentInfo', JSON.stringify(paymentInfo));
                } else {
                    throw new Error(response.error?.message || 'Không thể tạo yêu cầu thanh toán');
                }
            } catch (error: any) {
                console.error('Payment creation error:', error);
                setError(`Lỗi tạo thanh toán: ${error.message || 'Không xác định'}`);
                if (onError) onError(error);
            } finally {
                setLoading(false);
            }
        };

        createPayment();

        // Start countdown timer
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [amount, description, doctorId, doctorName, onError, recordId]);

    // Format countdown as MM:SS
    const formatCountdown = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Handle copy order code
    const handleCopyOrderCode = () => {
        if (paymentData?.orderCode) {
            navigator.clipboard.writeText(paymentData.orderCode);
            toast({
                title: "Đã sao chép",
                description: "Mã đơn hàng đã được sao chép vào clipboard",
                variant: "success"
            });
        }
    };

    // Handle VNPay payment
    const handleVNPayPayment = () => {
        if (paymentData?.checkoutUrl) {
            window.location.href = paymentData.checkoutUrl;
        } else {
            toast({
                title: "Lỗi chuyển hướng",
                description: "Không có URL thanh toán",
                variant: "destructive"
            });
        }
    };

    // Handle payment completion - for manual payment confirmations
    const handlePaymentSuccess = () => {
        setProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            try {
                // Save payment data to localStorage for success page
                localStorage.setItem('paymentCompleted', JSON.stringify({
                    recordId,
                    doctorId,
                    amount,
                    orderCode: paymentData?.orderCode || displayOrderId,
                    paymentDate: new Date().toISOString()
                }));

                // Call success callback if provided
                if (onSuccess) {
                    onSuccess({
                        orderCode: paymentData?.orderCode || displayOrderId,
                        amount: amount
                    });
                }

                // Redirect to success page with order info
                const redirectParams = new URLSearchParams({
                    orderCode: paymentData?.orderCode || displayOrderId,
                    amount: amount.toString()
                }).toString();

                router.push(`${redirectUrl}?${redirectParams}`);
            } catch (error) {
                console.error('Error handling payment success:', error);
                setError('Lỗi xử lý thanh toán thành công');
                setProcessing(false);
            }
        }, 1500);
    };

    // Handle back button click
    const handleBack = () => {
        if (onCancel) {
            onCancel();
        } else {
            router.back();
        }
    };

    // Loading state
    if (loading) {
        return (
            <Card className="shadow-lg border-0">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#003087] mb-4"></div>
                    <h2 className="text-xl font-semibold mt-4">Đang kết nối đến cổng thanh toán...</h2>
                    <p className="text-gray-600 mt-2">Vui lòng không đóng trình duyệt</p>
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Card className="shadow-lg border-0">
                <CardContent className="p-6">
                    <div className="text-center">
                        <div className="bg-red-100 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi thanh toán</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <div className="flex gap-3 justify-center">
                            {showBackButton && (
                                <Button variant="outline" onClick={handleBack}>
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Quay lại
                                </Button>
                            )}
                            <Button onClick={() => window.location.reload()}>
                                Thử lại
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Payment form
    return (
        <Card className="shadow-lg border-0">
            <CardHeader className="bg-[#003087] text-white">
                <CardTitle className="flex items-center justify-between">
                    <span>Thanh toán</span>
                    {countdown > 0 && (
                        <Badge variant="outline" className="bg-white/10 text-white ml-2">
                            {formatCountdown(countdown)}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6">
                <div className="space-y-6">
                    {/* Payment summary */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Số tiền thanh toán</p>
                                <p className="text-2xl font-bold text-[#003087]">{amount.toLocaleString('vi-VN')} VNĐ</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-[#003087]" />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                                <p className="text-sm text-gray-600">Mã đơn hàng</p>
                                <p className="font-medium">{displayOrderId}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyOrderCode}
                                className="text-gray-600 hover:text-[#003087]"
                            >
                                <Copy className="h-4 w-4 mr-1" />
                                Sao chép
                            </Button>
                        </div>
                    </div>

                    {/* QR code if available */}
                    {paymentData?.qrCode && (
                        <div className="mt-4 flex flex-col items-center">
                            <p className="text-sm text-gray-600 mb-2">Quét mã QR để thanh toán</p>
                            <div className="border border-gray-200 p-2 rounded-lg inline-block">
                                <Image
                                    src={paymentData.qrCode}
                                    alt="QR Code"
                                    width={200}
                                    height={200}
                                />
                            </div>
                        </div>
                    )}

                    {/* Payment options */}
                    <div className="space-y-4 pt-4 border-t border-gray-200">
                        <h3 className="font-medium">Phương thức thanh toán</h3>

                        {/* VNPay option */}
                        <Button
                            className="w-full bg-green-600 hover:bg-green-700 h-auto py-3"
                            onClick={handleVNPayPayment}
                            disabled={processing || !paymentData?.checkoutUrl}
                        >
                            <div className="flex items-center">
                                <div className="bg-white p-1 rounded mr-3">
                                    <Image
                                        src="/assets/images/payment/vn-pay.svg"
                                        width={30}
                                        height={30}
                                        alt="VNPay"
                                    />
                                </div>
                                <span>Thanh toán với VNPay</span>
                            </div>
                        </Button>

                        {/* Manual bank transfer */}
                        <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-semibold">Chuyển khoản ngân hàng</h4>
                                <div className="bg-white p-1 rounded">
                                    <Image
                                        src="/assets/images/payment/bank-transfer.svg"
                                        width={24}
                                        height={24}
                                        alt="Bank"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="text-gray-600">Ngân hàng:</span>
                                    <span className="font-medium ml-1">OCB - Ngân hàng Phương Đông</span>
                                </p>
                                <p>
                                    <span className="text-gray-600">Số tài khoản:</span>
                                    <span className="font-medium ml-1">0867600311</span>
                                </p>
                                <p>
                                    <span className="text-gray-600">Chủ tài khoản:</span>
                                    <span className="font-medium ml-1">NGUYEN TRUNG HIEU</span>
                                </p>
                                <p>
                                    <span className="text-gray-600">Nội dung:</span>
                                    <span className="font-medium ml-1">{displayOrderId}</span>
                                </p>
                            </div>

                            <div className="mt-3 bg-blue-50 p-2 rounded text-xs text-blue-600">
                                Sau khi chuyển khoản, hãy nhấn vào nút "Đã thanh toán" dưới đây
                            </div>

                            <div className="mt-3">
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={handlePaymentSuccess}
                                    disabled={processing || countdown === 0}
                                >
                                    {processing ? (
                                        <div className="flex items-center">
                                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                            Đang xử lý...
                                        </div>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Tôi đã thanh toán
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Back button */}
                    {showBackButton && !processing && (
                        <div className="mt-4">
                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={handleBack}
                                disabled={processing}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>
                        </div>
                    )}

                    {/* Countdown expired message */}
                    {countdown === 0 && (
                        <div className="bg-red-50 p-4 rounded-lg text-center">
                            <p className="text-red-700 mb-2">Phiên thanh toán đã hết hạn</p>
                            <Button onClick={() => window.location.reload()}>
                                Tạo phiên mới
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 