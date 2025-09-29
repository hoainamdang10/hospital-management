# 📋 Medical Records Management Flow

## Mô tả
Sequence diagram mô tả quy trình tạo và quản lý hồ sơ bệnh án từ khám bệnh đến lưu trữ và truy xuất thông tin.

## Diagram

```mermaid
sequenceDiagram
    participant D as Doctor
    participant FE as Frontend
    participant GW as API Gateway
    participant MED as Medical Records Service
    participant APP as Appointment Service
    participant DB as Database
    participant RT as Real-time Service

    Note over D,RT: Patient Consultation & Medical Record Creation
    
    D->>FE: Access today's appointments
    FE->>GW: GET /api/appointments/doctor/{doctor_id}/today
    GW->>APP: Forward request
    APP->>DB: Query today's appointments
    DB-->>APP: Return appointment list
    APP-->>GW: Return appointments
    GW-->>FE: Return appointments
    FE-->>D: Show appointment schedule

    D->>FE: Start consultation (click on appointment)
    FE->>GW: POST /api/appointments/{id}/start-consultation
    GW->>APP: Forward request
    APP->>DB: Update appointment status to 'in-progress'
    APP->>RT: Send real-time status update
    APP-->>GW: Return success
    GW-->>FE: Return success
    FE-->>D: Open consultation interface

    Note over D,RT: Medical Record Creation Process
    
    D->>FE: Fill patient examination form
    Note over D,FE: - Chief complaint<br/>- Present illness<br/>- Physical examination<br/>- Vital signs<br/>- Diagnosis<br/>- Treatment plan
    
    FE->>GW: POST /api/medical-records
    GW->>MED: Forward medical record creation
    
    MED->>DB: Begin transaction
    MED->>DB: Create medical record
    DB-->>MED: Return record_id
    
    alt Vital signs provided
        MED->>DB: Create vital signs history record
        MED->>MED: Calculate BMI from height/weight
        DB-->>MED: Return vital_id
    end
    
    MED->>DB: Update appointment status to 'completed'
    MED->>DB: Commit transaction
    
    MED->>RT: Send completion notifications
    RT-->>D: Confirm record saved
    RT-->>FE: Update patient status
    
    MED-->>GW: Return medical record details
    GW-->>FE: Return success
    FE-->>D: Show record confirmation + next patient

    Note over D,RT: Medical History Access & Updates
    
    D->>FE: View patient medical history
    FE->>GW: GET /api/medical-records/patient/{patient_id}
    GW->>MED: Forward request
    MED->>DB: Query patient's medical records with vital signs
    DB-->>MED: Return complete medical history
    MED-->>GW: Return medical history
    GW-->>FE: Return history
    FE-->>D: Display patient timeline with all records

    alt Doctor wants to update existing record
        D->>FE: Click edit on medical record
        FE->>GW: GET /api/medical-records/{record_id}
        GW->>MED: Forward request
        MED->>DB: Query specific record details
        DB-->>MED: Return record data
        MED-->>GW: Return record
        GW-->>FE: Return record
        FE-->>D: Show editable form with existing data
        
        D->>FE: Update record information
        FE->>GW: PUT /api/medical-records/{record_id}
        GW->>MED: Forward update request
        MED->>DB: Update medical record
        MED->>DB: Log update in audit trail
        MED-->>GW: Return success
        GW-->>FE: Return success
        FE-->>D: Show updated record
    end

    Note over D,RT: Vital Signs Tracking
    
    D->>FE: Add new vital signs measurement
    FE->>GW: POST /api/medical-records/{record_id}/vital-signs
    GW->>MED: Forward vital signs request
    MED->>DB: Create new vital signs entry
    MED->>MED: Calculate BMI and health indicators
    MED->>RT: Send real-time health alerts if abnormal values
    RT-->>D: Show health alerts/warnings
    MED-->>GW: Return vital signs data
    GW-->>FE: Return success
    FE-->>D: Update vital signs chart

    Note over D,RT: Medical Record Search & Analytics
    
    D->>FE: Search medical records
    FE->>GW: GET /api/medical-records/search?query=X&filters=Y
    GW->>MED: Forward search request
    MED->>DB: Execute complex search query
    DB-->>MED: Return matching records
    MED-->>GW: Return search results
    GW-->>FE: Return results
    FE-->>D: Display search results with highlighting
```

## Quy trình chính

### **1. Patient Consultation Process**
1. **Appointment Access**: Bác sĩ xem lịch hẹn hôm nay
2. **Start Consultation**: Bắt đầu khám bệnh
3. **Record Creation**: Tạo hồ sơ bệnh án mới
4. **Status Update**: Cập nhật trạng thái lịch hẹn

### **2. Medical Record Creation**
1. **Patient Examination**: Điền form khám bệnh
   - Chief complaint (Lý do khám)
   - Present illness (Bệnh sử hiện tại)
   - Physical examination (Khám lâm sàng)
   - Vital signs (Sinh hiệu)
   - Diagnosis (Chẩn đoán)
   - Treatment plan (Kế hoạch điều trị)

2. **Data Processing**: Xử lý và lưu trữ dữ liệu
3. **Vital Signs**: Tính toán BMI và các chỉ số sức khỏe
4. **Notification**: Thông báo hoàn thành

### **3. Medical History Management**
1. **History Access**: Xem lịch sử bệnh án
2. **Record Updates**: Cập nhật thông tin
3. **Audit Trail**: Theo dõi thay đổi
4. **Search & Analytics**: Tìm kiếm và phân tích

## Key Features

### **Comprehensive Record Management**
- Complete patient examination forms
- Vital signs tracking with calculations
- Medical history timeline
- Treatment plan documentation

### **Real-time Features**
- Live status updates during consultation
- Health alerts for abnormal vital signs
- Instant record confirmation
- Real-time collaboration

### **Data Integrity**
- Transaction-based record creation
- Audit trail for all changes
- Data validation and verification
- Backup and recovery

### **Clinical Decision Support**
- BMI calculation
- Health indicator analysis
- Abnormal value alerts
- Historical trend analysis

## Medical Record Components

### **Core Information**
- Patient demographics
- Chief complaint
- Present illness history
- Physical examination findings

### **Vital Signs Tracking**
- Temperature
- Blood pressure (systolic/diastolic)
- Heart rate
- Respiratory rate
- Oxygen saturation
- Weight and height
- BMI calculation

### **Clinical Data**
- Diagnosis
- Treatment plan
- Medications prescribed
- Follow-up instructions
- Notes and observations

### **Metadata**
- Record creation timestamp
- Last update information
- Doctor who created/updated
- Appointment reference
- Status tracking
