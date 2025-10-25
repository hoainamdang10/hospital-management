-- =====================================================
-- Notifications Service - Notification Templates Table
-- =====================================================
-- Purpose: Store notification templates (Vietnamese healthcare focus)
-- Compliance: Vietnamese Healthcare Standards, HIPAA
-- =====================================================

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notifications_schema.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Identifier
  template_id TEXT NOT NULL UNIQUE,
  template_type TEXT NOT NULL,
  
  -- Template Name & Description
  name TEXT NOT NULL,
  description TEXT,
  
  -- Language Support (Vietnamese + English)
  language TEXT NOT NULL DEFAULT 'vi' CHECK (language IN ('vi', 'en')),
  
  -- Template Content
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  html_template TEXT,
  sms_template TEXT, -- Short version for SMS (160 chars max)
  push_template TEXT, -- Short version for push notifications
  
  -- Channel Support
  supported_channels TEXT[] NOT NULL DEFAULT ARRAY['EMAIL', 'SMS']::TEXT[],
  
  -- Placeholders
  placeholders JSONB NOT NULL DEFAULT '[]'::JSONB, -- [{key, description, required, type, example}]
  required_placeholders TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Priority & Category
  priority TEXT NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
  category TEXT, -- 'appointment', 'billing', 'medical', 'emergency', 'reminder'
  
  -- Template Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  
  -- Vietnamese Healthcare Compliance
  is_vietnamese_healthcare_compliant BOOLEAN NOT NULL DEFAULT FALSE,
  hipaa_compliant BOOLEAN NOT NULL DEFAULT TRUE,
  moh_compliant BOOLEAN NOT NULL DEFAULT FALSE, -- Ministry of Health compliance
  
  -- Usage Statistics
  usage_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failure_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Performance Metrics
  avg_delivery_time_ms INTEGER,
  avg_success_rate DECIMAL(5,2),
  
  -- Template Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  parent_template_id TEXT, -- For template versions
  
  -- Tags & Search
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  searchable_text TEXT, -- For full-text search
  
  -- Audit Fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  updated_by TEXT,
  
  -- Soft Delete
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by TEXT
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary lookup
CREATE INDEX idx_templates_template_id ON notifications_schema.notification_templates(template_id);
CREATE INDEX idx_templates_template_type ON notifications_schema.notification_templates(template_type);

-- Active templates query
CREATE INDEX idx_templates_active ON notifications_schema.notification_templates(is_active, is_approved)
WHERE is_deleted = FALSE;

-- Language queries
CREATE INDEX idx_templates_language ON notifications_schema.notification_templates(language, template_type)
WHERE is_active = TRUE AND is_deleted = FALSE;

-- Category and priority
CREATE INDEX idx_templates_category ON notifications_schema.notification_templates(category);
CREATE INDEX idx_templates_priority ON notifications_schema.notification_templates(priority);

-- Usage statistics
CREATE INDEX idx_templates_usage_count ON notifications_schema.notification_templates(usage_count DESC);
CREATE INDEX idx_templates_success_rate ON notifications_schema.notification_templates(avg_success_rate DESC);

-- Tags (GIN index for array)
CREATE INDEX idx_templates_tags ON notifications_schema.notification_templates USING GIN (tags);

-- Full-text search
CREATE INDEX idx_templates_searchable_text ON notifications_schema.notification_templates 
USING GIN (to_tsvector('english', COALESCE(searchable_text, '')));

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE notifications_schema.notification_templates ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role has full access to templates"
  ON notifications_schema.notification_templates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can view active approved templates
CREATE POLICY "Authenticated users can view active templates"
  ON notifications_schema.notification_templates
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE AND is_approved = TRUE AND is_deleted = FALSE);

-- =====================================================
-- Trigger for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_templates_updated_at
  BEFORE UPDATE ON notifications_schema.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.update_templates_updated_at();

-- =====================================================
-- Trigger for searchable_text generation
-- =====================================================

