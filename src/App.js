import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import AllCalendar from './components/AllCalendar';
import Employees from './components/Employees';
import MyProfile from './components/MyProfile';
import EmployeesReport from './components/EmployeesReport';
import Utilities from './components/Utilities';
import ProductExpenses from './components/ProductExpenses';
import BarExpenses from './components/BarExpenses';
import Maintenance from './components/Maintenance';
import TotalExpenses from './components/TotalExpenses';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verifica se l'utente è già autenticato
    const auth = localStorage.getItem('atelier-auth');
    if (auth) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('atelier-auth');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <Dashboard onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Appointments />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="all-calendar" element={<AllCalendar />} />
          <Route path="employees" element={<Employees />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="employees-report" element={<EmployeesReport />} />
          <Route path="utilities" element={<Utilities />} />
          <Route path="product-expenses" element={<ProductExpenses />} />
          <Route path="bar-expenses" element={<BarExpenses />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="total-expenses" element={<TotalExpenses />} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
