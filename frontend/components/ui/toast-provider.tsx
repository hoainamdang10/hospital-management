"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { Toast, ToastClose, ToastTitle, ToastDescription } from "./toast"
import { AlertCircle, CheckCircle } from "lucide-react"

type ToastType = "success" | "error" | "default"

interface ToastData {
  id: string
  title: string
  description?: string
  type: ToastType
}

interface ToastContextType {
  toasts: ToastData[]
  showToast: (title: string, description?: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((title: string, description?: string, type: ToastType = "default") => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, type }])

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissToast(id)
    }, 5000)
  }, [dismissToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-md pointer-events-none">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.type === "error" ? "destructive" : toast.type === "success" ? "success" : "default"}
              className="pointer-events-auto"
            >
              <div className="flex items-start gap-3 w-full">
                {toast.type === "success" && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                {toast.type === "error" && <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
                <div className="grid gap-1 flex-1">
                  <ToastTitle>{toast.title}</ToastTitle>
                  {toast.description && <ToastDescription>{toast.description}</ToastDescription>}
                </div>
              </div>
              <ToastClose onClick={() => dismissToast(toast.id)} />
            </Toast>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
