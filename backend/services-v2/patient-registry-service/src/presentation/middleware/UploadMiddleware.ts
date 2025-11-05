/**
 * UploadMiddleware - File Upload Middleware
 * Handles file uploads using multer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture
 */

import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh định dạng JPEG, PNG, JPG, WEBP'));
  }
};

// Create multer instance
const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

/**
 * Upload middleware with error handling
 * Rejects large files and invalid types early in the pipeline
 */
export const upload = {
  single: (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const uploadHandler = multerUpload.single(fieldName);

      uploadHandler(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          // Multer-specific errors
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              success: false,
              message: 'Kích thước file vượt quá giới hạn 5MB',
              errors: ['FILE_TOO_LARGE']
            });
            return;
          }

          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            res.status(400).json({
              success: false,
              message: 'Trường file không hợp lệ',
              errors: ['INVALID_FIELD']
            });
            return;
          }

          res.status(400).json({
            success: false,
            message: `Lỗi upload file: ${err.message}`,
            errors: ['UPLOAD_ERROR']
          });
          return;
        } else if (err) {
          // Custom errors (e.g., from fileFilter)
          res.status(400).json({
            success: false,
            message: err.message,
            errors: ['INVALID_FILE_TYPE']
          });
          return;
        }

        // No error, proceed
        next();
      });
    };
  }
};

