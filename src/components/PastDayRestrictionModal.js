import React from 'react';
import './PastDayRestrictionModal.css';

const MESSAGE = 'Per modifiche ad appuntamenti dei giorni precedenti, bisogna chiedere ad Antonio Persico di effettuare la modifica.';

const PastDayRestrictionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="past-day-modal-overlay" onClick={onClose}>
      <div className="past-day-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="past-day-modal-header">
          <h3>Modifica non consentita</h3>
          <button type="button" className="past-day-modal-close" onClick={onClose} aria-label="Chiudi">×</button>
        </div>
        <div className="past-day-modal-body">
          <p className="past-day-modal-message">{MESSAGE}</p>
        </div>
        <div className="past-day-modal-footer">
          <button type="button" className="past-day-modal-btn" onClick={onClose}>
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastDayRestrictionModal;
