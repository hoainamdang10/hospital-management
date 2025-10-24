-- =====================================================
-- Department Service V2 - Database Schema
-- Clean Architecture + DDD + Schema Per Service Pattern
-- =====================================================
-- Author: Hospital Management Team
-- Version: 2.0.0
-- Compliance: Schema Per Service, Vietnamese Healthcare Standards
-- Migration: 001_create_departments_schema
-- Date: 2025-01-07

-- Create departments schema if not exists
CREATE SCHEMA IF NOT EXISTS departments_schema;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. DEPARTMENTS TABLE (Main entity)
-- =====================================================
CREATE TABLE IF NOT EXISTS departments_schema.departments (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Department Identification
  department_code VARCHAR(10) UNIQUE NOT NULL,
  department_name_en VARCHAR(255) NOT NULL,
  department_name_vi VARCHAR(255) NOT NULL,
  
  -- Department Details
  description TEXT,
  
  -- Contact Information (Optional)
  phone VARCHAR(20),
  email VARCHAR(100),
  location VARCHAR(255),  -- Building/Floor
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Audit Fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  
  -- Constraints
  CONSTRAINT chk_department_code_format CHECK (department_code ~ '^[A-Z]{2,4}$'),
  CONSTRAINT chk_department_name_en_not_empty CHECK (LENGTH(TRIM(department_name_en)) > 0),
  CONSTRAINT chk_department_name_vi_not_empty CHECK (LENGTH(TRIM(department_name_vi)) > 0)
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments_schema.departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments_schema.departments(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_departments_name_en ON departments_schema.departments(department_name_en);
CREATE INDEX IF NOT EXISTS idx_departments_name_vi ON departments_schema.departments(department_name_vi);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE departments_schema.departments ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all authenticated users
CREATE POLICY departments_read_policy ON departments_schema.departments
  FOR SELECT
  USING (TRUE);

-- Policy: Allow insert/update/delete only for service role
CREATE POLICY departments_write_policy ON departments_schema.departments
  FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- 4. SEED DATA (8 Departments)
-- =====================================================
INSERT INTO departments_schema.departments (
  department_code, 
  department_name_en, 
  department_name_vi, 
  description,
  is_active
) VALUES
  -- Nhóm 1: Khoa Lâm sàng (5 khoa)
  ('CARD', 'Cardiology', 'Tim mạch', 
   'Chuyên khoa tim, mạch máu, huyết áp, bệnh lý tim mạch', TRUE),
  
  ('ORTH', 'Orthopedics', 'Chấn thương chỉnh hình', 
   'Chuyên khoa xương khớp, chấn thương, phẫu thuật chỉnh hình', TRUE),
  
  ('PEDI', 'Pediatrics', 'Nhi khoa', 
   'Chuyên khoa trẻ em, tiêm chủng, dinh dưỡng trẻ em', TRUE),
  
  ('INTE', 'Internal Medicine', 'Nội tổng quát', 
   'Khoa nội tổng quát, khám bệnh nội khoa, bệnh mãn tính', TRUE),
  
  ('EMER', 'Emergency', 'Cấp cứu', 
   'Khoa cấp cứu 24/7, xử lý các trường hợp khẩn cấp', TRUE),

  -- Nhóm 2: Khoa Cận lâm sàng (2 khoa)
  ('RADI', 'Radiology', 'Chẩn đoán hình ảnh', 
   'Khoa chụp X-quang, CT, MRI, siêu âm', TRUE),
  
  ('LABO', 'Laboratory', 'Xét nghiệm', 
   'Khoa xét nghiệm máu, nước tiểu, sinh hóa, vi sinh', TRUE),

  -- Nhóm 3: Khoa Hỗ trợ (1 khoa)
  ('ADMI', 'Administration', 'Hành chính', 
   'Khoa hành chính, tiếp nhận, quản lý hồ sơ, bảo hiểm y tế', TRUE)
ON CONFLICT (department_code) DO NOTHING;

-- =====================================================
-- 5. COMMENTS
-- =====================================================
COMMENT ON SCHEMA departments_schema IS 'Department Service V2 - Schema Per Service Pattern';
COMMENT ON TABLE departments_schema.departments IS 'Master data for hospital departments';
COMMENT ON COLUMN departments_schema.departments.department_code IS 'Unique department code (CARD, ORTH, PEDI, etc.)';
COMMENT ON COLUMN departments_schema.departments.department_name_en IS 'Department name in English';
COMMENT ON COLUMN departments_schema.departments.department_name_vi IS 'Department name in Vietnamese';
COMMENT ON COLUMN departments_schema.departments.is_active IS 'Whether the department is currently active';

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA departments_schema TO anon, authenticated, service_role;

-- Grant select on all tables to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA departments_schema TO anon, authenticated;

-- Grant all privileges to service role
GRANT ALL ON ALL TABLES IN SCHEMA departments_schema TO service_role;

