import express from "express";
import { body, query, validationResult } from "express-validator";
import { config } from "../config/config";
import { ValidationError } from "./error.middleware";

// Handle validation errors
export const handleValidationErrors = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new ValidationError(`Validation failed: ${errorMessages.join(", ")}`);
  }
  next();
};

// Document upload validation
export const validateDocumentUpload = [
  body("document_type")
    .isIn(config.fileUpload.documentTypes)
    .withMessage(
      `Document type must be one of: ${config.fileUpload.documentTypes.join(", ")}`
    ),

  body("metadata")
    .optional()
    .custom((value) => {
      if (value) {
        try {
          JSON.parse(value);
          return true;
        } catch {
          throw new Error("Metadata must be valid JSON");
        }
      }
      return true;
    }),

  // File validation
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const files = req.files as any[];

    if (!files || files.length === 0) {
      throw new ValidationError("At least one file is required");
    }

    if (files.length > config.fileUpload.maxFiles) {
      throw new ValidationError(
        `Maximum ${config.fileUpload.maxFiles} files allowed`
      );
    }

    // Validate each file
    for (const file of files) {
      // File size check
      if (file.size > config.fileUpload.maxSize) {
        throw new ValidationError(
          `File ${file.originalname} exceeds maximum size of ${config.fileUpload.maxSize} bytes`
        );
      }

      // MIME type check
      if (!config.fileUpload.allowedTypes.includes(file.mimetype)) {
        throw new ValidationError(
          `File type ${file.mimetype} not allowed for ${file.originalname}`
        );
      }

      // Filename validation
      if (!file.originalname || file.originalname.trim() === "") {
        throw new ValidationError("File name is required");
      }

      if (file.originalname.length > 255) {
        throw new ValidationError(`File name too long: ${file.originalname}`);
      }

      // Check for dangerous characters
      const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (dangerousChars.test(file.originalname)) {
        throw new ValidationError(
          `Invalid characters in filename: ${file.originalname}`
        );
      }
    }

    next();
  },

  handleValidationErrors,
];

// Document query validation
export const validateDocumentQuery = [
  query("document_type")
    .optional()
    .isIn(config.fileUpload.documentTypes)
    .withMessage(
      `Document type must be one of: ${config.fileUpload.documentTypes.join(", ")}`
    ),

  query("upload_status")
    .optional()
    .isIn(["pending", "completed", "failed", "deleted"])
    .withMessage(
      "Upload status must be one of: pending, completed, failed, deleted"
    ),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// Document ID parameter validation
export const validateDocumentId = [
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { id } = req.params;

    // UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(id)) {
      throw new ValidationError("Invalid document ID format");
    }

    next();
  },
];

// Medical document type specific validation
export const validateMedicalDocument = [
  body("document_type").custom((value, { req }) => {
    const files = req.files as any[];

    if (!files || files.length === 0) {
      return true; // Will be caught by file validation
    }

    // Define allowed MIME types for each medical document type
    const medicalTypeRestrictions: Record<string, string[]> = {
      medical_report: ["application/pdf", "text/plain"],
      lab_result: ["application/pdf", "image/jpeg", "image/png"],
      prescription: ["application/pdf", "image/jpeg", "image/png"],
      x_ray: ["image/jpeg", "image/png"],
      ct_scan: ["image/jpeg", "image/png"],
      mri_scan: ["image/jpeg", "image/png"],
      ultrasound: ["image/jpeg", "image/png"],
      profile_photo: ["image/jpeg", "image/png", "image/webp"],
      id_card: ["image/jpeg", "image/png"],
      insurance_card: ["image/jpeg", "image/png", "application/pdf"],
    };

    const allowedTypes = medicalTypeRestrictions[value];

    if (allowedTypes) {
      for (const file of files) {
        if (!allowedTypes.includes(file.mimetype)) {
          throw new Error(
            `File type ${file.mimetype} not allowed for document type ${value}`
          );
        }
      }
    }

    return true;
  }),

  handleValidationErrors,
];

// Preview size validation
export const validatePreviewRequest = [
  query("size")
    .optional()
    .isIn(["thumbnail", "preview"])
    .withMessage('Size must be either "thumbnail" or "preview"'),

  handleValidationErrors,
];

// Sanitization helpers
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .substring(0, 255);
};

export const sanitizeMetadata = (metadata: any): Record<string, any> => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Only allow safe property names
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 50);

    if (safeKey && typeof value === "string" && value.length <= 1000) {
      sanitized[safeKey] = value;
    } else if (typeof value === "number" && isFinite(value)) {
      sanitized[safeKey] = value;
    } else if (typeof value === "boolean") {
      sanitized[safeKey] = value;
    }
  }

  return sanitized;
};
