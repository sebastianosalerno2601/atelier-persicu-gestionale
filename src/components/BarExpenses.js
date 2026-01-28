import React, { useState, useEffect } from 'react';
import { getBarExpenses, addBarExpense, deleteBarExpense, getCustomCategories, createCustomCategory, deleteCustomCategory } from '../utils/api';
import ExpenseReasonModal from './ExpenseReasonModal';
import CustomCategoryModal from './CustomCategoryModal';
import './BarExpenses.css';

const SECTION = 'bar';
const expenseLabels = {
  kitCaffe: 'Kit Caffè',
  beverage: 'Beverage',
  operatoreBar: 'Operatore bar'
};

const BarExpenses = () => {
  const [auth, setAuth] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customCategories, setCustomCategories] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [tempInputs, setTempInputs] = useState({});
  const [showDetails, setShowDetails] = useState({});
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
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
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
      const data = await getBarExpenses(monthKey);
      const converted = {};
      const initInputs = {};
      types.forEach(({ key }) => {
        converted[key] = Array.isArray(data[key])
          ? data[key].map((e) => ({
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
    } catch (error) {
      console.error('Errore caricamento spese bar:', error);
      setExpenses({});
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key, value) => {
    setTempInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handleInputBlur = (key) => {
    const value = parseFloat(tempInputs[key]);
    if (!isNaN(value) && value > 0) {
      setReasonModal({ isOpen: true, key, price: value });
      setTempInputs((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleInputKeyPress = (key, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur(key);
    }
  };

  const handleSaveExpenseWithReason = async (reason) => {
    const { key, price } = reasonModal;
    try {
      const monthKey = getMonthKey(currentMonth);
      await addBarExpense(monthKey, key, price, reason);
      await loadExpenses();
      setReasonModal({ isOpen: false, key: null, price: 0 });
    } catch (error) {
      console.error('Errore aggiunta spesa bar:', error);
      alert('Errore nell\'aggiunta della spesa: ' + error.message);
      setReasonModal({ isOpen: false, key: null, price: 0 });
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
    return (expenses[key] || []).reduce((s, e) => s + (typeof e.price === 'number' ? e.price : parseFloat(e.price)), 0);
  };

  const calculateTotal = () => typeList.reduce((s, { key }) => s + getTotalForProduct(key), 0);

  const toggleShowDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
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
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    if (next <= new Date()) setCurrentMonth(next);
  };

  const canGoNext = () => {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    return next <= new Date();
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const isAdmin = auth?.role === 'superadmin';

  return (
    <div className="bar-expenses-container fade-in">
      <div className="bar-expenses-header">
        <h2 className="section-title">Spesa Bar</h2>
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

      <div className="bar-expenses-content">
        <div className="month-selector-section">
          <button className="month-nav-button" onClick={handlePreviousMonth} aria-label="Mese precedente">←</button>
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
          {typeList.map(({ key, label, customId }) => {
            const total = getTotalForProduct(key);
            const list = expenses[key] || [];
            return (
              <div key={key} className="bar-expense-item">
                <div className="bar-expense-left">
                  <div className="bar-expense-label-row">
                    <label className="bar-expense-label">{label}</label>
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
                    <div className="bar-expense-total-row">
                      <div className="bar-expense-total">
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
                    <div className="bar-expense-prices">
                      {list.map((expense) => {
                        const createdDate = formatDate(expense.created_at);
                        const expenseReason = expense.reason || '';
                        return (
                          <div key={expense.id} className="price-chip" style={{ position: 'relative' }}>
                            <span className="price-chip-content">
                              <span
                                className="price-amount"
                                style={{ cursor: expenseReason ? 'pointer' : 'default' }}
                                onClick={() =>
                                  expenseReason &&
                                  setSelectedExpenseForReason({
                                    expenseId: expense.id,
                                    reason: expenseReason,
                                    price: expense.price,
                                    label
                                  })
                                }
                                title={expenseReason ? 'Clicca per vedere il motivo' : ''}
                              >
                                {expense.price.toFixed(2)} €
                              </span>
                              {createdDate && <span className="price-date">{createdDate}</span>}
                            </span>
                            <button
                              type="button"
                              className="remove-price-btn"
                              onClick={() => handleRemovePrice(key, expense.id)}
                              aria-label="Rimuovi prezzo"
                            >
                              ×
                            </button>
                            {selectedExpenseForReason && selectedExpenseForReason.expenseId === expense.id && (
                              <div className="expense-reason-tooltip">
                                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>Motivo:</div>
                                <div>{selectedExpenseForReason.reason}</div>
                                <button
                                  style={{
                                    marginTop: '8px',
                                    padding: '4px 8px',
                                    background: '#fff',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
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
                <div className="bar-expense-input-container">
                  <input
                    type="number"
                    className="bar-expense-input"
                    value={tempInputs[key] ?? ''}
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
          <div className="total-amount">{calculateTotal().toFixed(2)} €</div>
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
        sectionLabel="Spesa Bar"
      />
    </div>
  );
};

export default BarExpenses;
