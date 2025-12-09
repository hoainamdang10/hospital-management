/**
 * SmartSuggestions Configuration
 * Config-driven suggestions cho từng trang
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

import type { Suggestion } from './types';

/**
 * Suggestions configuration theo từng page
 * Dễ dàng thêm/bớt/sửa mà không cần đụng vào logic
 */
export const SUGGESTIONS_CONFIG: Record<string, Suggestion[]> = {
    // ==================== PAYMENT PENDING ====================
    '/patient/appointments/payment-pending': [
        {
            id: 'pay-now',
            icon: '💳',
            label: 'Thanh toán ngay',
            description: 'VNPay hoặc Ví',
            actionType: 'callFunction',
            target: 'scrollToPayment',
            variant: 'primary',
        },
        {
            id: 'change-slot',
            icon: '🔄',
            label: 'Đổi lịch khám',
            description: 'Chọn ngày/giờ khác',
            actionType: 'openChat',
            target: 'Tôi muốn đổi lịch khám này sang ngày khác',
            variant: 'neutral',
        },
        {
            id: 'cancel-appointment',
            icon: '❌',
            label: 'Hủy lịch hẹn',
            description: 'Hủy và hoàn tiền',
            actionType: 'openChat',
            target: 'Tôi muốn hủy lịch hẹn này, làm sao để hoàn tiền?',
            variant: 'danger',
        },
        {
            id: 'ask-ai',
            icon: '💬',
            label: 'Hỏi AI Assistant',
            description: 'Giải đáp thắc mắc',
            actionType: 'openChat',
            target: 'Tôi cần hỗ trợ về hóa đơn đang chờ thanh toán này',
            variant: 'neutral',
        },
    ],

    // ==================== APPOINTMENTS LIST ====================
    '/patient/appointments': [
        {
            id: 'book-new',
            icon: '➕',
            label: 'Đặt lịch mới',
            description: 'Đặt lịch khám bệnh',
            actionType: 'redirect',
            target: '/patient/appointments/book',
            variant: 'primary',
        },
        {
            id: 'view-upcoming',
            icon: '📅',
            label: 'Lịch sắp tới',
            description: 'Xem lịch hẹn gần nhất',
            actionType: 'callFunction',
            target: 'filterUpcoming',
            variant: 'neutral',
        },
        {
            id: 'view-history',
            icon: '📜',
            label: 'Lịch sử khám',
            description: 'Xem các lần khám trước',
            actionType: 'callFunction',
            target: 'filterHistory',
            variant: 'neutral',
        },
        {
            id: 'ask-ai',
            icon: '💬',
            label: 'Hỏi AI',
            description: 'Tìm bác sĩ, đặt lịch',
            actionType: 'openChat',
            target: 'Tôi muốn tìm bác sĩ phù hợp để đặt lịch khám',
            variant: 'neutral',
        },
    ],

    // ==================== APPOINTMENT DETAIL ====================
    '/patient/appointments/[id]': [
        {
            id: 'view-doctor',
            icon: '👨‍⚕️',
            label: 'Thông tin bác sĩ',
            description: 'Xem hồ sơ bác sĩ',
            actionType: 'openChat',
            target: 'Cho tôi biết thêm về bác sĩ này',
            variant: 'neutral',
        },
        {
            id: 'prepare-visit',
            icon: '📋',
            label: 'Chuẩn bị khám',
            description: 'Hướng dẫn trước khám',
            actionType: 'openChat',
            target: 'Tôi cần chuẩn bị gì trước khi đến khám?',
            variant: 'primary',
        },
        {
            id: 'reschedule',
            icon: '🔄',
            label: 'Đổi lịch',
            description: 'Chọn ngày/giờ khác',
            actionType: 'openChat',
            target: 'Tôi muốn đổi lịch hẹn này',
            variant: 'neutral',
        },
        {
            id: 'ask-ai',
            icon: '💬',
            label: 'Hỏi AI',
            description: 'Giải đáp thắc mắc',
            actionType: 'openChat',
            target: 'Tôi có câu hỏi về lịch hẹn này',
            variant: 'neutral',
        },
    ],

    // ==================== BILLING ====================
    '/patient/billing': [
        {
            id: 'pay-unpaid',
            icon: '💳',
            label: 'Thanh toán',
            description: 'Thanh toán hóa đơn',
            actionType: 'callFunction',
            target: 'payFirstUnpaid',
            variant: 'primary',
            showWhen: (ctx) => ctx?.unpaidCount > 0,
        },
        {
            id: 'view-insurance',
            icon: '🛡️',
            label: 'Bảo hiểm',
            description: 'Thông tin bảo hiểm y tế',
            actionType: 'openChat',
            target: 'Bảo hiểm của tôi chi trả được bao nhiêu phần trăm?',
            variant: 'neutral',
        },
        {
            id: 'export-invoice',
            icon: '📄',
            label: 'Xuất hóa đơn',
            description: 'Tải PDF hóa đơn',
            actionType: 'callFunction',
            target: 'exportInvoice',
            variant: 'neutral',
        },
        {
            id: 'ask-ai',
            icon: '💬',
            label: 'Hỏi AI',
            description: 'Giải đáp về thanh toán',
            actionType: 'openChat',
            target: 'Giải thích chi tiết hóa đơn cho tôi',
            variant: 'neutral',
        },
    ],

    // ==================== PATIENT DASHBOARD ====================
    '/patient/dashboard': [
        {
            id: 'book-appointment',
            icon: '📅',
            label: 'Đặt lịch khám',
            description: 'Đặt lịch hẹn mới',
            actionType: 'redirect',
            target: '/patient/appointments/book',
            variant: 'primary',
        },
        {
            id: 'find-doctor',
            icon: '🔍',
            label: 'Tìm bác sĩ',
            description: 'Tìm theo chuyên khoa',
            actionType: 'openChat',
            target: 'Tôi muốn tìm bác sĩ',
            variant: 'neutral',
        },
        {
            id: 'view-appointments',
            icon: '📋',
            label: 'Lịch hẹn',
            description: 'Xem lịch hẹn của tôi',
            actionType: 'redirect',
            target: '/patient/appointments',
            variant: 'neutral',
        },
        {
            id: 'ask-ai',
            icon: '💬',
            label: 'Hỏi AI',
            description: 'Tư vấn sức khỏe',
            actionType: 'openChat',
            target: 'Xin chào, tôi cần tư vấn',
            variant: 'neutral',
        },
    ],
};

