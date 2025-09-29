import logger from '@hospital/shared/dist/utils/logger';

// Supported languages
export enum SupportedLanguages {
  VI = 'vi',
  EN = 'en'
}

// Translation interface
interface Translation {
  [key: string]: string | Translation;
}

// Vietnamese translations for hospital management system
const vietnameseTranslations: Translation = {
  // Common terms
  common: {
    success: 'Thành công',
    error: 'Lỗi',
    warning: 'Cảnh báo',
    info: 'Thông tin',
    loading: 'Đang tải',
    saving: 'Đang lưu',
    saved: 'Đã lưu',
    deleted: 'Đã xóa',
    updated: 'Đã cập nhật',
    created: 'Đã tạo',
    cancelled: 'Đã hủy',
    confirmed: 'Đã xác nhận',
    pending: 'Đang chờ',
    completed: 'Hoàn thành',
    active: 'Hoạt động',
    inactive: 'Không hoạt động',
    available: 'Có sẵn',
    unavailable: 'Không có sẵn',
    yes: 'Có',
    no: 'Không'
  },

  // Doctor-related translations
  doctor: {
    title: 'Bác sĩ',
    profile: 'Hồ sơ bác sĩ',
    dashboard: 'Bảng điều khiển bác sĩ',
    schedule: 'Lịch làm việc',
    appointments: 'Cuộc hẹn',
    patients: 'Bệnh nhân',
    reviews: 'Đánh giá',
    statistics: 'Thống kê',
    specialization: 'Chuyên khoa',
    department: 'Khoa',
    experience: 'Kinh nghiệm',
    education: 'Học vấn',
    license: 'Giấy phép hành nghề',
    status: 'Trạng thái',
    availability: 'Tình trạng có sẵn',
    workingHours: 'Giờ làm việc',
    contactInfo: 'Thông tin liên hệ',
    biography: 'Tiểu sử',
    achievements: 'Thành tích',
    certifications: 'Chứng chỉ'
  },

  // Patient-related translations
  patient: {
    title: 'Bệnh nhân',
    profile: 'Hồ sơ bệnh nhân',
    medicalHistory: 'Tiền sử bệnh',
    appointments: 'Cuộc hẹn',
    medicalRecords: 'Hồ sơ y tế',
    prescriptions: 'Đơn thuốc',
    labResults: 'Kết quả xét nghiệm',
    vitalSigns: 'Dấu hiệu sinh tồn',
    allergies: 'Dị ứng',
    medications: 'Thuốc đang dùng',
    emergencyContact: 'Liên hệ khẩn cấp',
    insurance: 'Bảo hiểm',
    personalInfo: 'Thông tin cá nhân',
    contactInfo: 'Thông tin liên hệ',
    address: 'Địa chỉ',
    dateOfBirth: 'Ngày sinh',
    gender: 'Giới tính',
    bloodType: 'Nhóm máu'
  },

  // Appointment-related translations
  appointment: {
    title: 'Cuộc hẹn',
    schedule: 'Lên lịch',
    reschedule: 'Đổi lịch',
    cancel: 'Hủy',
    confirm: 'Xác nhận',
    date: 'Ngày',
    time: 'Giờ',
    duration: 'Thời gian',
    reason: 'Lý do khám',
    notes: 'Ghi chú',
    status: 'Trạng thái',
    type: 'Loại cuộc hẹn',
    priority: 'Độ ưu tiên',
    followUp: 'Tái khám',
    checkup: 'Khám định kỳ',
    consultation: 'Tư vấn',
    emergency: 'Cấp cứu',
    surgery: 'Phẫu thuật',
    therapy: 'Điều trị',
    vaccination: 'Tiêm chủng',
    screening: 'Tầm soát'
  },

  // Department-related translations
  department: {
    title: 'Khoa',
    cardiology: 'Tim mạch',
    neurology: 'Thần kinh',
    orthopedics: 'Chấn thương chỉnh hình',
    pediatrics: 'Nhi khoa',
    gynecology: 'Phụ khoa',
    dermatology: 'Da liễu',
    psychiatry: 'Tâm thần',
    radiology: 'Chẩn đoán hình ảnh',
    laboratory: 'Xét nghiệm',
    pharmacy: 'Dược',
    emergency: 'Cấp cứu',
    surgery: 'Phẫu thuật',
    icu: 'Hồi sức tích cực',
    oncology: 'Ung bướu',
    endocrinology: 'Nội tiết',
    gastroenterology: 'Tiêu hóa',
    pulmonology: 'Hô hấp',
    nephrology: 'Thận',
    ophthalmology: 'Mắt',
    ent: 'Tai mũi họng'
  },

  // Medical terms
  medical: {
    diagnosis: 'Chẩn đoán',
    treatment: 'Điều trị',
    medication: 'Thuốc',
    dosage: 'Liều lượng',
    frequency: 'Tần suất',
    duration: 'Thời gian',
    instructions: 'Hướng dẫn',
    sideEffects: 'Tác dụng phụ',
    contraindications: 'Chống chỉ định',
    symptoms: 'Triệu chứng',
    condition: 'Tình trạng',
    procedure: 'Thủ thuật',
    surgery: 'Phẫu thuật',
    recovery: 'Hồi phục',
    followUp: 'Theo dõi',
    prognosis: 'Tiên lượng',
    chronic: 'Mãn tính',
    acute: 'Cấp tính',
    stable: 'Ổn định',
    critical: 'Nguy kịch',
    improving: 'Đang cải thiện',
    deteriorating: 'Đang xấu đi'
  },

  // System messages
  messages: {
    welcome: 'Chào mừng đến với Hệ thống Quản lý Bệnh viện',
    loginSuccess: 'Đăng nhập thành công',
    loginFailed: 'Đăng nhập thất bại',
    logoutSuccess: 'Đăng xuất thành công',
    accessDenied: 'Truy cập bị từ chối',
    notFound: 'Không tìm thấy',
    serverError: 'Lỗi máy chủ',
    networkError: 'Lỗi mạng',
    validationError: 'Lỗi xác thực dữ liệu',
    dataNotFound: 'Không tìm thấy dữ liệu',
    operationSuccess: 'Thao tác thành công',
    operationFailed: 'Thao tác thất bại',
    confirmDelete: 'Bạn có chắc chắn muốn xóa?',
    confirmCancel: 'Bạn có chắc chắn muốn hủy?',
    unsavedChanges: 'Có thay đổi chưa được lưu',
    sessionExpired: 'Phiên làm việc đã hết hạn',
    maintenanceMode: 'Hệ thống đang bảo trì'
  },

  // Time and date
  time: {
    today: 'Hôm nay',
    yesterday: 'Hôm qua',
    tomorrow: 'Ngày mai',
    thisWeek: 'Tuần này',
    thisMonth: 'Tháng này',
    thisYear: 'Năm này',
    morning: 'Sáng',
    afternoon: 'Chiều',
    evening: 'Tối',
    night: 'Đêm',
    monday: 'Thứ hai',
    tuesday: 'Thứ ba',
    wednesday: 'Thứ tư',
    thursday: 'Thứ năm',
    friday: 'Thứ sáu',
    saturday: 'Thứ bảy',
    sunday: 'Chủ nhật'
  },

  // Status messages
  status: {
    scheduled: 'Đã lên lịch',
    confirmed: 'Đã xác nhận',
    inProgress: 'Đang tiến hành',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
    postponed: 'Hoãn lại',
    noShow: 'Không đến',
    waiting: 'Đang chờ',
    checkedIn: 'Đã check-in',
    inExamination: 'Đang khám',
    discharged: 'Đã xuất viện',
    admitted: 'Đã nhập viện'
  }
};

