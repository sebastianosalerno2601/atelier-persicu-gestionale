import React, { useState, useEffect } from 'react';
import { getMaintenance, saveMaintenance as saveMaintenanceAPI } from '../utils/api';
import './Maintenance.css';

const Maintenance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [maintenance, setMaintenance] = useState({
    ordinaria: {
      price: '',
      notes: ''
    },
    straordinaria: {
      price: '',
      notes: ''
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadMaintenance();
  }, [currentMonth]);

  const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const loadMaintenance = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const data = await getMaintenance(monthKey);
      
      if (data) {
        setMaintenance({
          ordinaria: {
            price: data.ordinaria?.price || '',
            notes: data.ordinaria?.notes || ''
          },
          straordinaria: {
            price: data.straordinaria?.price || '',
            notes: data.straordinaria?.notes || ''
          }
        });
      } else {
        setMaintenance({
          ordinaria: { price: '', notes: '' },
          straordinaria: { price: '', notes: '' }
        });
      }
    } catch (error) {
      console.error('Errore caricamento manutenzioni:', error);
      // Inizializza con valori vuoti se non esistono
      setMaintenance({
        ordinaria: { price: '', notes: '' },
        straordinaria: { price: '', notes: '' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = async (type, value) => {
    const newMaintenance = {
      ...maintenance,
      [type]: {
        ...maintenance[type],
        price: value
      }
    };
    setMaintenance(newMaintenance);
    
    try {
      const monthKey = getMonthKey(currentMonth);
      const priceValue = parseFloat(value) || 0;
      await saveMaintenanceAPI(monthKey, type, priceValue, newMaintenance[type].notes);
    } catch (error) {
      console.error('Errore salvataggio manutenzione:', error);
      alert('Errore nel salvataggio della manutenzione: ' + error.message);
      // Ripristina lo stato precedente in caso di errore
      loadMaintenance();
    }
  };

  const handleNotesChange = async (type, value) => {
    const newMaintenance = {
      ...maintenance,
      [type]: {
        ...maintenance[type],
        notes: value
      }
    };
    setMaintenance(newMaintenance);
    
    try {
      const monthKey = getMonthKey(currentMonth);
      const priceValue = parseFloat(newMaintenance[type].price) || 0;
      await saveMaintenanceAPI(monthKey, type, priceValue, value);
    } catch (error) {
      console.error('Errore salvataggio manutenzione:', error);
      alert('Errore nel salvataggio della manutenzione: ' + error.message);
      // Ripristina lo stato precedente in caso di errore
      loadMaintenance();
    }
  };

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

  const calculateTotal = () => {
    const ordinaria = parseFloat(maintenance.ordinaria.price) || 0;
    const straordinaria = parseFloat(maintenance.straordinaria.price) || 0;
    return ordinaria + straordinaria;
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const maintenanceTypes = {
    ordinaria: 'Manutenzioni ordinarie',
    straordinaria: 'Manutenzione straordinaria'
  };

  return (
    <div className="maintenance-container fade-in">
      <div className="maintenance-header">
        <h2 className="section-title">Manutenzioni</h2>
      </div>

      <div className="maintenance-content">
        <div className="month-selector-section">
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

        <div className="maintenance-list">
          {Object.keys(maintenanceTypes).map((type) => (
            <div key={type} className="maintenance-item">
              <div className="maintenance-header-item">
                <label className="maintenance-label">{maintenanceTypes[type]}</label>
                {maintenance[type].price && parseFloat(maintenance[type].price) > 0 && (
                  <div className="maintenance-price-display">
                    <span className="price-label">Prezzo:</span>
                    <span className="price-value">{parseFloat(maintenance[type].price).toFixed(2)} €</span>
                  </div>
                )}
              </div>
              
              <div className="maintenance-inputs">
                <div className="maintenance-price-container">
                  <label className="input-label">Prezzo (€)</label>
                  <div className="price-input-container">
                    <input
                      type="number"
                      className="maintenance-price-input"
                      value={maintenance[type].price}
                      onChange={(e) => handlePriceChange(type, e.target.value)}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <span className="currency-symbol">€</span>
                  </div>
                </div>

                <div className="maintenance-notes-container">
                  <label className="input-label">Note</label>
                  <textarea
                    className="maintenance-notes-input"
                    value={maintenance[type].notes}
                    onChange={(e) => handleNotesChange(type, e.target.value)}
                    placeholder="Inserisci note..."
                    rows="4"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="maintenance-total">
          <div className="total-label">Totale mensile</div>
          <div className="total-amount">
            {calculateTotal().toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;

