"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { filesApi, type DocumentInfo } from "@/lib/api/files";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Image,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface FilesListProps {
  onFileSelect?: (file: DocumentInfo) => void;
  onFileDelete?: (fileId: string) => void;
  filterByType?: string;
  className?: string;
}

export function FilesList({
  onFileSelect,
  onFileDelete,
  filterByType,
  className,
}: FilesListProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState(filterByType || "all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiles, setTotalFiles] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const itemsPerPage = 10;

  useEffect(() => {
    loadDocuments();
  }, [currentPage, typeFilter, statusFilter]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getUserDocuments({
        documentType: typeFilter === "all" ? undefined : typeFilter,
        uploadStatus: statusFilter === "all" ? undefined : statusFilter,
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response.success) {
        setDocuments(response.data.documents);
        setTotalPages(response.data.pagination.pages);
        setTotalFiles(response.data.pagination.total);

        // Load previews for image files
        loadPreviews(response.data.documents);
      }
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Không thể tải danh sách file");
    } finally {
      setLoading(false);
    }
  };

  const loadPreviews = async (docs: DocumentInfo[]) => {
    const imageFiles = docs.filter((doc) => doc.mime_type.startsWith("image/"));

    const previewPromises = imageFiles.map(async (doc) => {
      try {
        const previewUrl = await filesApi.getDocumentPreview(
          doc.id,
          "thumbnail"
        );
        return { id: doc.id, url: previewUrl };
      } catch (error) {
        console.error(`Error loading preview for ${doc.id}:`, error);
        return null;
      }
    });

    const previewResults = await Promise.all(previewPromises);
    const previewMap = previewResults.reduce((acc, result) => {
      if (result) {
        acc[result.id] = result.url;
      }
      return acc;
    }, {} as Record<string, string>);

    setPreviews(previewMap);
  };

  const handleDownload = async (document: DocumentInfo) => {
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
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Không thể tải xuống file");
    }
  };

  const handleDelete = async (document: DocumentInfo) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa file "${document.file_name}"?`)) {
      return;
    }

    try {
      await filesApi.deleteDocument(document.id);
      toast.success("Đã xóa file thành công");
      onFileDelete?.(document.id);
      loadDocuments(); // Reload list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Không thể xóa file");
    }
  };

  const handlePreview = (document: DocumentInfo) => {
    onFileSelect?.(document);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (mimeType === "application/pdf") return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const getStatusBadge = (status: string, virusStatus: string) => {
    if (virusStatus === "infected") {
      return (
        <Badge variant="destructive" className="text-xs">
          <Shield className="h-3 w-3 mr-1" />
          Virus
        </Badge>
      );
    }

    switch (status) {
      case "completed":
        return (
          <Badge
            variant="default"
            className="text-xs bg-green-100 text-green-800"
          >
            Hoàn thành
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="text-xs">
            Đang xử lý
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="text-xs">
            Thất bại
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded bg-gray-200 h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Loại file" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="medical_report">Báo cáo y tế</SelectItem>
            <SelectItem value="lab_result">Kết quả XN</SelectItem>
            <SelectItem value="prescription">Đơn thuốc</SelectItem>
            <SelectItem value="x_ray">X-quang</SelectItem>
            <SelectItem value="ct_scan">CT Scan</SelectItem>
            <SelectItem value="mri_scan">MRI</SelectItem>
            <SelectItem value="other">Khác</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
            <SelectItem value="pending">Đang xử lý</SelectItem>
            <SelectItem value="failed">Thất bại</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <div className="space-y-3">
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không có file nào
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? "Không tìm thấy file nào phù hợp"
                  : "Chưa có file nào được upload"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments.map((document) => (
            <Card
              key={document.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* File Preview/Icon */}
                  <div className="flex-shrink-0">
                    {previews[document.id] ? (
                      <img
                        src={previews[document.id]}
                        alt={document.file_name}
                        className="h-12 w-12 object-cover rounded border"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded border flex items-center justify-center">
                        {getFileIcon(document.mime_type)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.file_name}
                      </h4>
                      {getStatusBadge(
                        document.upload_status,
                        document.virus_scan_status
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {filesApi.getDocumentTypeDisplayName(
                          document.document_type
                        )}
                      </span>
                      <span>{filesApi.formatFileSize(document.file_size)}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(document.created_at)}
                      </span>
                    </div>

                    {document.upload_status === "failed" && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        Upload failed
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {document.upload_status === "completed" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(document)}
                          title="Xem trước"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(document)}
                          title="Tải xuống"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(document)}
                      title="Xóa"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, totalFiles)} trong{" "}
            {totalFiles} file
          </p>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>

            <span className="text-sm text-gray-600">
              Trang {currentPage} / {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

