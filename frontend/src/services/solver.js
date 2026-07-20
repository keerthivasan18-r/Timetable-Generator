/**
 * Generates conflict-free timetables for Sections 1-A and 1-B.
 * presetLabSlots: array of { section, dayOrder, period, subjectId, staffId, subjectName, staffName }
 * These slots are pre-filled BEFORE the solver runs, so the solver won't override them.
 *
 * @param {Array} staff
 * @param {Array} subjects
 * @param {Array} assignments
 * @param {Object} settings
 * @param {Array} presetLabSlots - Admin-designated lab slots (from LabScheduler)
 */
export function generateTimetable(staff, subjects, assignments, settings, presetLabSlots = []) {
  const { periodsPerDay, dayOrdersCount, breakAfterPeriod } = settings;
  const sections = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];

  
  // 1. Initialize grids
  const grid = {};
  sections.forEach(sec => {
    grid[sec] = {};
    for (let day = 1; day <= dayOrdersCount; day++) {
      grid[sec][day] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        grid[sec][day][p] = null;
      }
    }
  });

  // 1b. Pre-fill admin-specified lab slots (these CANNOT be overridden by the solver)
  const lockedCells = new Set();
  if (presetLabSlots && presetLabSlots.length > 0) {
    presetLabSlots.forEach(slot => {
      const sec = slot.section;
      const day = slot.day_order ?? slot.dayOrder;
      const period = slot.period;
      if (!grid[sec] || !grid[sec][day]) return;
      const subj = subjects.find(s => s.id === (slot.subject_id || slot.subjectId));
      const stf = staff.find(s => s.id === (slot.staff_id || slot.staffId));
      grid[sec][day][period] = {
        subjectId: slot.subject_id || slot.subjectId || 'LAB',
        staffId: slot.staff_id || slot.staffId || '',
        subjectName: slot.subject_name || subj?.name || 'Lab',
        staffName: slot.staff_name || stf?.name || '-',
        isPreset: true
      };
      lockedCells.add(`${sec}_${day}_${period}`);
    });
  }



  // 2. Prepare pending allocations for each section
  const pending = {};
  sections.forEach(sec => {
    pending[sec] = [];
    const secAssignments = assignments.filter(a => a.section === sec);
    
    secAssignments.forEach(assign => {
      const subject = subjects.find(s => s.id === assign.subjectId);
      if (!subject) return;
      
      // Calculate remaining periods to schedule (subtracting preset slots)
      const presetPeriodsCount = presetLabSlots.filter(s => 
        s.section === sec && 
        ((s.subject_id || s.subjectId) === assign.subjectId)
      ).length;
      
      const remainingPeriods = Math.max(0, subject.periods - presetPeriodsCount);
      if (remainingPeriods <= 0) return;
      
      const isLab = subject.id === 'CS103' || subject.name.toLowerCase().includes('lab');
      
      if (isLab) {
        // Lab: occupies 2 consecutive periods twice per week
        const doublePeriodsCount = Math.floor(remainingPeriods / 2);
        for (let i = 0; i < doublePeriodsCount; i++) {
          pending[sec].push({
            subjectId: subject.id,
            staffId: assign.staffId,
            subjectName: subject.name,
            type: 'lab-double',
            periodsCount: 2
          });
        }
        const rem = remainingPeriods % 2;
        for (let i = 0; i < rem; i++) {
          pending[sec].push({
            subjectId: subject.id,
            staffId: assign.staffId,
            subjectName: subject.name,
            type: 'single',
            periodsCount: 1
          });
        }
      } else if (remainingPeriods === dayOrdersCount) {
        // Daily subject (e.g. English, Tamil) - must be 1 per day
        for (let i = 0; i < remainingPeriods; i++) {
          pending[sec].push({
            subjectId: subject.id,
            staffId: assign.staffId,
            subjectName: subject.name,
            type: 'daily',
            periodsCount: 1
          });
        }
      } else {
        // General subject
        for (let i = 0; i < remainingPeriods; i++) {
          pending[sec].push({
            subjectId: subject.id,
            staffId: assign.staffId,
            subjectName: subject.name,
            type: 'single',
            periodsCount: 1
          });
        }
      }
    });
    
    // Sort pending: double labs first (hardest to place), then daily, then others
    pending[sec].sort((a, b) => {
      if (a.type === 'lab-double' && b.type !== 'lab-double') return -1;
      if (b.type === 'lab-double' && a.type !== 'lab-double') return 1;
      if (a.type === 'daily' && b.type !== 'daily') return -1;
      if (b.type === 'daily' && a.type !== 'daily') return 1;
      return 0;
    });
  });

  // Verify total slots constraint
  const totalSlots = dayOrdersCount * periodsPerDay;
  for (const sec of sections) {
    const totalPeriodsNeeded = pending[sec].reduce((sum, item) => sum + item.periodsCount, 0);
    if (totalPeriodsNeeded > totalSlots) {
      return {
        success: false,
        error: `Section ${sec} requires ${totalPeriodsNeeded} periods, but only ${totalSlots} slots are available (${dayOrdersCount} Day Orders x ${periodsPerDay} Periods). Please adjust settings or reduce subject periods.`
      };
    }
  }

  // Calculate total weekly periods assigned to each teacher to scale their daily load limit
  const facultyTotalHours = {};
  staff.forEach(s => {
    facultyTotalHours[s.id] = assignments.filter(a => a.staffId === s.id).reduce((sum, a) => {
      const sub = subjects.find(sb => sb.id === a.subjectId);
      return sum + (sub?.periods || 0);
    }, 0);
  });

  function getFacultyDailyLoad(staffId, day) {
    let count = 0;
    for (const sec of sections) {
      for (let p = 1; p <= periodsPerDay; p++) {
        if (grid[sec] && grid[sec][day] && grid[sec][day][p] && grid[sec][day][p].staffId === staffId) {
          count++;
        }
      }
    }
    return count;
  }

  // 3. Track state for backtracking solver
  // Faculty occupancy: facultySchedule[staffId][day][period] = true
  const facultySchedule = {};
  staff.forEach(s => {
    facultySchedule[s.id] = {};
    for (let d = 1; d <= dayOrdersCount; d++) {
      facultySchedule[s.id][d] = {};
      for (let p = 1; p <= periodsPerDay; p++) {
        facultySchedule[s.id][d][p] = false;
      }
    }
  });

  // Daily subject tracking per section: sectionDailySubjects[sec][subjectId][day] = true
  const sectionDailySubjects = {};
  sections.forEach(sec => {
    sectionDailySubjects[sec] = {};
    subjects.forEach(s => {
      sectionDailySubjects[sec][s.id] = {};
      for (let d = 1; d <= dayOrdersCount; d++) {
        sectionDailySubjects[sec][s.id][d] = false;
      }
    });
  });

  // Mark presets in faculty/subject tracking state
  if (presetLabSlots && presetLabSlots.length > 0) {
    presetLabSlots.forEach(slot => {
      const sec = slot.section;
      const day = slot.day_order ?? slot.dayOrder;
      const period = slot.period;
      const staffId = slot.staff_id || slot.staffId;
      const subjectId = slot.subject_id || slot.subjectId;
      
      if (staffId && facultySchedule[staffId] && facultySchedule[staffId][day]) {
        facultySchedule[staffId][day][period] = true;
      }
      if (sec && subjectId && sectionDailySubjects[sec] && sectionDailySubjects[sec][subjectId]) {
        sectionDailySubjects[sec][subjectId][day] = true;
      }
    });
  }


  function getSubjectDailyCount(sec, subjectId, day) {
    let count = 0;
    for (let p = 1; p <= periodsPerDay; p++) {
      if (grid[sec][day][p] && grid[sec][day][p].subjectId === subjectId) {
        count++;
      }
    }
    return count;
  }

  function canPlace(sec, item, day, period) {
    // Check if this cell is admin-locked (preset lab slot)
    if (lockedCells.has(`${sec}_${day}_${period}`)) return false;

    // Check if cell is empty
    if (grid[sec][day][period] !== null) return false;

    // Check faculty overlap (staffId is empty for Self Study/Free)
    if (item.staffId && facultySchedule[item.staffId][day][period]) return false;

    // Faculty Daily Load Constraint: scale maximum periods per day based on their workload
    if (item.staffId) {
      const totalHours = facultyTotalHours[item.staffId] || 0;
      const maxDailyLoad = Math.max(3, Math.ceil(totalHours / dayOrdersCount) + 1);
      if (getFacultyDailyLoad(item.staffId, day) >= maxDailyLoad) return false;
    }

    // Laboratory/Room Availability Constraint: two sections cannot run the same practical at the same time
    const subjectObj = subjects.find(s => s.id === item.subjectId);
    if (subjectObj && subjectObj.type === 'practical') {
      for (const otherSec of sections) {
        if (otherSec !== sec && grid[otherSec]?.[day]?.[period]?.subjectId === item.subjectId) {
          return false;
        }
      }
    }

    // Check daily constraints for "daily" type (e.g. English, Tamil once per day)
    if (item.type === 'daily' && sectionDailySubjects[sec][item.subjectId][day]) {
      return false;
    }

    // For theory subjects, limit to 1 per day if we have at least as many day orders as periods
    if (item.type === 'single') {
      const currentDailyCount = getSubjectDailyCount(sec, item.subjectId, day);
      const subject = subjects.find(s => s.id === item.subjectId);
      if (subject && subject.periods <= dayOrdersCount && currentDailyCount >= 1) {
        return false;
      }
      // Hard cap at 2 periods of same subject per day to prevent grouping
      if (currentDailyCount >= 2) return false;
    }

    return true;
  }

  function place(sec, item, day, period) {
    grid[sec][day][period] = {
      subjectId: item.subjectId,
      staffId: item.staffId,
      subjectName: item.subjectName,
      staffName: staff.find(s => s.id === item.staffId)?.name || '-'
    };
    if (item.staffId) {
      facultySchedule[item.staffId][day][period] = true;
    }
    sectionDailySubjects[sec][item.subjectId][day] = true;
  }

  function unplace(sec, item, day, period) {
    grid[sec][day][period] = null;
    if (item.staffId) {
      facultySchedule[item.staffId][day][period] = false;
    }
    sectionDailySubjects[sec][item.subjectId][day] = false;
  }

  // Generate a shifted order of slot coordinates to naturally shuffle the placements across days
  const slots = [];
  for (let d = 1; d <= dayOrdersCount; d++) {
    // Shift period order by (d * 2) so each day starts at a different period index
    const offset = (d * 2) % periodsPerDay;
    for (let i = 0; i < periodsPerDay; i++) {
      const p = ((i + offset) % periodsPerDay) + 1;
      slots.push({ day: d, period: p });
    }
  }

  // Recursive backtracking solver with index-based symmetry breaking to prevent combinatorial explosion
  function solveSection(secIndex, itemIndex, startIndex = 0) {
    if (secIndex >= sections.length) {
      return true; // Scheduled all sections!
    }

    const sec = sections[secIndex];
    const secItems = pending[sec];

    if (itemIndex >= secItems.length) {
      return solveSection(secIndex + 1, 0, 0);
    }

    const item = secItems[itemIndex];
    
    // Symmetry-breaking optimization: if the current subject is identical to the previous one,
    // only try slots that appear after the slot where the previous copy was placed.
    const isSameAsPrev = itemIndex > 0 && 
                         secItems[itemIndex - 1].subjectId === item.subjectId && 
                         secItems[itemIndex - 1].type === item.type;
                         
    const startLoc = isSameAsPrev ? startIndex : 0;

    if (item.type === 'lab-double') {
      for (let i = startLoc; i < slots.length; i++) {
        const { day, period } = slots[i];
        if (period < periodsPerDay && period !== breakAfterPeriod) {
          if (canPlace(sec, item, day, period) && canPlace(sec, item, day, period + 1)) {
            place(sec, item, day, period);
            place(sec, item, day, period + 1);

            if (solveSection(secIndex, itemIndex + 1, i + 1)) {
              return true;
            }

            unplace(sec, item, day, period);
            unplace(sec, item, day, period + 1);
          }
        }
      }
    } else {
      for (let i = startLoc; i < slots.length; i++) {
        const { day, period } = slots[i];
        if (canPlace(sec, item, day, period)) {
          place(sec, item, day, period);

          if (solveSection(secIndex, itemIndex + 1, i + 1)) {
            return true;
          }

          unplace(sec, item, day, period);
        }
      }
    }

    return false; // Backtrack
  }

  // Run the solver
  const success = solveSection(0, 0, 0);

  if (success) {
    // Fill remaining empty cells with "Self Study / Library"
    sections.forEach(sec => {
      for (let day = 1; day <= dayOrdersCount; day++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[sec][day][p] === null) {
            grid[sec][day][p] = {
              subjectId: 'FREE',
              staffId: '',
              subjectName: 'Self Study / Library',
              staffName: '-'
            };
          }
        }
      }
    });

    return {
      success: true,
      tables: grid
    };
  } else {
    return {
      success: false,
      error: 'Constraints could not be satisfied simultaneously. The solver hit a conflict. Suggestions:\n1. Ensure Murugan (shared faculty) does not have more than 1 period scheduled at the same time.\n2. Ensure periodsPerDay is set to 6 or higher to fit 33 periods.'
    };
  }
}

