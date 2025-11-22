import React, { useState, useEffect } from 'react';
import { getBarExpenses, addBarExpense, deleteBarExpense } from '../utils/api';
import './BarExpenses.css';

const expenseLabels = {
  kitCaffe: 'Kit Caffè',
  beverage: 'Beverage',
  operatoreBar: 'Operatore bar'
};

const BarExpenses = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Modificato per gestire spese con ID: { id, price }
  const [expenses, setExpenses] = useState({
    kitCaffe: [],
    beverage: [],
    operatoreBar: []
  });

  const [tempInputs, setTempInputs] = useState({
    kitCaffe: '',
    beverage: '',
    operatoreBar: ''
  });

  const [showDetails, setShowDetails] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [currentMonth]);

  const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const data = await getBarExpenses(monthKey);
      
      // Il backend restituisce un oggetto con array di oggetti { id, price }
      const converted = {
        kitCaffe: [],
        beverage: [],
        operatoreBar: []
      };
      
      Object.keys(expenseLabels).forEach(key => {
        if (data[key] && Array.isArray(data[key])) {
          converted[key] = data[key].map(expense => ({
            id: expense.id,
            price: typeof expense.price === 'number' ? expense.price : parseFloat(expense.price)
          }));
        }
      });
      
      setExpenses(converted);
    } catch (error) {
      console.error('Errore caricamento spese bar:', error);
      setExpenses({
        kitCaffe: [],
        beverage: [],
        operatoreBar: []
      });
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
        await addBarExpense(monthKey, key, value);
        
        // Ricarica le spese per ottenere l'ID reale
        await loadExpenses();
        
        setTempInputs({
          ...tempInputs,
          [key]: ''
        });
      } catch (error) {
        console.error('Errore aggiunta spesa bar:', error);
        alert('Errore nell\'aggiunta della spesa: ' + error.message);
      }
    }
  };

  const handleInputKeyPress = (key, e) => {
    if (e.key === 'Enter') {
      handleInputBlur(key);
    }
  };

  const handleRemovePrice = async (key, expenseId) => {
    try {
      const monthKey = getMonthKey(currentMonth);
      await deleteBarExpense(monthKey, expenseId);
      await loadExpenses();
    } catch (error) {
      console.error('Errore rimozione spesa bar:', error);
      alert('Errore nella rimozione della spesa: ' + error.message);
    }
  };

  const getTotalForProduct = (key) => {
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
    return Object.keys(expenseLabels).reduce((sum, key) => {
      return sum + getTotalForProduct(key);
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

  return (
    <div className="bar-expenses-container fade-in">
      <div className="bar-expenses-header">
        <h2 className="section-title">Spesa Bar</h2>
      </div>

      <div className="bar-expenses-content">
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

        <div className="bar-expenses-list">
          {Object.keys(expenseLabels).map((key) => {
            const total = getTotalForProduct(key);
            return (
              <div key={key} className="bar-expense-item">
                <div className="bar-expense-left">
                  <label className="bar-expense-label">{expenseLabels[key]}</label>
                  {total > 0 && (
                    <div className="bar-expense-total-row">
                      <div className="bar-expense-total">
                        <span className="total-label-small">Totale:</span>
                        <span className="total-value">{total.toFixed(2)} €</span>
                      </div>
                      {expenses[key].length > 0 && (
                        <button
                          type="button"
                          className="toggle-details-btn"
                          onClick={() => toggleShowDetails(key)}
                          aria-label={showDetails[key] ? 'Nascondi riepilogo' : 'Mostra riepilogo'}
                        >
                          <span>{showDetails[key] ? '▼' : '▶'}</span>
                          <span>{showDetails[key] ? 'Nascondi riepilogo' : 'Mostra riepilogo'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {showDetails[key] && expenses[key].length > 0 && (
                    <div className="bar-expense-prices">
                      {expenses[key].map((expense) => (
                        <div key={expense.id} className="price-chip">
                          <span>{expense.price.toFixed(2)} €</span>
                          <button
                            type="button"
                            className="remove-price-btn"
                            onClick={() => handleRemovePrice(key, expense.id)}
                            aria-label="Rimuovi prezzo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="bar-expense-input-container">
                  <input
                    type="number"
                    className="bar-expense-input"
                    value={tempInputs[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    onBlur={() => handleInputBlur(key)}
                    onKeyPress={(e) => handleInputKeyPress(key, e)}
                    placeholder="Inserisci prezzo"
                    min="0"
                    step="0.01"
                  />
                  <span className="bar-expense-currency">€</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bar-expenses-total">
          <div className="total-label">Totale mensile</div>
          <div className="total-amount">
            {calculateTotal().toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarExpenses;

