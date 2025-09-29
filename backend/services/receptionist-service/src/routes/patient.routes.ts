import express from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authMiddleware, requireReceptionistOrAdmin } from '../middleware/auth.middleware';

const router = express.Router();
const patientController = new PatientController();

/**
 * @swagger
 * /api/patients/search:
 *   get:
 *     summary: Search patients
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search by patient name
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *         description: Search by phone number
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *         description: Search by patient ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Patients found successfully
 *       400:
 *         description: Search criteria required
 *       403:
 *         description: Access denied
 */
router.get('/search', authMiddleware, requireReceptionistOrAdmin, patientController.searchPatients);

/**
 * @swagger
 * /api/patients/{patientId}:
 *   get:
 *     summary: Get patient details
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient details retrieved successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Patient not found
 */
router.get('/:patientId', authMiddleware, patientController.getPatientDetails);

/**
 * @swagger
 * /api/patients/{patientId}/emergency-contact:
 *   put:
 *     summary: Update patient emergency contact
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - emergency_contact
 *             properties:
 *               emergency_contact:
 *                 type: object
 *                 description: Emergency contact information
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Contact person name
 *                   phone:
 *                     type: string
 *                     description: Contact phone number
 *                   relationship:
 *                     type: string
 *                     description: Relationship to patient
 *     responses:
 *       200:
 *         description: Emergency contact updated successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/:patientId/emergency-contact', authMiddleware, requireReceptionistOrAdmin, patientController.updateEmergencyContact);

/**
 * @swagger
 * /api/patients/{patientId}/insurance:
 *   put:
 *     summary: Update patient insurance information
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - insurance_info
 *             properties:
 *               insurance_info:
 *                 type: object
 *                 description: Insurance information
 *                 properties:
 *                   provider:
 *                     type: string
 *                     description: Insurance provider
 *                   policy_number:
 *                     type: string
 *                     description: Policy number
 *                   group_number:
 *                     type: string
 *                     description: Group number
 *                   expiry_date:
 *                     type: string
 *                     format: date
 *                     description: Policy expiry date
 *     responses:
 *       200:
 *         description: Insurance information updated successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: Access denied
 */
router.put('/:patientId/insurance', authMiddleware, requireReceptionistOrAdmin, patientController.updateInsuranceInfo);

export default router;
