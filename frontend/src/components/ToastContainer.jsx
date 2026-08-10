import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer({ toasts = [], onDismiss }) {
  return (
    <div className="toast-stack-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { id, type = 'info', title, message, duration = 4500 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} className="toast-icon success" />,
    warning: <AlertTriangle size={18} className="toast-icon warning" />,
    error: <AlertCircle size={18} className="toast-icon error" />,
    info: <Info size={18} className="toast-icon info" />
  };

  return (
    <motion.div
      className={`glass-toast-card toast-${type}`}
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      layout
    >
      <div className="toast-content">
        {icons[type] || icons.info}
        <div className="toast-text-group">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{message}</div>
        </div>
        <button className="toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss toast">
          <X size={14} />
        </button>
      </div>

      {duration > 0 && (
        <motion.div
          className={`toast-progress-bar bar-${type}`}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}
