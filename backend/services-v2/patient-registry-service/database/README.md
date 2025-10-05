# Database Schema & Seed Data

## Overview

This directory contains database schema and seed data for the Patient Registry Service.

## Files

- **`schema.sql`** - Database schema (tables, indexes, constraints)
- **`seed.sql`** - Sample data for development and testing

## Setup

### 1. Create Schema

Run the schema SQL in Supabase SQL Editor:

```bash
# Copy schema.sql content and paste into Supabase SQL Editor
# Or use psql:
psql -h your-supabase-host -U postgres -d postgres -f database/schema.sql
```

### 2. Seed Database

Seed the database with sample data:

```bash
# Seed database (adds sample data)
npm run db:seed

# Clean seed data (removes all data created by system)
npm run db:seed:clean

# Reset (clean + seed)
npm run db:seed:reset
```

## Sample Data

### Patients (5 patients)

| Patient ID | Name | Status | Insurance |
|------------|------|--------|-----------|
| PAT-202501-001 | Nguyễn Văn Minh | Active | BHYT |
| PAT-202501-002 | Trần Thị Lan | Active | BHTN |
| PAT-202501-003 | Lê Hoàng Nam | Active | Private |
| PAT-202501-004 | Phạm Thị Hương | Active | None |
| PAT-202501-005 | Võ Minh Tuấn | Inactive | None |

### Patient Details

#### Patient 1: Nguyễn Văn Minh
- **DOB**: 1980-05-15
- **Gender**: Male
- **National ID**: 001080012345
- **Phone**: 0901234567
- **Email**: nguyenvanminh@email.com
- **Address**: 123 Đường Lê Lợi, Q1, TP.HCM
- **Blood Type**: A+
- **Allergies**: Penicillin
- **Chronic Conditions**: Cao huyết áp
- **Insurance**: BHYT (HN-1-01-2024-12345-67890)
- **Emergency Contact**: Nguyễn Thị Bình (Vợ) - 0907654321

#### Patient 2: Trần Thị Lan
- **DOB**: 1992-08-20
- **Gender**: Female
- **National ID**: 001092023456
- **Phone**: 0912345678
- **Email**: tranthilan@email.com
- **Address**: 456 Đường Nguyễn Huệ, Q1, TP.HCM
- **Blood Type**: O+
- **Allergies**: Aspirin
- **Chronic Conditions**: Hen suyễn
- **Insurance**: BHTN (BHTN-2024-12345678)
- **Emergency Contact**: Trần Văn Cường (Cha) - 0909876543

#### Patient 3: Lê Hoàng Nam
- **DOB**: 1975-03-10
- **Gender**: Male
- **National ID**: 001075034567
- **Phone**: 0923456789
- **Email**: lehoangnam@email.com
- **Address**: 789 Đường Pasteur, Q3, TP.HCM
- **Blood Type**: B+
- **Chronic Conditions**: Tiểu đường type 2
- **Insurance**: Prudential (PRU-VN-2024-987654)
- **Emergency Contact**: Lê Thị Mai (Vợ) - 0910987654

#### Patient 4: Phạm Thị Hương
- **DOB**: 1988-11-25
- **Gender**: Female
- **National ID**: 001088045678
- **Phone**: 0934567890
- **Email**: phamthihuong@email.com
- **Address**: 321 Đường Cách Mạng Tháng 8, Q3, TP.HCM
- **Blood Type**: AB+
- **Allergies**: Latex
- **Insurance**: None
- **Emergency Contact**: N/A

#### Patient 5: Võ Minh Tuấn (Inactive)
- **DOB**: 1995-07-18
- **Gender**: Male
- **National ID**: 001095056789
- **Phone**: 0945678901
- **Email**: vominhtuan@email.com
- **Address**: 654 Đường Võ Văn Tần, Q3, TP.HCM
- **Blood Type**: O-
- **Status**: Inactive (for testing)

### Insurance Types

1. **BHYT** (Bảo hiểm y tế) - Vietnamese social health insurance
   - Format: XX-Y-ZZ-YYYY-NNNNN-CCCCC
   - Example: HN-1-01-2024-12345-67890

2. **BHTN** (Bảo hiểm tai nạn) - Vietnamese accident insurance
   - Format: BHTN-YYYY-NNNNNNNN
   - Example: BHTN-2024-12345678

3. **Private** - Private health insurance
   - Example: PRU-VN-2024-987654

### Emergency Contacts

- 6 emergency contacts across 3 patients
- Includes primary and secondary contacts
- Relationships: Vợ (Wife), Cha (Father), Anh trai (Brother)

### Patient Consents

- Treatment consent
- Data sharing consent
- Research participation consent

## Database Schema

### Tables

1. **`patient_schema.patients`** - Main patient records
   - Personal info (JSONB)
   - Contact info (JSONB)
   - Basic medical info (JSONB)
   - Status (active, inactive, deceased, merged)

2. **`patient_schema.insurance_info`** - Insurance records
   - BHYT, BHTN, private insurance
   - Validity dates
   - Active status

3. **`patient_schema.emergency_contacts`** - Emergency contacts
   - Full name, relationship, phone
   - Primary contact flag

4. **`patient_schema.patient_consents`** - HIPAA consents
   - Treatment, data sharing, research
   - Consent date and notes

5. **`patient_schema.patient_links`** - Patient relationships
   - Duplicate detection
   - Family relationships

## Verification Queries

### Count Patients

```sql
SELECT COUNT(*) as total_patients 
FROM patient_schema.patients;
```

### Count Active Patients

```sql
SELECT COUNT(*) as active_patients 
FROM patient_schema.patients 
WHERE status = 'active';
```

### List Patients with Insurance

```sql
SELECT 
  p.patient_id,
  p.personal_info->>'fullName' as full_name,
  p.status,
  i.coverage_type,
  i.policy_number
FROM patient_schema.patients p
LEFT JOIN patient_schema.insurance_info i 
  ON p.patient_id = i.patient_id 
  AND i.is_active = true
ORDER BY p.patient_id;
```

### Find Patients by Blood Type

```sql
SELECT 
  patient_id,
  personal_info->>'fullName' as full_name,
  basic_medical_info->>'bloodType' as blood_type
FROM patient_schema.patients
WHERE basic_medical_info->>'bloodType' = 'O+';
```

### Find Patients with Allergies

```sql
SELECT 
  patient_id,
  personal_info->>'fullName' as full_name,
  basic_medical_info->'knownAllergies' as allergies
FROM patient_schema.patients
WHERE jsonb_array_length(basic_medical_info->'knownAllergies') > 0;
```

## Testing

Use seed data for:

1. **Development** - Test UI with realistic data
2. **Integration Tests** - Verify service communication
3. **Demo** - Show features to stakeholders
4. **Performance Testing** - Load testing with sample data

## Cleanup

To remove all seed data:

```bash
npm run db:seed:clean
```

This will delete all records where `created_by = 'system'`.

## Notes

- **User IDs**: Replace placeholder UUIDs with actual user IDs from Identity Service
- **Timestamps**: All records use current timestamp
- **Conflicts**: Seed script uses `ON CONFLICT DO NOTHING` to prevent duplicates
- **JSONB**: Personal info, contact info, and medical info stored as JSONB for flexibility

## Troubleshooting

### Error: "relation does not exist"

Run `schema.sql` first to create tables.

### Error: "duplicate key value"

Data already exists. Use `npm run db:seed:reset` to clean and reseed.

### Error: "permission denied"

Check Supabase service role key has admin permissions.

---

**Last Updated**: 2025-01-04  
**Maintained By**: Hospital Management Team