// English translations (fallback)
const englishTranslations: Translation = {
  common: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading',
    saving: 'Saving',
    saved: 'Saved',
    deleted: 'Deleted',
    updated: 'Updated',
    created: 'Created',
    cancelled: 'Cancelled',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    active: 'Active',
    inactive: 'Inactive',
    available: 'Available',
    unavailable: 'Unavailable',
    yes: 'Yes',
    no: 'No'
  },
  // ... other English translations would go here
};

class I18nService {
  private currentLanguage: SupportedLanguages = SupportedLanguages.VI;
  private translations: { [key in SupportedLanguages]: Translation } = {
    [SupportedLanguages.VI]: vietnameseTranslations,
    [SupportedLanguages.EN]: englishTranslations
  };

  /**
   * Set current language
   */
  setLanguage(language: SupportedLanguages): void {
    this.currentLanguage = language;
    logger.info(`🌐 Language set to: ${language}`);
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguages {
    return this.currentLanguage;
  }

  /**
   * Translate a key to current language
   */
  translate(key: string, params?: { [key: string]: string | number }): string {
    try {
      const translation = this.getTranslation(key, this.currentLanguage);
      
      if (!translation) {
        // Fallback to English if Vietnamese translation not found
        const fallback = this.getTranslation(key, SupportedLanguages.EN);
        if (fallback) {
          logger.warn(`🌐 Translation missing for key "${key}" in ${this.currentLanguage}, using English fallback`);
          return this.interpolate(fallback, params);
        }
        
        // Return key if no translation found
        logger.warn(`🌐 Translation missing for key "${key}" in both languages`);
        return key;
      }

      return this.interpolate(translation, params);
    } catch (error) {
      logger.error('🌐 Translation error:', error);
      return key;
    }
  }

  /**
   * Get translation for specific language
   */
  private getTranslation(key: string, language: SupportedLanguages): string | null {
    const keys = key.split('.');
    let current: any = this.translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return null;
      }
    }

