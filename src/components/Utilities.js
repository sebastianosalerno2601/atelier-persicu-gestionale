import React, { useState, useEffect } from 'react';
import { getUtilities, addUtilityExpense, deleteUtilityExpense, getCustomCategories, createCustomCategory, deleteCustomCategory } from '../utils/api';
import ExpenseReasonModal from './ExpenseReasonModal';
import CustomCategoryModal from './CustomCategoryModal';
import './Utilities.css';

const SECTION = 'utilities';
const utilityLabels = {
  pigione: 'Pigione',
  acqua: 'Acqua',
  luce: 'Luce',
  spazzatura: 'Spazzatura',
  gas: 'Gas'
};

const Utilities = () => {
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
      ...Object.entries(utilityLabels).map(([key, label]) => ({ key, label })),
      ...(Array.isArray(cust) ? cust : []).map((c) => ({ key: c.slug, label: c.name, customId: c.id }))
    ];
  };
  const typeList = buildTypeList();

  useEffect(() => {
    const a = JSON.parse(localStorage.getItem('atelier-auth') || '{}');
    setAuth(a);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await loadCustomCategories();
      if (cancelled) return;
      await loadUtilities(list);
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

  const getLabel = (key) => utilityLabels[key] || customCategories.find((c) => c.slug === key)?.name || key;

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

  const loadUtilities = async (customListOverride) => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const types = buildTypeList(customListOverride);
      const data = await getUtilities(monthKey);
      const exp = data?.expenses || {};
      const converted = {};
      const initInputs = {};
      types.forEach(({ key }) => {
        converted[key] = Array.isArray(exp[key])
          ? exp[key].map((e) => ({
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
      console.error('Errore caricamento utenze:', error);
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
      await addUtilityExpense(monthKey, key, price, reason);
      await loadUtilities();
      setReasonModal({ isOpen: false, key: null, price: 0 });
    } catch (error) {
      console.error('Errore aggiunta spesa utenza:', error);
      alert('Errore nell\'aggiunta della spesa: ' + error.message);
      setReasonModal({ isOpen: false, key: null, price: 0 });
    }
  };

  const handleRemovePrice = async (key, expenseId) => {
    try {
      const monthKey = getMonthKey(currentMonth);
      await deleteUtilityExpense(monthKey, expenseId);
      await loadUtilities();
    } catch (error) {
      console.error('Errore rimozione spesa utenza:', error);
      alert('Errore nella rimozione della spesa: ' + error.message);
    }
  };

  const getTotalForType = (key) => {
    return (expenses[key] || []).reduce((s, e) => s + (typeof e.price === 'number' ? e.price : parseFloat(e.price)), 0);
  };

  const calculateTotal = () => typeList.reduce((s, { key }) => s + getTotalForType(key), 0);

  const toggleShowDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddCustomCategory = async (name) => {
    try {
      const monthKey = getMonthKey(currentMonth);
      await createCustomCategory(SECTION, monthKey, name);
      const list = await loadCustomCategories();
      await loadUtilities(list);
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
      await loadUtilities(list);
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
    <div className="utilities-container fade-in">
      <div className="utilities-header">
        <h2 className="section-title">Utenze</h2>
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

      <div className="utilities-content">
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

        <div className="utilities-list">
          {typeList.map(({ key, label, customId }) => {
            const total = getTotalForType(key);
            const list = expenses[key] || [];
            return (
              <div key={key} className="utility-item">
                <div className="utility-left">
                  <div className="utility-label-row">
                    <label className="utility-label">{label}</label>
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
                    <div className="utility-total-row">
                      <div className="utility-total">
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
                    <div className="utility-prices">
                      {list.map((exp) => {
                        const dateStr = formatDate(exp.created_at);
                        const reason = exp.reason || '';
                        return (
                          <div key={exp.id} className="price-chip" style={{ position: 'relative' }}>
                            <span className="price-chip-content">
                              <span
                                className="price-amount"
                                style={{ cursor: reason ? 'pointer' : 'default' }}
                                onClick={() =>
                                  reason &&
                                  setSelectedExpenseForReason({
                                    expenseId: exp.id,
                                    reason,
                                    price: exp.price,
                                    label
                                  })
                                }
                                title={reason ? 'Clicca per vedere il motivo' : ''}
                              >
                                {exp.price.toFixed(2)} €
                              </span>
                              {dateStr && <span className="price-date">{dateStr}</span>}
                            </span>
                            <button
                              type="button"
                              className="remove-price-btn"
                              onClick={() => handleRemovePrice(key, exp.id)}
                              aria-label="Rimuovi prezzo"
                            >
                              ×
                            </button>
                            {selectedExpenseForReason && selectedExpenseForReason.expenseId === exp.id && (
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
                <div className="utility-input-container">
                  <input
                    type="number"
                    className="utility-input"
                    value={tempInputs[key] ?? ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    onBlur={() => handleInputBlur(key)}
                    onKeyPress={(e) => handleInputKeyPress(key, e)}
                    placeholder="Inserisci prezzo"
                    min="0"
                    step="0.01"
                  />
                  <span className="utility-currency">€</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="utilities-total">
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
        sectionLabel="Utenze"
      />
    </div>
  );
};

export default Utilities;
