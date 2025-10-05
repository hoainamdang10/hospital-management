-- Patient Registry Service V2 - Seed Data
-- Sample data for development and testing
-- Author: Hospital Management Team
-- Version: 2.0.0

-- =====================================================
-- IMPORTANT: Run schema.sql first before running this file
-- =====================================================

-- =====================================================
-- 1. SAMPLE PATIENTS
-- =====================================================

-- Patient 1: Nguyễn Văn Minh (Active, with BHYT insurance)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_by,
  updated_by
) VALUES (
  'PAT-202501-001',
  '00000000-0000-0000-0000-000000000001'::UUID,  -- Replace with actual user_id from Identity Service
  '{
    "fullName": "Nguyễn Văn Minh",
    "dateOfBirth": "1980-05-15",
    "gender": "male",
    "nationalId": "001080012345",
    "nationality": "Vietnamese",
    "ethnicity": "Kinh",
    "occupation": "Kỹ sư phần mềm",
    "maritalStatus": "married"
  }'::JSONB,
  '{
    "primaryPhone": "0901234567",
    "secondaryPhone": "0287654321",
    "email": "nguyenvanminh@email.com",
    "preferredContactMethod": "phone",
    "address": {
      "street": "123 Đường Lê Lợi",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Vietnam"
    }
  }'::JSONB,
  '{
    "bloodType": "A+",
    "knownAllergies": ["Penicillin"],
    "chronicConditions": ["Cao huyết áp"],
    "currentMedications": ["Amlodipine 5mg"],
    "emergencyMedicalInfo": "Đang điều trị cao huyết áp"
  }'::JSONB,
  'active',
  'system',
  'system'
) ON CONFLICT (patient_id) DO NOTHING;

-- Patient 2: Trần Thị Lan (Active, with BHTN insurance)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_by,
  updated_by
) VALUES (
  'PAT-202501-002',
  '00000000-0000-0000-0000-000000000002'::UUID,
  '{
    "fullName": "Trần Thị Lan",
    "dateOfBirth": "1992-08-20",
    "gender": "female",
    "nationalId": "001092023456",
    "nationality": "Vietnamese",
    "ethnicity": "Kinh",
    "occupation": "Giáo viên",
    "maritalStatus": "single"
  }'::JSONB,
  '{
    "primaryPhone": "0912345678",
    "email": "tranthilan@email.com",
    "preferredContactMethod": "email",
    "address": {
      "street": "456 Đường Nguyễn Huệ",
      "ward": "Phường Bến Nghé",
      "district": "Quận 1",
      "city": "Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Vietnam"
    }
  }'::JSONB,
  '{
    "bloodType": "O+",
    "knownAllergies": ["Aspirin"],
    "chronicConditions": ["Hen suyễn"],
    "currentMedications": ["Ventolin inhaler"],
    "emergencyMedicalInfo": "Hen suyễn, cần thuốc xịt khẩn cấp"
  }'::JSONB,
  'active',
  'system',
  'system'
) ON CONFLICT (patient_id) DO NOTHING;

-- Patient 3: Lê Hoàng Nam (Active, private insurance)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_by,
  updated_by
) VALUES (
  'PAT-202501-003',
  '00000000-0000-0000-0000-000000000003'::UUID,
  '{
    "fullName": "Lê Hoàng Nam",
    "dateOfBirth": "1975-03-10",
    "gender": "male",
    "nationalId": "001075034567",
    "nationality": "Vietnamese",
    "ethnicity": "Kinh",
    "occupation": "Doanh nhân",
    "maritalStatus": "married"
  }'::JSONB,
  '{
    "primaryPhone": "0923456789",
    "secondaryPhone": "0283456789",
    "email": "lehoangnam@email.com",
    "preferredContactMethod": "phone",
    "address": {
      "street": "789 Đường Pasteur",
      "ward": "Phường 6",
      "district": "Quận 3",
      "city": "Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Vietnam"
    }
  }'::JSONB,
  '{
    "bloodType": "B+",
    "knownAllergies": [],
    "chronicConditions": ["Tiểu đường type 2"],
    "currentMedications": ["Metformin 500mg", "Insulin"],
    "emergencyMedicalInfo": "Tiểu đường type 2, cần insulin"
  }'::JSONB,
  'active',
  'system',
  'system'
) ON CONFLICT (patient_id) DO NOTHING;

