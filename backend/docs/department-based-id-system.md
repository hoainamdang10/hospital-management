# Department-Based ID System Documentation

## 📋 Overview

Hệ thống ID dựa trên khoa (Department-based ID System) được thiết kế để tạo ra các ID có ý nghĩa business logic cho hospital management system.

## 🎯 ID Format

### **Department-based Entities:**
```
{DEPT_CODE}-{ENTITY}-{YYYYMM}-{SEQ}

Ví dụ:
CARD-DOC-202412-001  // Bác sĩ tim mạch thứ 1 tháng 12/2024
NEUR-DOC-202412-001  // Bác sĩ thần kinh thứ 1 tháng 12/2024
PEDI-APT-202412-001  // Lịch hẹn nhi khoa thứ 1 tháng 12/2024
```

### **Standard Entities:**
```
{ENTITY}-{YYYYMM}-{SEQ}

Ví dụ:
PAT-202412-001       // Bệnh nhân thứ 1 tháng 12/2024
ADM-202412-001       // Admin thứ 1 tháng 12/2024
BILL-202412-001      // Hóa đơn thứ 1 tháng 12/2024
```

## 🏥 Department Code Mapping

| Department ID | Code | Vietnamese Name | English Name |
|---------------|------|-----------------|--------------|
| DEPT001 | CARD | Khoa Tim mạch | Cardiology |
| DEPT002 | NEUR | Khoa Thần kinh | Neurology |
| DEPT003 | PEDI | Khoa Nhi | Pediatrics |
| DEPT004 | OBGY | Khoa Sản phụ khoa | Obstetrics & Gynecology |
| DEPT005 | INTE | Khoa Nội tổng hợp | Internal Medicine |
| DEPT006 | SURG | Khoa Ngoại tổng hợp | Surgery |
| DEPT007 | ORTH | Khoa Chấn thương chỉnh hình | Orthopedics |
| DEPT008 | EMER | Khoa Cấp cứu | Emergency |
| DEPT009 | OPHT | Khoa Mắt | Ophthalmology |
| DEPT010 | ENT | Khoa Tai mũi họng | ENT |
| DEPT011 | DERM | Khoa Da liễu | Dermatology |
| DEPT012 | ICU | Khoa Hồi sức cấp cứu | ICU |

## 🔧 Core Functions

### **1. Department Code Function**
```sql
SELECT get_department_code('DEPT001'); -- Returns: 'CARD'
```

### **2. Universal ID Generation**
```sql
-- Department-based ID
SELECT generate_hospital_id('DOC', 'DEPT001'); -- Returns: 'CARD-DOC-202412-001'

-- Standard ID
SELECT generate_hospital_id('PAT'); -- Returns: 'PAT-202412-001'
```

### **3. Entity-specific Functions**
```sql
-- Doctors (department-based)
SELECT generate_doctor_id('DEPT001'); -- Returns: 'CARD-DOC-202412-001'

-- Patients (standard)
SELECT generate_patient_id(); -- Returns: 'PAT-202412-001'

-- Appointments (department-based, derived from doctor)
SELECT generate_appointment_id('DEPT001'); -- Returns: 'CARD-APT-202412-001'

-- Medical Records (department-based, derived from doctor)
SELECT generate_medical_record_id('DEPT002'); -- Returns: 'NEUR-MR-202412-001'
```

## 🚀 Implementation Steps

### **Step 1: Clean Existing Data**
```sql
-- Run the cleanup script
\i backend/scripts/department-based-id-system.sql
```

### **Step 2: Populate Sample Data**
```sql
-- Run the sample data script
\i backend/scripts/sample-data-with-dept-ids.sql
```

### **Step 3: Verify Implementation**
```sql
-- Check generated IDs
SELECT doctor_id, full_name, department_id FROM doctors ORDER BY doctor_id;
SELECT patient_id, full_name FROM patients ORDER BY patient_id;
SELECT appointment_id, doctor_id FROM appointments ORDER BY appointment_id;
```

## 🔄 Auto-Generation Triggers

