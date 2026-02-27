import React, { useEffect } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const FitToast: React.FC<ToastProps> = ({ id, type, message, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <Check size={20} className="text-success" />,
    error: <X size={20} className="text-destructive" />,
    warning: <AlertCircle size={20} className="text-warning" />,
    info: <Info size={20} className="text-primary" />,
  };

  const barColors = {
    success: 'bg-success',
    error: 'bg-destructive',
    warning: 'bg-warning',
    info: 'bg-primary',
  };

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 rounded-xl card-surface min-w-[260px] max-w-sm overflow-hidden"
      style={{ animation: 'toastSlideIn 0.3s ease-out' }}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColors[type]}`} />
      <div className="flex-shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium text-foreground flex-1">{message}</p>
      <button onClick={() => onClose(id)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
        <X size={16} />
      </button>
    </div>
  );
};

export default FitToast;
