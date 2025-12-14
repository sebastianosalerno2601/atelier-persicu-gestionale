import React, { useState, useEffect } from 'react';
import { getUtilities, getBarExpenses, getMaintenance, getAppointments, getProductExpenses } from '../utils/api';
import { getPrice } from '../utils/storage';
import './TotalExpenses.css';

const TotalExpenses = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [utilitiesTotal, setUtilitiesTotal] = useState(0);
  const [barExpensesTotal, setBarExpensesTotal] = useState(0);
  const [maintenanceTotal, setMaintenanceTotal] = useState(0);
  const [productExpensesTotal, setProductExpensesTotal] = useState(0);
  const [employeesEarnings, setEmployeesEarnings] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    loadAllData();
  }, [currentMonth]);

  const getMonthKey = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const monthKey = getMonthKey(currentMonth);
      
      // Carica tutte le spese in parallelo
      const [utilities, barExpenses, maintenance, productExpenses, appointments] = await Promise.all([
        getUtilities(monthKey),
        getBarExpenses(monthKey),
        getMaintenance(monthKey),
        getProductExpenses(monthKey),
        getAppointments()
      ]);

      // Calcola totale utenze
      const utilitiesSum = 
        (parseFloat(utilities.pigione) || 0) +
        (parseFloat(utilities.acqua) || 0) +
        (parseFloat(utilities.luce) || 0) +
        (parseFloat(utilities.spazzatura) || 0) +
        (parseFloat(utilities.gas) || 0);
      setUtilitiesTotal(utilitiesSum);

      // Calcola totale spese bar
      let barTotal = 0;
      Object.values(barExpenses || {}).forEach(expenses => {
        if (Array.isArray(expenses)) {
          expenses.forEach(exp => {
            barTotal += parseFloat(exp.price) || 0;
          });
        }
      });
      setBarExpensesTotal(barTotal);

      // Calcola totale manutenzioni (nuova struttura con array di spese)
      let maintenanceSum = 0;
      if (maintenance && typeof maintenance === 'object') {
        // Gestisce sia la nuova struttura (array di spese) che la vecchia (price singolo)
        Object.values(maintenance).forEach(expenses => {
          if (Array.isArray(expenses)) {
            // Nuova struttura: array di { id, price }
            expenses.forEach(exp => {
              maintenanceSum += parseFloat(exp.price) || 0;
            });
          } else if (expenses && typeof expenses === 'object' && expenses.price) {
            // Vecchia struttura: { price, notes }
            maintenanceSum += parseFloat(expenses.price) || 0;
          }
        });
      }
      setMaintenanceTotal(maintenanceSum);

      // Calcola totale spese prodotti
      let productTotal = 0;
      Object.values(productExpenses || {}).forEach(expenses => {
        if (Array.isArray(expenses)) {
          expenses.forEach(exp => {
            productTotal += parseFloat(exp.price) || 0;
          });
        }
      });
      setProductExpensesTotal(productTotal);

      // Calcola totale 40% dipendenti (solo appuntamenti pagati del mese corrente)
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      const monthAppointments = (appointments || []).filter(apt => {
        // Gestisce sia snake_case che camelCase
        const aptDate = apt.date || apt.appointment_date;
        const aptDateStr = aptDate ? aptDate.split('T')[0] : aptDate;
        const aptDateObj = new Date(aptDateStr);
        
        const paymentMethod = apt.payment_method || apt.paymentMethod;
        const serviceType = apt.service_type || apt.serviceType;
        
        // Solo appuntamenti pagati con carta o contanti del mese corrente
        return aptDateObj.getFullYear() === year && 
               aptDateObj.getMonth() === month &&
               (paymentMethod === 'carta' || paymentMethod === 'contanti');
      });

      const totalRevenue = monthAppointments.reduce((sum, apt) => {
        const serviceType = apt.service_type || apt.serviceType;
        return sum + (getPrice(serviceType) || 0);
      }, 0);

      const employeesTotal = totalRevenue * 0.4;
      setEmployeesEarnings(employeesTotal);

      // Calcola totale complessivo
      const total = utilitiesSum + barTotal + maintenanceSum + productTotal + employeesTotal;
      setGrandTotal(total);

    } catch (error) {
      console.error('Errore caricamento dati:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

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

  if (loading) {
    return (
      <div className="total-expenses-container fade-in">
        <div className="total-expenses-loading">
          <p>Caricamento dati...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="total-expenses-container fade-in">
      <div className="total-expenses-header">
        <h2 className="section-title">Totale Spese</h2>
      </div>

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

      <div className="expenses-summary">
        <div className="expense-card">
          <div className="expense-label">Utenze</div>
          <div className="expense-amount">{utilitiesTotal.toFixed(2)} €</div>
          <div className="expense-description">
            Pigione, acqua, luce, spazzatura, gas
          </div>
        </div>

        <div className="expense-card">
          <div className="expense-label">Spese Bar</div>
          <div className="expense-amount">{barExpensesTotal.toFixed(2)} €</div>
          <div className="expense-description">
            Tutte le spese del bar del mese
          </div>
        </div>

        <div className="expense-card">
          <div className="expense-label">Manutenzioni</div>
          <div className="expense-amount">{maintenanceTotal.toFixed(2)} €</div>
          <div className="expense-description">
            Manutenzioni ordinarie e straordinarie
          </div>
        </div>

        <div className="expense-card">
          <div className="expense-label">Spese Prodotti</div>
          <div className="expense-amount">{productExpensesTotal.toFixed(2)} €</div>
          <div className="expense-description">
            Tutte le spese prodotti del mese
          </div>
        </div>

        <div className="expense-card">
          <div className="expense-label">40% Dipendenti</div>
          <div className="expense-amount">{employeesEarnings.toFixed(2)} €</div>
          <div className="expense-description">
            Totale 40% guadagni dipendenti del mese
          </div>
        </div>
      </div>

      <div className="grand-total-card">
        <div className="grand-total-label">TOTALE SPESE MENSILI</div>
        <div className="grand-total-amount">{grandTotal.toFixed(2)} €</div>
      </div>
    </div>
  );
};

export default TotalExpenses;

