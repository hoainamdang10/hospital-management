# 🏥 Department-Based ID System

## Mô tả
Diagram hệ thống tạo ID dựa trên khoa (Department-based ID System) cho các entity trong hệ thống quản lý bệnh viện.

## Diagram

```mermaid
graph TD
    subgraph "ID Generation System"
        subgraph "Department Codes"
            CARD[CARD - Cardiology<br/>Tim mạch]
            NEUR[NEUR - Neurology<br/>Thần kinh]
            PEDI[PEDI - Pediatrics<br/>Nhi khoa]
            ORTH[ORTH - Orthopedics<br/>Chấn thương chỉnh hình]
            DERM[DERM - Dermatology<br/>Da liễu]
            GYNE[GYNE - Gynecology<br/>Phụ khoa]
            EMER[EMER - Emergency<br/>Cấp cứu]
            GENE[GENE - General<br/>Đa khoa]
        end
        
        subgraph "ID Format Patterns"
            subgraph "Department-based Entities"
                DOC_ID["{DEPT_CODE}-DOC-{YYYYMM}-{SEQ}<br/>Example: CARD-DOC-202412-001"]
                APP_ID["{DEPT_CODE}-APP-{YYYYMM}-{SEQ}<br/>Example: NEUR-APP-202412-015"]
                ROOM_ID["{DEPT_CODE}-ROOM-{SEQ}<br/>Example: PEDI-ROOM-101"]
            end
            
            subgraph "Standard Entities"
                PAT_ID["PAT-{YYYYMM}-{SEQ}<br/>Example: PAT-202412-001"]
                ADM_ID["ADM-{YYYYMM}-{SEQ}<br/>Example: ADM-202412-001"]
                BILL_ID["BILL-{YYYYMM}-{SEQ}<br/>Example: BILL-202412-001"]
                MED_ID["MED-{YYYYMM}-{SEQ}<br/>Example: MED-202412-001"]
            end
        end
        
        subgraph "Database Functions"
            GEN_DOC[generate_doctor_id(dept_id)<br/>Returns: DEPT-DOC-YYYYMM-XXX]
            GEN_PAT[generate_patient_id()<br/>Returns: PAT-YYYYMM-XXX]
            GEN_APP[generate_appointment_id(dept_id)<br/>Returns: DEPT-APP-YYYYMM-XXX]
            GEN_MED[generate_medical_record_id()<br/>Returns: MED-YYYYMM-XXX]
        end
        
        subgraph "Sequence Management"
            SEQ_DOC[(doctor_id_seq<br/>Per department per month)]
            SEQ_PAT[(patient_id_seq<br/>Global per month)]
            SEQ_APP[(appointment_id_seq<br/>Per department per month)]
            SEQ_MED[(medical_record_id_seq<br/>Global per month)]
        end
    end
    
    %% Department to ID Generation
    CARD --> DOC_ID
    NEUR --> DOC_ID
    PEDI --> DOC_ID
    ORTH --> DOC_ID
    
    CARD --> APP_ID
    NEUR --> APP_ID
    PEDI --> APP_ID
    
    %% Function connections
    GEN_DOC --> SEQ_DOC
    GEN_PAT --> SEQ_PAT
    GEN_APP --> SEQ_APP
    GEN_MED --> SEQ_MED
    
    %% ID Format connections
    DOC_ID --> GEN_DOC
    PAT_ID --> GEN_PAT
    APP_ID --> GEN_APP
    MED_ID --> GEN_MED
    
    %% Examples
    subgraph "Real Examples"
        EX1["Doctor: CARD-DOC-202412-001<br/>Dr. Nguyễn Văn A - Cardiologist"]
        EX2["Patient: PAT-202412-001<br/>Trần Thị B - First patient Dec 2024"]
        EX3["Appointment: NEUR-APP-202412-015<br/>15th neurology appointment Dec 2024"]
        EX4["Medical Record: MED-202412-001<br/>First medical record Dec 2024"]
    end
    
    %% Styling
    classDef department fill:#e3f2fd,stroke:#1976d2
    classDef idformat fill:#f3e5f5,stroke:#7b1fa2
    classDef function fill:#e8f5e8,stroke:#388e3c
    classDef sequence fill:#fff3e0,stroke:#f57c00
    classDef example fill:#fce4ec,stroke:#c2185b
    
    class CARD,NEUR,PEDI,ORTH,DERM,GYNE,EMER,GENE department
    class DOC_ID,APP_ID,ROOM_ID,PAT_ID,ADM_ID,BILL_ID,MED_ID idformat
    class GEN_DOC,GEN_PAT,GEN_APP,GEN_MED function
    class SEQ_DOC,SEQ_PAT,SEQ_APP,SEQ_MED sequence
    class EX1,EX2,EX3,EX4 example
```

## ID Format System

