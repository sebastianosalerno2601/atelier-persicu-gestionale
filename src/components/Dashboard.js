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

  const handleToggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    navigate('/dashboard/appointments');
    setIsMenuOpen(false);
  };

  return (
    <div className="dashboard-container">
      {isMenuOpen && <div className="menu-overlay" onClick={handleCloseMenu}></div>}
      <nav className="dashboard-nav">
        <div className="nav-header">
          <div className="nav-logo-container" onClick={handleLogoClick}>
            <img src="/logo-atelier-persicu.png" alt="Atelier Persicu" className="nav-logo" />
          </div>
          <button 
            className="menu-toggle"
            onClick={handleToggleMenu}
            aria-label="Toggle menu"
            type="button"
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
              onClick={handleCloseMenu}
            >
              Appuntamenti
            </Link>
          </li>
          <li>
            <Link 
              to="/dashboard/all-calendar" 
              className={location.pathname.includes('all-calendar') ? 'active' : ''}
              onClick={handleCloseMenu}
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
                  onClick={handleCloseMenu}
                >
                  Dipendenti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/employees-report" 
                  className={location.pathname.includes('employees-report') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Riepilogo Dipendenti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/utilities" 
                  className={location.pathname.includes('utilities') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Utenze
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/product-expenses" 
                  className={location.pathname.includes('product-expenses') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Spese Prodotti
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/bar-expenses" 
                  className={location.pathname.includes('bar-expenses') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Spesa Bar
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/maintenance" 
                  className={location.pathname.includes('maintenance') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Manutenzioni
                </Link>
              </li>
              <li>
                <Link 
                  to="/dashboard/total-expenses" 
                  className={location.pathname.includes('total-expenses') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Totale Spese
                </Link>
              </li>
            </>
          )}
          {!isSuperAdmin && (
            <li>
              <Link 
                to="/dashboard/profile" 
                className={location.pathname.includes('profile') ? 'active' : ''}
                onClick={handleCloseMenu}
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


