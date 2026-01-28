import React from 'react';
import './ExpensesDetailModal.css';

const ExpensesDetailModal = ({ isOpen, onClose, category, expenses, monthKey }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Ordina per data (più vecchio prima, poi più recente)
  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateA - dateB; // Più vecchio prima
  });

  const categoryLabels = {
    'Manutenzioni': 'Manutenzioni',
    'Spese Bar': 'Spese Bar',
    'Spese Prodotti': 'Spese Prodotti',
    'Utenze': 'Utenze'
  };

  const productTypeLabels = {
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

  const barExpenseLabels = {
    kitCaffe: 'Kit Caffè',
    beverage: 'Beverage',
    operatoreBar: 'Operatore bar'
  };

  const utilityLabels = {
    pigione: 'Pigione',
    acqua: 'Acqua',
    luce: 'Luce',
    spazzatura: 'Spazzatura',
    gas: 'Gas'
  };

  return (
    <div className="expenses-detail-modal-overlay" onClick={onClose}>
      <div className="expenses-detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="expenses-detail-modal-header">
          <h3>{categoryLabels[category] || category} - {monthKey}</h3>
          <button className="expenses-detail-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="expenses-detail-modal-body">
          {sortedExpenses.length === 0 ? (
            <div className="expenses-detail-empty">
              Nessuna spesa registrata per questo mese
            </div>
          ) : (
            <div className="expenses-detail-list">
              {sortedExpenses.map((expense, index) => (
                <div key={expense.id || index} className="expense-detail-item">
                  <div className="expense-detail-row">
                    <div className="expense-detail-price">
                      {expense.price.toFixed(2)} €
                    </div>
                    <div className="expense-detail-date">
                      {expense.created_at ? formatDate(expense.created_at) : '-'}
                    </div>
                  </div>
                  {expense.reason && (
                    <div className="expense-detail-reason">
                      <strong>Motivo:</strong> {expense.reason}
                    </div>
                  )}
                  {expense.expense_type && (
                    <div className="expense-detail-type">
                      <strong>Tipo:</strong> {barExpenseLabels[expense.expense_type] || expense.expense_type}
                    </div>
                  )}
                  {expense.product_type && (
                    <div className="expense-detail-type">
                      <strong>Tipo:</strong> {productTypeLabels[expense.product_type] || expense.product_type}
                    </div>
                  )}
                  {expense.type && (
                    <div className="expense-detail-type">
                      <strong>Tipo:</strong> {expense.type === 'ordinaria' ? 'Manutenzione ordinaria' : expense.type === 'straordinaria' ? 'Manutenzione straordinaria' : expense.type}
                    </div>
                  )}
                  {expense.utility_type && (
                    <div className="expense-detail-type">
                      <strong>Tipo:</strong> {utilityLabels[expense.utility_type] || expense.utility_type}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="expenses-detail-total">
            <strong>Totale: {sortedExpenses.reduce((sum, exp) => sum + (parseFloat(exp.price) || 0), 0).toFixed(2)} €</strong>
          </div>
        </div>
        <div className="expenses-detail-modal-footer">
          <button className="expenses-detail-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpensesDetailModal;

