"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPatientProfile = void 0;
const getPatientProfile = (req, res) => {
    res.json({
        success: true,
        message: 'This is the patient profile.',
        userId: req.headers['x-user-id'],
        role: req.headers['x-user-role'],
        email: req.headers['x-user-email']
    });
};
exports.getPatientProfile = getPatientProfile;
