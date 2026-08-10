import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Calendar, Bell, ShieldAlert, GraduationCap, Info } from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [timetable, setTimetable] = useState(null);
  const [settings, setSettings] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [selectedElectiveSubject, setSelectedElectiveSubject] = useState('Software Engineering');
  const [timetableMode, setTimetableMode] = useState('grid');
  const [selectedDayTab, setSelectedDayTab] = useState(1);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(0,0,0,0.2)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Elective Track:</span>
            <select
              value={selectedElectiveSubject}
              onChange={e => setSelectedElectiveSubject(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
            >
              <option value="Software Engineering" style={{ background: '#111' }}>Software Engineering (Group A)</option>
              <option value="Artificial Intelligence" style={{ background: '#111' }}>Artificial Intelligence (Group B)</option>
              <option value="Cloud Computing" style={{ background: '#111' }}>Cloud Computing (Group C)</option>
              <option value="Data Mining" style={{ background: '#111' }}>Data Mining (Group D)</option>
            </select>
          </div>
          <span className="badge badge-indigo" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <GraduationCap size={14} />
            Student Account
          </span>
        </div>
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
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
                <div className="timetable-view-toggle">
                  <button
                    className={`timetable-view-toggle-btn ${timetableMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setTimetableMode('grid')}
                    type="button"
                  >
                    📊 Grid View
                  </button>
                  <button
                    className={`timetable-view-toggle-btn ${timetableMode === 'daily' ? 'active' : ''}`}
                    onClick={() => setTimetableMode('daily')}
                    type="button"
                  >
                    📱 Daily Cards
                  </button>
                </div>
              </div>

              {timetableMode === 'grid' ? (
                <div className="timetable-wrapper">
                  <div className="timetable-grid">
                    {/* Header row */}
                    <div className="timetable-cell header">Timings</div>
                    {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, index) => (
                      <div key={index} className="timetable-cell header">
                        Day Order {index + 1}
                      </div>
                    ))}

                    {/* Grid Slots */}
                    {Array.from({ length: settings.periodsPerDay || 5 }).map((_, pIdx) => {
                      const periodNo = pIdx + 1;
                      const isBreakRow = periodNo === (settings.breakAfterPeriod || 3) + 1;

                      return (
                        <React.Fragment key={pIdx}>
                          {isBreakRow && (
                            <div style={{
                              gridColumn: `1 / span ${(settings.dayOrdersCount || 6) + 1}`,
                              background: 'rgba(245, 158, 11, 0.05)',
                              border: '1px dashed rgba(245, 158, 11, 0.2)',
                              color: 'var(--accent-amber)',
                              textAlign: 'center',
                              padding: '0.4rem',
                              fontSize: '0.75rem',
                              borderRadius: 'var(--radius-sm)'
                            }}>
                              ☕ TEA BREAK: {settings.timings?.break}
                            </div>
                          )}

                          <div className="timetable-cell header" style={{ fontSize: '0.7rem', padding: '0.5rem', textAlign: 'center' }}>
                            <strong>Period {periodNo}</strong>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                              {settings.timings?.[periodNo]}
                            </div>
                          </div>

                          {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, dIdx) => {
                            const dayOrder = dIdx + 1;
                            const rawSlot = timetable.tables[user.section]?.[dayOrder]?.[periodNo];

                            let slot = rawSlot;
                            if (rawSlot?.isElective && rawSlot?.courses && rawSlot.courses.length > 0) {
                              const chosen = rawSlot.courses.find(c => c.subjectId === selectedElectiveSubject || c.subjectName === selectedElectiveSubject) || rawSlot.courses[0];
                              slot = {
                                subjectId: chosen.subjectId,
                                subjectName: chosen.subjectName,
                                staffName: chosen.staffName,
                                isElective: true,
                                electiveName: rawSlot.electiveName
                              };
                            }

                            const isLab = slot?.subjectId === 'CS103' || slot?.subjectName?.toLowerCase().includes('lab');
                            const isFree = slot?.subjectId === 'FREE';
                            const isFirstYear = user?.section?.startsWith('1');
                            const isNoPeriod = periodNo === 5 && isFirstYear && (dayOrder === 1 || dayOrder === 2);

                            return (
                              <div 
                                key={dIdx} 
                                className={`timetable-cell ${isLab ? 'lab' : ''} ${isFree ? 'free' : ''}`}
                                style={{ cursor: 'default', opacity: isNoPeriod ? 0.45 : 1 }}
                              >
                                {slot?.isNME ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%', textAlign: 'center' }}>
                                    <span className="badge badge-indigo" style={{ fontSize: '0.6rem' }}>⚡ NME Session</span>
                                    <div style={{ fontWeight: 700, color: 'white', fontSize: '0.72rem' }}>NME (12:40-1:30 PM)</div>
                                    <span className="cell-slot" style={{ marginTop: 'auto' }}>P{periodNo}</span>
                                  </div>
                                ) : isNoPeriod ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '2px' }}>
                                    <span className="badge badge-gray" style={{ fontSize: '0.6rem' }}>⏹ END OF DAY</span>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>NME Finish</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="cell-subject" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                      <span>{slot?.subjectId === 'FREE' ? 'Study' : slot?.subjectId}</span>
                                      {slot?.isElective && <span className="badge badge-purple" style={{ fontSize: '0.58rem', padding: '0px 4px' }}>Elective</span>}
                                    </div>
                                    <div className="cell-faculty" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {slot?.subjectName}
                                    </div>
                                    <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', marginTop: 'auto', width: '100%' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{slot?.staffName}</span>
                                      <span className="cell-slot" style={{ marginLeft: 'auto' }}>P{periodNo}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="timetable-mobile-nav">
                    {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`timetable-mobile-tab ${selectedDayTab === i + 1 ? 'active' : ''}`}
                        onClick={() => setSelectedDayTab(i + 1)}
                      >
                        Day Order {i + 1}
                      </button>
                    ))}
                  </div>

                  <div className="timetable-daily-cards">
                    {Array.from({ length: settings.periodsPerDay || 5 }).map((_, pIdx) => {
                      const periodNo = pIdx + 1;
                      const isBreakRow = periodNo === (settings.breakAfterPeriod || 3) + 1;
                      const rawSlot = timetable.tables[user.section]?.[selectedDayTab]?.[periodNo];

                      let slot = rawSlot;
                      if (rawSlot?.isElective && rawSlot?.courses && rawSlot.courses.length > 0) {
                        const chosen = rawSlot.courses.find(c => c.subjectId === selectedElectiveSubject || c.subjectName === selectedElectiveSubject) || rawSlot.courses[0];
                        slot = {
                          subjectId: chosen.subjectId,
                          subjectName: chosen.subjectName,
                          staffName: chosen.staffName,
                          isElective: true,
                          electiveName: rawSlot.electiveName
                        };
                      }

                      const isLab = slot?.subjectId === 'CS103' || slot?.subjectName?.toLowerCase().includes('lab');
                      const isFree = slot?.subjectId === 'FREE';

                      return (
                        <React.Fragment key={pIdx}>
                          {isBreakRow && (
                            <div className="timetable-break" style={{ marginBottom: '12px' }}>
                              ☕ TEA BREAK — {settings.timings?.break}
                            </div>
                          )}
                          <div className={`timetable-period-card ${isLab ? 'lab' : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                                Period {periodNo} ({settings.timings?.[periodNo] || '09:00 - 10:00 AM'})
                              </span>
                              {slot?.isElective && <span className="badge badge-purple">Elective Track</span>}
                            </div>
                            {!isFree && slot ? (
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-heading)' }}>{slot.subjectName}</strong>
                                  <span className="badge badge-indigo" style={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace' }}>{slot.subjectId}</span>
                                </div>
                                <div style={{ fontSize: '0.845rem', color: 'var(--text-secondary)' }}>
                                  Faculty: <strong>{slot.staffName || 'Faculty Member'}</strong>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Free Slot / Self-Study Period
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
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
