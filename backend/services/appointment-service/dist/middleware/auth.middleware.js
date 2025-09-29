"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireReceptionistOrAdmin = requireReceptionistOrAdmin;
exports.requireDoctor = requireDoctor;
exports.requirePatient = requirePatient;
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
function authMiddleware(req, res, next) {
    try {
        if (!req.user) {
            req.user = {
                id: 'system',
                role: process.env.DEFAULT_ROLE || 'admin',
                email: 'system@hospital.local',
            };
        }
        next();
    }
    catch (err) {
        logger_1.default.error('Lỗi xác thực', err);
        res.status(401).json({ success: false, error: { message: 'Không thể xác thực người dùng' } });
    }
}
function requireReceptionistOrAdmin(req, res, next) {
    const role = req.user?.role;
    if (role === 'admin' || role === 'receptionist')
        return next();
    return res.status(403).json({ success: false, error: { message: 'Bạn không có quyền truy cập tài nguyên này' } });
}
function requireDoctor(req, res, next) {
    const role = req.user?.role;
    if (role === 'doctor' || role === 'admin')
        return next();
    return res.status(403).json({ success: false, error: { message: 'Chỉ bác sĩ mới có quyền truy cập' } });
}
function requirePatient(req, res, next) {
    const role = req.user?.role;
    if (role === 'patient' || role === 'admin')
        return next();
    return res.status(403).json({ success: false, error: { message: 'Chỉ bệnh nhân mới có quyền truy cập' } });
}
//# sourceMappingURL=auth.middleware.js.map