-- Patient 4: Phạm Thị Hương (Active, no insurance)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_by,
  updated_by
) VALUES (
  'PAT-202501-004',
  '00000000-0000-0000-0000-000000000004'::UUID,
  '{
    "fullName": "Phạm Thị Hương",
    "dateOfBirth": "1988-11-25",
    "gender": "female",
    "nationalId": "001088045678",
    "nationality": "Vietnamese",
    "ethnicity": "Kinh",
    "occupation": "Y tá",
    "maritalStatus": "married"
  }'::JSONB,
  '{
    "primaryPhone": "0934567890",
    "email": "phamthihuong@email.com",
    "preferredContactMethod": "phone",
    "address": {
      "street": "321 Đường Cách Mạng Tháng 8",
      "ward": "Phường 10",
      "district": "Quận 3",
      "city": "Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Vietnam"
    }
  }'::JSONB,
  '{
    "bloodType": "AB+",
    "knownAllergies": ["Latex"],
    "chronicConditions": [],
    "currentMedications": [],
    "emergencyMedicalInfo": "Dị ứng latex"
  }'::JSONB,
  'active',
  'system',
  'system'
) ON CONFLICT (patient_id) DO NOTHING;

-- Patient 5: Võ Minh Tuấn (Inactive - for testing)
INSERT INTO patient_schema.patients (
  patient_id,
  user_id,
  personal_info,
  contact_info,
  basic_medical_info,
  status,
  created_by,
  updated_by
) VALUES (
  'PAT-202501-005',
  '00000000-0000-0000-0000-000000000005'::UUID,
  '{
    "fullName": "Võ Minh Tuấn",
    "dateOfBirth": "1995-07-18",
    "gender": "male",
    "nationalId": "001095056789",
    "nationality": "Vietnamese",
    "ethnicity": "Kinh",
    "occupation": "Sinh viên",
    "maritalStatus": "single"
  }'::JSONB,
  '{
    "primaryPhone": "0945678901",
    "email": "vominhtuan@email.com",
    "preferredContactMethod": "email",
    "address": {
      "street": "654 Đường Võ Văn Tần",
      "ward": "Phường 5",
      "district": "Quận 3",
      "city": "Hồ Chí Minh",
      "postalCode": "700000",
      "country": "Vietnam"
    }
  }'::JSONB,
  '{
    "bloodType": "O-",
    "knownAllergies": [],
    "chronicConditions": [],
    "currentMedications": [],
    "emergencyMedicalInfo": "Không có"
  }'::JSONB,
  'inactive',
  'system',
  'system'
) ON CONFLICT (patient_id) DO NOTHING;

-- =====================================================
-- 2. INSURANCE INFO
-- =====================================================

-- BHYT Insurance for Patient 1
INSERT INTO patient_schema.insurance_info (
  patient_id,
  provider,
  policy_number,
  valid_from,
  valid_to,
  coverage_type,
  is_vietnamese_insurance,
  bhyt_number,
  is_primary,
  is_active
) VALUES (
  'PAT-202501-001',
  'BHXH Việt Nam',
  'HN-1-01-2024-12345-67890',
  '2024-01-01',
  '2025-12-31',
  'BHYT',
  true,
  'HN-1-01-2024-12345-67890',
  true,
  true
) ON CONFLICT DO NOTHING;

