// Toast Notification Component
import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = toast.duration || 3000;
    
    // Clear any existing timers
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    
    // Set exit animation timer
    exitTimerRef.current = setTimeout(() => {
      setIsExiting(true);
    }, duration - 300);
    
    // Set remove timer
    removeTimerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, duration);
    
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current);
    };
  }, [toast.id, toast.duration, onRemove]);

  const icons = {
    success: <CheckCircle size={18} className="text-green-400" />,
    error: <XCircle size={18} className="text-red-400" />,
    warning: <AlertTriangle size={18} className="text-yellow-400" />,
    info: <Info size={18} className="text-cyan-400" />,
  };

  const bgColors = {
    success: 'bg-green-900/80 border-green-500/50',
    error: 'bg-red-900/80 border-red-500/50',
    warning: 'bg-yellow-900/80 border-yellow-500/50',
    info: 'bg-cyan-900/80 border-cyan-500/50',
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm transition-all duration-300 ${bgColors[toast.type]} ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
    >
      {icons[toast.type]}
      <span className="text-sm text-white font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

// Hook for managing toasts
const MAX_TOASTS = 5;
const TOAST_COOLDOWN_MS = 500; // Prevent duplicate messages within this time

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const lastToastRef = React.useRef<{ message: string; time: number } | null>(null);

  const addToast = React.useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
    // Prevent duplicate messages within cooldown period
    const now = Date.now();
    if (lastToastRef.current && 
        lastToastRef.current.message === message && 
        now - lastToastRef.current.time < TOAST_COOLDOWN_MS) {
      return; // Skip duplicate toast
    }
    
    lastToastRef.current = { message, time: now };
    
    const id = now + Math.random();
    setToasts((prev) => {
      // Keep only the last MAX_TOASTS - 1 to make room for the new one
      const limited = prev.length >= MAX_TOASTS ? prev.slice(-MAX_TOASTS + 1) : prev;
      return [...limited, { id, message, type, duration }];
    });
  }, []);

  const removeToast = React.useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

export default Toast;
