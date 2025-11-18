/**
 * Simplified Validation Schemas for MVP
 * Less strict validation for appointment booking flow
 */

import Joi from 'joi';

/**
 * Simplified Schedule Appointment Schema
 * For patient self-booking flow - less strict than full admin flow
 */
export const simplifiedScheduleAppointmentSchema = Joi.object({
  patientId: Joi.string().required(),
  doctorId: Joi.string().required(),
  
  // Patient info
  patientFullName: Joi.string().min(2).max(100).required(),
  patientPhone: Joi.string().pattern(/^0\d{9}$/).required(),
  patientEmail: Joi.string().email().optional().allow(''),
  patientDateOfBirth: Joi.date().max('now').required(),
  patientNationalId: Joi.string().min(9).max(12).required(),
  patientAddress: Joi.string().max(200).optional().allow(''),
  
  // Appointment details
  appointmentDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  appointmentTime: Joi.string().required(), // Accept both HH:mm:ss and ISO format
  appointmentType: Joi.string()
    .valid('CONSULTATION', 'FOLLOW_UP', 'consultation', 'follow_up')
    .default('CONSULTATION'),
  reason: Joi.string().max(500).optional().allow(''),
});
