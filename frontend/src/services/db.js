/**
 * ChronoAI — Database Service (MySQL Backend via Express API)
 * Falls back to localStorage when server is unavailable (offline mode).
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';
import { validateSectionPeriods, validateSchedulerData } from './validation.js';

// ─── localStorage helpers (fallback + session storage) ────────────────────────
const LS = {
  get: (key, fallback = null) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  },
  remove: (key) => {
    try { localStorage.removeItem(key); } catch {}
  }
};

// Default data for offline/localStorage fallback
const DEFAULT_SETTINGS = {
  periodsPerDay: 5,
  dayOrdersCount: 6,
  breakAfterPeriod: 3,
  timings: {
    1: '02:00 PM - 02:50 PM',
    2: '02:50 PM - 03:40 PM',
    3: '03:40 PM - 04:30 PM',
    break: '04:30 PM - 04:50 PM',
    4: '04:50 PM - 05:40 PM',
    5: '05:40 PM - 06:30 PM'
  }
};

const DEFAULT_STAFF = [];
const DEFAULT_SUBJECTS = [];
const DEFAULT_ASSIGNMENTS = [];

// Initialise localStorage fallback defaults
function initLocalFallback() {
  const currentStaff = LS.get('_staff');
  if (!currentStaff || (Array.isArray(currentStaff) && currentStaff.some(s => s.id === 'STF001' || s.name === 'Sangeetha'))) {
    LS.set('_staff', []);
  }
  const currentSubjects = LS.get('_subjects');
  if (!currentSubjects || (Array.isArray(currentSubjects) && currentSubjects.some(s => s.id === 'CS101' || s.name === 'Java'))) {
    LS.set('_subjects', []);
  }
  const currentAssignments = LS.get('_assignments');
  if (!currentAssignments || (Array.isArray(currentAssignments) && currentAssignments.some(a => a.staffId === 'STF001' || a.subjectId === 'CS101'))) {
    LS.set('_assignments', []);
  }
  if (!LS.get('_settings')) LS.set('_settings', DEFAULT_SETTINGS);
  if (!LS.get('_timetable')) LS.set('_timetable', { status: 'draft', tables: null });
  if (!LS.get('_labSlots')) LS.set('_labSlots', []);
  if (!LS.get('_emailLogs')) LS.set('_emailLogs', []);
  if (!LS.get('_sessions')) LS.set('_sessions', []);
  if (!LS.get('_notifications')) LS.set('_notifications', []);
}

initLocalFallback();

// ─── API helper ────────────────────────────────────────────────────────────────
async function apiCall(method, endpoint, body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${endpoint}`, opts);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null, offline: true };
  }
}


// ─── Public DB API ─────────────────────────────────────────────────────────────
export const db = {

  // ── Authentication ──────────────────────────────────────────────────────────
  async login(role, idOrEmail, password) {
    const res = await apiCall('POST', '/auth/login', { role, idOrEmail, password });
    if (res.ok && res.data?.success) {
      LS.set('_currentUser', res.data.user);
      // Track session locally too
      const sessions = LS.get('_sessions', []);
      sessions.unshift({ id: res.data.user.sessionId, user_role: role, user_id: res.data.user.id || 'HOD', user_name: res.data.user.name, user_email: res.data.user.email, login_at: new Date().toISOString(), is_active: 1 });
      LS.set('_sessions', sessions.slice(0, 100));
      return res.data;
    }

    // Offline fallback
    if (role === 'hod') {
      if (idOrEmail?.toLowerCase() === 'hod@college.edu' && password === 'Admin123') {
        const user = { role: 'hod', name: 'HOD Admin', email: 'hod@college.edu', sessionId: `sess_${Date.now()}` };
        LS.set('_currentUser', user);
        return { success: true, user };
      }
      return { success: false, error: 'Invalid HOD credentials.' };
    }
    if (role === 'staff') {
      const staffList = LS.get('_staff', []);
      const s = staffList.find(st => (st.id.toLowerCase() === idOrEmail?.toLowerCase() || st.email.toLowerCase() === idOrEmail?.toLowerCase()) && st.password === password);
      if (s) {
        const user = { role: 'staff', name: s.name, id: s.id, email: s.email, sessionId: `sess_${Date.now()}` };
        LS.set('_currentUser', user);
        return { success: true, user };
      }
      return { success: false, error: 'Invalid credentials.' };
    }
    return { success: false, error: 'Unknown role.' };
  },

  async logout() {
    const user = this.getCurrentUser();
    if (user?.sessionId) {
      // Mark session as inactive in localStorage
      const sessions = LS.get('_sessions', []);
      const idx = sessions.findIndex(s => s.id === user.sessionId);
      if (idx !== -1) { sessions[idx].is_active = 0; sessions[idx].logout_at = new Date().toISOString(); }
      LS.set('_sessions', sessions);
      await apiCall('POST', '/auth/logout', { sessionId: user.sessionId });
    }
    LS.remove('_currentUser');
  },

  getCurrentUser() {
    try {
      const u = LS.get('_currentUser');
      if (u && typeof u === 'object' && u.role) return u;
      LS.remove('_currentUser');
      return null;
    } catch {
      LS.remove('_currentUser');
      return null;
    }
  },

  // ── Staff ───────────────────────────────────────────────────────────────────
  async getStaff() {
    const res = await apiCall('GET', '/staff');
    if (res.ok) { LS.set('_staff', res.data); return res.data; }
    return LS.get('_staff', []);
  },

  async addStaff({ name, email, password }) {
    const res = await apiCall('POST', '/staff', { name, email, password });
    if (res.ok) { await this.getStaff(); return res.data; }
    if (res.data?.error) throw new Error(res.data.error);
    // Offline fallback
    const staffList = LS.get('_staff', []);
    if (staffList.some(s => s.email.toLowerCase() === email.toLowerCase())) throw new Error('Email already exists.');
    if (!/[A-Z]/.test(password)) throw new Error('Password must contain at least one uppercase letter.');
    const maxNum = staffList.reduce((m, s) => Math.max(m, parseInt(s.id.replace('STF',''), 10)), 0);
    const newStaff = { id: `STF${String(maxNum+1).padStart(3,'0')}`, name, email, password };
    staffList.push(newStaff);
    LS.set('_staff', staffList);
    return newStaff;
  },

  async updateStaff(id, data) {
    const res = await apiCall('PUT', `/staff/${id}`, data);
    if (res.ok) { await this.getStaff(); return; }
    if (res.data?.error) throw new Error(res.data.error);
    const staffList = LS.get('_staff', []);
    const idx = staffList.findIndex(s => s.id === id);
    if (idx !== -1) { staffList[idx] = { ...staffList[idx], ...data }; LS.set('_staff', staffList); }
  },

  async deleteStaff(id) {
    await apiCall('DELETE', `/staff/${id}`);
    const staffList = LS.get('_staff', []).filter(s => s.id !== id);
    LS.set('_staff', staffList);
    const asgns = LS.get('_assignments', []).filter(a => a.staffId !== id);
    LS.set('_assignments', asgns);
  },

  // ── Subjects ────────────────────────────────────────────────────────────────
  async getSubjects() {
    const res = await apiCall('GET', '/subjects');
    if (res.ok) { LS.set('_subjects', res.data); return res.data; }
    return LS.get('_subjects', []);
  },

  async addSubject({ id, name, type, periods, year }) {
    const res = await apiCall('POST', '/subjects', { id, name, type, periods, year });
    if (res.ok) { await this.getSubjects(); return; }
    if (res.data?.error) throw new Error(res.data.error);
    const subjects = LS.get('_subjects', []);
    if (subjects.some(s => s.id.toLowerCase() === id.toLowerCase())) throw new Error('Subject Code already exists.');
    subjects.push({ id, name, type, periods: parseInt(periods), year: year || 'First Year' });
    LS.set('_subjects', subjects);
  },

  async updateSubject(id, { name, type, periods, year }) {
    const res = await apiCall('PUT', `/subjects/${id}`, { name, type, periods, year });
    if (res.ok) { await this.getSubjects(); return; }
    if (res.data?.error) throw new Error(res.data.error);
    const subjects = LS.get('_subjects', []);
    const idx = subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      subjects[idx] = { ...subjects[idx], name, type, periods: parseInt(periods), year: year || 'First Year' };
      LS.set('_subjects', subjects);
    }
  },

  async deleteSubject(id) {
    await apiCall('DELETE', `/subjects/${id}`);
    LS.set('_subjects', LS.get('_subjects', []).filter(s => s.id !== id));
    LS.set('_assignments', LS.get('_assignments', []).filter(a => a.subjectId !== id));
  },

  // ── Assignments ──────────────────────────────────────────────────────────────
  async getAssignments() {
    const res = await apiCall('GET', '/subjects/assignments');
    if (res.ok) {
      // Normalize MySQL column names (subject_id → subjectId, staff_id → staffId)
      const normalized = res.data.map(a => ({
        section: a.section,
        subjectId: a.subject_id || a.subjectId,
        staffId: a.staff_id || a.staffId
      }));
      LS.set('_assignments', normalized);
      return normalized;
    }
    return LS.get('_assignments', []);
  },

  async saveAssignments(assignments) {
    LS.set('_assignments', assignments);
    await apiCall('POST', '/subjects/assignments/batch', { assignments });
  },

  async updateAssignment(section, subjectId, staffId) {
    LS.set('_assignments', LS.get('_assignments', []).map(a => {
      if (a.section === section && a.subjectId === subjectId) return { ...a, staffId };
      return a;
    }));
    await apiCall('POST', '/subjects/assignments', { section, subjectId, staffId });
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  async getSettings() {
    const res = await apiCall('GET', '/settings');
    if (res.ok) {
      const settings = { ...DEFAULT_SETTINGS, ...res.data };
      // Coerce types
      settings.periodsPerDay = parseInt(settings.periodsPerDay);
      settings.dayOrdersCount = parseInt(settings.dayOrdersCount);
      settings.breakAfterPeriod = parseInt(settings.breakAfterPeriod);
      LS.set('_settings', settings);
      return settings;
    }
    return LS.get('_settings', DEFAULT_SETTINGS);
  },

  async saveSetting(key, value) {
    const settings = LS.get('_settings', DEFAULT_SETTINGS);
    settings[key] = value;
    LS.set('_settings', settings);
    await apiCall('PUT', '/settings', { key, value });
  },

  async saveSettings(settingsObj) {
    LS.set('_settings', settingsObj);
    for (const [key, value] of Object.entries(settingsObj)) {
      await apiCall('PUT', '/settings', { key, value });
    }
  },

  // ── Timetable ───────────────────────────────────────────────────────────────
  async getTimetable() {
    const res = await apiCall('GET', '/timetable');
    if (res.ok) { LS.set('_timetable', res.data); return res.data; }
    return LS.get('_timetable', { status: 'draft', tables: null });
  },

  async saveTimetable(tables, status = 'draft') {
    LS.set('_timetable', { status, tables, updatedAt: new Date().toISOString() });
    await apiCall('PUT', '/timetable', { tables, status });
  },

  async publishTimetable(tables) {
    LS.set('_timetable', { status: 'published', tables, updatedAt: new Date().toISOString() });
    const res = await apiCall('POST', '/timetable/publish', { tables });
    if (!res.ok) {
      // Offline fallback: add notification locally
      this.addNotificationLocal('Timetable Published', 'HOD published the academic timetable.', 'all');
    }
  },

  // ── Lab Slots ────────────────────────────────────────────────────────────────
  async getLabSlots() {
    const res = await apiCall('GET', '/lab-slots');
    if (res.ok) { LS.set('_labSlots', res.data); return res.data; }
    return LS.get('_labSlots', []);
  },

  async setLabSlot({ section, dayOrder, period, subjectId, staffId }) {
    const slots = LS.get('_labSlots', []);
    const key = s => `${s.section}_${s.day_order || s.dayOrder}_${s.period}`;
    const idx = slots.findIndex(s => key(s) === `${section}_${dayOrder}_${period}`);
    const newSlot = { section, day_order: dayOrder, dayOrder, period, subject_id: subjectId, staff_id: staffId, subjectId, staffId };
    if (idx !== -1) slots[idx] = newSlot; else slots.push(newSlot);
    LS.set('_labSlots', slots);
    await apiCall('POST', '/lab-slots', { section, dayOrder, period, subjectId, staffId });
  },

  async removeLabSlot({ section, dayOrder, period }) {
    const slots = LS.get('_labSlots', []).filter(s => !(s.section === section && (s.day_order || s.dayOrder) == dayOrder && s.period == period));
    LS.set('_labSlots', slots);
    await apiCall('DELETE', '/lab-slots', { section, dayOrder, period });
  },

  // ── Notifications ────────────────────────────────────────────────────────────
  async getNotifications() {
    const res = await apiCall('GET', '/email-logs/notifications');
    if (res.ok) return res.data;
    return LS.get('_notifications', []);
  },

  addNotificationLocal(title, message, recipientId = 'all') {
    const list = LS.get('_notifications', []);
    list.unshift({ id: `N${Date.now()}`, title, message, recipient_id: recipientId, created_at: new Date().toISOString() });
    LS.set('_notifications', list);
  },

  // ── Email Logs ───────────────────────────────────────────────────────────────
  async getEmailLogs() {
    const res = await apiCall('GET', '/email-logs');
    if (res.ok) { LS.set('_emailLogs', res.data); return res.data; }
    return LS.get('_emailLogs', []);
  },

  async sendStaffEmail(staffId, subject, body) {
    const res = await apiCall('POST', '/email-logs', { staffId, subject, body });
    if (res.ok) { await this.getEmailLogs(); return; }
    if (res.data?.error) throw new Error(res.data.error);
    
    // Offline fallback
    const logs = LS.get('_emailLogs', []);
    if (staffId === 'all') {
      const staffList = LS.get('_staff', []);
      const log = {
        id: `LOG_${Date.now()}`,
        recipient_email: 'all@college.edu',
        recipient_name: 'All Staff',
        subject,
        body,
        is_broadcast: 1,
        recipient_count: staffList.length,
        status: 'success',
        sender: 'HOD Admin',
        sent_at: new Date().toISOString()
      };
      logs.unshift(log);
      LS.set('_emailLogs', logs);
      this.addNotificationLocal(subject, body, 'all');
    } else {
      const staffList = LS.get('_staff', []);
      const s = staffList.find(st => st.id === staffId);
      if (!s) throw new Error('Staff not found');
      const log = {
        id: `LOG_${Date.now()}`,
        recipient_email: s.email,
        recipient_name: s.name,
        subject,
        body,
        is_broadcast: 0,
        recipient_count: 1,
        status: 'success',
        sender: 'HOD Admin',
        sent_at: new Date().toISOString()
      };
      logs.unshift(log);
      LS.set('_emailLogs', logs);
      this.addNotificationLocal(subject, body, s.id);
    }
  },

  async clearEmailLogs() {
    LS.set('_emailLogs', []);
    await apiCall('DELETE', '/email-logs');
  },

  // ── Sessions / Active Users ──────────────────────────────────────────────────
  async getSessions() {
    const res = await apiCall('GET', '/sessions');
    if (res.ok) return res.data;
    return LS.get('_sessions', []);
  },

  async getActiveSessions() {
    const res = await apiCall('GET', '/sessions/active');
    if (res.ok) return res.data;
    return LS.get('_sessions', []).filter(s => s.is_active);
  },

  // ── Simulation Logs (legacy alias) ──────────────────────────────────────────
  async getSimLogs() {
    return this.getEmailLogs();
  },

  async clearSimLogs() {
    return this.clearEmailLogs();
  },

  // ── Pre-generation Validation ───────────────────────────────────────────────
  async validateTimetableData(staff, subjects, assignments, settings) {
    const res = await apiCall('POST', '/timetable/validate', { staff, subjects, assignments, settings });
    if (res.ok && res.data) return res.data;
    // Fallback to client-side validation logic
    return validateSchedulerData(staff, subjects, assignments, settings);
  }
};