CREATE OR REPLACE FUNCTION notifications_schema.generate_template_searchable_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.searchable_text = CONCAT(
    COALESCE(NEW.name, ''), ' ',
    COALESCE(NEW.description, ''), ' ',
    COALESCE(NEW.template_type, ''), ' ',
    COALESCE(NEW.category, ''), ' ',
    ARRAY_TO_STRING(COALESCE(NEW.tags, ARRAY[]::TEXT[]), ' ')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_searchable_text
  BEFORE INSERT OR UPDATE ON notifications_schema.notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION notifications_schema.generate_template_searchable_text();

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to increment template usage
CREATE OR REPLACE FUNCTION notifications_schema.increment_template_usage(
  p_template_id TEXT,
  p_success BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications_schema.notification_templates
  SET 
    usage_count = usage_count + 1,
    success_count = success_count + CASE WHEN p_success THEN 1 ELSE 0 END,
    failure_count = failure_count + CASE WHEN p_success THEN 0 ELSE 1 END,
    last_used_at = NOW(),
    avg_success_rate = CASE 
      WHEN usage_count + 1 > 0 THEN 
        ROUND(((success_count + CASE WHEN p_success THEN 1 ELSE 0 END)::DECIMAL / (usage_count + 1) * 100), 2)
      ELSE 0.00
    END,
    updated_at = NOW()
  WHERE template_id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get active template by type and language
CREATE OR REPLACE FUNCTION notifications_schema.get_active_template(
  p_template_type TEXT,
  p_language TEXT DEFAULT 'vi'
)
RETURNS TABLE (
  template_id TEXT,
  subject_template TEXT,
  body_template TEXT,
  html_template TEXT,
  sms_template TEXT,
  push_template TEXT,
  placeholders JSONB,
  supported_channels TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.template_id,
    t.subject_template,
    t.body_template,
    t.html_template,
    t.sms_template,
    t.push_template,
    t.placeholders,
    t.supported_channels
  FROM notifications_schema.notification_templates t
  WHERE 
    t.template_type = p_template_type
    AND t.language = p_language
    AND t.is_active = TRUE
    AND t.is_approved = TRUE
    AND t.is_deleted = FALSE
  ORDER BY t.version DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Insert Default Vietnamese Healthcare Templates
-- =====================================================

-- Appointment Confirmation Template (Vietnamese)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
  sms_template,
  push_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  moh_compliant,
  tags,
  created_by
) VALUES (
  'appointment-confirmation-vi',
  'APPOINTMENT_CONFIRMATION',
  'Xác Nhận Lịch Hẹn',
  'Template xác nhận lịch hẹn khám bệnh',
  'vi',
  'Xác nhận lịch hẹn khám bệnh - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nChúng tôi xác nhận lịch hẹn khám bệnh của quý khách:\n\nThời gian: {{appointmentDate}} lúc {{appointmentTime}}\nBác sĩ: {{doctorName}}\nPhòng khám: {{roomNumber}}\nĐịa chỉ: {{hospitalAddress}}\n\nVui lòng đến trước 15 phút để làm thủ tục.\n\nHotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif;"><p>Kính gửi <strong>{{patientName}}</strong>,</p><p>Chúng tôi xác nhận lịch hẹn khám bệnh của quý khách:</p><ul><li>Thời gian: <strong>{{appointmentDate}}</strong> lúc <strong>{{appointmentTime}}</strong></li><li>Bác sĩ: <strong>{{doctorName}}</strong></li><li>Phòng khám: <strong>{{roomNumber}}</strong></li><li>Địa chỉ: {{hospitalAddress}}</li></ul><p>Vui lòng đến trước 15 phút để làm thủ tục.</p><p>Hotline: <strong>{{contactPhone}}</strong></p><p>Trân trọng,<br/>{{hospitalName}}</p></div>',
  'Lich hen: {{appointmentDate}} {{appointmentTime}} - BS {{doctorName}} - Phong {{roomNumber}} - {{hospitalName}} - {{contactPhone}}',
  'Lịch hẹn {{appointmentDate}} {{appointmentTime}} với BS {{doctorName}}',
  ARRAY['EMAIL', 'SMS', 'PUSH'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string", "example": "Nguyễn Văn A"},
    {"key": "appointmentDate", "description": "Ngày hẹn", "required": true, "type": "date", "example": "15/01/2025"},
    {"key": "appointmentTime", "description": "Giờ hẹn", "required": true, "type": "time", "example": "09:00"},
    {"key": "doctorName", "description": "Tên bác sĩ", "required": true, "type": "string", "example": "BS. Trần Thị B"},
    {"key": "roomNumber", "description": "Số phòng", "required": false, "type": "string", "example": "P101"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string", "example": "Bệnh viện Đa khoa"},
    {"key": "hospitalAddress", "description": "Địa chỉ bệnh viện", "required": false, "type": "string", "example": "123 Đường ABC, Quận XYZ"},
    {"key": "contactPhone", "description": "Số điện thoại liên hệ", "required": true, "type": "string", "example": "1900-xxxx"}
  ]'::JSONB,
  ARRAY['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'hospitalName', 'contactPhone'],
  'NORMAL',
  'appointment',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['appointment', 'confirmation', 'vietnamese', 'healthcare'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- Appointment Reminder Template (Vietnamese)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  sms_template,
  push_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  is_vietnamese_healthcare_compliant,
  tags,
  created_by
) VALUES (
  'appointment-reminder-vi',
  'APPOINTMENT_REMINDER',
  'Nhắc Nhở Lịch Hẹn',
  'Template nhắc nhở lịch hẹn sắp tới',
  'vi',
  'Nhắc nhở: Lịch hẹn ngày mai - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nĐây là lời nhắc về lịch hẹn khám bệnh của quý khách:\n\nThời gian: {{appointmentDate}} lúc {{appointmentTime}}\nBác sĩ: {{doctorName}}\nPhòng: {{roomNumber}}\n\nVui lòng đến đúng giờ.\n\nLiên hệ: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  'Nho lich hen: {{appointmentDate}} {{appointmentTime}} - BS {{doctorName}} - {{hospitalName}}',
  'Nhắc: Lịch hẹn ngày mai {{appointmentTime}} với BS {{doctorName}}',
  ARRAY['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "appointmentDate", "description": "Ngày hẹn", "required": true, "type": "date"},
    {"key": "appointmentTime", "description": "Giờ hẹn", "required": true, "type": "time"},
    {"key": "doctorName", "description": "Tên bác sĩ", "required": true, "type": "string"},
    {"key": "roomNumber", "description": "Số phòng", "required": false, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Số điện thoại", "required": true, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'appointmentDate', 'appointmentTime', 'doctorName', 'hospitalName'],
  'HIGH',
  'reminder',
  TRUE,
  TRUE,
  TRUE,
  ARRAY['appointment', 'reminder', 'vietnamese'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- Test Results Ready Template (Vietnamese)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  is_vietnamese_healthcare_compliant,
  hipaa_compliant,
  tags,
  created_by
) VALUES (
  'test-results-ready-vi',
  'TEST_RESULTS_READY',
  'Kết Quả Xét Nghiệm',
  'Template thông báo kết quả xét nghiệm đã có',
  'vi',
  'Kết quả xét nghiệm đã sẵn sàng - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nKết quả xét nghiệm của quý khách đã sẵn sàng:\n\nLoại XN: {{testType}}\nMã XN: {{testCode}}\nNgày lấy mẫu: {{sampleDate}}\n\nXem kết quả tại: {{onlinePortalUrl}}\n\nLiên hệ: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  'KQ xet nghiem {{testCode}} da san sang. Xem tai: {{onlinePortalUrl}}',
  ARRAY['EMAIL', 'SMS', 'PUSH'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "testType", "description": "Loại xét nghiệm", "required": true, "type": "string"},
    {"key": "testCode", "description": "Mã xét nghiệm", "required": true, "type": "string"},
    {"key": "sampleDate", "description": "Ngày lấy mẫu", "required": true, "type": "date"},
    {"key": "onlinePortalUrl", "description": "Link xem kết quả", "required": true, "type": "url"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Số điện thoại", "required": true, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'testType', 'testCode', 'onlinePortalUrl', 'hospitalName'],
  'NORMAL',
  'medical',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['test-results', 'medical', 'vietnamese', 'hipaa'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- Payment Reminder Template (Vietnamese)
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  sms_template,
  supported_channels,
  placeholders,
  required_placeholders,
  priority,
  category,
  is_active,
  is_approved,
  tags,
  created_by
) VALUES (
  'payment-reminder-vi',
  'PAYMENT_REMINDER',
  'Nhắc Thanh Toán',
  'Template nhắc thanh toán viện phí',
  'vi',
  'Nhắc thanh toán hóa đơn {{invoiceNumber}} - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nQuý khách có hóa đơn cần thanh toán:\n\nSố hóa đơn: {{invoiceNumber}}\nSố tiền: {{amount}} VNĐ\nHạn thanh toán: {{dueDate}}\n\nThanh toán tại: {{paymentUrl}}\n\nHotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  'Nho thanh toan HD {{invoiceNumber}}: {{amount}}d. Han: {{dueDate}}. Link: {{paymentUrl}}',
  ARRAY['EMAIL', 'SMS'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "invoiceNumber", "description": "Số hóa đơn", "required": true, "type": "string"},
    {"key": "amount", "description": "Số tiền", "required": true, "type": "number"},
    {"key": "dueDate", "description": "Hạn thanh toán", "required": true, "type": "date"},
    {"key": "paymentUrl", "description": "Link thanh toán", "required": true, "type": "url"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Số điện thoại", "required": true, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'invoiceNumber', 'amount', 'dueDate', 'hospitalName'],
  'NORMAL',
  'billing',
  TRUE,
  TRUE,
  ARRAY['payment', 'billing', 'reminder', 'vietnamese'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON notifications_schema.notification_templates TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.increment_template_usage TO service_role;
GRANT EXECUTE ON FUNCTION notifications_schema.get_active_template TO service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE notifications_schema.notification_templates IS 
'Notification templates with Vietnamese healthcare focus. Supports multi-language, multi-channel templates.';

COMMENT ON COLUMN notifications_schema.notification_templates.is_vietnamese_healthcare_compliant IS 
'Indicates if template follows Vietnamese healthcare communication standards';

COMMENT ON COLUMN notifications_schema.notification_templates.moh_compliant IS 
'Indicates if template is compliant with Vietnam Ministry of Health regulations';

COMMENT ON FUNCTION notifications_schema.get_active_template IS 
'Get active approved template by type and language. Returns empty set if no matching template found.';

