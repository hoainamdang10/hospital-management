import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { useRouter } from 'next/navigation';

interface SimplePaymentFormProps {
    doctorId?: string;
    recordId?: string;
    amount?: number;
    description?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: any) => void;
}

export default function SimplePaymentForm({
    doctorId = '',
    recordId = '',
    amount = 0,
    description = 'Thanh toán viện phí',
    onSuccess,
    onError
}: SimplePaymentFormProps) {
    const { showToast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(amount);

    const handlePayment = async () => {
        if (paymentAmount <= 0) {
            showToast(
                "Lỗi thanh toán",
                "Số tiền thanh toán phải lớn hơn 0",
                "error"
            );
            return;
        }

        try {
            setIsLoading(true);

            const paymentData = {
                doctorId: doctorId,
                recordId: recordId,
                amount: paymentAmount,
                description: description
            };

            // Gọi API tạo payment order
            const response = await fetch('/api/payment/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();

            if (!result.success || !result.checkoutUrl) {
                throw new Error(result.error?.message || 'Không thể tạo yêu cầu thanh toán');
            }

            // Lưu thông tin thanh toán vào session storage
            const paymentInfo = {
                orderCode: result.orderCode,
                amount: paymentAmount,
                recordId: recordId,
                doctorId: doctorId,
                description: description,
                createdAt: new Date().toISOString()
            };
            sessionStorage.setItem('currentPaymentInfo', JSON.stringify(paymentInfo));

            // Gọi callback thành công nếu có
            if (onSuccess) {
                onSuccess(result);
            }

            // Redirect đến PayOS checkout
            window.location.href = result.checkoutUrl;

        } catch (error: any) {
            console.error('Payment creation error:', error);

            showToast(
                "Lỗi thanh toán",
                error.message || 'Đã xảy ra lỗi khi tạo yêu cầu thanh toán',
                "error"
            );

            if (onError) {
                onError(error);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center">Thanh toán viện phí</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {recordId && (
                    <div className="space-y-2">
                        <Label htmlFor="recordId">Mã hồ sơ</Label>
                        <Input id="recordId" value={recordId} disabled />
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="amount">Số tiền thanh toán (VNĐ)</Label>
                    <Input
                        id="amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        placeholder="Nhập số tiền thanh toán"
                        disabled={isLoading || amount > 0}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Nội dung thanh toán</Label>
                    <Input
                        id="description"
                        value={description}
                        disabled
                    />
                </div>
            </CardContent>

            <CardFooter>
                <Button
                    className="w-full"
                    onClick={handlePayment}
                    disabled={isLoading || paymentAmount <= 0}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang xử lý...
                        </>
                    ) : (
                        'Thanh toán'
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
} 