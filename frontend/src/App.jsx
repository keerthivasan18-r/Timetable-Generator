import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from './services/db';
import HODDashboard from './components/HODDashboard';
import StaffDashboard from './components/StaffDashboard';
import ChronoCanvasBackground from './components/ChronoCanvasBackground';
import CommandPalette from './components/CommandPalette';
import SpotlightSearchBar from './components/SpotlightSearchBar';
import ChronoOSLogin from './components/ChronoOSLogin';
import { ToastContainer } from './components/ToastContainer';
import { FloatingActionButton } from './components/ChronoComponents';
import './App.css';
import {
  Calendar, LogOut, Users, BookOpen, Mail, Bell,
  Shield, Sun, Moon, FlaskConical, UserCheck, BarChart3,
  GraduationCap, Lock, Eye, EyeOff, ArrowRight, Clock,
  ChevronRight, Cpu, RefreshCw, Menu, Layers, Search, Command, Zap
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
  dashboard:      'red',
  'staff-list':   'red',
  'subjects-list':'red',
  'lab-scheduler':'red',
  electives:      'red',
  'active-users': 'red',
  'email-logs':   'red',
  notifications:  'red',
};

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:      'Dashboard Overview',
  'staff-list':   'Faculty Records',
  'subjects-list':'Courses & Assignments',
  'lab-scheduler':'Manual Lab Scheduler',
  electives:      'Elective Subject Modules',
  'active-users': 'Active System Sessions',
  'email-logs':   'Email Communications Log',
  notifications:  'System Notifications',
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
  const [toasts, setToasts] = useState([]);

  // Command Palette & Search State
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Login states
  const [loginRole, setLoginRole] = useState('hod');
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const { isDesktop, isTablet, isMobile, tabletExpanded, toggleSidebar, sidebarOpen } = useSidebar();

  // Data lists for command palette search
  const [staffList, setStaffList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // Toast Helper
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toast }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const list = await db.getNotifications();
      if (user.role === 'hod') setNotifications(list);
      else setNotifications(list.filter(n => n.recipient_id === 'all' || n.recipient_id === user.id));
      setLastSynced(new Date());

      // Preload search data for command palette
      if (user.role === 'hod') {
        const [st, sj] = await Promise.all([db.getStaff(), db.getSubjects()]);
        setStaffList(st || []);
        setSubjectsList(sj || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }, [user]);

  useEffect(() => { if (user) loadNotifications(); }, [user, loadNotifications]);

  // Global Keyboard Shortcuts (Ctrl+K, Ctrl+B, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!loginId || !loginPwd) {
      setLoginError('Please enter your login credentials.');
      addToast({ type: 'warning', title: 'Login Failed', message: 'Credentials cannot be empty.' });
      return;
    }
    setLoginLoading(true);
    const res = await db.login(loginRole, loginId, loginPwd);
    setLoginLoading(false);
    if (res.success) {
      setUser(res.user);
      setActiveTab('dashboard');
      setLoginId('');
      setLoginPwd('');
      addToast({ type: 'success', title: 'Welcome Back', message: `Signed in successfully as ${res.user.name}` });
    } else {
      setLoginError(res.error);
      addToast({ type: 'error', title: 'Authentication Error', message: res.error });
    }
  };

  const handleLogout = async () => {
    await db.logout();
    setUser(null);
    setNotifications([]);
    addToast({ type: 'info', title: 'Signed Out', message: 'You have been safely signed out.' });
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
    { id: 'electives',       label: 'Elective Subjects',icon: <Layers size={17} /> },
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
  // LOGIN PAGE — Chrono Glass OS Redesign
  // ════════════════════════════════════════════════════════════════════════════
  // ════════════════════════════════════════════════════════════════════════════
  // LOGIN PAGE — Chrono OS VisionOS Centered Redesign
  // ════════════════════════════════════════════════════════════════════════════
  if (!user) {
    return (
      <div className="auth-wrapper chrono-auth-screen">
        <ChronoCanvasBackground theme={theme} />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
        <CommandPalette
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          onNavigate={navigate}
          onToggleTheme={toggleTheme}
          theme={theme}
          staffList={staffList}
          subjectsList={subjectsList}
        />

        <ChronoOSLogin
          theme={theme}
          toggleTheme={toggleTheme}
          onLogin={async (role, id, pwd) => {
            setLoginError('');
            setLoginLoading(true);
            const res = await db.login(role, id, pwd);
            setLoginLoading(false);
            if (res.success) {
              setUser(res.user);
              setActiveTab('dashboard');
              addToast({ type: 'success', title: 'Welcome Back', message: `Signed in as ${res.user.name}` });
              return true;
            } else {
              setLoginError(res.error);
              addToast({ type: 'error', title: 'Authentication Error', message: res.error });
              return false;
            }
          }}
          loginLoading={loginLoading}
          loginError={loginError}
          fillDemo={fillDemo}
          onOpenCommandPalette={() => setIsCommandOpen(true)}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN APP — Authenticated Chrono Glass OS
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
    <div className={`app-container chrono-glass-app ${layoutClass}`}>
      <ChronoCanvasBackground theme={theme} />
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={navigate}
        onToggleTheme={toggleTheme}
        theme={theme}
        staffList={staffList}
        subjectsList={subjectsList}
      />

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

      {/* ── Right column: topbar + main content ─────────────────────────── */}
      <div className="content-area">

        {/* ── Topbar ─────────────────────────────────────────────────────── */}
        <header className="topbar chrono-glass-topbar" role="banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

            {/* Animated Breadcrumb */}
            <div className="topbar-breadcrumb">
              <span className="topbar-brand-name">ChronoAI</span>
              <ChevronRight size={13} className="topbar-breadcrumb-sep" />
              <motion.span
                key={activeTab}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="topbar-breadcrumb-active"
              >
                {currentPageTitle}
              </motion.span>
            </div>
          </div>

          {/* Embedded Spotlight Search Bar Trigger */}
          <div className="topbar-spotlight-wrapper">
            <SpotlightSearchBar
              isOpen={false}
              embedded={true}
              onFocusTrigger={() => setIsCommandOpen(true)}
              theme={theme}
            />
          </div>

          <div className="topbar-actions">
            {lastSynced && (
              <span className="topbar-synced">
                <RefreshCw size={11} className="synced-icon" />
                {formatLastSynced(lastSynced)}
              </span>
            )}

            {/* Theme Morph Switch */}
            <motion.button
              className="topbar-icon-btn chrono-glass-btn"
              onClick={toggleTheme}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode (Ctrl+D)`}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={theme}
                  initial={{ opacity: 0, rotate: -30, scale: 0.8 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 30, scale: 0.8 }}
                  transition={{ duration: 0.18 }}
                >
                  {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                </motion.div>
              </AnimatePresence>
            </motion.button>

            {/* Notification Bell */}
            <motion.button
              className="topbar-icon-btn chrono-glass-btn"
              onClick={() => navigate('notifications')}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
            >
              <Bell size={16} />
              {unreadCount > 0 && <span className="topbar-notif-dot" aria-hidden="true" />}
            </motion.button>

            {/* User Profile Avatar */}
            <div
              className="user-avatar chrono-user-avatar"
              style={{ width: 34, height: 34, fontSize: '0.75rem', flexShrink: 0 }}
              title={user.name}
              aria-label={`Signed in as ${user.name}`}
            >
              {getInitials(user.name || 'User')}
            </div>
          </div>
        </header>

        {/* ── Main Content with Framer Motion Page Transition ────────────── */}
        <AnimatePresence mode="wait">
          <motion.main
            key={activeTab}
            className="main-content chrono-main-content"
            initial={{ opacity: 0, y: 8, scale: 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="main"
          >
            {/* Notifications Panel */}
            {activeTab === 'notifications' && (
              <div className="fade-in">
                <div className="page-header">
                  <div>
                    <h1 className="page-title-heading">Notifications & Announcements</h1>
                    <p className="page-subtitle-text">System alerts, automated scheduling updates, and college notices</p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="badge badge-orange">{unreadCount} unread</span>
                  )}
                </div>

                <div className="glass-panel chrono-glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                  {notifications.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-glass-icon"><Bell size={36} /></div>
                      <h3>All caught up</h3>
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
                addToast={addToast}
              />
            )}

            {/* Staff Dashboard */}
            {user.role === 'staff' && activeTab === 'dashboard' && (
              <StaffDashboard user={user} addToast={addToast} />
            )}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Floating Action Button for Mobile/Tablet */}
      <FloatingActionButton
        onOpenCommand={() => setIsCommandOpen(true)}
      />
    </div>
  );
}
