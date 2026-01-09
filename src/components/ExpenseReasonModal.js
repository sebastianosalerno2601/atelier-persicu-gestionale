import React, { useState, useEffect } from 'react';
import './ExpenseReasonModal.css';

const ExpenseReasonModal = ({ isOpen, onClose, onSave, price, expenseLabel }) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
    }
  }, [isOpen]);

  const handleSave = () => {
    onSave(reason);
    setReason('');
    onClose();
  };

  const handleCancel = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="expense-reason-modal-overlay" onClick={handleCancel}>
      <div className="expense-reason-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="expense-reason-modal-header">
          <h3>Motivo della spesa</h3>
          <button className="expense-reason-modal-close" onClick={handleCancel}>×</button>
        </div>
        <div className="expense-reason-modal-body">
          <div className="expense-reason-info">
            <span className="expense-reason-label">{expenseLabel}</span>
            <span className="expense-reason-price">{price.toFixed(2)} €</span>
          </div>
          <textarea
            className="expense-reason-input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Inserisci il motivo della spesa..."
            rows="4"
            autoFocus
          />
        </div>
        <div className="expense-reason-modal-footer">
          <button className="expense-reason-btn expense-reason-btn-cancel" onClick={handleCancel}>
            Annulla
          </button>
          <button className="expense-reason-btn expense-reason-btn-save" onClick={handleSave}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseReasonModal;


