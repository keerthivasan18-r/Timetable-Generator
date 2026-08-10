import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, LogOut, Sun, Moon, Sparkles } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export function SidebarContent({
  user,
  activeTab,
  navigate,
  navItems,
  NAV_COLORS,
  theme,
  toggleTheme,
  handleLogout,
  getInitials
}) {
  const { setSidebarOpen, isDesktop } = useSidebar();

  const handleNavClick = (itemId) => {
    navigate(itemId);
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  };

  const coreNavItems = user?.role === 'hod' ? navItems.slice(0, 5) : navItems;
  const systemNavItems = user?.role === 'hod' ? navItems.slice(5) : [];

  return (
    <div className="sidebar-inner chrono-glass-sidebar">

      {/* ── Logo & Brand ─────────────────────────────────────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon-wrapper" aria-hidden="true">
          <Calendar size={18} className="sidebar-logo-icon" />
          <div className="sidebar-logo-pulse" />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-title-row">
            <span className="sidebar-logo-name">ChronoAI</span>
            <span className="sidebar-logo-tag">OS</span>
          </div>
          <span className="sidebar-logo-sub">Timetable Intelligence</span>
        </div>
      </div>

      {/* ── Navigation Items ─────────────────────────────────────────────── */}
      <nav className="sidebar-nav" role="navigation" aria-label="Main navigation">
        {user?.role === 'hod' && (
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">Core Modules</span>
          </div>
        )}

        <div className="sidebar-nav-group">
          {coreNavItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                aria-current={isActive ? 'page' : undefined}
                style={{ position: 'relative' }}
              >
                {isActive && (
                  <motion.div
                    className="nav-active-pill"
                    layoutId="sidebar-active-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="nav-item-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-item-label">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className="nav-badge-pill" aria-label={`${item.badge} unread`}>
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {user?.role === 'hod' && systemNavItems.length > 0 && (
          <>
            <div className="sidebar-section-header" style={{ marginTop: '16px' }}>
              <span className="sidebar-section-label">System & Logs</span>
            </div>
            <div className="sidebar-nav-group">
              {systemNavItems.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    aria-current={isActive ? 'page' : undefined}
                    style={{ position: 'relative' }}
                  >
                    {isActive && (
                      <motion.div
                        className="nav-active-pill"
                        layoutId="sidebar-active-pill"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="nav-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="nav-item-label">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="nav-badge-pill" aria-label={`${item.badge} unread`}>
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </>
        )}
      </nav>

      {/* ── Footer & User Profile ────────────────────────────────────────── */}
      <div className="sidebar-footer">
        {/* Theme Switcher Button */}
        <motion.button
          id="theme-toggle"
          onClick={toggleTheme}
          className="sidebar-theme-btn"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="theme-btn-icon">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </span>
          <span className="theme-btn-text">
            {theme === 'dark' ? 'Light Atmosphere' : 'Dark Space'}
          </span>
        </motion.button>

        <div className="sidebar-divider" role="separator" />

        {/* User Card */}
        <div className="sidebar-user-card">
          <div className="sidebar-user-avatar" aria-label={`User: ${user?.name}`} title={user?.name}>
            {getInitials(user?.name || 'User')}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">
              {user?.role === 'hod' ? 'HOD Administrator' : `Staff · ${user?.id}`}
            </div>
          </div>

          <motion.button
            id="sign-out"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            whileHover={{ scale: 1.1, color: 'var(--danger)' }}
            whileTap={{ scale: 0.9 }}
            aria-label="Sign out"
            title="Sign out of ChronoAI"
          >
            <LogOut size={16} />
          </motion.button>
        </div>
      </div>

    </div>
  );
}
