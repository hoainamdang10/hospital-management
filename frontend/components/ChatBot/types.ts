/**
 * ChatBot Context Types
 * Định nghĩa các loại context cho từng trang
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

// ==================== PAGE CONTEXTS ====================

/**
 * Context cho trang chờ thanh toán
 */
export interface PaymentPendingContext {
    invoiceId: string;
    invoiceNumber?: string;
    appointmentId: string;
    totalAmount: number;
    outstandingAmount: number;
    insuranceCoverage?: number;
    paymentStatus: 'pending' | 'paid' | 'cancelled' | 'expired';
    doctorName?: string;
    departmentName?: string;
    appointmentDate?: string;
    appointmentTime?: string;
    currency?: string;
}

/**
 * Context cho trang danh sách lịch hẹn
 */
export interface AppointmentsListContext {
    upcomingCount: number;
    todayCount: number;
    pendingPaymentCount: number;
    nextAppointment?: {
        id: string;
        doctorName: string;
        date: string;
        time: string;
        status: string;
    };
}

/**
 * Context cho trang chi tiết lịch hẹn
 */
export interface AppointmentDetailContext {
    appointmentId: string;
    doctorName: string;
    departmentName: string;
    date: string;
    time: string;
    status: string;
    reason?: string;
    location?: string;
    paymentStatus?: string;
}

/**
 * Context cho trang billing
 */
export interface BillingContext {
    totalInvoices: number;
    unpaidCount: number;
    totalUnpaidAmount: number;
    currency?: string;
}

/**
 * Context cho các trang khác (generic)
 */
export interface GenericContext {
    [key: string]: any;
}

// ==================== UNION TYPE ====================

/**
 * ChatContext union type
 * Mỗi page có context riêng với data type cụ thể
 */
export type ChatContext =
    | { page: '/patient/appointments/payment-pending'; data: PaymentPendingContext }
    | { page: '/patient/appointments'; data: AppointmentsListContext }
    | { page: '/patient/appointments/[id]'; data: AppointmentDetailContext }
    | { page: '/patient/billing'; data: BillingContext }
    | { page: string; data?: GenericContext };

// ==================== PROPS ====================

/**
 * Props cho ChatBot component
 */
export interface ChatBotProps {
    /** Context hiện tại của trang */
    context?: ChatContext;
    /** Callback khi user muốn thực hiện action */
    onAction?: (action: ChatBotAction) => void;
    /** Pre-fill message khi mở chatbot */
    initialMessage?: string;
}

/**
 * Action types mà chatbot có thể trigger
 */
export type ChatBotAction =
    | { type: 'navigate'; path: string }
    | { type: 'openPayment'; invoiceId: string }
    | { type: 'reschedule'; appointmentId: string }
    | { type: 'cancel'; appointmentId: string }
    | { type: 'contact'; target: 'hotline' | 'doctor' };

// ==================== MESSAGE TYPES ====================

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    /** Context khi message được gửi */
    context?: ChatContext;
}

// ==================== SUGGESTIONS ====================

export type SuggestionActionType = 'redirect' | 'openChat' | 'callFunction' | 'external';

export interface Suggestion {
    id: string;
    icon: string;
    label: string;
    description?: string;
    actionType: SuggestionActionType;
    /** URL cho redirect, message cho openChat, function name cho callFunction */
    target?: string;
    /** Màu sắc: primary, success, warning, danger, neutral */
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    /** Chỉ hiển thị khi điều kiện thỏa mãn */
    showWhen?: (context: any) => boolean;
}
