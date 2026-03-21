/**
 * Finestra date per Appuntamenti / All Calendar: ±4 mesi da oggi (locale).
 * Allineata al filtro GET /appointments?from=&to= per ridurre egress DB.
 */
const MONTHS_OFFSET = 4;

/** Polling per sincronizzare la lista appuntamenti (ms). Valori alti = meno traffico verso il server/DB. */
export const APPOINTMENTS_POLL_INTERVAL_MS = 30 * 60 * 1000; // 30 minuti

/** Minimo tempo tra un GET e l'altro al ritorno sulla scheda (visibility). Riduce egress. */
export const VISIBILITY_REFRESH_THROTTLE_MS = 5 * 60 * 1000; // 5 minuti

const pad = (n) => String(n).padStart(2, '0');

export const formatLocalYMD = (date) => {
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  return `${y}-${m}-${d}`;
};

/** { from, to } in formato YYYY-MM-DD per le API e per min/max del date input */
export const getAppointmentsApiRange = () => {
  const today = new Date();
  const fromDate = new Date(today.getFullYear(), today.getMonth() - MONTHS_OFFSET, today.getDate());
  const toDate = new Date(today.getFullYear(), today.getMonth() + MONTHS_OFFSET, today.getDate());
  return {
    from: formatLocalYMD(fromDate),
    to: formatLocalYMD(toDate)
  };
};

/** Costringe una data YYYY-MM-DD dentro la finestra corrente */
export const clampDateToAppointmentWindow = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return getAppointmentsApiRange().from;
  const clean = dateStr.split('T')[0];
  const { from, to } = getAppointmentsApiRange();
  if (clean < from) return from;
  if (clean > to) return to;
  return clean;
};
