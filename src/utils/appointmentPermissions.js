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
