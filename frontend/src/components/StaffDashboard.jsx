import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  Calendar, Bell, Clock, RefreshCw, BookOpen, User,
  CheckCircle, AlertTriangle, Layers, GraduationCap, Mail
} from 'lucide-react';

export default function StaffDashboard({ user }) {
  // All state — UNCHANGED
  const [timetable, setTimetable] = useState(null);
  const [settings, setSettings] = useState({});
  const [staffSchedule, setStaffSchedule] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timetable');

  // loadData — UNCHANGED
  const loadData = async () => {
    setLoading(true);
    const [tData, sett, notifs] = await Promise.all([
      db.getTimetable(), db.getSettings(), db.getNotifications()
    ]);
    const filteredNotifs = notifs.filter(n => n.recipient_id === 'all' || n.recipient_id === user.id);
    setTimetable(tData);
    setSettings(sett);
    setNotifications(filteredNotifs);

    if (tData.tables && tData.status === 'published') {
      const schedule = {};
      const sections = ['1-A','1-B','2-A','2-B','3-A','3-B'];
      const dayCount = sett.dayOrdersCount || 6;
      const periodCount = sett.periodsPerDay || 5;

      for (let d = 1; d <= dayCount; d++) {
        schedule[d] = {};
        for (let p = 1; p <= periodCount; p++) schedule[d][p] = [];
      }

      sections.forEach(sec => {
        const table = tData.tables[sec];
        if (!table) return;
        for (let d = 1; d <= dayCount; d++) {
          for (let p = 1; p <= periodCount; p++) {
            const slot = table[d]?.[p];
            if (slot && slot.staffId === user.id) {
              schedule[d][p].push({ section: sec, subjectId: slot.subjectId, subjectName: slot.subjectName });
            }
          }
        }
      });
      setStaffSchedule(schedule);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Computed values — UNCHANGED
  const hasPublished = timetable?.status === 'published' && timetable?.tables;
  const unread = notifications.filter(n => !n.is_read).length;

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const countPeriods = () => {
    let count = 0;
    Object.values(staffSchedule).forEach(day =>
      Object.values(day).forEach(slots => { count += slots.length; }));
    return count;
  };

  const countSections = () => {
    const sects = new Set();
    Object.values(staffSchedule).forEach(day =>
      Object.values(day).forEach(slots =>
        slots.forEach(s => sects.add(s.section))));
    return sects.size;
  };

  // Subject color palette for timetable cells
  const subjectColors = [
    { bg: 'rgba(37,99,235,0.12)',   border: 'var(--blue)',    text: 'var(--blue-light)' },
    { bg: 'rgba(124,58,237,0.12)',  border: 'var(--purple)',  text: 'var(--purple-light)' },
    { bg: 'rgba(5,150,105,0.12)',   border: 'var(--emerald)', text: 'var(--emerald-light)' },
    { bg: 'rgba(79,70,229,0.12)',   border: 'var(--indigo)',  text: 'var(--indigo-light)' },
    { bg: 'rgba(8,145,178,0.12)',   border: 'var(--cyan)',    text: 'var(--cyan-light)' },
    { bg: 'rgba(234,88,12,0.12)',   border: 'var(--orange)',  text: 'var(--orange-light)' },
  ];

  const subjectColorMap = {};
  let colorIdx = 0;
  Object.values(staffSchedule).forEach(day =>
    Object.values(day).forEach(slots =>
      slots.forEach(s => {
        if (!subjectColorMap[s.subjectId]) {
          subjectColorMap[s.subjectId] = subjectColors[colorIdx % subjectColors.length];
          colorIdx++;
        }
      })));

  return (
    <div className="fade-in">
      {/* ── Welcome Header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--blue), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '1.15rem', color: 'white', flexShrink: 0,
            boxShadow: 'var(--shadow-glow-blue)',
            border: '2px solid rgba(255,255,255,0.1)'
          }}>
            {getInitials(user.name)}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: '2px' }}>
              Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p style={{ fontSize: '0.845rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Faculty</span>
              {user.id} · {user.email}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
          {[
            {
              label: 'Weekly Periods', value: hasPublished ? countPeriods() : '—',
              icon: <Calendar size={17} style={{ color: 'var(--blue-light)' }} />,
              color: 'blue', sub: 'Teaching hours this week'
            },
            {
              label: 'Sections Assigned', value: hasPublished ? countSections() : '—',
              icon: <Layers size={17} style={{ color: 'var(--purple-light)' }} />,
              color: 'purple', sub: 'Active class sections'
            },
            {
              label: 'Unread Alerts', value: unread || 0,
              icon: <Bell size={17} style={{ color: 'var(--orange-light)' }} />,
              color: 'orange', sub: 'Notifications pending'
            },
            {
              label: 'Timetable Status',
              value: hasPublished
                ? <span style={{ color: 'var(--emerald-light)', fontSize: '1.15rem', fontWeight: 700 }}>Published</span>
                : <span style={{ color: 'var(--amber-light)', fontSize: '1.15rem', fontWeight: 700 }}>Pending</span>,
              icon: <CheckCircle size={17} style={{ color: hasPublished ? 'var(--emerald-light)' : 'var(--amber-light)' }} />,
              color: hasPublished ? 'emerald' : 'amber',
              sub: hasPublished ? 'Schedule is live' : 'Awaiting HOD publish'
            },
          ].map((card, i) => (
            <div key={i} className={`stat-card ${card.color}`}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
              <div className="stat-card-sub">{card.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div className="tabs-bar" style={{ borderBottom: 'none', marginBottom: 0 }}>
          {[
            { id: 'timetable',     label: 'My Timetable',  icon: <Calendar size={14} /> },
            { id: 'notifications', label: 'Notifications', icon: <Bell size={14} />, badge: unread },
            { id: 'info',          label: 'Academic Info', icon: <GraduationCap size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
              {tab.badge > 0 && (
                <span className="nav-badge" style={{ marginLeft: '4px' }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh data"
        >
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* ── Tab: Timetable ─────────────────────────────────────────────── */}
      {activeTab === 'timetable' && (
        <div className="glass-panel fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid var(--glass-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.975rem' }}>
              <Calendar size={16} style={{ color: 'var(--blue-light)' }} />
              Personal Teaching Schedule
            </h3>
            {hasPublished && (
              <span className="badge badge-emerald">● Published</span>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: '12px', color: 'var(--text-muted)' }}>
              <div className="loading-spinner" />
              <p style={{ fontSize: '0.845rem' }}>Loading schedule...</p>
            </div>
          ) : hasPublished ? (
            <div className="timetable-wrapper">
              <div className="timetable-grid" style={{ gridTemplateColumns: `110px repeat(${settings.dayOrdersCount || 6}, 1fr)` }}>
                {/* Header row */}
                <div className="timetable-cell header">Time</div>
                {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, i) => (
                  <div key={i} className="timetable-cell header">Day {i + 1}</div>
                ))}

                {/* Period rows */}
                {Array.from({ length: settings.periodsPerDay || 5 }).map((_, pIdx) => {
                  const p = pIdx + 1;
                  const isBreak = p === (settings.breakAfterPeriod || 3) + 1;
                  return (
                    <React.Fragment key={pIdx}>
                      {isBreak && (
                        <div style={{ gridColumn: `1 / span ${(settings.dayOrdersCount || 6) + 1}` }}>
                          <div className="timetable-break">
                            ☕ TEA BREAK — {settings.timings?.break}
                          </div>
                        </div>
                      )}

                      {/* Time header cell */}
                      <div className="timetable-cell header" style={{ flexDirection: 'column', gap: '2px', minHeight: '52px' }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>P{p}</strong>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {settings.timings?.[p]?.split(' - ')[0]}
                        </span>
                      </div>

                      {/* Day cells */}
                      {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, dIdx) => {
                        const day = dIdx + 1;
                        const slots = staffSchedule[day]?.[p] || [];
                        const isTeaching = slots.length > 0;
                        const firstSlot = slots[0];
                        const colorScheme = firstSlot ? subjectColorMap[firstSlot.subjectId] : null;

                        return (
                          <div
                            key={dIdx}
                            className={`timetable-cell ${isTeaching ? 'lab' : 'free'}`}
                            style={{
                              cursor: 'default',
                              ...(isTeaching && colorScheme ? {
                                background: colorScheme.bg,
                                borderLeft: `2px solid ${colorScheme.border}`,
                              } : {})
                            }}
                          >
                            {isTeaching ? (
                              <>
                                <div className="cell-subject" style={{ color: colorScheme?.text || 'var(--blue-light)' }}>
                                  {firstSlot.subjectId}
                                </div>
                                <div className="cell-name">{firstSlot.subjectName}</div>
                                <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px' }}>
                                  {slots.map(s => (
                                    <span key={s.section} className="badge" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>
                                      §{s.section}
                                    </span>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <div className="cell-subject" style={{ color: 'var(--cell-free-text)' }}>—</div>
                            )}
                            <div className="cell-period">P{p}</div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={56} className="empty-state-icon" />
              <h3>Timetable Not Published</h3>
              <p>Your schedule will appear here once the HOD generates and publishes the timetable.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Notifications ─────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="glass-panel fade-in" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell size={15} style={{ color: 'var(--orange-light)' }} />
              System Alerts
              {unread > 0 && <span className="badge badge-orange">{unread} new</span>}
            </h3>
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} className="empty-state-icon" />
              <h3>No notifications yet</h3>
              <p>System alerts and timetable updates will appear here.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`notification-item ${!n.is_read ? 'unread' : ''}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div className="notification-title">{n.title}</div>
                    <div className="notification-msg">{n.message}</div>
                    <div className="notification-time">
                      {new Date(n.created_at || n.date).toLocaleString()}
                    </div>
                  </div>
                  {!n.is_read && (
                    <span className="badge badge-orange" style={{ flexShrink: 0, fontSize: '0.62rem' }}>New</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Tab: Academic Info ─────────────────────────────────────────── */}
      {activeTab === 'info' && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} style={{ color: 'var(--blue-light)' }} />
              Schedule Configuration
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { label: 'Days / Week', value: settings.dayOrdersCount || 6 },
                { label: 'Periods / Day', value: settings.periodsPerDay || 5 },
                { label: 'Break After Period', value: `P${settings.breakAfterPeriod || 3}` },
                { label: 'Break Time', value: settings.timings?.break || 'N/A' },
              ].map((item, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-hover)', border: '1px solid var(--glass-border)'
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: 'var(--text-heading)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} style={{ color: 'var(--blue-light)' }} />
              Period Timings
            </h3>
            {settings.timings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(settings.timings).filter(([k]) => k !== 'break' && !isNaN(Number(k))).map(([period, time]) => (
                  <div key={period} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--bg-hover)', border: '1px solid var(--glass-border)' }}>
                    <span className="badge badge-blue" style={{ minWidth: '36px', justifyContent: 'center', fontFamily: 'JetBrains Mono, monospace' }}>P{period}</span>
                    <span style={{ fontSize: '0.845rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>{time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel">
            <h3 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} style={{ color: 'var(--purple-light)' }} />
              My Profile
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Full Name', value: user.name },
                { label: 'Staff ID', value: user.id },
                { label: 'Email', value: user.email },
                { label: 'Role', value: 'Faculty / Staff Member' },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-hover)', border: '1px solid var(--glass-border)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', minWidth: '90px' }}>{row.label}</span>
                  <span style={{ fontSize: '0.845rem', color: 'var(--text-primary)', fontWeight: 500 }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
