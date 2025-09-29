# 🗄️ Database Entity Relationship Diagram

## Mô tả
Entity Relationship Diagram chi tiết cấu trúc database của hệ thống quản lý bệnh viện, hiển thị tất cả bảng và mối quan hệ.

## Diagram

```mermaid
erDiagram
    PROFILES {
        uuid id PK
        string email UK
        string full_name
        string phone_number
        date date_of_birth
        string role
        boolean is_active
        timestamp created_at
        timestamp updated_at
        string avatar_url
        string address
        string emergency_contact
        boolean email_verified
        boolean phone_verified
        timestamp last_login
        integer login_count
        boolean two_factor_enabled
        timestamp last_2fa_verification
    }
    
    DEPARTMENTS {
        string department_id PK
        string department_name
        string department_code UK
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
        string parent_department_id FK
        string head_doctor_id FK
        string location
        string phone_number
        string email
    }
    
    SPECIALTIES {
        string specialty_id PK
        string specialty_name
        string department_id FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
        text description
        integer average_consultation_time
        decimal consultation_fee_min
        decimal consultation_fee_max
        text required_certifications
        text equipment_required
    }
    
    DOCTORS {
        string doctor_id PK
        string profile_id FK
        string full_name
        string specialty
        string qualification
        string department_id FK
        string license_number UK
        string gender
        text bio
        integer experience_years
        decimal consultation_fee
        jsonb address
        text_array languages_spoken
        string availability_status
        decimal rating
        integer total_reviews
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    PATIENTS {
        string patient_id PK
        string profile_id FK
        string gender
        string blood_type
        string status
        text address
        string emergency_contact
        text medical_history
        text allergies
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    APPOINTMENTS {
        string appointment_id PK
        string doctor_id FK
        string patient_id FK
        date appointment_date
        time appointment_time
        string appointment_type
        string status
        text notes
        decimal consultation_fee
        timestamp created_at
        timestamp updated_at
    }
    
    MEDICAL_RECORDS {
        string record_id PK
        string appointment_id FK
        string doctor_id FK
        string patient_id FK
        date visit_date
        text chief_complaint
        text present_illness
        text diagnosis
        text treatment_plan
        text notes
        string status
        timestamp created_at
        timestamp updated_at
    }
    
    VITAL_SIGNS_HISTORY {
        string vital_id PK
        string record_id FK
        decimal temperature
        integer blood_pressure_systolic
        integer blood_pressure_diastolic
        integer heart_rate
        integer respiratory_rate
        decimal oxygen_saturation
        decimal weight
        decimal height
        decimal bmi
        timestamp recorded_at
        string recorded_by
        text notes
    }
    
    DOCTOR_REVIEWS {
        string review_id PK
        string doctor_id FK
        string patient_id FK
        integer rating
        text review_text
        timestamp review_date
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }
    
    DOCTOR_SHIFTS {
        string shift_id PK
        string doctor_id FK
        date shift_date
        time start_time
        time end_time
        string shift_type
        string status
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    DOCTOR_EXPERIENCES {
        string experience_id PK
        string doctor_id FK
        string institution_name
        string position
        date start_date
        date end_date
        text description
        boolean is_current
        timestamp created_at
        timestamp updated_at
    }
    
    ROOMS {
        string room_id PK
        string room_number UK
        string room_type_id FK
        string department_id FK
        string status
        integer capacity
        text equipment
        text notes
        timestamp created_at
        timestamp updated_at
    }
    
    ROOM_TYPES {
        string room_type_id PK
        string type_name
        text description
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    %% Relationships
    PROFILES ||--o{ DOCTORS : "profile_id"
    PROFILES ||--o{ PATIENTS : "profile_id"
    
    DEPARTMENTS ||--o{ SPECIALTIES : "department_id"
    DEPARTMENTS ||--o{ DOCTORS : "department_id"
    DEPARTMENTS ||--o{ ROOMS : "department_id"
    DEPARTMENTS ||--o{ DEPARTMENTS : "parent_department_id"
    
    DOCTORS ||--o{ APPOINTMENTS : "doctor_id"
    DOCTORS ||--o{ MEDICAL_RECORDS : "doctor_id"
    DOCTORS ||--o{ DOCTOR_REVIEWS : "doctor_id"
    DOCTORS ||--o{ DOCTOR_SHIFTS : "doctor_id"
    DOCTORS ||--o{ DOCTOR_EXPERIENCES : "doctor_id"
    
    PATIENTS ||--o{ APPOINTMENTS : "patient_id"
    PATIENTS ||--o{ MEDICAL_RECORDS : "patient_id"
    PATIENTS ||--o{ DOCTOR_REVIEWS : "patient_id"
    
    APPOINTMENTS ||--o{ MEDICAL_RECORDS : "appointment_id"
    
    MEDICAL_RECORDS ||--o{ VITAL_SIGNS_HISTORY : "record_id"
    
    ROOM_TYPES ||--o{ ROOMS : "room_type_id"
```

## Mối quan hệ chính

### **Core Entities**
- **PROFILES**: Bảng người dùng trung tâm
- **DEPARTMENTS**: Các khoa trong bệnh viện
- **SPECIALTIES**: Chuyên khoa thuộc các khoa

### **User Entities**
- **DOCTORS**: Thông tin bác sĩ
- **PATIENTS**: Thông tin bệnh nhân

### **Business Entities**
- **APPOINTMENTS**: Lịch hẹn khám
- **MEDICAL_RECORDS**: Hồ sơ bệnh án
- **VITAL_SIGNS_HISTORY**: Lịch sử sinh hiệu

### **Supporting Entities**
- **DOCTOR_REVIEWS**: Đánh giá bác sĩ
- **DOCTOR_SHIFTS**: Ca trực bác sĩ
- **DOCTOR_EXPERIENCES**: Kinh nghiệm bác sĩ
- **ROOMS**: Phòng khám
- **ROOM_TYPES**: Loại phòng

## Key Features
- **Row Level Security**: Bảo mật cấp dòng
- **Department-based IDs**: ID theo khoa
- **Audit Trail**: Theo dõi thay đổi
- **Real-time Updates**: Cập nhật thời gian thực
