import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
  };

  const colors = {
    success: {
      bg: 'bg-zinc-900/95',
      border: 'border-[#00ff87]/40',
      icon: 'text-[#00ff87]',
      bar: 'bg-[#00ff87]',
    },
    error: {
      bg: 'bg-zinc-900/95',
      border: 'border-red-500/40',
      icon: 'text-red-400',
      bar: 'bg-red-500',
    },
    info: {
      bg: 'bg-zinc-900/95',
      border: 'border-blue-400/40',
      icon: 'text-blue-400',
      bar: 'bg-blue-400',
    },
    warning: {
      bg: 'bg-zinc-900/95',
      border: 'border-amber-400/40',
      icon: 'text-amber-400',
      bar: 'bg-amber-400',
    },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: '360px' }}>
        <AnimatePresence>
          {toasts.map(t => {
            const c = colors[t.type] || colors.info;
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 60, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`pointer-events-auto relative overflow-hidden rounded-2xl border backdrop-blur-2xl shadow-2xl ${c.bg} ${c.border}`}
                style={{ minWidth: '280px' }}
              >
                {/* Progress bar */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-[2px] ${c.bar}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />

                <div className="flex items-start gap-3 p-4 pr-10">
                  <span
                    className={`material-symbols-outlined text-[20px] mt-0.5 flex-shrink-0 ${c.icon}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icons[t.type]}
                  </span>
                  <p className="text-sm text-zinc-200 font-medium leading-snug">{t.message}</p>
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
