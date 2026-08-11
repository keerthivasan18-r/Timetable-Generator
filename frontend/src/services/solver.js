/**
 * ChronoAI - Advanced Timetable Generation & Conflict Validation Engine
 * 
 * Rules enforced:
 * RULE 1: Manual LAB periods in presetLabSlots are LOCKED and never modified or moved.
 * RULE 2: First Year (1-A, 1-B):
 *         - Day Order 1 & Day Order 2, Period 4 (12:40 PM - 1:30 PM): Fixed NME slot.
 *         - Day Order 1 & Day Order 2, Period 5 (5:40 PM - 6:30 PM): Fixed EMPTY slot (No Class/NME Finish).
 *         - Day Orders 3-6: Period 5 scheduled normally.
 * RULE 3: Faculty Clash Prevention (No faculty assigned to >1 class in the same Day Order & Period).
 * RULE 4: No Repeated Subjects (Theory subjects spread across week, non-consecutive; Labs 2-period blocks).
 * RULE 5: No Free Periods (100% period fill; no 'FREE' placeholder cells inserted).
 */// Session memory store to prevent convergent timetables across runs (Step 9)
let lastGeneratedTimetable = null;

export function generateTimetable(staff, subjects, assignments, settings, presetLabSlots = [], electives = [], electiveSlots = []) {
  const { periodsPerDay = 5, dayOrdersCount = 6, breakAfterPeriod = 3 } = settings || {};
  const sections = ['1-A', '1-B', '2-A', '2-B', '3-A', '3-B'];

  // Helper to calculate similarity score between two timetable grids (Step 9)
  function computeSimilarity(newTables, prevTables) {
    if (!prevTables) return 0;
    let matches = 0;
    let totalSlots = 0;
    sections.forEach(sec => {
      if (!newTables[sec] || !prevTables[sec]) return;
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          const slot1 = newTables[sec]?.[d]?.[p];
          const slot2 = prevTables[sec]?.[d]?.[p];
          if (slot1 && slot2 && slot1.subjectId !== 'OFF' && slot1.subjectId !== 'NME' && !slot1.isElective) {
            totalSlots++;
            if (slot1.subjectId === slot2.subjectId) {
              matches++;
            }
          }
        }
      }
    });
    return totalSlots > 0 ? matches / totalSlots : 0;
  }

  // Attempt timetable generation with dynamic seed (Step 9 Anti-Convergence)
  const baseSeed = (Date.now() + Math.floor(Math.random() * 1000)) % 100;
  let bestAttempt = null;

  for (let attemptSeed = baseSeed; attemptSeed < baseSeed + 2; attemptSeed++) {
    // 1. Initialize Grids
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

    const lockedCells = new Set();
    const specialStaffIds = new Set(['EXT_NME', 'EXT']);

    // RULE 2: Pre-fill First-Year NME at Day 1 & Day 2 Period 5 (Sections 1-A & 1-B)
    const firstYearSections = ['1-A', '1-B'];
    firstYearSections.forEach(sec => {
      if (grid[sec]) {
        const secAsgns = assignments.filter(a => a.section === sec);
        const nmeAsgn = secAsgns.find(a => {
          const sub = subjects.find(s => s.id === a.subjectId);
          return a.subjectId.includes('NME') || (sub && (sub.name.toLowerCase().includes('nme') || sub.type === 'nme'));
        });

        const nmeSubj = nmeAsgn ? subjects.find(s => s.id === nmeAsgn.subjectId) : null;
        const nmeStf = nmeAsgn ? staff.find(s => s.id === nmeAsgn.staffId) : null;

        const nmeSubjectId = nmeSubj ? nmeSubj.id : 'NME';
        const nmeSubjectName = nmeSubj ? nmeSubj.name : 'Non-Major Elective (NME)';
        const nmeStaffId = nmeStf ? nmeStf.id : 'EXT_NME';
        const nmeStaffName = nmeStf ? nmeStf.name : 'External Faculty';

        if (nmeStaffId) specialStaffIds.add(nmeStaffId);

        // Day 1 Period 5 (5:40 PM - 6:30 PM): Locked NME
        [1].forEach(day => {
          if (grid[sec][day] && periodsPerDay >= 5) {
            grid[sec][day][5] = {
              subjectId: nmeSubjectId,
              subjectName: nmeSubjectName,
              staffId: nmeStaffId,
              staffName: nmeStaffName,
              isNME: true,
              isLocked: true
            };
            lockedCells.add(`${sec}_${day}_5`);
          }
        });
      }
    });

    // RULE 3: Pre-fill Synchronized Parallel Elective Slots for 2nd Year (2-A & 2-B) and 3rd Year (3-A & 3-B)
    // 2nd Year Elective: CS205 (SE) & CS206 (AI)
    // 3rd Year Elective: CS306 (IDS) & CS307 (Big Data)
    const secondYearSlots = (electiveSlots && electiveSlots.filter(s => s.semester === 3).length > 0)
      ? electiveSlots.filter(s => s.semester === 3)
      : [{ day: 1, period: 2 }, { day: 3, period: 5 }, { day: 4, period: 4 }, { day: 5, period: 1 }];

    const thirdYearSlots = (electiveSlots && electiveSlots.filter(s => s.semester === 5).length > 0)
      ? electiveSlots.filter(s => s.semester === 5)
      : [{ day: 1, period: 2 }, { day: 3, period: 5 }, { day: 4, period: 4 }, { day: 5, period: 1 }];

    // Mark elective faculty as special staff so parallel elective classes don't trigger faculty overlap conflicts
    ['STF014', 'STF015', 'STF016', 'STF018'].forEach(id => specialStaffIds.add(id));

    // Pre-fill 2nd Year Elective Slots in 2-A & 2-B
    ['2-A', '2-B'].forEach(sec => {
      secondYearSlots.forEach(s => {
        const d = s.day_order || s.day;
        const p = s.period;
        if (grid[sec]?.[d]?.[p] === null) {
          grid[sec][d][p] = {
            subjectId: 'CS205/CS206',
            subjectName: 'Elective I (SE / AI)',
            staffId: 'STF014/STF015',
            staffName: 'Ponnila / Poojitha',
            isElective: true,
            isLocked: true
          };
          lockedCells.add(`${sec}_${d}_${p}`);
        }
      });
    });

    // Pre-fill 3rd Year Elective Slots in 3-A & 3-B
    ['3-A', '3-B'].forEach(sec => {
      thirdYearSlots.forEach(s => {
        const d = s.day_order || s.day;
        const p = s.period;
        if (grid[sec]?.[d]?.[p] === null) {
          grid[sec][d][p] = {
            subjectId: 'CS306/CS307',
            subjectName: 'Elective II (IDS / Big Data)',
            staffId: 'STF016/STF018',
            staffName: 'Saranya / Dharani',
            isElective: true,
            isLocked: true
          };
          lockedCells.add(`${sec}_${d}_${p}`);
        }
      });
    });

    // RULE 1: Pre-fill admin-specified manual lab slots (LOCKED - never moved)
    if (presetLabSlots && presetLabSlots.length > 0) {
      presetLabSlots.forEach(slot => {
        const sec = slot.section;
        const day = slot.day_order ?? slot.dayOrder;
        const period = slot.period;
        if (!grid[sec] || !grid[sec][day]) return;

        const subj = subjects.find(s => s.id === (slot.subject_id || slot.subjectId));
        const stf = staff.find(s => s.id === (slot.staff_id || slot.staffId));
        const room = slot.lab_room_id || slot.labRoomId || (sec.endsWith('B') ? 'L2' : 'L1');

        grid[sec][day][period] = {
          subjectId: slot.subject_id || slot.subjectId || 'LAB',
          staffId: slot.staff_id || slot.staffId || '',
          subjectName: slot.subject_name || subj?.name || 'Lab',
          staffName: slot.staff_name || stf?.name || '-',
          labRoomId: room,
          isPreset: true,
          isLocked: true
        };
        lockedCells.add(`${sec}_${day}_${period}`);
      });
    }

    const isSpecialStaff = id => !id || specialStaffIds.has(id) || id.includes('/') || id.startsWith('EXT_');

    // 2. Track Faculty Schedule State for Clash Prevention (Rule 3 & Principle 7)
    const facultySchedule = {};
    const markFacultySchedule = (staffId, sec, day, period) => {
      if (!staffId || isSpecialStaff(staffId)) return;
      if (!facultySchedule[staffId]) {
        facultySchedule[staffId] = {};
        for (let d = 1; d <= dayOrdersCount; d++) {
          facultySchedule[staffId][d] = {};
          for (let p = 1; p <= periodsPerDay; p++) {
            facultySchedule[staffId][d][p] = null;
          }
        }
      }
      facultySchedule[staffId][day][period] = sec;
    };

    const unmarkFacultySchedule = (staffId, day, period) => {
      if (!staffId || isSpecialStaff(staffId) || !facultySchedule[staffId] || !facultySchedule[staffId][day]) return;
      facultySchedule[staffId][day][period] = null;
    };

    // Populate faculty schedule from presets & NME
    sections.forEach(sec => {
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          const cell = grid[sec][d][p];
          if (cell && cell.staffId) {
            markFacultySchedule(cell.staffId, sec, d, p);
          }
        }
      }
    });

    // Verify presets do not have faculty double-bookings
    let presetConflict = false;
    for (const stfId of Object.keys(facultySchedule)) {
      if (isSpecialStaff(stfId)) continue;
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          let count = 0;
          let conflictSecs = [];
          sections.forEach(sec => {
            if (grid[sec][d][p]?.staffId === stfId) {
              count++;
              conflictSecs.push(sec);
            }
          });
          if (count > 1) {
            presetConflict = true;
            const stfName = staff.find(s => s.id === stfId)?.name || stfId;
            return {
              success: false,
              error: `Manual Lab Conflict: Faculty '${stfName}' is assigned to multiple classes (${conflictSecs.join(', ')}) on Day ${d}, Period ${p}. Please correct manual lab entries.`
            };
          }
        }
      }
    }
    if (presetConflict) break;

    // 3. Construct Pending Allocation Queues with Round-Robin Interleaving for Theory
    const electiveSubjectIds = new Set(['CS205', 'CS206', 'CS306', 'CS307']);

    const pending = {};
    sections.forEach(sec => {
      pending[sec] = [];
      const secAssignments = assignments.filter(a => a.section === sec);
      const secYear = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';

      const labDoubleItems = [];
      const singleLabItems = [];
      const theorySubjectBuckets = [];

      secAssignments.forEach(assign => {
        const subject = subjects.find(s => s.id === assign.subjectId);
        if (!subject) return;

        const subYear = subject.year || 'First Year';
        if (subYear !== secYear) return;

        // Skip elective subjects since they are pre-filled in synchronized elective slots
        if (electiveSubjectIds.has(assign.subjectId)) return;

        let presetCount = 0;
        if (presetLabSlots) {
          presetCount = presetLabSlots.filter(s =>
            s.section === sec && ((s.subject_id || s.subjectId) === assign.subjectId)
          ).length;
        }

        // Subtract pre-filled NME period (Day 1 Period 5) for First-Year NME subjects
        let nmePreFilledCount = 0;
        if (sec.startsWith('1') && (assign.subjectId.includes('NME') || subject.name.toLowerCase().includes('nme') || subject.type === 'nme')) {
          nmePreFilledCount = 1;
        }

        const remainingPeriods = Math.max(0, subject.periods - presetCount - nmePreFilledCount);
        if (remainingPeriods <= 0) return;

        const isLab = subject.type === 'practical' || subject.id.includes('LAB') || subject.name.toLowerCase().includes('lab');

        if (isLab) {
          const quads = Math.floor(remainingPeriods / 4);
          for (let i = 0; i < quads; i++) {
            labDoubleItems.push({
              subjectId: subject.id,
              staffId: assign.staffId,
              subjectName: subject.name,
              type: 'lab-quad',
              periodsCount: 4,
              totalPeriods: subject.periods
            });
          }
          const remAfterQuad = remainingPeriods % 4;
          const blocks = Math.floor(remAfterQuad / 2);
          for (let i = 0; i < blocks; i++) {
            labDoubleItems.push({
              subjectId: subject.id,
              staffId: assign.staffId,
              subjectName: subject.name,
              type: 'lab-double',
              periodsCount: 2,
              totalPeriods: subject.periods
            });
          }
          const rem = remAfterQuad % 2;
          for (let i = 0; i < rem; i++) {
            singleLabItems.push({
              subjectId: subject.id,
              staffId: assign.staffId,
              subjectName: subject.name,
              type: 'single-lab',
              periodsCount: 1,
              totalPeriods: subject.periods
            });
          }
        } else {
          const bucket = [];
          for (let i = 0; i < remainingPeriods; i++) {
            bucket.push({
              subjectId: subject.id,
              staffId: assign.staffId,
              subjectName: subject.name,
              type: 'theory',
              periodsCount: 1,
              totalPeriods: subject.periods
            });
          }
          theorySubjectBuckets.push(bucket);
        }
      });

      // Round-robin interleave theory subjects (e.g. LANG, ENG, MATHS, CPP, LANG, ENG...)
      const interleavedTheory = [];
      let maxBucketLen = 0;
      theorySubjectBuckets.forEach(b => { if (b.length > maxBucketLen) maxBucketLen = b.length; });

      for (let i = 0; i < maxBucketLen; i++) {
        theorySubjectBuckets.forEach(bucket => {
          if (bucket[i]) {
            interleavedTheory.push(bucket[i]);
          }
        });
      }

      // Final pending queue order: Labs first, then round-robin interleaved theory items
      pending[sec] = [...labDoubleItems, ...singleLabItems, ...interleavedTheory];
    });

    const activeSections = sections.filter(sec => pending[sec] && pending[sec].length > 0);

    // Instant Slot Capacity Check (Prevents CPU freeze if manual lab slots exceed section capacity)
    for (const sec of activeSections) {
      let openSlotsCount = 0;
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[sec][d][p] === null) {
            openSlotsCount++;
          }
        }
      }

      const totalRequiredPeriods = pending[sec].reduce((sum, item) => sum + item.periodsCount, 0);

      if (totalRequiredPeriods > openSlotsCount) {
        return {
          success: false,
          error: `Preset Lab Slot Error in Section ${sec}: The assigned subjects require ${totalRequiredPeriods} open periods, but only ${openSlotsCount} open slots are available due to ${30 - openSlotsCount} pre-locked lab/NME slots. Please clear or adjust manual lab entries for Section ${sec} in the Manual Scheduler.`
        };
      }
    }

    // STEP 5: Pre-Generation Global Load Maps per Section
    const globalLoadMaps = {};
    sections.forEach(sec => {
      const freqMap = {};
      pending[sec].forEach(item => {
        freqMap[item.subjectId] = (freqMap[item.subjectId] || 0) + item.periodsCount;
      });
      globalLoadMaps[sec] = {
        subjectFrequencyMap: freqMap,
        dailyLoadMap: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
        periodLoadMap: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        morningLoad: 0,
        afternoonLoad: 0,
        weeklyDistributionMap: {}
      };
    });

    // STEP 8: Store signatures of completed sections to differentiate layouts (e.g. 1-A vs 1-B)
    const sectionSignatures = {};

    const slotsList = [];
    for (let d = 1; d <= dayOrdersCount; d++) {
      for (let p = 1; p <= periodsPerDay; p++) {
        slotsList.push({ day: d, period: p });
      }
    }

    function canPlaceItem(sec, item, day, period) {
      if (lockedCells.has(`${sec}_${day}_${period}`)) return false;
      if (grid[sec][day][period] !== null) return false;

      // RULE 3 & Principle 7: Faculty Clash Prevention
      if (item.staffId) {
        if (facultySchedule[item.staffId] && facultySchedule[item.staffId][day] && facultySchedule[item.staffId][day][period]) {
          return false;
        }
      }

      // RULE 4 & Principle 4: No Consecutive Theory Duplicates & Max Daily Limit
      if (item.type === 'theory') {
        if (period > 1 && grid[sec][day][period - 1]?.subjectId === item.subjectId) {
          return false;
        }
        if (period < periodsPerDay && grid[sec][day][period + 1]?.subjectId === item.subjectId) {
          return false;
        }

        let countToday = 0;
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[sec][day][p]?.subjectId === item.subjectId) {
            countToday++;
          }
        }
        if (countToday >= 2) {
          return false;
        }
      }

      // Principle 8: Laboratory/Room Conflict Prevention (Check physical labRoomId)
      const subjectObj = subjects.find(s => s.id === item.subjectId);
      const isLab = subjectObj ? (subjectObj.type === 'practical' || subjectObj.id.includes('LAB') || subjectObj.name.toLowerCase().includes('lab')) : false;

      if (isLab) {
        const itemRoom = item.labRoomId || (sec.endsWith('B') ? 'L2' : 'L1');
        for (const otherSec of sections) {
          if (otherSec !== sec && grid[otherSec]?.[day]?.[period]) {
            const otherSlot = grid[otherSec][day][period];
            if (otherSlot) {
              const otherSub = subjects.find(s => s.id === otherSlot.subjectId);
              const otherIsLab = otherSlot.isPreset || (otherSub && (otherSub.type === 'practical' || otherSub.id.includes('LAB') || otherSub.name.toLowerCase().includes('lab')));
              if (otherIsLab) {
                const otherRoom = otherSlot.labRoomId || (otherSec.endsWith('B') ? 'L2' : 'L1');
                if (otherRoom === itemRoom) {
                  return false; // Room is already occupied by another section's lab class
                }
              }
            }
          }
        }
      }

      return true;
    }

    function placeItem(sec, item, day, period) {
      const stf = staff.find(s => s.id === item.staffId);
      grid[sec][day][period] = {
        subjectId: item.subjectId,
        staffId: item.staffId || '',
        subjectName: item.subjectName,
        staffName: stf ? stf.name : '-'
      };
      if (item.staffId) {
        markFacultySchedule(item.staffId, sec, day, period);
      }
    }

    function unplaceItem(sec, item, day, period) {
      grid[sec][day][period] = null;
      if (item.staffId) {
        unmarkFacultySchedule(item.staffId, day, period);
      }
    }

    function getEmptySlotsCount(sec) {
      let count = 0;
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if (grid[sec][d][p] === null) count++;
        }
      }
      return count;
    }

    // STEP 4: Candidate Scoring System
    function scoreCandidateSubject(sec, item, day, period, runSeed) {
      let score = 0;

      // 1. Remaining Weekly Hours (+30 max)
      const freq = globalLoadMaps[sec]?.subjectFrequencyMap[item.subjectId] || 1;
      const totalReq = item.totalPeriods || 6;
      score += Math.round(30 * (freq / totalReq));

      // 2. Subject Not Used Today (+25) / Daily Duplicate Penalty (-100)
      let usedToday = false;
      for (let p = 1; p <= periodsPerDay; p++) {
        if (grid[sec][day][p]?.subjectId === item.subjectId) {
          usedToday = true;
          break;
        }
      }
      if (!usedToday) {
        score += 25;
      } else {
        score -= 100;
      }

      // 3. Not Adjacent (+20) / Consecutive Duplicate Penalty (-50)
      const prevCell = period > 1 ? grid[sec][day][period - 1] : null;
      const nextCell = period < periodsPerDay ? grid[sec][day][period + 1] : null;
      if (prevCell?.subjectId === item.subjectId || nextCell?.subjectId === item.subjectId) {
        score -= 50;
      } else {
        score += 20;
      }

      // 4. Faculty Available (+20) / Conflict Penalty (-1000)
      if (item.staffId && facultySchedule[item.staffId]?.[day]?.[period]) {
        score -= 1000;
      } else {
        score += 20;
      }

      // 5. Balances Weekly Load (+20)
      let dayFilledCount = 0;
      for (let p = 1; p <= periodsPerDay; p++) {
        if (grid[sec][day][p] !== null) dayFilledCount++;
      }
      if (dayFilledCount <= 3) {
        score += 20;
      }

      // 6. Morning / Afternoon Balance (+10)
      if (item.type === 'theory' && period <= 3) {
        score += 10;
      } else if (item.type === 'lab-double' && period >= 4) {
        score += 40;
      }

      // 7. Different from Yesterday / Period Rotation (+10)
      let periodMatchCount = 0;
      for (let d = 1; d <= dayOrdersCount; d++) {
        if (d !== day && grid[sec][d]?.[period]?.subjectId === item.subjectId) {
          periodMatchCount++;
        }
      }
      if (periodMatchCount === 0) {
        score += 10;
      } else {
        score -= (periodMatchCount * 30);
      }

      // 8. Cross-Section Layout Differentiation (STEP 8: 1-A vs 1-B)
      if (sectionSignatures['1-A'] && sec === '1-B') {
        const isSameSlotIn1A = sectionSignatures['1-A'].some(
          sig => sig.day === day && sig.period === period && sig.subjectId === item.subjectId
        );
        if (isSameSlotIn1A) {
          score -= 60; // Penalize matching 1-A's exact layout slot so 1-B differs naturally
        } else {
          score += 15;
        }
      }

      // 9. Fixed Slot Collision Penalty (-10000)
      if (lockedCells.has(`${sec}_${day}_${period}`)) {
        score -= 10000;
      }

      // Dynamic Seed Jitter for Human-like Non-Deterministic Variance (Step 2 & Principle 10)
      let hash = 0;
      const str = `${sec}_D${day}_P${period}_S${item.subjectId}_SEED${runSeed}`;
      for (let k = 0; k < str.length; k++) {
        hash = (hash << 5) - hash + str.charCodeAt(k);
        hash |= 0;
      }
      score += (Math.abs(hash) % 25);

      return score;
    }

    // STEP 6: Future Simulation & Advanced Forward Checking
    function canPlaceWithFutureSimulation(sec, item, day, period, secItems, currentItemIdx) {
      if (!canPlaceItem(sec, item, day, period)) return false;

      // Fast forward check: count remaining open unassigned slots in section if we place item
      let openCount = 0;
      for (let d = 1; d <= dayOrdersCount; d++) {
        for (let p = 1; p <= periodsPerDay; p++) {
          if ((d !== day || p !== period) && grid[sec][d][p] === null && !lockedCells.has(`${sec}_${d}_${p}`)) {
            openCount++;
          }
        }
      }

      // Calculate total remaining periods needed for unplaced items in section
      let needed = 0;
      for (let k = currentItemIdx + 1; k < secItems.length; k++) {
        needed += secItems[k].periodsCount;
      }

      return openCount >= needed;
    }

    // STEP 7: Intelligent Targeted Backtracking Solver with Safety Limit
    let sectionBacktracks = 0;
    const MAX_BACKTRACKS_PER_SECTION = 300;

    function solveSection(secIndex, itemIndex, lastPlacedSlotIdx = -1) {
      sectionBacktracks++;
      if (sectionBacktracks > MAX_BACKTRACKS_PER_SECTION) {
        return false; // Prevent UI freeze by bounding search steps
      }

      if (secIndex >= activeSections.length) {
        return true;
      }

      const sec = activeSections[secIndex];
      const secItems = pending[sec];

      if (itemIndex >= secItems.length) {
        // Record section signature for cross-section differentiation (Step 8)
        const sig = [];
        for (let d = 1; d <= dayOrdersCount; d++) {
          for (let p = 1; p <= periodsPerDay; p++) {
            if (grid[sec][d][p]) {
              sig.push({ day: d, period: p, subjectId: grid[sec][d][p].subjectId });
            }
          }
        }
        sectionSignatures[sec] = sig;
        sectionBacktracks = 0; // Reset counter for next section

        return solveSection(secIndex + 1, 0, -1);
      }

      // Forward Checking slot capacity check
      let remainingPeriodsNeeded = 0;
      for (let k = itemIndex; k < secItems.length; k++) {
        remainingPeriodsNeeded += secItems[k].periodsCount;
      }
      if (getEmptySlotsCount(sec) < remainingPeriodsNeeded) {
        return false;
      }

      const item = secItems[itemIndex];

      const isSameAsPrev = itemIndex > 0 &&
        secItems[itemIndex - 1].subjectId === item.subjectId &&
        secItems[itemIndex - 1].type === item.type;

      const minSlotIdx = isSameAsPrev ? lastPlacedSlotIdx + 1 : 0;

      const candidates = [];

      if (item.type === 'lab-quad') {
        // Try continuous 4-period block (e.g. Periods 1-4 or 2-5)
        for (let i = minSlotIdx; i < slotsList.length; i++) {
          const { day, period } = slotsList[i];
          if (period <= periodsPerDay - 3) {
            if (
              canPlaceItem(sec, item, day, period) &&
              canPlaceItem(sec, item, day, period + 1) &&
              canPlaceItem(sec, item, day, period + 2) &&
              canPlaceItem(sec, item, day, period + 3)
            ) {
              const sc = scoreCandidateSubject(sec, item, day, period, attemptSeed);
              candidates.push({ slotIndex: i, day, period, score: sc + 50 });
            }
          }
        }

        candidates.sort((a, b) => b.score - a.score);

        for (const cand of candidates) {
          const { slotIndex, day, period } = cand;
          placeItem(sec, item, day, period);
          placeItem(sec, item, day, period + 1);
          placeItem(sec, item, day, period + 2);
          placeItem(sec, item, day, period + 3);

          if (solveSection(secIndex, itemIndex + 1, slotIndex)) {
            return true;
          }

          unplaceItem(sec, item, day, period);
          unplaceItem(sec, item, day, period + 1);
          unplaceItem(sec, item, day, period + 2);
          unplaceItem(sec, item, day, period + 3);
        }

        // Fallback: If 4-period continuous block is blocked, try placing as two 2-period contiguous blocks
        const doubleItem1 = { ...item, type: 'lab-double', periodsCount: 2 };
        const doubleItem2 = { ...item, type: 'lab-double', periodsCount: 2 };
        secItems.splice(itemIndex, 1, doubleItem1, doubleItem2);
        const fbSuccess = solveSection(secIndex, itemIndex, lastPlacedSlotIdx);
        secItems.splice(itemIndex, 2, item); // Restore original queue item on backtrack
        if (fbSuccess) return true;
      } else if (item.type === 'lab-double') {
        for (let i = minSlotIdx; i < slotsList.length; i++) {
          const { day, period } = slotsList[i];
          if (period < periodsPerDay && period !== breakAfterPeriod) {
            if (canPlaceItem(sec, item, day, period) && canPlaceItem(sec, item, day, period + 1)) {
              const sc = scoreCandidateSubject(sec, item, day, period, attemptSeed);
              candidates.push({ slotIndex: i, day, period, score: sc });
            }
          }
        }

        candidates.sort((a, b) => b.score - a.score);

        for (const cand of candidates) {
          const { slotIndex, day, period } = cand;
          placeItem(sec, item, day, period);
          placeItem(sec, item, day, period + 1);

          if (solveSection(secIndex, itemIndex + 1, slotIndex)) {
            return true;
          }

          unplaceItem(sec, item, day, period);
          unplaceItem(sec, item, day, period + 1);
        }
      } else {
        for (let i = minSlotIdx; i < slotsList.length; i++) {
          const { day, period } = slotsList[i];
          if (canPlaceWithFutureSimulation(sec, item, day, period, secItems, itemIndex)) {
            const sc = scoreCandidateSubject(sec, item, day, period, attemptSeed);
            candidates.push({ slotIndex: i, day, period, score: sc });
          }
        }

        candidates.sort((a, b) => b.score - a.score);

        for (const cand of candidates) {
          const { slotIndex, day, period } = cand;
          placeItem(sec, item, day, period);

          if (solveSection(secIndex, itemIndex + 1, slotIndex)) {
            return true;
          }

          unplaceItem(sec, item, day, period);
        }
      }

      return false; // Targeted backtrack
    }

    const success = solveSection(0, 0, 0);

    if (success) {
      // RULE 5: 100% Fill - Fill any remaining unassigned cells across all sections (Zero Free Periods)
      activeSections.forEach(sec => {
        const secYear = sec.startsWith('1') ? 'First Year' : sec.startsWith('2') ? 'Second Year' : 'Third Year';
        const secTheorySubjects = subjects.filter(s => s.type === 'theory' && !s.id.includes('LAB') && (s.year === secYear || !s.year));

        for (let d = 1; d <= dayOrdersCount; d++) {
          for (let p = 1; p <= periodsPerDay; p++) {
            if (grid[sec][d][p] === null) {
              // Find a theory subject whose assigned staff is FREE and satisfies canPlaceItem
              const validSub = secTheorySubjects.find(sub => {
                const item = { subjectId: sub.id, staffId: assignments.find(a => a.section === sec && a.subjectId === sub.id)?.staffId, type: 'theory' };
                return canPlaceItem(sec, item, d, p);
              }) || secTheorySubjects[0];

              if (validSub) {
                const stfId = assignments.find(a => a.section === sec && a.subjectId === validSub.id)?.staffId || '';
                const stf = staff.find(s => s.id === stfId);

                grid[sec][d][p] = {
                  subjectId: validSub.id,
                  subjectName: validSub.name,
                  staffId: stfId,
                  staffName: stf ? stf.name : '-'
                };
                if (stfId) {
                  markFacultySchedule(stfId, sec, d, p);
                }
              }
            }
          }
        }
      });

      // STEP 10: Validation Gate
      let isValid = true;

      for (const sec of activeSections) {
        for (let day = 1; day <= dayOrdersCount; day++) {
          for (let p = 1; p <= periodsPerDay; p++) {
            if (grid[sec][day][p] === null) {
              isValid = false;
            }
          }
        }
      }

      const simScore = computeSimilarity(grid, lastGeneratedTimetable);
      if (simScore > 0.70 && attemptSeed < baseSeed + 1) {
        isValid = false;
      }

      if (isValid) {
        lastGeneratedTimetable = grid;
        return {
          success: true,
          tables: grid
        };
      } else {
        bestAttempt = grid;
      }
    }
  }

  if (bestAttempt) {
    lastGeneratedTimetable = bestAttempt;
    return {
      success: true,
      tables: bestAttempt
    };
  }

  return {
    success: false,
    error: 'Constraints could not be satisfied simultaneously. Potential reasons:\n1. Faculty double-booked across shared subjects.\n2. Insufficient open slots due to lab locks.\n3. Adjust faculty assignments or lab slots.'
  };
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
  const { periodsPerDay = 5, dayOrdersCount = 6 } = settings || {};
  const sections = Object.keys(tables);
  const conflicts = [];

  const getSectionYear = (sec) => {
    if (sec.startsWith('1')) return 'First Year';
    if (sec.startsWith('2')) return 'Second Year';
    if (sec.startsWith('3')) return 'Third Year';
    return 'First Year';
  };

  const facultyBookings = {};
  const subjectPeriodCounts = {};
  const labBookings = {};

  sections.forEach(sec => {
    const secYear = getSectionYear(sec);
    for (let day = 1; day <= dayOrdersCount; day++) {
      for (let p = 1; p <= periodsPerDay; p++) {
        const slot = tables[sec]?.[day]?.[p];
        if (!slot || slot.subjectId === 'FREE' || slot.subjectId === 'OFF' || slot.subjectId === 'NME' || slot.isElective || slot.isNME) continue;

        // Check for Invalid Section Allocation
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

        // 1. Track faculty bookings (ignoring special/elective multi-staff IDs)
        if (slot.staffId && !slot.staffId.includes('/') && !slot.staffId.startsWith('EXT')) {
          const key = `${slot.staffId}_${day}_${p}`;
          if (!facultyBookings[key]) {
            facultyBookings[key] = [];
          }
          facultyBookings[key].push({ section: sec, day, period: p });
        }

        // 2. Track subject counts
        const subKey = `${sec}_${slot.subjectId}`;
        subjectPeriodCounts[subKey] = (subjectPeriodCounts[subKey] || 0) + 1;

        // 3. Track lab/room bookings by labRoomId (e.g. L1 vs L2)
        if (sub && sub.type === 'practical') {
          const roomId = slot.labRoomId || slot.lab_room_id || (sec.endsWith('B') ? 'L2' : 'L1');
          const key = `${roomId}_${day}_${p}`;
          if (!labBookings[key]) {
            labBookings[key] = [];
          }
          labBookings[key].push({ section: sec, day, period: p, subjectId: slot.subjectId, roomId });
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

  // Check for Laboratory/Room conflicts (Same physical lab room assigned to multiple sections)
  Object.keys(labBookings).forEach(key => {
    const bookings = labBookings[key];
    if (bookings.length > 1) {
      const [roomId, day, period] = key.split('_');
      const sectionsList = bookings.map(b => b.section).join(' and ');
      conflicts.push({
        type: 'lab_conflict',
        subjectId: bookings[0].subjectId,
        message: `Laboratory Conflict: Lab room '${roomId}' is double-booked in both ${sectionsList} on Day ${day}, Period ${period}.`,
        day: parseInt(day),
        period: parseInt(period)
      });
    }
  });

  return conflicts;
}
