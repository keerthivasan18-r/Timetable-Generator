import pool from './connection.js';

export async function seedAcademicData() {
  try {
    console.log('🌱 Starting academic structure seeding for B.Sc Computer Science...');

    // 1. Staff Creation (Idempotent)
    const staffList = [
      { name: 'Murugan', email: 'murugan@college.edu' },
      { name: 'Vadivelmurugan', email: 'vadivelmurugan@college.edu' },
      { name: 'Vijaya', email: 'vijaya@college.edu' },
      { name: 'Raja', email: 'raja@college.edu' },
      { name: 'Archana', email: 'archana@college.edu' },
      { name: 'Vidhya', email: 'vidhya@college.edu' },
      { name: 'Tamilarasi', email: 'tamilarasi@college.edu' },
      { name: 'Srilakshmi', email: 'srilakshmi@college.edu' },
      { name: 'Rajam', email: 'rajam@college.edu' },
      { name: 'Kavitha', email: 'kavitha@college.edu' },
      { name: 'Indhu', email: 'indhu@college.edu' },
      { name: 'Sangeetha', email: 'sangeetha@college.edu' },
      { name: 'Sudha', email: 'sudha@college.edu' },
      { name: 'Ponnila', email: 'ponnila@college.edu' },
      { name: 'Poojitha', email: 'poojitha@college.edu' },
      { name: 'Saranya', email: 'saranya@college.edu' },
      { name: 'Lalitha', email: 'lalitha@college.edu' },
      { name: 'Dharani', email: 'dharani@college.edu' },
      { name: 'PJR', email: 'pjr@college.edu' },
      { name: 'Karthika', email: 'karthika@college.edu' },
      { name: 'Outside Faculty', email: 'outside.faculty@college.edu' }
    ];

    const staffMap = {}; // name -> id

    for (let i = 0; i < staffList.length; i++) {
      const s = staffList[i];
      const customId = `STF${String(i + 1).padStart(3, '0')}`;
      const [existing] = await pool.query('SELECT id, name FROM staff WHERE name = ? OR email = ?', [s.name, s.email]);

      if (existing.length > 0) {
        staffMap[s.name] = existing[0].id;
      } else {
        await pool.query(
          'INSERT INTO staff (id, name, email, password) VALUES (?, ?, ?, ?)',
          [customId, s.name, s.email, 'Password123']
        );
        staffMap[s.name] = customId;
      }
    }
    console.log(`✅ ${Object.keys(staffMap).length} Staff members ready.`);

    // 2. Subjects Creation (Idempotent)
    const subjectsList = [
      // First Year (Total 29 core periods + 1 NME slot = 30 periods)
      { id: 'CS101', name: 'Language', type: 'theory', periods: 4, year: 'First Year' },
      { id: 'CS102', name: 'Mathematics', type: 'theory', periods: 4, year: 'First Year' },
      { id: 'CS103', name: 'English', type: 'theory', periods: 4, year: 'First Year' },
      { id: 'CS104', name: 'C++', type: 'theory', periods: 4, year: 'First Year' },
      { id: 'CS105', name: 'C++ Lab', type: 'practical', periods: 4, year: 'First Year' },
      { id: 'CS106', name: 'Web Development', type: 'theory', periods: 5, year: 'First Year' },
      { id: 'CS107', name: 'Web Development Lab', type: 'practical', periods: 4, year: 'First Year' },

      // Second Year (Total 30 periods)
      { id: 'CS201', name: 'Statistics', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS202', name: 'Language', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS203', name: 'AAD', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS204', name: 'English', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS205', name: 'Software Engineering', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS206', name: 'Artificial Intelligence', type: 'theory', periods: 4, year: 'Second Year' },
      { id: 'CS207', name: 'EVS', type: 'theory', periods: 2, year: 'Second Year' },
      { id: 'CS208', name: 'AAD Lab', type: 'practical', periods: 4, year: 'Second Year' },

      // Third Year (Total 30 periods)
      { id: 'CS301', name: 'Mini Project', type: 'practical', periods: 4, year: 'Third Year' },
      { id: 'CS302', name: 'Cloud Computing', type: 'theory', periods: 5, year: 'Third Year' },
      { id: 'CS303', name: 'Computer Networks', type: 'theory', periods: 5, year: 'Third Year' },
      { id: 'CS304', name: 'PHP', type: 'theory', periods: 4, year: 'Third Year' },
      { id: 'CS305', name: 'PHP Lab', type: 'practical', periods: 4, year: 'Third Year' },
      { id: 'CS306', name: 'Information & Data Security', type: 'theory', periods: 4, year: 'Third Year' },
      { id: 'CS307', name: 'Big Data', type: 'theory', periods: 4, year: 'Third Year' }
    ];

    const subjectMap = {}; // name_year -> id

    for (const sub of subjectsList) {
      const key = `${sub.name}_${sub.year}`;
      const [existing] = await pool.query('SELECT id, name FROM subjects WHERE id = ? OR (name = ? AND year = ?)', [sub.id, sub.name, sub.year]);

      if (existing.length > 0) {
        subjectMap[key] = existing[0].id;
        // Update periods and type if needed
        await pool.query('UPDATE subjects SET type = ?, periods = ?, year = ? WHERE id = ?', [sub.type, sub.periods, sub.year, existing[0].id]);
      } else {
        await pool.query(
          'INSERT INTO subjects (id, name, type, periods, year) VALUES (?, ?, ?, ?, ?)',
          [sub.id, sub.name, sub.type, sub.periods, sub.year]
        );
        subjectMap[key] = sub.id;
      }
    }
    console.log(`✅ ${Object.keys(subjectMap).length} Subjects ready.`);

    // 3. Sections & Faculty Assignments (Idempotent)
    const rawAssignments = [
      // 1-A (29 core periods)
      { section: '1-A', subjectName: 'Language', year: 'First Year', facultyName: 'Murugan' },
      { section: '1-A', subjectName: 'Mathematics', year: 'First Year', facultyName: 'Vijaya' },
      { section: '1-A', subjectName: 'English', year: 'First Year', facultyName: 'Archana' },
      { section: '1-A', subjectName: 'C++', year: 'First Year', facultyName: 'Tamilarasi' },
      { section: '1-A', subjectName: 'C++ Lab', year: 'First Year', facultyName: 'Tamilarasi' },
      { section: '1-A', subjectName: 'Web Development', year: 'First Year', facultyName: 'Tamilarasi' },
      { section: '1-A', subjectName: 'Web Development Lab', year: 'First Year', facultyName: 'Tamilarasi' },

      // 1-B (29 core periods)
      { section: '1-B', subjectName: 'Language', year: 'First Year', facultyName: 'Vadivelmurugan' },
      { section: '1-B', subjectName: 'Mathematics', year: 'First Year', facultyName: 'Raja' },
      { section: '1-B', subjectName: 'English', year: 'First Year', facultyName: 'Vidhya' },
      { section: '1-B', subjectName: 'C++', year: 'First Year', facultyName: 'Srilakshmi' },
      { section: '1-B', subjectName: 'C++ Lab', year: 'First Year', facultyName: 'Srilakshmi' },
      { section: '1-B', subjectName: 'Web Development', year: 'First Year', facultyName: 'Srilakshmi' },
      { section: '1-B', subjectName: 'Web Development Lab', year: 'First Year', facultyName: 'Srilakshmi' },

      // 2-A
      { section: '2-A', subjectName: 'Statistics', year: 'Second Year', facultyName: 'Indhu' },
      { section: '2-A', subjectName: 'Language', year: 'Second Year', facultyName: 'Murugan' },
      { section: '2-A', subjectName: 'AAD', year: 'Second Year', facultyName: 'Sangeetha' },
      { section: '2-A', subjectName: 'English', year: 'Second Year', facultyName: 'Archana' },
      { section: '2-A', subjectName: 'Software Engineering', year: 'Second Year', facultyName: 'Ponnila' },
      { section: '2-A', subjectName: 'Artificial Intelligence', year: 'Second Year', facultyName: 'Poojitha' },
      { section: '2-A', subjectName: 'EVS', year: 'Second Year', facultyName: 'Saranya' },
      { section: '2-A', subjectName: 'AAD Lab', year: 'Second Year', facultyName: 'Sangeetha' },

      // 2-B
      { section: '2-B', subjectName: 'Statistics', year: 'Second Year', facultyName: 'Indhu' },
      { section: '2-B', subjectName: 'Language', year: 'Second Year', facultyName: 'Vadivelmurugan' },
      { section: '2-B', subjectName: 'AAD', year: 'Second Year', facultyName: 'Sudha' },
      { section: '2-B', subjectName: 'English', year: 'Second Year', facultyName: 'Vidhya' },
      { section: '2-B', subjectName: 'Software Engineering', year: 'Second Year', facultyName: 'Ponnila' },
      { section: '2-B', subjectName: 'Artificial Intelligence', year: 'Second Year', facultyName: 'Poojitha' },
      { section: '2-B', subjectName: 'EVS', year: 'Second Year', facultyName: 'Ponnila' },
      { section: '2-B', subjectName: 'AAD Lab', year: 'Second Year', facultyName: 'Sudha' },

      // 3-A (Mini Project: Karthika & Saranya parallel)
      { section: '3-A', subjectName: 'Mini Project', year: 'Third Year', facultyNames: ['Karthika', 'Saranya'] },
      { section: '3-A', subjectName: 'Cloud Computing', year: 'Third Year', facultyName: 'Lalitha' },
      { section: '3-A', subjectName: 'Computer Networks', year: 'Third Year', facultyName: 'Karthika' },
      { section: '3-A', subjectName: 'PHP', year: 'Third Year', facultyName: 'Rajam' },
      { section: '3-A', subjectName: 'PHP Lab', year: 'Third Year', facultyName: 'Rajam' },
      { section: '3-A', subjectName: 'Information & Data Security', year: 'Third Year', facultyName: 'Saranya' },
      { section: '3-A', subjectName: 'Big Data', year: 'Third Year', facultyName: 'Dharani' },

      // 3-B
      { section: '3-B', subjectName: 'Mini Project', year: 'Third Year', facultyName: 'Kavitha' },
      { section: '3-B', subjectName: 'Cloud Computing', year: 'Third Year', facultyName: 'Sangeetha' },
      { section: '3-B', subjectName: 'Computer Networks', year: 'Third Year', facultyName: 'Poojitha' },
      { section: '3-B', subjectName: 'PHP', year: 'Third Year', facultyName: 'PJR' },
      { section: '3-B', subjectName: 'PHP Lab', year: 'Third Year', facultyName: 'PJR' },
      { section: '3-B', subjectName: 'Information & Data Security', year: 'Third Year', facultyName: 'Saranya' },
      { section: '3-B', subjectName: 'Big Data', year: 'Third Year', facultyName: 'Dharani' }
    ];

    for (const asgn of rawAssignments) {
      const subId = subjectMap[`${asgn.subjectName}_${asgn.year}`];
      let staffId = '';
      if (asgn.facultyNames && Array.isArray(asgn.facultyNames)) {
        staffId = staffMap[asgn.facultyNames[0]] || '';
      } else if (asgn.facultyName) {
        staffId = staffMap[asgn.facultyName] || '';
      }

      if (subId) {
        const [existing] = await pool.query('SELECT id FROM course_assignments WHERE section = ? AND subject_id = ?', [asgn.section, subId]);
        if (existing.length > 0) {
          await pool.query('UPDATE course_assignments SET staff_id = ? WHERE section = ? AND subject_id = ?', [staffId, asgn.section, subId]);
        } else {
          await pool.query(
            'INSERT INTO course_assignments (section, subject_id, staff_id) VALUES (?, ?, ?)',
            [asgn.section, subId, staffId]
          );
        }
      }
    }
    console.log('✅ Course Assignments for all 6 sections (1-A, 1-B, 2-A, 2-B, 3-A, 3-B) configured.');

    // 4. Elective 1: Professional Elective I (Second Year: 2-A & 2-B)
    const elec1Id = 'ELEC_PROF_I';
    const [elec1Existing] = await pool.query('SELECT id FROM electives WHERE id = ?', [elec1Id]);
    if (elec1Existing.length === 0) {
      await pool.query(
        'INSERT INTO electives (id, name, department, semester, class, academic_year, enabled) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [elec1Id, 'Professional Elective I', 'Computer Science', 3, '2-A', 'Second Year']
      );
    }

    // Seed elective_sections for ELEC_PROF_I (2-A & 2-B)
    for (const sec of ['2-A', '2-B']) {
      await pool.query(
        'INSERT OR IGNORE INTO elective_sections (elective_id, section) VALUES (?, ?)',
        [elec1Id, sec]
      );
    }

    // Courses for Elective 1 (Software Engineering & AI)
    const elec1Courses = [
      { subjectId: subjectMap['Software Engineering_Second Year'] || 'CS205', subjectName: 'Software Engineering', facultyId: staffMap['Ponnila'], hours: 4, cap: 70, count: 58 },
      { subjectId: subjectMap['Artificial Intelligence_Second Year'] || 'CS206', subjectName: 'Artificial Intelligence', facultyId: staffMap['Poojitha'], hours: 4, cap: 70, count: 62 }
    ];

    for (const c of elec1Courses) {
      const [ex] = await pool.query('SELECT id FROM elective_courses WHERE elective_id = ? AND subject_id = ?', [elec1Id, c.subjectId]);
      if (ex.length > 0) {
        await pool.query('UPDATE elective_courses SET faculty_id = ?, weekly_hours = ?, capacity = ?, student_count = ? WHERE id = ?', [c.facultyId, c.hours, c.cap, c.count, ex[0].id]);
      } else {
        await pool.query(
          'INSERT INTO elective_courses (elective_id, subject_id, subject_name, faculty_id, weekly_hours, capacity, student_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [elec1Id, c.subjectId, c.subjectName, c.facultyId, c.hours, c.cap, c.count]
        );
      }
    }

    // Slots for Second Year Elective (2-A & 2-B)
    const defaultSlots2 = [
      { semester: 3, class: '2-A', day: 1, period: 2 },
      { semester: 3, class: '2-A', day: 3, period: 5 },
      { semester: 3, class: '2-A', day: 4, period: 4 },
      { semester: 3, class: '2-A', day: 5, period: 1 },
      { semester: 3, class: '2-B', day: 1, period: 2 },
      { semester: 3, class: '2-B', day: 3, period: 5 },
      { semester: 3, class: '2-B', day: 4, period: 4 },
      { semester: 3, class: '2-B', day: 5, period: 1 }
    ];

    for (const slot of defaultSlots2) {
      await pool.query(
        'INSERT OR IGNORE INTO elective_slots (semester, class, day, period, locked) VALUES (?, ?, ?, ?, 1)',
        [slot.semester, slot.class, slot.day, slot.period]
      );
    }

    // 5. Elective 2: Professional Elective II (Third Year: 3-A & 3-B)
    const elec2Id = 'ELEC_PROF_II';
    const [elec2Existing] = await pool.query('SELECT id FROM electives WHERE id = ?', [elec2Id]);
    if (elec2Existing.length === 0) {
      await pool.query(
        'INSERT INTO electives (id, name, department, semester, class, academic_year, enabled) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [elec2Id, 'Professional Elective II', 'Computer Science', 5, '3-A', 'Third Year']
      );
    }

    // Seed elective_sections for ELEC_PROF_II (3-A & 3-B)
    for (const sec of ['3-A', '3-B']) {
      await pool.query(
        'INSERT OR IGNORE INTO elective_sections (elective_id, section) VALUES (?, ?)',
        [elec2Id, sec]
      );
    }

    const elec2Courses = [
      { subjectId: subjectMap['Information & Data Security_Third Year'] || 'CS306', subjectName: 'Information & Data Security', facultyId: staffMap['Saranya'], hours: 4, cap: 70, count: 60 },
      { subjectId: subjectMap['Big Data_Third Year'] || 'CS307', subjectName: 'Big Data', facultyId: staffMap['Dharani'], hours: 4, cap: 70, count: 60 }
    ];

    for (const c of elec2Courses) {
      const [ex] = await pool.query('SELECT id FROM elective_courses WHERE elective_id = ? AND subject_id = ?', [elec2Id, c.subjectId]);
      if (ex.length > 0) {
        await pool.query('UPDATE elective_courses SET faculty_id = ?, weekly_hours = ?, capacity = ?, student_count = ? WHERE id = ?', [c.facultyId, c.hours, c.cap, c.count, ex[0].id]);
      } else {
        await pool.query(
          'INSERT INTO elective_courses (elective_id, subject_id, subject_name, faculty_id, weekly_hours, capacity, student_count) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [elec2Id, c.subjectId, c.subjectName, c.facultyId, c.hours, c.cap, c.count]
        );
      }
    }

    // Slots for Third Year Elective (3-A & 3-B)
    const defaultSlots3 = [
      { semester: 5, class: '3-A', day: 1, period: 2 },
      { semester: 5, class: '3-A', day: 3, period: 5 },
      { semester: 5, class: '3-A', day: 4, period: 4 },
      { semester: 5, class: '3-A', day: 5, period: 1 },
      { semester: 5, class: '3-B', day: 1, period: 2 },
      { semester: 5, class: '3-B', day: 3, period: 5 },
      { semester: 5, class: '3-B', day: 4, period: 4 },
      { semester: 5, class: '3-B', day: 5, period: 1 }
    ];

    for (const slot of defaultSlots3) {
      await pool.query(
        'INSERT OR IGNORE INTO elective_slots (semester, class, day, period, locked) VALUES (?, ?, ?, ?, 1)',
        [slot.semester, slot.class, slot.day, slot.period]
      );
    }

    console.log('🎉 Academic structure for B.Sc Computer Science populated successfully.');
  } catch (err) {
    console.error('❌ Error seeding academic structure:', err.message);
  }
}
