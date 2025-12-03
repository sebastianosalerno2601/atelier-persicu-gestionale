import React, { useState, useEffect } from 'react';
import { getDurationMinutes, addMinutes } from '../utils/storage';
import './AppointmentModal.css';

const AppointmentModal = ({ appointment, defaultTimeSlot, onSave, onDelete, onClose }) => {
  const isEditing = !!appointment;
  
  const [clientName, setClientName] = useState(appointment?.clientName || '');
  const [serviceType, setServiceType] = useState(appointment?.serviceType || 'Taglio');
  const [startTime, setStartTime] = useState(appointment?.startTime || defaultTimeSlot || '09:00');
  const [endTime, setEndTime] = useState(appointment?.endTime || '');
  const [paymentMethod, setPaymentMethod] = useState(appointment?.paymentMethod || 'da-pagare');
  const [isRecurring, setIsRecurring] = useState(appointment?.isRecurring || !!appointment?.recurrenceGroupId || false);
  const [hasProductSold, setHasProductSold] = useState(!!appointment?.productSold);
  const [productSold, setProductSold] = useState(appointment?.productSold || '');

  useEffect(() => {
    // Calcola automaticamente l'ora di fine in base al tipo di servizio
    if (startTime && serviceType) {
      const duration = getDurationMinutes(serviceType);
      const calculatedEndTime = addMinutes(startTime, duration);
      setEndTime(calculatedEndTime);
    }
  }, [serviceType, startTime]);

  useEffect(() => {
    // Aggiorna isRecurring quando cambia l'appuntamento
    if (appointment) {
      setIsRecurring(appointment.isRecurring || !!appointment.recurrenceGroupId || false);
    }
  }, [appointment]);

  const handleServiceChange = (e) => {
    const newService = e.target.value;
    setServiceType(newService);
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setStartTime(newStartTime);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Inserisci il nome del cliente');
      return;
    }

    onSave({
      clientName: clientName.trim(),
      serviceType,
      startTime,
      endTime,
      paymentMethod,
      isRecurring: isEditing ? isRecurring : (isRecurring && !isEditing),
      productSold: hasProductSold ? productSold : null
    });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 21; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const timeString = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="clientName">Nome e cognome</label>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
              placeholder="Inserisci nome e cognome"
            />
          </div>

          <div className="form-group">
            <label htmlFor="serviceType">Tipo di lavorazione</label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={handleServiceChange}
              required
            >
              <option value="Taglio">Taglio</option>
              <option value="Taglio e barba">Taglio e barba</option>
              <option value="Taglio, barba e colore">Taglio, barba e colore</option>
              <option value="Barba">Barba</option>
              <option value="Taglio baby">Taglio baby</option>
              <option value="Rasatura">Rasatura</option>
              <option value="Pausa">Pausa</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Dalle ore</label>
              <select
                id="startTime"
                value={startTime}
                onChange={handleStartTimeChange}
                required
              >
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Alle ore</label>
              <select
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              >
                {generateTimeOptions().map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod">Metodo di pagamento</label>
            <select
              id="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              required
            >
              <option value="da-pagare">DA PAGARE</option>
              <option value="carta">Carta</option>
              <option value="contanti">Contanti</option>
              <option value="scontistica">Scontistica</option>
            </select>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={hasProductSold}
                onChange={(e) => {
                  setHasProductSold(e.target.checked);
                  if (!e.target.checked) {
                    setProductSold('');
                  }
                }}
              />
              <span>Prodotto venduto</span>
            </label>
          </div>

          {hasProductSold && (
            <div className="form-group">
              <label htmlFor="productSold">Seleziona prodotto</label>
              <select
                id="productSold"
                value={productSold}
                onChange={(e) => setProductSold(e.target.value)}
                required={hasProductSold}
              >
                <option value="">Seleziona un prodotto</option>
                <option value="Cera 50ml">Cera 50ml (5€)</option>
                <option value="Cera 100ml">Cera 100ml (10€)</option>
                <option value="Lacca">Lacca (10€)</option>
                <option value="Crema ricci">Crema ricci (10€)</option>
                <option value="Cera in polvere">Cera in polvere (10€)</option>
                <option value="Dopobarba">Dopobarba (10€)</option>
              </select>
            </div>
          )}

          {!isEditing && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                />
                <span>Ricorrenza settimanale (per 1 anno)</span>
              </label>
              <small className="form-hint">
                Crea lo stesso appuntamento ogni settimana per 1 anno a partire dalla data selezionata
              </small>
            </div>
          )}
          
          {isEditing && (appointment?.isRecurring || appointment?.recurrenceGroupId) && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    if (!newValue) {
                      const confirmMessage = 'Sei sicuro di voler rimuovere la ricorrenza settimanale? Tutti gli appuntamenti futuri di questo cliente verranno cancellati.';
                      if (window.confirm(confirmMessage)) {
                        setIsRecurring(false);
                      }
                    } else {
                      setIsRecurring(true);
                    }
                  }}
                />
                <span>Ricorrenza settimanale (per 1 anno)</span>
              </label>
              <small className="form-hint">
                Deflaggare rimuoverà la ricorrenza e cancellerà tutti gli appuntamenti futuri di questo cliente
              </small>
            </div>
          )}

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className="btn-delete"
                onClick={() => {
                  if (window.confirm('Sei sicuro di voler eliminare questo appuntamento?')) {
                    onDelete(appointment.id);
                  }
                }}
              >
                Elimina
              </button>
            )}
            <div className="action-buttons">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn-save">
                {isEditing ? 'Salva modifiche' : 'Salva'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;


