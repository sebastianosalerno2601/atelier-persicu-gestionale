import React, { useState, useEffect } from 'react';
import { getMaintenance, addMaintenanceExpense, deleteMaintenanceExpense, saveMaintenanceNotes, getCustomCategories, createCustomCategory, deleteCustomCategory } from '../utils/api';
import ExpenseReasonModal from './ExpenseReasonModal';
import CustomCategoryModal from './CustomCategoryModal';
import './Maintenance.css';

const SECTION = 'maintenance';
const maintenanceTypes = {
  ordinaria: 'Manutenzioni ordinarie',
  straordinaria: 'Manutenzione straordinaria'
};

const Maintenance = () => {
  const [auth, setAuth] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customCategories, setCustomCategories] = useState([]);
  const [expenses, setExpenses] = useState({});
  const [tempInputs, setTempInputs] = useState({});
  const [showDetails, setShowDetails] = useState({});
  const [showNotes, setShowNotes] = useState({});
  const [notes, setNotes] = useState({ ordinaria: '', straordinaria: '' });
  const [loading, setLoading] = useState(false);
  const [reasonModal, setReasonModal] = useState({ isOpen: false, type: null, price: 0 });
  const [selectedExpenseForReason, setSelectedExpenseForReason] = useState(null);
  const [customModalOpen, setCustomModalOpen] = useState(false);

  const buildTypeList = (customList) => {
    const cust = customList ?? customCategories;
    return [
      ...Object.entries(maintenanceTypes).map(([key, label]) => ({ key, label })),
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
      await loadMaintenance(list);
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

  const getLabel = (key) => maintenanceTypes[key] || customCategories.find((c) => c.slug === key)?.name || key;

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

  const loadMaintenance = async (customListOverride) => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      const types = buildTypeList(customListOverride);
      const data = await getMaintenance(monthKey);
      const expensesData = data.expenses || data;
      const converted = {};
      const initInputs = {};
      types.forEach(({ key }) => {
        converted[key] = Array.isArray(expensesData[key])
          ? expensesData[key].map((exp) => ({
              id: exp.id,
              price: typeof exp.price === 'number' ? exp.price : parseFloat(exp.price),
              created_at: exp.created_at,
              reason: exp.reason || ''
            }))
          : [];
        initInputs[key] = tempInputs[key] ?? '';
      });
      setExpenses(converted);
      setTempInputs((prev) => ({ ...prev, ...initInputs }));
      setNotes({
        ordinaria: (data.notes && data.notes.ordinaria) || '',
        straordinaria: (data.notes && data.notes.straordinaria) || ''
      });
    } catch (error) {
      console.error('Errore caricamento manutenzioni:', error);
      setExpenses({});
      setNotes({ ordinaria: '', straordinaria: '' });
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
      setReasonModal({ isOpen: true, type: key, price: value });
      setTempInputs((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const handleSaveExpenseWithReason = async (reason) => {
    const { type, price } = reasonModal;
    try {
      const monthKey = getMonthKey(currentMonth);
      await addMaintenanceExpense(monthKey, type, price, reason);
      
      // Ricarica le spese per ottenere l'ID reale
      await loadMaintenance();
      
      setReasonModal({ isOpen: false, type: null, price: 0 });
    } catch (error) {
      console.error('Errore aggiunta spesa manutenzione:', error);
      alert('Errore nell\'aggiunta della spesa: ' + error.message);
      setReasonModal({ isOpen: false, type: null, price: 0 });
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
      await loadMaintenance(list);
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
      await loadMaintenance(list);
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

  const calculateTotal = () => typeList.reduce((sum, { key }) => sum + getTotalForType(key), 0);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const toggleShowDetails = (key) => {
    setShowDetails((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleShowNotes = (type) => {
    setShowNotes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleNotesChange = async (type, value) => {
    setNotes((prev) => ({ ...prev, [type]: value }));
    try {
      const monthKey = getMonthKey(currentMonth);
      await saveMaintenanceNotes(monthKey, type, value);
    } catch (error) {
      console.error('Errore salvataggio note:', error);
      alert('Errore nel salvataggio delle note: ' + error.message);
      loadMaintenance();
    }
  };

  const isAdmin = auth?.role === 'superadmin';

  return (
    <div className="maintenance-container fade-in">
      <div className="maintenance-header">
        <h2 className="section-title">Manutenzioni</h2>
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
          {typeList.map(({ key: type, label, customId }) => {
            const total = getTotalForType(type);
            const list = expenses[type] || [];
            const hasNotes = type === 'ordinaria' || type === 'straordinaria';
            return (
              <div key={type} className="maintenance-item">
                <div className="maintenance-left">
                  <div className="maintenance-label-row">
                    <label className="maintenance-label">{label}</label>
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
                    <div className="maintenance-total-row">
                      <div className="maintenance-total-display">
                        <span className="total-label-small">Totale:</span>
                        <span className="total-value">{total.toFixed(2)} €</span>
                      </div>
                      {list.length > 0 && (
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
                      {hasNotes && (
                        <button
                          type="button"
                          className="toggle-details-btn"
                          onClick={() => toggleShowNotes(type)}
                          aria-label={showNotes[type] ? 'Nascondi note' : 'Mostra note'}
                        >
                          <span>{showNotes[type] ? '▼' : '▶'}</span>
                          <span>{showNotes[type] ? 'Nascondi note' : 'Mostra note'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {!total && hasNotes && (
                    <div className="maintenance-total-row">
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
                  {showDetails[type] && list.length > 0 && (
                    <div className="maintenance-prices">
                      {list.map((expense) => {
                        const createdDate = expense.created_at ? formatDate(expense.created_at) : '';
                        const expenseReason = expense.reason || '';
                        return (
                          <div key={expense.id} className="price-chip" style={{ position: 'relative' }}>
                            <span className="price-chip-content">
                              <span
                                className="price-amount"
                                style={{ cursor: expenseReason ? 'pointer' : 'default' }}
                                onClick={() => expenseReason && setSelectedExpenseForReason({ expenseId: expense.id, reason: expenseReason, price: expense.price, label })}
                                title={expenseReason ? 'Clicca per vedere il motivo' : ''}
                              >
                                {expense.price.toFixed(2)} €
                              </span>
                              {createdDate && <span className="price-date">{createdDate}</span>}
                            </span>
                            <button
                              type="button"
                              className="remove-price-btn"
                              onClick={() => handleRemovePrice(type, expense.id)}
                              aria-label="Rimuovi prezzo"
                            >
                              ×
                            </button>
                            {selectedExpenseForReason && selectedExpenseForReason.expenseId === expense.id && (
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
                  {hasNotes && showNotes[type] && (
                    <div className="maintenance-notes-container">
                      <textarea
                        className="maintenance-notes-input"
                        value={notes[type] ?? ''}
                        onChange={(e) => handleNotesChange(type, e.target.value)}
                        onBlur={() => handleNotesChange(type, notes[type] ?? '')}
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
                    value={tempInputs[type] ?? ''}
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

      <ExpenseReasonModal
        isOpen={reasonModal.isOpen}
        onClose={() => setReasonModal({ isOpen: false, type: null, price: 0 })}
        onSave={handleSaveExpenseWithReason}
        price={reasonModal.price}
        expenseLabel={reasonModal.type ? getLabel(reasonModal.type) : ''}
      />

      <CustomCategoryModal
        isOpen={customModalOpen}
        onClose={() => setCustomModalOpen(false)}
        onSave={handleAddCustomCategory}
        sectionLabel="Manutenzioni"
      />
    </div>
  );
};

export default Maintenance;
