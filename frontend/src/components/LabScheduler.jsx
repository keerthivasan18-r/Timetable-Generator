import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  FlaskConical, Plus, Trash, RefreshCw, Info, X, Save, AlertTriangle, CheckCircle
} from 'lucide-react';

export default function LabScheduler() {
  // All state — UNCHANGED
  const [settings, setSettings] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [labSlots, setLabSlots] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeSection, setActiveSection] = useState('1-A');
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState(null);

  const [editSlot, setEditSlot] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editStaff, setEditStaff] = useState('');

  useEffect(() => { loadAll(); }, []);
  useEffect(() => {
    if (banner) { const t = setTimeout(() => setBanner(null), 4000); return () => clearTimeout(t); }
  }, [banner]);

  // loadAll — UNCHANGED
  const loadAll = async () => {
    setLoading(true);
    const [sett, subs, stf, slots, asgns] = await Promise.all([
      db.getSettings(), db.getSubjects(), db.getStaff(),
      db.getLabSlots(), db.getAssignments()
    ]);
    setSettings(sett); setSubjects(subs); setStaff(stf);
    setLabSlots(slots); setAssignments(asgns); setLoading(false);
  };

  // Helpers — UNCHANGED
  const isLabSlot = (section, day, period) =>
    labSlots.some(s => s.section === section && (s.day_order ?? s.dayOrder) == day && s.period == period);

  const getSlotData = (section, day, period) =>
    labSlots.find(s => s.section === section && (s.day_order ?? s.dayOrder) == day && s.period == period);

  const openEdit = (section, day, period) => {
    const existing = getSlotData(section, day, period);
    setEditSlot({ section, dayOrder: day, period });
    setEditSubject(existing?.subject_id || existing?.subjectId || '');
    const subId = existing?.subject_id || existing?.subjectId;
    if (subId) {
      const asgn = assignments.find(a => a.section === section && a.subjectId === subId);
      setEditStaff(asgn?.staffId || '');
    } else { setEditStaff(''); }
  };

  const handleSubjectChange = (subId) => {
    setEditSubject(subId);
    if (subId && editSlot) {
      const asgn = assignments.find(a => a.section === editSlot.section && a.subjectId === subId);
      setEditStaff(asgn?.staffId || '');
    }
  };

  // saveSlot — UNCHANGED
  const saveSlot = async () => {
    if (!editSlot) return;
    const err = getValidationWarning();
    if (err) { setBanner({ type: 'error', msg: err }); return; }
    await db.setLabSlot({
      section: editSlot.section, dayOrder: editSlot.dayOrder,
      period: editSlot.period, subjectId: editSubject || null, staffId: editStaff || null
    });
    setBanner({ type: 'success', msg: `Lab slot saved: ${editSlot.section} Day ${editSlot.dayOrder} Period ${editSlot.period}` });
    setEditSlot(null);
    await loadAll();
  };

  // removeSlot — UNCHANGED
  const removeSlot = async (section, dayOrder, period) => {
    await db.removeLabSlot({ section, dayOrder, period });
    setBanner({ type: 'success', msg: 'Lab slot removed.' });
    await loadAll();
  };

  // getValidationWarning — UNCHANGED (full original logic)
  const getValidationWarning = () => {
    if (!editSlot || !editSubject) return null;
    if (editStaff) {
      const facConflict = labSlots.find(s =>
        (s.staff_id === editStaff || s.staffId === editStaff) &&
        (s.day_order ?? s.dayOrder) == editSlot.dayOrder &&
        s.period == editSlot.period &&
        s.section !== editSlot.section
      );
      if (facConflict) {
        const conflictSec = facConflict.section;
        const staffMember = staff.find(st => st.id === editStaff);
        return `Faculty Conflict: ${staffMember?.name || editStaff} is already scheduled in section ${conflictSec} at Day ${editSlot.dayOrder}, Period ${editSlot.period}. Please reassign or choose a different slot.`;
      }
    }
    const sameSubjectConflict = labSlots.find(s =>
      (s.subject_id === editSubject || s.subjectId === editSubject) &&
      (s.day_order ?? s.dayOrder) == editSlot.dayOrder &&
      s.period == editSlot.period &&
      s.section === editSlot.section
    );
    if (sameSubjectConflict && (sameSubjectConflict.day_order ?? sameSubjectConflict.dayOrder) == editSlot.dayOrder && sameSubjectConflict.period == editSlot.period) {
      return null;
    }
    const subjectInSection = labSlots.find(s =>
      (s.subject_id === editSubject || s.subjectId === editSubject) &&
      s.section === editSlot.section &&
      !((s.day_order ?? s.dayOrder) == editSlot.dayOrder && s.period == editSlot.period)
    );
    if (subjectInSection) {
      const sub = subjects.find(s => s.id === editSubject);
      return `Subject already has a lab slot in ${editSlot.section} at Day ${subjectInSection.day_order ?? subjectInSection.dayOrder}, Period ${subjectInSection.period}. You can only have one lab slot per subject per section.`;
    }
    return null;
  };

  const validationWarning = editSlot && editSubject ? getValidationWarning() : null;

  const dayCount    = settings.dayOrdersCount || 6;
  const periodCount = settings.periodsPerDay  || 5;
  const sections    = ['1-A','1-B','2-A','2-B','3-A','3-B'];

  const sectionColors = {
    '1-A': 'var(--blue-light)',    '1-B': 'var(--purple-light)',
    '2-A': 'var(--cyan-light)',    '2-B': 'var(--indigo-light)',
    '3-A': 'var(--emerald-light)', '3-B': 'var(--green-light)',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1>Manual Lab Scheduler</h1>
          <p>Lock specific time slots for lab sessions — these will be preserved during auto-generation</p>
        </div>
        <button className="btn btn-secondary" onClick={loadAll} disabled={loading} aria-label="Refresh lab schedule">
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Banner */}
      {banner && (
        <div className={`banner ${banner.type}`} style={{ marginBottom: '16px' }}>
          {banner.type === 'success' ? <CheckCircle size={15} style={{ flexShrink: 0 }} /> : <AlertTriangle size={15} style={{ flexShrink: 0 }} />}
          <span style={{ flex: 1 }}>{banner.msg}</span>
          <button onClick={() => setBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Info banner */}
      <div className="banner info" style={{ marginBottom: '20px' }}>
        <Info size={15} style={{ flexShrink: 0 }} />
        <span>Click any grid cell to lock or modify a lab slot. Locked slots are protected during automatic timetable generation.</span>
      </div>

      {/* Stats row */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card indigo">
          <div className="stat-card-icon"><FlaskConical size={18} style={{ color: 'var(--indigo-light)' }} /></div>
          <div className="stat-card-value">{labSlots.length}</div>
          <div className="stat-card-label">Locked Lab Slots</div>
          <div className="stat-card-sub">Across all sections</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-icon"><FlaskConical size={18} style={{ color: 'var(--blue-light)' }} /></div>
          <div className="stat-card-value">{labSlots.filter(s => s.section === activeSection).length}</div>
          <div className="stat-card-label">Slots in §{activeSection}</div>
          <div className="stat-card-sub">Current section slots</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-icon"><FlaskConical size={18} style={{ color: 'var(--emerald-light)' }} /></div>
          <div className="stat-card-value">{subjects.filter(s => s.type === 'practical').length}</div>
          <div className="stat-card-label">Lab Subjects</div>
          <div className="stat-card-sub">Practical-type courses</div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Section:</span>
          <div className="section-tabs">
            {sections.map(sec => (
              <button
                key={sec}
                className={`section-tab ${activeSection === sec ? 'active' : ''}`}
                onClick={() => setActiveSection(sec)}
                style={activeSection === sec ? {
                  color: sectionColors[sec],
                  borderColor: sectionColors[sec],
                  background: `${sectionColors[sec]}15`
                } : {}}
              >
                {sec}
                {labSlots.filter(s => s.section === sec).length > 0 && (
                  <span className="badge" style={{ fontSize: '0.58rem', marginLeft: '3px', background: 'var(--indigo-bg)', color: 'var(--indigo-light)', borderColor: 'var(--indigo-border)', padding: '0px 4px' }}>
                    {labSlots.filter(s => s.section === sec).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FlaskConical size={15} style={{ color: 'var(--indigo-light)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-heading)' }}>Section {activeSection}</span>
          <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
            {labSlots.filter(s => s.section === activeSection).length} locked
          </span>
        </div>
        <div className="timetable-wrapper" style={{ padding: '16px' }}>
          <div className="lab-grid" style={{ gridTemplateColumns: `100px repeat(${dayCount}, 1fr)` }}>
            {/* Header */}
            <div className="lab-grid-cell header">Period</div>
            {Array.from({ length: dayCount }).map((_, i) => (
              <div key={i} className="lab-grid-cell header">Day {i + 1}</div>
            ))}

            {/* Period rows */}
            {Array.from({ length: periodCount }).map((_, pIdx) => {
              const p = pIdx + 1;
              return (
                <React.Fragment key={pIdx}>
                  {/* Period label */}
                  <div className="lab-grid-cell header" style={{ minHeight: '64px', flexDirection: 'column', gap: '2px' }}>
                    <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>P{p}</strong>
                    {settings.timings?.[p] && (
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-muted)' }}>
                        {settings.timings[p].split(' - ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Day cells */}
                  {Array.from({ length: dayCount }).map((_, dIdx) => {
                    const day = dIdx + 1;
                    const isLab = isLabSlot(activeSection, day, p);
                    const slotData = isLab ? getSlotData(activeSection, day, p) : null;
                    const slotSubjectId = slotData?.subject_id || slotData?.subjectId;
                    const slotStaffId   = slotData?.staff_id   || slotData?.staffId;
                    const subj = subjects.find(s => s.id === slotSubjectId);
                    const stf  = staff.find(s => s.id === slotStaffId);

                    return (
                      <div
                        key={dIdx}
                        className={`lab-grid-cell ${isLab ? 'is-lab' : ''}`}
                        onClick={() => openEdit(activeSection, day, p)}
                        title={isLab ? `${subj?.name || 'Lab'} — click to edit` : `Click to mark as lab slot (Day ${day}, P${p})`}
                      >
                        {isLab && slotSubjectId ? (
                          <>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--indigo-light)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {slotSubjectId}
                            </div>
                            {subj && (
                              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {subj.name}
                              </div>
                            )}
                            {stf && (
                              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{stf.name}</div>
                            )}
                            <button
                              className="btn btn-danger btn-icon"
                              style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, padding: '3px', borderRadius: 'var(--r-sm)', opacity: 0, transition: 'opacity var(--t-fast)' }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                              onClick={e => { e.stopPropagation(); removeSlot(activeSection, day, p); }}
                              title="Remove this lab slot"
                              aria-label="Remove lab slot"
                            >
                              <Trash size={10} />
                            </button>
                          </>
                        ) : isLab ? (
                          <div style={{ fontSize: '0.7rem', color: 'var(--indigo-light)', fontWeight: 600 }}>Lab ✓</div>
                        ) : (
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-disabled)', textAlign: 'center', width: '100%' }}>+ Lab</div>
                        )}
                        <div style={{ position: 'absolute', bottom: 3, right: 5, fontSize: '0.52rem', color: 'var(--text-disabled)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          P{p}
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Locked Slots Summary */}
      {labSlots.filter(s => s.section === activeSection).length > 0 && (
        <div className="glass-panel" style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '0.875rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FlaskConical size={14} style={{ color: 'var(--indigo-light)' }} />
            Locked Slots in §{activeSection}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {labSlots.filter(s => s.section === activeSection).map((s, i) => {
              const subId = s.subject_id || s.subjectId;
              const sub = subjects.find(sub => sub.id === subId);
              const day = s.day_order ?? s.dayOrder;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'var(--indigo-bg)', border: '1px solid var(--indigo-border)',
                  borderRadius: 'var(--r-md)', padding: '6px 10px'
                }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace' }}>
                    D{day} P{s.period}
                  </span>
                  {sub && <span style={{ fontSize: '0.78rem', color: 'var(--indigo-light)', fontWeight: 600 }}>{sub.name}</span>}
                  <button
                    className="btn btn-danger btn-icon"
                    style={{ width: 22, height: 22, padding: '3px', borderRadius: 'var(--r-sm)' }}
                    onClick={() => removeSlot(activeSection, day, s.period)}
                    title="Remove"
                    aria-label={`Remove lab slot Day ${day} Period ${s.period}`}
                  >
                    <Trash size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editSlot && (
        <div className="modal-overlay" onClick={() => setEditSlot(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                <FlaskConical size={15} style={{ color: 'var(--indigo-light)' }} />
                Assign Lab Slot — §{editSlot.section} · Day {editSlot.dayOrder} P{editSlot.period}
              </span>
              <button onClick={() => setEditSlot(null)} className="btn btn-ghost btn-icon" aria-label="Close">
                <X size={17} />
              </button>
            </div>

            {validationWarning && (
              <div className="banner warning" style={{ marginBottom: '12px' }}>
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.815rem' }}>{validationWarning}</span>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Lab Subject</label>
              <select
                className="input-field"
                value={editSubject}
                onChange={e => handleSubjectChange(e.target.value)}
              >
                <option value="">— Select Subject —</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.id} — {s.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Assigned Faculty</label>
              <select
                className="input-field"
                value={editStaff}
                onChange={e => setEditStaff(e.target.value)}
              >
                <option value="">— Select Staff (optional) —</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn-secondary" onClick={() => setEditSlot(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={saveSlot}
                disabled={!!validationWarning || !editSubject}
              >
                <Save size={14} /> Save Lab Slot
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
