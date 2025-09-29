# 📅 Appointment Booking Flow Diagram

## Mô tả
Sequence diagram mô tả quy trình đặt lịch hẹn từ tìm kiếm bác sĩ đến xác nhận lịch hẹn và quản lý lịch hẹn.

## Diagram

```mermaid
sequenceDiagram
    participant P as Patient
    participant FE as Frontend
    participant GW as API Gateway
    participant APP as Appointment Service
    participant DOC as Doctor Service
    participant DB as Database
    participant RT as Real-time Service

    Note over P,RT: Appointment Search & Booking Flow
    
    P->>FE: Access appointment booking page
    FE->>GW: GET /api/departments
    GW->>APP: Forward request
    APP->>DB: Query departments & specialties
    DB-->>APP: Return department list
    APP-->>GW: Return departments
    GW-->>FE: Return departments
    FE-->>P: Show department/specialty selection

    P->>FE: Select department & specialty
    FE->>GW: GET /api/doctors?department=X&specialty=Y
    GW->>DOC: Forward request
    DOC->>DB: Query available doctors
    DB-->>DOC: Return doctor list with ratings
    DOC-->>GW: Return doctors
    GW-->>FE: Return doctors
    FE-->>P: Show doctor list with profiles

    P->>FE: Select doctor
    FE->>GW: GET /api/appointments/availability?doctor_id=X&date=Y
    GW->>APP: Forward request
    APP->>DB: Query doctor shifts & existing appointments
    DB-->>APP: Return availability slots
    APP-->>GW: Return available time slots
    GW-->>FE: Return time slots
    FE-->>P: Show available appointment times

    P->>FE: Select date & time + fill appointment details
    FE->>GW: POST /api/appointments
    GW->>APP: Forward booking request
    
    APP->>DB: Begin transaction
    APP->>DB: Check slot still available
    
    alt Slot is available
        APP->>DB: Create appointment record
        APP->>DB: Update doctor availability
        DB-->>APP: Return appointment_id
        APP->>DB: Commit transaction
        
        APP->>RT: Send real-time notification
        RT-->>DOC: Notify doctor of new appointment
        RT-->>P: Send confirmation notification
        
        APP-->>GW: Return booking success + appointment details
        GW-->>FE: Return success
        FE-->>P: Show confirmation page with appointment details
        
    else Slot is no longer available
        APP->>DB: Rollback transaction
        APP-->>GW: Return conflict error
        GW-->>FE: Return error
        FE-->>P: Show error + refresh available slots
    end

    Note over P,RT: Appointment Management Flow
    
    P->>FE: View my appointments
    FE->>GW: GET /api/appointments/patient/{patient_id}
    GW->>APP: Forward request
    APP->>DB: Query patient appointments with doctor details
    DB-->>APP: Return appointment list
    APP-->>GW: Return appointments
    GW-->>FE: Return appointments
    FE-->>P: Show appointment list

    alt Patient wants to reschedule
        P->>FE: Click reschedule appointment
        FE->>GW: GET /api/appointments/availability?doctor_id=X&exclude_date=Y
        GW->>APP: Forward request
        APP->>DB: Query new available slots
        DB-->>APP: Return new slots
        APP-->>GW: Return slots
        GW-->>FE: Return slots
        FE-->>P: Show new time options
        
        P->>FE: Select new time
        FE->>GW: PUT /api/appointments/{id}/reschedule
        GW->>APP: Forward reschedule request
        APP->>DB: Update appointment time
        APP->>RT: Send reschedule notifications
        RT-->>DOC: Notify doctor of change
        RT-->>P: Send confirmation
        APP-->>GW: Return success
        GW-->>FE: Return success
        FE-->>P: Show updated appointment
        
    else Patient wants to cancel
        P->>FE: Click cancel appointment
        FE->>GW: DELETE /api/appointments/{id}
        GW->>APP: Forward cancellation
        APP->>DB: Update appointment status to 'cancelled'
        APP->>DB: Free up the time slot
        APP->>RT: Send cancellation notifications
        RT-->>DOC: Notify doctor of cancellation
        APP-->>GW: Return success
        GW-->>FE: Return success
        FE-->>P: Show cancellation confirmation
    end
```

## Quy trình chính

### **1. Appointment Search Flow**
1. **Department Selection**: Bệnh nhân chọn khoa và chuyên khoa
2. **Doctor Selection**: Hiển thị danh sách bác sĩ với rating và thông tin
3. **Time Selection**: Hiển thị các slot thời gian có sẵn
4. **Booking Confirmation**: Xác nhận thông tin và tạo lịch hẹn

### **2. Appointment Booking Process**
1. **Availability Check**: Kiểm tra slot còn trống
2. **Transaction Management**: Sử dụng database transaction
3. **Real-time Notification**: Thông báo cho bác sĩ và bệnh nhân
4. **Conflict Handling**: Xử lý trường hợp slot đã được đặt

### **3. Appointment Management**
1. **View Appointments**: Xem danh sách lịch hẹn
2. **Reschedule**: Thay đổi thời gian lịch hẹn
3. **Cancel**: Hủy lịch hẹn và giải phóng slot

## Key Features

### **Real-time Updates**
- Thông báo tức thời cho bác sĩ và bệnh nhân
- Cập nhật availability real-time
- WebSocket connections

### **Conflict Prevention**
- Database transactions
- Optimistic locking
- Slot availability validation

### **User Experience**
- Intuitive booking interface
- Clear appointment status
- Easy reschedule/cancel options

### **Business Logic**
- Doctor availability management
- Appointment type handling
- Consultation fee calculation

## Status Management

### **Appointment Statuses**
- `scheduled`: Đã đặt lịch
- `confirmed`: Đã xác nhận
- `in-progress`: Đang khám
- `completed`: Hoàn thành
- `cancelled`: Đã hủy
- `no-show`: Không đến khám

### **Notification Types**
- Booking confirmation
- Reschedule notification
- Cancellation notice
- Reminder notifications
