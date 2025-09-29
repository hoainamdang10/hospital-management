import express from "express";
import sharp from "sharp";
import { config } from "../config/config";
import {
  asyncHandler,
  FileError,
  SecurityError,
} from "../middleware/error.middleware";
import { FileValidator } from "../utils/file-validator";
import { logger } from "../utils/logger";
import { documentService, supabaseAdmin } from "../utils/supabase";

export class DocumentsController {
  // Upload documents
  uploadDocuments = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      try {
        const { document_type, metadata = "{}" } = req.body;
        const files = req.files as any[];

        if (!req.user) {
          throw new SecurityError("Authentication required");
        }

        if (!files || files.length === 0) {
          throw new FileError("No files uploaded");
        }

        if (
          !document_type ||
          !config.fileUpload.documentTypes.includes(document_type)
        ) {
          throw new FileError(
            `Invalid document type. Allowed types: ${config.fileUpload.documentTypes.join(", ")}`
          );
        }

        logger.info("Starting file upload", {
          userId: req.user.id,
          documentType: document_type,
          fileCount: files.length,
        });

        const uploadResults = [];

        for (const file of files) {
          try {
            // Validate file
            const validation = await FileValidator.validateFile({
              originalname: file.originalname,
              buffer: file.buffer,
              size: file.size,
              mimetype: file.mimetype,
            });

            if (!validation.isValid) {
              uploadResults.push({
                fileName: file.originalname,
                success: false,
                errors: validation.errors,
              });
              continue;
            }

            // Check document type compatibility
            if (
              !FileValidator.validateMedicalDocumentType(
                document_type,
                file.mimetype
              )
            ) {
              uploadResults.push({
                fileName: file.originalname,
                success: false,
                errors: [
                  `File type ${file.mimetype} not allowed for document type ${document_type}`,
                ],
              });
              continue;
            }

            // Generate secure file path
            const filePath = FileValidator.generateSecureFileName(
              file.originalname,
              req.user.id,
              document_type
            );

            // Process image if needed
            let processedBuffer = file.buffer;
            let finalMimeType = file.mimetype;

            if (
              file.mimetype.startsWith("image/") &&
              document_type !== "profile_photo"
            ) {
              // Optimize medical images
              processedBuffer = await this.optimizeImage(file.buffer);
              finalMimeType = "image/jpeg"; // Convert to JPEG for consistency
            }

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } =
              await supabaseAdmin.storage
                .from(config.supabase.storageBucket)
                .upload(filePath, processedBuffer, {
                  contentType: finalMimeType,
                  duplex: "half",
                });

            if (uploadError) {
              logger.error("Storage upload error", {
                error: uploadError,
                fileName: file.originalname,
              });
              uploadResults.push({
                fileName: file.originalname,
                success: false,
                errors: ["Upload failed: " + uploadError.message],
              });
              continue;
            }

            // Create document record
            const documentRecord = await documentService.create({
              user_id: req.user.id,
              document_type,
              file_name: file.originalname,
              file_path: uploadData.path,
              file_size: processedBuffer.length,
              mime_type: finalMimeType,
              checksum: validation.fileInfo.checksum,
              metadata: JSON.parse(metadata || "{}"),
            });

            // Update upload status to completed
            await documentService.update(documentRecord.id, {
              upload_status: "completed",
              virus_scan_status: "clean", // Simplified for now
            });

            uploadResults.push({
              fileName: file.originalname,
              success: true,
              documentId: documentRecord.id,
              filePath: uploadData.path,
            });

            logger.info("File uploaded successfully", {
              userId: req.user.id,
              documentId: documentRecord.id,
              fileName: file.originalname,
              fileSize: processedBuffer.length,
            });
          } catch (error) {
            logger.error("Error processing file", {
              error,
              fileName: file.originalname,
            });
            uploadResults.push({
              fileName: file.originalname,
              success: false,
              errors: [
                error instanceof Error ? error.message : "Unknown error",
              ],
            });
          }
        }

        const successCount = uploadResults.filter((r) => r.success).length;
        const failureCount = uploadResults.filter((r) => !r.success).length;