Hệ thống tự động tạo ID khi INSERT record mới:

### **Doctors:**
```sql
INSERT INTO doctors (profile_id, full_name, specialization, department_id, ...)
VALUES (uuid, 'BS. Nguyễn Văn A', 'Tim mạch', 'DEPT001', ...);
-- Tự động tạo: doctor_id = 'CARD-DOC-202412-001'
```

### **Appointments:**
```sql
INSERT INTO appointments (patient_id, doctor_id, appointment_date, ...)
VALUES ('PAT-202412-001', 'CARD-DOC-202412-001', '2024-12-15', ...);
-- Tự động tạo: appointment_id = 'CARD-APT-202412-001' (dựa trên doctor's department)
```

## 👤 User Registration Integration

### **Auth Trigger Function:**
Khi user đăng ký qua Supabase Auth, function `handle_new_user()` sẽ:

1. **Extract metadata** từ registration form
2. **Create profile** trong bảng profiles
3. **Generate department-based ID** cho doctor
4. **Create role-specific record** với ID mới

### **Registration Flow:**
```javascript
// Frontend registration
const { data, error } = await supabase.auth.signUp({
  email: 'doctor@example.com',
  password: 'password',
  options: {
    data: {
      role: 'doctor',
      full_name: 'BS. Nguyễn Văn A',
      specialty: 'Tim mạch',
      department_id: 'DEPT001'
    }
  }
});

// Backend auto-generates:
// - Profile record
// - Doctor record with ID: 'CARD-DOC-202412-001'
```

## 📊 Benefits

### **1. Business Logic Integration:**
- ✅ ID có ý nghĩa: `CARD-DOC-202412-001` = Bác sĩ tim mạch
- ✅ Dễ phân loại và báo cáo theo khoa
- ✅ Truy xuất nguồn gốc dễ dàng

### **2. Scalability:**
- ✅ Sequence riêng cho từng khoa/tháng
- ✅ Tránh conflict khi có nhiều khoa
- ✅ Có thể mở rộng cho multi-hospital

### **3. Maintenance:**
- ✅ Consistent pattern across all entities
- ✅ Auto-generation với triggers
- ✅ Easy to understand and debug

## 🔍 Troubleshooting

### **Common Issues:**

1. **Sequence not found:**
```sql
-- Sequences are created automatically, but if needed:
CREATE SEQUENCE IF NOT EXISTS CARD_DOC_monthly_seq START 1;
```

2. **Invalid department_id:**
```sql
-- Function will default to 'GEN' for unknown departments
SELECT get_department_code('INVALID'); -- Returns: 'GEN'
```

3. **Trigger not working:**
```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE '%auto_generate%';

-- Recreate trigger if needed
DROP TRIGGER IF EXISTS trigger_auto_generate_doctor_id ON doctors;
CREATE TRIGGER trigger_auto_generate_doctor_id
    BEFORE INSERT ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_entity_id();
```

## 📈 Monitoring

### **Check ID Generation:**
```sql
-- Monitor ID patterns
SELECT 
    SUBSTRING(doctor_id FROM 1 FOR 4) as dept_code,
    COUNT(*) as doctor_count
FROM doctors 
GROUP BY SUBSTRING(doctor_id FROM 1 FOR 4)
ORDER BY dept_code;
```

### **Sequence Status:**
```sql
-- Check sequence values
SELECT sequence_name, last_value 
FROM information_schema.sequences 
WHERE sequence_name LIKE '%monthly_seq'
ORDER BY sequence_name;
```

## 🎯 Next Steps

1. **Test thoroughly** với sample data
2. **Update frontend** để hiển thị ID mới
3. **Train users** về format ID mới
4. **Monitor performance** của sequences
5. **Plan backup strategy** cho sequences

## 📞 Support

Nếu có vấn đề với hệ thống ID:
1. Check trigger logs: `SELECT * FROM trigger_logs ORDER BY created_at DESC;`
2. Verify sequences: `SELECT * FROM information_schema.sequences;`
3. Test functions manually: `SELECT generate_doctor_id('DEPT001');`
