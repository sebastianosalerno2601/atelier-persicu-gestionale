import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEmployees as getEmployeesAPI, getAppointments as getAppointmentsAPI, createAppointment, createAppointmentsBatch, updateAppointment, deleteAppointment } from '../utils/api';
import { getPrice, generateWeeklyRecurrences, addDays } from '../utils/storage';
import AppointmentModal from './AppointmentModal';
import './Appointments.css';

// Funzione per convertire snake_case a camelCase per gli appuntamenti
const appointmentToCamelCase = (obj) => {
  if (!obj) return null;
  // Normalizza la data: rimuove eventuali timestamp
  let normalizedDate = obj.date;
  if (normalizedDate && typeof normalizedDate === 'string') {
    normalizedDate = normalizedDate.split('T')[0];
  } else if (normalizedDate instanceof Date) {
    normalizedDate = normalizedDate.toISOString().split('T')[0];
  }
  
  return {
    id: obj.id,
    employeeId: typeof obj.employee_id === 'number' ? obj.employee_id : parseInt(obj.employee_id) || obj.employee_id,
    date: normalizedDate,
    startTime: obj.start_time,
    endTime: obj.end_time,
    clientName: obj.client_name,
    serviceType: obj.service_type,
    paymentMethod: obj.payment_method,
    productSold: obj.product_sold || null,
    recurrenceGroupId: obj.recurrence_group_id || null,
    isRecurring: obj.is_recurring || false
  };
};

// Funzione per convertire camelCase a snake_case per l'API
const appointmentToSnakeCase = (obj) => {
  // Normalizza la data prima di inviarla all'API
  let normalizedDate = obj.date;
  if (normalizedDate && typeof normalizedDate === 'string') {
    normalizedDate = normalizedDate.split('T')[0]; // Rimuove eventuali timestamp
  } else if (normalizedDate instanceof Date) {
    normalizedDate = normalizedDate.toISOString().split('T')[0];
  }
  
  return {
    employeeId: obj.employeeId,
    date: normalizedDate,
    startTime: obj.startTime,
    endTime: obj.endTime,
    clientName: obj.clientName,
    serviceType: obj.serviceType,
    paymentMethod: obj.paymentMethod,
    productSold: obj.productSold || null,
    recurrenceGroupId: obj.recurrenceGroupId || null,
    isRecurring: obj.isRecurring || false
  };
};

