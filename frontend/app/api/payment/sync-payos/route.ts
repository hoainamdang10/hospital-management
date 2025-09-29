import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        
        const { orderCode, amount } = body;

        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Order code is required'
            }, { status: 400 });
        }

        console.log(`Syncing payment from PayOS for order: ${orderCode}`);

        // 1. Kiểm tra trạng thái từ PayOS API
        try {
            const payosResponse = await axios.get(
                `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                    }
                }
            );

            console.log('PayOS API response:', payosResponse.data);

            const payosData = payosResponse.data.data;
            
            if (!payosData) {
                return NextResponse.json({
                    success: false,
                    error: 'Payment not found in PayOS'
                }, { status: 404 });
            }

            // 2. Kiểm tra xem payment đã tồn tại trong database chưa
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('*')
                .eq('order_code', orderCode.toString())
                .single();

            const paymentData = {
                order_code: orderCode.toString(),
                amount: payosData.amount || amount,
                description: payosData.description || 'Thanh toán khám bệnh',
                status: payosData.status === 'PAID' ? 'completed' : 'pending',
                payment_method: 'PayOS',
                transaction_id: payosData.id || payosData.paymentLinkId,
                paid_at: payosData.status === 'PAID' ? new Date().toISOString() : null,
                updated_at: new Date().toISOString()
            };

            if (existingPayment) {
                // 3. Cập nhật payment hiện có
                const { data: updatedPayment, error: updateError } = await supabase
                    .from('payments')
                    .update(paymentData)
                    .eq('order_code', orderCode.toString())
                    .select()
                    .single();

                if (updateError) {
                    console.error('Error updating payment:', updateError);
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to update payment in database'
                    }, { status: 500 });
                }

                console.log('Payment updated successfully:', updatedPayment);

                return NextResponse.json({
                    success: true,
                    message: 'Payment synced and updated successfully',
                    data: {
                        payment: updatedPayment,
                        payos_status: payosData.status,
                        action: 'updated'
                    }
                });

            } else {
                // 4. Tạo payment mới
                const { data: newPayment, error: insertError } = await supabase
                    .from('payments')
                    .insert({
                        ...paymentData,
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Error creating payment:', insertError);
                    return NextResponse.json({
                        success: false,
                        error: 'Failed to create payment in database'
                    }, { status: 500 });
                }

                console.log('Payment created successfully:', newPayment);

                return NextResponse.json({
                    success: true,
                    message: 'Payment synced and created successfully',
                    data: {
                        payment: newPayment,
                        payos_status: payosData.status,
                        action: 'created'
                    }
                });
            }

        } catch (payosError: any) {
            console.error('Error calling PayOS API:', payosError.response?.data || payosError.message);
            
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment from PayOS',
                details: payosError.response?.data || payosError.message
            }, { status: 502 });
        }

    } catch (error: any) {
        console.error('Error syncing payment:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}

// GET method để lấy danh sách payments cần sync
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        // Lấy các payments có status pending hoặc failed trong 24h qua
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const { data: pendingPayments, error } = await supabase
            .from('payments')
            .select('*')
            .in('status', ['pending', 'failed'])
            .gte('created_at', yesterday.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch pending payments'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                pending_payments: pendingPayments || [],
                count: pendingPayments?.length || 0
            }
        });

    } catch (error: any) {
        console.error('Error fetching pending payments:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
