"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              layout
              className={cn(
                "pointer-events-auto min-w-[300px] max-w-md p-4 rounded-2xl shadow-lg border border-white/40 backdrop-blur-md flex items-start gap-3 relative overflow-hidden",
                toast.type === "error" && "bg-red-50/90 text-red-800",
                toast.type === "success" && "bg-green-50/90 text-green-800",
                toast.type === "info" && "bg-blue-50/90 text-blue-800"
              )}
              style={{
                boxShadow: "8px 8px 16px rgba(163, 177, 198, 0.2), -2px -2px 4px rgba(255, 255, 255, 0.5)"
              }}
            >
              <div className={cn(
                "p-2 rounded-xl shrink-0",
                toast.type === "error" && "bg-red-100 text-red-600",
                toast.type === "success" && "bg-green-100 text-green-600",
                toast.type === "info" && "bg-blue-100 text-blue-600"
              )}>
                {toast.type === "error" && <AlertCircle size={20} />}
                {toast.type === "success" && <CheckCircle size={20} />}
                {toast.type === "info" && <Info size={20} />}
              </div>
              
              <div className="flex-1 pt-1 font-medium text-sm">
                {toast.message}
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors opacity-60 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
