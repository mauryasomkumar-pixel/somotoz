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
          className="relative bg-[#0d1322] rounded-2xl shadow-2xl border border-slate-800 max-w-md w-full p-6 z-10 overflow-hidden text-slate-200"
        >
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start space-x-4">
            <div className="w-11 h-11 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center shrink-0 text-rose-400 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 font-sans">
              <h3 className="text-base font-bold text-white font-mono">Purge reflection record?</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Confirm deletion of <span className="font-semibold text-slate-200 font-mono">"{entryTitle || 'Untitled Reflection'}"</span>. This will permanently wipe the record and its AI insights from your private Firestore partition.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3 font-mono text-xs">
            <button
              type="button"
              onClick={onCancel}
              disabled={isDeleting}
              className="px-4 py-2 font-semibold text-slate-400 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-colors flex items-center space-x-2 shadow-md shadow-rose-600/20 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Purging...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Entry</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
