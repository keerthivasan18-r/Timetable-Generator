export const MAX_WEEKLY_PERIODS = 30;

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
  
  if (newTotal > MAX_WEEKLY_PERIODS) {
    const sections = getSectionsFromYear(year);
    const representativeSection = sections[0] || '1-A';
    
    return {
      valid: false,
      section: representativeSection,
      maximum: MAX_WEEKLY_PERIODS,
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
