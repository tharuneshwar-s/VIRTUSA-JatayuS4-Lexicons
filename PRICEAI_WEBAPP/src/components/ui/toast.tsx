'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface ToastProps {
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description?: string;
  action?: React.ReactNode;
  onClose?: () => void;
  duration?: number;
  className?: string;
}

const variantConfig = {
  default: {
    icon: null,
    className: "bg-white border-priceai-lightgray"
  },
  success: {
    icon: CheckCircle,
    className: "bg-green-50 border-green-200 text-green-800"
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-50 border-red-200 text-red-800"
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-50 border-yellow-200 text-yellow-800"
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800"
  }
};

export const ToastCard = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ 
    variant = 'default', 
    title, 
    description, 
    action, 
    onClose, 
    duration = 5000,
    className,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const config = variantConfig[variant];
    const Icon = config.icon;

    React.useEffect(() => {
      if (duration && duration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onClose?.(), 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [duration, onClose]);

    const handleClose = () => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 300);
    };

    if (!isVisible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "relative pointer-events-auto w-full max-w-sm rounded-priceai border p-4 shadow-lg transition-all duration-300",
          "animate-in slide-in-from-top-full",
          !isVisible && "animate-out slide-out-to-top-full",
          config.className,
          className
        )}
        {...props}
      >
        <div className="flex items-start gap-3">
          {Icon && (
            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          
          <div className="flex-1 space-y-1">
            {title && (
              <div className="text-sm font-semibold">
                {title}
              </div>
            )}
            {description && (
              <div className="text-sm opacity-90">
                {description}
              </div>
            )}
            {action && (
              <div className="mt-2">
                {action}
              </div>
            )}
          </div>

          {onClose && (
            <button
              onClick={handleClose}
              className="absolute top-2 right-2 rounded-priceai p-1 hover:bg-black/5 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);

ToastCard.displayName = "ToastCard";

// Toast Provider Component
interface ToastContextType {
  toasts: (ToastProps & { id: string })[];
  toast: (toast: Omit<ToastProps, 'onClose'>) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const toast = React.useCallback((toastProps: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toastProps, id }]);
    
    // Auto-dismiss if duration is set
    if (toastProps.duration !== 0) {
      const duration = toastProps.duration || 5000;
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    } else {
      setToasts(prev => prev.slice(0, -1)); // Remove latest
    }
  }, []);

  const dismissAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, dismissAll }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(toastItem => (
          <ToastCard
            key={toastItem.id}
            {...toastItem}
            onClose={() => dismiss(toastItem.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience functions for common toast types
export const toast = {
  success: (message: string, options?: Partial<ToastProps>) => {
    const context = React.useContext(ToastContext);
    if (context) {
      context.toast({
        variant: 'success',
        title: 'Success',
        description: message,
        ...options
      });
    }
  },
  error: (message: string, options?: Partial<ToastProps>) => {
    const context = React.useContext(ToastContext);
    if (context) {
      context.toast({
        variant: 'error',
        title: 'Error',
        description: message,
        ...options
      });
    }
  },
  warning: (message: string, options?: Partial<ToastProps>) => {
    const context = React.useContext(ToastContext);
    if (context) {
      context.toast({
        variant: 'warning',
        title: 'Warning',
        description: message,
        ...options
      });
    }
  },
  info: (message: string, options?: Partial<ToastProps>) => {
    const context = React.useContext(ToastContext);
    if (context) {
      context.toast({
        variant: 'info',
        title: 'Info',
        description: message,
        ...options
      });
    }
  }
};

