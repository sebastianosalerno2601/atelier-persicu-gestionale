import React, { useState, useEffect } from 'react';
import './CustomCategoryModal.css';

const CustomCategoryModal = ({ isOpen, onClose, onSave, sectionLabel }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleSave = () => {
    const n = String(name || '').trim();
    if (!n) return;
    onSave(n);
    setName('');
    onClose();
  };

  const handleCancel = () => {
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="custom-category-modal-overlay" onClick={handleCancel}>
      <div className="custom-category-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="custom-category-modal-header">
          <h3>Nuova sotto-categoria</h3>
          <button type="button" className="custom-category-modal-close" onClick={handleCancel}>×</button>
        </div>
        <div className="custom-category-modal-body">
          <p className="custom-category-modal-hint">
            Aggiungi una sotto-categoria solo per questo mese ({sectionLabel}).
          </p>
          <label className="custom-category-modal-label">Nome</label>
          <input
            type="text"
            className="custom-category-modal-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="es. Commercialista"
            autoFocus
          />
        </div>
        <div className="custom-category-modal-footer">
          <button type="button" className="custom-category-btn custom-category-btn-cancel" onClick={handleCancel}>
            Annulla
          </button>
          <button type="button" className="custom-category-btn custom-category-btn-save" onClick={handleSave} disabled={!String(name || '').trim()}>
            Salva
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomCategoryModal;
