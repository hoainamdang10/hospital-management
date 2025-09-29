# 🔄 Activity Diagram

## Mô tả
Activity Diagram mô tả luồng hoạt động chi tiết của các quy trình nghiệp vụ chính trong hệ thống quản lý bệnh viện.

## 1. Patient Registration Activity

```mermaid
flowchart TD
    START([Start Registration]) --> INPUT[Enter Personal Information]
    INPUT --> VALIDATE{Validate Input}
    VALIDATE -->|Invalid| ERROR[Show Error Message]
    ERROR --> INPUT
    VALIDATE -->|Valid| CHECK_EMAIL{Email Exists?}
    CHECK_EMAIL -->|Yes| EMAIL_ERROR[Show Email Exists Error]
    EMAIL_ERROR --> INPUT
    CHECK_EMAIL -->|No| CREATE_PROFILE[Create Profile in Database]
    CREATE_PROFILE --> GENERATE_ID[Generate Patient ID]
    GENERATE_ID --> CREATE_PATIENT[Create Patient Record]
    CREATE_PATIENT --> SEND_EMAIL[Send Verification Email]
    SEND_EMAIL --> SUCCESS[Show Success Message]
    SUCCESS --> END([End])
    
    style START fill:#e8f5e8
    style END fill:#ffebee
    style ERROR fill:#ffcdd2
    style EMAIL_ERROR fill:#ffcdd2
    style SUCCESS fill:#c8e6c9
```

## 2. Appointment Booking Activity

```mermaid
flowchart TD
    START([Start Booking]) --> LOGIN{User Logged In?}
    LOGIN -->|No| LOGIN_PAGE[Redirect to Login]
    LOGIN_PAGE --> LOGIN
    LOGIN -->|Yes| SELECT_DEPT[Select Department]
    SELECT_DEPT --> SELECT_SPEC[Select Specialty]
    SELECT_SPEC --> LOAD_DOCTORS[Load Available Doctors]
    LOAD_DOCTORS --> SELECT_DOCTOR[Select Doctor]
    SELECT_DOCTOR --> SELECT_DATE[Select Date]
    SELECT_DATE --> LOAD_SLOTS[Load Available Time Slots]
    LOAD_SLOTS --> CHECK_SLOTS{Slots Available?}
    CHECK_SLOTS -->|No| NO_SLOTS[Show No Slots Message]
    NO_SLOTS --> SELECT_DATE
    CHECK_SLOTS -->|Yes| SELECT_TIME[Select Time Slot]
    SELECT_TIME --> FILL_DETAILS[Fill Appointment Details]
    FILL_DETAILS --> CONFIRM[Confirm Booking]
    CONFIRM --> VALIDATE_SLOT{Slot Still Available?}
    VALIDATE_SLOT -->|No| CONFLICT[Show Conflict Message]
    CONFLICT --> LOAD_SLOTS
    VALIDATE_SLOT -->|Yes| CREATE_APPOINTMENT[Create Appointment]
    CREATE_APPOINTMENT --> UPDATE_AVAILABILITY[Update Doctor Availability]
    UPDATE_AVAILABILITY --> SEND_NOTIFICATIONS[Send Notifications]
    SEND_NOTIFICATIONS --> SHOW_CONFIRMATION[Show Confirmation]
    SHOW_CONFIRMATION --> END([End])
    
    style START fill:#e8f5e8
    style END fill:#ffebee
    style CONFLICT fill:#ffcdd2
    style NO_SLOTS fill:#fff3e0
    style SHOW_CONFIRMATION fill:#c8e6c9
```

## 3. Medical Consultation Activity

```mermaid
flowchart TD
    START([Start Consultation]) --> CHECK_APPOINTMENT{Valid Appointment?}
    CHECK_APPOINTMENT -->|No| INVALID[Show Invalid Appointment]
    INVALID --> END([End])
    CHECK_APPOINTMENT -->|Yes| START_CONSULT[Start Consultation]
    START_CONSULT --> UPDATE_STATUS[Update Appointment Status to 'In Progress']
    UPDATE_STATUS --> PATIENT_INTERVIEW[Patient Interview]
    PATIENT_INTERVIEW --> PHYSICAL_EXAM[Physical Examination]
    PHYSICAL_EXAM --> RECORD_VITALS[Record Vital Signs]
    RECORD_VITALS --> CALCULATE_BMI[Calculate BMI]
    CALCULATE_BMI --> CHECK_ABNORMAL{Abnormal Values?}
    CHECK_ABNORMAL -->|Yes| SHOW_ALERTS[Show Health Alerts]
    SHOW_ALERTS --> DIAGNOSIS
    CHECK_ABNORMAL -->|No| DIAGNOSIS[Make Diagnosis]
    DIAGNOSIS --> TREATMENT_PLAN[Create Treatment Plan]
    TREATMENT_PLAN --> PRESCRIBE{Need Prescription?}
    PRESCRIBE -->|Yes| CREATE_PRESCRIPTION[Create Prescription]
    CREATE_PRESCRIPTION --> SAVE_RECORD
    PRESCRIBE -->|No| SAVE_RECORD[Save Medical Record]
    SAVE_RECORD --> UPDATE_APPOINTMENT[Update Appointment Status to 'Completed']
    UPDATE_APPOINTMENT --> NOTIFY_PATIENT[Notify Patient]
    NOTIFY_PATIENT --> SCHEDULE_FOLLOWUP{Need Follow-up?}
    SCHEDULE_FOLLOWUP -->|Yes| CREATE_FOLLOWUP[Create Follow-up Appointment]
    CREATE_FOLLOWUP --> COMPLETE
    SCHEDULE_FOLLOWUP -->|No| COMPLETE[Consultation Complete]
    COMPLETE --> END
    
    style START fill:#e8f5e8
    style END fill:#ffebee
    style INVALID fill:#ffcdd2
    style SHOW_ALERTS fill:#fff3e0
    style COMPLETE fill:#c8e6c9
```

