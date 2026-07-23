import React, { useState, useEffect, useCallback } from 'react';
import { db } from './services/db';
import HODDashboard from './components/HODDashboard';
import StaffDashboard from './components/StaffDashboard';
import './App.css';
import {
  Calendar, LogOut, Users, BookOpen, Mail, Bell,
  Shield, Sun, Moon, FlaskConical, UserCheck, BarChart3,
  GraduationCap, Lock, Eye, EyeOff, ArrowRight, Clock,
  ChevronRight, Cpu, RefreshCw, Menu
} from 'lucide-react';
import { SidebarProvider, useSidebar } from './components/SidebarContext';
import { ResponsiveSidebar, FloatingMenuButton } from './components/ResponsiveSidebar';

// ─── Theme Persistence ────────────────────────────────────────────────────────
function getStoredTheme() {
  return localStorage.getItem('chronoai_theme') || 'dark';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('chronoai_theme', theme);
}

// ─── Nav color map ────────────────────────────────────────────────────────────
const NAV_COLORS = {
  dashboard:      'blue',
  'staff-list':   'purple',
  'subjects-list':'emerald',
  'lab-scheduler':'indigo',
  'active-users': 'green',
  'email-logs':   'cyan',
  notifications:  'orange',
};

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:      'Dashboard',
  'staff-list':   'Staff Records',
  'subjects-list':'Courses & Assign',
  'lab-scheduler':'Manual Scheduler',
  'active-users': 'Active Users',
  'email-logs':   'Email Logs',
  notifications:  'Notifications',
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SidebarProvider>
      <AppContent />
    </SidebarProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState(() => db.getCurrentUser());
  const [theme, setTheme] = useState(getStoredTheme);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);

  // Login states
  const [loginRole, setLoginRole] = useState('hod');
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const { isDesktop, isTablet, isMobile, tabletExpanded, toggleSidebar, sidebarOpen } = useSidebar();

  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    const list = await db.getNotifications();
    if (user.role === 'hod') setNotifications(list);
    else setNotifications(list.filter(n => n.recipient_id === 'all' || n.recipient_id === user.id));
    setLastSynced(new Date());
  }, [user]);

  useEffect(() => { if (user) loadNotifications(); }, [user, loadNotifications]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId || !loginPwd) { setLoginError('Please enter your credentials.'); return; }
    setLoginLoading(true);
    const res = await db.login(loginRole, loginId, loginPwd);
    setLoginLoading(false);
    if (res.success) {
      setUser(res.user);
      setActiveTab('dashboard');
      setLoginId('');
      setLoginPwd('');
    } else {
      setLoginError(res.error);
    }
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
    setNotifications([]);
  };

  const fillDemo = (role, id, pwd) => {
    setLoginRole(role); setLoginId(id); setLoginPwd(pwd);
    setLoginError(''); setShowDemoAccounts(false);
  };

  const navigate = (tab) => setActiveTab(tab);

  const hodNavItems = [
    { id: 'dashboard',       label: 'Dashboard',        icon: <BarChart3 size={17} /> },
    { id: 'staff-list',      label: 'Staff Records',    icon: <Users size={17} /> },
    { id: 'subjects-list',   label: 'Courses & Assign', icon: <BookOpen size={17} /> },
    { id: 'lab-scheduler',   label: 'Manual Scheduler', icon: <FlaskConical size={17} /> },
    { id: 'active-users',    label: 'Active Users',     icon: <UserCheck size={17} />, badge: null },
    { id: 'email-logs',      label: 'Email Logs',       icon: <Mail size={17} /> },
    { id: 'notifications',   label: 'Notifications',    icon: <Bell size={17} />, badge: unreadCount > 0 ? unreadCount : null },
  ];

  const staffNavItems = [
    { id: 'dashboard',     label: 'My Timetable',  icon: <Calendar size={17} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={17} />, badge: unreadCount > 0 ? unreadCount : null },
  ];

  const navItems = user?.role === 'hod' ? hodNavItems : staffNavItems;

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const formatLastSynced = (d) => {
    if (!d) return null;
    const diff = Math.round((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN PAGE
  // ════════════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="auth-wrapper">
        {/* Left — Hero Branding Panel */}
        <div className="auth-left">
          {/* Decorative orbs */}
          <div className="auth-orb auth-orb-1" />
          <div className="auth-orb auth-orb-2" />
          <div className="auth-orb auth-orb-3" />

          {/* Header */}
          <div className="auth-left-header fade-in">
            <div className="auth-left-logo-icon">
              <GraduationCap size={22} />
            </div>
            <div>
              <div className="auth-left-logo-title">ChronoAI</div>
              <div className="auth-left-logo-subtitle">Timetable Intelligence Platform</div>
            </div>
          </div>

          {/* Center Content */}
          <div className="auth-left-mid fade-in">
            <h1 className="auth-left-title">
              Welcome back.<br />
              Let's build smarter <span className="highlight">schedules</span>.
            </h1>
            <p className="auth-left-desc">
              AI-powered timetable management for modern colleges. Automate scheduling, eliminate conflicts, and empower every faculty member.
            </p>
            <div className="auth-left-divider" />
          </div>

          {/* Feature Grid */}
          <div className="auth-left-features fade-in">
            {[
              { icon: <Shield size={15} />, label: 'Secure Access', desc: 'Role-based auth with session tracking' },
              { icon: <Cpu size={15} />, label: 'AI Scheduler', desc: 'Conflict-free auto-generation' },
              { icon: <Users size={15} />, label: 'Staff Management', desc: 'Full faculty & course lifecycle' },
            ].map((f, i) => (
              <div key={i} className="auth-feature-item">
                <div className="auth-feature-icon">{f.icon}</div>
                <div className="auth-feature-label">{f.label}</div>
                <div className="auth-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>

          <div className="auth-left-footer">
            © 2025 ChronoAI · AI-Powered College Scheduling
          </div>
        </div>

        {/* Right — Login Form Panel */}
        <div className="auth-right">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="auth-theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="auth-form-box fade-in">
            <h2 className="auth-right-title">Sign in to ChronoAI</h2>
            <p className="auth-right-subtitle">Choose your role and enter your credentials</p>

            {/* Role Cards */}
            <div className="role-cards-container">
              {[
                { role: 'hod', icon: <Shield size={18} />, name: 'HOD Login', desc: 'Head of Department' },
                { role: 'staff', icon: <Users size={18} />, name: 'Staff Login', desc: 'Faculty Member' },
              ].map(r => (
                <div
                  key={r.role}
                  className={`role-login-card ${loginRole === r.role ? 'active' : ''}`}
                  onClick={() => { setLoginRole(r.role); setLoginId(''); setLoginPwd(''); setLoginError(''); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setLoginRole(r.role)}
                >
                  <div className="role-card-icon-wrapper">{r.icon}</div>
                  <div className="role-card-info">
                    <span className="role-card-name">{r.name}</span>
                    <span className="role-card-desc">{r.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Lock separator */}
            <div className="lock-separator-line">
              <div className="lock-separator-icon"><Lock size={13} /></div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="banner error" style={{ marginBottom: '16px' }}>
                <span>⚠ {loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label className="input-label">
                  {loginRole === 'hod' ? 'HOD Email Address' : 'Staff ID or Email'}
                </label>
                <div className="login-input-wrapper">
                  <div className="login-field-prefix-icon">
                    <Mail size={16} />
                  </div>
                  <input
                    id="login-id"
                    type="text"
                    className="input-field"
                    placeholder={loginRole === 'hod' ? 'hod@college.edu' : 'STF001 or email'}
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Password</label>
                <div className="login-input-wrapper">
                  <div className="login-field-prefix-icon">
                    <Lock size={16} />
                  </div>
                  <input
                    id="login-pwd"
                    type={showPwd ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter your password"
                    value={loginPwd}
                    onChange={e => setLoginPwd(e.target.value)}
                    autoComplete="current-password"
                    style={{ paddingRight: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center',
                      transition: 'color var(--t-fast)'
                    }}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="remember-forgot-row">
                <label className="checkbox-label">
                  <input type="checkbox" id="remember-me" />
                  <span>Remember me</span>
                </label>
                <a
                  href="#forgot"
                  className="forgot-link"
                  onClick={e => { e.preventDefault(); alert('Contact the administrative HOD office to reset passwords.'); }}
                >
                  Forgot password?
                </a>
              </div>

              <button
                id="login-submit"
                type="submit"
                className="login-btn-primary"
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in as {loginRole === 'hod' ? 'HOD' : 'Staff'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="or-divider"><span>or</span></div>

            <div className="contact-admin-text">
              No account?{' '}
              <a href="#contact" onClick={e => { e.preventDefault(); alert('Visit the administrative block or email admin@college.edu'); }}>
                Contact administrator
              </a>
            </div>

            {/* Demo accounts */}
            <div style={{ marginTop: '20px', borderTop: '1px dashed var(--glass-border)', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setShowDemoAccounts(v => !v)}
                className="demo-accounts-trigger"
              >
                🔑 {showDemoAccounts ? 'Hide' : 'Show'} demo accounts
              </button>

              {showDemoAccounts && (
                <div className="fade-in" style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { role: 'hod',   id: 'hod@college.edu', pwd: 'Admin123',      label: '🛡 HOD Admin',          sub: 'Full system access' },
                  ].map((acct, i) => (
                    <button key={i} onClick={() => fillDemo(acct.role, acct.id, acct.pwd)} className="demo-account-btn">
                      <span className="demo-account-btn-name">{acct.label}</span>
                      <span className="demo-account-btn-sub">{acct.sub} — click to fill</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP — Authenticated
  // ════════════════════════════════════════════════════════════════════════════
  const currentPageTitle = PAGE_TITLES[activeTab] || 'Dashboard';

  let layoutClass = 'layout-desktop';
  if (isMobile) {
    layoutClass = 'layout-mobile';
  } else if (isTablet) {
    layoutClass = 'layout-tablet';
    if (tabletExpanded) {
      layoutClass = 'layout-tablet layout-tablet-expanded';
    }
  }

  return (
    <div className={`app-container ${layoutClass}`}>
      <FloatingMenuButton />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <ResponsiveSidebar
        user={user}
        activeTab={activeTab}
        navigate={navigate}
        navItems={navItems}
        NAV_COLORS={NAV_COLORS}
        theme={theme}
        toggleTheme={toggleTheme}
        handleLogout={handleLogout}
        unreadCount={unreadCount}
        getInitials={getInitials}
      />

      {/* ── Right column: topbar + main ──────────────────────────────────── */}
      <div className="content-area">

        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <header className="topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {!isDesktop && (
              <button
                className="topbar-icon-btn topbar-menu-btn"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={sidebarOpen}
              >
                <Menu size={18} />
              </button>
            )}
            <div className="topbar-breadcrumb">
              <span className="topbar-brand-name">ChronoAI</span>
              <ChevronRight size={13} className="topbar-breadcrumb-sep" />
              <span className="topbar-breadcrumb-active">{currentPageTitle}</span>
            </div>
          </div>

          <div className="topbar-actions">
            {lastSynced && (
              <span className="topbar-synced">
                <RefreshCw size={11} />
                {formatLastSynced(lastSynced)}
              </span>
            )}

            <button
              className="topbar-icon-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              className="topbar-icon-btn"
              onClick={() => navigate('notifications')}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="topbar-notif-dot" aria-hidden="true" />}
            </button>

            <div
              className="user-avatar"
              style={{ width: 32, height: 32, fontSize: '0.6875rem', cursor: 'default', flexShrink: 0 }}
              title={user.name}
              aria-label={`Signed in as ${user.name}`}
            >
              {getInitials(user.name || 'User')}
            </div>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────────────────────── */}
        <main className="main-content fade-in" role="main">

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="fade-in">
              <div className="page-header">
                <div>
                  <h1>Notifications</h1>
                  <p>System alerts and department announcements</p>
                </div>
                {unreadCount > 0 && (
                  <span className="badge badge-orange">{unreadCount} unread</span>
                )}
              </div>

              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <Bell size={52} className="empty-state-icon" />
                    <h3>No notifications yet</h3>
                    <p>System alerts and timetable updates will appear here once the HOD publishes a schedule.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="notification-title">{n.title}</div>
                          <div className="notification-msg">{n.message}</div>
                          <div className="notification-time">
                            {new Date(n.created_at || n.date).toLocaleString()}
                          </div>
                        </div>
                        {!n.is_read && (
                          <span className="badge badge-orange" style={{ flexShrink: 0 }}>New</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* HOD Dashboard panels */}
          {user.role === 'hod' && activeTab !== 'notifications' && (
            <HODDashboard
              activePanel={activeTab}
              triggerNotificationReload={loadNotifications}
              onNavigateToCourses={() => setActiveTab('subjects-list')}
            />
          )}

          {/* Staff Dashboard */}
          {user.role === 'staff' && activeTab === 'dashboard' && (
            <StaffDashboard user={user} />
          )}

        </main>
      </div>
    </div>
  );
}
