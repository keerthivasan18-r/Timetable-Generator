import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, BarChart3, Users, BookOpen, FlaskConical,
  Layers, UserCheck, Mail, Bell, Sun, Moon, Zap, ArrowRight,
  Clock, Sparkles, X, ChevronRight, CornerDownLeft
} from 'lucide-react';

// ── Placeholder Cycling List ──────────────────────────────────────────────────
const PLACEHOLDERS = [
  "Search Faculty...",
  "Search Courses...",
  "Search Staff...",
  "Search Timetables...",
  "Search Notifications...",
  "Search Electives..."
];

export default function SpotlightSearchBar({
  isOpen,
  onClose,
  onNavigate,
  onToggleTheme,
  theme,
  staffList = [],
  subjectsList = [],
  onTriggerGenerate,
  embedded = false,
  onFocusTrigger
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const barRef = useRef(null);

  // 1. Cycle Animated Placeholder text every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 2. Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Mouse spotlight lighting effect on hover
  const handleMouseMove = (e) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // 3. Search Actions Dataset
  const recentSearches = [
    { id: 'dashboard', label: 'Dashboard Overview', group: 'Recent Searches', icon: <Clock size={16} /> },
    { id: 'staff-list', label: 'Faculty Records', group: 'Recent Searches', icon: <Users size={16} /> },
  ];

  const defaultActions = [
    { id: 'dashboard', label: 'Go to Dashboard Overview', group: 'Actions', icon: <BarChart3 size={16} /> },
    { id: 'staff-list', label: 'View Faculty Roster & Records', group: 'Actions', icon: <Users size={16} /> },
    { id: 'subjects-list', label: 'Courses & Subject Assignments', group: 'Actions', icon: <BookOpen size={16} /> },
    { id: 'lab-scheduler', label: 'Open Manual Lab Scheduler', group: 'Actions', icon: <FlaskConical size={16} /> },
    { id: 'electives', label: 'Elective Subjects Manager', group: 'Actions', icon: <Layers size={16} /> },
    { id: 'active-users', label: 'View Active System Sessions', group: 'Actions', icon: <UserCheck size={16} /> },
    { id: 'email-logs', label: 'Inspect Email Communications', group: 'Actions', icon: <Mail size={16} /> },
    { id: 'notifications', label: 'View System Notifications', group: 'Actions', icon: <Bell size={16} /> },
    {
      id: 'action-theme',
      label: `Switch to ${theme === 'dark' ? 'Light Atmosphere' : 'Dark Space'} Mode`,
      group: 'Actions',
      icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      perform: () => { onToggleTheme(); onClose(); }
    },
    {
      id: 'action-generate',
      label: 'Run AI Auto-Timetable Generator',
      group: 'Actions',
      icon: <Zap size={16} />,
      perform: () => {
        if (onTriggerGenerate) onTriggerGenerate();
        onClose();
      }
    }
  ];

  const staffActions = staffList.map(s => ({
    id: `staff-${s.id}`,
    label: `Faculty: ${s.name || s.id} (${s.email || 'Faculty'})`,
    group: 'Faculty',
    icon: <Users size={16} />,
    perform: () => { onNavigate('staff-list'); onClose(); }
  }));

  const subjectActions = subjectsList.map(s => ({
    id: `subj-${s.id}`,
    label: `Course: ${s.code || s.id} — ${s.name} (${s.type || 'theory'})`,
    group: 'Courses',
    icon: <BookOpen size={16} />,
    perform: () => { onNavigate('subjects-list'); onClose(); }
  }));

  const allItems = [...defaultActions, ...staffActions, ...subjectActions];

  const filteredItems = query.trim() === ''
    ? [...recentSearches, ...defaultActions.slice(0, 5)]
    : allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeEl = resultsContainerRef.current.querySelector('.spotlight-row.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation logic
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredItems[selectedIndex];
      if (selected) {
        if (selected.perform) {
          selected.perform();
        } else {
          onNavigate(selected.id);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      inputRef.current?.blur();
    }
  };

  // Group filtered items by Section
  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || 'Results';
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});

  // Global flat index helper for keyboard selection mapping
  let currentFlatIndex = 0;

  return (
    <AnimatePresence>
      {(isOpen || embedded) && (
        <div
          className={embedded ? "spotlight-embedded-wrapper" : "spotlight-backdrop-overlay"}
          onClick={embedded ? undefined : onClose}
        >
          <motion.div
            ref={barRef}
            className={`spotlight-command-bar ${isFocused ? 'focused' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onMouseMove={handleMouseMove}
            initial={embedded ? false : { opacity: 0, scale: 0.95, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Cursor Light Spotlight Effect */}
            <div
              className="spotlight-cursor-glow"
              style={{
                background: `radial-gradient(280px circle at ${mousePos.x}px ${mousePos.y}px, var(--accent-dim, rgba(0, 113, 227, 0.15)), transparent 80%)`,
              }}
            />

            {/* ── Search Input Bar ────────────────────────────────────────────── */}
            <div className="spotlight-input-container">
              {/* Animated Search Icon */}
              <motion.div
                className={`spotlight-search-icon-wrapper ${isFocused ? 'active-glow' : ''}`}
                animate={{
                  rotate: isFocused ? 12 : 0,
                  scale: isHovered => isHovered ? 1.1 : 1
                }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              >
                <Search size={18} className="spotlight-icon-svg" />
              </motion.div>

              {/* Input & Cycling Placeholder */}
              <div className="spotlight-input-field-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="spotlight-real-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    if (onFocusTrigger && !isOpen) onFocusTrigger();
                  }}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  aria-label="Search faculty, courses, timetable actions"
                />

                {/* Animated Cycling Placeholder */}
                {query === '' && (
                  <div className="spotlight-placeholder-wrapper" pointerEvents="none">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={placeholderIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 0.55, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="spotlight-placeholder-text"
                      >
                        {PLACEHOLDERS[placeholderIndex]}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* macOS Key Shortcut Badge: [ Ctrl ] [ K ] */}
              <motion.div
                className="spotlight-key-badge-container"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isOpen && onFocusTrigger) onFocusTrigger();
                }}
              >
                <div className="mac-key-cap">
                  <span>⌘</span>
                </div>
                <div className="mac-key-cap">
                  <span>K</span>
                </div>
              </motion.div>
            </div>

            {/* ── Dropdown Panel (Spotlight Results) ──────────────────────────── */}
            {isOpen && (
              <motion.div
                className="spotlight-dropdown-panel"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="spotlight-results-scroll" ref={resultsContainerRef}>
                  {isLoading ? (
                    <div className="spotlight-skeleton-group">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="spotlight-skeleton-row shimmer-effect" />
                      ))}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    /* Premium Empty Search State */
                    <div className="spotlight-empty-state">
                      <div className="spotlight-empty-icon">
                        <Sparkles size={28} />
                      </div>
                      <div className="spotlight-empty-title">No matching records found</div>
                      <div className="spotlight-empty-sub">
                        Try searching by faculty name (e.g., Sangeetha), course code (e.g., CS101), or quick actions.
                      </div>

                      {/* Quick Suggestions */}
                      <div className="spotlight-quick-suggestions">
                        <div className="quick-suggest-label">Quick Suggestions:</div>
                        <div className="quick-suggest-pills">
                          <button onClick={() => setQuery('Faculty')} className="quick-pill">Faculty Records</button>
                          <button onClick={() => setQuery('Course')} className="quick-pill">Courses</button>
                          <button onClick={() => setQuery('Generate')} className="quick-pill">Generate Timetable</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Categorized Spotlight Rows */
                    Object.entries(groupedItems).map(([groupName, items]) => (
                      <div key={groupName} className="spotlight-group-section">
                        <div className="spotlight-group-title">{groupName}</div>
                        <div className="spotlight-group-rows">
                          {items.map((item) => {
                            const indexForSelection = currentFlatIndex++;
                            const isSelected = indexForSelection === selectedIndex;

                            return (
                              <motion.div
                                key={item.id}
                                className={`spotlight-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  if (item.perform) item.perform();
                                  else {
                                    onNavigate(item.id);
                                    onClose();
                                  }
                                }}
                                onMouseEnter={() => setSelectedIndex(indexForSelection)}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                {isSelected && (
                                  <motion.div
                                    className="spotlight-row-active-pill"
                                    layoutId="spotlight-active-row"
                                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                  />
                                )}
                                <div className="spotlight-row-left">
                                  <span className="spotlight-row-icon">{item.icon}</span>
                                  <span className="spotlight-row-label">{item.label}</span>
                                </div>
                                <div className="spotlight-row-right">
                                  <span className="spotlight-row-badge">{item.group}</span>
                                  {isSelected && (
                                    <span className="spotlight-row-enter-hint">
                                      <span>Select</span>
                                      <CornerDownLeft size={12} />
                                    </span>
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Spotlight Footer */}
                <div className="spotlight-panel-footer">
                  <div className="mac-kbd-hints">
                    <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
                    <span><kbd>↵</kbd> Select</span>
                    <span><kbd>esc</kbd> Exit</span>
                  </div>
                  <div className="spotlight-footer-brand">
                    <span>Chrono Glass Spotlight</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
