/**
 * ChronoAI - Production-Grade Timetable Pre-Generation Validation Service
 * Validates 100% of data integrity before the timetable generation solver executes.
 */

export const MAX_WEEKLY_PERIODS_PER_SECTION = 30; // 6 days * 5 periods = 30
export const MAX_FACULTY_WORKLOAD = 30;

export const VALID_SECTIONS = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];

/**
 * Executes all 8 mandatory validation rules.
 * 
 * @param {Object} params
 * @param {Array} params.staff - Staff roster
 * @param {Array} params.subjects - Course catalog
 * @param {Array} params.assignments - Section-subject-staff mappings
 * @param {Object} params.settings - System settings (working days, periods per day)
 * @returns {Object} { success, canGenerate, errors }
 */
export function validateSchedulerData({ staff = [], subjects = [], assignments = [], settings = {} }) {
  const errors = [];

  const activeStaffIds = new Set(staff.map(s => s.id));
  const activeSubjectIds = new Set(subjects.map(s => s.id));
  const validSectionSet = new Set(VALID_SECTIONS);

  // Helper map: subjectId -> Subject object
  const subjectMap = new Map();
  subjects.forEach(s => subjectMap.set(s.id, s));

  // Helper map: staffId -> Staff object
  const staffMap = new Map();
  staff.forEach(s => staffMap.set(s.id, s));

  // Determine sections from assignments and valid standard sections
  const definedSections = new Set([...VALID_SECTIONS]);

  // ---------------------------------------------------------------------------
  // Validation 8 - Section Exists & Assignment Section Integrity
  // ---------------------------------------------------------------------------
  assignments.forEach((asgn, index) => {
    if (!asgn.section || !validSectionSet.has(asgn.section)) {
      errors.push({
        section: asgn.section || 'Unknown Section',
        subject: asgn.subjectId || '-',
        faculty: asgn.staffId || '-',
        weeklyHours: 0,
        type: 'Invalid Section',
        error: `Assignment #${index + 1} references an invalid section "${asgn.section}".`
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Validation 6 - Subject Exists (No orphan assignments)
  // ---------------------------------------------------------------------------
  assignments.forEach(asgn => {
    if (asgn.subjectId && !activeSubjectIds.has(asgn.subjectId)) {
      errors.push({
        section: asgn.section || '-',
        subject: asgn.subjectId,
        faculty: asgn.staffId || '-',
        weeklyHours: 0,
        type: 'Orphan Subject Assignment',
        error: `Assignment references a non-existent subject ID "${asgn.subjectId}".`
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Validation 7 - Faculty Exists (No assignments referencing deleted faculty)
  // ---------------------------------------------------------------------------
  assignments.forEach(asgn => {
    if (asgn.staffId && !activeStaffIds.has(asgn.staffId)) {
      const subj = subjectMap.get(asgn.subjectId);
      errors.push({
        section: asgn.section || '-',
        subject: subj ? `${subj.name} (${subj.id})` : asgn.subjectId || '-',
        faculty: asgn.staffId,
        weeklyHours: subj?.periods || 0,
        type: 'Deleted/Inactive Faculty',
        error: `Assigned faculty ID "${asgn.staffId}" does not exist in the active roster.`
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Validation 4 - Duplicate Subject Assignment (Subject assigned >1 time per section)
  // ---------------------------------------------------------------------------
  const sectionSubjectCount = new Map();
  assignments.forEach(asgn => {
    if (asgn.section && asgn.subjectId) {
      const key = `${asgn.section}_${asgn.subjectId}`;
      sectionSubjectCount.set(key, (sectionSubjectCount.get(key) || 0) + 1);
    }
  });

  sectionSubjectCount.forEach((count, key) => {
    if (count > 1) {
      const [sec, subId] = key.split('_');
      const subj = subjectMap.get(subId);
      errors.push({
        section: sec,
        subject: subj ? subj.name : subId,
        faculty: '-',
        weeklyHours: subj?.periods || 0,
        type: 'Duplicate Subject Assignment',
        error: `Duplicate Subject Assignment Found: Subject "${subj ? subj.name : subId}" assigned ${count} times to Section ${sec}.`
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Validation 1 - Faculty Assignment & Validation 2 - Subject Hours
  // Check every subject offered for each section
  // ---------------------------------------------------------------------------
  VALID_SECTIONS.forEach(sec => {
    // Determine target year for this section
    const year = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';
    const sectionSubjects = subjects.filter(s => (s.year || 'First Year') === year);

    sectionSubjects.forEach(subj => {
      // Check Validation 2: Subject Hours
      if (subj.periods === null || subj.periods === undefined || isNaN(subj.periods) || subj.periods <= 0) {
        errors.push({
          section: sec,
          subject: subj.name || subj.id,
          faculty: '-',
          weeklyHours: subj.periods || 0,
          type: 'Weekly Hours Missing',
          error: `Subject "${subj.name}" has invalid or missing weekly hours (${subj.periods}).`
        });
      }

      // Check Validation 1: Faculty Assignment
      const asgn = assignments.find(a => a.section === sec && a.subjectId === subj.id);
      if (!asgn || !asgn.staffId || !asgn.staffId.trim()) {
        errors.push({
          section: sec,
          subject: subj.name || subj.id,
          faculty: 'Not Assigned',
          weeklyHours: subj.periods || 0,
          type: 'Faculty Missing',
          error: `Faculty Not Assigned for subject "${subj.name}".`
        });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Validation 3 - Total Weekly Hours (Must equal EXACTLY 30 for every section)
  // ---------------------------------------------------------------------------
  VALID_SECTIONS.forEach(sec => {
    const year = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';
    const sectionSubjects = subjects.filter(s => (s.year || 'First Year') === year);
    const totalAssignedHours = sectionSubjects.reduce((sum, s) => sum + (Number(s.periods) || 0), 0);

    if (totalAssignedHours > MAX_WEEKLY_PERIODS_PER_SECTION) {
      const excess = totalAssignedHours - MAX_WEEKLY_PERIODS_PER_SECTION;
      errors.push({
        section: sec,
        subject: 'All Section Subjects',
        faculty: 'Multiple Faculty',
        weeklyHours: totalAssignedHours,
        type: 'Hours Exceeded',
        assigned: totalAssignedHours,
        allowed: MAX_WEEKLY_PERIODS_PER_SECTION,
        error: `Assigned Hours ${totalAssignedHours} / ${MAX_WEEKLY_PERIODS_PER_SECTION}. Reduce ${excess} Hours.`
      });
    } else if (totalAssignedHours < MAX_WEEKLY_PERIODS_PER_SECTION) {
      const deficit = MAX_WEEKLY_PERIODS_PER_SECTION - totalAssignedHours;
      errors.push({
        section: sec,
        subject: 'All Section Subjects',
        faculty: 'Multiple Faculty',
        weeklyHours: totalAssignedHours,
        type: 'Hours Insufficient',
        assigned: totalAssignedHours,
        required: MAX_WEEKLY_PERIODS_PER_SECTION,
        error: `Assigned Hours ${totalAssignedHours} / ${MAX_WEEKLY_PERIODS_PER_SECTION}. Assign ${deficit} More Hours.`
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Validation 5 - Faculty Workload (Max 30 periods across all sections)
  // ---------------------------------------------------------------------------
  const facultyWorkloadMap = new Map();
  assignments.forEach(asgn => {
    if (asgn.staffId && activeStaffIds.has(asgn.staffId)) {
      const subj = subjectMap.get(asgn.subjectId);
      const hours = subj ? Number(subj.periods) || 0 : 0;
      facultyWorkloadMap.set(asgn.staffId, (facultyWorkloadMap.get(asgn.staffId) || 0) + hours);
    }
  });

  facultyWorkloadMap.forEach((totalHours, staffId) => {
    if (totalHours > MAX_FACULTY_WORKLOAD) {
      const stf = staffMap.get(staffId);
      const staffName = stf ? stf.name : staffId;
      errors.push({
        section: 'Department Wide',
        subject: 'Multiple Courses',
        faculty: staffName,
        weeklyHours: totalHours,
        type: 'Workload Exceeded',
        error: `Faculty Workload Exceeded: ${staffName} assigned ${totalHours} Hours (Maximum allowed: ${MAX_FACULTY_WORKLOAD}).`
      });
    }
  });

  const canGenerate = errors.length === 0;

  return {
    success: canGenerate,
    canGenerate,
    errors,
    message: canGenerate
      ? 'All validation checks passed. Starting timetable generation.'
      : `Validation failed with ${errors.length} error(s).`
  };
}