## 4. System Monitoring Activity

```mermaid
flowchart TD
    START([System Start]) --> INIT[Initialize Monitoring]
    INIT --> HEALTH_CHECK[Perform Health Checks]
    HEALTH_CHECK --> CHECK_SERVICES{All Services Healthy?}
    CHECK_SERVICES -->|No| LOG_ERROR[Log Service Errors]
    LOG_ERROR --> SEND_ALERT[Send Alert to Admin]
    SEND_ALERT --> ATTEMPT_RESTART[Attempt Service Restart]
    ATTEMPT_RESTART --> WAIT[Wait 30 seconds]
    WAIT --> HEALTH_CHECK
    CHECK_SERVICES -->|Yes| COLLECT_METRICS[Collect Performance Metrics]
    COLLECT_METRICS --> STORE_METRICS[Store in Prometheus]
    STORE_METRICS --> CHECK_THRESHOLDS{Metrics Exceed Thresholds?}
    CHECK_THRESHOLDS -->|Yes| PERFORMANCE_ALERT[Send Performance Alert]
    PERFORMANCE_ALERT --> UPDATE_DASHBOARD
    CHECK_THRESHOLDS -->|No| UPDATE_DASHBOARD[Update Grafana Dashboard]
    UPDATE_DASHBOARD --> CLEANUP[Cleanup Old Data]
    CLEANUP --> WAIT_INTERVAL[Wait 1 minute]
    WAIT_INTERVAL --> HEALTH_CHECK
    
    style START fill:#e8f5e8
    style LOG_ERROR fill:#ffcdd2
    style PERFORMANCE_ALERT fill:#fff3e0
    style UPDATE_DASHBOARD fill:#c8e6c9
```

## 5. Data Backup Activity

```mermaid
flowchart TD
    START([Scheduled Backup]) --> CHECK_TIME{Backup Time?}
    CHECK_TIME -->|No| WAIT[Wait 1 hour]
    WAIT --> CHECK_TIME
    CHECK_TIME -->|Yes| PREPARE[Prepare Backup Environment]
    PREPARE --> LOCK_TABLES[Lock Critical Tables]
    LOCK_TABLES --> EXPORT_DATA[Export Database Data]
    EXPORT_DATA --> COMPRESS[Compress Backup Files]
    COMPRESS --> ENCRYPT[Encrypt Backup]
    ENCRYPT --> UPLOAD{Upload to Cloud?}
    UPLOAD -->|Yes| CLOUD_UPLOAD[Upload to Cloud Storage]
    CLOUD_UPLOAD --> VERIFY_UPLOAD[Verify Upload]
    VERIFY_UPLOAD --> CLEANUP_LOCAL
    UPLOAD -->|No| LOCAL_STORE[Store Locally]
    LOCAL_STORE --> CLEANUP_LOCAL[Cleanup Old Backups]
    CLEANUP_LOCAL --> UNLOCK_TABLES[Unlock Tables]
    UNLOCK_TABLES --> LOG_SUCCESS[Log Backup Success]
    LOG_SUCCESS --> NOTIFY_ADMIN[Notify Admin]
    NOTIFY_ADMIN --> END([End])
    
    %% Error handling
    EXPORT_DATA -->|Error| BACKUP_ERROR[Log Backup Error]
    COMPRESS -->|Error| BACKUP_ERROR
    ENCRYPT -->|Error| BACKUP_ERROR
    CLOUD_UPLOAD -->|Error| BACKUP_ERROR
    BACKUP_ERROR --> UNLOCK_TABLES
    
    style START fill:#e8f5e8
    style END fill:#ffebee
    style BACKUP_ERROR fill:#ffcdd2
    style LOG_SUCCESS fill:#c8e6c9
```

## Đặc điểm Activity Diagrams

### **Parallel Activities**
- Health checks và metric collection chạy song song
- Backup và monitoring hoạt động độc lập
- Multiple user sessions được xử lý đồng thời

### **Decision Points**
- Validation checks tại mọi input
- Conditional flows dựa trên business rules
- Error handling và recovery paths

### **Synchronization**
- Database transactions đảm bảo consistency
- Lock mechanisms cho critical operations
- Event-driven notifications

### **Exception Handling**
- Graceful error recovery
- User-friendly error messages
- System resilience và fault tolerance

## Business Rules

### **Appointment Booking**
- Chỉ cho phép đặt lịch trong giờ làm việc
- Không được đặt trùng slot đã có
- Tự động hủy lịch không confirm trong 24h

### **Medical Records**
- Bắt buộc có chẩn đoán trước khi hoàn thành
- Vital signs phải trong khoảng hợp lệ
- Audit trail cho mọi thay đổi

### **System Operations**
- Backup hàng ngày vào 2:00 AM
- Health check mỗi phút
- Alert ngay khi có lỗi critical
