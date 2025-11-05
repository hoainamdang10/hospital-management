"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { clinicalNotesServiceAPI } from "../../services/clinical-notes/ClinicalNotesServiceAPI";
import { Plus, Edit2, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ClinicalNote } from "../../services/clinical-notes/ClinicalNotesServiceAPI";

export function ClinicalNotesManagement({ patientId }: { patientId?: string }) {
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null);
  const [formData, setFormData] = useState({
    patientId: patientId || "",
    noteType: "progress" as
      | "progress"
      | "assessment"
      | "plan"
      | "procedure"
      | "discharge",
    content: "",
  });

  useEffect(() => {
    loadNotes();
  }, [patientId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (patientId) params.patientId = patientId;

      const response = await clinicalNotesServiceAPI.getAllClinicalNotes(
        params
      );
      if (response.success && response.data) {
        setNotes(
          Array.isArray(response.data) ? response.data : [response.data]
        );
      }
    } catch (err) {
      toast.error("Lỗi tải danh sách clinical notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.patientId || !formData.content.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("hospital_user") || "{}");
      const response = await clinicalNotesServiceAPI.createClinicalNote({
        patientId: formData.patientId,
        authorId: user.id,
        authorName: user.name || user.email,
        noteType: formData.noteType,
        content: formData.content,
        status: "draft",
      } as any);

      if (response.success) {
        toast.success("Đã tạo clinical note thành công!");
        setShowDialog(false);
        setFormData({
          patientId: patientId || "",
          noteType: "progress",
          content: "",
        });
        loadNotes();
      } else {
        toast.error(response.error || "Không thể tạo clinical note");
      }
    } catch (err) {
      toast.error("Lỗi tạo clinical note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedNote || !formData.content.trim()) {
      return;
    }

    setLoading(true);
    try {
      const response = await clinicalNotesServiceAPI.updateClinicalNote(
        selectedNote.id,
        {
          content: formData.content,
          noteType: formData.noteType,
        }
      );

      if (response.success) {
        toast.success("Đã cập nhật clinical note thành công!");
        setShowDialog(false);
        setSelectedNote(null);
        loadNotes();
      } else {
        toast.error(response.error || "Không thể cập nhật clinical note");
      }
    } catch (err) {
      toast.error("Lỗi cập nhật clinical note");
    } finally {
      setLoading(false);
    }
  };

  const handleCosign = async (noteId: string) => {
    const user = JSON.parse(localStorage.getItem("hospital_user") || "{}");
    setLoading(true);
    try {
      const response = await clinicalNotesServiceAPI.cosignClinicalNote(
        noteId,
        user.id
      );
      if (response.success) {
        toast.success("Đã cosign clinical note thành công!");
        loadNotes();
      } else {
        toast.error(response.error || "Không thể cosign");
      }
    } catch (err) {
      toast.error("Lỗi cosign clinical note");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (note: ClinicalNote) => {
    setSelectedNote(note);
    setFormData({
      patientId: note.patientId,
      noteType: note.noteType,
      content: note.content,
    });
    setShowDialog(true);
  };

  const openCreateDialog = () => {
    setSelectedNote(null);
    setFormData({
      patientId: patientId || "",
      noteType: "progress",
      content: "",
    });
    setShowDialog(true);
  };

  const getNoteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      progress: "Tiến triển",
      assessment: "Đánh giá",
      plan: "Kế hoạch",
      procedure: "Thủ thuật",
      discharge: "Xuất viện",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "outline",
      final: "default",
      cosigned: "secondary",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status === "draft" && "Nháp"}
        {status === "final" && "Hoàn thành"}
        {status === "cosigned" && "Đã cosign"}
      </Badge>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Clinical Notes</CardTitle>
            <CardDescription>
              Quản lý ghi chú lâm sàng cho bệnh nhân
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Tạo note
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && notes.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Chưa có clinical notes nào
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại</TableHead>
                <TableHead>Bệnh nhân</TableHead>
                <TableHead>Tác giả</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notes.map((note) => (
                <TableRow key={note.id}>
                  <TableCell>
                    <Badge variant="outline">
                      {getNoteTypeLabel(note.noteType)}
                    </Badge>
                  </TableCell>
                  <TableCell>{note.patientName}</TableCell>
                  <TableCell>{note.authorName}</TableCell>
                  <TableCell>
                    {new Date(note.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell>{getStatusBadge(note.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(note)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {note.status === "final" && !note.cosignedBy && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCosign(note.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedNote
                  ? "Chỉnh sửa Clinical Note"
                  : "Tạo Clinical Note mới"}
              </DialogTitle>
              <DialogDescription>
                {selectedNote
                  ? "Cập nhật thông tin clinical note"
                  : "Tạo ghi chú lâm sàng mới cho bệnh nhân"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!patientId && (
                <div>
                  <Label htmlFor="patientId">Bệnh nhân</Label>
                  <Input
                    id="patientId"
                    value={formData.patientId}
                    onChange={(e) =>
                      setFormData({ ...formData, patientId: e.target.value })
                    }
                    placeholder="Nhập ID bệnh nhân"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="noteType">Loại note</Label>
                <Select
                  value={formData.noteType}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, noteType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="progress">Tiến triển</SelectItem>
                    <SelectItem value="assessment">Đánh giá</SelectItem>
                    <SelectItem value="plan">Kế hoạch</SelectItem>
                    <SelectItem value="procedure">Thủ thuật</SelectItem>
                    <SelectItem value="discharge">Xuất viện</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="content">Nội dung</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder="Nhập nội dung clinical note..."
                  rows={10}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Hủy
              </Button>
              <Button
                onClick={selectedNote ? handleUpdate : handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : selectedNote ? (
                  "Cập nhật"
                ) : (
                  "Tạo"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
