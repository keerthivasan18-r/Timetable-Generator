export const MAX_WEEKLY_PERIODS = 30;

export function getMaxWeeklyPeriods(yearOrSection) {
  if (yearOrSection === 'First Year' || yearOrSection === '1-A' || yearOrSection === '1-B') {
    return 29; // 29 core subject slots + 1 NME slot (DO 1 P5) = 30 total subject slots
  }
  return 30;
}

/**
 * Maps an academic year to its respective sections.
 * @param {string} year
 * @returns {string[]}
 */
export function getSectionsFromYear(year) {
  if (year === 'First Year') return ['1-A', '1-B'];
  if (year === 'Second Year') return ['2-A', '2-B'];
  if (year === 'Third Year') return ['3-A', '3-B'];
  return [];
}

/**
 * Maps a section name to its academic year.
 * @param {string} section
 * @returns {string}
 */
export function getYearFromSection(section) {
  if (section.startsWith('1')) return 'First Year';
  if (section.startsWith('2')) return 'Second Year';
  if (section.startsWith('3')) return 'Third Year';
  return '';
}

/**
 * Shared validation logic for weekly periods capacity of sections in a year.
 * @param {object} params
 * @param {string} params.year - Target academic year ('First Year', 'Second Year', 'Third Year')
 * @param {string} [params.subjectId] - Optional subject ID when editing
 * @param {number} params.newPeriods - Periods being set/added
 * @param {Array} params.subjects - Existing list of subjects
 * @returns {object} Validation result
 */
export function validateSectionPeriods({ year, subjectId, newPeriods, subjects }) {
  // Filter subjects belonging to the same academic year
  const yearSubjects = subjects.filter(s => s.year === year);
  
  // Calculate current sum of periods
  const currentTotal = yearSubjects.reduce((sum, s) => sum + (s.periods || 0), 0);
  
  // Find periods of the subject being updated (if editing)
  let oldPeriods = 0;
  if (subjectId) {
    const existing = yearSubjects.find(s => s.id === subjectId);
    if (existing) {
      oldPeriods = existing.periods || 0;
    }
  }

  const newTotal = currentTotal - oldPeriods + newPeriods;
  const maxAllowed = getMaxWeeklyPeriods(year);
  
  if (newTotal > maxAllowed) {
    const sections = getSectionsFromYear(year);
    const representativeSection = sections[0] || '1-A';
    
    return {
      valid: false,
      section: representativeSection,
      maximum: maxAllowed,
      current: currentTotal - oldPeriods,
      attempted: newPeriods,
      total: newTotal,
      error: 'Weekly period allocation exceeded.'
    };
  }
  
  return {
    valid: true,
    total: newTotal
  };
}

export const VALID_SECTIONS = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];
export const MAX_FACULTY_WORKLOAD = 30;

/**
 * Production-Grade Validation Engine (Client-Side implementation for fast-path and offline fallback)
 * Evaluates all 8 mandatory validation rules.
 */
export function validateSchedulerData(staff = [], subjects = [], assignments = [], settings = {}) {
  const errors = [];

  const activeStaffIds = new Set(staff.map(s => s.id));
  const activeSubjectIds = new Set(subjects.map(s => s.id));
  const validSectionSet = new Set(VALID_SECTIONS);

  const subjectMap = new Map();
  subjects.forEach(s => subjectMap.set(s.id, s));

  const staffMap = new Map();
  staff.forEach(s => staffMap.set(s.id, s));

  // Rule 8: Section Exists
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

  // Rule 6: Subject Exists
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

  // Rule 7: Faculty Exists
  assignments.forEach(asgn => {
    if (asgn.staffId) {
      const staffIds = asgn.staffId.includes('/') ? asgn.staffId.split('/') : [asgn.staffId];
      const invalidId = staffIds.find(id => id.trim() && !activeStaffIds.has(id.trim()));
      if (invalidId) {
        const subj = subjectMap.get(asgn.subjectId);
        errors.push({
          section: asgn.section || '-',
          subject: subj ? `${subj.name} (${subj.id})` : asgn.subjectId || '-',
          faculty: asgn.staffId,
          weeklyHours: subj?.periods || 0,
          type: 'Deleted/Inactive Faculty',
          error: `Assigned faculty ID "${invalidId}" does not exist in active roster.`
        });
      }
    }
  });

  // Rule 4: Duplicate Subject Assignment
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

  // Rule 1: Faculty Assignment & Rule 2: Subject Hours
  VALID_SECTIONS.forEach(sec => {
    const year = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';
    const sectionSubjects = subjects.filter(s => (s.year || 'First Year') === year);

    sectionSubjects.forEach(subj => {
      if (subj.periods === null || subj.periods === undefined || isNaN(subj.periods) || subj.periods <= 0) {
        errors.push({
          section: sec,
          subject: subj.name || subj.id,
          faculty: '-',
          weeklyHours: subj.periods || 0,
          type: 'Weekly Hours Missing',
          error: `Weekly Hours Missing for subject "${subj.name}".`
        });
      }

      const asgn = assignments.find(a => a.section === sec && a.subjectId === subj.id);
      if (!asgn || !asgn.staffId || !asgn.staffId.trim()) {
        errors.push({
          section: sec,
          subject: subj.name || subj.id,
          faculty: 'Not Assigned',
          weeklyHours: subj.periods || 0,
          type: 'Faculty Missing',
          error: `${subj.name} is not assigned to ${sec}.`
        });
      }
    });
  });

  // Rule 3: Total Weekly Hours (26 for 1st Year, 30 for 2nd/3rd Year)
  VALID_SECTIONS.forEach(sec => {
    const maxAllowed = getMaxWeeklyPeriods(sec);
    const year = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';
    const sectionSubjects = subjects.filter(s => (s.year || 'First Year') === year);
    const totalAssignedHours = sectionSubjects.reduce((sum, s) => sum + (Number(s.periods) || 0), 0);

    if (totalAssignedHours > maxAllowed) {
      const excess = totalAssignedHours - maxAllowed;
      errors.push({
        section: sec,
        subject: 'All Section Subjects',
        faculty: 'Multiple Faculty',
        weeklyHours: totalAssignedHours,
        type: 'Hours Exceeded',
        assigned: totalAssignedHours,
        allowed: maxAllowed,
        error: `Assigned Hours ${totalAssignedHours} / ${maxAllowed} for Section ${sec}. Reduce ${excess} Hours.`
      });
    } else if (totalAssignedHours < maxAllowed) {
      const deficit = maxAllowed - totalAssignedHours;
      errors.push({
        section: sec,
        subject: 'All Section Subjects',
        faculty: 'Multiple Faculty',
        weeklyHours: totalAssignedHours,
        type: 'Hours Insufficient',
        assigned: totalAssignedHours,
        required: maxAllowed,
        error: `Assigned Hours ${totalAssignedHours} / ${maxAllowed} for Section ${sec}. Assign ${deficit} More Hours.`
      });
    }
  });

  // Rule 5: Faculty Workload (Max 30 periods per faculty)
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

