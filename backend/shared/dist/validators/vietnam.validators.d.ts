export declare const VIETNAM_PATTERNS: {
    DOCTOR_ID: RegExp;
    PATIENT_ID: RegExp;
    APPOINTMENT_ID: RegExp;
    DEPARTMENT_ID: RegExp;
    ROOM_ID: RegExp;
    MEDICAL_RECORD_ID: RegExp;
    PRESCRIPTION_ID: RegExp;
    BILLING_ID: RegExp;
    PHONE_VN: RegExp;
    EMAIL: RegExp;
    LICENSE_VN: RegExp;
    CCCD: RegExp;
    CMND: RegExp;
    BHYT: RegExp;
};
export declare const VIETNAM_ENUMS: {
    GIOI_TINH: string[];
    NHOM_MAU: string[];
    TRANG_THAI_BAC_SI: string[];
    TRANG_THAI_BENH_NHAN: string[];
    TRANG_THAI_LICH_KHAM: string[];
    LOAI_LICH_KHAM: string[];
    LOAI_PHONG: string[];
    LOAI_BAO_HIEM: string[];
    PHUONG_THUC_THANH_TOAN: string[];
    CHUYEN_KHOA: string[];
    LOAI_BANG_CAP: string[];
};
export declare const VIETNAM_RANGES: {
    TUOI: {
        min: number;
        max: number;
    };
    KINH_NGHIEM: {
        min: number;
        max: number;
    };
    PHI_KHAM: {
        min: number;
        max: number;
    };
    THOI_GIAN_KHAM: {
        min: number;
        max: number;
    };
    SUC_CHUA_PHONG: {
        min: number;
        max: number;
    };
    NHIET_DO: {
        min: number;
        max: number;
    };
    MACH: {
        min: number;
        max: number;
    };
    HUYET_AP_TAM_TRUONG: {
        min: number;
        max: number;
    };
    HUYET_AP_TAM_THU: {
        min: number;
        max: number;
    };
    NHIP_THO: {
        min: number;
        max: number;
    };
    SPO2: {
        min: number;
        max: number;
    };
    CAN_NANG: {
        min: number;
        max: number;
    };
    CHIEU_CAO: {
        min: number;
        max: number;
    };
    BMI: {
        min: number;
        max: number;
    };
};
export declare const validateDoctorId: import("express-validator").ValidationChain[];
export declare const validateCreateDoctor: import("express-validator").ValidationChain[];
export declare const validateCreatePatient: import("express-validator").ValidationChain[];
export declare const validateAppointmentId: import("express-validator").ValidationChain[];
export declare const validateCreateAppointment: import("express-validator").ValidationChain[];
export declare const validateVietnamPhone: (phone: string) => boolean;
export declare const validateVietnamLicense: (license: string) => boolean;
export declare const validateCCCD: (cccd: string) => boolean;
export declare const validateBHYT: (bhyt: string) => boolean;
export declare const formatVietnamPhone: (phone: string) => string;
export declare const formatVietnamLicense: (license: string) => string;
export declare const VIETNAM_UNIQUE_CONSTRAINTS: {
    doctors: string[];
    patients: string[];
    appointments: string[];
    departments: string[];
    rooms: string[];
    medical_records: string[];
    prescriptions: string[];
    billing: string[];
};
export declare const validateUniqueness: (table: string, field: string, value: any, excludeId?: string) => Promise<{
    isUnique: boolean;
    message: string;
}>;
declare const _default: {
    VIETNAM_PATTERNS: {
        DOCTOR_ID: RegExp;
        PATIENT_ID: RegExp;
        APPOINTMENT_ID: RegExp;
        DEPARTMENT_ID: RegExp;
        ROOM_ID: RegExp;
        MEDICAL_RECORD_ID: RegExp;
        PRESCRIPTION_ID: RegExp;
        BILLING_ID: RegExp;
        PHONE_VN: RegExp;
        EMAIL: RegExp;
        LICENSE_VN: RegExp;
        CCCD: RegExp;
        CMND: RegExp;
        BHYT: RegExp;
    };
    VIETNAM_ENUMS: {
        GIOI_TINH: string[];
        NHOM_MAU: string[];
        TRANG_THAI_BAC_SI: string[];
        TRANG_THAI_BENH_NHAN: string[];
        TRANG_THAI_LICH_KHAM: string[];
        LOAI_LICH_KHAM: string[];
        LOAI_PHONG: string[];
        LOAI_BAO_HIEM: string[];
        PHUONG_THUC_THANH_TOAN: string[];
        CHUYEN_KHOA: string[];
        LOAI_BANG_CAP: string[];
    };
    VIETNAM_RANGES: {
        TUOI: {
            min: number;
            max: number;
        };
        KINH_NGHIEM: {
            min: number;
            max: number;
        };
        PHI_KHAM: {
            min: number;
            max: number;
        };
        THOI_GIAN_KHAM: {
            min: number;
            max: number;
        };
        SUC_CHUA_PHONG: {
            min: number;
            max: number;
        };
        NHIET_DO: {
            min: number;
            max: number;
        };
        MACH: {
            min: number;
            max: number;
        };
        HUYET_AP_TAM_TRUONG: {
            min: number;
            max: number;
        };
        HUYET_AP_TAM_THU: {
            min: number;
            max: number;
        };
        NHIP_THO: {
            min: number;
            max: number;
        };
        SPO2: {
            min: number;
            max: number;
        };
        CAN_NANG: {
            min: number;
            max: number;
        };
        CHIEU_CAO: {
            min: number;
            max: number;
        };
        BMI: {
            min: number;
            max: number;
        };
    };
    validateDoctorId: import("express-validator").ValidationChain[];
    validateCreateDoctor: import("express-validator").ValidationChain[];
    validateCreatePatient: import("express-validator").ValidationChain[];
    validateAppointmentId: import("express-validator").ValidationChain[];
    validateCreateAppointment: import("express-validator").ValidationChain[];
    validateVietnamPhone: (phone: string) => boolean;
    validateVietnamLicense: (license: string) => boolean;
    validateCCCD: (cccd: string) => boolean;
    validateBHYT: (bhyt: string) => boolean;
    formatVietnamPhone: (phone: string) => string;
    formatVietnamLicense: (license: string) => string;
    VIETNAM_UNIQUE_CONSTRAINTS: {
        doctors: string[];
        patients: string[];
        appointments: string[];
        departments: string[];
        rooms: string[];
        medical_records: string[];
        prescriptions: string[];
        billing: string[];
    };
};
export default _default;
//# sourceMappingURL=vietnam.validators.d.ts.map