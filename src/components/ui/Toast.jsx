import React, { createContext, useCallback, useContext, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: Check,
  info: Info,
  error: AlertTriangle,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      const t = { id, message, type: opts.type || 'success', action: opts.action };
      setToasts((prev) => [...prev, t]);
      setTimeout(() => remove(id), opts.duration || 2800);
      return id;
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pb-dock pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 sm:pb-8">
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = ICONS[t.type] || Info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                className="glass pointer-events-auto flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift"
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-full ${
                    t.type === 'error' ? 'bg-danger/15 text-danger' : 'bg-accent/15 text-accent'
                  }`}
                >
                  <Icon size={14} strokeWidth={2.5} />
                </span>
                <span className="text-sm font-medium text-ink">{t.message}</span>
                {t.action && (
                  <button
                    onClick={() => {
                      t.action.onClick?.();
                      remove(t.id);
                    }}
                    className="ml-1 text-sm font-semibold text-accent"
                  >
                    {t.action.label}
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="ml-1 text-faint hover:text-ink">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { toast: () => {} };
  return ctx;
}
