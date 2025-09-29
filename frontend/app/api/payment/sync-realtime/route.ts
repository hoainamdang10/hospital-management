import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';
const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;

interface PayOSTransaction {
    reference: string;
    amount: number;
    accountNumber: string;
    description: string;
    transactionDateTime: string;
    virtualAccountName: string;
    virtualAccountNumber: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
}

interface PayOSPaymentData {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
    createdAt: string;
    transactions: PayOSTransaction[];
    description?: string;
    paymentLinkId?: string;
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        
        const { orderCode } = body;

        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Order code is required'
            }, { status: 400 });
        }

        console.log(`🔄 Real-time sync for payment: ${orderCode}`);

        // 1. Lấy thông tin từ PayOS API
        let payosData: PayOSPaymentData | null = null;
        try {
            const payosResponse = await axios.get(
                `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                    },
                    timeout: 10000
                }
            );

            console.log('PayOS API response:', payosResponse.data);
            payosData = payosResponse.data.data;
        } catch (payosError: any) {
            console.error('PayOS API error:', payosError.response?.data || payosError.message);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch from PayOS API',
                details: payosError.response?.data || payosError.message
            }, { status: 500 });
        }

        if (!payosData) {
            return NextResponse.json({
                success: false,
                error: 'Payment not found in PayOS'
            }, { status: 404 });
        }

        // 2. Kiểm tra payment trong database
        const { data: existingPayment, error: findError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode.toString())
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error('Database error:', findError);
            return NextResponse.json({
                success: false,
                error: 'Database error'
            }, { status: 500 });
        }

        // 3. Chuẩn bị dữ liệu cập nhật với thông tin PayOS chi tiết
        const updateData = {
            status: payosData.status === 'PAID' ? 'completed' : 
                   payosData.status === 'CANCELLED' ? 'failed' : 'pending',
            amount: payosData.amount,
            description: payosData.description || `Thanh toán PayOS - ${orderCode}`,
            transaction_id: payosData.id,
            payment_link_id: payosData.paymentLinkId,
            paid_at: payosData.status === 'PAID' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
            payos_sync_at: new Date().toISOString(),
            payos_status: payosData.status,
            payos_amount_paid: payosData.amountPaid,
            payos_amount_remaining: payosData.amountRemaining,
            payos_created_at: payosData.createdAt
        };

        // 4. Thêm thông tin transaction nếu có
        if (payosData.transactions && payosData.transactions.length > 0) {
            const latestTransaction = payosData.transactions[0];
            updateData.transaction_id = latestTransaction.reference;
            updateData.paid_at = latestTransaction.transactionDateTime;
            
            // Thêm thông tin ngân hàng vào description
            updateData.description = `${updateData.description} - ${latestTransaction.counterAccountBankName} (${latestTransaction.counterAccountNumber})`;
        }

        let result;
        if (existingPayment) {
            // Cập nhật payment hiện có
            const { data, error } = await supabase
                .from('payments')
                .update(updateData)
                .eq('id', existingPayment.id)
                .select()
                .single();

            if (error) {
                console.error('Update error:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to update payment'
                }, { status: 500 });
            }

            result = {
                success: true,
                action: 'updated',
                data: data,
                payos_data: payosData
            };
        } else {
            // Try to get patient_id from medical record if record_id exists
            let patientId = null;
            if (updateData.record_id) {
                const { data: recordData } = await supabase
                    .from('medical_records')
                    .select('patient_id')
                    .eq('record_id', updateData.record_id)
                    .single();

                if (recordData) {
                    patientId = recordData.patient_id;
                }
            }

            // Tạo payment mới
            const newPayment = {
                order_code: orderCode.toString(),
                payment_method: 'PayOS',
                doctor_id: 'DOC000001',
                doctor_name: 'Bác sĩ hệ thống',
                patient_id: patientId, // Use extracted patient_id or null
                ...updateData
            };

            const { data, error } = await supabase
                .from('payments')
                .insert(newPayment)
                .select()
                .single();

            if (error) {
                console.error('Insert error:', error);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to create payment'
                }, { status: 500 });
            }

            result = {
                success: true,
                action: 'created',
                data: data,
                payos_data: payosData
            };
        }

        console.log(`✅ Payment ${result.action} successfully:`, result.data.order_code);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Real-time sync error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET method để lấy trạng thái đồng bộ
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderCode = searchParams.get('orderCode');

        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Order code is required'
            }, { status: 400 });
        }

        const supabase = await createClient();
        
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (error) {
            return NextResponse.json({
                success: false,
                error: 'Payment not found'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: payment,
            sync_status: {
                last_sync: payment.payos_sync_at,
                payos_status: payment.payos_status,
                is_synced: !!payment.transaction_id
            }
        });

    } catch (error) {
        console.error('Get sync status error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
