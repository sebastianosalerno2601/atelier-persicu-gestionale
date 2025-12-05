import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getEmployees as getEmployeesAPI, getAppointments as getAppointmentsAPI, createAppointment, updateAppointment, deleteAppointment } from '../utils/api';
import AppointmentModal from './AppointmentModal';
import './AllCalendar.css';

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

const AllCalendar = () => {
  const [employees, setEmployees] = useState([]);
  const [appointments, setAppointments] = useState([]);
  // Funzione per ottenere la data locale in formato YYYY-MM-DD
  const getLocalDateString = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedAppointment, setSelectedAppointment] = useState(null); // Per modifica nel modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [selectedForMove, setSelectedForMove] = useState(null); // Appuntamento selezionato per spostamento
  const [draggedAppointment, setDraggedAppointment] = useState(null);
  const [selectedEmployeeForNew, setSelectedEmployeeForNew] = useState(null);
  const [dragOverCell, setDragOverCell] = useState(null);
  const [touchStartPos, setTouchStartPos] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchElement, setTouchElement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  
  // Refs per accedere ai valori più recenti nei listener
  const touchStartPosRef = useRef(null);
  const draggedAppointmentRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Rileva dimensioni schermo per mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    loadEmployees();
    loadAppointments();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await getEmployeesAPI();
      const camelCaseData = Array.isArray(data) ? data.map(employeeToCamelCase) : [];
      setEmployees(camelCaseData);
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await getAppointmentsAPI();
      const camelCaseData = Array.isArray(data) ? data.map(appointmentToCamelCase) : [];
      setAppointments(camelCaseData);
    } catch (error) {
      console.error('❌ Errore caricamento appuntamenti:', error);
      alert('Errore nel caricamento degli appuntamenti: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
  }

  const getAppointmentsForSlot = (timeSlot, employeeId) => {
    // Normalizza la data selezionata per il confronto
    const normalizedSelectedDate = selectedDate ? selectedDate.split('T')[0] : selectedDate;
    
    const filtered = appointments.filter(apt => {
      // Normalizza la data per il confronto (rimuove eventuali timestamp)
      const aptDate = apt.date ? apt.date.split('T')[0] : apt.date;
      // Converti employeeId a numero per il confronto
      const aptEmployeeId = typeof apt.employeeId === 'string' ? parseInt(apt.employeeId) : apt.employeeId;
      const empId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
      // Normalizza l'orario (rimuove eventuali secondi)
      const aptTime = apt.startTime ? apt.startTime.split(':').slice(0, 2).join(':') : apt.startTime;
      const slotTime = timeSlot.split(':').slice(0, 2).join(':');
      
      const matches = aptDate === normalizedSelectedDate && aptEmployeeId === empId && aptTime === slotTime;
      
      return matches;
    });
    
    return filtered;
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

  const handleSlotClick = async (timeSlot, employeeId, e) => {
    // Se c'è un appuntamento selezionato per lo spostamento, spostalo qui
    if (selectedForMove) {
      e?.stopPropagation();
      try {
        const normalizedEmployeeId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
        
        // Normalizza la data originale
        let originalDate = selectedForMove.date;
        if (originalDate && typeof originalDate === 'string') {
          originalDate = originalDate.split('T')[0];
        }
        
        const updatedAppointment = {
          ...selectedForMove,
          employeeId: normalizedEmployeeId,
          startTime: timeSlot,
          endTime: calculateEndTime(timeSlot, selectedForMove.serviceType),
          date: originalDate
        };
        
        const appointmentToUpdate = appointmentToSnakeCase(updatedAppointment);
        await updateAppointment(selectedForMove.id, appointmentToUpdate);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        await loadAppointments();
        
        setSelectedForMove(null);
      } catch (error) {
        console.error('❌ Errore spostamento appuntamento:', error);
        alert('Errore nello spostamento dell\'appuntamento: ' + error.message);
        setSelectedForMove(null);
      }
      return;
    }
    
    // Altrimenti, apri modal per nuovo appuntamento
    setSelectedTimeSlot(timeSlot);
    setSelectedAppointment(null);
    setSelectedEmployeeForNew(employeeId);
    setIsModalOpen(true);
  };

  const handleAppointmentClick = (appointment, e) => {
    e.stopPropagation();
    e.preventDefault();
    // Se è mobile, seleziona per spostamento
    if (isMobile) {
      // Su mobile, resetta prima il drag state per sicurezza
      setDraggedAppointment(null);
      setIsDragging(false);
      setSelectedForMove(appointment);
    } else {
      // Su desktop, apri modal (comportamento originale)
      setSelectedAppointment(appointment);
      setSelectedTimeSlot(appointment.startTime);
      setIsModalOpen(true);
    }
  };
  
  const handleEditClick = (appointment, e) => {
    e.stopPropagation();
    setSelectedAppointment(appointment);
    setSelectedTimeSlot(appointment.startTime);
    setIsModalOpen(true);
  };

  const handleDragStart = (appointment, e) => {
    // Previeni drag su mobile
    if (isMobile) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedAppointment(appointment);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', appointment.id);
    }
  };

  // Supporto touch per mobile
  const handleTouchStart = (appointment, e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const startPos = { x: touch.clientX, y: touch.clientY };
    setTouchStartPos(startPos);
    setDraggedAppointment(appointment);
    setTouchElement(e.currentTarget);
    setIsDragging(false);
    
    // Aggiorna i ref
    touchStartPosRef.current = startPos;
    draggedAppointmentRef.current = appointment;
    isDraggingRef.current = false;
  };

  const handleTouchMove = useCallback((e) => {
    const currentTouchStartPos = touchStartPosRef.current;
    const currentDraggedAppointment = draggedAppointmentRef.current;
    
    if (!currentTouchStartPos || !currentDraggedAppointment) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - currentTouchStartPos.x);
    const deltaY = Math.abs(touch.clientY - currentTouchStartPos.y);
    
    // Se il movimento è significativo, considera come drag
    if (deltaX > 10 || deltaY > 10) {
      e.preventDefault();
      setIsDragging(true);
      isDraggingRef.current = true;
      
      // Trova l'elemento drag e applica stile
      const dragEl = document.querySelector(`[data-appointment-id="${currentDraggedAppointment.id}"]`);
      if (dragEl) {
        dragEl.style.opacity = '0.5';
        dragEl.style.transform = 'scale(0.95)';
        dragEl.style.transition = 'none';
      }
      
      // Trova la cella sotto il touch
      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementBelow) {
        const cell = elementBelow.closest('.appointment-cell');
        if (cell) {
          const employeeId = cell.getAttribute('data-employee-id');
          const timeSlot = cell.getAttribute('data-time-slot');
          if (employeeId && timeSlot) {
            setDragOverCell(`${employeeId}-${timeSlot}`);
          } else {
            setDragOverCell(null);
          }
        } else {
          setDragOverCell(null);
        }
      }
    }
  }, []);

  const handleTouchEnd = useCallback(async (e) => {
    const currentTouchStartPos = touchStartPosRef.current;
    const currentDraggedAppointment = draggedAppointmentRef.current;
    const currentIsDragging = isDraggingRef.current;
    
    if (!currentTouchStartPos || !currentDraggedAppointment) {
      setTouchStartPos(null);
      setTouchElement(null);
      setIsDragging(false);
      touchStartPosRef.current = null;
      draggedAppointmentRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    // Reset stile elemento drag
    const dragEl = document.querySelector(`[data-appointment-id="${currentDraggedAppointment.id}"]`);
    if (dragEl) {
      dragEl.style.opacity = '';
      dragEl.style.transform = '';
      dragEl.style.transition = '';
    }

    if (!currentIsDragging) {
      // Se non era un drag, resetta e lascia gestire il click
      setTouchStartPos(null);
      setDraggedAppointment(null);
      setTouchElement(null);
      setIsDragging(false);
      touchStartPosRef.current = null;
      draggedAppointmentRef.current = null;
      isDraggingRef.current = false;
      return;
    }

    const touch = e.changedTouches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow) {
      const cell = elementBelow.closest('.appointment-cell');
      if (cell) {
        const employeeId = cell.getAttribute('data-employee-id');
        const timeSlot = cell.getAttribute('data-time-slot');
        
        if (employeeId && timeSlot && currentDraggedAppointment) {
          // Esegui il drop
          try {
            const normalizedEmployeeId = typeof employeeId === 'string' ? parseInt(employeeId) : employeeId;
            
            // Normalizza la data originale
            let originalDate = currentDraggedAppointment.date;
            if (originalDate && typeof originalDate === 'string') {
              originalDate = originalDate.split('T')[0];
            }
            
            const updatedAppointment = {
              ...currentDraggedAppointment,
              employeeId: normalizedEmployeeId,
              startTime: timeSlot,
              endTime: calculateEndTime(timeSlot, currentDraggedAppointment.serviceType),
              // Mantieni la data originale dell'appuntamento, normalizzata
              date: originalDate
            };
            
            const appointmentToUpdate = appointmentToSnakeCase(updatedAppointment);
            await updateAppointment(currentDraggedAppointment.id, appointmentToUpdate);
            
            // Piccolo delay per assicurarsi che il database sia aggiornato
            await new Promise(resolve => setTimeout(resolve, 100));
            
            await loadAppointments();
          } catch (error) {
            console.error('❌ Errore aggiornamento appuntamento (drag & drop touch):', error);
            alert('Errore nello spostamento dell\'appuntamento: ' + error.message);
          }
        }
      }
    }

    // Reset state
    setTouchStartPos(null);
    setDraggedAppointment(null);
    setDragOverCell(null);
    setTouchElement(null);
    setIsDragging(false);
    touchStartPosRef.current = null;
    draggedAppointmentRef.current = null;
    isDraggingRef.current = false;
  }, [selectedDate]);

  const handleDragOver = (employeeId, timeSlot, e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(`${employeeId}-${timeSlot}`);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCell(null);
  };

  const handleDrop = async (targetEmployeeId, targetTimeSlot, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedAppointment) return;

    try {
      const normalizedEmployeeId = typeof targetEmployeeId === 'string' ? parseInt(targetEmployeeId) : targetEmployeeId;
      
      // Normalizza la data originale
      let originalDate = draggedAppointment.date;
      if (originalDate && typeof originalDate === 'string') {
        originalDate = originalDate.split('T')[0];
      }
      
      const updatedAppointment = {
        ...draggedAppointment,
        employeeId: normalizedEmployeeId,
        startTime: targetTimeSlot,
        endTime: calculateEndTime(targetTimeSlot, draggedAppointment.serviceType),
        // Mantieni la data originale dell'appuntamento, normalizzata
        date: originalDate
      };
      
      const appointmentToUpdate = appointmentToSnakeCase(updatedAppointment);
      await updateAppointment(draggedAppointment.id, appointmentToUpdate);
      
      // Piccolo delay per assicurarsi che il database sia aggiornato
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await loadAppointments();
      
      setDraggedAppointment(null);
      setDragOverCell(null);
    } catch (error) {
      console.error('❌ Errore aggiornamento appuntamento (drag & drop):', error);
      alert('Errore nello spostamento dell\'appuntamento: ' + error.message);
      setDraggedAppointment(null);
      setDragOverCell(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedAppointment(null);
    setDragOverCell(null);
  };

  // Helper per convertire hex a rgb
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '255, 255, 255';
  };

  const calculateEndTime = (startTime, serviceType) => {
    const durations = {
      'Taglio': 45,
      'Taglio e barba': 60,
      'Taglio, barba e colore': 60,
      'Barba': 25,
      'Taglio baby': 60,
      'Rasatura': 60,
      'Pausa': 60
    };

    const duration = durations[serviceType] || 30;
    const [hours, mins] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + duration;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
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
        const newAppointment = {
          ...appointmentToSnakeCase({
            ...appointmentData,
            date: selectedDate,
            employeeId: selectedEmployeeForNew
          })
        };
        await createAppointment(newAppointment);
      }

      await loadAppointments();
      setIsModalOpen(false);
      setSelectedAppointment(null);
      setSelectedTimeSlot(null);
      setSelectedEmployeeForNew(null);
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

  // Aggiungi listener globali per touch events SOLO su desktop (per drag & drop)
  // Su mobile non servono perché usiamo selezione + click
  useEffect(() => {
    if (!isMobile) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);

      return () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
    // Su mobile non registriamo listener, quindi ritorniamo una funzione vuota
    return () => {};
  }, [handleTouchMove, handleTouchEnd, isMobile]);

  return (
    <div className="all-calendar-container fade-in">
      <div className="all-calendar-header">
        <h2 className="section-title">All Calendar</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {selectedForMove && isMobile && (
            <div className="move-selection-indicator">
              <span>📌 Appuntamento selezionato. Clicca su uno slot per spostarlo.</span>
              <button 
                onClick={() => setSelectedForMove(null)}
                className="cancel-move-btn"
              >
                ✕ Annulla
              </button>
            </div>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedForMove(null); // Reset selezione quando cambi data
            }}
            className="date-picker"
          />
        </div>
      </div>

      {employees.length === 0 ? (
        <div className="no-employees-message">
          <p>Nessun dipendente disponibile. Aggiungi un dipendente dalla sezione "Dipendenti".</p>
        </div>
      ) : (
        <div className="calendar-table-container">
          <table className="calendar-table">
            <thead>
              <tr>
                <th className="time-column">Orario</th>
                {employees.map(employee => (
                  <th 
                    key={employee.id} 
                    className="employee-column"
                    style={{
                      backgroundColor: employee.color 
                        ? `rgba(${hexToRgb(employee.color)}, 0.15)` 
                        : undefined
                    }}
                  >
                    {employee.fullName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot}>
                  <td className="time-cell">{timeSlot}</td>
                  {employees.map(employee => {
                    const slotAppointments = getAppointmentsForSlot(timeSlot, employee.id);
                    return (
                      <td
                        key={employee.id}
                        className={`appointment-cell ${dragOverCell === `${employee.id}-${timeSlot}` ? 'drag-over' : ''} ${selectedForMove && isMobile && slotAppointments.length === 0 ? 'can-drop-move' : ''}`}
                        data-employee-id={employee.id}
                        data-time-slot={timeSlot}
                        style={{
                          backgroundColor: employee.color 
                            ? `rgba(${hexToRgb(employee.color)}, 0.1)` 
                            : undefined
                        }}
                        onDragOver={!isMobile ? (e) => handleDragOver(employee.id, timeSlot, e) : undefined}
                        onDragLeave={!isMobile ? handleDragLeave : undefined}
                        onDrop={!isMobile ? (e) => handleDrop(employee.id, timeSlot, e) : undefined}
                        onClick={(e) => {
                          handleSlotClick(timeSlot, employee.id, e);
                        }}
                      >
                        <div className="appointments-in-cell">
                          {slotAppointments.map(appointment => {
                            const employeeColor = getEmployeeColor(appointment.employeeId);
                            const rgbColor = hexToRgb(employeeColor);
                            
                            return (
                            <div
                              key={appointment.id}
                              data-appointment-id={appointment.id}
                              className={`calendar-appointment ${draggedAppointment?.id === appointment.id ? 'dragging' : ''} ${selectedForMove?.id === appointment.id ? 'selected-for-move' : ''}`}
                              draggable={!isMobile}
                              onDragStart={!isMobile ? (e) => handleDragStart(appointment, e) : (e) => e.preventDefault()}
                              onDragEnd={!isMobile ? handleDragEnd : undefined}
                              onDrag={(e) => { if (isMobile) e.preventDefault(); }}
                              onClick={(e) => {
                                handleAppointmentClick(appointment, e);
                              }}
                              style={{
                                backgroundColor: `rgba(${rgbColor}, 0.2)`,
                                borderColor: `rgba(${rgbColor}, 0.4)`
                              }}
                            >
                              <button
                                className="appointment-edit-btn"
                                onClick={(e) => handleEditClick(appointment, e)}
                                title="Modifica appuntamento"
                              >
                                ✏️
                              </button>
                              <div className="calendar-appointment-name">{appointment.clientName}</div>
                              <div className="calendar-appointment-service">{appointment.serviceType}</div>
                              <div className="calendar-appointment-time">
                                {appointment.startTime} - {appointment.endTime}
                              </div>
                              <div className={`calendar-appointment-payment ${appointment.paymentMethod}`}>
                                {appointment.paymentMethod === 'da-pagare' ? 'DA PAGARE' : appointment.paymentMethod.charAt(0).toUpperCase() + appointment.paymentMethod.slice(1)}
                              </div>
                            </div>
                            );
                          })}
                          {slotAppointments.length === 0 && (
                            <div className="empty-cell-hint">Clicca per aggiungere</div>
                          )}
                          {slotAppointments.length > 0 && (
                            <button
                              className="add-appointment-in-cell-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSlotClick(timeSlot, employee.id);
                              }}
                              title="Aggiungi altro appuntamento"
                            >
                              +
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            setSelectedEmployeeForNew(null);
            setSelectedForMove(null); // Reset selezione quando chiudi modal
          }}
        />
      )}
    </div>
  );
};

export default AllCalendar;

