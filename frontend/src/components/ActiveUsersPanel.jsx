import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  UserCheck, RefreshCw, Shield, Users, Activity, Clock
} from 'lucide-react';

export default function ActiveUsersPanel() {
  // State — UNCHANGED
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // loadData — UNCHANGED
  const loadData = async () => {
    setLoading(true);
    const data = await db.getActiveSessions();
    setSessions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derived — UNCHANGED
  const activeCount   = sessions.filter(s => s.isActive).length;
  const hodCount      = sessions.filter(s => s.role === 'hod').length;
  const staffCount    = sessions.filter(s => s.role === 'staff').length;
  const inactiveCount = sessions.filter(s => !s.isActive).length;

  const getInitials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const formatTime = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTime = (ts) => {
    if (!ts) return 'N/A';
    const d = new Date(ts);
    return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getSessionDuration = (loginTime) => {
    if (!loginTime) return '';
    const ms = Date.now() - new Date(loginTime).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m session`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m session`;
  };

  const filtered = sessions.filter(s => {
    if (filter === 'active') return s.isActive;
    if (filter === 'inactive') return !s.isActive;
    if (filter === 'hod') return s.role === 'hod';
    if (filter === 'staff') return s.role === 'staff';
    return true;
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Active Users</h1>
          <p>Real-time session tracking and login activity across all roles</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={loadData}
          disabled={loading}
          aria-label="Refresh sessions"
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '24px' }}>
        {[
          { label: 'Online Now',       value: activeCount,   icon: <Activity size={18} style={{ color: 'var(--green-light)' }} />,  color: 'green',  sub: 'Currently active sessions' },
          { label: 'Total Sessions',   value: sessions.length, icon: <Users size={18} style={{ color: 'var(--blue-light)' }} />,    color: 'blue',   sub: 'All tracked logins' },
          { label: 'HOD Logins',       value: hodCount,      icon: <Shield size={18} style={{ color: 'var(--purple-light)' }} />,   color: 'purple', sub: 'Admin-role sessions' },
          { label: 'Staff Logins',     value: staffCount,    icon: <UserCheck size={18} style={{ color: 'var(--indigo-light)' }} />, color: 'indigo', sub: 'Faculty-role sessions' },
        ].map((card, i) => (
          <div key={i} className={`stat-card ${card.color}`}>
            <div className="stat-card-icon">{card.icon}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs + Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={15} style={{ color: 'var(--green-light)' }} />
            Session Log
            <span className="badge badge-green">{sessions.length}</span>
          </h3>

          <div className="tabs-bar" style={{ borderBottom: 'none', marginBottom: 0, gap: '2px' }}>
            {[
              { id: 'all',      label: 'All',      count: sessions.length },
              { id: 'active',   label: 'Online',   count: activeCount },
              { id: 'inactive', label: 'Offline',  count: inactiveCount },
              { id: 'hod',      label: 'HOD',      count: hodCount },
              { id: 'staff',    label: 'Staff',    count: staffCount },
            ].map(f => (
              <button
                key={f.id}
                className={`tab-btn ${filter === f.id ? 'active' : ''}`}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="badge" style={{ fontSize: '0.62rem', marginLeft: '2px', background: 'var(--bg-elevated)' }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px', padding: '48px 24px', color: 'var(--text-muted)' }}>
            <div className="loading-spinner" />
            <p style={{ fontSize: '0.845rem' }}>Fetching sessions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <UserCheck size={48} className="empty-state-icon" />
            <h3>No sessions found</h3>
            <p>No users match the selected filter. Try switching to "All".</p>
          </div>
        ) : (
          filtered.map(session => (
            <div key={session.userId || session.id} className="active-user-row">
              {/* Live dot */}
              <div className={`active-dot ${session.isActive ? 'online' : 'offline'}`} />

              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: session.role === 'hod'
                  ? 'linear-gradient(135deg, var(--blue), var(--purple))'
                  : 'linear-gradient(135deg, var(--indigo), var(--purple))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.72rem', color: 'white', flexShrink: 0,
                letterSpacing: '0.02em'
              }}>
                {getInitials(session.name || session.userId || 'U')}
              </div>

              {/* Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.name || session.userId}
                  </span>
                  <span className={`badge ${session.role === 'hod' ? 'badge-blue' : 'badge-indigo'}`} style={{ fontSize: '0.62rem', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {session.role === 'hod' ? <><Shield size={9} /> HOD</> : <><UserCheck size={9} /> Staff</>}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  {session.userId && session.name && (
                    <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{session.userId}</span>
                  )}
                  {session.email && <span>{session.email}</span>}
                </div>
              </div>

              {/* Time info */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end', marginBottom: '2px' }}>
                  <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: session.isActive ? 'var(--green-light)' : 'var(--text-muted)' }}>
                    {session.isActive ? formatTime(session.loginTime) : 'Offline'}
                  </span>
                </div>
                {session.isActive && session.loginTime && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {getSessionDuration(session.loginTime)}
                  </div>
                )}
                {!session.isActive && session.logoutTime && (
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-disabled)' }}>
                    Left {formatDateTime(session.logoutTime)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