/**
 * Lấy suggestions cho một trang cụ thể
 * 
 * @param pagePath - Đường dẫn trang (e.g., '/patient/appointments/payment-pending')
 * @param contextData - Dữ liệu context để filter suggestions
 * @returns Danh sách suggestions phù hợp
 */
export function getSuggestionsForPage(
    pagePath: string,
    contextData?: Record<string, any>
): Suggestion[] {
    // Match exact path first
    let suggestions = SUGGESTIONS_CONFIG[pagePath];

    // Try to match pattern (e.g., '/patient/appointments/[id]')
    if (!suggestions) {
        // Check if path matches /patient/appointments/[uuid] pattern
        if (/^\/patient\/appointments\/[a-f0-9-]+$/i.test(pagePath)) {
            suggestions = SUGGESTIONS_CONFIG['/patient/appointments/[id]'];
        }
    }

    // Fallback to dashboard suggestions
    if (!suggestions) {
        suggestions = SUGGESTIONS_CONFIG['/patient/dashboard'] || [];
    }

    // Filter by showWhen condition
    return suggestions.filter((s) => {
        if (s.showWhen && contextData) {
            return s.showWhen(contextData);
        }
        return true;
    });
}

/**
 * Default suggestions khi không xác định được trang
 */
export const DEFAULT_SUGGESTIONS: Suggestion[] = [
    {
        id: 'book-appointment',
        icon: '📅',
        label: 'Đặt lịch khám',
        actionType: 'redirect',
        target: '/patient/appointments/book',
        variant: 'primary',
    },
    {
        id: 'ask-ai',
        icon: '💬',
        label: 'Hỏi AI Assistant',
        actionType: 'openChat',
        target: 'Xin chào, tôi cần hỗ trợ',
        variant: 'neutral',
    },
];
