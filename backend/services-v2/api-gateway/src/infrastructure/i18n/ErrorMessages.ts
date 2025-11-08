/**
 * Vietnamese Error Messages
 * User-friendly error messages for Vietnamese users
 */

export interface ErrorMessage {
  code: string;
  message: string;
  userMessage: string;
}

/**
 * HTTP Status Code to Vietnamese Error Message Mapping
 */
export const ERROR_MESSAGES: Record<number, ErrorMessage> = {
  // 400 - Bad Request
  400: {
    code: 'BAD_REQUEST',
    message: 'Bad Request',
    userMessage: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin đã nhập.'
  },

  // 401 - Unauthorized
  401: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    userMessage: 'Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
  },

  // 403 - Forbidden
  403: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
    userMessage: 'Bạn không có quyền truy cập tài nguyên này.'
  },

  // 404 - Not Found
  404: {
    code: 'NOT_FOUND',
    message: 'Not Found',
    userMessage: 'Không tìm thấy tài nguyên yêu cầu.'
  },

  // 405 - Method Not Allowed
  405: {
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method Not Allowed',
    userMessage: 'Phương thức không được hỗ trợ.'
  },

  // 408 - Request Timeout
  408: {
    code: 'REQUEST_TIMEOUT',
    message: 'Request Timeout',
    userMessage: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.'
  },

  // 409 - Conflict
  409: {
    code: 'CONFLICT',
    message: 'Conflict',
    userMessage: 'Dữ liệu bị trùng lặp hoặc xung đột. Vui lòng kiểm tra lại.'
  },

  // 413 - Payload Too Large
  413: {
    code: 'PAYLOAD_TOO_LARGE',
    message: 'Payload Too Large',
    userMessage: 'Dữ liệu tải lên quá lớn. Vui lòng giảm kích thước file.'
  },

  // 422 - Unprocessable Entity
  422: {
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Unprocessable Entity',
    userMessage: 'Dữ liệu không thể xử lý. Vui lòng kiểm tra định dạng.'
  },

  // 429 - Too Many Requests
  429: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too Many Requests',
    userMessage: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
  },

  // 500 - Internal Server Error
  500: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal Server Error',
    userMessage: 'Lỗi hệ thống. Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ.'
  },

  // 502 - Bad Gateway
  502: {
    code: 'BAD_GATEWAY',
    message: 'Bad Gateway',
    userMessage: 'Lỗi kết nối đến dịch vụ. Vui lòng thử lại sau.'
  },

  // 503 - Service Unavailable
  503: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service Unavailable',
    userMessage: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.'
  },

  // 504 - Gateway Timeout
  504: {
    code: 'GATEWAY_TIMEOUT',
    message: 'Gateway Timeout',
    userMessage: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.'
  }
};

/**
 * Context-specific error messages
 */
export const CONTEXT_ERROR_MESSAGES: Record<string, string> = {
  // Authentication
  'invalid_credentials': 'Email hoặc mật khẩu không đúng.',
  'email_already_exists': 'Email này đã được đăng ký.',
  'weak_password': 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.',
  'invalid_token': 'Token không hợp lệ hoặc đã hết hạn.',
  
  // Patients
  'patient_not_found': 'Không tìm thấy thông tin bệnh nhân.',
  'duplicate_patient': 'Bệnh nhân đã tồn tại trong hệ thống.',
  'invalid_cccd': 'Số CCCD không hợp lệ.',
  
  // Appointments
  'appointment_conflict': 'Lịch hẹn bị trùng. Vui lòng chọn thời gian khác.',
  'appointment_not_found': 'Không tìm thấy lịch hẹn.',
  'cannot_cancel_appointment': 'Không thể hủy lịch hẹn này.',
  
  // Providers
  'provider_not_found': 'Không tìm thấy thông tin bác sĩ/nhân viên.',
  'provider_not_available': 'Bác sĩ không có lịch làm việc vào thời gian này.',
  
  // Billing
  'invoice_not_found': 'Không tìm thấy hóa đơn.',
  'payment_failed': 'Thanh toán thất bại. Vui lòng thử lại.',
  'insufficient_balance': 'Số dư không đủ.',
  
  // General
  'validation_error': 'Dữ liệu không hợp lệ.',
  'database_error': 'Lỗi cơ sở dữ liệu.',
  'network_error': 'Lỗi kết nối mạng.'
};

/**
 * Get Vietnamese error message by status code
 */
export function getErrorMessage(statusCode: number, context?: string): ErrorMessage {
  // Check context-specific message first
  if (context && CONTEXT_ERROR_MESSAGES[context]) {
    return {
      code: context.toUpperCase(),
      message: context,
      userMessage: CONTEXT_ERROR_MESSAGES[context]
    };
  }

  // Fallback to status code message
  return ERROR_MESSAGES[statusCode] || ERROR_MESSAGES[500];
}

