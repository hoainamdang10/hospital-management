"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticationMiddleware = authenticationMiddleware;
exports.requireRoles = requireRoles;
exports.requirePatientScope = requirePatientScope;
const allowedRoles = ['doctor', 'nurse', 'admin', 'patient'];
function authenticationMiddleware(req, res, next) {
    const userId = req.headers['x-user-id'];
    const roleHeader = req.headers['x-user-role']?.toLowerCase();
    const role = allowedRoles.find((r) => r === roleHeader) ?? undefined;
    if (!userId || !role) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
    }
    const patientId = req.headers['x-patient-id'];
    if (role === 'patient' && !patientId) {
        res.status(401).json({ success: false, message: 'Missing patient context' });
        return;
    }
    req.user = {
        id: userId,
        role,
        patientId,
    };
    next();
}
function requireRoles(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: 'Forbidden' });
            return;
        }
        next();
    };
}
function requirePatientScope(options) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== 'patient') {
            next();
            return;
        }
        let value;
        if (options.location === 'params') {
            value = req.params?.[options.key];
        }
        else if (options.location === 'query') {
            const q = req.query?.[options.key];
            value = Array.isArray(q) ? q[0] : q;
        }
        else {
            value = (req.body ?? {})[options.key];
        }
        if (!value || value !== req.user.patientId) {
            res.status(403).json({ success: false, message: 'Patient scope required' });
            return;
        }
        next();
    };
}
