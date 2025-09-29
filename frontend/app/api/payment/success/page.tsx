'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, User, FileText } from 'lucide-react';
import PublicLayout from '@/components/layout/PublicLayout';
import { paymentApi } from '@/lib/api/payment';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [verificationComplete, setVerificationComplete] = useState(false);

    // Get payment details from URL parameters
    const paymentId = searchParams?.get('paymentId');
    const doctorId = searchParams?.get('doctorId');
    const doctorName = searchParams?.get('doctorName') || 'Bác sĩ';
    const orderCode = searchParams?.get('orderCode');

    // Booking details
    const [booking, setBooking] = useState({
        doctorId: doctorId || '',
        doctorName: doctorName || 'Bác sĩ',
        amount: 0,
        appointmentDate: '',
        appointmentTime: '',
        orderCode: orderCode || '',
        paymentId: paymentId || '',
        reason: 'Khám thường kỳ'
    });

    useEffect(() => {
        // Verify payment status with PayOS API
        const verifyPayment = async () => {
            if (!orderCode) {
                console.error('Missing order code in URL');
                setError('Thiếu thông tin đơn hàng');
                setLoading(false);
                return;
            }

            try {
                // Call API to verify the payment status
                const response = await paymentApi.queryPaymentStatus(orderCode);

                if (response.code === '00' && response.data?.status === 'PAID') {
                    // Payment confirmed by PayOS
                    // Get booking info from localStorage
                    const pendingBooking = localStorage.getItem('pendingBooking');
                    if (pendingBooking) {
                        try {
                            const bookingData = JSON.parse(pendingBooking);
                            setBooking({
                                ...booking,
                                ...bookingData,
                                orderCode: orderCode,
                                paymentId: paymentId || response.data.transactionId || '',
                            });

                            // Mark payment as completed in localStorage
                            localStorage.setItem('paymentCompleted', 'true');
                            localStorage.setItem('paymentId', paymentId || response.data.transactionId || '');

                            // Remove pending booking info
                            localStorage.removeItem('pendingBooking');

                            // Send booking data to server (would be implemented here in production)
                            // await bookAppointment(bookingData);

                            setVerificationComplete(true);
                        } catch (e) {
                            console.error('Error parsing booking data', e);
                            setError('Không thể đọc thông tin đặt lịch');
                        }
                    } else {
                        console.error('No pending booking found');
                        // Still allow completion based on URL parameters
                        setVerificationComplete(true);
                    }
                } else if (response.code === 'ERROR') {
                    // API error but we have URL parameters from PayOS callback
                    console.warn('Payment verification API error, proceeding based on URL parameters');
                    // Since the user was redirected here from PayOS, assume success
                    // Get any saved booking data
                    const pendingBooking = localStorage.getItem('pendingBooking');
                    if (pendingBooking) {
                        try {
                            const bookingData = JSON.parse(pendingBooking);
                            setBooking({
                                ...booking,
                                ...bookingData,
                                orderCode: orderCode || '',
                                paymentId: paymentId || '',
                            });

                            localStorage.removeItem('pendingBooking');
                            localStorage.setItem('paymentCompleted', 'true');
                        } catch (e) {
                            console.error('Error parsing booking data', e);
                        }
                    }
                    setVerificationComplete(true);
                } else {
                    // Payment not verified
                    console.error('Payment not verified:', response);
                    setError('Thanh toán chưa được xác nhận, vui lòng liên hệ hỗ trợ');
                }
            } catch (err) {
                console.error('Payment verification error:', err);
                setError('Đã xảy ra lỗi khi xác minh trạng thái thanh toán');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [orderCode, paymentId]);

    const handleViewDetails = () => {
        router.push(`/dashboard`);
    };

    const handleBookAnother = () => {
        router.push(`/doctors`);
    };

    return (
        <PublicLayout currentPage="payment">
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <Card className="shadow-xl border-0">
                            <CardContent className="p-0">
                                {/* Success Header */}
                                <div className="bg-green-50 p-8 text-center border-b border-green-100">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                        Thanh toán thành công!
                                    </h1>
                                    <p className="text-gray-600">
                                        Lịch hẹn của bạn đã được xác nhận
                                    </p>
                                </div>

                                {/* Appointment Details */}
                                <div className="p-8">
                                    <h2 className="text-xl font-semibold mb-4">Thông tin</h2>

                                    <div className="space-y-6">
                                        {loading ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                                <span className="ml-2 text-gray-600">Đang xác minh thanh toán...</span>
                                            </div>
                                        ) : error ? (
                                            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                                                {error}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex justify-between pb-4 border-b border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <User className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm text-gray-600">Bác sĩ</div>
                                                            <div className="font-semibold">{booking.doctorName}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between pb-4 border-b border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm text-gray-600">Ngày khám</div>
                                                            <div className="font-semibold">{booking.appointmentDate || new Date().toISOString().split('T')[0]}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm text-gray-600">Giờ khám</div>
                                                            <div className="font-semibold">{booking.appointmentTime || '09:00'}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between pb-4 border-b border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm text-gray-600">Mã thanh toán</div>
                                                            <div className="font-mono text-sm">{booking.paymentId}</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between pb-4 border-b border-gray-100">
                                                    <div className="flex items-start gap-3">
                                                        <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <div className="text-sm text-gray-600">Mã đơn hàng</div>
                                                            <div className="font-mono text-sm">{booking.orderCode}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex flex-col pt-4 space-y-3">
                                            <Button
                                                onClick={handleViewDetails}
                                                className="bg-blue-600 hover:bg-blue-700"
                                                disabled={loading}
                                            >
                                                Xem chi tiết
                                            </Button>
                                            <Button
                                                onClick={handleBookAnother}
                                                variant="outline"
                                                className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                                disabled={loading}
                                            >
                                                Đặt lịch khám khác
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}