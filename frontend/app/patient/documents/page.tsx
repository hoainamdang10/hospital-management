"use client";

import { FilePreview } from "@/components/files/FilePreview";
import { FilesList } from "@/components/files/FilesList";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { PatientLayout } from "@/components/layout/UniversalLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type DocumentInfo } from "@/lib/api/files";
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper";
import {
  AlertCircle,
  FileText,
  HelpCircle,
  Shield,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PatientDocumentsPage() {
  const { user, loading } = useEnhancedAuth();
  const [selectedDocument, setSelectedDocument] = useState<DocumentInfo | null>(
    null
  );
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("files");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileSelect = (document: DocumentInfo) => {
    setSelectedDocument(document);
    setIsPreviewOpen(true);
  };

  const handleFileDelete = (fileId: string) => {
    // Refresh the files list
    setRefreshKey((prev) => prev + 1);
    toast.success("File đã được xóa thành công");
  };

  const handleUploadSuccess = () => {
    // Switch to files tab and refresh list
    setActiveTab("files");
    setRefreshKey((prev) => prev + 1);
    toast.success("Upload thành công!");
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </PatientLayout>
    );
  }

  if (!user || user.role !== "patient") {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Truy cập bị từ chối. Cần quyền bệnh nhân.
            </p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tài liệu y tế</h1>
          <p className="text-gray-600 mt-2">
            Quản lý và xem các tài liệu y tế của bạn một cách an toàn
          </p>
        </div>

        {/* Security Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  Bảo mật thông tin
                </h3>
                <p className="text-sm text-blue-800">
                  Tất cả tài liệu của bạn được mã hóa và bảo mật theo tiêu chuẩn
                  y tế. Chỉ bạn và đội ngũ y tế được ủy quyền mới có thể truy
                  cập.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tài liệu của tôi
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Tải lên
            </TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-6">
            <FilesList
              key={refreshKey}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
            />
          </TabsContent>

          <TabsContent value="upload" className="space-y-6">
            {/* Upload Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  Hướng dẫn tải lên
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Loại file được hỗ trợ:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Hình ảnh: JPG, PNG, WebP</li>
                      <li>• Tài liệu: PDF</li>
                      <li>• Văn bản: TXT</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Yêu cầu:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Tối đa 5 file mỗi lần</li>
                      <li>• Kích thước tối đa: 5MB/file</li>
                      <li>• Chọn đúng loại tài liệu</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    Lưu ý quan trọng:
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Không tải lên thông tin nhạy cảm không cần thiết</li>
                    <li>• Đảm bảo chất lượng hình ảnh rõ nét, dễ đọc</li>
                    <li>• Đặt tên file có ý nghĩa để dễ tìm kiếm sau này</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Upload Zone */}
            <Card>
              <CardHeader>
                <CardTitle>Tải lên tài liệu mới</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploadZone
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={(error) => toast.error(error)}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* File Preview Modal */}
        <FilePreview
          document={selectedDocument}
          isOpen={isPreviewOpen}
          onClose={() => {
            setIsPreviewOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={(document) => {
            toast.success(`Đã tải xuống ${document.file_name}`);
          }}
        />
      </div>
    </PatientLayout>
  );
}

