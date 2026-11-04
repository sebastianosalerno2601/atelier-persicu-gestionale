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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

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

  const isActive = (path, { exactSegment } = {}) => {
    if (exactSegment === 'appointments') {
      return location.pathname.includes('appointments') && !location.pathname.includes('all-calendar');
    }
    if (exactSegment === 'employees') {
      return location.pathname.includes('employees') && !location.pathname.includes('report');
    }
    return location.pathname.includes(path);
  };

  return (
    <div className={`dashboard-container ${isMenuOpen ? 'menu-open' : ''}`}>
      {isMenuOpen && <div className="menu-overlay" onClick={handleCloseMenu} />}

      <aside className={`dashboard-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-brand" onClick={handleLogoClick}>
          <img src="/logo-atelier-persicu.png" alt="Atelier Persicu" className="sidebar-logo" />
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            <li>
              <Link
                to="/dashboard/appointments"
                className={isActive('appointments', { exactSegment: 'appointments' }) ? 'active' : ''}
                onClick={handleCloseMenu}
              >
                Appuntamenti
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/all-calendar"
                className={isActive('all-calendar') ? 'active' : ''}
                onClick={handleCloseMenu}
              >
                All Calendar
              </Link>
            </li>
            {isSuperAdmin && (
              <>
                <li className="sidebar-section-label">Gestione</li>
                <li>
                  <Link
                    to="/dashboard/employees"
                    className={isActive('employees', { exactSegment: 'employees' }) ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Dipendenti
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/employees-report"
                    className={isActive('employees-report') ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Riepilogo Dipendenti
                  </Link>
                </li>
                <li className="sidebar-section-label">Spese</li>
                <li>
                  <Link
                    to="/dashboard/utilities"
                    className={isActive('utilities') ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Utenze
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/product-expenses"
                    className={isActive('product-expenses') ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Spese Prodotti
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/bar-expenses"
                    className={isActive('bar-expenses') ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Spesa Bar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/maintenance"
                    className={isActive('maintenance') ? 'active' : ''}
                    onClick={handleCloseMenu}
                  >
                    Manutenzioni
                  </Link>
                </li>
                <li>
                  <Link
                    to="/dashboard/total-expenses"
                    className={isActive('total-expenses') ? 'active' : ''}
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
                  className={isActive('profile') ? 'active' : ''}
                  onClick={handleCloseMenu}
                >
                  Il mio profilo
                </Link>
              </li>
            )}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <span className="user-name">{auth?.username}</span>
          <button onClick={handleLogout} className="logout-button" type="button">
            Esci
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-mobile-header">
          <button
            className="menu-toggle"
            onClick={handleToggleMenu}
            aria-label="Apri menu"
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
          <div className="mobile-logo-container" onClick={handleLogoClick}>
            <img src="/logo-atelier-persicu.png" alt="Atelier Persicu" className="mobile-logo" />
          </div>
          <div className="mobile-header-spacer" />
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
