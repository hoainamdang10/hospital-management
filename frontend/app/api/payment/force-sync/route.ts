import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import axios from 'axios';

const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID;
const PAYOS_API_KEY = process.env.PAYOS_API_KEY;
const PAYOS_API_URL = process.env.PAYOS_API_URL || 'https://api-merchant.payos.vn';

export async function POST(request: NextRequest) {
    try {
        const { orderCode } = await request.json();
        
        if (!orderCode) {
            return NextResponse.json({
                success: false,
                error: 'Order code is required'
            }, { status: 400 });
        }

        console.log(`🔄 [Force Sync] Starting sync for order: ${orderCode}`);
        const supabase = await createClient();
        
        // Get current payment from database
        const { data: dbPayment, error: dbError } = await supabase
            .from('payments')
            .select('*')
            .eq('order_code', orderCode)
            .single();

        if (dbError && dbError.code !== 'PGRST116') {
            throw dbError;
        }

        if (!dbPayment) {
            return NextResponse.json({
                success: false,
                error: 'Payment not found in database'
            }, { status: 404 });
        }

        console.log(`📊 [Force Sync] Current DB status: ${dbPayment.status}`);

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
                    timeout: 10000
                }
            );

            if (response.data && response.data.data) {
                payosStatus = response.data.data;
                console.log(`💳 [Force Sync] PayOS status: ${payosStatus.status}`);
            }
        } catch (payosError) {
            console.error('❌ [Force Sync] Error fetching from PayOS:', payosError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payment status from PayOS'
            }, { status: 500 });
        }

        // Update database if PayOS shows payment is completed
        if (payosStatus && payosStatus.status === 'PAID' && dbPayment.status !== 'completed') {
            console.log(`🔄 [Force Sync] Updating payment ${orderCode} to completed`);
            
            const updateData = {
                status: 'completed',
                paid_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                transaction_id: payosStatus.transactions?.[0]?.reference || null,
                payos_sync_at: new Date().toISOString(),
                payos_status: payosStatus.status
            };

            const { data: updatedPayment, error: updateError } = await supabase
                .from('payments')
                .update(updateData)
                .eq('order_code', orderCode)
                .select()
                .single();

            if (updateError) {
                console.error(`❌ [Force Sync] Update failed:`, updateError);
                return NextResponse.json({
                    success: false,
                    error: 'Failed to update payment status'
                }, { status: 500 });
            }

            console.log(`✅ [Force Sync] Payment ${orderCode} updated successfully`);
            return NextResponse.json({
                success: true,
                updated: true,
                data: updatedPayment,
                payos_status: payosStatus,
                message: 'Payment status synchronized successfully'
            });
        }

        // No update needed
        return NextResponse.json({
            success: true,
            updated: false,
            data: dbPayment,
            payos_status: payosStatus,
            message: 'Payment status already up to date'
        });

    } catch (error) {
        console.error('❌ [Force Sync] Error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
