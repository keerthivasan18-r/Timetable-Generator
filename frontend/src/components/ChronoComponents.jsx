import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Zap, RefreshCw } from 'lucide-react';

// ─── 1. Mouse Spotlight Card ──────────────────────────────────────────────────
export function SpotlightCard({ children, className = '', style = {}, onClick, ...props }) {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: -200, y: -200 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`spotlight-glass-card ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Radial Highlight */}
      <div
        className="spotlight-light"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, var(--spotlight-color, rgba(220, 38, 38, 0.12)), transparent 80%)`,
        }}
      />
      {/* Subtle border reflection */}
      <div
        className="spotlight-border"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-border, rgba(254, 202, 202, 0.6)), transparent 80%)`,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}

// ─── 2. Live Counter Animation ────────────────────────────────────────────────
export function AnimatedNumber({ value = 0, duration = 1.2, formatter = (v) => Math.round(v) }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const target = Number(value) || 0;
    const start = displayValue;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      // Apple spring easing: 1 - (1 - progress)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(start + (target - start) * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [value, duration]);

  return <span>{formatter(displayValue)}</span>;
}

// ─── 3. Shimmer Skeleton Loader ───────────────────────────────────────────────
export function SkeletonLoader({ type = 'card', rows = 3, height = '48px', style = {} }) {
  if (type === 'table') {
    return (
      <div className="skeleton-table" style={style}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="skeleton-row shimmer-effect" style={{ height }} />
        ))}
      </div>
    );
  }

  if (type === 'widget') {
    return (
      <div className="skeleton-widget shimmer-effect" style={{ height, ...style }} />
    );
  }

  return (
    <div className="skeleton-card shimmer-effect" style={{ height, ...style }}>
      <div className="skeleton-title shimmer-effect" />
      <div className="skeleton-line shimmer-effect" />
    </div>
  );
}

// ─── 4. Glass Context Menu (Right-Click) ──────────────────────────────────────
export function ContextMenu({ isOpen, position, items = [], onClose }) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    if (isOpen) {
      window.addEventListener('click', handleClickOutside);
      window.addEventListener('contextmenu', handleClickOutside);
    }
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('contextmenu', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && position && (
        <motion.div
          className="glass-context-menu"
          initial={{ opacity: 0, scale: 0.9, y: -5 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -5 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, index) => (
            item.divider ? (
              <div key={index} className="context-menu-divider" />
            ) : (
              <button
                key={index}
                className={`context-menu-item ${item.danger ? 'danger' : ''}`}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
              >
                <span className="context-menu-icon">{item.icon}</span>
                <span className="context-menu-label">{item.label}</span>
              </button>
            )
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── 5. Floating Action Button (FAB) ──────────────────────────────────────────
export function FloatingActionButton({ onOpenCommand, onTriggerGenerate }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fab-wrapper">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fab-menu"
            initial={{ opacity: 0, y: 15, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <button
              className="fab-sub-btn"
              onClick={() => { onOpenCommand(); setIsOpen(false); }}
              title="Search / Command Palette (Ctrl+K)"
            >
              <Search size={16} />
              <span>Search</span>
            </button>
            {onTriggerGenerate && (
              <button
                className="fab-sub-btn accent"
                onClick={() => { onTriggerGenerate(); setIsOpen(false); }}
                title="Generate Schedule"
              >
                <Zap size={16} />
                <span>Auto Schedule</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className="fab-main-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        aria-label="Quick actions"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus size={22} />
        </motion.div>
      </motion.button>
    </div>
  );
}
