import React, { useState, useEffect } from 'react';
import { getProductExpenses, addProductExpense, deleteProductExpense, getProductExpensesNotes, saveProductExpensesNotes, getCustomCategories, createCustomCategory, deleteCustomCategory } from '../utils/api';
import ExpenseReasonModal from './ExpenseReasonModal';
import CustomCategoryModal from './CustomCategoryModal';
import './ProductExpenses.css';

const SECTION = 'product';

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
  const [auth, setAuth] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customCategories, setCustomCategories] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [tempInputs, setTempInputs] = useState({});
  const [showDetails, setShowDetails] = useState({});
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [reasonModal, setReasonModal] = useState({ isOpen: false, key: null, price: 0 });
  const [selectedExpenseForReason, setSelectedExpenseForReason] = useState(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const buildTypeList = (customList) => {
    const cust = customList ?? customCategories;
    return [
      ...Object.entries(expenseLabels).map(([key, label]) => ({ key, label })),
      ...(Array.isArray(cust) ? cust : []).map((c) => ({ key: c.slug, label: c.name, customId: c.id }))
    ];
  };
  const typeList = buildTypeList();

  useEffect(() => {
    setAuth(JSON.parse(localStorage.getItem('atelier-auth') || '{}'));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadCustomCategories();
      if (cancelled) return;
      await loadExpenses(list);
    })();
    return () => { cancelled = true; };
  }, [currentMonth]);

  // Chiudi tooltip quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectedExpenseForReason && !e.target.closest('.price-chip')) {
        setSelectedExpenseForReason(null);
      }
    };
    if (selectedExpenseForReason) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [selectedExpenseForReason]);

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

  const getLabel = (key) => expenseLabels[key] || customCategories.find((c) => c.slug === key)?.name || key;

  const loadCustomCategories = async () => {
    try {
      const monthKey = getMonthKey(currentMonth);
      const list = await getCustomCategories(SECTION, monthKey);
      const arr = Array.isArray(list) ? list : [];
      setCustomCategories(arr);
      return arr;
    } catch (e) {
      console.error('Errore caricamento custom categories:', e);
      setCustomCategories([]);
      return [];
    }
  };

  const loadExpenses = async (customListOverride) => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const types = buildTypeList(customListOverride);
      const expensesData = await getProductExpenses(monthKey);
      const converted = {};
      const initInputs = {};
      types.forEach(({ key }) => {
        converted[key] = Array.isArray(expensesData[key])
          ? expensesData[key].map((e) => ({
              id: e.id,
              price: typeof e.price === 'number' ? e.price : parseFloat(e.price),
              created_at: e.created_at,
              reason: e.reason || ''
            }))
          : [];
        initInputs[key] = tempInputs[key] ?? '';
      });
      setExpenses(converted);
      setTempInputs((prev) => ({ ...prev, ...initInputs }));
      try {
        const notesData = await getProductExpensesNotes(monthKey);
        setNotes(notesData.notes || '');
      } catch (e) {
        setNotes('');
      }
    } catch (error) {
      console.error('Errore caricamento spese prodotti:', error);
      setExpenses({});
      setNotes('');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setTempInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputBlur = async (key) => {
    const value = parseFloat(tempInputs[key]);
    if (!isNaN(value) && value > 0) {
      if (key === 'spesaProdottiGenerali') {
        setReasonModal({ isOpen: true, key, price: value });
      } else {
        try {
          const monthKey = getMonthKey(currentMonth);
          await addProductExpense(monthKey, key, value, '');
          await loadExpenses();
        } catch (error) {
          console.error('Errore aggiunta spesa prodotto:', error);
          alert('Errore nell\'aggiunta della spesa: ' + error.message);
        }
      }
      setTempInputs((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleSaveExpenseWithReason = async (reason) => {
    const { key, price } = reasonModal;
    try {
      const monthKey = getMonthKey(currentMonth);
      await addProductExpense(monthKey, key, price, reason);
      
      // Ricarica le spese per ottenere l'ID reale
      await loadExpenses();
      
      setReasonModal({ isOpen: false, key: null, price: 0 });
    } catch (error) {
      console.error('Errore aggiunta spesa prodotto:', error);
      alert('Errore nell\'aggiunta della spesa: ' + error.message);
      setReasonModal({ isOpen: false, key: null, price: 0 });
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
      await deleteProductExpense(monthKey, expenseId);
      await loadExpenses();
    } catch (error) {
      console.error('Errore rimozione spesa prodotto:', error);
      alert('Errore nella rimozione della spesa: ' + error.message);
    }
  };

  const toggleShowDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
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
    return (expenses[key] || []).reduce((sum, expense) => {
      const price = typeof expense === 'number' ? expense : expense.price;
      return sum + price;
    }, 0);
  };

  const handleAddCustomCategory = async (name) => {
    try {
      const monthKey = getMonthKey(currentMonth);
      await createCustomCategory(SECTION, monthKey, name);
      const list = await loadCustomCategories();
      await loadExpenses(list);
      setCustomModalOpen(false);
    } catch (error) {
      console.error('Errore creazione sotto-categoria:', error);
      alert('Errore: ' + (error.message || 'Impossibile creare la sotto-categoria'));
    }
  };

  const handleRemoveCustomCategory = async (customId, label) => {
    if (!window.confirm(`Eliminare la sotto-categoria "${label}"? Verranno eliminate anche tutte le spese inserite.`)) return;
    try {
      await deleteCustomCategory(customId);
      const list = await loadCustomCategories();
      await loadExpenses(list);
    } catch (error) {
      console.error('Errore eliminazione sotto-categoria:', error);
      alert('Errore: ' + (error.message || 'Impossibile eliminare la sotto-categoria'));
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
    return typeList.reduce((sum, { key }) => sum + getTotalForProduct(key), 0);
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const isAdmin = auth?.role === 'superadmin';

  return (
    <div className="product-expenses-container fade-in">
      <div className="product-expenses-header">
        <h2 className="section-title">Spese Prodotti</h2>
        {isAdmin && (
          <button
            type="button"
            className="add-category-btn"
            onClick={() => setCustomModalOpen(true)}
            aria-label="Aggiungi sotto-categoria"
            title="Aggiungi sotto-categoria (solo questo mese)"
          >
            +
          </button>
        )}
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
          {typeList.filter(({ key }) => key !== 'spesaProdottiGenerali').map(({ key, label, customId }) => {
            const total = getTotalForProduct(key);
            const list = expenses[key] || [];
            return (
              <div key={key} className="product-expense-item">
                <div className="product-expense-left">
                  <div className="product-expense-label-row">
                    <label className="product-expense-label">{label}</label>
                    {isAdmin && customId && (
                      <button
                        type="button"
                        className="remove-category-btn"
                        onClick={() => handleRemoveCustomCategory(customId, label)}
                        title="Elimina sotto-categoria"
                        aria-label="Elimina sotto-categoria"
                      >
                        −
                      </button>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="product-expense-total-row">
                      <div className="product-expense-total">
                        <span className="total-label-small">Totale:</span>
                        <span className="total-value">{total.toFixed(2)} €</span>
                      </div>
                      {list.length > 0 && (
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
                  {showDetails[key] && list.length > 0 && (
                    <div className="product-expense-prices">
                      {list.map((expense) => {
                        const price = typeof expense === 'number' ? expense : expense.price;
                        const expenseId = typeof expense === 'number' ? `temp-${key}-${list.indexOf(expense)}` : expense.id;
                        const createdDate = typeof expense === 'object' && expense.created_at ? formatDate(expense.created_at) : '';
                        const expenseReason = typeof expense === 'object' && expense.reason ? expense.reason : '';
                        return (
                          <div key={expenseId} className="price-chip" style={{ position: 'relative' }}>
                            <span className="price-chip-content">
                              <span
                                className="price-amount"
                                style={{ cursor: expenseReason ? 'pointer' : 'default' }}
                                onClick={() => expenseReason && setSelectedExpenseForReason({ expenseId, reason: expenseReason, price, label })}
                                title={expenseReason ? 'Clicca per vedere il motivo' : ''}
                              >
                                {price.toFixed(2)} €
                              </span>
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
                            {selectedExpenseForReason && selectedExpenseForReason.expenseId === expenseId && (
                              <div className="expense-reason-tooltip">
                                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Motivo:</div>
                                <div>{selectedExpenseForReason.reason}</div>
                                <button
                                  style={{ marginTop: '8px', padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedExpenseForReason(null);
                                  }}
                                >
                                  Chiudi
                                </button>
                              </div>
                            )}
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
                    value={tempInputs[key] ?? ''}
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
            const list = expenses[key] || [];
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
                        {list.length > 0 && (
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
                  {showDetails[key] && list.length > 0 && (
                    <div className="product-expense-prices">
                      {list.map((expense) => {
                        const price = typeof expense === 'number' ? expense : expense.price;
                        const expenseId = typeof expense === 'number' ? `temp-${key}-${list.indexOf(expense)}` : expense.id;
                        const createdDate = typeof expense === 'object' && expense.created_at ? formatDate(expense.created_at) : '';
                        const expenseReason = typeof expense === 'object' && expense.reason ? expense.reason : '';
                        return (
                          <div key={expenseId} className="price-chip" style={{ position: 'relative' }}>
                            <span className="price-chip-content">
                              <span
                                className="price-amount"
                                style={{ cursor: expenseReason ? 'pointer' : 'default' }}
                                onClick={() => expenseReason && setSelectedExpenseForReason({ expenseId, reason: expenseReason, price, label: expenseLabels[key] })}
                                title={expenseReason ? 'Clicca per vedere il motivo' : ''}
                              >
                                {price.toFixed(2)} €
                              </span>
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
                            {selectedExpenseForReason && selectedExpenseForReason.expenseId === expenseId && (
                              <div className="expense-reason-tooltip">
                                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Motivo:</div>
                                <div>{selectedExpenseForReason.reason}</div>
                                <button 
                                  style={{ marginTop: '8px', padding: '4px 8px', background: '#fff', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedExpenseForReason(null);
                                  }}
                                >
                                  Chiudi
                                </button>
                              </div>
                            )}
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
                    value={tempInputs[key] ?? ''}
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

      <ExpenseReasonModal
        isOpen={reasonModal.isOpen}
        onClose={() => setReasonModal({ isOpen: false, key: null, price: 0 })}
        onSave={handleSaveExpenseWithReason}
        price={reasonModal.price}
        expenseLabel={reasonModal.key ? getLabel(reasonModal.key) : ''}
      />

      <CustomCategoryModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleAddCustomCategory}
        sectionLabel="Spese Prodotti"
      />
    </div>
  );
};

export default ProductExpenses;

