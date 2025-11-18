"use strict";
/**
 * Simplified Validation Schemas for MVP
 * Less strict validation for appointment booking flow
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifiedScheduleAppointmentSchema = void 0;
const joi_1 = __importDefault(require("joi"));
/**
 * Simplified Schedule Appointment Schema
 * For patient self-booking flow - less strict than full admin flow
 */
exports.simplifiedScheduleAppointmentSchema = joi_1.default.object({
    patientId: joi_1.default.string().required(),
    doctorId: joi_1.default.string().required(),
    // Patient info
    patientFullName: joi_1.default.string().min(2).max(100).required(),
    patientPhone: joi_1.default.string().pattern(/^0\d{9}$/).required(),
    patientEmail: joi_1.default.string().email().optional().allow(''),
    patientDateOfBirth: joi_1.default.date().max('now').required(),
    patientNationalId: joi_1.default.string().min(9).max(12).required(),
    patientAddress: joi_1.default.string().max(200).optional().allow(''),
    // Appointment details
    appointmentDate: joi_1.default.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    appointmentTime: joi_1.default.string().required(), // Accept both HH:mm:ss and ISO format
    appointmentType: joi_1.default.string()
        .valid('CONSULTATION', 'FOLLOW_UP', 'consultation', 'follow_up')
        .default('CONSULTATION'),
    reason: joi_1.default.string().max(500).optional().allow(''),
});
//# sourceMappingURL=SimplifiedValidationSchemas.js.map