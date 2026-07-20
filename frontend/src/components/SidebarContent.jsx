import React from 'react';
import { Calendar, LogOut, Sun, Moon } from 'lucide-react';
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
  const { setSidebarOpen, isMobile } = useSidebar();

  const handleNavClick = (itemId) => {
    navigate(itemId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="sidebar-inner">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Calendar size={20} />
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">ChronoAI</span>
          <span className="sidebar-logo-sub">Timetable System</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {user.role === 'hod' && (
          <div className="sidebar-section-label">Core</div>
        )}

        {navItems.slice(0, user.role === 'hod' ? 4 : navItems.length).map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            data-color={NAV_COLORS[item.id] || 'blue'}
            onClick={() => handleNavClick(item.id)}
            aria-current={activeTab === item.id ? 'page' : undefined}
          >
            <span className="nav-item-icon">{item.icon}</span>
            <span className="nav-item-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}

        {user.role === 'hod' && (
          <>
            <div className="sidebar-section-label">System</div>
            {navItems.slice(4).map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                data-color={NAV_COLORS[item.id] || 'blue'}
                onClick={() => handleNavClick(item.id)}
                aria-current={activeTab === item.id ? 'page' : undefined}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-label">{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <button
          id="theme-toggle"
          onClick={toggleTheme}
          className="nav-item"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Toggle color theme"
        >
          <span className="nav-item-icon">
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </span>
          <span className="nav-item-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <div className="sidebar-divider" />

        {/* User chip */}
        <div className="user-profile-card">
          <div className="user-avatar">
            {getInitials(user.name || 'User')}
          </div>
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">
              {user.role === 'hod' ? 'HOD Administrator' : `Staff · ${user.id}`}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          id="sign-out"
          className="nav-item logout"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <span className="nav-item-icon"><LogOut size={17} /></span>
          <span className="nav-item-label">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
