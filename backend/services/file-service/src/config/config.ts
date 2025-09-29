import dotenv from "dotenv";

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3107", 10),

  // Database
  supabase: {
    url: process.env.SUPABASE_URL!,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    anonKey: process.env.SUPABASE_ANON_KEY!,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || "documents",
  },

  // Security
  allowedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://hospital-management.vercel.app",
    process.env.FRONTEND_URL,
  ].filter((url): url is string => Boolean(url)),

  // File upload configuration
  fileUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10, // Maximum files per upload
    allowedTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],

    // Medical document types
    documentTypes: [
      "medical_report",
      "lab_result",
      "prescription",
      "insurance_card",
      "id_card",
      "x_ray",
      "ct_scan",
      "mri_scan",
      "ultrasound",
      "medical_record",
      "discharge_summary",
      "vaccination_record",
      "allergy_record",
      "consultation_note",
      "profile_photo",
      "consent_form",
      "other",
    ],
  },

  // Image processing
  imageProcessing: {
    thumbnailSize: { width: 200, height: 200 },
    previewSize: { width: 800, height: 600 },
    quality: 85,
    format: "jpeg" as const,
  },

  // Security scanning
  security: {
    virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === "true",
    maxScanTimeMs: 30000, // 30 seconds
    quarantineEnabled: true,
  },

  // Audit logging
  audit: {
    enabled: true,
    retentionDays: 365 * 7, // 7 years for medical records
  },
};

// Validate required environment variables
const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}
