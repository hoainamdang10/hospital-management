/**
 * File Upload Validation and Security
 * Validates file uploads for security and compliance
 */

import { z } from 'zod'

// Allowed MIME types for Free Tier
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
] as const

// File size limits (2MB for Free Tier)
export const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
export const MIN_FILE_SIZE = 1024 // 1KB

// Document types
export const DOCUMENT_TYPES = [
  'id_card',
  'insurance_card',
  'medical_record',
  'other',
] as const

// File validation schema
export const fileValidationSchema = z.object({
  name: z.string().min(1, 'File name is required').max(255, 'File name too long'),
  size: z.number()
    .min(MIN_FILE_SIZE, `File must be at least ${MIN_FILE_SIZE} bytes`)
    .max(MAX_FILE_SIZE, `File must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`),
  type: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'File type not allowed. Only JPG, PNG, and PDF files are supported.' })
  }),
  lastModified: z.number().optional(),
})

export type FileValidationInput = z.infer<typeof fileValidationSchema>

// File validation result
export interface FileValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  sanitizedName: string
  detectedMimeType?: string
}

// Dangerous file extensions to block
const DANGEROUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
  '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.bin',
  '.sh', '.bash', '.zsh', '.fish', '.ps1', '.psm1',
]

// Magic bytes for MIME type detection
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
}

/**
 * Validate file based on metadata
 */
export function validateFileMetadata(file: FileValidationInput): FileValidationResult {
  const result: FileValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    sanitizedName: sanitizeFileName(file.name),
  }

  // Validate using Zod schema
  const validation = fileValidationSchema.safeParse(file)
  if (!validation.success) {
    result.valid = false
    result.errors.push(...validation.error.errors.map(e => e.message))
    return result
  }

  // Check for dangerous extensions
  const extension = getFileExtension(file.name).toLowerCase()
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    result.valid = false
    result.errors.push('File type is not allowed for security reasons')
  }

  // Validate file extension matches MIME type
  const expectedExtensions = getMimeTypeExtensions(file.type)
  if (!expectedExtensions.includes(extension)) {
    result.warnings.push(`File extension ${extension} doesn't match MIME type ${file.type}`)
  }

  // Check for suspicious file names
  if (containsSuspiciousPatterns(file.name)) {
    result.warnings.push('File name contains suspicious patterns')
  }

  return result
}

/**
 * Validate file content by checking magic bytes
 */
export async function validateFileContent(file: File): Promise<FileValidationResult> {
  const result: FileValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    sanitizedName: sanitizeFileName(file.name),
  }

  try {
    // Read first 16 bytes for magic byte detection
    const buffer = await file.slice(0, 16).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Detect MIME type from magic bytes
    const detectedMimeType = detectMimeType(bytes)
    result.detectedMimeType = detectedMimeType

    // Check if detected MIME type matches declared type
    if (detectedMimeType && detectedMimeType !== file.type) {
      result.valid = false
      result.errors.push(
        `File content doesn't match declared type. Expected: ${file.type}, Detected: ${detectedMimeType}`
      )
    }

    // If no MIME type detected, it might be suspicious
    if (!detectedMimeType) {
      result.warnings.push('Could not detect file type from content')
    }

  } catch (error) {
    result.valid = false
    result.errors.push('Failed to read file content for validation')
  }

  return result
}

/**
 * Comprehensive file validation (metadata + content)
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  // First validate metadata
  const metadataResult = validateFileMetadata({
    name: file.name,
    size: file.size,
    type: file.type as any,
    lastModified: file.lastModified,
  })

  if (!metadataResult.valid) {
    return metadataResult
  }

  // Then validate content
  const contentResult = await validateFileContent(file)
  
  // Combine results
  return {
    valid: metadataResult.valid && contentResult.valid,
    errors: [...metadataResult.errors, ...contentResult.errors],
    warnings: [...metadataResult.warnings, ...contentResult.warnings],
    sanitizedName: metadataResult.sanitizedName,
    detectedMimeType: contentResult.detectedMimeType,
  }
}

/**
 * Generate secure file path for storage
 */
export function generateSecureFilePath(
  userId: string,
  documentType: string,
  originalName: string
): string {
  const sanitizedName = sanitizeFileName(originalName)
  const extension = getFileExtension(sanitizedName)
  const uuid = crypto.randomUUID()
  
  return `users/${userId}/${documentType}/${uuid}${extension}`
}

/**
 * Sanitize file name for security
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 255) // Limit length
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  return lastDot === -1 ? '' : fileName.substring(lastDot)
}

/**
 * Get expected extensions for MIME type
 */
export function getMimeTypeExtensions(mimeType: string): string[] {
  const extensions: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/pdf': ['.pdf'],
  }
  
  return extensions[mimeType] || []
}

/**
 * Detect MIME type from magic bytes
 */
export function detectMimeType(bytes: Uint8Array): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (matchesSignature(bytes, signature)) {
        return mimeType
      }
    }
  }
  return null
}

/**
 * Check if bytes match magic signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) return false
  
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) return false
  }
  
  return true
}

/**
 * Check for suspicious patterns in filename
 */
function containsSuspiciousPatterns(fileName: string): boolean {
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
    /\.\w+\.(exe|bat|cmd)$/i, // Double extension
    /%[0-9a-f]{2}/i, // URL encoded characters
    /[<>:"|?*]/,     // Windows forbidden characters
    /^\./,           // Hidden files
    /\x00/,          // Null bytes
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(fileName))
}

/**
 * Virus scanning stub (for future implementation)
 */
export async function scanForVirus(file: File): Promise<{
  clean: boolean
  threat?: string
}> {
  // This is a stub implementation
  // In production, you would integrate with a virus scanning service
  // For Free Tier, we'll do basic checks
  
  const suspiciousContent = await checkSuspiciousContent(file)
  
  return {
    clean: !suspiciousContent.suspicious,
    threat: suspiciousContent.threat,
  }
}

/**
 * Basic suspicious content detection
 */
async function checkSuspiciousContent(file: File): Promise<{
  suspicious: boolean
  threat?: string
}> {
  try {
    // Read first 1KB for basic checks
    const buffer = await file.slice(0, 1024).arrayBuffer()
    const bytes = new Uint8Array(buffer)
    
    // Check for executable signatures
    const executableSignatures = [
      [0x4D, 0x5A], // MZ (Windows executable)
      [0x7F, 0x45, 0x4C, 0x46], // ELF (Linux executable)
      [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O (macOS executable)
    ]
    
    for (const signature of executableSignatures) {
      if (matchesSignature(bytes, signature)) {
        return {
          suspicious: true,
          threat: 'Executable file detected',
        }
      }
    }
    
    return { suspicious: false }
  } catch (error) {
    return {
      suspicious: true,
      threat: 'Failed to scan file content',
    }
  }
}

// Export types
export type DocumentType = typeof DOCUMENT_TYPES[number]
export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number]
