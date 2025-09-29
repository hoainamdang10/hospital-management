import { useState, useCallback } from 'react';
import { ApiResponse } from '../lib/api/client';

interface ErrorState {
  message: string;
  code?: string;
  isVisible: boolean;
}

interface UseVietnameseErrorReturn {
  error: ErrorState;
  showError: (error: string | ApiResponse<any>) => void;
  clearError: () => void;
  formatError: (error: string | ApiResponse<any>) => string;
}

// Vietnamese error message mappings
const ERROR_MESSAGES: Record<string, { vi: string; en: string }> = {
  // Authentication errors
  'UNAUTHORIZED': {
    vi: 'Không có quyền truy cập. Vui lòng đăng nhập lại.',
    en: 'Unauthorized access. Please login again.'
  },
  'INVALID_CREDENTIALS': {
    vi: 'Thông tin đăng nhập không chính xác.',
    en: 'Invalid login credentials.'
  },
  'TOKEN_EXPIRED': {
    vi: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    en: 'Session expired. Please login again.'
  },
  
  // Validation errors
  'VALIDATION_ERROR': {
    vi: 'Thông tin không hợp lệ. Vui lòng kiểm tra lại.',
    en: 'Invalid information. Please check again.'
  },
  'REQUIRED_FIELD': {
    vi: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
    en: 'Please fill in all required fields.'
  },
  'INVALID_EMAIL': {
    vi: 'Địa chỉ email không hợp lệ.',
    en: 'Invalid email address.'
  },
  'INVALID_PHONE': {
    vi: 'Số điện thoại không hợp lệ.',
    en: 'Invalid phone number.'
  },
  
  // Database errors
  'DATABASE_ERROR': {
    vi: 'Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.',
    en: 'Database error. Please try again later.'
  },
  'RECORD_NOT_FOUND': {
    vi: 'Không tìm thấy thông tin yêu cầu.',
    en: 'Requested information not found.'
  },
  'DUPLICATE_RECORD': {
    vi: 'Thông tin đã tồn tại trong hệ thống.',
    en: 'Information already exists in the system.'
  },
  
  // Healthcare specific errors
  'APPOINTMENT_NOT_FOUND': {
    vi: 'Không tìm thấy cuộc hẹn.',
    en: 'Appointment not found.'
  },
  'APPOINTMENT_CONFLICT': {
    vi: 'Cuộc hẹn bị trung lịch. Vui lòng chọn thời gian khác.',
    en: 'Appointment conflict. Please choose another time.'
  },
  'PATIENT_NOT_FOUND': {
    vi: 'Không tìm thấy thông tin bệnh nhân.',
    en: 'Patient information not found.'
  },
  'DOCTOR_NOT_AVAILABLE': {
    vi: 'Bác sĩ không có lịch trong thời gian này.',
    en: 'Doctor is not available at this time.'
  },
  'MEDICAL_RECORD_ACCESS_DENIED': {
    vi: 'Không có quyền truy cập hồ sơ bệnh án.',
    en: 'Access to medical records denied.'
  },
  
  // Network errors
  'NETWORK_ERROR': {
    vi: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.',
    en: 'Network error. Please check your internet connection.'
  },
  'TIMEOUT_ERROR': {
    vi: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
    en: 'Request timeout. Please try again.'
  },
  'SERVER_ERROR': {
    vi: 'Lỗi máy chủ. Vui lòng thử lại sau.',
    en: 'Server error. Please try again later.'
  },
  
  // Generic errors
  'UNKNOWN_ERROR': {
    vi: 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.',
    en: 'An unknown error occurred. Please try again.'
  },
  'OPERATION_FAILED': {
    vi: 'Thao tác không thành công. Vui lòng thử lại.',
    en: 'Operation failed. Please try again.'
  }
};

export const useVietnameseError = (): UseVietnameseErrorReturn => {
  const [error, setError] = useState<ErrorState>({
    message: '',
    code: undefined,
    isVisible: false
  });

  // Get current language preference
  const getLanguage = useCallback((): 'vi' | 'en' => {
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language');
      if (savedLanguage?.includes('en')) return 'en';
      return 'vi';
    }
    return 'vi';
  }, []);

  // Format error message based on language preference
  const formatError = useCallback((errorInput: string | ApiResponse<any>): string => {
    const language = getLanguage();
    
    if (typeof errorInput === 'string') {
      // Check if it's a known error code
      const errorMapping = ERROR_MESSAGES[errorInput.toUpperCase()];
      if (errorMapping) {
        return errorMapping[language];
      }
      
      // Return the string as-is if no mapping found
      return errorInput;
    }
    
    // Handle ApiResponse error
    if (errorInput.error) {
      const errorCode = errorInput.error.code?.toUpperCase();
      const errorMessage = errorInput.error.message;
      
      // Try to find mapping by error code first
      if (errorCode && ERROR_MESSAGES[errorCode]) {
        return ERROR_MESSAGES[errorCode][language];
      }
      
      // Try to find mapping by error message
      const messageMapping = Object.entries(ERROR_MESSAGES).find(([_, mapping]) => 
        mapping.en.toLowerCase().includes(errorMessage.toLowerCase()) ||
        mapping.vi.toLowerCase().includes(errorMessage.toLowerCase())
      );
      
      if (messageMapping) {
        return messageMapping[1][language];
      }
      
      // Return original message if no mapping found
      return errorMessage;
    }
    
    // Fallback to generic error
    return ERROR_MESSAGES.UNKNOWN_ERROR[language];
  }, [getLanguage]);

  // Show error with Vietnamese formatting
  const showError = useCallback((errorInput: string | ApiResponse<any>) => {
    const formattedMessage = formatError(errorInput);
    const errorCode = typeof errorInput === 'object' ? errorInput.error?.code : undefined;
    
    setError({
      message: formattedMessage,
      code: errorCode,
      isVisible: true
    });
  }, [formatError]);

  // Clear error state
  const clearError = useCallback(() => {
    setError({
      message: '',
      code: undefined,
      isVisible: false
    });
  }, []);

  return {
    error,
    showError,
    clearError,
    formatError
  };
};

// Helper function to extract error from various sources
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.error?.message) return error.error.message;
  if (error?.message) return error.message;
  if (error?.data?.error) return error.data.error;
  return 'Unknown error occurred';
};

// Hook for handling API response errors specifically
export const useApiError = () => {
  const { showError, clearError, formatError } = useVietnameseError();
  
  const handleApiResponse = useCallback(<T>(response: ApiResponse<T>) => {
    if (!response.success && response.error) {
      showError(response);
      return false;
    }
    clearError();
    return true;
  }, [showError, clearError]);
  
  return {
    handleApiResponse,
    showError,
    clearError,
    formatError
  };
};
