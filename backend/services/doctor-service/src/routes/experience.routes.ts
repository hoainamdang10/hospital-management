import express from 'express';
import { body, param } from 'express-validator';
import { DoctorController } from '../controllers/doctor.controller';

const router = express.Router();
const doctorController = new DoctorController();

// Validation middleware
const validateExperienceId = [
  param('experienceId').notEmpty().withMessage('Experience ID is required')
];

const validateDoctorId = [
  param('doctor_id').notEmpty().withMessage('Doctor ID is required')
];

const validateCreateExperience = [
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('institution_name').isLength({ min: 2, max: 255 }).withMessage('Institution name must be 2-255 characters'),
  body('position').isLength({ min: 2, max: 255 }).withMessage('Position must be 2-255 characters'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('is_current').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('experience_type').isIn(['work', 'education', 'certification', 'research']).withMessage('Valid experience type is required')
];

const validateUpdateExperience = [
  body('institution_name').optional().isLength({ min: 2, max: 255 }),
  body('position').optional().isLength({ min: 2, max: 255 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('is_current').optional().isBoolean(),
  body('description').optional().isLength({ max: 1000 }),
  body('experience_type').optional().isIn(['work', 'education', 'certification', 'research'])
];

/**
 * @swagger
 * components:
 *   schemas:
 *     DoctorExperience:
 *       type: object
 *       properties:
 *         experience_id:
 *           type: string
 *         doctor_id:
 *           type: string
 *         institution_name:
 *           type: string
 *         position:
 *           type: string
 *         start_date:
 *           type: string
 *           format: date
 *         end_date:
 *           type: string
 *           format: date
 *         is_current:
 *           type: boolean
 *         description:
 *           type: string
 *         experience_type:
 *           type: string
 *           enum: [work, education, certification, research]
 */

/**
 * @swagger
 * /api/experiences/doctor/{doctorId}:
 *   get:
 *     summary: Get doctor's experiences
 *     tags: [Doctor Experiences]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [work, education, certification, research]
 *     responses:
 *       200:
 *         description: Doctor's experiences
 */
router.get('/doctor/:doctorId', validateDoctorId, doctorController.getDoctorExperiences.bind(doctorController));

// Support frontend pattern: /api/doctors/{id}/experience
router.get('/:doctorId/experience', validateDoctorId, doctorController.getDoctorExperiences.bind(doctorController));

/**
 * @swagger
 * /api/experiences/doctor/{doctorId}/timeline:
 *   get:
 *     summary: Get doctor's experience timeline
 *     tags: [Doctor Experiences]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience timeline
 */
router.get('/doctor/:doctorId/timeline', validateDoctorId, doctorController.getExperienceTimeline.bind(doctorController));

/**
 * @swagger
 * /api/experiences/doctor/{doctorId}/total:
 *   get:
 *     summary: Get doctor's total experience calculation
 *     tags: [Doctor Experiences]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Total experience calculation
 */
router.get('/doctor/:doctorId/total', validateDoctorId, doctorController.getTotalExperience.bind(doctorController));

/**
 * @swagger
 * /api/experiences:
 *   post:
 *     summary: Create new experience
 *     tags: [Doctor Experiences]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doctor_id
 *               - institution_name
 *               - position
 *               - start_date
 *               - experience_type
 *             properties:
 *               doctor_id:
 *                 type: string
 *               institution_name:
 *                 type: string
 *               position:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               is_current:
 *                 type: boolean
 *               description:
 *                 type: string
 *               experience_type:
 *                 type: string
 *                 enum: [work, education, certification, research]
 *     responses:
 *       201:
 *         description: Experience created successfully
 */
router.post('/', validateCreateExperience, doctorController.createExperience.bind(doctorController));

/**
 * @swagger
 * /api/experiences/{experienceId}:
 *   put:
 *     summary: Update experience
 *     tags: [Doctor Experiences]
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               institution_name:
 *                 type: string
 *               position:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               is_current:
 *                 type: boolean
 *               description:
 *                 type: string
 *               experience_type:
 *                 type: string
 *                 enum: [work, education, certification, research]
 *     responses:
 *       200:
 *         description: Experience updated successfully
 *       404:
 *         description: Experience not found
 */
router.put('/:experienceId', validateExperienceId, validateUpdateExperience, doctorController.updateExperience.bind(doctorController));

/**
 * @swagger
 * /api/experiences/{experienceId}:
 *   delete:
 *     summary: Delete experience
 *     tags: [Doctor Experiences]
 *     parameters:
 *       - in: path
 *         name: experienceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Experience deleted successfully
 *       404:
 *         description: Experience not found
 */
router.delete('/:experienceId', validateExperienceId, doctorController.deleteExperience.bind(doctorController));

export default router;
