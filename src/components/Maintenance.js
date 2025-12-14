import React, { useState, useEffect } from 'react';
import { getMaintenance, addMaintenanceExpense, deleteMaintenanceExpense, getMaintenanceNotes, saveMaintenanceNotes } from '../utils/api';
import './Maintenance.css';

const maintenanceTypes = {
  ordinaria: 'Manutenzioni ordinarie',
  straordinaria: 'Manutenzione straordinaria'
};

const Maintenance = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Array di spese per tipo: { id, price }
  const [expenses, setExpenses] = useState({
    ordinaria: [],
    straordinaria: []
  });

  const [tempInputs, setTempInputs] = useState({
    ordinaria: '',
    straordinaria: ''
  });

  const [showDetails, setShowDetails] = useState({});
  const [showNotes, setShowNotes] = useState({});
  const [notes, setNotes] = useState({
    ordinaria: '',
    straordinaria: ''
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
      
      // Il backend restituisce { expenses: { ordinaria: [...], straordinaria: [...] }, notes: {...} }
      const converted = {
        ordinaria: [],
        straordinaria: []
      };
      
      // Gestisce sia la nuova struttura (data.expenses) che la vecchia (data diretto) per retrocompatibilità
      const expensesData = data.expenses || data;
      
      Object.keys(maintenanceTypes).forEach(key => {
        if (expensesData[key] && Array.isArray(expensesData[key])) {
          converted[key] = expensesData[key].map(expense => ({
            id: expense.id,
            price: typeof expense.price === 'number' ? expense.price : parseFloat(expense.price)
          }));
        }
      });
      
      setExpenses(converted);
      
      // Carica le note
      if (data && data.notes) {
        setNotes({
          ordinaria: data.notes.ordinaria || '',
          straordinaria: data.notes.straordinaria || ''
        });
      } else {
        try {
          const notesData = await getMaintenanceNotes(monthKey);
          setNotes(notesData || { ordinaria: '', straordinaria: '' });
        } catch (error) {
          console.error('Errore caricamento note:', error);
          setNotes({ ordinaria: '', straordinaria: '' });
        }
      }
    } catch (error) {
      console.error('Errore caricamento manutenzioni:', error);
      setExpenses({
        ordinaria: [],
        straordinaria: []
      });
      setNotes({ ordinaria: '', straordinaria: '' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setTempInputs({
      ...tempInputs,
      [key]: value
    });
  };

  const handleInputBlur = async (key) => {
    const value = parseFloat(tempInputs[key]);
    if (!isNaN(value) && value > 0) {
      try {
        const monthKey = getMonthKey(currentMonth);
        await addMaintenanceExpense(monthKey, key, value);
        
        // Ricarica le spese per ottenere l'ID reale
        await loadMaintenance();
        
        setTempInputs({
          ...tempInputs,
          [key]: ''
        });
      } catch (error) {
        console.error('Errore aggiunta spesa manutenzione:', error);
        alert('Errore nell\'aggiunta della spesa: ' + error.message);
      }
    }
  };

  const handleInputKeyPress = (key, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur(key);
    }
  };

  const handleRemovePrice = async (key, expenseId) => {
    try {
      const monthKey = getMonthKey(currentMonth);
      await deleteMaintenanceExpense(monthKey, expenseId);
      await loadMaintenance();
    } catch (error) {
      console.error('Errore rimozione spesa manutenzione:', error);
      alert('Errore nella rimozione della spesa: ' + error.message);
    }
  };

  const getTotalForType = (key) => {
    return expenses[key].reduce((sum, expense) => {
      const price = typeof expense === 'number' ? expense : expense.price;
      return sum + price;
    }, 0);
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
    return Object.keys(maintenanceTypes).reduce((sum, key) => {
      return sum + getTotalForType(key);
    }, 0);
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const toggleShowDetails = (key) => {
    setShowDetails({
      ...showDetails,
      [key]: !showDetails[key]
    });
  };

  const toggleShowNotes = (type) => {
    setShowNotes({
      ...showNotes,
      [type]: !showNotes[type]
    });
  };

  const handleNotesChange = async (type, value) => {
    const newNotes = {
      ...notes,
      [type]: value
    };
    setNotes(newNotes);
    
    try {
      const monthKey = getMonthKey(currentMonth);
      await saveMaintenanceNotes(monthKey, type, value);
    } catch (error) {
      console.error('Errore salvataggio note:', error);
      alert('Errore nel salvataggio delle note: ' + error.message);
      loadMaintenance();
    }
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
          {Object.keys(maintenanceTypes).map((type) => {
            const total = getTotalForType(type);
            return (
              <div key={type} className="maintenance-item">
                <div className="maintenance-left">
                  <label className="maintenance-label">{maintenanceTypes[type]}</label>
                  {total > 0 && (
                    <div className="maintenance-total-row">
                      <div className="maintenance-total-display">
                        <span className="total-label-small">Totale:</span>
                        <span className="total-value">{total.toFixed(2)} €</span>
                      </div>
                      {expenses[type].length > 0 && (
                        <button
                          type="button"
                          className="toggle-details-btn"
                          onClick={() => toggleShowDetails(type)}
                          aria-label={showDetails[type] ? 'Nascondi riepilogo' : 'Mostra riepilogo'}
                        >
                          <span>{showDetails[type] ? '▼' : '▶'}</span>
                          <span>{showDetails[type] ? 'Nascondi riepilogo' : 'Mostra riepilogo'}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="toggle-details-btn"
                        onClick={() => toggleShowNotes(type)}
                        aria-label={showNotes[type] ? 'Nascondi note' : 'Mostra note'}
                      >
                        <span>{showNotes[type] ? '▼' : '▶'}</span>
                        <span>{showNotes[type] ? 'Nascondi note' : 'Mostra note'}</span>
                      </button>
                    </div>
                  )}
                  {showDetails[type] && expenses[type].length > 0 && (
                    <div className="maintenance-prices">
                      {expenses[type].map((expense) => (
                        <div key={expense.id} className="price-chip">
                          <span>{expense.price.toFixed(2)} €</span>
                          <button
                            type="button"
                            className="remove-price-btn"
                            onClick={() => handleRemovePrice(type, expense.id)}
                            aria-label="Rimuovi prezzo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {showNotes[type] && (
                    <div className="maintenance-notes-container">
                      <textarea
                        className="maintenance-notes-input"
                        value={notes[type]}
                        onChange={(e) => handleNotesChange(type, e.target.value)}
                        onBlur={() => handleNotesChange(type, notes[type])}
                        placeholder="Inserisci note..."
                        rows="4"
                      />
                    </div>
                  )}
                </div>
                <div className="maintenance-input-container">
                  <input
                    type="number"
                    className="maintenance-price-input"
                    value={tempInputs[type]}
                    onChange={(e) => handleInputChange(type, e.target.value)}
                    onBlur={() => handleInputBlur(type)}
                    onKeyPress={(e) => handleInputKeyPress(type, e)}
                    placeholder="Inserisci prezzo"
                    min="0"
                    step="0.01"
                  />
                  <span className="maintenance-currency">€</span>
                </div>
              </div>
            );
          })}
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