/**
 * Validates a timetable configuration (detects conflicts in real-time for manual edits).
 * 
 * @param {Object} tables - Grids for all sections
 * @param {Array} staff - List of staff members
 * @param {Array} subjects - List of subjects
 * @param {Object} settings - Settings
 * @returns {Array} List of conflicts found: { type, section, day, period, message }
 */
export function validateTimetable(tables, staff, subjects, settings) {
  if (!tables) return [];
  const { periodsPerDay, dayOrdersCount } = settings;
  const sections = Object.keys(tables);
  const conflicts = [];

  const getSectionYear = (sec) => {
    if (sec.startsWith('1')) return 'First Year';
    if (sec.startsWith('2')) return 'Second Year';
    if (sec.startsWith('3')) return 'Third Year';
    return 'First Year';
  };

  // Track faculty bookings: key = `staffId_day_period` -> list of { section }
  const facultyBookings = {};
  // Track subject weekly period counts: key = `section_subjectId` -> number
  const subjectPeriodCounts = {};
  // Track lab/room bookings: key = `subjectId_day_period` -> list of { section }
  const labBookings = {};

  sections.forEach(sec => {
    const secYear = getSectionYear(sec);
    for (let day = 1; day <= dayOrdersCount; day++) {
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = tables[sec]?.[day]?.[p];
        if (!slot || slot.subjectId === 'FREE') continue;

        // Check for Invalid Section Allocation (First Year subject in Second Year section, etc.)
        const sub = subjects.find(s => s.id === slot.subjectId);
        if (sub) {
          const subYear = sub.year || 'First Year';
          if (subYear !== secYear) {
            conflicts.push({
              type: 'invalid_section_allocation',
              section: sec,
              subjectId: slot.subjectId,
              message: `Invalid Allocation: Subject '${sub.name}' (${slot.subjectId}) is for ${subYear} but scheduled in Section ${sec} (${secYear}) on Day ${day}, Period ${p}.`,
              day,
              period: p
            });
          }
        }

        // 1. Track faculty bookings
        if (slot.staffId) {
          const key = `${slot.staffId}_${day}_${p}`;
          if (!facultyBookings[key]) {
            facultyBookings[key] = [];
          }
          facultyBookings[key].push({ section: sec, day, period: p });
        }

        // 2. Track subject counts
        const subKey = `${sec}_${slot.subjectId}`;
        subjectPeriodCounts[subKey] = (subjectPeriodCounts[subKey] || 0) + 1;

        // 3. Track lab/room bookings (only for practical subjects)
        if (sub && sub.type === 'practical') {
          const key = `${slot.subjectId}_${day}_${p}`;
          if (!labBookings[key]) {
            labBookings[key] = [];
          }
          labBookings[key].push({ section: sec, day, period: p });
        }
      }
    }
  });

  // Check for Faculty Overlaps (Double Booked)
  Object.keys(facultyBookings).forEach(key => {
    const bookings = facultyBookings[key];
    if (bookings.length > 1) {
      const [staffId, day, period] = key.split('_');
      const staffName = staff.find(s => s.id === staffId)?.name || staffId;
      const sectionsList = bookings.map(b => b.section).join(' and ');
      conflicts.push({
        type: 'faculty_overlap',
        staffId,
        message: `Faculty '${staffName}' is double-booked in both ${sectionsList} on Day ${day}, Period ${period}.`,
        day: parseInt(day),
        period: parseInt(period)
      });
    }
  });

  // Check for Laboratory/Room conflicts (practical subjects scheduled at the same time)
  Object.keys(labBookings).forEach(key => {
    const bookings = labBookings[key];
    if (bookings.length > 1) {
      const [subjectId, day, period] = key.split('_');
      const subName = subjects.find(s => s.id === subjectId)?.name || subjectId;
      const sectionsList = bookings.map(b => b.section).join(' and ');
      conflicts.push({
        type: 'lab_conflict',
        subjectId,
        message: `Laboratory Conflict: Lab room for '${subName}' is double-booked in both ${sectionsList} on Day ${day}, Period ${period}.`,
        day: parseInt(day),
        period: parseInt(period)
      });
    }
  });

  // Check for Subject Allocation Limits
  sections.forEach(sec => {
    const secYear = getSectionYear(sec);
    subjects.forEach(sub => {
      const subYear = sub.year || 'First Year';
      // Only check limits for subjects of the section's corresponding year
      if (subYear !== secYear) return;

      const actual = subjectPeriodCounts[`${sec}_${sub.id}`] || 0;
      if (actual > sub.periods) {
        conflicts.push({
          type: 'over_allocation',
          section: sec,
          subjectId: sub.id,
          message: `Section ${sec} has scheduled '${sub.name}' for ${actual} periods, but the weekly allocation is only ${sub.periods} periods.`
        });
      } else if (actual < sub.periods) {
        conflicts.push({
          type: 'under_allocation',
          section: sec,
          subjectId: sub.id,
          message: `Section ${sec} has scheduled '${sub.name}' for ${actual} periods, but needs ${sub.periods} periods.`
        });
      }
    });
  });

  return conflicts;
}
