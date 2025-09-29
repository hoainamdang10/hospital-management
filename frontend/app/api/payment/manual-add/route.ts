import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const body = await request.json();
        
        const {
            amount,
            payment_method = 'ZaloPay',
            description = 'Thanh toán khám bệnh',
            doctor_id,
            doctor_name,
            record_id,
            transaction_id,
            paid_at
        } = body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return NextResponse.json({
                success: false,
                error: 'Số tiền thanh toán không hợp lệ'
            }, { status: 400 });
        }

        // Tạo order code duy nhất
        const orderCode = `MANUAL-${Date.now()}`;
        
        // Tạo payment record
        const paymentData = {
            order_code: orderCode,
            amount: amount,
            description: description,
            status: 'completed',
            payment_method: payment_method,
            record_id: record_id,
            doctor_id: doctor_id,
            doctor_name: doctor_name,
            transaction_id: transaction_id || `ZALOPAY-${Date.now()}`,
            paid_at: paid_at || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Adding manual payment:', paymentData);

        // Insert vào database
        const { data: payment, error: insertError } = await supabase
            .from('payments')
            .insert(paymentData)
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting manual payment:', insertError);
            return NextResponse.json({
                success: false,
                error: 'Không thể thêm thanh toán vào database',
                details: insertError
            }, { status: 500 });
        }

        // Nếu có record_id, cập nhật medical record
        if (record_id) {
            try {
                const { error: updateError } = await supabase
                    .from('medical_records')
                    .update({
                        payment_status: 'paid',
                        payment_amount: amount,
                        updated_at: new Date().toISOString()
                    })
                    .eq('record_id', record_id);

                if (updateError) {
                    console.error('Error updating medical record:', updateError);
                    // Không fail toàn bộ process
                }
            } catch (recordError) {
                console.error('Medical record update failed:', recordError);
                // Không fail toàn bộ process
            }
        }

        // Gửi email thông báo thanh toán thành công
        try {
            // Lấy thông tin bệnh nhân từ medical record
            if (record_id) {
                const { data: medicalRecord } = await supabase
                    .from('medical_records')
                    .select(`
                        *,
                        patients (
                            patient_id,
                            full_name,
                            profile:profiles!patients_profile_id_fkey (
                                id,
                                email,
                                phone_number
                            )
                        )
                    `)
                    .eq('record_id', record_id)
                    .single();

                if (medicalRecord?.patients?.profile?.email) {
                    const { EmailService } = await import('@/lib/services/email.service');

                    await EmailService.sendPaymentSuccessEmail({
                        patientName: medicalRecord.patients.full_name,
                        patientEmail: medicalRecord.patients.profile.email,
                        orderCode: orderCode,
                        amount: amount,
                        doctorName: doctor_name || 'Bác sĩ',
                        paymentDate: paid_at || new Date().toISOString(),
                        recordId: record_id
                    });

                    console.log('✅ [Manual Payment] Email notification sent successfully');
                }
            }
        } catch (emailError) {
            console.error('❌ [Manual Payment] Failed to send email notification:', emailError);
            // Không làm fail toàn bộ process nếu email lỗi
        }

        return NextResponse.json({
            success: true,
            message: 'Thanh toán đã được thêm thành công',
            data: {
                payment: payment,
                order_code: orderCode
            }
        });

    } catch (error: any) {
        console.error('Error adding manual payment:', error);
        return NextResponse.json({
            success: false,
            error: 'Lỗi server khi thêm thanh toán',
            details: error.message
        }, { status: 500 });
    }
}
