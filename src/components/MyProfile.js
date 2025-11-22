import React, { useState, useEffect, useCallback } from 'react';
import { getAppointments as getAppointmentsAPI, getEmployees as getEmployeesAPI } from '../utils/api';
import { getPrice } from '../utils/storage';
import './MyProfile.css';

const MyProfile = () => {
  const [auth, setAuth] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dailyBreakdown, setDailyBreakdown] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper per convertire employee da snake_case a camelCase
  const employeeToCamelCase = (emp) => {
    return {
      id: emp.id || emp.employee_id,
      name: emp.name || emp.employee_name,
      fullName: emp.fullName || emp.full_name || emp.name || emp.employee_name,
      email: emp.email || emp.employee_email,
      birthYear: emp.birthYear || emp.birth_year,
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

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('atelier-auth') || '{}');
    setAuth(authData);
    
    if (authData.username && authData.employeeId) {
      loadEmployeeData(authData);
      loadAppointments();
    }
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const apts = await getAppointmentsAPI();
      const converted = apts.map(appointmentToCamelCase);
      setAppointments(converted);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyEarnings = useCallback(() => {
    if (!employee || appointments.length === 0) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Filtra appuntamenti del mese corrente per questo dipendente
    const monthAppointments = appointments.filter(apt => {
      // Normalizza employeeId per confronto
      const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
      const empEmployeeId = typeof employee.id === 'string' ? parseInt(employee.id) : employee.id;
      
      if (aptEmployeeId !== empEmployeeId) return false;
      
      // Solo appuntamenti pagati con carta o contanti
      if (apt.paymentMethod !== 'carta' && apt.paymentMethod !== 'contanti') return false;
      
      // Normalizza la data per confronto
      const aptDateStr = apt.date ? apt.date.split('T')[0] : apt.date;
      const aptDate = new Date(aptDateStr);
      
      return aptDate.getFullYear() === year && aptDate.getMonth() === month;
    });

    // Calcola il totale degli appuntamenti
    const totalRevenue = monthAppointments.reduce((sum, apt) => {
      return sum + getPrice(apt.serviceType);
    }, 0);

    // Il dipendente riceve il 40% del totale
    const earnings = totalRevenue * 0.4;
    setMonthlyEarnings(earnings);

    // Calcola il breakdown giornaliero
    const dailyMap = {};
    monthAppointments.forEach(apt => {
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
  }, [employee, currentMonth, appointments]);

  useEffect(() => {
    if (auth && employee && appointments.length > 0) {
      calculateMonthlyEarnings();
    }
  }, [auth, employee, calculateMonthlyEarnings, appointments]);

  const loadEmployeeData = async (authData) => {
    // Se è un superadmin, non può vedere questa sezione
    if (authData.role === 'superadmin') {
      return;
    }
    
    if (!authData.employeeId) {
      console.error('Nessun employeeId associato all\'utente');
      return;
    }
    
    try {
      setLoading(true);
      // Ottieni i dipendenti per trovare il dipendente corrispondente
      const employees = await getEmployeesAPI();
      const converted = employees.map(employeeToCamelCase);
      const employeeId = typeof authData.employeeId === 'string' ? parseInt(authData.employeeId) : authData.employeeId;
      const foundEmployee = converted.find(emp => {
        const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id;
        return empId === employeeId;
      });
      
      if (foundEmployee) {
        setEmployee(foundEmployee);
      }
    } catch (error) {
      console.error('Errore caricamento dati dipendente:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (auth?.role === 'superadmin') {
    return (
      <div className="profile-container fade-in">
        <div className="profile-loading">
          <p>Questa sezione è disponibile solo per i dipendenti. I superadmin possono visualizzare i guadagni dalla sezione "Riepilogo Dipendenti".</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="profile-container fade-in">
        <div className="profile-loading">
          <p>Caricamento dati profilo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container fade-in">
      <div className="profile-header">
        <h2 className="section-title">Il mio profilo</h2>
      </div>

      <div className="profile-info-card">
        <div className="profile-avatar">
          <span>{employee.fullName.charAt(0).toUpperCase()}</span>
        </div>
        <div className="profile-details">
          <h3 className="profile-name">{employee.fullName}</h3>
          {employee.email && (
            <p className="profile-email">{employee.email}</p>
          )}
          {employee.birthYear && (
            <p className="profile-info">Anno di nascita: {employee.birthYear}</p>
          )}
        </div>
      </div>

      <div className="monthly-earnings-section">
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

        <div className="earnings-card">
          <div className="earnings-label-small">Guadagno mensile</div>
          <div className="earnings-amount-large">
            {monthlyEarnings.toFixed(2)} €
          </div>
          <div className="earnings-description">
            Il 40% del totale degli appuntamenti pagati del mese
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
                      Tuo 40%: {day.earnings.toFixed(2)} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {dailyBreakdown.length === 0 && (
          <div className="no-earnings-message">
            <p>Nessun appuntamento pagato per questo mese.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;

