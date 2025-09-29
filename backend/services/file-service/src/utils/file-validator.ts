import crypto from "crypto";
import { fromBuffer } from "file-type";
import { config } from "../config/config";
import { FileError } from "../middleware/error.middleware";
import { logger } from "./logger";

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  fileInfo: {
    originalName: string;
    size: number;
    mimeType: string;
    detectedMimeType?: string;
    extension?: string;
    checksum: string;
  };
}

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  size: number;
  mimetype: string;
}

export class FileValidator {
  // Validate file type and content
  static async validateFile(file: UploadedFile): Promise<FileValidationResult> {
    const errors: string[] = [];

    try {
      // Generate file checksum
      const checksum = crypto
        .createHash("sha256")
        .update(file.buffer)
        .digest("hex");

      // Detect actual file type from buffer
      const detectedType = await fromBuffer(file.buffer);

      const result: FileValidationResult = {
        isValid: true,
        errors: [],
        fileInfo: {
          originalName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          detectedMimeType: detectedType?.mime,
          extension: detectedType?.ext,
          checksum,
        },
      };

      // 1. Check file size
      if (file.size > config.fileUpload.maxSize) {
        errors.push(
          `File size ${file.size} exceeds maximum allowed size of ${config.fileUpload.maxSize} bytes`
        );
      }

      if (file.size === 0) {
        errors.push("File is empty");
      }

      // 2. Check file name
      if (!file.originalname || file.originalname.trim() === "") {
        errors.push("File name is required");
      }

      if (file.originalname.length > 255) {
        errors.push("File name too long (max 255 characters)");
      }

      // Check for dangerous characters in filename
      const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
      if (dangerousChars.test(file.originalname)) {
        errors.push("File name contains invalid characters");
      }

      // 3. Validate MIME type
      if (!config.fileUpload.allowedTypes.includes(file.mimetype)) {
        errors.push(`File type ${file.mimetype} is not allowed`);
      }

      // 4. Cross-check declared vs detected MIME type
      if (detectedType) {
        if (file.mimetype !== detectedType.mime) {
          // Allow some common variations
          const isAcceptableVariation = this.isAcceptableMimeVariation(
            file.mimetype,
            detectedType.mime
          );

          if (!isAcceptableVariation) {
            errors.push(
              `File type mismatch: declared ${file.mimetype}, detected ${detectedType.mime}`
            );
          }
        }
      } else {
        // For text files and some formats, file-type might not detect
        if (
          !file.mimetype.startsWith("text/") &&
          file.mimetype !== "application/pdf"
        ) {
          logger.warn("Could not detect file type", {
            originalName: file.originalname,
            declaredType: file.mimetype,
          });
        }
      }

      // 5. Additional security checks
      await this.performSecurityChecks(file, errors);

      result.errors = errors;
      result.isValid = errors.length === 0;

      return result;
    } catch (error) {
      logger.error("Error validating file", {
        error,
        fileName: file.originalname,
      });
      throw new FileError("File validation failed");
    }
  }

  // Check for acceptable MIME type variations
  private static isAcceptableMimeVariation(
    declared: string,
    detected: string
  ): boolean {
    const variations: Record<string, string[]> = {
      "image/jpeg": ["image/jpg"],
      "image/jpg": ["image/jpeg"],
      "application/pdf": ["application/x-pdf"],
      "text/plain": ["text/x-plain"],
    };

    return (
      variations[declared]?.includes(detected) ||
      variations[detected]?.includes(declared) ||
      false
    );
  }

  // Perform additional security checks
  private static async performSecurityChecks(
    file: UploadedFile,
    errors: string[]
  ): Promise<void> {
    try {
      // Check for embedded executables in images/PDFs
      const buffer = file.buffer;

      // Look for common executable signatures
      const executableSignatures = [
        Buffer.from([0x4d, 0x5a]), // MZ (Windows executable)
        Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF (Linux executable)
        Buffer.from([0xfe, 0xed, 0xfa, 0xce]), // Mach-O (macOS executable)
        Buffer.from([0xfe, 0xed, 0xfa, 0xcf]), // Mach-O 64-bit
      ];

      for (const signature of executableSignatures) {
        if (buffer.indexOf(signature) !== -1) {
          errors.push("File contains potentially malicious executable content");
          break;
        }
      }

      // Check for suspicious JavaScript in files
      const jsPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi, // event handlers
        /eval\s*\(/gi,
        /Function\s*\(/gi,
      ];

      const fileContent = buffer.toString("utf8");
      for (const pattern of jsPatterns) {
        if (pattern.test(fileContent)) {
          errors.push("File contains potentially malicious script content");
          break;
        }
      }

      // PDF-specific checks
      if (file.mimetype === "application/pdf") {
        await this.validatePDF(buffer, errors);
      }

      // Image-specific checks
      if (file.mimetype.startsWith("image/")) {
        await this.validateImage(buffer, errors);
      }
    } catch (error) {
      logger.error("Error in security checks", {
        error,
        fileName: file.originalname,
      });
      // Don't fail validation for security check errors, just log them
    }
  }

  // PDF-specific validation
  private static async validatePDF(
    buffer: Buffer,
    errors: string[]
  ): Promise<void> {
    try {
      // Check PDF header
      const pdfHeader = buffer.slice(0, 4).toString();
      if (pdfHeader !== "%PDF") {
        errors.push("Invalid PDF format");
        return;
      }

      // Check for JavaScript in PDF
      const content = buffer.toString("binary");
      if (content.includes("/JavaScript") || content.includes("/JS")) {
        errors.push("PDF contains JavaScript (not allowed for security)");
      }

      // Check for forms with actions
      if (content.includes("/SubmitForm") || content.includes("/Launch")) {
        errors.push("PDF contains interactive forms (not allowed)");
      }
    } catch (error) {
      logger.error("PDF validation error", { error });
    }
  }

  // Image-specific validation
  private static async validateImage(
    buffer: Buffer,
    errors: string[]
  ): Promise<void> {
    try {
      // Check for EXIF data that might contain sensitive information
      // This is a basic check - in production, you might want to strip EXIF data
      const content = buffer.toString("binary");

      // Look for common EXIF markers
      if (content.includes("GPS") || content.includes("location")) {
        logger.warn("Image may contain GPS/location data", {
          size: buffer.length,
        });
        // Note: Not adding to errors as this might be legitimate for medical images
      }

      // Check for extremely large images that might be used for DoS
      if (buffer.length > 5 * 1024 * 1024) {
        // 5MB
        logger.warn("Large image file detected", { size: buffer.length });
      }
    } catch (error) {
      logger.error("Image validation error", { error });
    }
  }

  // Validate document type for medical categories
  static validateMedicalDocumentType(
    documentType: string,
    mimeType: string
  ): boolean {
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

    const allowedTypes = medicalTypeRestrictions[documentType];
    return allowedTypes ? allowedTypes.includes(mimeType) : true;
  }

  // Generate secure filename
  static generateSecureFileName(
    originalName: string,
    userId: string,
    documentType: string
  ): string {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString("hex");
    const extension = originalName.split(".").pop()?.toLowerCase() || "bin";

    // Clean the original name
    const cleanName = originalName
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .substring(0, 50);

    return `${userId}/${documentType}/${timestamp}_${randomId}_${cleanName}.${extension}`;
  }
}
