-- Migration: Create Medical Imaging Table
-- Description: Medical imaging records for radiology studies (X-Ray, CT, MRI, Ultrasound, etc.)
-- Author: Hospital Management Team
-- Date: 2025-01-11
-- Version: 2.0.0

-- =====================================================
-- CREATE MEDICAL IMAGING TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS clinical_schema.medical_imaging (
  -- Primary Key
  imaging_id VARCHAR(255) PRIMARY KEY,
  
  -- Foreign Keys
  record_id VARCHAR(255) NOT NULL,
  patient_id VARCHAR(255) NOT NULL,
  
  -- Imaging Details
  imaging_type VARCHAR(50) NOT NULL,
  modality VARCHAR(10) NOT NULL,
  body_part VARCHAR(100) NOT NULL,
  laterality VARCHAR(20),
  
  -- Study Information
  study_date TIMESTAMP NOT NULL,
  study_description TEXT,
  clinical_indication TEXT,
  
  -- Ordering Information
  ordered_by VARCHAR(255) NOT NULL,
  ordered_at TIMESTAMP NOT NULL,
  priority VARCHAR(20) DEFAULT 'routine',
  
  -- Results
  findings TEXT,
  impression TEXT,
  radiologist_id VARCHAR(255),
  reported_at TIMESTAMP,
  verified_by VARCHAR(255),
  verified_at TIMESTAMP,
  
  -- Images & Files
  image_urls TEXT[], -- Array of PACS image URLs
  dicom_study_uid VARCHAR(255),
  series_count INTEGER DEFAULT 0,
  instance_count INTEGER DEFAULT 0,
  
  -- Status & Workflow
  status VARCHAR(50) DEFAULT 'ordered',
  
  -- Technical Details
  technique TEXT,
  contrast_used BOOLEAN DEFAULT false,
  contrast_type VARCHAR(100),
  radiation_dose DECIMAL(10, 2),
  
  -- Additional Information
  notes TEXT,
  
  -- Audit Fields
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_medical_imaging_record FOREIGN KEY (record_id) 
    REFERENCES clinical_schema.medical_records(record_id) ON DELETE CASCADE,
  CONSTRAINT chk_imaging_type CHECK (imaging_type IN (
    'x_ray', 'ct_scan', 'mri', 'ultrasound', 'pet_scan', 
    'mammography', 'fluoroscopy', 'nuclear_medicine', 'other'
  )),
  CONSTRAINT chk_modality CHECK (modality IN (
    'CR', 'DX', 'CT', 'MR', 'US', 'PT', 'MG', 'XA', 'NM', 'OTHER'
  )),
  CONSTRAINT chk_status CHECK (status IN (
    'ordered', 'scheduled', 'in_progress', 'completed', 
    'reported', 'verified', 'cancelled'
  )),
  CONSTRAINT chk_priority CHECK (priority IN (
    'routine', 'urgent', 'stat', 'asap'
  ))
);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX idx_medical_imaging_patient ON clinical_schema.medical_imaging(patient_id);
CREATE INDEX idx_medical_imaging_record ON clinical_schema.medical_imaging(record_id);
CREATE INDEX idx_medical_imaging_type ON clinical_schema.medical_imaging(imaging_type);
CREATE INDEX idx_medical_imaging_modality ON clinical_schema.medical_imaging(modality);
CREATE INDEX idx_medical_imaging_status ON clinical_schema.medical_imaging(status);
CREATE INDEX idx_medical_imaging_study_date ON clinical_schema.medical_imaging(study_date);
CREATE INDEX idx_medical_imaging_radiologist ON clinical_schema.medical_imaging(radiologist_id);
CREATE INDEX idx_medical_imaging_created_at ON clinical_schema.medical_imaging(created_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE clinical_schema.medical_imaging ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own imaging records
CREATE POLICY medical_imaging_select_own ON clinical_schema.medical_imaging
  FOR SELECT
  USING (
    patient_id = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'DOCTOR', 'NURSE', 'RADIOLOGIST')
    )
  );

-- Policy: Only authorized staff can insert imaging records
CREATE POLICY medical_imaging_insert_staff ON clinical_schema.medical_imaging
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'DOCTOR', 'RADIOLOGIST')
    )
  );

-- Policy: Only authorized staff can update imaging records
CREATE POLICY medical_imaging_update_staff ON clinical_schema.medical_imaging
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' IN ('ADMIN', 'DOCTOR', 'RADIOLOGIST')
    )
  );

-- Policy: Only admins can delete imaging records
CREATE POLICY medical_imaging_delete_admin ON clinical_schema.medical_imaging
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'ADMIN'
    )
  );

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE clinical_schema.medical_imaging IS 'Medical imaging records for radiology studies';
COMMENT ON COLUMN clinical_schema.medical_imaging.imaging_id IS 'Unique identifier (format: IMG-{uuid})';
COMMENT ON COLUMN clinical_schema.medical_imaging.modality IS 'DICOM modality code (CR, DX, CT, MR, US, PT, MG, XA, NM)';
COMMENT ON COLUMN clinical_schema.medical_imaging.image_urls IS 'Array of PACS image URLs';
COMMENT ON COLUMN clinical_schema.medical_imaging.dicom_study_uid IS 'DICOM Study Instance UID';

