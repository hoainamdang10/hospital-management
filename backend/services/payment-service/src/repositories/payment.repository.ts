import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logger } from "../utils/logger";

export interface CreatePaymentRequest {
  orderCode: string;
  appointmentId: string;
  amount: number;
  description: string;
  paymentMethod: "payos" | "cash";
  status: "pending" | "success" | "failed" | "cancelled";
  userId: string;
  patientInfo?: {
    doctorName: string;
    department: string;
    appointmentDate: string;
    timeSlot: string;
  };
}

export interface UpdatePaymentRequest {
  status?: "pending" | "success" | "failed" | "cancelled";
  transactionId?: string;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  paidAt?: string;
  cancelReason?: string;
  failureReason?: string;
}

export interface Payment {
  id: string;
  orderCode: string;
  appointmentId: string;
  amount: number;
  description: string;
  paymentMethod: "payos" | "cash";
  status: "pending" | "success" | "failed" | "cancelled";
  userId: string;
  transactionId?: string;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  cancelReason?: string;
  failureReason?: string;
}

export interface PaymentReceipt {
  id: string;
  orderCode: string;
  amount: number;
  status: string;
  paymentMethod: "payos" | "cash";
  transactionId?: string;
  createdAt: string;
  appointmentId: string;
  description: string;

  // Patient Info
  patientName: string;
  patientId: string;
  patientPhone: string;
  patientEmail: string;

  // Appointment Info
  doctorName: string;
  doctorId: string;
  department: string;
  appointmentDate: string;
  timeSlot: string;

  // Billing Details
  consultationFee: number;
  serviceFee: number;
  vat: number;
  total: number;

  // Hospital Info
  hospitalName: string;
  hospitalAddress: string;
  hospitalPhone: string;
  hospitalTaxCode: string;
}