-- BHTN Insurance for Patient 2
INSERT INTO patient_schema.insurance_info (
  patient_id,
  provider,
  policy_number,
  valid_from,
  valid_to,
  coverage_type,
  is_vietnamese_insurance,
  bhyt_number,
  is_primary,
  is_active
) VALUES (
  'PAT-202501-002',
  'Bảo Việt',
  'BHTN-2024-12345678',
  '2024-01-01',
  '2025-12-31',
  'BHTN',
  true,
  'BHTN-2024-12345678',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Private Insurance for Patient 3
INSERT INTO patient_schema.insurance_info (
  patient_id,
  provider,
  policy_number,
  valid_from,
  valid_to,
  coverage_type,
  is_vietnamese_insurance,
  is_primary,
  is_active
) VALUES (
  'PAT-202501-003',
  'Prudential Vietnam',
  'PRU-VN-2024-987654',
  '2024-01-01',
  '2025-12-31',
  'private',
  false,
  true,
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. EMERGENCY CONTACTS
-- =====================================================

-- Emergency contacts for Patient 1
INSERT INTO patient_schema.emergency_contacts (
  patient_id,
  full_name,
  relationship,
  phone_number,
  address,
  is_primary
) VALUES 
  ('PAT-202501-001', 'Nguyễn Thị Bình', 'Vợ', '0907654321', '123 Đường Lê Lợi, Q1, TP.HCM', true),
  ('PAT-202501-001', 'Nguyễn Văn Hùng', 'Anh trai', '0908765432', '456 Đường Nguyễn Huệ, Q1, TP.HCM', false)
ON CONFLICT DO NOTHING;

-- Emergency contacts for Patient 2
INSERT INTO patient_schema.emergency_contacts (
  patient_id,
  full_name,
  relationship,
  phone_number,
  is_primary
) VALUES 
  ('PAT-202501-002', 'Trần Văn Cường', 'Cha', '0909876543', true)
ON CONFLICT DO NOTHING;

-- Emergency contacts for Patient 3
INSERT INTO patient_schema.emergency_contacts (
  patient_id,
  full_name,
  relationship,
  phone_number,
  is_primary
) VALUES 
  ('PAT-202501-003', 'Lê Thị Mai', 'Vợ', '0910987654', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. PATIENT CONSENTS
-- =====================================================

-- Consents for Patient 1
INSERT INTO patient_schema.patient_consents (
  patient_id,
  consent_type,
  consent_given,
  consent_date,
  notes
) VALUES 
  ('PAT-202501-001', 'treatment', true, '2024-01-15', 'Đồng ý điều trị'),
  ('PAT-202501-001', 'data_sharing', true, '2024-01-15', 'Đồng ý chia sẻ dữ liệu y tế'),
  ('PAT-202501-001', 'research', false, '2024-01-15', 'Không đồng ý tham gia nghiên cứu')
ON CONFLICT DO NOTHING;

-- Consents for Patient 2
INSERT INTO patient_schema.patient_consents (
  patient_id,
  consent_type,
  consent_given,
  consent_date
) VALUES 
  ('PAT-202501-002', 'treatment', true, '2024-01-20'),
  ('PAT-202501-002', 'data_sharing', true, '2024-01-20')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Count patients
SELECT COUNT(*) as total_patients FROM patient_schema.patients;

-- Count active patients
SELECT COUNT(*) as active_patients FROM patient_schema.patients WHERE status = 'active';

-- Count patients with insurance
SELECT COUNT(*) as insured_patients FROM patient_schema.insurance_info WHERE is_active = true;

-- List all patients with their insurance status
SELECT 
  p.patient_id,
  p.personal_info->>'fullName' as full_name,
  p.status,
  CASE 
    WHEN i.id IS NOT NULL THEN 'Có bảo hiểm'
    ELSE 'Không có bảo hiểm'
  END as insurance_status,
  i.coverage_type
FROM patient_schema.patients p
LEFT JOIN patient_schema.insurance_info i ON p.patient_id = i.patient_id AND i.is_active = true
ORDER BY p.patient_id;

