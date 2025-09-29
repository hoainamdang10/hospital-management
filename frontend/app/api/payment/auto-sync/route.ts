import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Auto-sync job chạy mỗi 30 giây để đồng bộ payments từ PayOS
export async function POST(request: NextRequest) {
    try {
        console.log('🔄 [Auto Sync] Starting automatic payment synchronization...');
        const startTime = Date.now();

        const supabase = await createClient();

        // 1. Lấy danh sách payments pending trong 48h qua (mở rộng thời gian tìm kiếm)
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const { data: pendingPayments, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .in('status', ['pending', 'processing'])
            .gte('created_at', twoDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(25); // Giới hạn 25 payments mỗi lần để tránh timeout

        if (fetchError) {
            console.error('❌ [Auto Sync] Error fetching pending payments:', fetchError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch pending payments'
            }, { status: 500 });
        }

        // Khởi tạo kết quả
        let updatedCount = 0;
        const results = [];

        // 2. Kiểm tra và cập nhật các thanh toán đang pending
        if (pendingPayments && pendingPayments.length > 0) {
            console.log(`📋 [Auto Sync] Found ${pendingPayments.length} pending payments to check`);

            // Kiểm tra từng payment với PayOS API
            for (const payment of pendingPayments) {
                try {
                    console.log(`🔍 [Auto Sync] Checking payment ${payment.order_code}...`);

                    // Gọi PayOS API để kiểm tra trạng thái
                    const payosStatus = await checkPayOSStatus(payment.order_code);

                    if (payosStatus && payosStatus.status === 'PAID') {
                        // Chuẩn bị dữ liệu cập nhật
                        const updateData: any = {
                            status: 'completed',
                            paid_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                            transaction_id: payosStatus.transactions?.[0]?.reference || `AUTO_SYNC_${payment.order_code}`
                        };

                        // Kiểm tra nếu thiếu patient_id nhưng có record_id
                        if (!payment.patient_id && payment.record_id) {
                            console.log(`🔍 [Auto Sync] Payment missing patient_id, checking record_id: ${payment.record_id}`);

                            // Lấy patient_id từ bảng medical_records
                            const { data: recordData, error: recordError } = await supabase
                                .from('medical_records')
                                .select('patient_id, doctor_id')
                                .eq('record_id', payment.record_id)
                                .single();

                            if (!recordError && recordData && recordData.patient_id) {
                                updateData.patient_id = recordData.patient_id;
                                console.log(`✅ [Auto Sync] Found patient_id ${recordData.patient_id} from record ${payment.record_id}`);

                                // Thêm doctor_id nếu có
                                if (recordData.doctor_id) {
                                    updateData.doctor_id = recordData.doctor_id;
                                }
                            } else {
                                console.log(`⚠️ [Auto Sync] Could not find patient_id from record: ${recordError?.message || 'No data'}`);
                            }
                        }

                        // Kiểm tra trong bảng appointments nếu vẫn chưa có patient_id
                        if (!updateData.patient_id && !payment.patient_id) {
                            try {
                                // Tìm kiếm trong bảng appointments dựa vào payment_id
                                const { data: appointmentData } = await supabase
                                    .from('appointments')
                                    .select('patient_id, doctor_id')
                                    .eq('payment_id', payment.id)
                                    .single();

                                if (appointmentData && appointmentData.patient_id) {
                                    updateData.patient_id = appointmentData.patient_id;
                                    console.log(`✅ [Auto Sync] Found patient_id ${appointmentData.patient_id} from appointment`);

                                    // Thêm doctor_id nếu có
                                    if (appointmentData.doctor_id) {
                                        updateData.doctor_id = appointmentData.doctor_id;
                                    }
                                }
                            } catch (error) {
                                console.log(`⚠️ [Auto Sync] Error checking appointments:`, error);
                            }
                        }

                        // Cập nhật trạng thái thành completed
                        const { error: updateError } = await supabase
                            .from('payments')
                            .update(updateData)
                            .eq('id', payment.id);

                        if (updateError) {
                            console.error(`❌ [Auto Sync] Error updating payment ${payment.order_code}:`, updateError);
                            results.push({
                                order_code: payment.order_code,
                                status: 'error',
                                message: updateError.message
                            });
                        } else {
                            console.log(`✅ [Auto Sync] Updated payment ${payment.order_code} to completed${updateData.patient_id ? ` with patient_id: ${updateData.patient_id}` : ''}`);
                            updatedCount++;
                            results.push({
                                order_code: payment.order_code,
                                status: 'updated',
                                message: 'Payment status updated to completed'
                            });
                        }
                    } else {
                        console.log(`ℹ️ [Auto Sync] Payment ${payment.order_code} still pending on PayOS`);
                        results.push({
                            order_code: payment.order_code,
                            status: 'unchanged',
                            message: 'Still pending on PayOS'
                        });
                    }

                    // Delay 300ms giữa các request để tránh rate limit
                    await new Promise(resolve => setTimeout(resolve, 300));

                } catch (error) {
                    console.error(`❌ [Auto Sync] Error checking payment ${payment.order_code}:`, error);
                    results.push({
                        order_code: payment.order_code,
                        status: 'error',
                        message: error instanceof Error ? error.message : 'Unknown error'
                    });
                }
            }
        } else {
            console.log('✅ [Auto Sync] No pending payments to sync');
        }

        // 3. CHỨC NĂNG MỚI: Tìm các thanh toán mới từ PayOS (chạy mỗi 10 lần)
        // Sử dụng PayOS API để lấy danh sách thanh toán gần đây và thêm vào database nếu chưa có
        try {
            // Chỉ chạy chức năng này mỗi 10 lần để tránh quá tải
            const shouldFetchNewPayments = Math.random() < 0.3; // 30% cơ hội chạy

            if (shouldFetchNewPayments) {
                console.log('🔍 [Auto Sync] Checking for new payments from PayOS...');

                // Lấy danh sách thanh toán mới nhất từ PayOS
                const recentPayments = await getRecentPayOSPayments();

                if (recentPayments && recentPayments.length > 0) {
                    console.log(`📋 [Auto Sync] Found ${recentPayments.length} recent payments from PayOS`);

                    let newPaymentsAdded = 0;

                    // Kiểm tra từng payment và thêm vào database nếu chưa có
                    for (const payosPayment of recentPayments) {
                        try {
                            const orderCode = payosPayment.orderCode.toString();

                            // Kiểm tra xem payment đã tồn tại trong database chưa
                            const { data: existingPayment, error: checkError } = await supabase
                                .from('payments')
                                .select('id')
                                .eq('order_code', orderCode)
                                .maybeSingle();

                            if (checkError) {
                                console.error(`❌ [Auto Sync] Error checking payment ${orderCode}:`, checkError);
                                continue;
                            }

                            // Nếu payment chưa tồn tại, thêm vào database
                            if (!existingPayment) {
                                // Trích xuất thông tin từ description nếu có
                                const description = payosPayment.description || '';

                                let patient_id = null;
                                let record_id = null;

                                // Trích xuất patient_id từ description
                                const patientMatch = description.match(/patient_id:\s*([a-zA-Z0-9-]+)/);
                                if (patientMatch && patientMatch[1]) {
                                    patient_id = patientMatch[1];
                                }

                                // Trích xuất record_id từ description
                                const recordMatch = description.match(/record_id:\s*([a-zA-Z0-9-]+)/);
                                if (recordMatch && recordMatch[1]) {
                                    record_id = recordMatch[1];
                                }

                                // Chuẩn bị dữ liệu cho payment mới
                                const newPayment = {
                                    order_code: orderCode,
                                    amount: payosPayment.amount,
                                    status: payosPayment.status === 'PAID' ? 'completed' :
                                        payosPayment.status === 'CANCELLED' ? 'failed' : 'pending',
                                    description: description,
                                    payment_method: 'payos',
                                    patient_id: patient_id,
                                    record_id: record_id,
                                    created_at: payosPayment.createdAt || new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                    paid_at: payosPayment.status === 'PAID' ?
                                        (payosPayment.transactions?.[0]?.transactionDateTime || new Date().toISOString()) : null,
                                    transaction_id: payosPayment.transactions?.[0]?.reference || null,
                                    payment_type: description.toLowerCase().includes('appointment') ? 'appointment' :
                                        description.toLowerCase().includes('record') ? 'medical_record' : 'other'
                                };

                                // Thêm payment mới vào database
                                const { data: newPaymentData, error: insertError } = await supabase
                                    .from('payments')
                                    .insert(newPayment)
                                    .select()
                                    .single();

                                if (insertError) {
                                    console.error(`❌ [Auto Sync] Error adding new payment ${orderCode}:`, insertError);
                                } else {
                                    console.log(`✅ [Auto Sync] Added new payment ${orderCode} to database`);
                                    newPaymentsAdded++;

                                    // Thêm vào kết quả
                                    results.push({
                                        order_code: orderCode,
                                        status: 'added',
                                        message: 'New payment added from PayOS'
                                    });
                                }
                            }

                            // Delay nhỏ giữa các request
                            await new Promise(resolve => setTimeout(resolve, 100));

                        } catch (error) {
                            console.error('❌ [Auto Sync] Error processing PayOS payment:', error);
                        }
                    }

                    if (newPaymentsAdded > 0) {
                        console.log(`✅ [Auto Sync] Added ${newPaymentsAdded} new payments from PayOS`);
                        updatedCount += newPaymentsAdded;
                    } else {
                        console.log('ℹ️ [Auto Sync] No new payments to add from PayOS');
                    }
                } else {
                    console.log('ℹ️ [Auto Sync] No recent payments found from PayOS');
                }
            }
        } catch (error) {
            console.error('❌ [Auto Sync] Error fetching new payments from PayOS:', error);
        }

        const duration = Date.now() - startTime;
        console.log(`📊 [Auto Sync] Completed: ${updatedCount} payments updated or added in ${duration}ms`);

        return NextResponse.json({
            success: true,
            message: `Auto sync completed: ${updatedCount} payments updated or added`,
            data: {
                checked: pendingPayments?.length || 0,
                updated: updatedCount,
                results: results,
                duration: duration
            }
        });

    } catch (error) {
        console.error('❌ [Auto Sync] Error in auto sync job:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Hàm kiểm tra trạng thái PayOS
async function checkPayOSStatus(orderCode: string) {
    try {
        const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
        const PAYOS_API_KEY = process.env.PAYOS_API_KEY!;
        const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY!;

        // Tạo signature cho PayOS API
        const currentTime = Math.floor(Date.now() / 1000);
        const signaturePayload = `GET&https://api-merchant.payos.vn/v2/payment-requests/${orderCode}&${currentTime}`;

        const signature = crypto
            .createHmac('sha256', PAYOS_CHECKSUM_KEY)
            .update(signaturePayload)
            .digest('hex');

        const response = await fetch(`https://api-merchant.payos.vn/v2/payment-requests/${orderCode}`, {
            method: 'GET',
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'x-partner-code': PAYOS_CLIENT_ID,
                'x-timestamp': currentTime.toString(),
                'x-signature': signature,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.log(`⚠️ PayOS API error for ${orderCode}: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();
        return data.data;

    } catch (error) {
        console.error(`❌ Error checking PayOS status for ${orderCode}:`, error);
        return null;
    }
}

// Hàm lấy danh sách thanh toán gần đây từ PayOS
async function getRecentPayOSPayments() {
    try {
        const PAYOS_CLIENT_ID = process.env.PAYOS_CLIENT_ID!;
        const PAYOS_API_KEY = process.env.PAYOS_API_KEY!;
        const PAYOS_CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY!;

        // Tạo timestamp và signature
        const currentTime = Math.floor(Date.now() / 1000);

        // Lấy danh sách thanh toán trong 48h qua
        const twoDaysAgo = new Date();
        twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

        // Tham số để lọc thanh toán
        const queryParams = new URLSearchParams({
            pageSize: '20', // Lấy 20 thanh toán mỗi lần
            page: '1',      // Trang đầu tiên
            fromDate: twoDaysAgo.toISOString(), // 48h trước
            toDate: new Date().toISOString()    // Hiện tại
        });

        const apiUrl = `https://api-merchant.payos.vn/v2/payment-requests?${queryParams.toString()}`;

        // Tạo signature cho request
        const signaturePayload = `GET&${apiUrl}&${currentTime}`;
        const signature = crypto
            .createHmac('sha256', PAYOS_CHECKSUM_KEY)
            .update(signaturePayload)
            .digest('hex');

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-client-id': PAYOS_CLIENT_ID,
                'x-api-key': PAYOS_API_KEY,
                'x-partner-code': PAYOS_CLIENT_ID,
                'x-timestamp': currentTime.toString(),
                'x-signature': signature,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`❌ PayOS payment list API error: ${response.status} ${response.statusText}`);
            return null;
        }

        const result = await response.json();

        // Kiểm tra kết quả
        if (result.error !== 0 || !result.data || !result.data.items) {
            console.error('❌ Invalid PayOS payment list response:', result.message || 'Unknown error');
            return null;
        }

        // Lọc các thanh toán có trạng thái PAID hoặc PENDING
        return result.data.items.filter((payment: any) =>
            payment.status === 'PAID' || payment.status === 'PENDING'
        );

    } catch (error) {
        console.error('❌ Error fetching recent PayOS payments:', error);
        return null;
    }
}

// GET method để kiểm tra trạng thái auto sync
export async function GET(request: NextRequest) {
    return NextResponse.json({
        success: true,
        message: 'Auto sync endpoint is ready',
        timestamp: new Date().toISOString(),
        info: 'This endpoint automatically syncs pending payments with PayOS every 30 seconds'
    });
}
