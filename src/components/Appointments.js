import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getEmployees as getEmployeesAPI, getAppointments as getAppointmentsAPI, createAppointment, updateAppointment, deleteAppointment } from '../utils/api';
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
    paymentMethod: obj.payment_method
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
    paymentMethod: obj.paymentMethod
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
    loadEmployees();
    loadAppointments();
  }, []);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].id);
    }
  }, [employees, selectedEmployee]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentsAPI();
      const camelCaseData = Array.isArray(data) ? data.map(appointmentToCamelCase) : [];
      setAppointments(camelCaseData);
    } catch (error) {
      console.error('Errore caricamento appuntamenti:', error);
      alert('Errore nel caricamento degli appuntamenti');
    } finally {
      setLoading(false);
    }
  };

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
      
      return aptDate === selectedDate && aptEmployeeId === selectedEmpId;
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
    
    if (filtered.length > 0) {
      console.log(`Appuntamenti per slot ${timeSlot}:`, filtered.length, filtered);
    }
    
    return filtered;
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
    try {
      if (selectedAppointment) {
        // Modifica appuntamento esistente
        const appointmentToUpdate = {
          ...appointmentToSnakeCase({ ...selectedAppointment, ...appointmentData, employeeId: selectedAppointment.employeeId, date: selectedAppointment.date })
        };
        await updateAppointment(selectedAppointment.id, appointmentToUpdate);
      } else {
        // Nuovo appuntamento
        if (appointmentData.isRecurring) {
          // Crea ricorrenze settimanali per 1 anno
          const recurringDates = generateWeeklyRecurrences(selectedDate, 52);
          
          // Crea tutti gli appuntamenti ricorrenti
          for (const date of recurringDates) {
            const newAppointment = {
              ...appointmentToSnakeCase({
                ...appointmentData,
                date: date,
                employeeId: selectedEmployee
              })
            };
            await createAppointment(newAppointment);
          }
        } else {
          // Singolo appuntamento
          const newAppointment = {
            ...appointmentToSnakeCase({
              ...appointmentData,
              date: selectedDate,
              employeeId: selectedEmployee
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
      alert('Errore nel salvataggio dell\'appuntamento: ' + error.message);
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
                
                // Debug per il primo slot con appuntamenti
                if (appointmentsForSlot.length > 0 && timeSlot === timeSlots[0]) {
                  console.log(`Primo slot (${timeSlot}) ha ${appointmentsForSlot.length} appuntamenti:`, appointmentsForSlot);
                }
                
                return (
                  <div
                    key={timeSlot}
                    className={`time-slot ${appointmentsForSlot.length > 0 ? 'occupied' : ''}`}
                    onClick={() => handleTimeSlotClick(timeSlot)}
                  >
                    <span className="time-label">{timeSlot}</span>
                    <div className="appointments-list">
                      {appointmentsForSlot.map(appointment => (
                          <div
                            key={appointment.id}
                            className="appointment-item"
                            onClick={(e) => handleAppointmentClick(appointment, e)}
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
                      ))}
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
            setIsModalOpen(false);
            setSelectedAppointment(null);
            setSelectedTimeSlot(null);
          }}
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

