import React from 'react';
import { AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';

/**
 * ValidationReportModal Component
 * Professional enterprise dialog displaying timetable pre-generation validation errors.
 */
export default function ValidationReportModal({ isOpen, errors = [], onClose, onGoToAssignments }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay fade-in" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-box glass-panel fade-in"
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '92%',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(239, 68, 68, 0.2)'
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
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444'
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary, #f3f4f6)' }}>
                Timetable Validation Report
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#f87171', fontWeight: 500 }}>
                Data Integrity Check Failed
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close dialog"
            style={{ color: 'var(--text-muted, #9ca3af)' }}
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
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <AlertOctagon size={20} style={{ flexShrink: 0, color: '#ef4444', marginTop: '2px' }} />
            <div>
              <strong style={{ fontSize: '0.95rem', display: 'block', color: '#f87171', marginBottom: '2px' }}>
                Cannot Generate Timetable
              </strong>
              <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                The following validation errors must be fixed before timetable generation can proceed.
              </span>
            </div>
          </div>
        </div>

        {/* Validation Errors Table */}
        <div style={{ padding: '0 24px', maxHeight: '380px', overflowY: 'auto' }}>
          <table
            className="table-custom"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem'
            }}
          >
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)', textAlign: 'left' }}>
                <th style={{ padding: '12px 14px', width: '10%', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Section</th>
                <th style={{ padding: '12px 14px', width: '25%', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Subject</th>
                <th style={{ padding: '12px 14px', width: '20%', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Faculty</th>
                <th style={{ padding: '12px 14px', width: '15%', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Weekly Hours</th>
                <th style={{ padding: '12px 14px', width: '30%', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((err, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'background 0.2s',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)'
                  }}
                >
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--blue-light, #60a5fa)' }}>
                    {err.section}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 500 }}>
                    {err.subject}
                  </td>
                  <td style={{ padding: '12px 14px', color: err.faculty === 'Not Assigned' ? '#f87171' : 'inherit' }}>
                    {err.faculty}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    {err.assigned !== undefined ? (
                      <span style={{ color: err.assigned > 30 ? '#ef4444' : '#fbbf24', fontWeight: 600 }}>
                        {err.assigned} / 30
                      </span>
                    ) : (
                      <span>{err.weeklyHours || '-'}</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5'
                      }}
                    >
                      {err.error}
                    </span>
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
            background: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444' }}>
            Total Validation Errors : {errors.length}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={onClose}
              style={{ minWidth: '100px' }}
            >
              Close
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                if (onGoToAssignments) onGoToAssignments();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
              }}
            >
              Go to Course Assignment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
