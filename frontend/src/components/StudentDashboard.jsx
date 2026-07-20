import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Calendar, Bell, ShieldAlert, GraduationCap, Info } from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [timetable, setTimetable] = useState(null);
  const [settings, setSettings] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const tData = db.getTimetable();
    const sett = db.getSettings();
    const notifs = db.getNotifications().filter(n => n.recipientId === 'all');

    setTimetable(tData);
    setSettings(sett);
    setNotifications(notifs);
  };

  const hasPublishedTable = timetable && timetable.status === 'published' && timetable.tables && timetable.tables[user.section];

  return (
    <div className="fade-in">
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)' }}>Student Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Register No: <strong style={{ color: 'white' }}>{user.regNo}</strong> | Class: <strong style={{ color: 'var(--accent-indigo)' }}>B.Sc. CS - Section {user.section}</strong>
          </p>
        </div>
        <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <GraduationCap size={14} />
          Student Account
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        {/* Timetable visual grid */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} style={{ color: 'var(--accent-indigo)' }} />
              Class Timetable - Section {user.section}
            </h3>
            {hasPublishedTable && (
              <span className="badge badge-emerald">Active Schedule</span>
            )}
          </div>

          {hasPublishedTable ? (
            <div style={{ overflowX: 'auto' }}>
              <div className="timetable-grid">
                {/* Header row */}
                <div className="timetable-cell header">Timings</div>
                {Array.from({ length: settings.dayOrdersCount }).map((_, index) => (
                  <div key={index} className="timetable-cell header">
                    Day Order {index + 1}
                  </div>
                ))}

                {/* Grid Slots */}
                {Array.from({ length: settings.periodsPerDay }).map((_, pIdx) => {
                  const periodNo = pIdx + 1;
                  const isBreakRow = periodNo === settings.breakAfterPeriod + 1;

                  return (
                    <React.Fragment key={pIdx}>
                      {isBreakRow && (
                        <div style={{
                          gridColumn: `1 / span ${settings.dayOrdersCount + 1}`,
                          background: 'rgba(245, 158, 11, 0.05)',
                          border: '1px dashed rgba(245, 158, 11, 0.2)',
                          color: 'var(--accent-amber)',
                          textAlign: 'center',
                          padding: '0.4rem',
                          fontSize: '0.75rem',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          ☕ TEA BREAK: {settings.timings.break}
                        </div>
                      )}

                      <div className="timetable-cell header" style={{ fontSize: '0.7rem', padding: '0.5rem', textAlign: 'center' }}>
                        <strong>Period {periodNo}</strong>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {settings.timings[periodNo]}
                        </div>
                      </div>

                      {Array.from({ length: settings.dayOrdersCount }).map((_, dIdx) => {
                        const dayOrder = dIdx + 1;
                        const slot = timetable.tables[user.section]?.[dayOrder]?.[periodNo];
                        const isLab = slot?.subjectId === 'CS103' || slot?.subjectName.toLowerCase().includes('lab');
                        const isFree = slot?.subjectId === 'FREE';

                        return (
                          <div 
                            key={dIdx} 
                            className={`timetable-cell ${isLab ? 'lab' : ''} ${isFree ? 'free' : ''}`}
                            style={{ cursor: 'default' }}
                          >
                            <div className="cell-subject">{slot?.subjectId === 'FREE' ? 'Study' : slot?.subjectId}</div>
                            <div className="cell-faculty" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {slot?.subjectName}
                            </div>
                            <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', marginTop: 'auto', width: '100%' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{slot?.staffName}</span>
                              <span className="cell-slot" style={{ marginLeft: 'auto' }}>P{periodNo}</span>
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <ShieldAlert size={48} style={{ opacity: 0.15, marginBottom: '1.5rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Schedule Pending Publication</h3>
              <p style={{ maxWidth: '400px', margin: '0 auto', fontSize: '0.9rem' }}>
                Your class timetable has not been published by the administration yet. You will see your day order grids here once released.
              </p>
            </div>
          )}
        </div>

        {/* Notices board */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Notifications */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              <Bell size={18} style={{ color: 'var(--accent-indigo)' }} />
              Official Announcements
            </h3>
            
            {notifications.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active college notices.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '0.75rem',
                    background: 'rgba(255,255,255,0.01)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: 'white' }}>{n.title}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(n.date).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Student guidelines */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
              <Info size={18} style={{ color: 'var(--accent-indigo)' }} />
              Timetable Rules
            </h3>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
              <li>
                <strong>Read-Only Access:</strong> Students are strictly authorized to view schedules and cannot execute modifications.
              </li>
              <li>
                <strong>Registration logins:</strong> Logins are mapped to your register range (CS26001+ for Sec 1-A; CS26101+ for Sec 1-B).
              </li>
              <li>
                <strong>Day Orders count:</strong> Follows standard Day Order 1 through 6, cycle-based rotation.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
