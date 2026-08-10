import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, GraduationCap, Lock, Mail, Eye, EyeOff,
  ArrowRight, RefreshCw, Sun, Moon, CheckCircle2, Clock,
  Sparkles, AlertCircle, Search, ShieldCheck, Zap, Cloud, Cpu, Activity
} from 'lucide-react';

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
  ];

  return (
    <div className="chrono-os-login-container">
      {/* ── Background AI Timetable Neural Network Visualizer ──────────────────── */}
      <BackgroundNeuralVisualizer theme={theme} />

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
                <span className="island-sub">Unlocking Chrono Glass OS...</span>
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

      {/* ── PERFECTLY CENTERED EXPERIENCE ─────────────────────────────────────── */}
      <main className="chrono-login-centered-wrapper">
        
        {/* Logo */}
        <motion.div
          className="login-brand-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="brand-title">ChronoAI <span className="brand-badge">OS</span></span>
        </motion.div>

        {/* 150-180px Large AI Intelligence Core Orb */}
        <motion.div
          className="large-ai-orb-wrapper"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div className={`large-ai-orb-glass ${isTyping ? 'orb-reacting' : ''}`}>
            {/* Rotating outer light rings */}
            <motion.div
              className="orb-outer-ring ring-primary"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="orb-outer-ring ring-secondary"
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Breathing Inner Glowing Particle Core */}
            <motion.div
              className="orb-inner-core"
              animate={{
                scale: isTyping ? [1, 1.25, 1.1] : [1, 1.12, 1],
                opacity: isTyping ? [0.9, 1, 0.9] : [0.75, 0.95, 0.75]
              }}
              transition={{ duration: isTyping ? 1.5 : 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            
            <Sparkles size={36} className="orb-center-sparkle" />
          </div>
        </motion.div>

        {/* Welcome Section */}
        <motion.div
          className="login-welcome-headings"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="welcome-main-title">
            {greeting.text}, <span className="welcome-red-text">Welcome Back</span>
          </h1>
          <p className="welcome-sub-title">AI-Powered Timetable Intelligence Platform</p>
        </motion.div>

        {/* Floating Glass Login Card (480px - 520px Width, 32px Radius) */}
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
                  onClick={() => {
                    setRole(r.id);
                    setEmail(r.demoEmail);
                  }}
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
                {role === 'hod' ? 'HOD ID or Email' : 'Staff ID or Email'}
              </label>
              <div className="glass-input-wrapper">
                <Mail size={17} className="input-prefix-icon" />
                <input
                  id="login-email-input"
                  type="text"
                  className="glass-input-field"
                  placeholder={role === 'hod' ? 'hod@college.edu' : 'STF001'}
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
                  <span>Continue</span>
                  <ArrowRight size={17} className="btn-arrow-icon" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Three Floating Quick Login Cards Side-by-Side */}
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
              className="quick-demo-trio-card"
              onClick={() => {
                setRole(r.id);
                fillDemo(r.id, r.demoEmail, r.demoPwd);
              }}
              whileHover={{ y: -4, scale: 1.03 }}
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

      </main>

      {/* Floating Status Capsules at Bottom */}
      <motion.footer
        className="login-security-pills-row"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="security-pill">
          <ShieldCheck size={13} />
          <span>Secure Authentication</span>
        </div>
        <div className="security-pill">
          <Zap size={13} />
          <span>AI Scheduling Engine</span>
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

// ── Background Neural Timetable Network Visualizer ────────────────────────────
function BackgroundNeuralVisualizer({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isDark = theme === 'dark';

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Neural nodes representing timetable slots & course connections
    const nodeCount = 28;
    const nodes = Array.from({ length: nodeCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1.5,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect neural nodes with red connection lines
      for (let i = 0; i < nodeCount; i++) {
        const nodeA = nodes[i];
        nodeA.x += nodeA.vx;
        nodeA.y += nodeA.vy;

        if (nodeA.x < 0 || nodeA.x > width) nodeA.vx *= -1;
        if (nodeA.y < 0 || nodeA.y > height) nodeA.vy *= -1;

        for (let j = i + 1; j < nodeCount; j++) {
          const nodeB = nodes[j];
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 190) {
            const alpha = (1 - dist / 190) * 0.16;
            ctx.strokeStyle = `rgba(220, 38, 38, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodeA.x, nodeA.y);
            ctx.lineTo(nodeB.x, nodeB.y);
            ctx.stroke();
          }
        }

        ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.beginPath();
        ctx.arc(nodeA.x, nodeA.y, nodeA.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
