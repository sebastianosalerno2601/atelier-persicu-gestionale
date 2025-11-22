import React, { useState } from 'react';
import './EmployeeModal.css';

const EmployeeModal = ({ employee, onSave, onClose }) => {
  const isEditing = !!employee;
  
  const [fullName, setFullName] = useState(employee?.fullName || '');
  const [email, setEmail] = useState(employee?.email || '');
  const [fiscalCode, setFiscalCode] = useState(employee?.fiscalCode || '');
  const [birthYear, setBirthYear] = useState(employee?.birthYear || '');
  const [monthlySalary, setMonthlySalary] = useState(employee?.monthlySalary || '');
  const [createCredentials, setCreateCredentials] = useState(employee?.credentials ? false : true);
  const [username, setUsername] = useState(employee?.credentials?.username || '');
  const [password, setPassword] = useState('');
  const [color, setColor] = useState(employee?.color || '#ffffff');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      alert('Inserisci il nome completo');
      return;
    }
    
    if (!email.trim()) {
      alert('Inserisci l\'email');
      return;
    }
    
    if (!fiscalCode.trim()) {
      alert('Inserisci il codice fiscale');
      return;
    }
    
    if (!birthYear) {
      alert('Inserisci l\'anno di nascita');
      return;
    }
    
    if (!monthlySalary || monthlySalary <= 0) {
      alert('Inserisci una retribuzione mensile valida');
      return;
    }

    if (createCredentials) {
      if (!username.trim()) {
        alert('Inserisci il nome utente');
        return;
      }
      
      if (!isEditing && !password.trim()) {
        alert('Inserisci la password');
        return;
      }
      
      if (password.trim() && password.length < 4) {
        alert('La password deve essere di almeno 4 caratteri');
        return;
      }
    }

    const employeeData = {
      fullName: fullName.trim(),
      email: email.trim(),
      fiscalCode: fiscalCode.trim().toUpperCase(),
      birthYear: parseInt(birthYear),
      monthlySalary: parseFloat(monthlySalary),
      color: color
    };

    if (createCredentials) {
      employeeData.createCredentials = true;
      employeeData.credentials = {
        username: username.trim(),
        password: password.trim() || employee?.credentials?.password || ''
      };
    } else {
      employeeData.createCredentials = false;
    }

    onSave(employeeData);
  };

  const currentYear = new Date().getFullYear();
  const birthYears = [];
  for (let year = currentYear - 70; year <= currentYear - 16; year++) {
    birthYears.push(year);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEditing ? 'Modifica Dipendente' : 'Nuovo Dipendente'}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="fullName">Nome e cognome</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Inserisci nome e cognome"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="esempio@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fiscalCode">Codice fiscale</label>
            <input
              id="fiscalCode"
              type="text"
              value={fiscalCode}
              onChange={(e) => setFiscalCode(e.target.value.toUpperCase())}
              required
              placeholder="ABCDEF12G34H567I"
              maxLength={16}
            />
          </div>

          <div className="form-group">
            <label htmlFor="birthYear">Anno di nascita</label>
            <select
              id="birthYear"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              required
            >
              <option value="">Seleziona anno</option>
              {birthYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="monthlySalary">Retribuzione mensile fissa (€)</label>
            <input
              id="monthlySalary"
              type="number"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Colore associato</label>
            <div className="color-picker-container">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="color-input"
              />
              <span className="color-preview" style={{ backgroundColor: color }}></span>
            </div>
            <small className="form-hint">Il colore verrà utilizzato per identificare il dipendente nel calendario</small>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={createCredentials}
                onChange={(e) => setCreateCredentials(e.target.checked)}
              />
              <span>Crea credenziali di accesso</span>
            </label>
          </div>

          {createCredentials && (
            <div className="credentials-section">
              <div className="form-group">
                <label htmlFor="username">Nome Utente</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={createCredentials}
                  placeholder="username"
                  disabled={isEditing && employee?.credentials}
                />
                {isEditing && employee?.credentials && (
                  <small className="form-hint">Il nome utente non può essere modificato</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={!isEditing}
                  placeholder={isEditing ? "Lascia vuoto per non modificare" : "password"}
                  minLength={4}
                />
                {isEditing && (
                  <small className="form-hint">Lascia vuoto per mantenere la password attuale</small>
                )}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <div className="action-buttons">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Annulla
              </button>
              <button type="submit" className="btn-save">
                {isEditing ? 'Salva modifiche' : 'Salva'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;