export class PaymentRepository {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration is missing");
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    logger.info("Payment Repository initialized with Supabase");
  }

  /**
   * Create a new payment record
   */
  async createPayment(paymentData: CreatePaymentRequest): Promise<Payment> {
    try {
      const paymentRecord = {
        order_code: paymentData.orderCode,
        appointment_id: paymentData.appointmentId,
        amount: paymentData.amount,
        description: paymentData.description,
        payment_method: paymentData.paymentMethod,
        status: paymentData.status,
        user_id: paymentData.userId,
        patient_info: paymentData.patientInfo
          ? JSON.stringify(paymentData.patientInfo)
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from("payments")
        .insert([paymentRecord])
        .select()
        .single();

      if (error) {
        logger.error("Error creating payment record", { error, paymentData });
        throw error;
      }

      logger.info("Payment record created successfully", {
        id: data.id,
        orderCode: paymentData.orderCode,
      });

      return this.mapSupabasePaymentToPayment(data);
    } catch (error) {
      logger.error("Error in createPayment", { error, paymentData });
      throw error;
    }
  }

  /**
   * Update payment record
   */
  async updatePayment(
    id: string,
    updateData: UpdatePaymentRequest
  ): Promise<Payment> {
    try {
      const updateRecord = {
        ...updateData,
        updated_at: new Date().toISOString(),
      };

      // Convert camelCase to snake_case for database
      const dbUpdateRecord = {
        status: updateRecord.status,
        transaction_id: updateRecord.transactionId,
        payment_link_id: updateRecord.paymentLinkId,
        checkout_url: updateRecord.checkoutUrl,
        qr_code: updateRecord.qrCode,
        paid_at: updateRecord.paidAt,
        cancel_reason: updateRecord.cancelReason,
        failure_reason: updateRecord.failureReason,
        updated_at: updateRecord.updated_at,
      };

      // Remove undefined values
      Object.keys(dbUpdateRecord).forEach((key) => {
        if ((dbUpdateRecord as any)[key] === undefined) {
          delete (dbUpdateRecord as any)[key];
        }
      });

      const { data, error } = await this.supabase
        .from("payments")
        .update(dbUpdateRecord)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        logger.error("Error updating payment record", {
          error,
          id,
          updateData,
        });
        throw error;
      }

      logger.info("Payment record updated successfully", {
        id,
        status: updateData.status,
      });

      return this.mapSupabasePaymentToPayment(data);
    } catch (error) {
      logger.error("Error in updatePayment", { error, id, updateData });
      throw error;
    }
  }

  /**
   * Get payment by order code
   */
  async getPaymentByOrderCode(orderCode: string): Promise<Payment | null> {
    try {
      const { data, error } = await this.supabase
        .from("payments")
        .select("*")
        .eq("order_code", orderCode)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows found
        }
        logger.error("Error getting payment by order code", {
          error,
          orderCode,
        });
        throw error;
      }

      return this.mapSupabasePaymentToPayment(data);
    } catch (error) {
      logger.error("Error in getPaymentByOrderCode", { error, orderCode });
      throw error;
    }
  }

  /**
   * Get payments by user ID with pagination and filters
   */
  async getPaymentsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { status?: string; paymentMethod?: string }
  ): Promise<Payment[]> {
    try {
      let query = this.supabase
        .from("payments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.paymentMethod && filters.paymentMethod !== "all") {
        query = query.eq("payment_method", filters.paymentMethod);
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        logger.error("Error getting payments by user ID", {
          error,
          userId,
          filters,
        });
        throw error;
      }

      return data?.map(this.mapSupabasePaymentToPayment) || [];
    } catch (error) {
      logger.error("Error in getPaymentsByUserId", { error, userId, filters });
      throw error;
    }
  }

  /**
   * Get payment receipt with detailed information
   */
  async getPaymentReceiptById(
    paymentId: string,
    userId: string
  ): Promise<PaymentReceipt | null> {
    try {
      const { data, error } = await this.supabase
        .from("payment_receipts_view")
        .select("*")
        .eq("payment_id", paymentId)
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // No rows found
        }
        logger.error("Error getting payment receipt", {
          error,
          paymentId,
          userId,
        });
        throw error;
      }

      return this.mapSupabaseReceiptToReceipt(data);
    } catch (error) {
      logger.error("Error in getPaymentReceiptById", {
        error,
        paymentId,
        userId,
      });
      throw error;
    }
  }

  /**
   * Get payment statistics for user
   */
  async getPaymentStats(userId: string): Promise<{
    totalPayments: number;
    totalAmount: number;
    successfulPayments: number;
    pendingPayments: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from("payments")
        .select("status, amount")
        .eq("user_id", userId);

      if (error) {
        logger.error("Error getting payment stats", { error, userId });
        throw error;
      }

      const stats = {
        totalPayments: data.length,
        totalAmount: data.reduce((sum, payment) => sum + payment.amount, 0),
        successfulPayments: data.filter((p) => p.status === "success").length,
        pendingPayments: data.filter((p) => p.status === "pending").length,
      };

      return stats;
    } catch (error) {
      logger.error("Error in getPaymentStats", { error, userId });
      throw error;
    }
  }

  /**
   * Map Supabase payment record to Payment interface
   */
  private mapSupabasePaymentToPayment(data: any): Payment {
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
      failureReason: data.failure_reason,
    };
  }

  /**
   * Map Supabase receipt record to PaymentReceipt interface
   */
  private mapSupabaseReceiptToReceipt(data: any): PaymentReceipt {
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

      // Patient Info
      patientName: data.patient_name,
      patientId: data.patient_id,
      patientPhone: data.patient_phone,
      patientEmail: data.patient_email,

      // Appointment Info
      doctorName: data.doctor_name,
      doctorId: data.doctor_id,
      department: data.department,
      appointmentDate: data.appointment_date,
      timeSlot: data.time_slot,

      // Billing Details
      consultationFee: data.consultation_fee,
      serviceFee: data.service_fee,
      vat: data.vat,
      total: data.total,

      // Hospital Info
      hospitalName: data.hospital_name || "BỆNH VIỆN ĐA KHOA TRUNG ƯƠNG",
      hospitalAddress:
        data.hospital_address || "123 Đường ABC, Quận XYZ, TP. Hồ Chí Minh",
      hospitalPhone: data.hospital_phone || "028-1234-5678",
      hospitalTaxCode: data.hospital_tax_code || "0123456789",
    };
  }
}
