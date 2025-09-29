import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        // Get order code from query params
        const { searchParams } = new URL(request.url);
        const orderCode = searchParams.get('orderCode');

        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: {
                    code: 'MISSING_ORDER_CODE',
                    message: 'Order code is required'
                }
            }, { status: 400 });
        }

        // In a real implementation, you would:
        // 1. Query your database for this order
        // 2. Call PayOS API to verify payment status
        // 3. Update local records based on PayOS response

        // For demo purposes, we'll mock a successful payment
        const mockPaymentData = {
            orderCode: orderCode,
            status: 'PAID',
            amount: 500000,
            doctorId: '1', // Hardcoded for demo purposes
            doctorName: 'Dr. Nguyễn Văn An', // In real implementation, this would come from your database
            recordId: '12345',
            paymentMethod: 'VNPAY',
            paidAt: new Date().toISOString(),
            appointmentDate: '28/06/2023',
            appointmentTime: '09:30'
        };

        return NextResponse.json({
            success: true,
            data: mockPaymentData
        });

    } catch (error: any) {
        console.error('Payment verification error:', error);

        return NextResponse.json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: error.message || 'Error verifying payment'
            }
        }, { status: 500 });
    }
} 