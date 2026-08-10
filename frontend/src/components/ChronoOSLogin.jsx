import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, GraduationCap, Lock, Mail, Eye, EyeOff,
  ArrowRight, RefreshCw, Sun, Moon, CheckCircle2, Clock,
  Sparkles, AlertCircle, Search, ShieldCheck, Zap, Cloud, Cpu, Activity
} from 'lucide-react';
import Chrono3DTimeCore from './Chrono3DTimeCore';

export default function ChronoOSLogin({
  theme,
  toggleTheme,
  onLogin,
  loginLoading,
  loginError,
  fillDemo,
  onOpenCommandPalette
}) {
  const [role, setRole] = useState('hod');
  const [email, setEmail] = useState('hod@college.edu');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Time & Greeting Engine
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: "Good Morning", sub: "Ready to build conflict-free timetables?" };
    if (hour >= 12 && hour < 17) return { text: "Good Afternoon", sub: "Welcome back to ChronoAI Intelligence" };
    if (hour >= 17 && hour < 22) return { text: "Good Evening", sub: "Let's review department schedules" };
    return { text: "Welcome Back", sub: "AI Constraint Engine is fully operational" };
  };

  const greeting = getGreeting();

  // Password strength calculation
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 25, label: 'Weak', color: 'var(--danger-text)' };
    if (score <= 3) return { score: 65, label: 'Moderate', color: 'var(--warning-text)' };
    return { score: 100, label: 'Strong', color: 'var(--success-text)' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleKeyUp = (e) => {
    if (e.getModifierState) {
      setCapsLockOn(e.getModifierState('CapsLock'));
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    setIsTyping(true);
    clearTimeout(window._typingTimer);
    window._typingTimer = setTimeout(() => setIsTyping(false), 800);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await onLogin(role, email, password);
    if (success) {
      setLoginSuccess(true);
    }
  };

  const roles = [
    { id: 'hod', label: 'HOD Admin', icon: <Shield size={16} />, demoEmail: 'hod@college.edu', demoPwd: 'Admin123' },
    { id: 'staff', label: 'Faculty Staff', icon: <Users size={16} />, demoEmail: 'STF001', demoPwd: 'Staff@123' },
    { id: 'student', label: 'Student Portal', icon: <GraduationCap size={16} />, demoEmail: 'CS202401', demoPwd: 'Student@123' }
  ];

  const handleRoleSelect = (r) => {
    setRole(r.id);
    setEmail(r.demoEmail);
    if (fillDemo) {
      fillDemo(r.id, r.demoEmail, r.demoPwd);
    }
  };

  return (
    <div className="chrono-3d-login-layout">
      {/* ── Dynamic Island Success Notification ────────────────────────────────── */}
      <AnimatePresence>
        {loginSuccess && (
          <motion.div
            className="dynamic-island-notification"
            initial={{ opacity: 0, y: -40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
          >
            <div className="dynamic-island-content">
              <CheckCircle2 size={20} className="island-success-icon" />
              <div className="island-text-group">
                <span className="island-title">Authenticated Successfully</span>
                <span className="island-sub">Unlocking ChronoAI Intelligence...</span>
              </div>
              <motion.div
                className="island-loader-spinner"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Header Controls ───────────────────────────────────────────────── */}
      <header className="chrono-login-topbar">
        <div className="glass-clock-pill">
          <Clock size={14} className="clock-icon" />
          <span className="clock-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="clock-date-divider">•</span>
          <span className="clock-date">
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>

        <div className="login-topbar-actions">
          <motion.button
            className="login-action-btn"
            onClick={onOpenCommandPalette}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Open Command Palette (Ctrl+K)"
          >
            <Search size={15} />
            <span>Search (Ctrl+K)</span>
          </motion.button>

          <motion.button
            className="login-action-btn icon-only"
            onClick={toggleTheme}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </motion.button>
        </div>
      </header>

      {/* ── CINEMATIC SPLIT CONTENT CONTAINER ─────────────────────────────────── */}
      <div className="chrono-3d-split-container">
        
        {/* LEFT COLUMN: AUTHENTICATION FORM */}
        <div className="chrono-auth-column">
          <motion.div
            className="login-brand-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="brand-title">ChronoAI <span className="brand-badge">OS</span></span>
          </motion.div>

          <motion.div
            className="login-welcome-headings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="welcome-main-title">
              {greeting.text}, <span className="welcome-red-text">Welcome Back</span>
            </h1>
            <p className="welcome-sub-title">Intelligent Academic Timetable Platform</p>
          </motion.div>

          {/* Floating Glass Login Card */}
          <motion.div
            className={`glass-login-card-centered ${loginError ? 'shake-error' : ''}`}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300, delay: 0.3 }}
          >
            {/* Animated Role Switcher Pills */}
            <div className="role-segmented-control" role="tablist" aria-label="Select User Role">
              {roles.map((r) => {
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    className={`segmented-role-btn ${isActive ? 'active' : ''}`}
                    onClick={() => handleRoleSelect(r)}
                    role="tab"
                    aria-selected={isActive}
                  >
                    {isActive && (
                      <motion.div
                        className="segmented-active-pill"
                        layoutId="segmented-role-pill"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                    <span className="role-btn-icon">{r.icon}</span>
                    <span className="role-btn-label">{r.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="login-glass-form">
              <div className="glass-form-group">
                <label className="glass-form-label" htmlFor="login-email-input">
                  {role === 'hod' ? 'HOD ID or Email' : role === 'staff' ? 'Staff ID or Email' : 'Register No'}
                </label>
                <div className="glass-input-wrapper">
                  <Mail size={17} className="input-prefix-icon" />
                  <input
                    id="login-email-input"
                    type="text"
                    className="glass-input-field"
                    placeholder={role === 'hod' ? 'hod@college.edu' : role === 'staff' ? 'STF001' : 'CS202401'}
                    value={email}
                    onChange={handleInputChange(setEmail)}
                    autoFocus
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="glass-form-group">
                <div className="label-row">
                  <label className="glass-form-label" htmlFor="login-password-input">Password</label>
                  {capsLockOn && (
                    <span className="caps-lock-warning">
                      <AlertCircle size={12} /> Caps Lock ON
                    </span>
                  )}
                </div>
                <div className="glass-input-wrapper">
                  <Lock size={17} className="input-prefix-icon" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    className="glass-input-field"
                    placeholder="Enter password"
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    onKeyUp={handleKeyUp}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-eye-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {password.length > 0 && (
                  <div className="pwd-strength-bar-wrapper">
                    <div
                      className="pwd-strength-fill"
                      style={{ width: `${pwdStrength.score}%`, background: pwdStrength.color }}
                    />
                  </div>
                )}
              </div>

              {loginError && (
                <motion.div
                  className="glass-error-banner"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle size={16} />
                  <span>{loginError}</span>
                </motion.div>
              )}

              <motion.button
                type="submit"
                className="glass-continue-btn"
                disabled={loginLoading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
              >
                {loginLoading ? (
                  <>
                    <RefreshCw size={17} className="spin-icon" />
                    <span>Authenticating Credentials...</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Authenticated ✓</span>
                  </>
                ) : (
                  <>
                    <span>Enter ChronoAI</span>
                    <ArrowRight size={17} className="btn-arrow-icon" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Quick Demo Credentials Trio */}
          <motion.div
            className="quick-login-cards-trio"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {roles.map((r) => (
              <motion.button
                key={r.id}
                type="button"
                className={`quick-demo-trio-card ${role === r.id ? 'active-demo' : ''}`}
                onClick={() => handleRoleSelect(r)}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="trio-card-icon">{r.icon}</div>
                <div className="trio-card-info">
                  <span className="trio-card-title">{r.label}</span>
                  <span className="trio-card-sub">{r.demoEmail}</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>

        {/* RIGHT COLUMN: 3D INTERACTIVE TIME CORE CANVAS */}
        <div className="chrono-3d-scene-column" aria-hidden="true">
          <Chrono3DTimeCore />
        </div>

      </div>

      {/* Floating Status Capsules at Bottom */}
      <motion.footer
        className="login-security-pills-row"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="security-pill">
          <ShieldCheck size={13} />
          <span>Secure WebGL Authentication</span>
        </div>
        <div className="security-pill">
          <Zap size={13} />
          <span>AI Constraint Solver</span>
        </div>
        <div className="security-pill">
          <Lock size={13} />
          <span>Enterprise Security</span>
        </div>
        <div className="security-pill">
          <Cloud size={13} />
          <span>Cloud Sync</span>
        </div>
      </motion.footer>
    </div>
  );
}
