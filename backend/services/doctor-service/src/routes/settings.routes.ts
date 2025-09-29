import express from 'express';
import { supabase } from '../config/database.config';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
const router = express.Router();

// Get doctor's settings
router.get('/:doctorId/settings', authenticateToken, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    
    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền truy cập thông tin này' }
      });
    }

    const { data: settings, error } = await supabase
      .from('doctor_settings')
      .select('*')
      .eq('doctor_id', doctor_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ [Settings] Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi truy vấn cài đặt' }
      });
    }

    // If no settings exist, create default settings
    if (!settings) {
      const { data: defaultSettings, error: createError } = await supabase
        .from('doctor_settings')
        .insert({
          doctor_id: doctor_id,
          notification_email: true,
          notification_sms: true,
          notification_appointment_reminder: true,
          notification_patient_review: true,
          privacy_show_phone: true,
          privacy_show_email: true,
          privacy_show_experience: true,
          language_preference: 'vi',
          timezone: 'Asia/Ho_Chi_Minh',
          theme_preference: 'light'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ [Settings] Create error:', createError);
        return res.status(500).json({
          success: false,
          error: { message: 'Lỗi khi tạo cài đặt mặc định' }
        });
      }

      return res.json({
        success: true,
        data: defaultSettings
      });
    }

    res.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('❌ [Settings] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi lấy cài đặt' }
    });
  }
});

// Update doctor's settings
router.put('/:doctorId/settings', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const {
      notification_email,
      notification_sms,
      notification_appointment_reminder,
      notification_patient_review,
      privacy_show_phone,
      privacy_show_email,
      privacy_show_experience,
      language_preference,
      timezone,
      theme_preference
    } = req.body;

    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền cập nhật thông tin này' }
      });
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};
    if (notification_email !== undefined) updateData.notification_email = notification_email;
    if (notification_sms !== undefined) updateData.notification_sms = notification_sms;
    if (notification_appointment_reminder !== undefined) updateData.notification_appointment_reminder = notification_appointment_reminder;
    if (notification_patient_review !== undefined) updateData.notification_patient_review = notification_patient_review;
    if (privacy_show_phone !== undefined) updateData.privacy_show_phone = privacy_show_phone;
    if (privacy_show_email !== undefined) updateData.privacy_show_email = privacy_show_email;
    if (privacy_show_experience !== undefined) updateData.privacy_show_experience = privacy_show_experience;
    if (language_preference) updateData.language_preference = language_preference;
    if (timezone) updateData.timezone = timezone;
    if (theme_preference) updateData.theme_preference = theme_preference;

    const { data: settings, error } = await supabase
      .from('doctor_settings')
      .update(updateData)
      .eq('doctor_id', doctor_id)
      .select()
      .single();

    if (error) {
      console.error('❌ [Settings] Update error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi cập nhật cài đặt' }
      });
    }

    res.json({
      success: true,
      data: settings,
      message: 'Cập nhật cài đặt thành công'
    });

  } catch (error) {
    console.error('❌ [Settings] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi cập nhật cài đặt' }
    });
  }
});

// Get doctor's emergency contacts
router.get('/:doctorId/emergency-contacts', authenticateToken, async (req, res) => {
  try {
    const { doctor_id } = req.params;
    
    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền truy cập thông tin này' }
      });
    }

    const { data: contacts, error } = await supabase
      .from('doctor_emergency_contacts')
      .select('*')
      .eq('doctor_id', doctor_id)
      .order('is_primary', { ascending: false });

    if (error) {
      console.error('❌ [EmergencyContacts] Database error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi truy vấn liên hệ khẩn cấp' }
      });
    }

    res.json({
      success: true,
      data: contacts || []
    });

  } catch (error) {
    console.error('❌ [EmergencyContacts] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi lấy liên hệ khẩn cấp' }
    });
  }
});

// Add emergency contact
router.post('/:doctorId/emergency-contacts', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctor_id } = req.params;
    const { contact_name, relationship, phone_number, email, address, is_primary } = req.body;

    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền thêm thông tin này' }
      });
    }

    // Validate required fields
    if (!contact_name || !relationship || !phone_number) {
      return res.status(400).json({
        success: false,
        error: { message: 'Tên, mối quan hệ và số điện thoại là bắt buộc' }
      });
    }

    // If this is primary contact, set others as not primary
    if (is_primary) {
      await supabase
        .from('doctor_emergency_contacts')
        .update({ is_primary: false })
        .eq('doctor_id', doctor_id);
    }

    const { data: contact, error } = await supabase
      .from('doctor_emergency_contacts')
      .insert({
        doctor_id: doctor_id,
        contact_name,
        relationship,
        phone_number,
        email,
        address,
        is_primary: is_primary || false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [EmergencyContacts] Insert error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi thêm liên hệ khẩn cấp' }
      });
    }

    res.status(201).json({
      success: true,
      data: contact,
      message: 'Thêm liên hệ khẩn cấp thành công'
    });

  } catch (error) {
    console.error('❌ [EmergencyContacts] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi thêm liên hệ khẩn cấp' }
    });
  }
});

// Update emergency contact
router.put('/:doctorId/emergency-contacts/:contactId', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctor_id, contactId } = req.params;
    const { contact_name, relationship, phone_number, email, address, is_primary } = req.body;

    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền cập nhật thông tin này' }
      });
    }

    // If this is primary contact, set others as not primary
    if (is_primary) {
      await supabase
        .from('doctor_emergency_contacts')
        .update({ is_primary: false })
        .eq('doctor_id', doctor_id)
        .neq('id', contactId);
    }

    const { data: contact, error } = await supabase
      .from('doctor_emergency_contacts')
      .update({
        contact_name,
        relationship,
        phone_number,
        email,
        address,
        is_primary: is_primary || false
      })
      .eq('id', contactId)
      .eq('doctor_id', doctor_id)
      .select()
      .single();

    if (error) {
      console.error('❌ [EmergencyContacts] Update error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi cập nhật liên hệ khẩn cấp' }
      });
    }

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'Không tìm thấy liên hệ khẩn cấp' }
      });
    }

    res.json({
      success: true,
      data: contact,
      message: 'Cập nhật liên hệ khẩn cấp thành công'
    });

  } catch (error) {
    console.error('❌ [EmergencyContacts] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi cập nhật liên hệ khẩn cấp' }
    });
  }
});

// Delete emergency contact
router.delete('/:doctorId/emergency-contacts/:contactId', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctor_id, contactId } = req.params;

    // Verify doctor exists and user has permission
    if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Không có quyền xóa thông tin này' }
      });
    }

    const { error } = await supabase
      .from('doctor_emergency_contacts')
      .delete()
      .eq('id', contactId)
      .eq('doctor_id', doctor_id);

    if (error) {
      console.error('❌ [EmergencyContacts] Delete error:', error);
      return res.status(500).json({
        success: false,
        error: { message: 'Lỗi khi xóa liên hệ khẩn cấp' }
      });
    }

    res.json({
      success: true,
      message: 'Xóa liên hệ khẩn cấp thành công'
    });

  } catch (error) {
    console.error('❌ [EmergencyContacts] Error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Lỗi server khi xóa liên hệ khẩn cấp' }
    });
  }
});

export default router;