### **Department-based Entities**
Các entity thuộc về khoa cụ thể sử dụng format:
```
{DEPT_CODE}-{ENTITY}-{YYYYMM}-{SEQ}
```

**Examples:**
- `CARD-DOC-202412-001` - Bác sĩ tim mạch thứ 1 tháng 12/2024
- `NEUR-APP-202412-015` - Lịch hẹn thần kinh thứ 15 tháng 12/2024
- `PEDI-ROOM-101` - Phòng nhi khoa số 101

### **Standard Entities**
Các entity không thuộc khoa cụ thể sử dụng format:
```
{ENTITY}-{YYYYMM}-{SEQ}
```

**Examples:**
- `PAT-202412-001` - Bệnh nhân thứ 1 tháng 12/2024
- `MED-202412-001` - Hồ sơ bệnh án thứ 1 tháng 12/2024
- `BILL-202412-001` - Hóa đơn thứ 1 tháng 12/2024

## Department Code Mapping

### **Medical Departments**
- **CARD** - Cardiology (Tim mạch)
- **NEUR** - Neurology (Thần kinh)
- **PEDI** - Pediatrics (Nhi khoa)
- **ORTH** - Orthopedics (Chấn thương chỉnh hình)
- **DERM** - Dermatology (Da liễu)
- **GYNE** - Gynecology (Phụ khoa)
- **EMER** - Emergency (Cấp cứu)
- **GENE** - General (Đa khoa)

### **Additional Departments**
- **SURG** - Surgery (Phẫu thuật)
- **ONCO** - Oncology (Ung bướu)
- **PSYC** - Psychiatry (Tâm thần)
- **RADI** - Radiology (Chẩn đoán hình ảnh)

## Database Functions

### **ID Generation Functions**
```sql
-- Generate doctor ID
generate_doctor_id(department_id) → DEPT-DOC-YYYYMM-XXX

-- Generate patient ID
generate_patient_id() → PAT-YYYYMM-XXX

-- Generate appointment ID
generate_appointment_id(department_id) → DEPT-APP-YYYYMM-XXX

-- Generate medical record ID
generate_medical_record_id() → MED-YYYYMM-XXX
```

### **Sequence Management**
- **Per Department Per Month**: Doctor IDs, Appointment IDs
- **Global Per Month**: Patient IDs, Medical Record IDs
- **Auto-increment**: Sequence numbers reset monthly
- **Zero-padding**: 3-digit sequence (001, 002, ...)

## Business Benefits

### **Meaningful IDs**
- Instant identification of department
- Chronological ordering by month
- Easy tracking and reporting

### **Scalability**
- Department-specific sequences
- Monthly reset prevents overflow
- Supports unlimited growth

### **Data Integrity**
- Unique constraint enforcement
- Referential integrity
- Audit trail support

### **User Experience**
- Human-readable IDs
- Easy to communicate
- Professional appearance

## Implementation Details

### **Database Schema**
```sql
-- Sequence tables for each entity type
CREATE SEQUENCE doctor_id_seq;
CREATE SEQUENCE patient_id_seq;
CREATE SEQUENCE appointment_id_seq;
CREATE SEQUENCE medical_record_id_seq;

-- Department mapping table
CREATE TABLE departments (
    department_id VARCHAR(10) PRIMARY KEY,
    department_code VARCHAR(4) UNIQUE,
    department_name VARCHAR(100)
);
```

### **Function Examples**
```sql
-- Example function implementation
CREATE OR REPLACE FUNCTION generate_doctor_id(dept_id TEXT)
RETURNS TEXT AS $$
DECLARE
    dept_code TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    new_id TEXT;
BEGIN
    -- Get department code
    SELECT department_code INTO dept_code 
    FROM departments WHERE department_id = dept_id;
    
    -- Get current month
    current_month := TO_CHAR(NOW(), 'YYYYMM');
    
    -- Get next sequence number
    sequence_num := NEXTVAL('doctor_id_seq');
    
    -- Generate ID
    new_id := dept_code || '-DOC-' || current_month || '-' || 
              LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

## Usage Examples

### **Creating Records**
```sql
-- Create doctor
INSERT INTO doctors (doctor_id, ...) 
VALUES (generate_doctor_id('DEPT001'), ...);

-- Create patient
INSERT INTO patients (patient_id, ...) 
VALUES (generate_patient_id(), ...);

-- Create appointment
INSERT INTO appointments (appointment_id, ...) 
VALUES (generate_appointment_id('DEPT001'), ...);
```

### **Querying by Pattern**
```sql
-- Find all cardiology doctors in December 2024
SELECT * FROM doctors 
WHERE doctor_id LIKE 'CARD-DOC-202412-%';

-- Find all patients registered in 2024
SELECT * FROM patients 
WHERE patient_id LIKE 'PAT-2024%';
```
