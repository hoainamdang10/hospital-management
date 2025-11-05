"use client";

import { Button } from "../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Wifi, WifiOff, Smartphone, Monitor, Zap } from "lucide-react";
import { useNetworkStatus, usePWA } from "./PWAHooks";
import { useNotifications } from "../communication/NotificationSystem";

export function StatusIndicator() {
  const { isOnline, connectionType } = useNetworkStatus();
  const { isInstalled, addToHomeScreen } = usePWA();
  const { addNotification } = useNotifications();

  const getConnectionIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;

    switch (connectionType) {
      case "slow-2g":
      case "2g":
        return <Wifi className="h-4 w-4 text-red-500" />;
      case "3g":
        return <Wifi className="h-4 w-4 text-yellow-500" />;
      case "4g":
      case "wifi":
        return <Wifi className="h-4 w-4 text-green-500" />;
      default:
        return <Wifi className="h-4 w-4 text-blue-500" />;
    }
  };

  const getConnectionText = () => {
    if (!isOnline) return "Offline";
    return connectionType === "unknown"
      ? "Online"
      : connectionType?.toUpperCase();
  };

  const testNotification = () => {
    addNotification({
      type: "system",
      title: "Thông báo test",
      message: "Đây là một thông báo test để kiểm tra hệ thống",
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Network Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-default ${
                isOnline
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              }`}
            >
              {getConnectionIcon()}
              {getConnectionText()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Trạng thái kết nối: {isOnline ? "Đã kết nối" : "Mất kết nối"}</p>
            {connectionType && connectionType !== "unknown" && (
              <p>Loại kết nối: {connectionType}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* PWA Status */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <div
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium cursor-default ${
                isInstalled
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
              }`}
            >
              {isInstalled ? (
                <Smartphone className="h-4 w-4" />
              ) : (
                <Monitor className="h-4 w-4" />
              )}
              {isInstalled ? "PWA" : "Web"}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isInstalled
                ? "Ứng dụng đã được cài đặt"
                : "Đang chạy trên trình duyệt"}
            </p>
            {!isInstalled && <p>Cài đặt ứng dụng để có trải nghiệm tốt hơn</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Test Notification Button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              onClick={testNotification}
              className="h-8 w-8 p-0"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Test thông báo</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {!isInstalled && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={addToHomeScreen}
                className="h-8 px-2 text-xs"
              >
                Cài đặt
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cài đặt ứng dụng PWA</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
