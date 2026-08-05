import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

function useLockBody(open) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

// Bottom sheet — draggable to dismiss on touch.
export function Sheet({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  useLockBody(open);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`glass relative z-10 w-full ${maxWidth} rounded-t-4xl border-b-0 shadow-lift sm:rounded-4xl sm:border-b`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120) onClose();
            }}
          >
            <div className="flex flex-col max-h-[85vh]">
              <div className="shrink-0 px-5 pt-3">
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-faint/40 sm:hidden" />
                {title && (
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-ink">{title}</h2>
                    <button onClick={onClose} className="press grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-muted">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto px-5 pb-4">{children}</div>
              {footer && <div className="shrink-0 border-t border-hairline px-5 py-4 pb-safe">{footer}</div>}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Centered modal dialog.
export function Modal({ open, onClose, children, className = '' }) {
  useLockBody(open);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className={`relative z-10 w-full max-w-md ${className}`}
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
