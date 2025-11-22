import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments as getAppointmentsAPI, getEmployees as getEmployeesAPI } from '../utils/api';
import { getPrice } from '../utils/storage';
import './EmployeesReport.css';

const EmployeesReport = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [dateRange, setDateRange] = useState(null); // { startDate: string, endDate: string }
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Helper per convertire employee da snake_case a camelCase
  const employeeToCamelCase = (emp) => {
    return {
      id: emp.id || emp.employee_id,
      fullName: emp.fullName || emp.full_name || emp.name || emp.employee_name,
      name: emp.name || emp.employee_name,
      email: emp.email,
      color: emp.color || emp.employee_color
    };
  };

  // Helper per convertire appointment da snake_case a camelCase
  const appointmentToCamelCase = (apt) => {
    return {
      id: apt.id || apt.appointment_id,
      employeeId: apt.employeeId || apt.employee_id,
      date: apt.date ? apt.date.split('T')[0] : apt.appointment_date,
      startTime: apt.startTime || apt.start_time,
      serviceType: apt.serviceType || apt.service_type,
      paymentMethod: apt.paymentMethod || apt.payment_method
    };
  };

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const emp = await getEmployeesAPI();
      const converted = emp.map(employeeToCamelCase);
      setEmployees(converted);
      if (converted.length > 0 && !selectedEmployee) {
        setSelectedEmployee(converted[0].id);
      }
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee]);

  const loadAppointments = useCallback(async () => {
    try {
      const apts = await getAppointmentsAPI();
      const converted = apts.map(appointmentToCamelCase);
      setAppointments(converted);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadAppointments();
  }, [loadEmployees, loadAppointments]);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  const calculateMonthlyEarnings = useCallback(() => {
    if (!selectedEmployee || appointments.length === 0) return;

    // Se c'è un range di date selezionato, usa quello, altrimenti usa il mese corrente
    let filteredAppointments;
    
    if (dateRange && dateRange.startDate && dateRange.endDate) {
      // Filtra per range di date
      filteredAppointments = appointments.filter(apt => {
        // Normalizza employeeId per confronto
        const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
        const selEmployeeId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
        
        if (aptEmployeeId !== selEmployeeId) return false;
        
        // Solo appuntamenti pagati con carta o contanti
        if (apt.paymentMethod !== 'carta' && apt.paymentMethod !== 'contanti') return false;
        
        // Normalizza le date per confronto
        const aptDateStr = apt.date ? apt.date.split('T')[0] : apt.date;
        const startDateStr = dateRange.startDate ? dateRange.startDate.split('T')[0] : dateRange.startDate;
        const endDateStr = dateRange.endDate ? dateRange.endDate.split('T')[0] : dateRange.endDate;
        
        return aptDateStr >= startDateStr && aptDateStr <= endDateStr;
      });
    } else {
      // Filtra per mese corrente
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      filteredAppointments = appointments.filter(apt => {
        // Normalizza employeeId per confronto
        const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
        const selEmployeeId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
        
        if (aptEmployeeId !== selEmployeeId) return false;
        
        // Solo appuntamenti pagati con carta o contanti
        if (apt.paymentMethod !== 'carta' && apt.paymentMethod !== 'contanti') return false;
        
        // Normalizza la data per confronto
        const aptDateStr = apt.date ? apt.date.split('T')[0] : apt.date;
        const aptDate = new Date(aptDateStr);
        
        return aptDate.getFullYear() === year && aptDate.getMonth() === month;
      });
    }

    // Calcola il totale degli appuntamenti
    const totalRevenue = filteredAppointments.reduce((sum, apt) => {
      return sum + getPrice(apt.serviceType);
    }, 0);

    // Il dipendente riceve il 40% del totale
    const earnings = totalRevenue * 0.4;
    setMonthlyEarnings(earnings);

    // Calcola il breakdown giornaliero
    const dailyMap = {};
    filteredAppointments.forEach(apt => {
      const dateStr = apt.date ? apt.date.split('T')[0] : apt.date;
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, total: 0, earnings: 0 };
      }
      const price = getPrice(apt.serviceType);
      dailyMap[dateStr].total += price;
      dailyMap[dateStr].earnings += price * 0.4;
    });

    const breakdown = Object.values(dailyMap).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    setDailyBreakdown(breakdown);
  }, [selectedEmployee, currentMonth, dateRange, appointments]);

  useEffect(() => {
    if (selectedEmployee && appointments.length > 0) {
      calculateMonthlyEarnings();
    }
  }, [selectedEmployee, calculateMonthlyEarnings, appointments]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const now = new Date();
    if (nextMonth <= now) {
      setCurrentMonth(nextMonth);
    }
  };

  const canGoNext = () => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return nextMonth <= new Date();
  };

  const handleOpenDatePicker = () => {
    setShowDatePicker(true);
    // Imposta date di default al mese corrente
    if (!tempStartDate && !tempEndDate) {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      setTempStartDate(firstDay.toISOString().split('T')[0]);
      setTempEndDate(lastDay.toISOString().split('T')[0]);
    }
  };

  const handleCloseDatePicker = () => {
    setShowDatePicker(false);
    setTempStartDate('');
    setTempEndDate('');
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      if (new Date(tempStartDate) > new Date(tempEndDate)) {
        alert('La data di inizio deve essere precedente alla data di fine');
        return;
      }
      setDateRange({
        startDate: tempStartDate,
        endDate: tempEndDate
      });
      setShowDatePicker(false);
    }
  };

  const handleClearDateRange = () => {
    setDateRange(null);
    setTempStartDate('');
    setTempEndDate('');
    setShowDatePicker(false);
  };

  const formatDateRange = () => {
    if (!dateRange || !dateRange.startDate || !dateRange.endDate) return null;
    
    return `${formatDateForTitle(dateRange.startDate)} - ${formatDateForTitle(dateRange.endDate)}`;
  };

  const formatDateForTitle = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  if (employees.length === 0) {
    return (
      <div className="report-container fade-in">
        <div className="report-loading">
          <p>Nessun dipendente disponibile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container fade-in">
      <div className="report-header">
        <h2 className="section-title">Riepilogo Dipendenti</h2>
      </div>

      <div className="employee-selector-section">
        <label htmlFor="employee-select" className="selector-label">
          Seleziona dipendente:
        </label>
        <select
          id="employee-select"
          className="employee-select"
          value={selectedEmployee || ''}
          onChange={(e) => setSelectedEmployee(e.target.value)}
        >
          {employees.map(employee => (
            <option key={employee.id} value={employee.id}>
              {employee.fullName || employee.name || 'N/A'}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployeeData && (
        <>
          <div className="report-info-card">
            <div className="report-avatar">
              <span>{(selectedEmployeeData.fullName || selectedEmployeeData.name || 'N').charAt(0).toUpperCase()}</span>
            </div>
            <div className="report-details">
              <h3 className="report-name">{selectedEmployeeData.fullName || selectedEmployeeData.name || 'N/A'}</h3>
              {selectedEmployeeData.email && (
                <p className="report-email">{selectedEmployeeData.email}</p>
              )}
            </div>
          </div>

          <div className="monthly-earnings-section">
            <div className="date-range-selector-section">
              <button 
                className="date-range-button"
                onClick={handleOpenDatePicker}
              >
                📅 Seleziona il tuo riepilogo
              </button>
              {dateRange && (
                <button 
                  className="clear-date-range-button"
                  onClick={handleClearDateRange}
                  title="Rimuovi filtro date"
                >
                  ✕
                </button>
              )}
            </div>

            {showDatePicker && (
              <div className="date-picker-modal-overlay" onClick={handleCloseDatePicker}>
                <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="date-picker-header">
                    <h3>Seleziona Periodo</h3>
                    <button className="date-picker-close" onClick={handleCloseDatePicker}>×</button>
                  </div>
                  <div className="date-picker-body">
                    <div className="date-input-group">
                      <label htmlFor="start-date">Data DA:</label>
                      <input
                        id="start-date"
                        type="date"
                        value={tempStartDate}
                        onChange={(e) => setTempStartDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                    <div className="date-input-group">
                      <label htmlFor="end-date">Data A:</label>
                      <input
                        id="end-date"
                        type="date"
                        value={tempEndDate}
                        onChange={(e) => setTempEndDate(e.target.value)}
                        className="date-input"
                      />
                    </div>
                  </div>
                  <div className="date-picker-footer">
                    <button className="date-picker-button cancel" onClick={handleCloseDatePicker}>
                      Annulla
                    </button>
                    <button className="date-picker-button apply" onClick={handleApplyDateRange}>
                      Applica
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="period-title-section">
              {dateRange ? (
                <h3 className="period-title">
                  Periodo: {formatDateRange()}
                </h3>
              ) : (
                <div className="month-selector">
                  <button 
                    className="month-nav-button"
                    onClick={handlePreviousMonth}
                    aria-label="Mese precedente"
                  >
                    ←
                  </button>
                  <h3 className="month-title">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button 
                    className="month-nav-button"
                    onClick={handleNextMonth}
                    disabled={!canGoNext()}
                    aria-label="Mese successivo"
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            <div className="earnings-card">
              <div className="earnings-label-small">
                {dateRange ? 'Guadagno periodo selezionato' : 'Guadagno mensile'}
              </div>
              <div className="earnings-amount-large">
                {monthlyEarnings.toFixed(2)} €
              </div>
              <div className="earnings-description">
                Il 40% del totale degli appuntamenti pagati {dateRange ? 'nel periodo selezionato' : 'del mese'}
              </div>
            </div>

            {dailyBreakdown.length > 0 && (
              <div className="daily-breakdown">
                <h4 className="breakdown-title">Riepilogo giornaliero</h4>
                <div className="breakdown-list">
                  {dailyBreakdown.map((day, index) => (
                    <div key={index} className="breakdown-item">
                      <div className="breakdown-date">{formatDate(day.date)}</div>
                      <div className="breakdown-details">
                        <span className="breakdown-total">
                          Totale: {day.total.toFixed(2)} €
                        </span>
                        <span className="breakdown-earnings">
                          40% dipendente: {day.earnings.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dailyBreakdown.length === 0 && (
              <div className="no-earnings-message">
                <p>Nessun appuntamento pagato {dateRange ? 'per il periodo selezionato' : 'per questo mese'}.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default EmployeesReport;

