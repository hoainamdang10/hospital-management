import express from "express";
import multer from "multer";
import { config } from "../config/config";
import { DocumentsController } from "../controllers/documents.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import {
  validateDocumentQuery,
  validateDocumentUpload,
} from "../middleware/validation.middleware";

const router = express.Router();
const documentsController = new DocumentsController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.fileUpload.maxSize,
    files: config.fileUpload.maxFiles,
  },
  fileFilter: (req, file, cb) => {
    // Basic file type check (detailed validation in controller)
    if (config.fileUpload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * @swagger
 * /api/documents/upload:
 *   post:
 *     summary: Upload medical documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: files
 *         type: file
 *         required: true
 *         description: Files to upload (max 10 files, 5MB each)
 *       - in: formData
 *         name: document_type
 *         type: string
 *         required: true
 *         enum: [medical_report, lab_result, prescription, insurance_card, id_card, x_ray, ct_scan, mri_scan, ultrasound, profile_photo, consent_form, discharge_summary, other]
 *         description: Type of medical document
 *       - in: formData
 *         name: metadata
 *         type: string
 *         description: Additional metadata as JSON string
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 *       400:
 *         description: Invalid file or parameters
 *       401:
 *         description: Authentication required
 *       413:
 *         description: File too large
 */
router.post(
  "/upload",
  authMiddleware,
  upload.array("files", config.fileUpload.maxFiles),
  validateDocumentUpload,
  documentsController.uploadDocuments
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get user's documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: document_type
 *         type: string
 *         description: Filter by document type
 *       - in: query
 *         name: upload_status
 *         type: string
 *         enum: [pending, completed, failed]
 *         description: Filter by upload status
 *       - in: query
 *         name: page
 *         type: integer
 *         default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         type: integer
 *         default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *       401:
 *         description: Authentication required
 */
router.get(
  "/",
  authMiddleware,
  validateDocumentQuery,
  documentsController.getUserDocuments
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document details
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *       404:
 *         description: Document not found
 *       401:
 *         description: Authentication required
 */
router.get("/:id", authMiddleware, documentsController.getDocument);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Download document file
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Document not found
 *       401:
 *         description: Authentication required
 */
router.get(
  "/:id/download",
  authMiddleware,
  documentsController.downloadDocument
);

/**
 * @swagger
 * /api/documents/{id}/preview:
 *   get:
 *     summary: Get document preview/thumbnail
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: Document ID
 *       - in: query
 *         name: size
 *         type: string
 *         enum: [thumbnail, preview]
 *         default: thumbnail
 *         description: Preview size
 *     responses:
 *       200:
 *         description: Image preview
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Preview not available for this file type
 *       404:
 *         description: Document not found
 *       401:
 *         description: Authentication required
 */
router.get(
  "/:id/preview",
  authMiddleware,
  documentsController.getDocumentPreview
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found
 *       401:
 *         description: Authentication required
 */
router.delete("/:id", authMiddleware, documentsController.deleteDocument);

export { router as documentsRoutes };

