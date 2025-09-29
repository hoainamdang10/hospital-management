import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// API phục hồi các thanh toán đã bị mất patient_id
export async function POST(request: NextRequest) {
    try {
        // Kiểm tra bảo mật - chỉ admin mới có thể chạy API này
        // (Tạm thời bỏ qua kiểm tra quyền cho môi trường phát triển)
        const isDevelopment = process.env.NODE_ENV === 'development';
        const supabase = await createClient();

        // Kiểm tra quyền truy cập (bỏ qua khi đang phát triển)
        if (!isDevelopment) {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: 'Unauthorized - Authentication required'
                }, { status: 401 });
            }

            // Kiểm tra quyền admin
            const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('role')
                .eq('user_id', user.id)
                .single();

            if (!userProfile || userProfile.role !== 'admin') {
                return NextResponse.json({
                    success: false,
                    error: 'Forbidden - Admin permission required'
                }, { status: 403 });
            }
        }

        console.log('🔍 [Payment Recovery] Starting recovery process for missing patient_id payments');

        // 1. Lấy danh sách các thanh toán thiếu patient_id
        const { data: missingPatientPayments, error: fetchError } = await supabase
            .from('payments')
            .select('*')
            .is('patient_id', null)
            .order('created_at', { ascending: false })
            .limit(100);

        if (fetchError) {
            console.error('❌ [Payment Recovery] Error fetching payments with missing patient_id:', fetchError);
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch payments with missing patient_id'
            }, { status: 500 });
        }

        console.log(`📋 [Payment Recovery] Found ${missingPatientPayments?.length || 0} payments with missing patient_id`);

        if (!missingPatientPayments || missingPatientPayments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No payments with missing patient_id found',
                data: { recovered: 0, total: 0 }
            });
        }

        // 2. Khôi phục từng thanh toán
        const results = [];
        let recoveredCount = 0;

        for (const payment of missingPatientPayments) {
            try {
                let patientId = null;
                let doctorId = null;
                let updateData: any = {};
                let recoverySource = null;

                // 2.1. Tìm kiếm trong medical_records nếu có record_id
                if (payment.record_id) {
                    const { data: recordData } = await supabase
                        .from('medical_records')
                        .select('patient_id, doctor_id')
                        .eq('record_id', payment.record_id)
                        .single();

                    if (recordData && recordData.patient_id) {
                        patientId = recordData.patient_id;
                        doctorId = recordData.doctor_id || null;
                        recoverySource = 'medical_records';
                    }
                }

                // 2.2. Tìm kiếm trong appointments nếu vẫn chưa có
                if (!patientId && payment.id) {
                    const { data: appointmentData } = await supabase
                        .from('appointments')
                        .select('patient_id, doctor_id')
                        .eq('payment_id', payment.id)
                        .single();

                    if (appointmentData && appointmentData.patient_id) {
                        patientId = appointmentData.patient_id;
                        doctorId = appointmentData.doctor_id || null;
                        recoverySource = 'appointments';
                    }
                }

                // 2.3. Tìm kiếm dựa vào mô tả thanh toán
                if (!patientId && payment.description) {
                    const patientMatch = payment.description.match(/patient_id:\s*([a-zA-Z0-9-]+)/i);
                    if (patientMatch && patientMatch[1]) {
                        patientId = patientMatch[1];
                        recoverySource = 'description';

                        // Kiểm tra xem patient_id có tồn tại trong database không
                        const { data: patientCheck } = await supabase
                            .from('patients')
                            .select('patient_id')
                            .eq('patient_id', patientId)
                            .single();

                        if (!patientCheck) {
                            patientId = null; // Reset nếu không tìm thấy
                            recoverySource = null;
                        }
                    }
                }

                // 2.4. Cập nhật thanh toán nếu tìm thấy patient_id
                if (patientId) {
                    updateData.patient_id = patientId;

                    if (doctorId) {
                        updateData.doctor_id = doctorId;

                        // Lấy thêm tên bác sĩ
                        try {
                            const { data: doctorData } = await supabase
                                .from('doctors')
                                .select('full_name')
                                .eq('doctor_id', doctorId)
                                .single();

                            if (doctorData) {
                                updateData.doctor_name = doctorData.full_name;
                            }
                        } catch (error) {
                            console.log(`⚠️ [Payment Recovery] Error fetching doctor name: ${error}`);
                        }
                    }

                    // Cập nhật thanh toán
                    const { error: updateError } = await supabase
                        .from('payments')
                        .update(updateData)
                        .eq('id', payment.id);

                    if (updateError) {
                        console.error(`❌ [Payment Recovery] Error updating payment ${payment.id}:`, updateError);
                        results.push({
                            id: payment.id,
                            order_code: payment.order_code,
                            status: 'error',
                            message: updateError.message
                        });
                    } else {
                        console.log(`✅ [Payment Recovery] Recovered payment ${payment.id} with patient_id ${patientId} from ${recoverySource}`);
                        recoveredCount++;
                        results.push({
                            id: payment.id,
                            order_code: payment.order_code,
                            status: 'recovered',
                            patient_id: patientId,
                            source: recoverySource
                        });
                    }
                } else {
                    console.log(`ℹ️ [Payment Recovery] Could not find patient_id for payment ${payment.id}`);
                    results.push({
                        id: payment.id,
                        order_code: payment.order_code,
                        status: 'not_found',
                        message: 'Could not find related patient_id'
                    });
                }

            } catch (error) {
                console.error(`❌ [Payment Recovery] Error processing payment ${payment.id}:`, error);
                results.push({
                    id: payment.id,
                    order_code: payment.order_code,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }

        console.log(`📊 [Payment Recovery] Completed: ${recoveredCount}/${missingPatientPayments.length} payments recovered`);

        return NextResponse.json({
            success: true,
            message: `Recovery completed: ${recoveredCount}/${missingPatientPayments.length} payments recovered`,
            data: {
                total: missingPatientPayments.length,
                recovered: recoveredCount,
                results: results
            }
        });

    } catch (error) {
        console.error('❌ [Payment Recovery] Error in recovery process:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint để kiểm tra số lượng thanh toán thiếu patient_id
export async function GET(request: NextRequest) {
    try {
        // Tạm thời bỏ qua kiểm tra quyền cho môi trường phát triển
        const isDevelopment = process.env.NODE_ENV === 'development';
        const supabase = await createClient();

        // Kiểm tra quyền truy cập (bỏ qua khi đang phát triển)
        if (!isDevelopment) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                return NextResponse.json({
                    success: false,
                    error: 'Unauthorized - Authentication required'
                }, { status: 401 });
            }
        }

        // Đếm số lượng thanh toán thiếu patient_id
        const { count, error } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .is('patient_id', null);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            message: 'Payment recovery endpoint is ready',
            timestamp: new Date().toISOString(),
            missing_count: count || 0
        });

    } catch (error) {
        console.error('❌ [Payment Recovery] Error checking missing payments:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 