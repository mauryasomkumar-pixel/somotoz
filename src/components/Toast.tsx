import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 font-mono">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`pointer-events-auto p-4 border flex items-start space-x-3 shadow-[4px_4px_0px_0px_#141414] bg-black ${
              toast.type === 'error'
                ? 'border-rose-700 text-rose-200'
                : toast.type === 'success'
                ? 'border-[#00FF41] text-[#EDEDED]'
                : 'border-[#262626] text-[#EDEDED]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#00FF41]" />
              ) : (
                <Info className="w-4 h-4 text-[#00FF41]" />
              )}
            </div>
            <div className="flex-1 min-w-0 font-sans">
              <h4 className="text-xs font-bold font-mono text-[#EDEDED]">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs mt-0.5 text-[#A1A1AA] leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-[#737373] hover:text-[#EDEDED] p-1 transition-colors cursor-pointer"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
