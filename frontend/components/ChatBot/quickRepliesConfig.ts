/**
 * Quick Replies Configuration
 * Cấu hình các gợi ý follow-up sau khi AI trả lời
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 */

export interface QuickReply {
    id: string;
    label: string;
    message: string;
    icon?: string;
}

/**
 * Các pattern để detect loại response từ AI
 */
const RESPONSE_PATTERNS = {
    doctorList: [
        /tìm thấy \d+ bác sĩ/i,
        /danh sách bác sĩ/i,
        /bác sĩ phù hợp/i,
        /có \d+ bác sĩ/i,
    ],
    slotList: [
        /khung giờ trống/i,
        /slot trống/i,
        /lịch trống/i,
        /giờ có thể đặt/i,
    ],
    appointmentInfo: [
        /lịch hẹn của bạn/i,
        /thông tin lịch hẹn/i,
        /chi tiết lịch hẹn/i,
    ],
    paymentInfo: [
        /hóa đơn/i,
        /thanh toán/i,
        /chờ thanh toán/i,
        /số tiền/i,
    ],
    departmentInfo: [
        /khoa/i,
        /chuyên khoa/i,
        /có \d+ bác sĩ đang làm việc/i,
    ],
    greeting: [
        /xin chào/i,
        /chào bạn/i,
        /tôi có thể giúp/i,
    ],
    error: [
        /lỗi/i,
        /không tìm thấy/i,
        /không có/i,
        /thử lại/i,
    ],
};

/**
 * Quick replies cho từng loại response
 */
const QUICK_REPLIES_CONFIG: Record<string, QuickReply[]> = {
    doctorList: [
        {
            id: 'view-slots',
            label: 'Xem lịch trống',
            message: 'Cho tôi xem lịch trống của bác sĩ này',
            icon: '📅',
        },
        {
            id: 'doctor-info',
            label: 'Thông tin bác sĩ',
            message: 'Cho tôi biết thêm về bác sĩ này',
            icon: '👨‍⚕️',
        },
        {
            id: 'other-doctors',
            label: 'Tìm bác sĩ khác',
            message: 'Cho tôi xem thêm bác sĩ khác',
            icon: '🔍',
        },
    ],
    slotList: [
        {
            id: 'book-appointment',
            label: 'Đặt lịch khám',
            message: 'Hướng dẫn tôi đặt lịch',
            icon: '✅',
        },
        {
            id: 'other-date',
            label: 'Xem ngày khác',
            message: 'Cho tôi xem lịch trống ngày mai',
            icon: '📆',
        },
        {
            id: 'other-doctor',
            label: 'Bác sĩ khác',
            message: 'Tìm bác sĩ khác cùng chuyên khoa',
            icon: '👨‍⚕️',
        },
    ],
    appointmentInfo: [
        {
            id: 'prepare-visit',
            label: 'Chuẩn bị khám',
            message: 'Tôi cần chuẩn bị gì trước khi khám?',
            icon: '📋',
        },
        {
            id: 'doctor-info',
            label: 'Về bác sĩ',
            message: 'Cho tôi biết thêm về bác sĩ',
            icon: '👨‍⚕️',
        },
        {
            id: 'reschedule',
            label: 'Đổi lịch',
            message: 'Tôi muốn đổi lịch hẹn',
            icon: '🔄',
        },
    ],
    paymentInfo: [
        {
            id: 'how-to-pay',
            label: 'Cách thanh toán',
            message: 'Hướng dẫn tôi thanh toán',
            icon: '💳',
        },
        {
            id: 'insurance',
            label: 'Về bảo hiểm',
            message: 'Bảo hiểm của tôi chi trả bao nhiêu?',
            icon: '🛡️',
        },
        {
            id: 'invoice-detail',
            label: 'Chi tiết hóa đơn',
            message: 'Giải thích chi tiết hóa đơn cho tôi',
            icon: '📄',
        },
    ],
    departmentInfo: [
        {
            id: 'find-doctor',
            label: 'Tìm bác sĩ',
            message: 'Tìm bác sĩ trong khoa này',
            icon: '🔍',
        },
        {
            id: 'book-now',
            label: 'Đặt lịch',
            message: 'Tôi muốn đặt lịch khám ở khoa này',
            icon: '📅',
        },
        {
            id: 'other-dept',
            label: 'Khoa khác',
            message: 'Cho tôi xem các khoa khác',
            icon: '🏥',
        },
    ],
    greeting: [
        {
            id: 'book-appointment',
            label: 'Đặt lịch khám',
            message: 'Tôi muốn đặt lịch khám',
            icon: '📅',
        },
        {
            id: 'find-doctor',
            label: 'Tìm bác sĩ',
            message: 'Tôi muốn tìm bác sĩ',
            icon: '🔍',
        },
        {
            id: 'my-appointments',
            label: 'Lịch hẹn của tôi',
            message: 'Xem lịch hẹn của tôi',
            icon: '📋',
        },
    ],
    error: [
        {
            id: 'try-again',
            label: 'Thử lại',
            message: 'Tôi muốn thử lại',
            icon: '🔄',
        },
        {
            id: 'contact-support',
            label: 'Hỗ trợ',
            message: 'Tôi cần hỗ trợ từ nhân viên',
            icon: '📞',
        },
    ],
    default: [
        {
            id: 'book-appointment',
            label: 'Đặt lịch khám',
            message: 'Tôi muốn đặt lịch khám',
            icon: '📅',
        },
        {
            id: 'my-appointments',
            label: 'Lịch hẹn của tôi',
            message: 'Xem lịch hẹn của tôi',
            icon: '📋',
        },
    ],
};

/**
 * Detect loại response từ nội dung AI trả về
 */
function detectResponseType(content: string): string {
    for (const [type, patterns] of Object.entries(RESPONSE_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(content)) {
                return type;
            }
        }
    }
    return 'default';
}

/**
 * Lấy quick replies phù hợp với response của AI
 * 
 * @param aiResponse - Nội dung response từ AI
 * @param maxReplies - Số lượng quick replies tối đa (mặc định 3)
 * @returns Danh sách quick replies
 */
export function getQuickReplies(aiResponse: string, maxReplies = 3): QuickReply[] {
    const responseType = detectResponseType(aiResponse);
    const replies = QUICK_REPLIES_CONFIG[responseType] || QUICK_REPLIES_CONFIG.default;
    return replies.slice(0, maxReplies);
}

/**
 * Kiểm tra xem có nên hiển thị quick replies không
 * Không hiển thị khi AI đang hỏi câu hỏi cụ thể
 */
export function shouldShowQuickReplies(aiResponse: string): boolean {
    // Không show quick replies khi AI đang hỏi câu hỏi
    const questionPatterns = [
        /bạn muốn\?$/i,
        /ngày nào\?$/i,
        /giờ nào\?$/i,
        /chuyên khoa nào\?$/i,
        /vui lòng cho biết/i,
        /bạn có thể cho tôi biết/i,
    ];

    for (const pattern of questionPatterns) {
        if (pattern.test(aiResponse)) {
            return false;
        }
    }

    return true;
}
