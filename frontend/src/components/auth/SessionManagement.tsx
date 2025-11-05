"use client";

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Alert, AlertDescription } from "../ui/alert";
import { userServiceAPI } from "../../services/user/UserServiceAPI";
import { authService } from "./services";
import { Monitor, Trash2, LogOut, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface Session {
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  isCurrent: boolean;
}

export function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [showLogoutAllDialog, setShowLogoutAllDialog] = useState(false);

  const user = authService.getCurrentUser();

  useEffect(() => {
    if (user?.id) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError("");
    try {
      const response = await userServiceAPI.getUserSessions(user.id);
      if (response.success && response.data) {
        setSessions(response.data);
      } else {
        setError(response.error || "Không thể tải danh sách sessions");
      }
    } catch (err) {
      setError("Lỗi tải danh sách sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await userServiceAPI.deleteSession(user.id, sessionId);
      if (response.success) {
        toast.success("Đã xóa session thành công");
        loadSessions();
      } else {
        toast.error(response.error || "Không thể xóa session");
      }
    } catch (err) {
      toast.error("Lỗi xóa session");
    } finally {
      setLoading(false);
      setDeleteSessionId(null);
    }
  };

  const handleLogoutAll = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await userServiceAPI.logoutAllSessions(user.id);
      if (response.success) {
        toast.success("Đã đăng xuất tất cả sessions");
        // Redirect to login after logout all
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      } else {
        toast.error(response.error || "Không thể đăng xuất tất cả sessions");
      }
    } catch (err) {
      toast.error("Lỗi đăng xuất tất cả sessions");
    } finally {
      setLoading(false);
      setShowLogoutAllDialog(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getBrowserName = (userAgent: string) => {
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown";
  };

  if (loading && sessions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quản lý Sessions</CardTitle>
          <CardDescription>Danh sách các thiết bị đã đăng nhập</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Quản lý Sessions</CardTitle>
              <CardDescription>
                Danh sách các thiết bị đã đăng nhập tài khoản của bạn
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="destructive"
                onClick={() => setShowLogoutAllDialog(true)}
                disabled={loading}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất tất cả
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Không có sessions nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thiết bị</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Đăng nhập lúc</TableHead>
                  <TableHead>Hoạt động lần cuối</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.sessionId}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-400" />
                        <span>{getBrowserName(session.userAgent)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{session.ipAddress}</TableCell>
                    <TableCell>{formatDate(session.createdAt)}</TableCell>
                    <TableCell>{formatDate(session.lastActivity)}</TableCell>
                    <TableCell>
                      {session.isCurrent ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          Hiện tại
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                          Khác
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!session.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteSessionId(session.sessionId)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Session Dialog */}
      <AlertDialog
        open={deleteSessionId !== null}
        onOpenChange={(open) => !open && setDeleteSessionId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa session</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa session này? Thiết bị sẽ bị đăng xuất.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteSessionId && handleDeleteSession(deleteSessionId)
              }
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout All Dialog */}
      <AlertDialog open={showLogoutAllDialog} onOpenChange={setShowLogoutAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đăng xuất tất cả sessions</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn đăng xuất tất cả thiết bị? Tất cả các thiết
              bị khác sẽ bị đăng xuất, bao gồm cả thiết bị hiện tại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutAll}>
              Đăng xuất tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

