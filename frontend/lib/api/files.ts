import { createClient } from "@/lib/supabase/client";

export interface DocumentInfo {
  id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  checksum?: string;
  upload_status: "pending" | "completed" | "failed" | "deleted";
  virus_scan_status?: "pending" | "clean" | "infected" | "error";
  verified?: boolean;
  verified_by?: string;
  verified_at?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UploadResult {
  fileName: string;
  success: boolean;
  documentId?: string;
  filePath?: string;
  errors?: string[];
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    results: UploadResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
}

export interface DocumentsResponse {
  success: boolean;
  data: {
    documents: DocumentInfo[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class FilesAPI {
  private apiUrl: string;

  constructor() {
    this.apiUrl =
      process.env.NEXT_PUBLIC_FILE_SERVICE_URL || "http://localhost:3107";
  }

  private async getAuthHeaders() {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      Authorization: session?.access_token
        ? `Bearer ${session.access_token}`
        : "",
    };
  }

  /**
   * Upload files
   */
  async uploadFiles(
    files: File[],
    documentType: string,
    metadata?: Record<string, any>
  ): Promise<UploadResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const formData = new FormData();

      // Add files
      files.forEach((file) => {
        formData.append("files", file);
      });

      // Add document type
      formData.append("document_type", documentType);

      // Add metadata if provided
      if (metadata) {
        formData.append("metadata", JSON.stringify(metadata));
      }

      const response = await fetch(`${this.apiUrl}/api/documents/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: { message: "Upload failed" } }));
        throw new Error(errorData.error?.message || "Upload failed");
      }

      return await response.json();
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(params?: {
    documentType?: string;
    uploadStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<DocumentsResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const urlParams = new URLSearchParams();

      if (params?.documentType)
        urlParams.append("document_type", params.documentType);
      if (params?.uploadStatus)
        urlParams.append("upload_status", params.uploadStatus);
      if (params?.page) urlParams.append("page", params.page.toString());
      if (params?.limit) urlParams.append("limit", params.limit.toString());

      const url = `${this.apiUrl}/api/documents${
        urlParams.toString() ? "?" + urlParams.toString() : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching documents:", error);
      throw error;
    }
  }

  /**
   * Get document details
   */
  async getDocument(
    id: string
  ): Promise<{ success: boolean; data: DocumentInfo }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.apiUrl}/api/documents/${id}`, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error("Document not found");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching document:", error);
      throw error;
    }
  }

  /**
   * Download document
   */
  async downloadDocument(id: string): Promise<Blob> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.apiUrl}/api/documents/${id}/download`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      return await response.blob();
    } catch (error) {
      console.error("Error downloading document:", error);
      throw error;
    }
  }

  /**
   * Get document preview
   */
  async getDocumentPreview(
    id: string,
    size: "thumbnail" | "preview" = "thumbnail"
  ): Promise<string> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(
        `${this.apiUrl}/api/documents/${id}/preview?size=${size}`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Preview not available");
      }

      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error fetching preview:", error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(
    id: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.apiUrl}/api/documents/${id}`, {
        method: "DELETE",
        headers,
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  /**
   * Utility: Format file size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Utility: Get document type display name
   */
  static getDocumentTypeDisplayName(type: string): string {
    const displayNames: Record<string, string> = {
      medical_report: "Báo cáo y tế",
      lab_result: "Kết quả xét nghiệm",
      prescription: "Đơn thuốc",
      insurance_card: "Thẻ bảo hiểm",
      id_card: "CMND/CCCD",
      x_ray: "X-quang",
      ct_scan: "CT Scan",
      mri_scan: "MRI",
      ultrasound: "Siêu âm",
      medical_record: "Hồ sơ y tế",
      discharge_summary: "Tóm tắt xuất viện",
      vaccination_record: "Sổ tiêm chủng",
      allergy_record: "Hồ sơ dị ứng",
      consultation_note: "Ghi chú khám bệnh",
      profile_photo: "Ảnh đại diện",
      consent_form: "Phiếu đồng ý",
      other: "Khác",
    };

    return displayNames[type] || type;
  }

  /**
   * Utility: Get file icon based on MIME type
   */
  static getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType === "application/pdf") return "📄";
    if (mimeType.startsWith("text/")) return "📝";
    return "📎";
  }
}

export const filesApi = new FilesAPI();
export { FilesAPI };
