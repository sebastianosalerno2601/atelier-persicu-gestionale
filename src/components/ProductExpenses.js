import React, { useState, useEffect } from 'react';
import { getProductExpenses, addProductExpense, deleteProductExpense, getProductExpensesNotes, saveProductExpensesNotes } from '../utils/api';
import './ProductExpenses.css';

const expenseLabels = {
  asciugamani: 'Asciugamani',
  shampooDaBanco: 'Shampoo da banco',
  shampooDaVenditaSpecializzato: 'Shampoo da vendita (specializzato)',
  shampooDaVendita500ml: 'Shampoo da vendita 500ml',
  cremaDaBarba: 'Crema da barba',
  lamette: 'Lamette',
  lacca: 'Lacca',
  cartaCollo: 'Carta collo',
  cera: 'Cera',
  dopoBarba: 'Dopo barba',
  cremaRicci: 'Crema ricci',
  rotolone: 'Rotolone',
  bicchieriCarta: 'Bicchieri carta',
  pulizieNegozio: 'Pulizie negozio',
  spazzole: 'Spazzole',
  spesaProdottiGenerali: 'Spesa prodotti generali'
};

const ProductExpenses = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Modificato per gestire spese con ID: { id, price }
  const [expenses, setExpenses] = useState({
    asciugamani: [],
    shampooDaBanco: [],
    shampooDaVenditaSpecializzato: [],
    shampooDaVendita500ml: [],
    cremaDaBarba: [],
    lamette: [],
    lacca: [],
    cartaCollo: [],
    cera: [],
    dopoBarba: [],
    cremaRicci: [],
    rotolone: [],
    bicchieriCarta: [],
    pulizieNegozio: [],
    spazzole: [],
    spesaProdottiGenerali: []
  });

  const [tempInputs, setTempInputs] = useState({
    asciugamani: '',
    shampooDaBanco: '',
    shampooDaVenditaSpecializzato: '',
    shampooDaVendita500ml: '',
    cremaDaBarba: '',
    lamette: '',
    lacca: '',
    cartaCollo: '',
    cera: '',
    dopoBarba: '',
    cremaRicci: '',
    rotolone: '',
    bicchieriCarta: '',
    pulizieNegozio: '',
    spazzole: '',
    spesaProdottiGenerali: ''
  });

  const [showDetails, setShowDetails] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpenses();
  }, [currentMonth]);

  const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      
      // Carica le spese prodotti
      const expensesData = await getProductExpenses(monthKey);
      
      // Inizializza tutte le categorie
      const converted = {
        asciugamani: [],
        shampooDaBanco: [],
        shampooDaVenditaSpecializzato: [],
        shampooDaVendita500ml: [],
        cremaDaBarba: [],
        lamette: [],
        lacca: [],
        cartaCollo: [],
        cera: [],
        dopoBarba: [],
        cremaRicci: [],
        rotolone: [],
        bicchieriCarta: [],
        pulizieNegozio: [],
        spazzole: [],
        spesaProdottiGenerali: []
      };
      
      // Converti i dati dal backend nel formato del frontend
      Object.keys(expenseLabels).forEach(key => {
        if (expensesData[key] && Array.isArray(expensesData[key])) {
          converted[key] = expensesData[key].map(expense => ({
            id: expense.id,
            price: typeof expense.price === 'number' ? expense.price : parseFloat(expense.price),
            created_at: expense.created_at
          }));
        }
      });
      
      setExpenses(converted);
      
      // Carica le note
      try {
        const notesData = await getProductExpensesNotes(monthKey);
        setNotes(notesData.notes || '');
      } catch (error) {
        console.error('Errore caricamento note:', error);
        setNotes('');
      }
    } catch (error) {
      console.error('Errore caricamento spese prodotti:', error);
      // Inizializza con valori vuoti
      setExpenses({
        asciugamani: [],
        shampooDaBanco: [],
        shampooDaVenditaSpecializzato: [],
        shampooDaVendita500ml: [],
        cremaDaBarba: [],
        lamette: [],
        lacca: [],
        cartaCollo: [],
        cera: [],
        dopoBarba: [],
        cremaRicci: [],
        rotolone: [],
        bicchieriCarta: [],
        pulizieNegozio: [],
        spazzole: [],
        spesaProdottiGenerali: []
      });
      setNotes('');
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
        await addProductExpense(monthKey, key, value);
        
        // Ricarica le spese per ottenere l'ID reale
        await loadExpenses();
        
        setTempInputs({
          ...tempInputs,
          [key]: ''
        });
      } catch (error) {
        console.error('Errore aggiunta spesa prodotto:', error);
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
      await deleteProductExpense(monthKey, expenseId);
      await loadExpenses();
    } catch (error) {
      console.error('Errore rimozione spesa prodotto:', error);
      alert('Errore nella rimozione della spesa: ' + error.message);
    }
  };

  const toggleShowDetails = (key) => {
    setShowDetails({
      ...showDetails,
      [key]: !showDetails[key]
    });
  };

  const toggleShowNotes = () => {
    setShowNotes(!showNotes);
  };

  const handleNotesChange = async (value) => {
    setNotes(value);
    try {
      const monthKey = getMonthKey(currentMonth);
      await saveProductExpensesNotes(monthKey, value);
    } catch (error) {
      console.error('Errore salvataggio note:', error);
      alert('Errore nel salvataggio delle note: ' + error.message);
      // Ripristina le note precedenti
      loadExpenses();
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


  return (
    <div className="product-expenses-container fade-in">
      <div className="product-expenses-header">
        <h2 className="section-title">Spese Prodotti</h2>
      </div>

      <div className="product-expenses-content">
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

        <div className="product-expenses-list">
          {Object.keys(expenseLabels).filter(key => key !== 'spesaProdottiGenerali').map((key) => {
            const total = getTotalForProduct(key);
            return (
              <div key={key} className="product-expense-item">
                <div className="product-expense-left">
                  <label className="product-expense-label">{expenseLabels[key]}</label>
                  {total > 0 && (
                    <div className="product-expense-total-row">
                      <div className="product-expense-total">
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
                    <div className="product-expense-prices">
                      {expenses[key].map((expense) => {
                        const price = typeof expense === 'number' ? expense : expense.price;
                        const expenseId = typeof expense === 'number' ? `temp-${key}-${expenses[key].indexOf(expense)}` : expense.id;
                        const createdDate = typeof expense === 'object' && expense.created_at ? formatDate(expense.created_at) : '';
                        return (
                          <div key={expenseId} className="price-chip">
                            <span className="price-chip-content">
                              <span className="price-amount">{price.toFixed(2)} €</span>
                              {createdDate && <span className="price-date">{createdDate}</span>}
                            </span>
                            <button
                              type="button"
                              className="remove-price-btn"
                              onClick={() => handleRemovePrice(key, expenseId)}
                              aria-label="Rimuovi prezzo"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="product-expense-input-container">
                  <input
                    type="number"
                    className="product-expense-input"
                    value={tempInputs[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    onBlur={() => handleInputBlur(key)}
                    onKeyPress={(e) => handleInputKeyPress(key, e)}
                    placeholder="Inserisci prezzo"
                    min="0"
                    step="0.01"
                  />
                  <span className="product-expense-currency">€</span>
                </div>
              </div>
            );
          })}
          
          {/* Spesa prodotti generali */}
          {(() => {
            const key = 'spesaProdottiGenerali';
            const total = getTotalForProduct(key);
            return (
              <div key={key} className="product-expense-item product-expense-general">
                <div className="product-expense-left">
                  <label className="product-expense-label">{expenseLabels[key]}</label>
                  {total > 0 && (
                    <div className="product-expense-total-row">
                      <div className="product-expense-total">
                        <span className="total-label-small">Totale:</span>
                        <span className="total-value">{total.toFixed(2)} €</span>
                      </div>
                      <div className="product-expense-buttons">
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
                        <button
                          type="button"
                          className="toggle-details-btn"
                          onClick={toggleShowNotes}
                          aria-label={showNotes ? 'Nascondi note' : 'Mostra note'}
                        >
                          <span>{showNotes ? '▼' : '▶'}</span>
                          <span>{showNotes ? 'Nascondi note' : 'Mostra note'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {!total && (
                    <div className="product-expense-buttons">
                      <button
                        type="button"
                        className="toggle-details-btn"
                        onClick={toggleShowNotes}
                        aria-label={showNotes ? 'Nascondi note' : 'Mostra note'}
                      >
                        <span>{showNotes ? '▼' : '▶'}</span>
                        <span>{showNotes ? 'Nascondi note' : 'Mostra note'}</span>
                      </button>
                    </div>
                  )}
                  {showDetails[key] && expenses[key].length > 0 && (
                    <div className="product-expense-prices">
                      {expenses[key].map((expense) => {
                        const price = typeof expense === 'number' ? expense : expense.price;
                        const expenseId = typeof expense === 'number' ? `temp-${key}-${expenses[key].indexOf(expense)}` : expense.id;
                        const createdDate = typeof expense === 'object' && expense.created_at ? formatDate(expense.created_at) : '';
                        return (
                          <div key={expenseId} className="price-chip">
                            <span className="price-chip-content">
                              <span className="price-amount">{price.toFixed(2)} €</span>
                              {createdDate && <span className="price-date">{createdDate}</span>}
                            </span>
                            <button
                              type="button"
                              className="remove-price-btn"
                              onClick={() => handleRemovePrice(key, expenseId)}
                              aria-label="Rimuovi prezzo"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showNotes && (
                    <div className="product-expense-notes">
                      <textarea
                        className="notes-textarea"
                        value={notes}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Inserisci note generali..."
                        rows="4"
                      />
                    </div>
                  )}
                </div>
                <div className="product-expense-input-container">
                  <input
                    type="number"
                    className="product-expense-input"
                    value={tempInputs[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    onBlur={() => handleInputBlur(key)}
                    onKeyPress={(e) => handleInputKeyPress(key, e)}
                    placeholder="Inserisci prezzo"
                    min="0"
                    step="0.01"
                  />
                  <span className="product-expense-currency">€</span>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="product-expenses-total">
          <div className="total-label">Totale mensile</div>
          <div className="total-amount">
            {calculateTotal().toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductExpenses;

