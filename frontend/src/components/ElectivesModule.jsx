import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import {
  Layers, Plus, Edit, Trash2, CheckCircle, AlertTriangle, Search, Filter,
  Users, BookOpen, Clock, Calendar, CheckSquare, Square, RefreshCw, FileText,
  ChevronDown, ChevronRight, ToggleLeft, ToggleRight, Sparkles, UserCheck, ShieldAlert
} from 'lucide-react';

export default function ElectivesModule({ staff = [], subjects = [], settings = {}, onTimetableRefresh }) {
  const [electives, setElectives] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterSem, setFilterSem] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sub-tabs in Electives Module
  const [activeSubTab, setActiveSubTab] = useState('management'); // 'management', 'slots', 'distribution', 'reports'

  // Modal / Form states for Elective creation & edit
  const [showElectiveModal, setShowElectiveModal] = useState(false);
  const [editingElective, setEditingElective] = useState(null);
  const [elecName, setElecName] = useState('Elective-I');
  const [elecDept, setElecDept] = useState('Computer Science');
  const [elecSem, setElecSem] = useState(5);
  const [elecClass, setElecClass] = useState('3-A');
  const [elecYear, setElecYear] = useState('Third Year');
  const [elecSections, setElecSections] = useState(['3-A', '3-B']);

  // Modal / Form states for Elective Course addition & edit
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedElectiveForCourse, setSelectedElectiveForCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseSubjId, setCourseSubjId] = useState('');
  const [courseSubjName, setCourseSubjName] = useState('');
  const [courseFacultyId, setCourseFacultyId] = useState('');
  const [courseHours, setCourseHours] = useState(4);
  const [courseCapacity, setCourseCapacity] = useState(70);
  const [courseStudents, setCourseStudents] = useState(60);

  // Student Distribution Modal state
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [distributeElective, setDistributeElective] = useState(null);
  const [distributeMode, setDistributeMode] = useState('auto'); // 'auto' or 'manual'
  const [classStrength, setClassStrength] = useState(120);
  const [manualCounts, setManualCounts] = useState({});

  // Slot Configuration state
  const [slotSem, setSlotSem] = useState(5);
  const [slotClass, setSlotClass] = useState('3-A');
  const [selectedSlotKeys, setSelectedSlotKeys] = useState(new Set()); // `${day}_${period}`

  // Report view state
  const [reportType, setReportType] = useState('summary');
  const [reportData, setReportData] = useState(null);

  const dayCount = settings.dayOrdersCount || 6;
  const periodCount = settings.periodsPerDay || 5;

  const showBannerMessage = (type, message) => {
    setBanner({ type, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    const [elecList, slotList] = await Promise.all([
      db.getElectives(),
      db.getElectiveSlots()
    ]);
    setElectives(elecList);
    setSlots(slotList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update selected slot keys when slotSem or slotClass changes
  useEffect(() => {
    const classSlots = slots.filter(s => s.semester === Number(slotSem) && (s.class === slotClass || (Number(slotSem) === 3 && ['2-A', '2-B'].includes(s.class)) || (Number(slotSem) === 5 && ['3-A', '3-B'].includes(s.class))));
    const keys = new Set(classSlots.map(s => `${s.day}_${s.period}`));
    setSelectedSlotKeys(keys);
  }, [slotSem, slotClass, slots]);

  // Load report data when report subtab is opened
  useEffect(() => {
    if (activeSubTab === 'reports') {
      db.getElectiveReports().then(data => setReportData(data));
    }
  }, [activeSubTab]);

  // Handlers for Elective CRUD
  const handleOpenElectiveModal = (elec = null) => {
    if (elec) {
      setEditingElective(elec);
      setElecName(elec.name);
      setElecDept(elec.department || 'Computer Science');
      setElecSem(elec.semester || 5);
      setElecClass(elec.class || '3-A');
      setElecYear(elec.academic_year || 'Third Year');
      setElecSections(elec.sections || (elec.semester === 3 ? ['2-A', '2-B'] : ['3-A', '3-B']));
    } else {
      setEditingElective(null);
      setElecName('Elective-I');
      setElecDept('Computer Science');
      setElecSem(5);
      setElecClass('3-A');
      setElecYear('Third Year');
      setElecSections(['3-A', '3-B']);
    }
    setShowElectiveModal(true);
  };

  const handleSaveElective = async (e) => {
    e.preventDefault();
    try {
      if (editingElective) {
        await db.updateElective(editingElective.id, {
          name: elecName,
          department: elecDept,
          semester: Number(elecSem),
          class: elecClass,
          academic_year: elecYear,
          sections: elecSections,
          enabled: editingElective.enabled
        });
        showBannerMessage('success', `Elective "${elecName}" updated successfully.`);
      } else {
        await db.addElective({
          name: elecName,
          department: elecDept,
          semester: Number(elecSem),
          class: elecClass,
          academic_year: elecYear,
          sections: elecSections,
          enabled: true
        });
        showBannerMessage('success', `New Elective "${elecName}" created successfully.`);
      }
      setShowElectiveModal(false);
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  const handleDeleteElective = async (id) => {
    if (!window.confirm('Are you sure you want to delete this elective module?')) return;
    try {
      await db.deleteElective(id);
      showBannerMessage('success', 'Elective module deleted.');
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  const handleToggleElective = async (elec) => {
    try {
      await db.toggleElective(elec.id, !elec.enabled);
      showBannerMessage('info', `Elective "${elec.name}" ${!elec.enabled ? 'Enabled' : 'Disabled'}.`);
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  // Handlers for Course CRUD inside Elective
  const handleOpenCourseModal = (elec, course = null) => {
    setSelectedElectiveForCourse(elec);
    if (course) {
      setEditingCourse(course);
      setCourseSubjId(course.subject_id);
      setCourseSubjName(course.subject_name || course.subject_id);
      setCourseFacultyId(course.faculty_id || '');
      setCourseHours(course.weekly_hours || 4);
      setCourseCapacity(course.capacity || 35);
      setCourseStudents(course.student_count || 30);
    } else {
      setEditingCourse(null);
      setCourseSubjId('');
      setCourseSubjName('');
      setCourseFacultyId('');
      setCourseHours(4);
      setCourseCapacity(35);
      setCourseStudents(30);
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    if (!courseSubjId) {
      alert('Please select or enter a Subject Code.');
      return;
    }
    try {
      if (editingCourse) {
        await db.updateElectiveCourse(editingCourse.id, {
          subject_id: courseSubjId,
          subject_name: courseSubjName || courseSubjId,
          faculty_id: courseFacultyId,
          weekly_hours: Number(courseHours),
          capacity: Number(courseCapacity),
          student_count: Number(courseStudents)
        });
        showBannerMessage('success', 'Elective course updated.');
      } else {
        await db.addElectiveCourse(selectedElectiveForCourse.id, {
          subject_id: courseSubjId,
          subject_name: courseSubjName || courseSubjId,
          faculty_id: courseFacultyId,
          weekly_hours: Number(courseHours),
          capacity: Number(courseCapacity),
          student_count: Number(courseStudents)
        });
        showBannerMessage('success', 'Elective course added to module.');
      }
      setShowCourseModal(false);
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Delete this elective subject?')) return;
    try {
      await db.deleteElectiveCourse(courseId);
      showBannerMessage('success', 'Elective subject removed.');
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  // Student Distribution Handlers
  const handleOpenDistributeModal = (elec) => {
    setDistributeElective(elec);
    setDistributeMode('auto');
    const total = elec.courses?.reduce((sum, c) => sum + (c.student_count || 0), 0) || 60;
    setClassStrength(total || 60);

    const initialCounts = {};
    (elec.courses || []).forEach(c => {
      initialCounts[c.id] = c.student_count || 30;
    });
    setManualCounts(initialCounts);
    setShowDistributeModal(true);
  };

  const handleSaveDistribution = async () => {
    if (!distributeElective) return;
    try {
      if (distributeMode === 'auto') {
        await db.distributeStudents(distributeElective.id, 'auto', [], classStrength);
        showBannerMessage('success', `Distributed ${classStrength} students automatically across courses.`);
      } else {
        const distributions = Object.entries(manualCounts).map(([courseId, count]) => ({
          courseId: Number(courseId),
          studentCount: Number(count)
        }));
        await db.distributeStudents(distributeElective.id, 'manual', distributions, classStrength);
        showBannerMessage('success', 'Manual student distribution saved.');
      }
      setShowDistributeModal(false);
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  // Slot Configuration Handlers
  const toggleSlotSelection = (day, period) => {
    const key = `${day}_${period}`;
    const next = new Set(selectedSlotKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelectedSlotKeys(next);
  };

  const handleSaveSlots = async () => {
    try {
      const slotList = Array.from(selectedSlotKeys).map(k => {
        const [day, period] = k.split('_');
        return { day: Number(day), period: Number(period) };
      });
      await db.saveElectiveSlots(slotSem, slotClass, slotList);
      showBannerMessage('success', `Saved ${slotList.length} elective slots for Sem ${slotSem} - Class ${slotClass}.`);
      await loadData();
    } catch (err) {
      showBannerMessage('error', err.message);
    }
  };

  // Validation Checks & Report Calculation
  const getElectiveValidationErrors = () => {
    const errs = [];
    electives.filter(e => e.enabled).forEach(elec => {
      const courses = elec.courses || [];
      const elecSlots = slots.filter(s => s.semester === elec.semester && s.class === elec.class);
      const reqHours = courses[0]?.weekly_hours || 4;

      if (courses.length === 0) {
        errs.push({ elective: elec.name, type: 'No Courses', message: `No elective subjects added.` });
      }

      courses.forEach(c => {
        if (!c.faculty_id) {
          errs.push({ elective: elec.name, subject: c.subject_name || c.subject_id, type: 'Faculty Missing', message: `Faculty not assigned for ${c.subject_name || c.subject_id}.` });
        }
        if (!c.weekly_hours || c.weekly_hours <= 0) {
          errs.push({ elective: elec.name, subject: c.subject_name || c.subject_id, type: 'Hours Missing', message: `Weekly hours missing for ${c.subject_name || c.subject_id}.` });
        }
        if ((c.student_count || 0) > (c.capacity || 35)) {
          errs.push({ elective: elec.name, subject: c.subject_name || c.subject_id, type: 'Capacity Exceeded', message: `Student count (${c.student_count}) exceeds max capacity (${c.capacity}).` });
        }
      });

      const totalStudents = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);
      if (totalStudents === 0) {
        errs.push({ elective: elec.name, type: 'Students Missing', message: `Student groups incomplete.` });
      }

      if (elecSlots.length === 0) {
        errs.push({ elective: elec.name, type: 'Slots Missing', message: `Elective slots not configured for Class ${elec.class} (Sem ${elec.semester}).` });
      } else if (elecSlots.length < reqHours) {
        errs.push({ elective: elec.name, type: 'Insufficient Slots', message: `Requires ${reqHours} slots, but only ${elecSlots.length} configured.` });
      }
    });
    return errs;
  };

  const validationErrors = getElectiveValidationErrors();

  // Filtered electives list
  const filteredElectives = electives.filter(e => {
    if (searchTerm && !e.name.toLowerCase().includes(searchTerm.toLowerCase()) && !e.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (filterDept !== 'all' && e.department !== filterDept) return false;
    if (filterSem !== 'all' && e.semester !== Number(filterSem)) return false;
    if (filterClass !== 'all' && e.class !== filterClass) return false;
    if (filterStatus !== 'all' && ((filterStatus === 'enabled' && !e.enabled) || (filterStatus === 'disabled' && e.enabled))) return false;
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* ── Banner Message ────────────────────────────────────────────────── */}
      {banner && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: banner.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : banner.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          border: `1px solid ${banner.type === 'error' ? 'var(--red)' : banner.type === 'success' ? 'var(--emerald)' : 'var(--blue)'}`,
          color: 'white'
        }}>
          {banner.type === 'error' ? <AlertTriangle size={18} style={{ color: 'var(--red-light)' }} /> : <CheckCircle size={18} style={{ color: 'var(--emerald-light)' }} />}
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{banner.message}</span>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers style={{ color: 'var(--purple-light)' }} size={28} />
            Elective Course Scheduling
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Manage parallel elective subjects, student groups, and simultaneous period allocations for classes.
          </p>
        </div>

        <button
          onClick={() => handleOpenElectiveModal()}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} />
          Create New Elective
        </button>
      </div>

      {/* ── Navigation Sub-tabs ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveSubTab('management')}
          className={`btn ${activeSubTab === 'management' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <BookOpen size={16} />
          Elective Modules & Subjects
        </button>
        <button
          onClick={() => setActiveSubTab('slots')}
          className={`btn ${activeSubTab === 'slots' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <Clock size={16} />
          Elective Slots Config
        </button>
        <button
          onClick={() => setActiveSubTab('validation')}
          className={`btn ${activeSubTab === 'validation' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem', position: 'relative' }}
        >
          <ShieldAlert size={16} />
          Conflict & Validation Report
          {validationErrors.length > 0 && (
            <span style={{
              marginLeft: '0.4rem',
              padding: '0.15rem 0.45rem',
              borderRadius: '999px',
              background: 'var(--red)',
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              {validationErrors.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`btn ${activeSubTab === 'reports' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <FileText size={16} />
          Elective Reports
        </button>
      </div>

      {/* ── SUB-TAB 1: MANAGEMENT ────────────────────────────────────────── */}
      {activeSubTab === 'management' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          
          {/* Search & Filter Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search electives or departments..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.3rem',
                  paddingRight: '1rem',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--glass-border)',
                  color: 'white',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                value={filterSem}
                onChange={e => setFilterSem(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="all">All Semesters</option>
                <option value="1">Semester 1</option>
                <option value="3">Semester 3</option>
                <option value="5">Semester 5</option>
              </select>

              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="all">All Classes</option>
                <option value="1-A">Class 1-A</option>
                <option value="1-B">Class 1-B</option>
                <option value="2-A">Class 2-A</option>
                <option value="2-B">Class 2-B</option>
                <option value="3-A">Class 3-A</option>
                <option value="3-B">Class 3-B</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Electives Cards List */}
          {filteredElectives.length === 0 ? (
            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Layers size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <h3>No Elective Modules Found</h3>
              <p style={{ fontSize: '0.85rem', marginTop: '0.4rem' }}>
                Click "Create New Elective" above to add your first elective group.
              </p>
            </div>
          ) : (
            filteredElectives.map(elec => {
              const elecSlots = slots.filter(s => s.semester === elec.semester && s.class === elec.class);
              const courses = elec.courses || [];
              const totalEnrolled = courses.reduce((sum, c) => sum + (c.student_count || 0), 0);

              return (
                <div key={elec.id} className="glass-panel" style={{ padding: '1.5rem', borderLeft: `4px solid ${elec.enabled ? 'var(--emerald)' : 'var(--text-muted)'}` }}>
                  
                  {/* Elective Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ color: 'white', fontSize: '1.2rem', margin: 0 }}>{elec.name}</h3>
                        <span className={`badge ${elec.enabled ? 'badge-emerald' : 'badge-gray'}`}>
                          {elec.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span>Department: <strong style={{ color: 'white' }}>{elec.department}</strong></span>
                        <span>Semester: <strong style={{ color: 'var(--accent-indigo)' }}>{elec.semester}</strong></span>
                        <span>Sections: <strong style={{ color: 'var(--purple-light)' }}>{elec.sections?.join(', ') || elec.class}</strong></span>
                        <span>Academic Year: <strong style={{ color: 'white' }}>{elec.academic_year}</strong></span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => handleToggleElective(elec)}
                        className={`btn ${elec.enabled ? 'btn-ghost' : 'btn-primary'}`}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        {elec.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleOpenDistributeModal(elec)}
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', color: 'var(--cyan-light)' }}
                        title="Student Distribution"
                      >
                        <Users size={14} />
                        Distribute
                      </button>
                      <button
                        onClick={() => handleOpenElectiveModal(elec)}
                        className="btn btn-ghost"
                        style={{ padding: '0.3rem 0.5rem' }}
                        title="Edit Elective Module"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteElective(elec.id)}
                        className="btn btn-ghost"
                        style={{ padding: '0.3rem 0.5rem', color: 'var(--red)' }}
                        title="Delete Elective Module"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Elective Summary Info Badges */}
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Subjects Offered: </span>
                      <strong style={{ color: 'white' }}>{courses.length} Parallel Subjects</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Total Students: </span>
                      <strong style={{ color: 'var(--emerald-light)' }}>{totalEnrolled} Students</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Configured Slots: </span>
                      <strong style={{ color: elecSlots.length >= (courses[0]?.weekly_hours || 4) ? 'var(--blue-light)' : 'var(--orange)' }}>
                        {elecSlots.length} / {courses[0]?.weekly_hours || 4} Hours Configured
                      </strong>
                    </div>
                  </div>

                  {/* Elective Courses Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                    <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>Subject / Course</th>
                          <th>Assigned Faculty</th>
                          <th style={{ textAlign: 'center' }}>Weekly Hours</th>
                          <th style={{ textAlign: 'center' }}>Student Group</th>
                          <th style={{ textAlign: 'center' }}>Capacity</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                              No subjects added to this elective module yet.
                            </td>
                          </tr>
                        ) : (
                          courses.map(course => (
                            <tr key={course.id}>
                              <td>
                                <div style={{ fontWeight: 600, color: 'white' }}>{course.subject_name || course.subject_id}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Code: {course.subject_id}</div>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <UserCheck size={14} style={{ color: course.faculty_id ? 'var(--emerald)' : 'var(--red)' }} />
                                  <span style={{ color: course.faculty_id ? 'white' : 'var(--red-light)' }}>
                                    {course.faculty_name || 'Not Assigned'}
                                  </span>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge badge-blue">{course.weekly_hours || 4} Hrs/Wk</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className="badge badge-purple">{course.student_count || 0} Students</span>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span style={{ color: (course.student_count || 0) > (course.capacity || 35) ? 'var(--red)' : 'var(--text-secondary)' }}>
                                  Max {course.capacity || 35}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                  <button
                                    onClick={() => handleOpenCourseModal(elec, course)}
                                    className="btn btn-ghost"
                                    style={{ padding: '0.25rem 0.4rem' }}
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="btn btn-ghost"
                                    style={{ padding: '0.25rem 0.4rem', color: 'var(--red)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Subject Button */}
                  <button
                    onClick={() => handleOpenCourseModal(elec)}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.8rem', color: 'var(--purple-light)', border: '1px dashed var(--glass-border)', width: '100%', justifyContent: 'center' }}
                  >
                    <Plus size={14} />
                    Add Elective Subject / Course to {elec.name}
                  </button>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: ELECTIVE SLOTS CONFIG ───────────────────────────── */}
      {activeSubTab === 'slots' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock style={{ color: 'var(--accent-indigo)' }} size={20} />
                Configure Elective Timetable Slots
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Designate specific periods where elective subjects execute simultaneously for the section.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Semester:</label>
              <select
                value={slotSem}
                onChange={e => setSlotSem(Number(e.target.value))}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
              >
                <option value={1}>Semester 1</option>
                <option value={3}>Semester 3</option>
                <option value={5}>Semester 5</option>
              </select>

              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>Class:</label>
              <select
                value={slotClass}
                onChange={e => setSlotClass(e.target.value)}
                style={{ padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="1-A">1-A</option>
                <option value="1-B">1-B</option>
                <option value="2-A">2-A</option>
                <option value="2-B">2-B</option>
                <option value="3-A">3-A</option>
                <option value="3-B">3-B</option>
              </select>

              <button
                onClick={handleSaveSlots}
                className="btn btn-primary"
                style={{ marginLeft: '1rem', fontSize: '0.85rem' }}
              >
                Save Elective Slots ({selectedSlotKeys.size} Selected)
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <div className="timetable-grid">
              {/* Header row */}
              <div className="timetable-cell header">Timings</div>
              {Array.from({ length: dayCount }).map((_, index) => (
                <div key={index} className="timetable-cell header">
                  Day Order {index + 1}
                </div>
              ))}

              {/* Grid Slots */}
              {Array.from({ length: periodCount }).map((_, pIdx) => {
                const periodNo = pIdx + 1;
                return (
                  <React.Fragment key={pIdx}>
                    <div className="timetable-cell header" style={{ fontSize: '0.75rem', textAlign: 'center' }}>
                      <strong>Period {periodNo}</strong>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {settings.timings?.[periodNo] || ''}
                      </div>
                    </div>

                    {Array.from({ length: dayCount }).map((_, dIdx) => {
                      const dayNo = dIdx + 1;
                      const key = `${dayNo}_${periodNo}`;
                      const isSelected = selectedSlotKeys.has(key);

                      return (
                        <div
                          key={dIdx}
                          onClick={() => toggleSlotSelection(dayNo, periodNo)}
                          className={`timetable-cell ${isSelected ? 'lab' : ''}`}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: isSelected ? 'rgba(124, 58, 237, 0.25)' : 'rgba(255,255,255,0.01)',
                            borderColor: isSelected ? 'var(--purple-light)' : 'var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '65px'
                          }}
                        >
                          {isSelected ? (
                            <>
                              <CheckCircle size={18} style={{ color: 'var(--purple-light)', marginBottom: '0.2rem' }} />
                              <strong style={{ fontSize: '0.75rem', color: 'white' }}>Elective Slot</strong>
                              <span style={{ fontSize: '0.65rem', color: 'var(--purple-light)' }}>Day {dayNo} · P{periodNo}</span>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Available Slot</span>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 3: VALIDATION & CONFLICT REPORT ───────────────────────── */}
      {activeSubTab === 'validation' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert style={{ color: validationErrors.length === 0 ? 'var(--emerald)' : 'var(--red)' }} size={22} />
              Elective Pre-Generation Conflict Inspector
            </h3>
            <span className={`badge ${validationErrors.length === 0 ? 'badge-emerald' : 'badge-red'}`}>
              {validationErrors.length === 0 ? '100% Ready to Generate' : `${validationErrors.length} Issue(s) Found`}
            </span>
          </div>

          {validationErrors.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <CheckCircle size={48} style={{ color: 'var(--emerald-light)', marginBottom: '1rem' }} />
              <h3 style={{ color: 'white', marginBottom: '0.4rem' }}>All Elective Configurations Valid!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
                All active electives have faculty assigned, weekly hours set, student groups allocated, and elective slots configured correctly.
              </p>
            </div>
          ) : (
            <div>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '1.5rem' }}>
                <strong style={{ color: 'var(--red-light)', fontSize: '0.95rem' }}>Cannot Generate Timetable: Missing Elective Configuration</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  Please resolve the following pre-generation issues before initiating the timetable generator solver:
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {validationErrors.map((err, idx) => (
                  <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyItems: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <AlertTriangle size={18} style={{ color: 'var(--orange)' }} />
                      <div>
                        <strong style={{ color: 'white', fontSize: '0.9rem' }}>• {err.elective} {err.subject ? `— ${err.subject}` : ''}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{err.message}</div>
                      </div>
                    </div>
                    <span className="badge badge-orange" style={{ marginLeft: 'auto' }}>{err.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 4: REPORTS ───────────────────────────────────────────── */}
      {activeSubTab === 'reports' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText style={{ color: 'var(--cyan-light)' }} size={20} />
              Elective Allocation & Summary Reports
            </h3>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setReportType('summary')}
                className={`btn ${reportType === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem' }}
              >
                Elective Summary
              </button>
              <button
                onClick={() => setReportType('allocation')}
                className={`btn ${reportType === 'allocation' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ fontSize: '0.8rem' }}
              >
                Course Allocation
              </button>
            </div>
          </div>

          {reportType === 'summary' && reportData?.summaryReport && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Elective Name</th>
                    <th>Dept & Semester</th>
                    <th>Class</th>
                    <th style={{ textAlign: 'center' }}>Courses</th>
                    <th style={{ textAlign: 'center' }}>Total Enrolled</th>
                    <th style={{ textAlign: 'center' }}>Total Capacity</th>
                    <th style={{ textAlign: 'center' }}>Configured Slots</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.summaryReport.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'white' }}>{row.name}</td>
                      <td>{row.department} (Sem {row.semester})</td>
                      <td><span className="badge badge-purple">{row.class}</span></td>
                      <td style={{ textAlign: 'center' }}>{row.coursesCount} Subjects</td>
                      <td style={{ textAlign: 'center' }}><strong>{row.totalStudents} Students</strong></td>
                      <td style={{ textAlign: 'center' }}>{row.totalCapacity} Max</td>
                      <td style={{ textAlign: 'center' }}>{row.configuredSlots} / {row.weeklyHoursNeeded} Hrs</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${row.enabled ? 'badge-emerald' : 'badge-gray'}`}>
                          {row.enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'allocation' && reportData?.allocationReport && (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Elective Module</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Faculty Assigned</th>
                    <th style={{ textAlign: 'center' }}>Weekly Hours</th>
                    <th style={{ textAlign: 'center' }}>Student Group</th>
                    <th style={{ textAlign: 'center' }}>Capacity</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.allocationReport.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'white' }}>{row.electiveName}</td>
                      <td><span className="badge badge-purple">{row.class}</span></td>
                      <td>{row.subjectName} ({row.subjectId})</td>
                      <td><strong style={{ color: row.facultyId ? 'white' : 'var(--red-light)' }}>{row.facultyName}</strong></td>
                      <td style={{ textAlign: 'center' }}>{row.weeklyHours} Hrs/Wk</td>
                      <td style={{ textAlign: 'center' }}>{row.studentCount} Students</td>
                      <td style={{ textAlign: 'center' }}>Max {row.capacity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: CREATE / EDIT ELECTIVE MODULE ────────────────────────── */}
      {showElectiveModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ color: 'white', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              {editingElective ? 'Edit Elective Module' : 'Create New Elective Module'}
            </h3>

            <form onSubmit={handleSaveElective}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Elective Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elective-I"
                  value={elecName}
                  onChange={e => setElecName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Department</label>
                  <input
                    type="text"
                    required
                    value={elecDept}
                    onChange={e => setElecDept(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Semester</label>
                  <select
                    value={elecSem}
                    onChange={e => setElecSem(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                  >
                    <option value={1}>Semester 1</option>
                    <option value={3}>Semester 3</option>
                    <option value={5}>Semester 5</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Academic Year</label>
                <select
                  value={elecYear}
                  onChange={e => setElecYear(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Participating Sections (Shared Semester Elective)</label>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                  {['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'].map(sec => (
                    <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'white', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={elecSections.includes(sec)}
                        onChange={e => {
                          if (e.target.checked) setElecSections([...elecSections, sec]);
                          else setElecSections(elecSections.filter(s => s !== sec));
                        }}
                      />
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{sec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowElectiveModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Elective</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADD / EDIT ELECTIVE COURSE ───────────────────────────── */}
      {showCourseModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ color: 'white', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
              {editingCourse ? 'Edit Elective Course' : `Add Elective Course to ${selectedElectiveForCourse?.name}`}
            </h3>

            <form onSubmit={handleSaveCourse}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Subject Code & Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineering (CS501)"
                  value={courseSubjName}
                  onChange={e => {
                    setCourseSubjName(e.target.value);
                    if (!courseSubjId) setCourseSubjId(`CS${Math.floor(100 + Math.random() * 900)}`);
                  }}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Assign Faculty</label>
                <select
                  value={courseFacultyId}
                  onChange={e => setCourseFacultyId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                >
                  <option value="">-- Select Faculty Member --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Weekly Hours</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={courseHours}
                    onChange={e => setCourseHours(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Student Count</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={courseStudents}
                    onChange={e => setCourseStudents(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={courseCapacity}
                    onChange={e => setCourseCapacity(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowCourseModal(false)} className="btn btn-ghost">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: STUDENT DISTRIBUTION ────────────────────────────────── */}
      {showDistributeModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>
              Student Distribution — {distributeElective?.name}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Divide students into elective groups automatically or specify counts per course manually.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setDistributeMode('auto')}
                className={`btn ${distributeMode === 'auto' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '0.85rem' }}
              >
                Automatic Distribution
              </button>
              <button
                type="button"
                onClick={() => setDistributeMode('manual')}
                className={`btn ${distributeMode === 'manual' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ flex: 1, fontSize: '0.85rem' }}
              >
                Manual Distribution
              </button>
            </div>

            {distributeMode === 'auto' ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>Total Class Strength</label>
                <input
                  type="number"
                  value={classStrength}
                  onChange={e => setClassStrength(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white' }}
                />
                <div style={{ fontSize: '0.8rem', color: 'var(--cyan-light)', marginTop: '0.5rem' }}>
                  Will automatically split into {Math.floor(classStrength / (distributeElective?.courses?.length || 1))} students per elective subject group.
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(distributeElective?.courses || []).map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.6rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'white', fontSize: '0.85rem' }}>{c.subject_name || c.subject_id}</span>
                    <input
                      type="number"
                      value={manualCounts[c.id] || 0}
                      onChange={e => setManualCounts({ ...manualCounts, [c.id]: Number(e.target.value) })}
                      style={{ width: '90px', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'white', textAlign: 'center' }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={() => setShowDistributeModal(false)} className="btn btn-ghost">Cancel</button>
              <button type="button" onClick={handleSaveDistribution} className="btn btn-primary">Apply Distribution</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
