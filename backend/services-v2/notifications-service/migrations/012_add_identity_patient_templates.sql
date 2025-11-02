-- Migration: Add Identity Service and Patient Registry Service Templates
-- Created: 2025-10-30
-- Description: Insert templates for Identity and Patient Registry events

-- ========================================
-- IDENTITY SERVICE TEMPLATES
-- ========================================

-- 1. USER_WELCOME - Welcome email for new users
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
  'user-welcome-vi',
  'USER_WELCOME',
  'Chào Mừng Người Dùng Mới',
  'Email chào mừng người dùng mới đăng ký tài khoản',
  'vi',
  'Chào mừng đến với {{hospitalName}}',
  E'Kính gửi {{firstName}} {{lastName}},\n\nChào mừng bạn đến với {{hospitalName}}!\n\nTài khoản của bạn đã được tạo thành công:\n- Email: {{email}}\n- Vai trò: {{role}}\n\nVui lòng xác thực email của bạn để kích hoạt tài khoản.\n\nNếu bạn cần hỗ trợ, vui lòng liên hệ:\nHotline: {{contactPhone}}\nEmail: support@hospital.com\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Chào mừng đến với {{hospitalName}}!</h2><p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p><p>Tài khoản của bạn đã được tạo thành công.</p><div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Email:</strong> {{email}}</p><p style="margin: 5px 0;"><strong>Vai trò:</strong> {{role}}</p></div><p>Vui lòng xác thực email để kích hoạt tài khoản.</p><p style="margin-top: 30px;">Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  NULL,
  ARRAY['EMAIL'],
  '[
    {"key": "firstName", "description": "Tên người dùng", "required": true, "type": "string", "example": "Nguyễn"},
    {"key": "lastName", "description": "Họ người dùng", "required": true, "type": "string", "example": "Văn A"},
    {"key": "email", "description": "Email người dùng", "required": true, "type": "string", "example": "user@example.com"},
    {"key": "role", "description": "Vai trò", "required": true, "type": "string", "example": "PATIENT"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string", "example": "Bệnh viện Đa khoa"},
    {"key": "contactPhone", "description": "Số điện thoại hỗ trợ", "required": false, "type": "string", "example": "1900-xxxx"}
  ]'::JSONB,
  ARRAY['firstName', 'lastName', 'email', 'role', 'hospitalName'],
  'NORMAL',
  'identity',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['identity', 'welcome', 'user', 'registration'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  is_approved = EXCLUDED.is_approved,
  updated_at = NOW();

-- 2. ACCOUNT_ACTIVATED - Account activation confirmation
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
  'account-activated-vi',
  'ACCOUNT_ACTIVATED',
  'Tài Khoản Đã Được Kích Hoạt',
  'Xác nhận tài khoản đã được kích hoạt thành công',
  'vi',
  'Tài khoản của bạn đã được kích hoạt - {{hospitalName}}',
  E'Kính gửi {{firstName}} {{lastName}},\n\nTài khoản của bạn ({{email}}) đã được kích hoạt thành công!\n\nBạn có thể đăng nhập và sử dụng đầy đủ các tính năng của hệ thống.\n\nThời gian kích hoạt: {{activatedAt}}\n\nNếu bạn không thực hiện hành động này, vui lòng liên hệ ngay:\nHotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">✓ Tài khoản đã được kích hoạt!</h2><p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p><p>Tài khoản <strong>{{email}}</strong> đã được kích hoạt thành công.</p><p>Bạn có thể đăng nhập và sử dụng đầy đủ các tính năng.</p><div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;"><p style="margin: 0;"><strong>Thời gian:</strong> {{activatedAt}}</p></div><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  'Tai khoan {{email}} da duoc kich hoat thanh cong - {{hospitalName}}',
  ARRAY['EMAIL', 'SMS'],
  '[
    {"key": "firstName", "description": "Tên người dùng", "required": true, "type": "string"},
    {"key": "lastName", "description": "Họ người dùng", "required": true, "type": "string"},
    {"key": "email", "description": "Email", "required": true, "type": "string"},
    {"key": "activatedAt", "description": "Thời gian kích hoạt", "required": true, "type": "datetime"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['firstName', 'lastName', 'email', 'activatedAt', 'hospitalName'],
  'NORMAL',
  'identity',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['identity', 'activation', 'account', 'security'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. PASSWORD_RESET - Password reset confirmation
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
  'password-reset-vi',
  'PASSWORD_RESET',
  'Đặt Lại Mật Khẩu',
  'Email xác nhận đặt lại mật khẩu',
  'vi',
  '🔒 Yêu cầu đặt lại mật khẩu - {{hospitalName}}',
  E'Kính gửi {{firstName}} {{lastName}},\n\nChúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản {{email}}.\n\nNhấn vào link dưới đây để đặt lại mật khẩu (có hiệu lực trong 1 giờ):\n{{resetLink}}\n\nMã xác nhận: {{resetToken}}\n\nNếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n⚠️ LƯU Ý BẢO MẬT:\n- Không chia sẻ link này với bất kỳ ai\n- Tạo mật khẩu mạnh với ít nhất 8 ký tự\n- Sử dụng kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt\n\nHotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #ef4444;">🔒 Đặt lại mật khẩu</h2><p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p><p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho <strong>{{email}}</strong>.</p><div style="text-align: center; margin: 30px 0;"><a href="{{resetLink}}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Đặt Lại Mật Khẩu</a></div><div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;"><p style="margin: 5px 0; color: #991b1b;"><strong>⚠️ LƯU Ý BẢO MẬT:</strong></p><ul style="margin: 10px 0; padding-left: 20px; color: #991b1b;"><li>Không chia sẻ link này</li><li>Tạo mật khẩu mạnh (8+ ký tự)</li><li>Link có hiệu lực trong 1 giờ</li></ul></div><p style="margin-top: 30px;">Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  NULL,
  ARRAY['EMAIL'],
  '[
    {"key": "firstName", "description": "Tên người dùng", "required": true, "type": "string"},
    {"key": "lastName", "description": "Họ người dùng", "required": true, "type": "string"},
    {"key": "email", "description": "Email", "required": true, "type": "string"},
    {"key": "resetLink", "description": "Link đặt lại mật khẩu", "required": true, "type": "url"},
    {"key": "resetToken", "description": "Mã xác nhận", "required": false, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['firstName', 'lastName', 'email', 'resetLink', 'hospitalName'],
  'HIGH',
  'identity',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['identity', 'password', 'reset', 'security'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 4. ROLE_CHANGED - Role change notification
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
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
  'role-changed-vi',
  'ROLE_CHANGED',
  'Thay Đổi Vai Trò',
  'Thông báo thay đổi vai trò người dùng',
  'vi',
  'Vai trò của bạn đã được cập nhật - {{hospitalName}}',
  E'Kính gửi {{firstName}} {{lastName}},\n\nVai trò của bạn trong hệ thống đã được cập nhật:\n\nVai trò cũ: {{oldRole}}\nVai trò mới: {{newRole}}\n\nThời gian thay đổi: {{changedAt}}\nThực hiện bởi: {{changedBy}}\n\nVai trò mới của bạn có các quyền:\n{{permissions}}\n\nNếu bạn có thắc mắc, vui lòng liên hệ:\nHotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #f59e0b;">Vai trò đã được cập nhật</h2><p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p><p>Vai trò của bạn trong hệ thống đã được cập nhật.</p><div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;"><table style="width: 100%;"><tr><td style="padding: 5px 0;"><strong>Vai trò cũ:</strong></td><td>{{oldRole}}</td></tr><tr><td style="padding: 5px 0;"><strong>Vai trò mới:</strong></td><td><strong style="color: #f59e0b;">{{newRole}}</strong></td></tr><tr><td style="padding: 5px 0;"><strong>Thời gian:</strong></td><td>{{changedAt}}</td></tr><tr><td style="padding: 5px 0;"><strong>Thực hiện bởi:</strong></td><td>{{changedBy}}</td></tr></table></div><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  ARRAY['EMAIL'],
  '[
    {"key": "firstName", "description": "Tên người dùng", "required": true, "type": "string"},
    {"key": "lastName", "description": "Họ người dùng", "required": true, "type": "string"},
    {"key": "oldRole", "description": "Vai trò cũ", "required": true, "type": "string"},
    {"key": "newRole", "description": "Vai trò mới", "required": true, "type": "string"},
    {"key": "changedAt", "description": "Thời gian thay đổi", "required": true, "type": "datetime"},
    {"key": "changedBy", "description": "Người thay đổi", "required": false, "type": "string"},
    {"key": "permissions", "description": "Danh sách quyền", "required": false, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['firstName', 'lastName', 'oldRole', 'newRole', 'changedAt', 'hospitalName'],
  'NORMAL',
  'identity',
  TRUE,
  TRUE,
  TRUE,
  ARRAY['identity', 'role', 'permission', 'authorization'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 5. STAFF_INVITATION - Staff invitation email
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
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
  'staff-invitation-vi',
  'STAFF_INVITATION',
  'Thư Mời Nhân Viên',
  'Email mời gia nhập bệnh viện',
  'vi',
  '🎉 Lời mời gia nhập {{hospitalName}}',
  E'Kính gửi {{firstName}} {{lastName}},\n\n{{hospitalName}} xin trân trọng mời bạn gia nhập đội ngũ của chúng tôi với vai trò {{role}}.\n\n📋 THÔNG TIN CHI TIẾT:\nVị trí: {{position}}\nKhoa: {{department}}\nThời gian bắt đầu: {{startDate}}\n\nNhấn vào link dưới đây để hoàn tất đăng ký (có hiệu lực trong 7 ngày):\n{{invitationLink}}\n\nMã mời: {{invitationCode}}\n\nSau khi chấp nhận lời mời, bạn sẽ được hướng dẫn thiết lập tài khoản và quyền truy cập hệ thống.\n\nNếu có thắc mắc, vui lòng liên hệ:\nEmail: hr@hospital.com\nHotline: {{contactPhone}}\n\nChúng tôi rất mong được làm việc cùng bạn!\n\nTrân trọng,\nPhòng Nhân Sự\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #8b5cf6;">🎉 Lời mời gia nhập {{hospitalName}}</h2><p>Kính gửi <strong>{{firstName}} {{lastName}}</strong>,</p><p>Chúng tôi xin trân trọng mời bạn gia nhập đội ngũ với vai trò <strong>{{role}}</strong>.</p><div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;"><h3 style="margin-top: 0; color: #8b5cf6;">📋 Thông tin chi tiết</h3><table style="width: 100%;"><tr><td style="padding: 5px 0;"><strong>Vị trí:</strong></td><td>{{position}}</td></tr><tr><td style="padding: 5px 0;"><strong>Khoa:</strong></td><td>{{department}}</td></tr><tr><td style="padding: 5px 0;"><strong>Bắt đầu:</strong></td><td>{{startDate}}</td></tr></table></div><div style="text-align: center; margin: 30px 0;"><a href="{{invitationLink}}" style="background: #8b5cf6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">Chấp Nhận Lời Mời</a></div><p style="font-size: 14px; color: #6b7280;">Link có hiệu lực trong 7 ngày</p><p style="margin-top: 30px;">Trân trọng,<br/><strong>Phòng Nhân Sự - {{hospitalName}}</strong></p></div>',
  ARRAY['EMAIL'],
  '[
    {"key": "firstName", "description": "Tên nhân viên", "required": true, "type": "string"},
    {"key": "lastName", "description": "Họ nhân viên", "required": true, "type": "string"},
    {"key": "role", "description": "Vai trò", "required": true, "type": "string"},
    {"key": "position", "description": "Vị trí công việc", "required": false, "type": "string"},
    {"key": "department", "description": "Khoa/Phòng ban", "required": false, "type": "string"},
    {"key": "startDate", "description": "Ngày bắt đầu", "required": false, "type": "date"},
    {"key": "invitationLink", "description": "Link chấp nhận", "required": true, "type": "url"},
    {"key": "invitationCode", "description": "Mã mời", "required": false, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['firstName', 'lastName', 'role', 'invitationLink', 'hospitalName'],
  'HIGH',
  'identity',
  TRUE,
  TRUE,
  TRUE,
  ARRAY['identity', 'staff', 'invitation', 'hr'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========================================
-- PATIENT REGISTRY TEMPLATES
-- ========================================

-- 6. PATIENT_WELCOME - Welcome message for new patients
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
  'patient-welcome-vi',
  'PATIENT_WELCOME',
  'Chào Mừng Bệnh Nhân Mới',
  'Email và SMS chào mừng bệnh nhân đăng ký',
  'vi',
  'Chào mừng đến với {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nChào mừng bạn đến với {{hospitalName}}!\n\nHồ sơ bệnh nhân của bạn đã được tạo thành công:\n- Mã bệnh nhân: {{patientId}}\n- Số điện thoại: {{phone}}\n\n🏥 QUY TRÌNH SỬ DỤNG:\n1. Đăng nhập vào cổng thông tin bệnh nhân\n2. Đặt lịch hẹn khám bệnh\n3. Xem kết quả xét nghiệm trực tuyến\n4. Theo dõi lịch sử khám bệnh\n\n📱 TẢI ỨNG DỤNG:\n- iOS: {{iosAppLink}}\n- Android: {{androidAppLink}}\n\nLiên hệ hỗ trợ:\nHotline: {{contactPhone}}\nEmail: support@hospital.com\n\nChúng tôi cam kết mang đến dịch vụ y tế tốt nhất!\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">🏥 Chào mừng đến với {{hospitalName}}!</h2><p>Kính gửi <strong>{{patientName}}</strong>,</p><p>Hồ sơ bệnh nhân của bạn đã được tạo thành công.</p><div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;"><p style="margin: 5px 0;"><strong>Mã bệnh nhân:</strong> {{patientId}}</p><p style="margin: 5px 0;"><strong>Số điện thoại:</strong> {{phone}}</p></div><div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;"><h3 style="margin-top: 0;">🏥 Quy trình sử dụng</h3><ol style="padding-left: 20px;"><li>Đăng nhập cổng thông tin</li><li>Đặt lịch hẹn khám bệnh</li><li>Xem kết quả xét nghiệm</li><li>Theo dõi lịch sử khám bệnh</li></ol></div><p style="margin-top: 30px;">Hotline: <strong>{{contactPhone}}</strong></p><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  'Chao mung {{patientName}} den {{hospitalName}}! Ma benh nhan: {{patientId}}. Hotline: {{contactPhone}}',
  'Chào mừng đến {{hospitalName}}! Mã BN: {{patientId}}',
  ARRAY['EMAIL', 'SMS', 'PUSH'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "patientId", "description": "Mã bệnh nhân", "required": true, "type": "string"},
    {"key": "phone", "description": "Số điện thoại", "required": false, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": true, "type": "string"},
    {"key": "iosAppLink", "description": "Link iOS app", "required": false, "type": "url"},
    {"key": "androidAppLink", "description": "Link Android app", "required": false, "type": "url"}
  ]'::JSONB,
  ARRAY['patientName', 'patientId', 'hospitalName', 'contactPhone'],
  'NORMAL',
  'patient',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['patient', 'welcome', 'registration'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 7. PATIENT_UPDATED - Patient information update notification
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
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
  'patient-updated-vi',
  'PATIENT_UPDATED',
  'Cập Nhật Thông Tin Bệnh Nhân',
  'Thông báo cập nhật thông tin bệnh nhân',
  'vi',
  'Thông tin bệnh nhân đã được cập nhật - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nThông tin bệnh nhân của bạn đã được cập nhật:\n\nMã bệnh nhân: {{patientId}}\nThời gian cập nhật: {{updatedAt}}\n\nCác thông tin đã thay đổi:\n{{changedFields}}\n\nNếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay:\nHotline: {{contactPhone}}\nEmail: support@hospital.com\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #3b82f6;">Thông tin đã được cập nhật</h2><p>Kính gửi <strong>{{patientName}}</strong>,</p><p>Thông tin bệnh nhân của bạn đã được cập nhật.</p><div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Mã bệnh nhân:</strong> {{patientId}}</p><p style="margin: 5px 0;"><strong>Thời gian:</strong> {{updatedAt}}</p></div><div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;"><p><strong>Các thông tin đã thay đổi:</strong></p><p style="margin: 10px 0;">{{changedFields}}</p></div><p style="color: #dc2626;">Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ ngay!</p><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  ARRAY['EMAIL'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "patientId", "description": "Mã bệnh nhân", "required": true, "type": "string"},
    {"key": "updatedAt", "description": "Thời gian cập nhật", "required": true, "type": "datetime"},
    {"key": "changedFields", "description": "Các trường đã thay đổi", "required": true, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'patientId', 'updatedAt', 'changedFields', 'hospitalName'],
  'NORMAL',
  'patient',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['patient', 'update', 'information'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 8. PATIENT_DEACTIVATED - Account deactivation notice
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
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
  'patient-deactivated-vi',
  'PATIENT_DEACTIVATED',
  'Tài Khoản Đã Bị Vô Hiệu Hóa',
  'Thông báo vô hiệu hóa tài khoản bệnh nhân',
  'vi',
  '⚠️ Tài khoản bệnh nhân đã bị vô hiệu hóa - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nTài khoản bệnh nhân của bạn đã bị vô hiệu hóa:\n\nMã bệnh nhân: {{patientId}}\nThời gian: {{deactivatedAt}}\nLý do: {{reason}}\n\nKhi tài khoản bị vô hiệu hóa, bạn sẽ không thể:\n- Đăng nhập vào hệ thống\n- Đặt lịch hẹn mới\n- Xem thông tin bệnh án\n\nĐể kích hoạt lại tài khoản, vui lòng liên hệ:\nHotline: {{contactPhone}}\nEmail: support@hospital.com\n\nHoặc đến trực tiếp:\n{{hospitalAddress}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #dc2626;">⚠️ Tài khoản đã bị vô hiệu hóa</h2><p>Kính gửi <strong>{{patientName}}</strong>,</p><p>Tài khoản bệnh nhân của bạn đã bị vô hiệu hóa.</p><div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;"><p style="margin: 5px 0;"><strong>Mã bệnh nhân:</strong> {{patientId}}</p><p style="margin: 5px 0;"><strong>Thời gian:</strong> {{deactivatedAt}}</p><p style="margin: 5px 0;"><strong>Lý do:</strong> {{reason}}</p></div><div style="background: #fffbeb; padding: 15px; border-radius: 8px;"><p style="margin: 0;"><strong>Để kích hoạt lại, liên hệ:</strong></p><p style="margin: 10px 0;">Hotline: <strong>{{contactPhone}}</strong></p></div><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  ARRAY['EMAIL'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "patientId", "description": "Mã bệnh nhân", "required": true, "type": "string"},
    {"key": "deactivatedAt", "description": "Thời gian vô hiệu hóa", "required": true, "type": "datetime"},
    {"key": "reason", "description": "Lý do", "required": true, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "hospitalAddress", "description": "Địa chỉ bệnh viện", "required": false, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'patientId', 'deactivatedAt', 'reason', 'hospitalName'],
  'HIGH',
  'patient',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['patient', 'deactivation', 'account', 'security'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 9. CONSENT_GRANTED - Consent confirmation
INSERT INTO notifications_schema.notification_templates (
  template_id,
  template_type,
  name,
  description,
  language,
  subject_template,
  body_template,
  html_template,
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
  'consent-granted-vi',
  'CONSENT_GRANTED',
  'Xác Nhận Đồng Ý',
  'Xác nhận đồng ý sử dụng thông tin y tế',
  'vi',
  'Xác nhận đồng ý sử dụng thông tin - {{hospitalName}}',
  E'Kính gửi {{patientName}},\n\nCảm ơn bạn đã đồng ý cho phép {{hospitalName}} sử dụng thông tin y tế của bạn.\n\n📋 CHI TIẾT ĐỒNG Ý:\nLoại đồng ý: {{consentType}}\nThời gian: {{grantedAt}}\nHiệu lực đến: {{expiresAt}}\n\nThông tin y tế của bạn sẽ được sử dụng cho mục đích:\n{{purpose}}\n\nChúng tôi cam kết:\n✓ Bảo mật thông tin tuyệt đối\n✓ Chỉ sử dụng cho mục đích đã được đồng ý\n✓ Tuân thủ Luật Khám chữa bệnh và HIPAA\n\nBạn có thể thu hồi đồng ý bất kỳ lúc nào bằng cách:\n- Đăng nhập vào cổng thông tin bệnh nhân\n- Liên hệ Hotline: {{contactPhone}}\n\nTrân trọng,\n{{hospitalName}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #10b981;">✓ Xác nhận đồng ý</h2><p>Kính gửi <strong>{{patientName}}</strong>,</p><p>Cảm ơn bạn đã đồng ý cho phép chúng tôi sử dụng thông tin y tế.</p><div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;"><h3 style="margin-top: 0;">📋 Chi tiết đồng ý</h3><table style="width: 100%;"><tr><td style="padding: 5px 0;"><strong>Loại:</strong></td><td>{{consentType}}</td></tr><tr><td style="padding: 5px 0;"><strong>Thời gian:</strong></td><td>{{grantedAt}}</td></tr><tr><td style="padding: 5px 0;"><strong>Hiệu lực:</strong></td><td>{{expiresAt}}</td></tr></table><p style="margin-top: 15px;"><strong>Mục đích:</strong> {{purpose}}</p></div><div style="background: #eff6ff; padding: 15px; border-radius: 8px;"><p style="margin: 0;"><strong>Cam kết của chúng tôi:</strong></p><ul style="margin: 10px 0; padding-left: 20px;"><li>Bảo mật thông tin tuyệt đối</li><li>Chỉ sử dụng cho mục đích đã được đồng ý</li><li>Tuân thủ Luật Khám chữa bệnh và HIPAA</li></ul></div><p>Trân trọng,<br/><strong>{{hospitalName}}</strong></p></div>',
  ARRAY['EMAIL'],
  '[
    {"key": "patientName", "description": "Tên bệnh nhân", "required": true, "type": "string"},
    {"key": "consentType", "description": "Loại đồng ý", "required": true, "type": "string"},
    {"key": "grantedAt", "description": "Thời gian đồng ý", "required": true, "type": "datetime"},
    {"key": "expiresAt", "description": "Ngày hết hạn", "required": false, "type": "datetime"},
    {"key": "purpose", "description": "Mục đích sử dụng", "required": true, "type": "string"},
    {"key": "hospitalName", "description": "Tên bệnh viện", "required": true, "type": "string"},
    {"key": "contactPhone", "description": "Hotline", "required": false, "type": "string"}
  ]'::JSONB,
  ARRAY['patientName', 'consentType', 'grantedAt', 'purpose', 'hospitalName'],
  'NORMAL',
  'patient',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  ARRAY['patient', 'consent', 'privacy', 'hipaa'],
  'system'
) ON CONFLICT (template_id) DO UPDATE SET
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ========================================
-- VERIFICATION AND STATISTICS
-- ========================================

-- Verify all templates are inserted
DO $$
DECLARE
  template_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO template_count 
  FROM notifications_schema.notification_templates
  WHERE template_id IN (
    'user-welcome-vi',
    'account-activated-vi',
    'password-reset-vi',
    'role-changed-vi',
    'staff-invitation-vi',
    'patient-welcome-vi',
    'patient-updated-vi',
    'patient-deactivated-vi',
    'consent-granted-vi'
  );

  IF template_count = 9 THEN
    RAISE NOTICE '✓ Successfully inserted 9 templates (5 Identity + 4 Patient Registry)';
  ELSE
    RAISE WARNING '⚠ Expected 9 templates but found %', template_count;
  END IF;
END $$;

-- Update template statistics
ANALYZE notifications_schema.notification_templates;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON notifications_schema.notification_templates TO service_role;

COMMENT ON TABLE notifications_schema.notification_templates IS 
'Templates for Identity Service and Patient Registry Service notifications - Added 2025-10-30';
