'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CheckoutRedirectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeoutReached, setTimeoutReached] = useState(false);

    // Lấy các tham số từ URL
    const orderCode = searchParams?.get('orderCode');
    const amount = searchParams?.get('amount');
    const doctorId = searchParams?.get('doctorId');

    // URL dự phòng nếu chuyển hướng thất bại
    const backupUrl = `/payment/checkout?orderCode=${orderCode}&amount=${amount}&doctorId=${doctorId}`;

    useEffect(() => {
        // Đã thử chuyển hướng tự động nhưng vẫn đang ở đây
        console.log('Đang cố gắng chuyển hướng đến PayOS...');

        // Thiết lập timeout để hiển thị tùy chọn dự phòng
        // nếu quá 5 giây mà không chuyển hướng được
        const timeoutId = setTimeout(() => {
            console.log('Timeout reached - hiển thị tùy chọn dự phòng');
            setTimeoutReached(true);
            setLoading(false);
        }, 5000);

        // Cố gắng chuyển hướng người dùng đến PayOS
        try {
            if (orderCode) {
                // Thử chuyển hướng đến trang thanh toán. Trong thực tế, bạn có thể gọi API
                // để lấy lại URL thanh toán từ server của bạn theo orderCode

                // Code thử nghiệm để xem có vấn đề gì với chuyển hướng
                console.log('Chuyển hướng đến trang thanh toán dự phòng');
                router.push(backupUrl);
            } else {
                setError('Mã đơn hàng không hợp lệ');
                setLoading(false);
            }
        } catch (err) {
            console.error('Lỗi chuyển hướng:', err);
            setError('Lỗi khi cố gắng chuyển hướng');
            setLoading(false);
        }

        return () => clearTimeout(timeoutId);
    }, [orderCode, router, backupUrl]);

    // Xử lý khi người dùng nhấn dùng phương án thanh toán dự phòng
    const handleUseBackup = () => {
        router.push(backupUrl);
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-md mx-auto">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="text-center">Chuyển hướng thanh toán</CardTitle>
                            </CardHeader>

                            <CardContent className="text-center py-8">
                                {loading && !timeoutReached && !error && (
                                    <div className="flex flex-col items-center gap-4">
                                        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                                        <p>Đang chuyển hướng đến trang thanh toán...</p>
                                    </div>
                                )}

                                {(timeoutReached || error) && (
                                    <div className="space-y-6">
                                        <Alert variant="destructive">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Không thể chuyển hướng tự động</AlertTitle>
                                            <AlertDescription>
    // Get parameters from URL
                                                const orderCode = searchParams?.get('orderCode') || '';
                                                const doctorId = searchParams?.get('doctorId') || '';
                                                const amount = searchParams?.get('amount') ? parseInt(searchParams.get('amount') || '0') : 0;

    // Start countdown
    useEffect(() => {
        const timer = setInterval(() => {
                                                    setCountdown(prevCount => {
                                                        if (prevCount <= 1) {
                                                            clearInterval(timer);
                                                            return 0;
                                                        }
                                                        return prevCount - 1;
                                                    });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Format countdown as MM:SS
    const formatCountdown = () => {
        const minutes = Math.floor(countdown / 60);
                                                const seconds = countdown % 60;
                                                return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const handlePayment = async (success: boolean) => {
                                                    setProcessing(true);
                                                setError(null);

                                                try {
                                                    // Simulate processing delay
                                                    await new Promise(resolve => setTimeout(resolve, 1500));

                                                // Generate a unique payment ID
                                                const paymentId = `PAYMENT-${Date.now()}`;

                                                // Get doctor name from localStorage
                                                let doctorName = 'Bác sĩ';
                                                const pendingBooking = localStorage.getItem('pendingBooking');
                                                if (pendingBooking) {
                try {
                    const bookingData = JSON.parse(pendingBooking);
                                                doctorName = bookingData.doctorName || doctorName;
                } catch (e) {
                                                    console.error('Error parsing pending booking data', e);
                }
            }

                                                if (success) {
                                                    // Save the payment status to localStorage for success flow
                                                    localStorage.setItem('paymentCompleted', 'true');
                                                localStorage.setItem('paymentId', paymentId);

                                                // Redirect to the success page with all necessary parameters
                                                window.location.href = `/api/payment/success?paymentId=${paymentId}&doctorId=${doctorId}&doctorName=${encodeURIComponent(doctorName)}&orderCode=${orderCode}`;
            } else {
                                                    // Redirect to the cancel page
                                                    window.location.href = `/api/payment/cancel?doctorId=${doctorId}`;
            }
        } catch (err) {
                                                    console.error('Payment simulation error:', err);
                                                setError('Đã xảy ra lỗi trong quá trình mô phỏng thanh toán.');
                                                setProcessing(false);
        }
    };

                                                return (
                                                <div className="min-h-screen bg-gray-50 py-12">
                                                    <div className="container mx-auto px-4">
                                                        <div className="max-w-md mx-auto">
                                                            <div className="text-center mb-8">
                                                                <h1 className="text-3xl font-bold text-gray-900">PayOS Checkout</h1>
                                                                <p className="text-gray-600 mt-2">
                                                                    Mô phỏng thanh toán qua PayOS
                                                                </p>
                                                            </div>

                                                            <Card className="shadow-lg border-0">
                                                                <CardContent className="p-8">
                                                                    <div className="space-y-6">
                                                                        <div className="bg-blue-50 p-4 rounded-lg">
                                                                            <div className="grid grid-cols-2 gap-y-3">
                                                                                <div>
                                                                                    <div className="text-sm text-gray-600">Mã đơn hàng</div>
                                                                                    <div className="font-mono font-medium text-sm">{orderCode}</div>
                                                                                </div>
                                                                                <div>
                                                                                    <div className="text-sm text-gray-600">Số tiền</div>
                                                                                    <div className="font-bold text-blue-600">{amount.toLocaleString('vi-VN')} VNĐ</div>
                                                                                </div>
                                                                                <div className="col-span-2">
                                                                                    <div className="text-sm text-gray-600">Thời gian còn lại</div>
                                                                                    <div className="font-mono font-medium">{formatCountdown()}</div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="text-center py-4 border-y border-gray-100">
                                                                            <div className="text-lg font-medium text-gray-700 mb-1">
                                                                                Vui lòng chọn kết quả thanh toán
                                                                            </div>
                                                                            <div className="text-sm text-gray-500">
                                                                                Trong môi trường thật, người dùng sẽ được chuyển đến cổng thanh toán PayOS
                                                                            </div>
                                                                        </div>

                                                                        {error && (
                                                                            <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start space-x-2">
                                                                                <AlertCircle className="h-5 w-5 mt-0.5" />
                                                                                <div>{error}</div>
                                                                            </div>
                                                                        )}

                                                                        <div className="space-y-3">
                                                                            <Button
                                                                                onClick={() => handlePayment(true)}
                                                                                className="w-full bg-green-600 hover:bg-green-700"
                                                                                disabled={processing || countdown === 0}
                                                                            >
                                                                                {processing ? (
                                                                                    <div className="flex items-center">
                                                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                                                        Đang xử lý...
                                                                                    </div>
                                                                                ) : (
                                                                                    <>
                                                                                        <CheckCircle className="h-4 w-4 mr-2" />
                                                                                        Thanh toán thành công
                                                                                    </>
                                                                                )}
                                                                            </Button>

                                                                            <Button
                                                                                onClick={() => handlePayment(false)}
                                                                                variant="outline"
                                                                                className="w-full"
                                                                                disabled={processing || countdown === 0}
                                                                            >
                                                                                Thanh toán thất bại / Hủy
                                                                            </Button>
                                                                        </div>

                                                                        <div className="text-center text-xs text-gray-500">
                                                                            Đây là trang mô phỏng thanh toán, chỉ dùng cho mục đích phát triển
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </div>
                                                    </div>
                                                </div>
                                                );
} 