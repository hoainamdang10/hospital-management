"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_config_1 = require("../config/database.config");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.get('/:doctorId/experience', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { doctor_id } = req.params;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền truy cập thông tin này' }
            });
        }
        const { data: experiences, error } = await database_config_1.supabase
            .from('doctor_work_experiences')
            .select('*')
            .eq('doctor_id', doctor_id)
            .order('start_date', { ascending: false });
        if (error) {
            console.error('❌ [Experience] Database error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi truy vấn kinh nghiệm làm việc' }
            });
        }
        res.json({
            success: true,
            data: experiences || []
        });
    }
    catch (error) {
        console.error('❌ [Experience] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi lấy kinh nghiệm làm việc' }
        });
    }
});
router.get('/:doctorId/experience', auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { doctor_id } = req.params;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền truy cập thông tin này' }
            });
        }
        const { data: experiences, error } = await database_config_1.supabase
            .from('doctor_work_experiences')
            .select('*')
            .eq('doctor_id', doctor_id)
            .order('start_date', { ascending: false });
        if (error) {
            console.error('❌ [Experience] Database error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi truy vấn kinh nghiệm làm việc' }
            });
        }
        res.json({
            success: true,
            data: experiences || []
        });
    }
    catch (error) {
        console.error('❌ [Experience] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi lấy kinh nghiệm làm việc' }
        });
    }
});
router.post('/:doctorId/experience', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['doctor', 'admin']), async (req, res) => {
    try {
        const { doctor_id } = req.params;
        const { hospital_name, position, department, start_date, end_date, description, achievements, is_current } = req.body;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền thêm thông tin này' }
            });
        }
        if (!hospital_name || !position || !start_date) {
            return res.status(400).json({
                success: false,
                error: { message: 'Tên bệnh viện, chức vụ và ngày bắt đầu là bắt buộc' }
            });
        }
        if (is_current) {
            await database_config_1.supabase
                .from('doctor_work_experiences')
                .update({ is_current: false })
                .eq('doctor_id', doctor_id);
        }
        const { data: experience, error } = await database_config_1.supabase
            .from('doctor_work_experiences')
            .insert({
            doctor_id: doctor_id,
            hospital_name,
            position,
            department,
            start_date,
            end_date: is_current ? null : end_date,
            description,
            achievements,
            is_current: is_current || false
        })
            .select()
            .single();
        if (error) {
            console.error('❌ [Experience] Insert error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi thêm kinh nghiệm làm việc' }
            });
        }
        res.status(201).json({
            success: true,
            data: experience,
            message: 'Thêm kinh nghiệm làm việc thành công'
        });
    }
    catch (error) {
        console.error('❌ [Experience] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi thêm kinh nghiệm làm việc' }
        });
    }
});
router.put('/:doctorId/experience/:experienceId', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['doctor', 'admin']), async (req, res) => {
    try {
        const { doctor_id, experienceId } = req.params;
        const { hospital_name, position, department, start_date, end_date, description, achievements, is_current } = req.body;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền cập nhật thông tin này' }
            });
        }
        if (is_current) {
            await database_config_1.supabase
                .from('doctor_work_experiences')
                .update({ is_current: false })
                .eq('doctor_id', doctor_id)
                .neq('id', experienceId);
        }
        const { data: experience, error } = await database_config_1.supabase
            .from('doctor_work_experiences')
            .update({
            hospital_name,
            position,
            department,
            start_date,
            end_date: is_current ? null : end_date,
            description,
            achievements,
            is_current: is_current || false
        })
            .eq('id', experienceId)
            .eq('doctor_id', doctor_id)
            .select()
            .single();
        if (error) {
            console.error('❌ [Experience] Update error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi cập nhật kinh nghiệm làm việc' }
            });
        }
        if (!experience) {
            return res.status(404).json({
                success: false,
                error: { message: 'Không tìm thấy kinh nghiệm làm việc' }
            });
        }
        res.json({
            success: true,
            data: experience,
            message: 'Cập nhật kinh nghiệm làm việc thành công'
        });
    }
    catch (error) {
        console.error('❌ [Experience] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi cập nhật kinh nghiệm làm việc' }
        });
    }
});
router.delete('/:doctorId/experience/:experienceId', auth_middleware_1.authenticateToken, (0, auth_middleware_1.requireRole)(['doctor', 'admin']), async (req, res) => {
    try {
        const { doctor_id, experienceId } = req.params;
        if (!req.user || (req.user.role !== 'admin' && req.user.doctor_id !== doctor_id)) {
            return res.status(403).json({
                success: false,
                error: { message: 'Không có quyền xóa thông tin này' }
            });
        }
        const { error } = await database_config_1.supabase
            .from('doctor_work_experiences')
            .delete()
            .eq('id', experienceId)
            .eq('doctor_id', doctor_id);
        if (error) {
            console.error('❌ [Experience] Delete error:', error);
            return res.status(500).json({
                success: false,
                error: { message: 'Lỗi khi xóa kinh nghiệm làm việc' }
            });
        }
        res.json({
            success: true,
            message: 'Xóa kinh nghiệm làm việc thành công'
        });
    }
    catch (error) {
        console.error('❌ [Experience] Error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Lỗi server khi xóa kinh nghiệm làm việc' }
        });
    }
});
exports.default = router;
//# sourceMappingURL=experience-new.routes.js.map