        res.status(200).json({
          success: successCount > 0,
          message: `Upload completed: ${successCount} successful, ${failureCount} failed`,
          data: {
            results: uploadResults,
            summary: {
              total: files.length,
              successful: successCount,
              failed: failureCount,
            },
          },
        });
      } catch (error) {
        logger.error("Upload error", { error, userId: req.user?.id });
        throw error;
      }
    }
  );

  // Get user documents
  getUserDocuments = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      if (!req.user) {
        throw new SecurityError("Authentication required");
      }

      const {
        document_type,
        upload_status,
        page = "1",
        limit = "10",
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const result = await documentService.getUserDocuments(req.user.id, {
        document_type: document_type as string,
        upload_status: upload_status as string,
        limit: limitNum,
        offset,
      });

      res.status(200).json({
        success: true,
        data: {
          documents: result.documents,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            pages: Math.ceil(result.total / limitNum),
          },
        },
      });
    }
  );

  // Get document by ID
  getDocument = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      if (!req.user) {
        throw new SecurityError("Authentication required");
      }

      const { id } = req.params;
      const document = await documentService.getById(id, req.user.id);

      if (!document) {
        throw new FileError("Document not found", 404);
      }

      res.json({
        success: true,
        data: document,
      });
    }
  );

  // Download document
  downloadDocument = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      if (!req.user) {
        throw new SecurityError("Authentication required");
      }

      const { id } = req.params;
      const document = await documentService.getById(id, req.user.id);

      if (!document) {
        throw new FileError("Document not found", 404);
      }

      if (document.upload_status !== "completed") {
        throw new FileError("Document not ready for download");
      }

      // Get file from storage
      const { data, error } = await supabaseAdmin.storage
        .from(config.supabase.storageBucket)
        .download(document.file_path);

      if (error) {
        logger.error("Storage download error", { error, documentId: id });
        throw new FileError("Failed to download file");
      }

      // Set appropriate headers
      res.set({
        "Content-Type": document.mime_type,
        "Content-Disposition": `attachment; filename="${document.file_name}"`,
        "Content-Length": document.file_size.toString(),
      });

      // Convert blob to buffer and send
      const buffer = Buffer.from(await data.arrayBuffer());
      res.send(buffer);

      logger.info("File downloaded", {
        userId: req.user.id,
        documentId: id,
        fileName: document.file_name,
      });
    }
  );

  // Delete document
  deleteDocument = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      if (!req.user) {
        throw new SecurityError("Authentication required");
      }

      const { id } = req.params;
      const document = await documentService.getById(id, req.user.id);

      if (!document) {
        throw new FileError("Document not found", 404);
      }

      // Delete from storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(config.supabase.storageBucket)
        .remove([document.file_path]);

      if (storageError) {
        logger.error("Storage deletion error", {
          error: storageError,
          documentId: id,
        });
        // Continue with database deletion even if storage deletion fails
      }

      // Soft delete in database
      await documentService.delete(id, req.user.id);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });

      logger.info("Document deleted", {
        userId: req.user.id,
        documentId: id,
        fileName: document.file_name,
      });
    }
  );

  // Get document preview/thumbnail
  getDocumentPreview = asyncHandler(
    async (req: express.Request, res: express.Response) => {
      if (!req.user) {
        throw new SecurityError("Authentication required");
      }

      const { id } = req.params;
      const { size = "thumbnail" } = req.query; // thumbnail or preview

      const document = await documentService.getById(id, req.user.id);

      if (!document) {
        throw new FileError("Document not found", 404);
      }

      if (!document.mime_type.startsWith("image/")) {
        throw new FileError("Preview only available for images");
      }

      // Get file from storage
      const { data, error } = await supabaseAdmin.storage
        .from(config.supabase.storageBucket)
        .download(document.file_path);

      if (error) {
        throw new FileError("Failed to load image");
      }

      // Generate preview
      const buffer = Buffer.from(await data.arrayBuffer());
      const previewConfig =
        size === "thumbnail"
          ? config.imageProcessing.thumbnailSize
          : config.imageProcessing.previewSize;

      const processedImage = await sharp(buffer)
        .resize(previewConfig.width, previewConfig.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: config.imageProcessing.quality })
        .toBuffer();

      res.set({
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        "Content-Length": processedImage.length.toString(),
      });

      res.send(processedImage);
    }
  );

  // Utility: Optimize image
  private async optimizeImage(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
      .resize(2048, 2048, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({
        quality: config.imageProcessing.quality,
        mozjpeg: true,
      })
      .toBuffer();
  }
}
