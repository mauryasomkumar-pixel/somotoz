import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  entryTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  entryTitle,
  isDeleting,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-mono">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-[#0A0A0A] border border-[#262626] shadow-[6px_6px_0px_0px_#141414] max-w-md w-full p-6 z-10 overflow-hidden text-[#EDEDED]"
        >
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="absolute top-4 right-4 text-[#737373] hover:text-[#EDEDED] p-1.5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-black border border-rose-600/80 flex items-center justify-center shrink-0 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[#EDEDED] font-mono">Delete this note?</h3>
              <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed font-sans">
                Are you sure you want to delete <span className="font-semibold text-[#EDEDED] font-mono">"{entryTitle || 'Untitled Note'}"</span>? This cannot be undone.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3 font-mono text-xs">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 font-semibold text-[#737373] hover:text-[#EDEDED] bg-black border border-[#262626] hover:border-[#404040] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-600 transition-colors flex items-center space-x-2 shadow-[2px_2px_0px_0px_#171717] cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Note</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
