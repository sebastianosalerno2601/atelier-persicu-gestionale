import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('atelier-auth') || '{}');
    setAuth(authData);
    if (!authData.username) {
      navigate('/login');
    }
  }, [navigate]);

  const isSuperAdmin = auth?.role === 'superadmin';

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <nav className="dashboard-nav">
        <div className="nav-header">
          <div className="nav-logo-container">
            <img src="/logo-atelier-persicu.png" alt="Atelier Persicu" className="nav-logo" />
          </div>
          <button 
            className="menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <ul className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
          <li>
            <Link 
              to="/dashboard/appointments" 
              className={location.pathname.includes('appointments') && !location.pathname.includes('all-calendar') ? 'active' : ''}
              onClick={() => setIsMenuOpen(false)}
            >
              Appuntamenti
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/all-calendar" 
              className={location.pathname.includes('all-calendar') ? 'active' : ''}
              onClick={() => setIsMenuOpen(false)}
            >
              All Calendar
            </Link>
          </li>
          {isSuperAdmin && (
            <>
              <li>
                <Link 
                  to="/dashboard/employees" 
                  className={location.pathname.includes('employees') && !location.pathname.includes('report') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dipendenti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/employees-report" 
                  className={location.pathname.includes('employees-report') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Riepilogo Dipendenti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/utilities" 
                  className={location.pathname.includes('utilities') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Utenze
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/product-expenses" 
                  className={location.pathname.includes('product-expenses') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Spese Prodotti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/bar-expenses" 
                  className={location.pathname.includes('bar-expenses') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Spesa Bar
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/maintenance" 
                  className={location.pathname.includes('maintenance') ? 'active' : ''}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Manutenzioni
                </Link>
              </li>
            </>
          )}
          {!isSuperAdmin && (
            <li>
              <Link 
                to="/dashboard/profile" 
                className={location.pathname.includes('profile') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Il mio profilo
              </Link>
            </li>
          )}
          <li className="nav-user">
            <span className="user-name">{auth?.username}</span>
            <button onClick={handleLogout} className="logout-button">
              Esci
            </button>
          </li>
        </ul>
      </nav>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Dashboard;


