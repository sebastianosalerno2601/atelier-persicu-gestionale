/**
 * Aggiornamento lista appuntamenti in memoria senza GET (riduce egress).
 */

export function compareAppointmentsForSort(a, b) {
  const da = (a.date || '').split('T')[0];
  const db = (b.date || '').split('T')[0];
  if (da !== db) return da.localeCompare(db);
  return (a.startTime || '').localeCompare(b.startTime || '');
}

export function upsertAppointmentInList(prev, camelAppointment) {
  if (!camelAppointment || camelAppointment.id == null) return prev;
  const id = camelAppointment.id;
  const idx = prev.findIndex((x) => x.id === id);
  let next;
  if (idx >= 0) {
    next = [...prev];
    next[idx] = { ...next[idx], ...camelAppointment };
  } else {
    next = [...prev, camelAppointment];
  }
  return next.slice().sort(compareAppointmentsForSort);
}

export function removeAppointmentFromList(prev, id) {
  const n = typeof id === 'string' ? parseInt(id, 10) : id;
  return prev.filter((x) => Number(x.id) !== Number(n));
}

/** Risposta POST /appointments: { id, ...body } (body in camelCase dal client) */
export function camelAppointmentFromCreateResponse(data) {
  if (!data || data.id == null) return null;
  let d = data.date;
  if (d && typeof d === 'string') d = d.split('T')[0];
  return {
    id: data.id,
    employeeId:
      typeof data.employeeId === 'number'
        ? data.employeeId
        : parseInt(data.employeeId, 10) || data.employeeId,
    date: d,
    startTime: data.startTime,
    endTime: data.endTime,
    clientName: data.clientName,
    serviceType: data.serviceType,
    paymentMethod: data.paymentMethod || 'da-pagare',
    productSold: data.productSold != null ? data.productSold : null,
    recurrenceGroupId: data.recurrenceGroupId != null ? data.recurrenceGroupId : null,
    isRecurring: !!data.isRecurring
  };
}