const Appointments = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [appointments, setAppointments] = useState([]);
  // Funzione per ottenere la data locale in formato YYYY-MM-DD
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [isUnpaidModalOpen, setIsUnpaidModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [auth, setAuth] = useState(null);

  // Funzione per convertire snake_case a camelCase per i dipendenti
  const employeeToCamelCase = (obj) => {
    if (!obj) return null;
    return {
      id: obj.id,
      fullName: obj.full_name,
      email: obj.email,
      fiscalCode: obj.fiscal_code,
      birthYear: obj.birth_year,
      monthlySalary: parseFloat(obj.monthly_salary) || 0,
      color: obj.color || '#ffffff',
      credentials: obj.username ? { username: obj.username } : null
    };
  };

  const loadEmployees = useCallback(async () => {
    try {
      const data = await getEmployeesAPI();
      const camelCaseData = Array.isArray(data) ? data.map(employeeToCamelCase) : [];
      setEmployees(camelCaseData);
      if (camelCaseData.length > 0 && !selectedEmployee) {
        setSelectedEmployee(camelCaseData[0].id);
      }
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error);
    }
  }, [selectedEmployee]);

  useEffect(() => {
    // Carica auth per verificare se è dipendente
    const authData = JSON.parse(localStorage.getItem('atelier-auth') || '{}');
    setAuth(authData);
    
    loadEmployees();
    loadAppointments();
  }, []);

  // Polling automatico ogni 30 secondi per sincronizzare con altri utenti (senza mostrare loading)
  useEffect(() => {
    const interval = setInterval(() => {
      loadAppointments(false);
    }, 30000); // 30 secondi

    return () => clearInterval(interval);
  }, [loadAppointments]);

  // Ricarica quando la finestra torna in focus (quando l'utente torna alla scheda)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadAppointments(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loadAppointments]);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  const loadAppointments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await getAppointmentsAPI();
      const camelCaseData = Array.isArray(data) ? data.map(appointmentToCamelCase) : [];
      setAppointments(camelCaseData);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
      // Mostra alert solo se non è un aggiornamento automatico
      if (showLoading) {
        alert('Errore nel caricamento degli appuntamenti');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  const getAppointmentsForDay = () => {
    const filtered = appointments.filter(apt => {
      // Normalizza la data per il confronto (rimuove eventuali timestamp)
      const aptDate = apt.date ? apt.date.split('T')[0] : apt.date;
      // Converti employeeId a numero per il confronto
      const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
      const selectedEmpId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
      
      const dateMatch = aptDate === selectedDate;
      const employeeMatch = aptEmployeeId === selectedEmpId;
      
      return dateMatch && employeeMatch;
    });
    
    return filtered;
  };

  const getAppointmentsForTimeSlot = (timeSlot) => {
    const dayAppointments = getAppointmentsForDay();
    const filtered = dayAppointments.filter(apt => {
      // Normalizza l'orario (rimuove eventuali secondi)
      const aptTime = apt.startTime ? apt.startTime.split(':').slice(0, 2).join(':') : apt.startTime;
      const slotTime = timeSlot.split(':').slice(0, 2).join(':');
      return aptTime === slotTime;
    });
    
    return filtered;
  };

  // Helper per convertire hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  // Funzione helper per ottenere il colore del dipendente
  const getEmployeeColor = (employeeId) => {
    const employee = employees.find(emp => {
      const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id;
      const aptEmployeeId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      return empId === aptEmployeeId;
    });
    return employee?.color || '#ffffff';
  };

  const handleTimeSlotClick = (timeSlot) => {
    // Click sullo slot per creare nuovo appuntamento
    setSelectedTimeSlot(timeSlot);
    setSelectedAppointment(null);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment, e) => {
    // Click su un appuntamento specifico per modificarlo
    e.stopPropagation();
    setSelectedTimeSlot(appointment.startTime);
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (appointmentData) => {
    if (isSaving) return; // Previeni chiamate multiple
    
    setIsSaving(true);
    try {
      if (selectedAppointment) {
        // Modifica appuntamento esistente
        // Determina se l'appuntamento era ricorrente (controlla sia isRecurring che recurrenceGroupId)
        const wasRecurring = selectedAppointment.isRecurring || !!selectedAppointment.recurrenceGroupId;
        // Se isRecurring non è stato passato, mantieni il valore originale
        const finalIsRecurring = appointmentData.isRecurring !== undefined ? appointmentData.isRecurring : wasRecurring;
        
        const appointmentToUpdate = {
          ...appointmentToSnakeCase({ 
            ...selectedAppointment, 
            ...appointmentData, 
            employeeId: selectedAppointment.employeeId, 
            date: selectedAppointment.date,
            isRecurring: finalIsRecurring
          })
        };
        await updateAppointment(selectedAppointment.id, appointmentToUpdate);
      } else {
        // Nuovo appuntamento
        if (appointmentData.isRecurring) {
          // Crea ricorrenze settimanali per 1 anno usando batch endpoint (molto più veloce!)
          const recurringDates = generateWeeklyRecurrences(selectedDate, 52);
          
          // Genera un ID univoco per il gruppo di ricorrenza
          const recurrenceGroupId = `recur_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Prepara tutti gli appuntamenti da creare
          const appointmentsToCreate = recurringDates.map(date => 
            appointmentToSnakeCase({
              ...appointmentData,
              date: date,
              employeeId: selectedEmployee,
              recurrenceGroupId: recurrenceGroupId,
              isRecurring: true
            })
          );
          
          // Crea tutti gli appuntamenti in una singola transazione (molto più veloce!)
          await createAppointmentsBatch(appointmentsToCreate, recurrenceGroupId);
        } else {
          // Singolo appuntamento
          const newAppointment = {
            ...appointmentToSnakeCase({
              ...appointmentData,
              date: selectedDate,
              employeeId: selectedEmployee,
              isRecurring: false
            })
          };
          await createAppointment(newAppointment);
        }
      }
      await loadAppointments();
      setIsModalOpen(false);
      setSelectedAppointment(null);
      setSelectedTimeSlot(null);
    } catch (error) {
      console.error('Errore salvataggio appuntamento:', error);
      // Gestisci errore duplicato in modo user-friendly
      if (error.message && error.message.includes('duplicato')) {
        alert('⚠️ ' + error.message);
      } else {
        alert('Errore nel salvataggio dell\'appuntamento: ' + error.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId) => {
    try {
      await deleteAppointment(appointmentId);
      await loadAppointments();
      setIsModalOpen(false);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Errore eliminazione appuntamento:', error);
      alert('Errore nell\'eliminazione dell\'appuntamento: ' + error.message);
    }
  };

  const getDailyEarnings = (employeeId) => {
    const dayAppointments = appointments.filter(apt => 
      apt.date === selectedDate && 
      apt.employeeId === employeeId &&
      (apt.paymentMethod === 'carta' || apt.paymentMethod === 'contanti')
    );

    return dayAppointments.reduce((total, apt) => {
      return total + getPrice(apt.serviceType);
    }, 0);
  };

  const getCashEarnings = (employeeId) => {
    const dayAppointments = appointments.filter(apt => 
      apt.date === selectedDate && 
      apt.employeeId === employeeId &&
      apt.paymentMethod === 'contanti'
    );

    return dayAppointments.reduce((total, apt) => {
      return total + getPrice(apt.serviceType);
    }, 0);
  };

  const getCardEarnings = (employeeId) => {
    const dayAppointments = appointments.filter(apt => 
      apt.date === selectedDate && 
      apt.employeeId === employeeId &&
      apt.paymentMethod === 'carta'
    );

    return dayAppointments.reduce((total, apt) => {
      return total + getPrice(apt.serviceType);
    }, 0);
  };

  const getUnpaidAppointments = () => {
    return appointments.filter(apt => 
      apt.date === selectedDate && 
      apt.employeeId === selectedEmployee &&
      apt.paymentMethod === 'da-pagare'
    );
  };

  const handleUnpaidClick = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedTimeSlot(appointment.startTime);
    setIsModalOpen(true);
  };

  const [animatedTotal, setAnimatedTotal] = useState(0);
  const prevTotalRef = useRef(0);

  const getDailyEarningsMemo = useCallback((employeeId) => {
    const dayAppointments = appointments.filter(apt => 
      apt.date === selectedDate && 
      apt.employeeId === employeeId &&
      (apt.paymentMethod === 'carta' || apt.paymentMethod === 'contanti')
    );

    return dayAppointments.reduce((total, apt) => {
      return total + getPrice(apt.serviceType);
    }, 0);
  }, [appointments, selectedDate]);

  useEffect(() => {
    if (selectedEmployee) {
      const total = getDailyEarningsMemo(selectedEmployee);
      
      // Se il totale è cambiato significativamente, anima
      if (Math.abs(total - prevTotalRef.current) > 0.01) {
        setAnimatedTotal(0); // Reset per iniziare l'animazione
        
        const duration = 1000; // 1 secondo
        const steps = 60;
        const increment = total / steps;
        let current = 0;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= total) {
            setAnimatedTotal(total);
            prevTotalRef.current = total;
            clearInterval(timer);
          } else {
            setAnimatedTotal(current);
          }
        }, duration / steps);
        
        return () => clearInterval(timer);
      } else {
        // Se non c'è cambiamento significativo, aggiorna direttamente
        setAnimatedTotal(total);
        prevTotalRef.current = total;
      }
    }
  }, [selectedEmployee, selectedDate, appointments, getDailyEarningsMemo]);

  // Funzioni helper per calcolare le settimane
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunedì è il primo giorno
    return new Date(d.setDate(diff));
  };

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Domenica
    return end;
  };

  const formatDateForComparison = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateInRange = (dateStr, startDate, endDate) => {
    const date = new Date(dateStr);
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  };

  // Calcola il guadagno lordo (senza 40%) per una settimana
  const getWeeklyGrossEarnings = useCallback((employeeId, startDate, endDate) => {
    // Normalizza le date di inizio e fine settimana
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    const weekAppointments = appointments.filter(apt => {
      const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      
      if (aptEmployeeId !== empId) return false;
      if (apt.paymentMethod !== 'carta' && apt.paymentMethod !== 'contanti') return false;
      
      // Normalizza la data dell'appuntamento
      const aptDateStr = apt.date ? apt.date.split('T')[0] : apt.date;
      if (!aptDateStr) return false;
      
      const aptDate = new Date(aptDateStr);
      aptDate.setHours(0, 0, 0, 0);
      
      // Verifica se la data è nel range
      return aptDate >= start && aptDate <= end;
    });

    return weekAppointments.reduce((total, apt) => {
      return total + getPrice(apt.serviceType);
    }, 0);
  }, [appointments]);

  // Verifica se siamo nella prima settimana del mese (settimana effettiva che contiene l'1)
  const isFirstWeekOfMonth = useCallback(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Ottieni l'inizio della settimana che contiene il primo giorno del mese
    const weekStartOfFirstDay = getStartOfWeek(firstDayOfMonth);
    const weekEndOfFirstDay = getEndOfWeek(firstDayOfMonth);
    
    // Ottieni l'inizio della settimana corrente
    const weekStartOfToday = getStartOfWeek(today);
    const weekEndOfToday = getEndOfWeek(today);
    
    // Normalizza le date per confronto (solo anno, mese, giorno)
    const normalizeDate = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };
    
    const firstWeekStart = normalizeDate(weekStartOfFirstDay);
    const firstWeekEnd = normalizeDate(weekEndOfFirstDay);
    const currentWeekStart = normalizeDate(weekStartOfToday);
    const currentWeekEnd = normalizeDate(weekEndOfToday);
    
    // Verifica se la settimana corrente è la stessa settimana che contiene il primo giorno del mese
    return currentWeekStart.getTime() === firstWeekStart.getTime() && 
           currentWeekEnd.getTime() === firstWeekEnd.getTime();
  }, []);

  // Citazioni motivazionali mensili
  const monthlyQuotes = {
    11: "Il successo di molti imprenditori è dovuto alla loro capacità di scegliere i collaboratori più adatti e qualificati. (Napoleon Hill)",
    0: "Quando tutto sembra andare male, ricorda che gli aerei decollano contro vento, non con il vento a favore. (Henry Ford)",
    1: "L'unico vantaggio competitivo sostenibile consiste nella capacità di apprendere e di cambiare più rapidamente degli altri. (Philip Kotler)",
    2: "Non importa quanto un uomo possa fare, non importa quanto coinvolgente la sua personalità possa essere, egli non farà molta strada negli affari se non sarà in grado di lavorare con gli altri. (John Craig)",
    3: "Iniziare un nuovo cammino spaventa. Ma dopo ogni passo che percorriamo ci rendiamo conto di come era pericoloso rimanere fermi. (Roberto Benigni)",
    4: "Le due cose più importanti non compaiono nel bilancio di un'impresa: la sua reputazione e i suoi uomini. (Henry Ford)",
    5: "Sono convinto che circa la metà di quello che separa gli imprenditori di successo da quelli che non hanno successo sia la pura perseveranza. (Steve Jobs)",
    6: "I tuoi clienti più insoddisfatti sono la tua più grande fonte di apprendimento. (Bill Gates)",
    7: "Alcune persone sognano il successo, mentre altre si alzano ogni mattina e lo fanno accadere. (Wayne Huizenga)",
    8: "Non ho mai sognato il successo. Ho lavorato per ottenerlo. (Estee Lauder)",
    9: "Il successo di solito arriva a coloro che sono troppo occupati per cercarlo. (Henry David Thoreau)",
    10: "È dura battere una persona che non si arrende mai. (Babe Ruth)"
  };

  // Calcola i messaggi motivazionali
  const getMotivationalMessage = useCallback(() => {
    if (!auth || !selectedEmployee) return null;
    
    const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
    if (!selectedEmp) return null;
    
    // Se non è superadmin, mostra i messaggi solo se il dipendente selezionato corrisponde all'utente loggato
    if (auth.role !== 'superadmin' && auth.employee_id && selectedEmployee !== auth.employee_id) {
      return null;
    }
    
    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);
    const currentWeekEnd = getEndOfWeek(today);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekEnd);
    previousWeekEnd.setDate(currentWeekEnd.getDate() - 7);

    // Mostra sempre la citazione mensile
    const month = today.getMonth();
    const quote = monthlyQuotes[month];
    
    const employeeName = selectedEmp?.fullName || 'dipendente';
    
    // Se siamo nella prima settimana del mese, non mostrare messaggi settimanali
    if (isFirstWeekOfMonth()) {
      return null; // I messaggi settimanali vengono gestiti separatamente
    }
    
    // Confronto con settimana precedente (solo dalla seconda settimana in poi)
    const currentWeekEarnings = getWeeklyGrossEarnings(selectedEmployee, currentWeekStart, currentWeekEnd);
    const previousWeekEarnings = getWeeklyGrossEarnings(selectedEmployee, previousWeekStart, previousWeekEnd);

    const dayOfWeek = today.getDay(); // 0 = Domenica, 6 = Sabato
    const isSaturday = dayOfWeek === 6;

    // Se c'è guadagno della settimana precedente, mostra messaggi settimanali
    if (previousWeekEarnings > 0) {
      // Durante la settimana: se ha già superato
      if (currentWeekEarnings > previousWeekEarnings) {
        return {
          type: 'success',
          message: `Complimenti ${employeeName} hai superato il lordo della settimana precedente, su di te? NESSUN DUBBIO!`,
          style: {
            color: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }
        };
      }

      // Al sabato: verifica finale
      if (isSaturday) {
        if (currentWeekEarnings < previousWeekEarnings) {
          return {
            type: 'warning',
            message: `Attenzione ${employeeName} questa settimana non hai superato il guadagno lordo della settimana precedente, ma sono sicuro che la prossima settimana non sarà così. 😉`,
            style: {
              color: '#f44336',
              backgroundColor: 'rgba(244, 67, 54, 0.15)',
              border: '1px solid rgba(244, 67, 54, 0.3)'
            }
          };
        } else if (currentWeekEarnings === previousWeekEarnings) {
          return {
            type: 'equal',
            message: `Complimenti ${employeeName}, hai incassato ${previousWeekEarnings.toFixed(2)}€ come la settimana precedente, continua così, mi aspetto sempre di più da te!`,
            style: {
              color: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }
          };
        }
      }

      // Durante la settimana: messaggio di incoraggiamento con guadagno settimana precedente
      return {
        type: 'encouragement',
        message: `Bravo ${employeeName} la settimana precedente hai guadagnato un totale lordo di ${previousWeekEarnings.toFixed(2)}€, questa settimana cerchiamo di superare questa somma!!`,
        style: {
          color: '#2196F3',
          backgroundColor: 'rgba(33, 150, 243, 0.15)',
          border: '1px solid rgba(33, 150, 243, 0.3)'
        }
      };
    }

    // Se non c'è guadagno della settimana precedente e non è la prima settimana, mostra solo la citazione mensile
    if (previousWeekEarnings === 0 && !isFirstWeekOfMonth()) {
      if (quote) {
        return {
          type: 'quote',
          message: quote,
          style: {
            color: '#4caf50',
            backgroundColor: 'rgba(76, 175, 80, 0.15)',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }
        };
      }
    }

    // Se siamo nella prima settimana e non ci sono dati settimanali, non ritornare nulla (il messaggio sarà gestito separatamente)
    if (isFirstWeekOfMonth() && previousWeekEarnings === 0) {
      return null;
    }

    return null;
  }, [auth, selectedEmployee, employees, appointments, getWeeklyGrossEarnings, isFirstWeekOfMonth]);

  const motivationalMessage = getMotivationalMessage();
  
  // Ottieni sempre la citazione mensile
  const getMonthlyQuote = useCallback(() => {
    if (!auth || !selectedEmployee) return null;
    const today = new Date();
    const month = today.getMonth();
    return monthlyQuotes[month] || null;
  }, [auth, selectedEmployee]);

  const monthlyQuote = getMonthlyQuote();
  
  // Ottieni il messaggio di inizio settimana (solo nella prima settimana)
  const getFirstWeekMessage = useCallback(() => {
    if (!auth || !selectedEmployee) return null;
    const selectedEmp = employees.find(emp => {
      const empId = typeof emp.id === 'string' ? parseInt(emp.id) : emp.id;
      const selId = typeof selectedEmployee === 'string' ? parseInt(selectedEmployee) : selectedEmployee;
      return empId === selId;
    });
    if (!selectedEmp) return null;
    
    // Verifica se siamo nella prima settimana
    try {
      if (!isFirstWeekOfMonth()) return null;
    } catch (e) {
      return null;
    }
    
    const employeeName = selectedEmp?.fullName || selectedEmp?.name || 'dipendente';
    return `Buon inizio settimana ${employeeName}`;
  }, [auth, selectedEmployee, employees, isFirstWeekOfMonth]);
  
  const firstWeekMessage = getFirstWeekMessage();
  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);
  const unpaidAppointments = getUnpaidAppointments();

  return (
    <div className="appointments-container fade-in">
      <div className="appointments-header">
        <h2 className="section-title">Appuntamenti</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-picker"
        />
      </div>

      {employees.length === 0 ? (
        <div className="no-employees-message">
          <p>Nessun dipendente disponibile. Aggiungi un dipendente dalla sezione "Dipendenti".</p>
        </div>
      ) : (
        <>
          <div className="employee-selector">
            {employees.map(employee => (
              <button
                key={employee.id}
                className={`employee-button ${selectedEmployee === employee.id ? 'active' : ''}`}
                onClick={() => setSelectedEmployee(employee.id)}
              >
                <span className="employee-name">{employee.fullName}</span>
                <span className="employee-earnings">
                  {getDailyEarnings(employee.id).toFixed(2)} €
                </span>
              </button>
            ))}
          </div>

          {selectedEmployeeData && (
            <>
              <div className="earnings-display">
                <div className="earnings-row">
                  <div className="earnings-item">
                    <span className="earnings-label-small">Contanti</span>
                    <span className="earnings-amount-medium">{getCashEarnings(selectedEmployee).toFixed(2)} €</span>
                  </div>
                  <div className="earnings-divider"></div>
                  <div className="earnings-item">
                    <span className="earnings-label-small">Carta</span>
                    <span className="earnings-amount-medium">{getCardEarnings(selectedEmployee).toFixed(2)} €</span>
                  </div>
                  <div className="earnings-divider"></div>
                  <div className="earnings-item earnings-total">
                    <span className="earnings-label">Totale</span>
                    <span className="earnings-amount animated-total">
                      {animatedTotal.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {firstWeekMessage && (
                <div 
                  style={{
                    margin: '15px 0',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontSize: '1em',
                    lineHeight: '1.6',
                    color: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}
                >
                  {firstWeekMessage}
                </div>
              )}

              {monthlyQuote && (
                <div 
                  style={{
                    margin: '15px 0',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontSize: '1em',
                    lineHeight: '1.6',
                    color: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.15)',
                    border: '1px solid rgba(76, 175, 80, 0.3)'
                  }}
                >
                  {monthlyQuote}
                </div>
              )}

              {motivationalMessage && motivationalMessage.type !== 'quote' && motivationalMessage.type !== 'first-week' && (
                <div 
                  style={{
                    margin: '15px 0',
                    padding: '12px 18px',
                    borderRadius: '8px',
                    fontSize: '1em',
                    lineHeight: '1.6',
                    ...motivationalMessage.style
                  }}
                >
                  {motivationalMessage.message}
                </div>
              )}

              {unpaidAppointments.length > 0 && (
                <button
                  className="unpaid-notification-button"
                  onClick={() => setIsUnpaidModalOpen(true)}
                >
                  <span className="notification-icon">💬</span>
                  <span className="notification-text">
                    {unpaidAppointments.length === 1 ? (
                      <>Hey <strong>{selectedEmployeeData.fullName}</strong>, c'è <strong>{unpaidAppointments.length}</strong> cliente che deve ancora pagarti!!</>
                    ) : (
                      <>Hey <strong>{selectedEmployeeData.fullName}</strong>, ci sono <strong>{unpaidAppointments.length}</strong> clienti che devono ancora pagarti!!</>
                    )}
                  </span>
                </button>
              )}
            </>
          )}

          <div className="calendar-container">
            <div className="time-slots">
              {timeSlots.map(timeSlot => {
                const appointmentsForSlot = getAppointmentsForTimeSlot(timeSlot);
                
                return (
                  <div
                    key={timeSlot}
                    className={`time-slot ${appointmentsForSlot.length > 0 ? 'occupied' : ''}`}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                  >
                    <span className="time-label">{timeSlot}</span>
                    <div className="appointments-list">
                      {appointmentsForSlot.map(appointment => {
                        const employeeColor = getEmployeeColor(appointment.employeeId);
                        const rgbColor = hexToRgb(employeeColor);
                        
                        return (
                          <div
                            key={appointment.id}
                            className="appointment-item"
                            onClick={(e) => handleAppointmentClick(appointment, e)}
                            style={{
                              backgroundColor: `rgba(${rgbColor}, 0.2)`,
                              borderColor: `rgba(${rgbColor}, 0.4)`
                            }}
                          >
                            <div className="appointment-info">
                              <div className="appointment-name">{appointment.clientName}</div>
                              <div className="appointment-service">{appointment.serviceType}</div>
                              <div className="appointment-time">
                                {appointment.startTime} - {appointment.endTime}
                              </div>
                              <div className={`appointment-payment ${appointment.paymentMethod}`}>
                                {appointment.paymentMethod === 'da-pagare' ? 'DA PAGARE' : appointment.paymentMethod.charAt(0).toUpperCase() + appointment.paymentMethod.slice(1)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {appointmentsForSlot.length === 0 && (
                        <div className="empty-slot-hint">Clicca per aggiungere appuntamento</div>
                      )}
                      {appointmentsForSlot.length > 0 && (
                        <button
                          className="add-appointment-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTimeSlotClick(timeSlot);
                          }}
                          title="Aggiungi altro appuntamento"
                        >
                          + Aggiungi
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <AppointmentModal
          appointment={selectedAppointment}
          defaultTimeSlot={selectedTimeSlot}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
          onClose={() => {
            if (!isSaving) {
              setIsModalOpen(false);
              setSelectedAppointment(null);
              setSelectedTimeSlot(null);
            }
          }}
          isLoading={isSaving}
        />
      )}

      {isUnpaidModalOpen && unpaidAppointments.length > 0 && (
        <div className="modal-overlay" onClick={() => setIsUnpaidModalOpen(false)}>
          <div className="unpaid-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Clienti che devono ancora pagare</h3>
              <button className="modal-close" onClick={() => setIsUnpaidModalOpen(false)}>×</button>
            </div>
            <div className="unpaid-modal-list">
              {unpaidAppointments.map(appointment => (
                <div
                  key={appointment.id}
                  className="unpaid-modal-item"
                  onClick={() => {
                    setIsUnpaidModalOpen(false);
                    handleUnpaidClick(appointment);
                  }}
                >
                  <div className="unpaid-modal-item-content">
                    <div className="unpaid-modal-client-name">{appointment.clientName}</div>
                    <div className="unpaid-modal-details">
                      <span className="unpaid-modal-service">{appointment.serviceType}</span>
                      <span className="unpaid-modal-time">{appointment.startTime} - {appointment.endTime}</span>
                      <span className="unpaid-modal-price">{getPrice(appointment.serviceType).toFixed(2)} €</span>
                    </div>
                  </div>
                  <div className="unpaid-modal-arrow">→</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;

