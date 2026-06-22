/**
 * Restrizione modifiche appuntamenti: i dipendenti non possono creare/modificare/eliminare
 * appuntamenti nei giorni precedenti. Solo l'admin (superadmin) può farlo.
 */

export const getTodayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const isPastDate = (dateStr) => {
  if (!dateStr) return false;
  const s = String(dateStr).split('T')[0];
  return s < getTodayLocal();
};

/**
 * @param {object} auth - { role } da localStorage 'atelier-auth'
 * @param {string} dateStr - data appuntamento o giorno (YYYY-MM-DD)
 * @returns {boolean} true se l'utente può creare/modificare/eliminare in quel giorno
 */
export const canModifyAppointmentsOn = (auth, dateStr) => {
  return auth?.role === 'superadmin' || !isPastDate(dateStr);
};

export const isSuperAdmin = (auth) => auth?.role === 'superadmin';

export const getAuthEmployeeId = (auth) => {
  const raw = auth?.employeeId ?? auth?.employee_id;
  if (raw == null || raw === '') return null;
  const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
  return Number.isNaN(n) ? null : n;
};
