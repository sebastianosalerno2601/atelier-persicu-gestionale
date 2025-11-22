import React, { useState, useEffect } from 'react';
import { getUtilities as getUtilitiesAPI, saveUtilities as saveUtilitiesAPI } from '../utils/api';
import './Utilities.css';

const Utilities = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [utilities, setUtilities] = useState({
    pigione: '',
    acqua: '',
    luce: '',
    spazzatura: '',
    gas: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUtilities();
  }, [currentMonth]);

  const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const loadUtilities = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const data = await getUtilitiesAPI(monthKey);
      if (data && data.pigione !== undefined) {
        setUtilities({
          pigione: data.pigione || '',
          acqua: data.acqua || '',
          luce: data.luce || '',
          spazzatura: data.spazzatura || '',
          gas: data.gas || ''
        });
      } else {
        setUtilities({
          pigione: '',
          acqua: '',
          luce: '',
          spazzatura: '',
          gas: ''
        });
      }
    } catch (error) {
      console.error('Errore caricamento utenze:', error);
      // Se non esiste, inizializza con valori vuoti
      setUtilities({
        pigione: '',
        acqua: '',
        luce: '',
        spazzatura: '',
        gas: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (key, value) => {
    const newUtilities = {
      ...utilities,
      [key]: value
    };
    setUtilities(newUtilities);
    
    try {
      const monthKey = getMonthKey(currentMonth);
      await saveUtilitiesAPI(monthKey, newUtilities);
    } catch (error) {
      console.error('Errore salvataggio utenze:', error);
      alert('Errore nel salvataggio delle utenze: ' + error.message);
      // Ripristina lo stato precedente in caso di errore
      loadUtilities();
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
    return Object.values(utilities).reduce((sum, value) => {
      const num = parseFloat(value) || 0;
      return sum + num;
    }, 0);
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const utilityLabels = {
    pigione: 'Pigione',
    acqua: 'Acqua',
    luce: 'Luce',
    spazzatura: 'Spazzatura',
    gas: 'Gas'
  };

  return (
    <div className="utilities-container fade-in">
      <div className="utilities-header">
        <h2 className="section-title">Utenze</h2>
      </div>

      <div className="utilities-content">
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

        <div className="utilities-list">
          {Object.keys(utilityLabels).map((key) => (
            <div key={key} className="utility-item">
              <label className="utility-label">{utilityLabels[key]}</label>
              <div className="utility-input-container">
                <input
                  type="number"
                  className="utility-input"
                  value={utilities[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                <span className="utility-currency">€</span>
              </div>
            </div>
          ))}
        </div>

        <div className="utilities-total">
          <div className="total-label">Totale mensile</div>
          <div className="total-amount">
            {calculateTotal().toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
};

export default Utilities;

