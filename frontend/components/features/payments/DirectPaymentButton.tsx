'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Loader2 } from 'lucide-react';
import { paymentApi } from '@/lib/api/payment';

interface DirectPaymentButtonProps {
    amount: number;
    description?: string;
    doctorId?: string;
    doctorName?: string;
    patientId?: string;
    recordId?: string;
    className?: string;
    variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    children?: React.ReactNode;
}

export default function DirectPaymentButton({
    amount,
    description = 'Thanh toán khám bệnh',
    doctorId,
    doctorName,
    patientId,
    recordId,
    className,
    variant = 'default',
    size = 'default',
    children
}: DirectPaymentButtonProps) {
    const [loading, setLoading] = useState(false);
    const [lastClickTime, setLastClickTime] = useState(0);

    const handleDirectPayment = async () => {
        // Debounce: Prevent multiple clicks within 3 seconds
        const now = Date.now();
        if (now - lastClickTime < 3000) {
            alert('⏳ Vui lòng chờ - Đang xử lý thanh toán...');
            return;
        }
        setLastClickTime(now);

        // Validate amount
        if (!amount || amount <= 0) {
            alert('❌ Lỗi - Số tiền thanh toán không hợp lệ');
            return;
        }

        setLoading(true);

        try {
            console.log('🚀 Creating direct payment...', { amount, doctorId, doctorName });

            // Call microservice API to create PayOS payment
            const response = await paymentApi.createPayOSPayment({
                appointmentId: recordId || `APT-${Date.now()}`,
                amount,
                description: description || `Thanh toán khám bệnh với ${doctorName}`,
                serviceName: doctorName ? `Khám bệnh với ${doctorName}` : 'Dịch vụ y tế',
                patientInfo: doctorName ? {
                    doctorName,
                    department: 'Khoa khám bệnh',
                    appointmentDate: new Date().toISOString().split('T')[0],
                    timeSlot: '09:00 - 10:00'
                } : undefined
            });

            const data = response;
            console.log('📊 Payment API response:', data);

            if (data.success && data.data?.checkoutUrl) {
                // Show success message
                alert(`✅ Tạo thanh toán thành công! Mã đơn hàng: ${data.data.orderCode}`);

                // Redirect directly to PayOS - NO INTERMEDIATE PAGES
                console.log('🔗 Redirecting directly to PayOS:', data.data.checkoutUrl);

                // Small delay to show success message
                setTimeout(() => {
                    window.location.href = data.data.checkoutUrl;
                }, 1000);

            } else {
                // Handle API errors
                const errorMessage = data.error?.message || 'Không thể tạo thanh toán';
                alert(`❌ Lỗi thanh toán: ${errorMessage}`);
            }

        } catch (error: any) {
            console.error('❌ Payment error:', error);
            alert('❌ Lỗi kết nối - Không thể kết nối đến hệ thống thanh toán');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleDirectPayment}
            disabled={loading}
            variant={variant}
            size={size}
            className={className}
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo thanh toán...
                </>
            ) : children ? (
                children
            ) : (
                <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán {amount.toLocaleString('vi-VN')} VNĐ
                </>
            )}
        </Button>
    );
}
