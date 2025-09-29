"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const shared_1 = require("@hospital/shared");
class PaymentRepository {
    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase configuration is missing');
        }
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey);
        shared_1.logger.info('Payment Repository initialized with Supabase');
    }
    async createPayment(paymentData) {
        try {
            const paymentRecord = {
                order_code: paymentData.orderCode,
                appointment_id: paymentData.appointmentId,
                amount: paymentData.amount,
                description: paymentData.description,
                payment_method: paymentData.paymentMethod,
                status: paymentData.status,
                user_id: paymentData.userId,
                patient_info: paymentData.patientInfo ? JSON.stringify(paymentData.patientInfo) : null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await this.supabase
                .from('payments')
                .insert([paymentRecord])
                .select()
                .single();
            if (error) {
                shared_1.logger.error('Error creating payment record', { error, paymentData });
                throw error;
            }
            shared_1.logger.info('Payment record created successfully', {
                id: data.id,
                orderCode: paymentData.orderCode
            });
            return this.mapSupabasePaymentToPayment(data);
        }
        catch (error) {
            shared_1.logger.error('Error in createPayment', { error, paymentData });
            throw error;
        }
    }
    async updatePayment(id, updateData) {
        try {
            const updateRecord = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            const dbUpdateRecord = {
                status: updateRecord.status,
                transaction_id: updateRecord.transactionId,
                payment_link_id: updateRecord.paymentLinkId,
                checkout_url: updateRecord.checkoutUrl,
                qr_code: updateRecord.qrCode,
                paid_at: updateRecord.paidAt,
                cancel_reason: updateRecord.cancelReason,
                failure_reason: updateRecord.failureReason,
                updated_at: updateRecord.updated_at
            };
            Object.keys(dbUpdateRecord).forEach(key => {
                if (dbUpdateRecord[key] === undefined) {
                    delete dbUpdateRecord[key];
                }
            });
            const { data, error } = await this.supabase
                .from('payments')
                .update(dbUpdateRecord)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                shared_1.logger.error('Error updating payment record', { error, id, updateData });
                throw error;
            }
            shared_1.logger.info('Payment record updated successfully', {
                id,
                status: updateData.status
            });
            return this.mapSupabasePaymentToPayment(data);
        }
        catch (error) {
            shared_1.logger.error('Error in updatePayment', { error, id, updateData });
            throw error;
        }
    }
    async getPaymentByOrderCode(orderCode) {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .select('*')
                .eq('order_code', orderCode)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                shared_1.logger.error('Error getting payment by order code', { error, orderCode });
                throw error;
            }
            return this.mapSupabasePaymentToPayment(data);
        }
        catch (error) {
            shared_1.logger.error('Error in getPaymentByOrderCode', { error, orderCode });
            throw error;
        }
    }
    async getPaymentsByUserId(userId, page = 1, limit = 20, filters) {
        try {
            let query = this.supabase
                .from('payments')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (filters?.status && filters.status !== 'all') {
                query = query.eq('status', filters.status);
            }
            if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
                query = query.eq('payment_method', filters.paymentMethod);
            }
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
            const { data, error } = await query;
            if (error) {
                shared_1.logger.error('Error getting payments by user ID', { error, userId, filters });
                throw error;
            }
            return data?.map(this.mapSupabasePaymentToPayment) || [];
        }
        catch (error) {
            shared_1.logger.error('Error in getPaymentsByUserId', { error, userId, filters });
            throw error;
        }
    }
    async getPaymentReceiptById(paymentId, userId) {
        try {
            const { data, error } = await this.supabase
                .from('payment_receipts_view')
                .select('*')
                .eq('payment_id', paymentId)
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                shared_1.logger.error('Error getting payment receipt', { error, paymentId, userId });
                throw error;
            }
            return this.mapSupabaseReceiptToReceipt(data);
        }
        catch (error) {
            shared_1.logger.error('Error in getPaymentReceiptById', { error, paymentId, userId });
            throw error;
        }
    }
    async getPaymentStats(userId) {
        try {
            const { data, error } = await this.supabase
                .from('payments')
                .select('status, amount')
                .eq('user_id', userId);
            if (error) {
                shared_1.logger.error('Error getting payment stats', { error, userId });
                throw error;
            }
            const stats = {
                totalPayments: data.length,
                totalAmount: data.reduce((sum, payment) => sum + payment.amount, 0),
                successfulPayments: data.filter(p => p.status === 'success').length,
                pendingPayments: data.filter(p => p.status === 'pending').length
            };
            return stats;
        }
        catch (error) {
            shared_1.logger.error('Error in getPaymentStats', { error, userId });
            throw error;
        }
    }
    mapSupabasePaymentToPayment(data) {
        return {
            id: data.id,
            orderCode: data.order_code,
            appointmentId: data.appointment_id,
            amount: data.amount,
            description: data.description,
            paymentMethod: data.payment_method,
            status: data.status,
            userId: data.user_id,
            transactionId: data.transaction_id,
            paymentLinkId: data.payment_link_id,
            checkoutUrl: data.checkout_url,
            qrCode: data.qr_code,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            paidAt: data.paid_at,
            cancelReason: data.cancel_reason,
            failureReason: data.failure_reason
        };
    }
    mapSupabaseReceiptToReceipt(data) {
        return {
            id: data.payment_id,
            orderCode: data.order_code,
            amount: data.amount,
            status: data.status,
            paymentMethod: data.payment_method,
            transactionId: data.transaction_id,
            createdAt: data.created_at,
            appointmentId: data.appointment_id,
            description: data.description,
            patientName: data.patient_name,
            patientId: data.patient_id,
            patientPhone: data.patient_phone,
            patientEmail: data.patient_email,
            doctorName: data.doctor_name,
            doctorId: data.doctor_id,
            department: data.department,
            appointmentDate: data.appointment_date,
            timeSlot: data.time_slot,
            consultationFee: data.consultation_fee,
            serviceFee: data.service_fee,
            vat: data.vat,
            total: data.total,
            hospitalName: data.hospital_name || 'BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG',
            hospitalAddress: data.hospital_address || '123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh',
            hospitalPhone: data.hospital_phone || '028-1234-5678',
            hospitalTaxCode: data.hospital_tax_code || '0123456789'
        };
    }
}
exports.PaymentRepository = PaymentRepository;
//# sourceMappingURL=payment.repository.js.map