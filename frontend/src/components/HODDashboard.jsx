import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../services/db';
import { generateTimetable, validateTimetable } from '../services/solver';
import { MAX_WEEKLY_PERIODS, validateSectionPeriods, getSectionsFromYear } from '../services/validation';
import ActiveUsersPanel from './ActiveUsersPanel';
import LabScheduler from './LabScheduler';
import ValidationReportModal from './ValidationReportModal';
import {
  Users, BookOpen, RefreshCw, CheckCircle, AlertTriangle,
  Trash, Plus, Edit, Mail, Save, Send, HelpCircle, Calendar,
  BarChart3, UserCheck, FlaskConical, ChevronRight, X,
  Layers, FileSpreadsheet, Megaphone, Activity, Search, Filter,
  Zap, Clock, TrendingUp
} from 'lucide-react';

export default function HODDashboard({ activePanel, triggerNotificationReload, onNavigateToCourses }) {
  // Validation Modal state
  const [validationErrors, setValidationErrors] = useState([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // Data states — UNCHANGED
  const [staff, setStaff] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [settings, setSettings] = useState({});
  const [timetable, setTimetable] = useState({ status: 'draft', tables: null });
  const [simLogs, setSimLogs] = useState([]);
  const [conflicts, setConflicts] = useState([]);

  const [activeSection, setActiveSection] = useState('1-A');
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (banner) { const t = setTimeout(() => setBanner(null), 5000); return () => clearTimeout(t); }
  }, [banner]);

  const showBanner = (type, message) => setBanner({ type, message });

  // Staff form — UNCHANGED
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPwd, setStaffPwd] = useState('');
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [staffError, setStaffError] = useState('');

  // Subject form — UNCHANGED
  const [subjId, setSubjId] = useState('');
  const [subjName, setSubjName] = useState('');
  const [subjType, setSubjType] = useState('theory');
  const [subjPeriods, setSubjPeriods] = useState(4);
  const [subjError, setSubjError] = useState('');
  const [emailStatus, setEmailStatus] = useState('');
  const [labSlots, setLabSlots] = useState([]);
  // ── selectedCourse: single source of truth for the Edit modal ──────────
  // Shape: { id, name, type, periods, year, error }
  // Always populated atomically from the clicked row's DB record.
  // Never shared across years — each click destroys previous state.
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Helper: open the edit modal for exactly one course by its primary key
  const openEditModal = (course) => {
    setSelectedCourse({
      id:      course.id,           // primary key — used for WHERE clause
      name:    course.name,
      type:    course.type || 'theory',
      periods: course.periods || 4,
      year:    course.year || 'First Year',  // locked; cannot change accidentally
      error:   ''
    });
  };

  const closeEditModal = () => setSelectedCourse(null);

  const [search1, setSearch1] = useState('');
  const [filter1, setFilter1] = useState('all');
  const [search2, setSearch2] = useState('');
  const [filter2, setFilter2] = useState('all');
  const [search3, setSearch3] = useState('');
  const [filter3, setFilter3] = useState('all');

  // Email form — UNCHANGED
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  // Cell editor — UNCHANGED
  const [editingCell, setEditingCell] = useState(null);

  // Load all data — UNCHANGED
  const loadData = useCallback(async (showFeedback = false) => {
    setLoading(true);
    const [s, sub, a, sett, t, logs, slots] = await Promise.all([
      db.getStaff(), db.getSubjects(), db.getAssignments(),
      db.getSettings(), db.getTimetable(), db.getSimLogs(),
      db.getLabSlots()
    ]);
    setStaff(s); setSubjects(sub); setAssignments(a);
    setSettings(sett); setTimetable(t); setSimLogs(logs); setLabSlots(slots);
    if (t.tables) { const c = validateTimetable(t.tables, s, sub, sett); setConflicts(c); }
    setLoading(false);
    if (showFeedback) showBanner('success', 'Data refreshed from database.');
  }, []);

  useEffect(() => { loadData(); }, [activePanel, loadData]);

  // Helpers — UNCHANGED
  const getTotalAllocated = (section) => {
    const year = section.startsWith('1') ? 'First Year' : section.startsWith('2') ? 'Second Year' : 'Third Year';
    return subjects.filter(s => s.year === year).reduce((sum, s) => sum + (s.periods || 0), 0);
  };

  const capacity = MAX_WEEKLY_PERIODS;
  const overA = getTotalAllocated('1-A') > capacity;
  const overB = getTotalAllocated('1-B') > capacity;
  const over2A = getTotalAllocated('2-A') > capacity;
  const over2B = getTotalAllocated('2-B') > capacity;
  const over3A = getTotalAllocated('3-A') > capacity;
  const over3B = getTotalAllocated('3-B') > capacity;
  const isOverCapacity = overA || overB || over2A || over2B || over3A || over3B;

  // Staff CRUD — UNCHANGED
  const handleAddStaff = async (e) => {
    e.preventDefault(); setStaffError('');
    if (!staffName || !staffEmail || !staffPwd) { setStaffError('All fields are required.'); return; }
    try {
      if (editingStaffId) {
        await db.updateStaff(editingStaffId, { name: staffName, email: staffEmail, password: staffPwd });
        showBanner('success', 'Staff record updated.');
      } else {
        const added = await db.addStaff({ name: staffName, email: staffEmail, password: staffPwd });
        showBanner('success', `Staff added with ID: ${added.id}`);
      }
      setStaffName(''); setStaffEmail(''); setStaffPwd(''); setEditingStaffId(null);
      loadData();
    } catch (err) { setStaffError(err.message); }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Delete this staff member? Their assignments will be removed.')) return;
    await db.deleteStaff(id); loadData();
  };

  // Subject CRUD — UNCHANGED
  const handleAddSubject = async (e, courseYear) => {
    e.preventDefault(); setSubjError('');
    if (!subjId || !subjName) { setSubjError('Code and Name are required.'); return; }
    const periodsVal = parseInt(subjPeriods);
    if (isNaN(periodsVal) || periodsVal <= 0 || Number(subjPeriods) % 1 !== 0) {
      setSubjError('Periods must be a positive whole number.'); return;
    }
    const yearVal = courseYear || 'First Year';
    const sections = getSectionsFromYear(yearVal);
    for (const sec of sections) {
      const current = getTotalAllocated(sec);
      const attempted = periodsVal;
      const total = current + attempted;
      if (total > MAX_WEEKLY_PERIODS) {
        setSubjError(
          `❌ Weekly Period Limit Exceeded\n\nSection: ${sec}\n\nMaximum Weekly Periods : ${MAX_WEEKLY_PERIODS}\n\nCurrently Assigned : ${current}\n\nAttempting to Add : ${attempted}\n\nNew Total : ${total}\n\nYou have exceeded the allocated weekly timetable capacity.\n\nPlease reduce periods from another course before adding this subject.`
        ); return;
      }
    }
    try {
      await db.addSubject({ id: subjId, name: subjName, type: subjType, periods: periodsVal, year: yearVal });
      setSubjId(''); setSubjName(''); setSubjPeriods(4);
      showBanner('success', `Subject ${subjId} added to ${yearVal}.`);
      loadData();
    } catch (err) { setSubjError(err.message); }
  };

  // ── Save handler for the Edit modal ─────────────────────────────────────
  // Always updates by selectedCourse.id (primary key).
  // Academic Year is locked to selectedCourse.year — cannot be changed.
  const handleSaveEditedSubjectSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCourse) return;

    // Clear previous error on re-submit
    setSelectedCourse(prev => ({ ...prev, error: '' }));

    const trimmedName = (selectedCourse.name || '').trim();
    if (!trimmedName) {
      setSelectedCourse(prev => ({ ...prev, error: 'Subject Name is required.' }));
      return;
    }

    const periodsVal = parseInt(selectedCourse.periods, 10);
    if (isNaN(periodsVal) || periodsVal <= 0 || Number(selectedCourse.periods) % 1 !== 0) {
      setSelectedCourse(prev => ({ ...prev, error: 'Periods must be a positive whole number.' }));
      return;
    }

    // Capacity validation using the locked academic year
    const sections = getSectionsFromYear(selectedCourse.year);
    // Find the original record from subjects to get the original period count
    const originalRecord = subjects.find(s => s.id === selectedCourse.id);
    const oldPeriods = originalRecord ? (originalRecord.periods || 0) : 0;

    for (const sec of sections) {
      const current = getTotalAllocated(sec);
      // If year is unchanged, subtract the old periods before adding new ones
      const total = current - oldPeriods + periodsVal;
      if (total > MAX_WEEKLY_PERIODS) {
        setSelectedCourse(prev => ({
          ...prev,
          error: `❌ Weekly Period Limit Exceeded\n\nSection: ${sec}\n\nMaximum Weekly Periods : ${MAX_WEEKLY_PERIODS}\n\nCurrently Assigned : ${current - oldPeriods}\n\nAttempting to Save : ${periodsVal}\n\nNew Total : ${total}\n\nYou have exceeded the allocated weekly timetable capacity.`
        }));
        return;
      }
    }

    try {
      // Update ONLY the record matching selectedCourse.id (primary key)
      await db.updateSubject(selectedCourse.id, {
        name:    trimmedName,
        type:    selectedCourse.type,
        periods: periodsVal,
        year:    selectedCourse.year   // academic year never changes in edit modal
      });
      setSelectedCourse(null);          // destroy state — prevent stale data
      showBanner('success', `✓ Course updated successfully — ${trimmedName} (${selectedCourse.id})`);
      loadData();
    } catch (err) {
      setSelectedCourse(prev => ({ ...prev, error: err.message }));
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all its assignments?')) return;
    await db.deleteSubject(id); loadData();
  };

  // Assignment — UNCHANGED
  const handleAssignment = async (section, subjectId, staffId) => {
    const updated = assignments.filter(a => !(a.section === section && a.subjectId === subjectId));
    if (staffId) updated.push({ section, subjectId, staffId });
    setAssignments(updated);
    await db.saveAssignments(updated);
  };

  // Settings — UNCHANGED
  const handlePeriodsToggle = async (count) => {
    const updated = { ...settings, periodsPerDay: count };
    setSettings(updated);
    await db.saveSettings(updated);
    if (timetable.tables) { setConflicts(validateTimetable(timetable.tables, staff, subjects, updated)); }
  };

  // Timetable — Pre-generation production-grade validation engine
  const handleGenerate = async () => {
    // 1. Run 100% pre-generation data validation across all 8 mandatory rules
    const valRes = await db.validateTimetableData(staff, subjects, assignments, settings);
    if (!valRes.canGenerate && valRes.errors && valRes.errors.length > 0) {
      setValidationErrors(valRes.errors);
      setShowValidationModal(true);
      return; // STOP! Do NOT execute scheduling algorithm if any validation fails
    }

    const labSlots = await db.getLabSlots();
    const res = generateTimetable(staff, subjects, assignments, settings, labSlots);
    if (res.success) {
      await db.saveTimetable(res.tables, 'draft');
      setTimetable({ status: 'draft', tables: res.tables });
      setConflicts(validateTimetable(res.tables, staff, subjects, settings));
      showBanner('success', 'All validation checks passed! Conflict-free timetable generated.');
    } else { showBanner('error', res.error); }
  };

  const handleSaveDraft = async () => {
    await db.saveTimetable(timetable.tables, 'draft');
    showBanner('success', 'Draft saved to database.');
  };

  const handlePublish = async () => {
    if (!timetable.tables) { showBanner('error', 'Generate a timetable first.'); return; }
    if (conflicts.some(c => c.type === 'faculty_overlap')) {
      if (!window.confirm('There are faculty overlaps. Publish anyway?')) return;
    }
    await db.publishTimetable(timetable.tables);
    setTimetable(prev => ({ ...prev, status: 'published' }));
    triggerNotificationReload();
    showBanner('success', 'Timetable published! Email notifications sent.');
    loadData();
  };

  // Cell editor — UNCHANGED
  const handleCellSubjectChange = async (subjectId) => {
    if (!editingCell || !timetable.tables) return;
    const { section, day, period } = editingCell;
    const updated = JSON.parse(JSON.stringify(timetable.tables));
    if (subjectId === 'FREE') {
      updated[section][day][period] = { subjectId: 'FREE', staffId: '', subjectName: 'Self Study', staffName: '-' };
    } else {
      const sub = subjects.find(s => s.id === subjectId);
      const asgn = assignments.find(a => a.section === section && a.subjectId === subjectId);
      const stf = staff.find(s => s.id === asgn?.staffId);
      updated[section][day][period] = {
        subjectId, staffId: stf?.id || '',
        subjectName: sub?.name || '', staffName: stf?.name || '-'
      };
    }
    setConflicts(validateTimetable(updated, staff, subjects, settings));
    setTimetable({ ...timetable, tables: updated });
    await db.saveTimetable(updated, timetable.status);
    setEditingCell(null);
  };

  // Email — UNCHANGED
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailRecipient || !emailSubject || !emailBody) { setEmailStatus('All fields required.'); return; }
    try {
      await db.sendStaffEmail(emailRecipient, emailSubject, emailBody);
      setEmailSubject(''); setEmailBody('');
      setEmailStatus('success');
      setTimeout(() => setEmailStatus(''), 3000);
      loadData();
    } catch (err) { setEmailStatus(err.message); }
  };

  const handleResendToAll = async (subject, body) => {
    try {
      await db.sendStaffEmail('all', subject, body);
      showBanner('success', `Alert broadcast resent to all registered staff.`);
      loadData();
    } catch (err) { showBanner('error', err.message); }
  };

  // ════════════════════════════════════════════════════════════════════════════
  // SHARED: Banner component & Validation Report Modal
  // ════════════════════════════════════════════════════════════════════════════
  const BannerEl = () => (
    <>
      {banner && (
        <div className={`banner ${banner.type}`}>
          <span style={{ flex: 1 }}>{banner.message}</span>
          <button
            onClick={() => setBanner(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center' }}
            aria-label="Dismiss"
          ><X size={15} /></button>
        </div>
      )}
      <ValidationReportModal
        isOpen={showValidationModal}
        errors={validationErrors}
        onClose={() => setShowValidationModal(false)}
        onGoToAssignments={onNavigateToCourses}
      />
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: DASHBOARD HOME
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'dashboard') {
    const pendingAssignmentsCount = (() => {
      const secs = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];
      let count = 0;
      subjects.forEach(sub => {
        const sYear = sub.year || 'First Year';
        const relevant = secs.filter(sec => {
          if (sYear === 'First Year') return sec.startsWith('1');
          if (sYear === 'Second Year') return sec.startsWith('2');
          if (sYear === 'Third Year') return sec.startsWith('3');
          return false;
        });
        if (!relevant.every(sec => assignments.some(a => a.section === sec && a.subjectId === sub.id))) count++;
      });
      return count;
    })();

    return (
      <div className="fade-in">
        <BannerEl />

        <div className="page-header">
          <div>
            <h1>HOD Dashboard</h1>
            <p>Timetable & Department Management — Sections 1-A, 1-B, 2-A, 2-B, 3-A & 3-B</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={() => loadData(true)} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </button>
            <button className="btn btn-primary" onClick={handleGenerate}>
              <Zap size={14} /> Generate Schedule
            </button>
          </div>
        </div>

        {/* Capacity warning */}
        {isOverCapacity && (
          <div className="banner warning">
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Capacity Warning:</strong> Max {capacity} periods/week.
              {overA && ` Section 1-A: ${getTotalAllocated('1-A')} periods.`}
              {overB && ` Section 1-B: ${getTotalAllocated('1-B')} periods.`}
              {over2A && ` Section 2-A: ${getTotalAllocated('2-A')} periods.`}
              {over2B && ` Section 2-B: ${getTotalAllocated('2-B')} periods.`}
              {over3A && ` Section 3-A: ${getTotalAllocated('3-A')} periods.`}
              {over3B && ` Section 3-B: ${getTotalAllocated('3-B')} periods.`}
              {' '}Please reduce subject hours.
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid-stats dashboard-grid">
          {[
            { label: 'Total Sections', value: 6, sub: '1-A, 1-B, 2-A, 2-B, 3-A, 3-B', icon: <Layers size={18} style={{ color: 'var(--blue-light)' }} />, color: 'blue' },
            { label: 'Faculty Count', value: staff.length, sub: 'Teaching staff on roster', icon: <Users size={18} style={{ color: 'var(--purple-light)' }} />, color: 'purple' },
            { label: 'Course Count', value: subjects.length, sub: `${subjects.filter(s => s.type === 'practical').length} lab subjects`, icon: <BookOpen size={18} style={{ color: 'var(--emerald-light)' }} />, color: 'emerald' },
            { label: 'Pending Assignments', value: pendingAssignmentsCount, sub: 'Courses missing teachers', icon: <FileSpreadsheet size={18} style={{ color: 'var(--rose-light)' }} />, color: 'rose' },
            { label: 'Timetables Generated', value: timetable.tables ? 6 : 0, sub: 'Scheduled class grids', icon: <Calendar size={18} style={{ color: 'var(--blue-light)' }} />, color: 'blue' },
            { label: 'Lab Schedules', value: labSlots.length, sub: 'Manually locked slots', icon: <FlaskConical size={18} style={{ color: 'var(--indigo-light)' }} />, color: 'indigo' },
            { label: 'Emails Sent', value: simLogs.filter(l => !l.is_broadcast).length, sub: 'Simulated direct logs', icon: <Mail size={18} style={{ color: 'var(--amber-light)' }} />, color: 'amber' },
            { label: 'Broadcast Emails', value: simLogs.filter(l => l.is_broadcast).length, sub: 'Department-wide alerts', icon: <Megaphone size={18} style={{ color: 'var(--purple-light)' }} />, color: 'purple' },
          ].map((card, i) => (
            <div key={i} className={`stat-card ${card.color}`}>
              <div className="stat-card-icon">{card.icon}</div>
              <div className="stat-card-value">{card.value}</div>
              <div className="stat-card-label">{card.label}</div>
              {card.sub && <div className="stat-card-sub">{card.sub}</div>}
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="glass-panel" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={16} style={{ color: 'var(--purple-light)' }} />
            Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { icon: <TrendingUp size={13} />, text: `Timetable status: ${timetable.tables ? (timetable.status === 'published' ? 'Published ✓' : 'Draft') : 'Not Generated'}`, time: 'Just Now' },
              { icon: <BookOpen size={13} />, text: `${subjects.length} courses loaded — ${subjects.filter(s => s.year === 'Third Year').length} Third Year courses`, time: 'Today' },
              { icon: <Users size={13} />, text: `${staff.length} registered faculty members active`, time: 'Today' },
              { icon: <Mail size={13} />, text: `${simLogs.length} simulated email alerts in total`, time: 'History' },
            ].map((act, i) => (
              <div key={i} className="activity-item">
                <div style={{ color: 'var(--blue-light)', flexShrink: 0, marginTop: '1px' }}>{act.icon}</div>
                <span style={{ flex: 1, color: 'var(--text-secondary)', fontSize: '0.845rem' }}>{act.text}</span>
                <span className="badge" style={{ fontSize: '0.65rem', flexShrink: 0 }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <div className="conflict-box">
            <h3>
              <AlertTriangle size={15} />
              {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Detected
            </h3>
            <ul>
              {conflicts.map((c, i) => <li key={i}>{c.message}</li>)}
            </ul>
          </div>
        )}

        {/* Timetable grid */}
        {timetable.tables ? (
          <div className="glass-panel">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px', marginBottom: '14px',
              flexWrap: 'wrap', gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} style={{ color: 'var(--blue-light)' }} />
                  Timetable Preview
                  {timetable.status === 'published'
                    ? <span className="badge badge-emerald" style={{ marginLeft: '4px' }}>● Published</span>
                    : <span className="badge badge-amber" style={{ marginLeft: '4px' }}>Draft</span>
                  }
                </h3>
                <div className="section-tabs">
                  {['1-A','1-B','2-A','2-B','3-A','3-B'].map(sec => (
                    <button
                      key={sec}
                      className={`section-tab ${activeSection === sec ? 'active' : ''}`}
                      onClick={() => setActiveSection(sec)}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-secondary btn-sm" onClick={handleSaveDraft}>
                  <Save size={13} /> Save Draft
                </button>
                <button className="btn btn-success btn-sm" onClick={handlePublish}>
                  <Send size={13} /> Publish
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              <HelpCircle size={12} />
              Click any cell to swap the subject assignment.
            </div>

            <div className="timetable-wrapper">
              <div className="timetable-grid" style={{ gridTemplateColumns: `110px repeat(${settings.dayOrdersCount || 6}, 1fr)` }}>
                <div className="timetable-cell header">Time</div>
                {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, i) => (
                  <div key={i} className="timetable-cell header">Day {i + 1}</div>
                ))}
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
                      <div className="timetable-cell header" style={{ flexDirection: 'column', gap: '2px', minHeight: '52px' }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>P{p}</strong>
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {settings.timings?.[p]?.split(' - ')[0]}
                        </span>
                      </div>
                      {Array.from({ length: settings.dayOrdersCount || 6 }).map((_, dIdx) => {
                        const day = dIdx + 1;
                        const cell = timetable.tables[activeSection]?.[day]?.[p];
                        const isLab = cell?.subjectName?.toLowerCase().includes('lab') || cell?.subjectId === 'CS103';
                        const isFree = cell?.subjectId === 'FREE';
                        const hasConflict = conflicts.some(c =>
                          (c.staffId && c.staffId === cell?.staffId && c.day === day && c.period === p) ||
                          (c.section === activeSection && c.subjectId === cell?.subjectId && c.type?.includes('allocation'))
                        );
                        return (
                          <div
                            key={dIdx}
                            className={`timetable-cell ${isLab ? 'lab' : ''} ${isFree ? 'free' : ''} ${hasConflict ? 'has-conflict' : ''}`}
                            onClick={() => setEditingCell({ section: activeSection, day, period: p })}
                            title={cell ? `${cell.subjectName} — ${cell.staffName}` : 'Click to assign'}
                          >
                            {!isFree && cell ? (
                              <>
                                <div className="cell-subject">{cell.subjectId}</div>
                                <div className="cell-name">{cell.subjectName}</div>
                                <div className="cell-teacher">{cell.staffName}</div>
                              </>
                            ) : (
                              <div className="cell-subject">{isFree ? 'Study' : '—'}</div>
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
          </div>
        ) : (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 24px' }}>
            <div className="empty-state">
              <Calendar size={64} className="empty-state-icon" />
              <h3>No Timetable Generated</h3>
              <p>Assign staff to all subjects, then click "Generate Schedule" to create an automatic, conflict-free timetable.</p>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} style={{ marginTop: '20px' }}>
              <Zap size={15} /> Run Auto-Scheduler
            </button>
          </div>
        )}

        {/* Cell edit modal */}
        {editingCell && (
          <div className="modal-overlay" onClick={() => setEditingCell(null)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">
                  <Edit size={15} style={{ color: 'var(--blue-light)' }} />
                  Edit Slot — {editingCell.section} · Day {editingCell.day}, P{editingCell.period}
                </span>
                <button onClick={() => setEditingCell(null)} className="btn btn-ghost btn-icon" aria-label="Close">
                  <X size={17} />
                </button>
              </div>
              <div className="input-group">
                <label className="input-label">Select Subject / Course</label>
                <select
                  className="input-field"
                  onChange={e => handleCellSubjectChange(e.target.value)}
                  defaultValue={timetable.tables[editingCell.section]?.[editingCell.day]?.[editingCell.period]?.subjectId || 'FREE'}
                >
                  <option value="FREE">Self Study / Free Period</option>
                  {subjects.map(s => {
                    const asgn = assignments.find(a => a.section === editingCell.section && a.subjectId === s.id);
                    const tch = staff.find(st => st.id === asgn?.staffId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.id} — {s.name} ({tch ? tch.name : 'No Teacher'})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-button-group justify-end" style={{ marginTop: '16px' }}>
                <button className="btn btn-secondary" onClick={() => setEditingCell(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: STAFF RECORDS
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'staff-list') {
    return (
      <div className="fade-in">
        <BannerEl />
        <div className="page-header">
          <div>
            <h1>Staff Records</h1>
            <p>Manage teaching staff profiles, credentials, and assignments</p>
          </div>
        </div>

        <div className="grid-2">
          {/* Add / Edit form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--r-md)',
                background: 'var(--purple-bg)', border: '1px solid var(--purple-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Users size={14} style={{ color: 'var(--purple-light)' }} />
              </div>
              {editingStaffId ? `Editing: ${editingStaffId}` : 'Add New Staff Member'}
            </h3>

            {staffError && (
              <div className="banner error" style={{ marginBottom: '12px' }}>
                <span>{staffError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input type="text" className="input-field" placeholder="e.g. Sangeetha Kumar"
                  value={staffName} onChange={e => setStaffName(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" className="input-field" placeholder="sangeetha@college.edu"
                  value={staffEmail} onChange={e => setStaffEmail(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min. 1 uppercase)</span></label>
                <input type="text" className="input-field" placeholder="e.g. Staff@123"
                  value={staffPwd} onChange={e => setStaffPwd(e.target.value)} />
              </div>
              <div className="form-button-group" style={{ marginTop: '4px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  <Plus size={15} /> {editingStaffId ? 'Save Changes' : 'Add Staff Member'}
                </button>
                {editingStaffId && (
                  <button type="button" className="btn btn-secondary"
                    onClick={() => { setEditingStaffId(null); setStaffName(''); setStaffEmail(''); setStaffPwd(''); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="stat-card purple">
              <div className="stat-card-icon">
                <Users size={20} style={{ color: 'var(--purple-light)' }} />
              </div>
              <div className="stat-card-value">{staff.length}</div>
              <div className="stat-card-label">Total Staff</div>
              <div className="stat-card-sub">Active on roster</div>
            </div>
            <div className="glass-panel" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                Staff IDs are auto-generated (STF001, STF002…). Passwords must contain at least one uppercase letter.
                Deleting a staff member removes all their course assignments.
              </p>
            </div>
          </div>
        </div>

        {/* Staff roster table */}
        <div className="glass-panel" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={15} style={{ color: 'var(--purple-light)' }} />
              Registered Staff
              <span className="badge badge-purple">{staff.length}</span>
            </h3>
          </div>
          <div className="table-container responsive-table-card">
            {staff.length === 0 ? (
              <div className="empty-state">
                <Users size={48} className="empty-state-icon" />
                <h3>No staff members yet</h3>
                <p>Add your first staff member using the form above.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Password</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(m => (
                    <tr key={m.id}>
                      <td data-label="Staff ID"><span className="badge badge-purple">{m.id}</span></td>
                      <td data-label="Name">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 'var(--r-full)',
                            background: 'linear-gradient(135deg, var(--purple), var(--indigo))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0
                          }}>
                            {m.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <strong style={{ fontSize: '0.875rem' }}>{m.name}</strong>
                        </div>
                      </td>
                      <td data-label="Email" style={{ color: 'var(--text-secondary)', fontSize: '0.845rem' }}>{m.email}</td>
                      <td data-label="Password">
                        <code style={{
                          fontSize: '0.78rem', background: 'var(--bg-elevated)',
                          padding: '3px 8px', borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--glass-border)', color: 'var(--text-secondary)',
                          fontFamily: 'JetBrains Mono, monospace'
                        }}>{m.password}</code>
                      </td>
                      <td data-label="Actions" style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-icon btn-sm"
                            title="Edit staff member"
                            onClick={() => { setEditingStaffId(m.id); setStaffName(m.name); setStaffEmail(m.email); setStaffPwd(m.password); setStaffError(''); }}
                          >
                            <Edit size={13} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon btn-sm"
                            title="Delete staff member"
                            onClick={() => handleDeleteStaff(m.id)}
                          >
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: COURSES & ASSIGNMENTS
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'subjects-list') {
    const sectionColors = {
      '1-A': 'var(--blue-light)', '1-B': 'var(--purple-light)',
      '2-A': 'var(--cyan-light)', '2-B': 'var(--indigo-light)',
      '3-A': 'var(--emerald-light)', '3-B': 'var(--green-light)'
    };

    const renderYearSection = (yearTitle, sectionsList, searchValue, setSearchValue, filterValue, setFilterValue, addFormYear) => {
      const isYearFull = sectionsList.some(sec => getTotalAllocated(sec) >= MAX_WEEKLY_PERIODS);
      const filteredSubjects = subjects.filter(s => {
        const subYear = s.year || 'First Year';
        if (subYear !== yearTitle) return false;
        const matchSearch = s.name.toLowerCase().includes(searchValue.toLowerCase()) || s.id.toLowerCase().includes(searchValue.toLowerCase());
        const matchFilter = filterValue === 'all' || s.type === filterValue;
        return matchSearch && matchFilter;
      });

      return (
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '14px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 10px', borderRadius: 'var(--r-full)',
                background: 'var(--emerald-bg)', color: 'var(--emerald-light)',
                border: '1px solid var(--emerald-border)', fontSize: '0.72rem', fontWeight: 700
              }}>{yearTitle}</span>
              Course Assignment
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {sectionsList.map(sec => {
                const allocated = getTotalAllocated(sec);
                const pct = Math.min(100, Math.round((allocated / MAX_WEEKLY_PERIODS) * 100));
                const isOver = allocated >= MAX_WEEKLY_PERIODS;
                return (
                  <div key={sec} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                    <span style={{ color: sectionColors[sec], fontWeight: 600 }}>§{sec}</span>
                    <div style={{ width: 50, height: 4, background: 'var(--bg-elevated)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 'var(--r-full)', width: `${pct}%`, background: isOver ? 'var(--rose)' : pct > 80 ? 'var(--amber)' : 'var(--emerald)', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ color: isOver ? 'var(--rose-light)' : 'var(--text-muted)' }}>{allocated}/{MAX_WEEKLY_PERIODS}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
            {/* Add course form */}
            <div style={{ background: 'var(--bg-hover)', padding: '16px', borderRadius: 'var(--r-lg)', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ fontSize: '0.875rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-heading)' }}>
                <Plus size={14} style={{ color: 'var(--emerald-light)' }} />
                Add Course to {yearTitle}
              </h4>
              {subjError && (
                <div className="banner error" style={{ marginBottom: '8px', padding: '8px 12px', whiteSpace: 'pre-line' }}>
                  <span style={{ fontSize: '0.78rem' }}>{subjError}</span>
                </div>
              )}
              <form onSubmit={(e) => handleAddSubject(e, addFormYear)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: '0.72rem' }}>Subject Code</label>
                    <input type="text" className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                      placeholder="e.g. CS108" onChange={e => setSubjId(e.target.value.toUpperCase())} disabled={isYearFull} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" style={{ fontSize: '0.72rem' }}>Periods/Week</label>
                    <input type="number" className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                      min="1" max="12" defaultValue="4" onChange={e => setSubjPeriods(e.target.value)} disabled={isYearFull} />
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: '8px' }}>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>Subject Name</label>
                  <input type="text" className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    placeholder="e.g. Data Structures" onChange={e => setSubjName(e.target.value)} disabled={isYearFull} />
                </div>
                <div className="input-group" style={{ marginBottom: '10px' }}>
                  <label className="input-label" style={{ fontSize: '0.72rem' }}>Type</label>
                  <select className="input-field" style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                    onChange={e => setSubjType(e.target.value)} disabled={isYearFull}>
                    <option value="theory">Theory</option>
                    <option value="practical">Practical / Lab</option>
                    <option value="language">Language</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }} disabled={isYearFull}>
                  <Plus size={13} /> Add Course
                </button>
                {isYearFull && (
                  <p style={{ fontSize: '0.72rem', marginTop: '8px', color: 'var(--rose-light)', textAlign: 'center', lineHeight: 1.4 }}>
                    Maximum weekly allocation reached. Delete or reduce a course first.
                  </p>
                )}
              </form>
            </div>

            {/* Capacity bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>
                Weekly Period Allocation
              </div>
              {sectionsList.map(sec => {
                const allocated = getTotalAllocated(sec);
                const pct = Math.min(100, Math.round((allocated / MAX_WEEKLY_PERIODS) * 100));
                const isOver = allocated >= MAX_WEEKLY_PERIODS;
                const barColor = isOver ? 'var(--rose)' : allocated >= 25 ? 'var(--amber)' : 'var(--emerald)';
                const badgeCls = isOver ? 'badge-rose' : allocated >= 25 ? 'badge-amber' : 'badge-emerald';
                return (
                  <div key={sec} style={{ background: 'var(--bg-hover)', padding: '10px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: sectionColors[sec] }}>Section {sec}</span>
                      <span className={`badge ${badgeCls}`} style={{ fontSize: '0.65rem' }}>{allocated} / {MAX_WEEKLY_PERIODS} Periods</span>
                    </div>
                    <div className="progress-bar-wrap">
                      <div className="progress-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {isOver ? '⚠ Maximum capacity reached' : `${MAX_WEEKLY_PERIODS - allocated} slots remaining`}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
              <input type="text" className="input-field" style={{ paddingLeft: '32px', fontSize: '0.845rem' }}
                placeholder="Search courses by code or name..."
                value={searchValue} onChange={e => setSearchValue(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: 160, fontSize: '0.845rem' }}
              value={filterValue} onChange={e => setFilterValue(e.target.value)}>
              <option value="all">All Types</option>
              <option value="theory">Theory</option>
              <option value="practical">Practical / Lab</option>
              <option value="language">Language</option>
            </select>
          </div>

          {/* Assignments grid */}
          <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '8px 20px', background: 'var(--bg-elevated)', borderBottom: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>Course Details</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: sectionColors[sectionsList[0]] }}>§{sectionsList[0]} Teacher</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: sectionColors[sectionsList[1]] }}>§{sectionsList[1]} Teacher</span>
            </div>
            {filteredSubjects.map(s => {
              const aA = assignments.find(a => a.section === sectionsList[0] && a.subjectId === s.id);
              const aB = assignments.find(a => a.section === sectionsList[1] && a.subjectId === s.id);
              const typeColor = s.type === 'practical' ? 'badge-emerald' : s.type === 'language' ? 'badge-amber' : 'badge-blue';
              const isBeingEdited = selectedCourse && selectedCourse.id === s.id;
              return (
                <div key={s.id} className="course-assignment-row"
                  style={isBeingEdited ? { background: 'var(--blue-bg)', borderLeft: '3px solid var(--blue)' } : {}}>
                  <div className="course-info">
                    <div className="course-name">{s.name}</div>
                    <div className="course-meta">
                      <span className={`badge ${typeColor}`} style={{ fontSize: '0.62rem' }}>{s.type}</span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.62rem', fontFamily: 'JetBrains Mono, monospace' }}>{s.id}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{s.periods} periods/wk</span>
                    </div>
                  </div>
                  <div>
                    <select className="input-field" style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                      value={aA?.staffId || ''}
                      onChange={e => handleAssignment(sectionsList[0], s.id, e.target.value)}>
                      <option value="">— Unassigned —</option>
                      {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select className="input-field" style={{ fontSize: '0.82rem', padding: '7px 10px', flex: 1 }}
                      value={aB?.staffId || ''}
                      onChange={e => handleAssignment(sectionsList[1], s.id, e.target.value)}>
                      <option value="">— Unassigned —</option>
                      {staff.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                    </select>
                    <button
                      className="btn btn-secondary btn-icon btn-sm"
                      title={`Edit ${s.name} (${s.id})`}
                      aria-label={`Edit course ${s.name}`}
                      onClick={() => openEditModal(s)}
                    >
                      <Edit size={12} />
                    </button>
                    <button className="btn btn-danger btn-icon btn-sm" title="Delete course" onClick={() => handleDeleteSubject(s.id)}>
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredSubjects.length === 0 && (
              <div className="empty-state" style={{ padding: '32px 24px' }}>
                <BookOpen size={36} className="empty-state-icon" />
                <p style={{ fontSize: '0.845rem' }}>No courses found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="fade-in">
        <BannerEl />
        <div className="page-header">
          <div>
            <h1>Courses & Assignments</h1>
            <p>Configure curriculum structures, weekly hours, and assignments across all active sections</p>
          </div>
        </div>

        {renderYearSection('First Year',  ['1-A','1-B'], search1, setSearch1, filter1, setFilter1, 'First Year')}
        {renderYearSection('Second Year', ['2-A','2-B'], search2, setSearch2, filter2, setFilter2, 'Second Year')}
        {renderYearSection('Third Year',  ['3-A','3-B'], search3, setSearch3, filter3, setFilter3, 'Third Year')}

        {/* ── Edit Course Modal ─────────────────────────────────────────────
             Bound exclusively to selectedCourse (single source of truth).
             Opened by openEditModal(course) — destroyed on close/save.
             Primary key (selectedCourse.id) is used for the DB UPDATE.
             Academic Year is READ-ONLY to prevent cross-year corruption.
        ──────────────────────────────────────────────────────────────────── */}
        {selectedCourse && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>

              {/* Dynamic title: shows course name + code of the selected row */}
              <div className="modal-header">
                <div className="modal-title">
                  <Edit size={15} style={{ color: 'var(--emerald-light)' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Edit Course</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {selectedCourse.name}
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', marginLeft: '6px', color: 'var(--indigo-light)' }}>
                        {selectedCourse.id}
                      </span>
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="btn btn-ghost btn-icon"
                  aria-label="Close edit modal"
                >
                  <X size={17} />
                </button>
              </div>

              {/* Validation error — bound to selectedCourse.error only */}
              {selectedCourse.error && (
                <div className="banner error" style={{ marginBottom: '12px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem' }}>{selectedCourse.error}</span>
                </div>
              )}

              <form onSubmit={handleSaveEditedSubjectSubmit}>
                {/* Subject Code — primary key, always read-only */}
                <div className="input-group">
                  <label className="input-label">
                    Subject Code
                    <span style={{ marginLeft: 6, fontSize: '0.66rem', color: 'var(--text-muted)', fontWeight: 400 }}>(read-only)</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={selectedCourse.id}
                    disabled
                    style={{ fontFamily: 'JetBrains Mono, monospace', opacity: 0.6 }}
                  />
                </div>

                {/* Subject Name — editable, bound to selectedCourse.name */}
                <div className="input-group">
                  <label className="input-label">Subject Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={selectedCourse.name}
                    autoFocus
                    onChange={e => setSelectedCourse(prev => ({ ...prev, name: e.target.value, error: '' }))}
                    placeholder="e.g. Data Structures"
                  />
                </div>

                <div className="grid-2" style={{ gap: '8px' }}>
                  {/* Periods — editable, bound to selectedCourse.periods */}
                  <div className="input-group">
                    <label className="input-label">Periods per Week</label>
                    <input
                      type="number"
                      className="input-field"
                      min="1"
                      max="12"
                      value={selectedCourse.periods}
                      onChange={e => setSelectedCourse(prev => ({ ...prev, periods: e.target.value, error: '' }))}
                    />
                  </div>

                  {/* Type — editable, bound to selectedCourse.type */}
                  <div className="input-group">
                    <label className="input-label">Type</label>
                    <select
                      className="input-field"
                      value={selectedCourse.type}
                      onChange={e => setSelectedCourse(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="theory">Theory</option>
                      <option value="practical">Practical / Lab</option>
                      <option value="language">Language</option>
                    </select>
                  </div>
                </div>

                {/* Academic Year — LOCKED (read-only) to prevent cross-year mutation */}
                <div className="input-group">
                  <label className="input-label">
                    Academic Year
                    <span style={{ marginLeft: 6, fontSize: '0.66rem', color: 'var(--amber-light)', fontWeight: 600 }}>🔒 locked</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={selectedCourse.year}
                    disabled
                    style={{ opacity: 0.6 }}
                  />
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Academic year cannot be changed after creation. Delete and re-create if needed.
                  </span>
                </div>

                <div className="form-button-group justify-end" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: LAB SCHEDULER
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'lab-scheduler') return <LabScheduler />;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: ACTIVE USERS
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'active-users') return <ActiveUsersPanel />;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: EMAIL LOGS
  // ════════════════════════════════════════════════════════════════════════════
  if (activePanel === 'email-logs') {
    return (
      <div className="fade-in">
        <BannerEl />
        <div className="page-header">
          <div>
            <h1>Email Logs</h1>
            <p>Compose alerts and view sent email simulations</p>
          </div>
        </div>

        <div className="grid-2">
          {/* Compose form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1rem', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--r-md)', background: 'var(--cyan-bg)', border: '1px solid var(--cyan-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={14} style={{ color: 'var(--cyan-light)' }} />
              </div>
              Compose Alert
            </h3>

            {emailStatus === 'success' && (
              <div className="banner success" style={{ marginBottom: '12px' }}>
                <span>✅ Email sent successfully!</span>
              </div>
            )}
            {emailStatus && emailStatus !== 'success' && (
              <div className="banner error" style={{ marginBottom: '12px' }}>
                <span>{emailStatus}</span>
              </div>
            )}

            <form onSubmit={handleSendEmail}>
              <div className="input-group">
                <label className="input-label">Recipient Staff Member</label>
                <select className="input-field" value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)}>
                  <option value="">— Choose Recipient —</option>
                  <option value="all">📢 All Registered Staff (Broadcast)</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Email Subject</label>
                <input type="text" className="input-field" placeholder="e.g. Schedule Change Notice"
                  value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">Message Body</label>
                <textarea className="input-field" rows={5} placeholder="Type your message..."
                  value={emailBody} onChange={e => setEmailBody(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                <Send size={15} /> Send Email / Broadcast
              </button>
            </form>
          </div>

          {/* Info panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="stat-card cyan">
              <div className="stat-card-icon">
                <Mail size={20} style={{ color: 'var(--cyan-light)' }} />
              </div>
              <div className="stat-card-value">{simLogs.length}</div>
              <div className="stat-card-label">Total Logs</div>
              <div className="stat-card-sub">Simulation audit trails</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-card-icon">
                <Megaphone size={20} style={{ color: 'var(--purple-light)' }} />
              </div>
              <div className="stat-card-value">{simLogs.filter(l => l.is_broadcast).length}</div>
              <div className="stat-card-label">Broadcasts</div>
              <div className="stat-card-sub">Department-wide alerts</div>
            </div>
            <div className="glass-panel" style={{ padding: '14px 16px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                This module simulates email sending. Broadcast alerts are logged as summaries and also trigger notifications for all registered faculty members.
              </p>
            </div>
          </div>
        </div>

        {/* Logs table */}
        <div className="glass-panel" style={{ marginTop: '20px', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={15} style={{ color: 'var(--cyan-light)' }} />
              Sent Messages
              <span className="badge badge-cyan">{simLogs.length}</span>
            </h3>
            {simLogs.length > 0 && (
              <button className="btn btn-secondary btn-sm"
                onClick={async () => { await db.clearSimLogs(); loadData(); }}>
                Clear All
              </button>
            )}
          </div>
          <div className="table-container">
            {simLogs.length === 0 ? (
              <div className="empty-state">
                <Mail size={48} className="empty-state-icon" />
                <h3>No emails sent yet</h3>
                <p>Compose and send an alert to see it appear here.</p>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Sender</th>
                    <th>Recipient</th>
                    <th>Subject</th>
                    <th>Preview</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {simLogs.map(log => {
                    const isBroadcast = log.is_broadcast === 1 || log.isBroadcast || log.recipient_email === 'all@college.edu' || log.recipient_email === 'all';
                    return (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {new Date(log.sent_at || log.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.845rem' }}>{log.sender || 'HOD Admin'}</td>
                        <td>
                          {isBroadcast ? (
                            <div>
                              <div style={{ fontSize: '0.845rem', fontWeight: 600, color: 'var(--purple-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Megaphone size={12} /> All Staff
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Broadcast to {log.recipient_count || staff.length} recipients
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '0.845rem', fontWeight: 600 }}>{log.recipient_name || log.recipientName}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{log.recipient_email || log.recipient}</div>
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: 600, fontSize: '0.845rem' }}>{log.subject}</td>
                        <td style={{ fontSize: '0.815rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.body}>
                          {log.body}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleResendToAll(log.subject, log.body)}>
                            <Send size={12} /> Send to All
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
