/**
 * UploadMiddleware - File Upload Middleware
 * Handles file uploads using multer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture
 */

import multer from 'multer';

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
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