    return typeof current === 'string' ? current : null;
  }

  /**
   * Interpolate parameters into translation string
   */
  private interpolate(translation: string, params?: { [key: string]: string | number }): string {
    if (!params) return translation;

    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key]?.toString() || match;
    });
  }

  /**
   * Translate GraphQL error messages
   */
  translateError(error: any): any {
    if (!error) return error;

    if (Array.isArray(error)) {
      return error.map(e => this.translateError(e));
    }

    if (typeof error === 'object') {
      const translatedError = { ...error };
      
      if (error.message) {
        translatedError.message = this.translateErrorMessage(error.message);
      }

      if (error.extensions && error.extensions.code) {
        translatedError.extensions = {
          ...error.extensions,
          translatedMessage: this.translateErrorCode(error.extensions.code)
        };
      }

      return translatedError;
    }

    return error;
  }

  /**
   * Translate error messages
   */
  private translateErrorMessage(message: string): string {
    const errorMappings: { [key: string]: string } = {
      'Access denied': this.translate('messages.accessDenied'),
      'Not found': this.translate('messages.notFound'),
      'Server error': this.translate('messages.serverError'),
      'Network error': this.translate('messages.networkError'),
      'Validation error': this.translate('messages.validationError'),
      'Data not found': this.translate('messages.dataNotFound'),
      'Operation failed': this.translate('messages.operationFailed'),
      'Session expired': this.translate('messages.sessionExpired'),
      'Maintenance mode': this.translate('messages.maintenanceMode')
    };

    return errorMappings[message] || message;
  }

  /**
   * Translate error codes
   */
  private translateErrorCode(code: string): string {
    const codeMappings: { [key: string]: string } = {
      'UNAUTHENTICATED': this.translate('messages.accessDenied'),
      'FORBIDDEN': this.translate('messages.accessDenied'),
      'NOT_FOUND': this.translate('messages.notFound'),
      'INTERNAL_ERROR': this.translate('messages.serverError'),
      'BAD_USER_INPUT': this.translate('messages.validationError'),
      'GRAPHQL_VALIDATION_FAILED': this.translate('messages.validationError')
    };

    return codeMappings[code] || code;
  }

  /**
   * Format Vietnamese date
   */
  formatDate(date: Date | string, format: 'short' | 'long' | 'time' = 'short'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (this.currentLanguage === SupportedLanguages.VI) {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Ho_Chi_Minh'
      };

      switch (format) {
        case 'short':
          options.day = '2-digit';
          options.month = '2-digit';
          options.year = 'numeric';
          break;
        case 'long':
          options.weekday = 'long';
          options.day = 'numeric';
          options.month = 'long';
          options.year = 'numeric';
          break;
        case 'time':
          options.hour = '2-digit';
          options.minute = '2-digit';
          options.hour12 = false;
          break;
      }

      return d.toLocaleDateString('vi-VN', options);
    }

    return d.toLocaleDateString('en-US');
  }

  /**
   * Get all translations for current language
   */
  getAllTranslations(): Translation {
    return this.translations[this.currentLanguage];
  }

  /**
   * Add custom translations
   */
  addTranslations(language: SupportedLanguages, translations: Translation): void {
    this.translations[language] = {
      ...this.translations[language],
      ...translations
    };
    
    logger.info(`🌐 Added custom translations for ${language}`);
  }
}

// Export singleton instance
export const i18nService = new I18nService();
export default i18nService;
