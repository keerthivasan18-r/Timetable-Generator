import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * ValidationReportModal Component
 * VisionOS Glass Modal displaying timetable pre-generation validation errors with spring physics.
 */
export default function ValidationReportModal({ isOpen, errors = [], onClose, onGoToAssignments }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
          <motion.div
            className="modal-box glass-panel chrono-glass-modal"
            onClick={e => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            style={{
              maxWidth: '850px',
              width: '92%',
              padding: '0',
              overflow: 'hidden',
              borderRadius: '24px',
              border: '1px solid var(--glass-border)',
              boxShadow: 'var(--shadow-modal)'
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(185, 28, 28, 0.05))',
                borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--danger-text, #ef4444)'
                  }}
                >
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-heading)' }}>
                    Timetable Validation Report
                  </h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--danger-text)', fontWeight: 500 }}>
                    Pre-Generation Data Integrity Check Failed
                  </span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="btn btn-ghost btn-icon"
                aria-label="Close dialog"
                style={{ color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Banner */}
            <div style={{ padding: '20px 24px 12px 24px' }}>
              <div
                className="banner error"
                style={{
                  margin: 0,
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: 'var(--danger-dim)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger-text)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px'
                }}
              >
                <AlertOctagon size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.95rem', display: 'block', marginBottom: '2px' }}>
                    Cannot Generate Timetable
                  </strong>
                  <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    The following {errors.length} validation rule{errors.length > 1 ? 's' : ''} must be resolved before the AI algorithm can create a schedule.
                  </span>
                </div>
              </div>
            </div>

            {/* Validation Errors Table */}
            <div style={{ padding: '0 24px', maxHeight: '380px', overflowY: 'auto' }} className="table-container responsive-table-card">
              <table className="table custom-table" style={{ marginTop: '8px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>#</th>
                    <th style={{ width: '130px' }}>Rule</th>
                    <th style={{ width: '100px' }}>Scope</th>
                    <th>Conflict Description</th>
                    <th>Resolution</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((err, idx) => (
                    <tr key={idx}>
                      <td data-label="#" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td data-label="Rule">
                        <span className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                          Rule {err.ruleNumber}
                        </span>
                      </td>
                      <td data-label="Scope">
                        <strong style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {err.scope}
                        </strong>
                      </td>
                      <td data-label="Conflict Description" style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {err.description}
                      </td>
                      <td data-label="Resolution" style={{ fontSize: '0.825rem', color: 'var(--accent)', fontWeight: 500 }}>
                        {err.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--glass-border)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Rule Engine Enforcement Active
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                  Dismiss
                </button>
                {onGoToAssignments && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      onClose();
                      onGoToAssignments();
                    }}
                  >
                    Fix Course Assignments <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
