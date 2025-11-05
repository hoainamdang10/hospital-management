/**
 * UploadMiddleware - File Upload Middleware
 * Handles file uploads using multer
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Upload middleware with error handling
 * Rejects large files and invalid types early in the pipeline
 */
export declare const upload: {
    single: (fieldName: string) => (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=UploadMiddleware.d.ts.map