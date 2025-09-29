"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class PatientController {
    constructor() {
        this.searchPatients = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền tìm kiếm bệnh nhân' }
                    });
                    return;
                }
                const { query, phone, patient_id, page = 1, limit = 20 } = req.query;
                if (!query && !phone && !patient_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Cần ít nhất một tiêu chí tìm kiếm' }
                    });
                    return;
                }
                let searchQuery = database_config_1.supabaseAdmin
                    .from('patients')
                    .select(`
          patient_id,
          profile_id,
          emergency_contact,
          insurance_info,
          medical_history,
          allergies,
          current_medications,
          is_active,
          created_at,
          profiles:profile_id (
            full_name,
            email,
            phone_number,
            date_of_birth,
            address
          )
        `);
                if (patient_id) {
                    searchQuery = searchQuery.eq('patient_id', patient_id);
                }
                else {
                    if (query) {
                        searchQuery = searchQuery.or(`profiles.full_name.ilike.%${query}%`);
                    }
                    if (phone) {
                        searchQuery = searchQuery.or(`profiles.phone_number.ilike.%${phone}%`);
                    }
                }
                const offset = (Number(page) - 1) * Number(limit);
                searchQuery = searchQuery.range(offset, offset + Number(limit) - 1);
                const { data: patients, error } = await searchQuery;
                if (error) {
                    logger_1.default.error('Error searching patients:', error);
                    res.status(500).json({
                        success: false,
                        error: { message: 'Lỗi khi tìm kiếm bệnh nhân' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    data: patients || [],
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total: patients?.length || 0
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Error in searchPatients:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi tìm kiếm bệnh nhân' }
                });
            }
        };
        this.getPatientDetails = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin', 'doctor'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền xem thông tin bệnh nhân' }
                    });
                    return;
                }
                const { patient_id } = req.params;
                if (!patient_id) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã bệnh nhân là bắt buộc' }
                    });
                    return;
                }
                const { data: patient, error } = await database_config_1.supabaseAdmin
                    .from('patients')
                    .select(`
          patient_id,
          profile_id,
          emergency_contact,
          insurance_info,
          medical_history,
          allergies,
          current_medications,
          is_active,
          created_at,
          updated_at,
          profiles:profile_id (
            full_name,
            email,
            phone_number,
            date_of_birth,
            address,
            avatar_url
          )
        `)
                    .eq('patient_id', patient_id)
                    .single();
                if (error) {
                    logger_1.default.error('Error getting patient details:', error);
                    res.status(404).json({
                        success: false,
                        error: { message: 'Không tìm thấy thông tin bệnh nhân' }
                    });
                    return;
                }
                const { data: recentAppointments } = await database_config_1.supabaseAdmin
                    .from('appointments')
                    .select(`
          appointment_id,
          appointment_date,
          appointment_time,
          status,
          appointment_type,
          doctors:doctor_id (
            profiles:profile_id (
              full_name
            ),
            specialty
          )
        `)
                    .eq('patient_id', patient_id)
                    .order('appointment_date', { ascending: false })
                    .limit(5);
                const { data: recentCheckIns } = await database_config_1.supabaseAdmin
                    .from('patient_check_ins')
                    .select(`
          check_in_time,
          status,
          notes,
          appointments:appointment_id (
            appointment_date,
            appointment_time
          )
        `)
                    .eq('patient_id', patient_id)
                    .order('check_in_time', { ascending: false })
                    .limit(5);
                res.json({
                    success: true,
                    data: {
                        patient,
                        recentAppointments: recentAppointments || [],
                        recentCheckIns: recentCheckIns || []
                    }
                });
            }
            catch (error) {
                logger_1.default.error('Error in getPatientDetails:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi lấy thông tin bệnh nhân' }
                });
            }
        };
        this.updateEmergencyContact = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền cập nhật thông tin liên hệ khẩn cấp' }
                    });
                    return;
                }
                const { patient_id } = req.params;
                const { emergency_contact } = req.body;
                if (!patient_id || !emergency_contact) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã bệnh nhân và thông tin liên hệ khẩn cấp là bắt buộc' }
                    });
                    return;
                }
                const { error } = await database_config_1.supabaseAdmin
                    .from('patients')
                    .update({
                    emergency_contact,
                    updated_at: new Date().toISOString()
                })
                    .eq('patient_id', patient_id);
                if (error) {
                    logger_1.default.error('Error updating emergency contact:', error);
                    res.status(500).json({
                        success: false,
                        error: { message: 'Lỗi khi cập nhật thông tin liên hệ khẩn cấp' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    message: 'Cập nhật thông tin liên hệ khẩn cấp thành công'
                });
            }
            catch (error) {
                logger_1.default.error('Error in updateEmergencyContact:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi cập nhật thông tin liên hệ' }
                });
            }
        };
        this.updateInsuranceInfo = async (req, res) => {
            try {
                if (!req.user || !['receptionist', 'admin'].includes(req.user.role)) {
                    res.status(403).json({
                        success: false,
                        error: { message: 'Không có quyền cập nhật thông tin bảo hiểm' }
                    });
                    return;
                }
                const { patient_id } = req.params;
                const { insurance_info } = req.body;
                if (!patient_id || !insurance_info) {
                    res.status(400).json({
                        success: false,
                        error: { message: 'Mã bệnh nhân và thông tin bảo hiểm là bắt buộc' }
                    });
                    return;
                }
                const { error } = await database_config_1.supabaseAdmin
                    .from('patients')
                    .update({
                    insurance_info,
                    updated_at: new Date().toISOString()
                })
                    .eq('patient_id', patient_id);
                if (error) {
                    logger_1.default.error('Error updating insurance info:', error);
                    res.status(500).json({
                        success: false,
                        error: { message: 'Lỗi khi cập nhật thông tin bảo hiểm' }
                    });
                    return;
                }
                res.json({
                    success: true,
                    message: 'Cập nhật thông tin bảo hiểm thành công'
                });
            }
            catch (error) {
                logger_1.default.error('Error in updateInsuranceInfo:', error);
                res.status(500).json({
                    success: false,
                    error: { message: 'Lỗi server khi cập nhật thông tin bảo hiểm' }
                });
            }
        };
    }
}
exports.PatientController = PatientController;
//# sourceMappingURL=patient.controller.js.map