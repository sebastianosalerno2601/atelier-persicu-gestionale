import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../utils/api';
import EmployeeModal from './EmployeeModal';
import './Employees.css';

// Funzione per convertire snake_case a camelCase
const toCamelCase = (obj) => {
  if (!obj) return null;
  return {
    id: obj.id,
    fullName: obj.full_name,
    email: obj.email,
    fiscalCode: obj.fiscal_code,
    birthYear: obj.birth_year,
    monthlySalary: parseFloat(obj.monthly_salary) || 0,
    color: obj.color || '#ffffff',
    credentials: obj.username ? { username: obj.username } : null
  };
};

// Funzione per convertire camelCase a snake_case per l'API
const toSnakeCase = (obj) => {
  return {
    fullName: obj.fullName,
    email: obj.email,
    fiscalCode: obj.fiscalCode,
    birthYear: obj.birthYear,
    monthlySalary: obj.monthlySalary,
    color: obj.color,
    createCredentials: obj.createCredentials,
    credentials: obj.credentials
  };
};

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await getEmployees();
      // Il backend potrebbe restituire già i dati con username se c'è una relazione
      // Per ora assumiamo che i dati arrivano come snake_case
      const camelCaseData = Array.isArray(data) ? data.map(toCamelCase) : [];
      setEmployees(camelCaseData);
    } catch (error) {
      console.error('Errore caricamento dipendenti:', error);
      alert('Errore nel caricamento dei dipendenti');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleSaveEmployee = async (employeeData) => {
    try {
      const dataToSend = toSnakeCase(employeeData);
      
      if (selectedEmployee) {
        // Modifica dipendente esistente
        await updateEmployee(selectedEmployee.id, dataToSend);
      } else {
        // Nuovo dipendente
        await createEmployee(dataToSend);
      }
      
      await loadEmployees();
      setIsModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Errore salvataggio dipendente:', error);
      alert('Errore nel salvataggio del dipendente: ' + error.message);
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Sei sicuro di voler eliminare questo dipendente?')) {
      try {
        await deleteEmployee(employeeId);
        await loadEmployees();
      } catch (error) {
        console.error('Errore eliminazione dipendente:', error);
        alert('Errore nell\'eliminazione del dipendente: ' + error.message);
      }
    }
  };

  return (
    <div className="employees-container fade-in">
      <div className="employees-header">
        <h2 className="section-title">Dipendenti</h2>
        <button className="btn-add" onClick={handleAddEmployee}>
          + Aggiungi Dipendente
        </button>
      </div>

      {loading ? (
        <div className="loading-message">
          <p>Caricamento dipendenti...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="no-employees-message">
          <p>Nessun dipendente registrato. Clicca su "Aggiungi Dipendente" per iniziare.</p>
        </div>
      ) : (
        <div className="employees-grid">
          {employees.map(employee => (
            <div key={employee.id} className="employee-card">
              <div className="employee-card-header">
                <h3 className="employee-card-name">{employee.fullName}</h3>
                <div className="employee-card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleEditEmployee(employee)}
                    aria-label="Modifica"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteEmployee(employee.id)}
                    aria-label="Elimina"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <div className="employee-card-body">
                <div className="employee-info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{employee.email}</span>
                </div>
                <div className="employee-info-item">
                  <span className="info-label">Codice Fiscale:</span>
                  <span className="info-value">{employee.fiscalCode}</span>
                </div>
                <div className="employee-info-item">
                  <span className="info-label">Anno di Nascita:</span>
                  <span className="info-value">{employee.birthYear}</span>
                </div>
                <div className="employee-info-item">
                  <span className="info-label">Retribuzione Mensile:</span>
                  <span className="info-value">{employee.monthlySalary} €</span>
                </div>
                {employee.credentials && (
                  <div className="employee-info-item">
                    <span className="info-label">Username:</span>
                    <span className="info-value">{employee.credentials.username}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <EmployeeModal
          employee={selectedEmployee}
          onSave={handleSaveEmployee}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default Employees;


