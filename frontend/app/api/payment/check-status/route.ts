import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';

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

        console.log(`🔍 [Check Payment Status] Checking order: ${orderCode}`);
        const supabase = await createClient();
        
        // Get current payment status from database
        const { data: dbPayment, error: dbError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (dbError && dbError.code !== 'PGRST116') {
            throw dbError;
        }

        console.log(`📊 [Check Payment Status] DB status: ${dbPayment?.status || 'NOT_FOUND'}`);

        // Get payment status from PayOS
        let payosStatus = null;
        try {
            const response = await axios.get(
                `${PAYOS_API_URL}/v2/payment-requests/${orderCode}`,
                {
                    headers: {
                        'x-client-id': PAYOS_CLIENT_ID,
                        'x-api-key': PAYOS_API_KEY,
                    },
                    timeout: 5000
                }
            );

            if (response.data && response.data.data) {
                payosStatus = response.data.data;
                console.log(`💳 [Check Payment Status] PayOS status: ${payosStatus.status}`);
            }
        } catch (payosError) {
            console.error('❌ [Check Payment Status] Error fetching from PayOS:', payosError);
        }

        // Update database if PayOS shows payment is completed but DB shows pending
        if (payosStatus && payosStatus.status === 'PAID' && dbPayment && dbPayment.status === 'pending') {
            console.log(`🔄 [Check Payment Status] Updating payment ${orderCode} to completed`);
            
            const { data: updatedPayment, error: updateError } = await supabase
                .from('payments')
                .update({
                    status: 'completed',
                    paid_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    transaction_id: payosStatus.transactions?.[0]?.reference || null
                })
                .eq('order_code', orderCode)
                .select()
                .single();

            if (!updateError) {
                console.log(`✅ [Check Payment Status] Updated payment ${orderCode} successfully`);
                return NextResponse.json({
                    success: true,
                    data: updatedPayment,
                    updated: true,
                    payos_status: payosStatus,
                    message: 'Payment status updated to completed'
                });
            } else {
                console.error(`❌ [Check Payment Status] Update failed:`, updateError);
            }
        }

        return NextResponse.json({
            success: true,
            data: dbPayment,
            updated: false,
            payos_status: payosStatus,
            message: dbPayment ? 'Payment found' : 'Payment not found'
        });

    } catch (error) {
        console.error('❌ [Check Payment Status] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
