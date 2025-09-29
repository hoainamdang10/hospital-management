"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filesApi, type UploadResult } from "@/lib/api/files";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

interface FileUploadZoneProps {
  onUploadSuccess?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  documentType?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
}

interface FileWithPreview extends File {
  preview?: string;
  uploadStatus?: "pending" | "uploading" | "success" | "error";
  uploadError?: string;
}

const DOCUMENT_TYPES = [
  { value: "medical_report", label: "Báo cáo y tế" },
  { value: "lab_result", label: "Kết quả xét nghiệm" },
  { value: "prescription", label: "Đơn thuốc" },
  { value: "insurance_card", label: "Thẻ bảo hiểm" },
  { value: "id_card", label: "CMND/CCCD" },
  { value: "x_ray", label: "X-quang" },
  { value: "ct_scan", label: "CT Scan" },
  { value: "mri_scan", label: "MRI" },
  { value: "ultrasound", label: "Siêu âm" },
  { value: "profile_photo", label: "Ảnh đại diện" },
  { value: "consent_form", label: "Phiếu đồng ý" },
  { value: "discharge_summary", label: "Tóm tắt xuất viện" },
  { value: "other", label: "Khác" },
];

const DEFAULT_ACCEPT = {
  "image/*": [".jpeg", ".jpg", ".png", ".webp"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
};

export function FileUploadZone({
  onUploadSuccess,
  onUploadError,
  documentType: initialDocumentType,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = DEFAULT_ACCEPT,
  className,
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [documentType, setDocumentType] = useState(initialDocumentType || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      rejectedFiles.forEach((file) => {
        const { errors } = file;
        errors.forEach((error: any) => {
          if (error.code === "file-too-large") {
            toast.error(
              `File ${file.file.name} quá lớn (tối đa ${filesApi.formatFileSize(
                maxSize
              )})`
            );
          } else if (error.code === "file-invalid-type") {
            toast.error(`File ${file.file.name} không được hỗ trợ`);
          } else {
            toast.error(`Lỗi với file ${file.file.name}: ${error.message}`);
          }
        });
      });

      // Add accepted files
      const newFiles = acceptedFiles.map((file) => {
        const fileWithPreview = file as FileWithPreview;
        fileWithPreview.uploadStatus = "pending";

        // Create preview for images
        if (file.type.startsWith("image/")) {
          fileWithPreview.preview = URL.createObjectURL(file);
        }

        return fileWithPreview;
      });

      setFiles((prev) => [...prev, ...newFiles].slice(0, maxFiles));
    },
    [maxFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: maxFiles - files.length,
    maxSize,
    multiple: true,
  });

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const file = newFiles[index];

      // Revoke preview URL
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }

      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Vui lòng chọn ít nhất một file");
      return;
    }

    if (!documentType) {
      toast.error("Vui lòng chọn loại tài liệu");
      return;
    }

    setIsUploading(true);

    try {
      // Update all files status to uploading
      setFiles((prev) =>
        prev.map((file) => ({ ...file, uploadStatus: "uploading" as const }))
      );

      const result = await filesApi.uploadFiles(files, documentType);

      if (result.success) {
        // Update file statuses based on results
        setFiles((prev) =>
          prev.map((file, index) => {
            const uploadResult = result.data.results[index];
            return {
              ...file,
              uploadStatus: uploadResult?.success
                ? ("success" as const)
                : ("error" as const),
              uploadError: uploadResult?.success
                ? undefined
                : uploadResult?.errors?.join(", "),
            };
          })
        );

        if (result.data.summary.successful > 0) {
          toast.success(
            `Upload thành công ${result.data.summary.successful}/${result.data.summary.total} file`
          );

          onUploadSuccess?.(result.data.results);

          // Clear successful files after a delay
          setTimeout(() => {
            setFiles((prev) =>
              prev.filter((file) => file.uploadStatus !== "success")
            );
          }, 2000);
        }

        if (result.data.summary.failed > 0) {
          toast.error(`${result.data.summary.failed} file upload thất bại`);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload thất bại";
      toast.error(errorMessage);
      onUploadError?.(errorMessage);

      // Update all files to error status
      setFiles((prev) =>
        prev.map((file) => ({
          ...file,
          uploadStatus: "error" as const,
          uploadError: errorMessage,
        }))
      );
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (file.type === "application/pdf")
      return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "uploading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
        );
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Document Type Selection */}
      {!initialDocumentType && (
        <div>
          <Label htmlFor="document-type">Loại tài liệu *</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại tài liệu" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Drop Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />

            {isDragActive ? (
              <p className="text-blue-600 font-medium">Thả file vào đây...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium text-blue-600 hover:text-blue-500">
                    Nhấp để chọn file
                  </span>{" "}
                  hoặc kéo thả file vào đây
                </p>
                <p className="text-sm text-gray-500">
                  Hỗ trợ: JPG, PNG, PDF, TXT • Tối đa {maxFiles} file •{" "}
                  {filesApi.formatFileSize(maxSize)} mỗi file
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">
                File đã chọn ({files.length}/{maxFiles})
              </h4>

              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {/* File Preview */}
                  <div className="flex-shrink-0">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        {getFileIcon(file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {filesApi.formatFileSize(file.size)}
                    </p>
                    {file.uploadError && (
                      <p className="text-xs text-red-600 mt-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {file.uploadError}
                      </p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    {getStatusIcon(file.uploadStatus)}

                    {file.uploadStatus !== "uploading" && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={isUploading}
          >
            Xóa tất cả
          </Button>

          <Button
            onClick={handleUpload}
            disabled={isUploading || !documentType}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Đang upload...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length} file
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

