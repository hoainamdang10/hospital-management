"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { filesApi, type DocumentInfo } from "@/lib/api/files";
import {
  Calendar,
  Download,
  FileText,
  Image,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FilePreviewProps {
  document: DocumentInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (document: DocumentInfo) => void;
}

export function FilePreview({
  document,
  isOpen,
  onClose,
  onDownload,
}: FilePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (document && isOpen) {
      loadPreview();
    } else {
      setPreviewUrl(null);
      setError(null);
      setZoom(100);
    }

    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document, isOpen]);

  const loadPreview = async () => {
    if (!document) return;

    setLoading(true);
    setError(null);

    try {
      if (document.mime_type.startsWith("image/")) {
        // Load image preview
        const url = await filesApi.getDocumentPreview(document.id, "preview");
        setPreviewUrl(url);
      } else if (document.mime_type === "application/pdf") {
        // For PDF, we'll show a message about downloading
        setPreviewUrl(null);
      } else {
        setError("Xem trước không khả dụng cho loại file này");
      }
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Không thể tải xem trước");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const blob = await filesApi.downloadDocument(document.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = document.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Đã tải xuống ${document.file_name}`);
      onDownload?.(document);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Không thể tải xuống file");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-8 w-8" />;
    if (mimeType === "application/pdf") return <FileText className="h-8 w-8" />;
    return <FileText className="h-8 w-8" />;
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-lg">
            {getFileIcon(document.mime_type)}
            <div className="flex-1 min-w-0">
              <div className="truncate">{document.file_name}</div>
              <div className="text-sm text-gray-500 font-normal">
                {filesApi.getDocumentTypeDisplayName(document.document_type)} •{" "}
                {filesApi.formatFileSize(document.file_size)}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* File Info */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">
                    Loại tài liệu:
                  </span>
                  <span className="ml-2">
                    {filesApi.getDocumentTypeDisplayName(
                      document.document_type
                    )}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Kích thước:</span>
                  <span className="ml-2">
                    {filesApi.formatFileSize(document.file_size)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Định dạng:</span>
                  <span className="ml-2">{document.mime_type}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                  <span className="font-medium text-gray-600">
                    Ngày tải lên:
                  </span>
                  <span className="ml-2">
                    {formatDate(document.created_at)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Area */}
          <div className="flex-1 overflow-hidden">
            {loading && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải xem trước...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống để xem
                  </Button>
                </div>
              </div>
            )}

            {!loading && !error && previewUrl && (
              <div className="h-full flex flex-col">
                {/* Image Controls */}
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(Math.min(200, zoom + 25))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setZoom(100)}
                  >
                    Đặt lại
                  </Button>
                </div>

                {/* Image Preview */}
                <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt={document.file_name}
                    className="max-w-none"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
              </div>
            )}

            {!loading &&
              !error &&
              !previewUrl &&
              document.mime_type === "application/pdf" && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Tài liệu PDF
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Nhấp vào nút bên dưới để tải xuống và xem tài liệu PDF
                    </p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Tải xuống PDF
                    </Button>
                  </div>
                </div>
              )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              {document.checksum && (
                <span>Checksum: {document.checksum.substring(0, 8)}...</span>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Tải xuống
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

