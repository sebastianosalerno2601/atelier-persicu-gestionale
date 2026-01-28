import React, { useState, useMemo } from 'react';
import './EmployeesEarningsModal.css';

const PAYMENT_LABELS = {
  carta: 'Carta',
  contanti: 'Contanti',
  'da-pagare': 'Da pagare',
  scontistica: 'Scontistica'
};

const formatDay = (dateStr) => {
  if (!dateStr) return '';
  const s = String(dateStr).split('T')[0];
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

const formatDayWithWeekday = (dateStr) => {
  if (!dateStr) return '';
  const s = String(dateStr).split('T')[0];
  const [y, m, d] = s.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const wd = date.getDay();
  return `${WEEKDAYS[wd]} ${d}/${m}/${y}`;
};

const EmployeesEarningsModal = ({ isOpen, onClose, employees = [], monthAppointments = [], monthLabel }) => {
  const [step, setStep] = useState('employees');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const employeeList = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return list.map((e) => ({
      id: e.id,
      fullName: e.full_name || e.fullName || ''
    })).filter((e) => e.id != null);
  }, [employees]);

  const appointmentsByEmployee = useMemo(() => {
    const byId = {};
    const list = Array.isArray(monthAppointments) ? monthAppointments : [];
    list.forEach((apt) => {
      const raw = apt.employee_id ?? apt.employeeId;
      const eid = raw != null ? parseInt(raw, 10) : null;
      if (eid == null || isNaN(eid)) return;
      if (!byId[eid]) byId[eid] = [];
      byId[eid].push(apt);
    });
    Object.keys(byId).forEach((id) => {
      byId[id].sort((a, b) => {
        const da = (a.date || a.appointment_date || '').split('T')[0];
        const db = (b.date || b.appointment_date || '').split('T')[0];
        return da.localeCompare(db);
      });
    });
    return byId;
  }, [monthAppointments]);

  const currentAppointments = useMemo(() => {
    if (!selectedEmployee) return [];
    const eid = parseInt(selectedEmployee.id, 10);
    return appointmentsByEmployee[eid] || [];
  }, [selectedEmployee, appointmentsByEmployee]);

  const daysList = useMemo(() => {
    const seen = new Set();
    currentAppointments.forEach((apt) => {
      const s = (apt.date || apt.appointment_date || '').split('T')[0];
      if (s) seen.add(s);
    });
    return [...seen].sort();
  }, [currentAppointments]);

  const currentAppointmentsForDay = useMemo(() => {
    if (!selectedDay) return [];
    const list = currentAppointments.filter((apt) => {
      const s = (apt.date || apt.appointment_date || '').split('T')[0];
      return s === selectedDay;
    });
    list.sort((a, b) => {
      const ta = a.start_time || a.startTime || '';
      const tb = b.start_time || b.startTime || '';
      return ta.localeCompare(tb);
    });
    return list;
  }, [currentAppointments, selectedDay]);

  const handleClose = () => {
    setStep('employees');
    setSelectedEmployee(null);
    setSelectedDay(null);
    setSelectedAppointment(null);
    onClose();
  };

  const handleEmployeeClick = (emp) => {
    setSelectedEmployee(emp);
    setSelectedDay(null);
    setSelectedAppointment(null);
    setStep('days');
  };

  const handleDayClick = (dayStr) => {
    setSelectedDay(dayStr);
    setSelectedAppointment(null);
    setStep('appointments');
  };

  const handleAppointmentClick = (apt) => {
    setSelectedAppointment(apt);
    setStep('detail');
  };

  const handleBackToEmployees = () => {
    setSelectedEmployee(null);
    setSelectedDay(null);
    setSelectedAppointment(null);
    setStep('employees');
  };

  const handleBackToDays = () => {
    setSelectedDay(null);
    setSelectedAppointment(null);
    setStep('days');
  };

  const handleBackToAppointments = () => {
    setSelectedAppointment(null);
    setStep('appointments');
  };

  if (!isOpen) return null;

  return (
    <div className="employees-earnings-modal-overlay" onClick={handleClose}>
      <div className="employees-earnings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="employees-earnings-modal-header">
          <h3>
            {step === 'employees' && `40% Dipendenti – ${monthLabel}`}
            {step === 'days' && selectedEmployee && `Giorni con appuntamenti – ${selectedEmployee.fullName}`}
            {step === 'appointments' && selectedEmployee && selectedDay && `Appuntamenti del ${formatDayWithWeekday(selectedDay)}`}
            {step === 'detail' && 'Dettaglio appuntamento'}
          </h3>
          <button type="button" className="employees-earnings-modal-close" onClick={handleClose} aria-label="Chiudi">×</button>
        </div>
        <div className="employees-earnings-modal-body">
          {step === 'employees' && (
            <>
              {employeeList.length === 0 ? (
                <div className="employees-earnings-empty">Nessun dipendente</div>
              ) : (
                <ul className="employees-earnings-list">
                  {employeeList.map((emp) => (
                    <li
                      key={emp.id}
                      className="employees-earnings-list-item employees-earnings-clickable"
                      onClick={() => handleEmployeeClick(emp)}
                    >
                      <span className="employees-earnings-employee-name">{emp.fullName}</span>
                      <span className="employees-earnings-arrow">→</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === 'days' && (
            <>
              <div className="employees-earnings-back">
                <button type="button" className="employees-earnings-back-btn" onClick={handleBackToEmployees}>
                  ← Indietro ai dipendenti
                </button>
              </div>
              {daysList.length === 0 ? (
                <div className="employees-earnings-empty">
                  Nessun appuntamento pagato (carta/contanti) per questo dipendente nel mese
                </div>
              ) : (
                <ul className="employees-earnings-list">
                  {daysList.map((dayStr) => {
                    const count = currentAppointments.filter((apt) =>
                      (apt.date || apt.appointment_date || '').split('T')[0] === dayStr
                    ).length;
                    return (
                      <li
                        key={dayStr}
                        className="employees-earnings-list-item employees-earnings-clickable"
                        onClick={() => handleDayClick(dayStr)}
                      >
                        <span className="employees-earnings-day-label">{formatDayWithWeekday(dayStr)}</span>
                        <span className="employees-earnings-appointment-meta">
                          <span className="employees-earnings-day-count">{count} {count === 1 ? 'appuntamento' : 'appuntamenti'}</span>
                          <span className="employees-earnings-arrow">→</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 'appointments' && (
            <>
              <div className="employees-earnings-back">
                <button type="button" className="employees-earnings-back-btn" onClick={handleBackToDays}>
                  ← Indietro ai giorni
                </button>
              </div>
              {currentAppointmentsForDay.length === 0 ? (
                <div className="employees-earnings-empty">
                  Nessun appuntamento in questo giorno
                </div>
              ) : (
                <ul className="employees-earnings-list">
                  {currentAppointmentsForDay.map((apt, idx) => {
                    const name = apt.client_name || apt.clientName || '';
                    const time = apt.start_time || apt.startTime;
                    return (
                      <li
                        key={apt.id || idx}
                        className="employees-earnings-list-item employees-earnings-clickable"
                        onClick={() => handleAppointmentClick(apt)}
                      >
                        <span className="employees-earnings-appointment-name">{name || '–'}</span>
                        <span className="employees-earnings-appointment-meta">
                          {time && <span className="employees-earnings-appointment-time">{time}</span>}
                          <span className="employees-earnings-arrow">→</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 'detail' && selectedAppointment && (
            <>
              <div className="employees-earnings-back">
                <button type="button" className="employees-earnings-back-btn" onClick={handleBackToAppointments}>
                  ← Indietro agli appuntamenti del giorno
                </button>
              </div>
              <div className="employees-earnings-detail">
                <div className="employees-earnings-detail-row">
                  <strong>Cliente</strong>
                  <span>{selectedAppointment.client_name || selectedAppointment.clientName || '–'}</span>
                </div>
                <div className="employees-earnings-detail-row">
                  <strong>Trattamento</strong>
                  <span>{selectedAppointment.service_type || selectedAppointment.serviceType || '–'}</span>
                </div>
                <div className="employees-earnings-detail-row">
                  <strong>Pagamento</strong>
                  <span>
                    {PAYMENT_LABELS[selectedAppointment.payment_method || selectedAppointment.paymentMethod] ||
                      (selectedAppointment.payment_method || selectedAppointment.paymentMethod) || '–'}
                  </span>
                </div>
                <div className="employees-earnings-detail-row">
                  <strong>Data</strong>
                  <span>{formatDay(selectedAppointment.date || selectedAppointment.appointment_date)}</span>
                </div>
                {(selectedAppointment.start_time || selectedAppointment.startTime) && (
                  <div className="employees-earnings-detail-row">
                    <strong>Orario</strong>
                    <span>
                      {selectedAppointment.start_time || selectedAppointment.startTime}
                      {(selectedAppointment.end_time || selectedAppointment.endTime) && (
                        <> – {selectedAppointment.end_time || selectedAppointment.endTime}</>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="employees-earnings-modal-footer">
          <button type="button" className="employees-earnings-footer-btn" onClick={handleClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeesEarningsModal;
