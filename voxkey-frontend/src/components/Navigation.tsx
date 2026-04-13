import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../Navigation.css';

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new Event('voxkey:navigate'));
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo and Brand */}
        <div className="nav-brand">
          <div className="brand-icon"><i className="bx bx-wifi" /></div>
          <button onClick={() => {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new Event('voxkey:navigate'));
          }} className="brand-text">
            VoxKey
          </button>
        </div>

        {/* Main Navigation */}
        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <button onClick={() => {
            window.history.pushState({}, '', '/dashboard');
            window.dispatchEvent(new Event('voxkey:navigate'));
          }} className="nav-link">
            <span className="link-icon">ADD ICON</span>
            Tableau de bord
          </button>
          <button onClick={() => {
            window.history.pushState({}, '', '/analytics');
            window.dispatchEvent(new Event('voxkey:navigate'));
          }} className="nav-link">
            <span className="link-icon">ADD ICON</span>
            Analytique
          </button>
          <button onClick={() => {
            window.history.pushState({}, '', '/sessions');
            window.dispatchEvent(new Event('voxkey:navigate'));
          }} className="nav-link">
            <span className="link-icon">ADD ICON</span>
            Sessions
          </button>
        </div>

        {/* Right Section */}
        <div className="nav-right">
          {/* Notifications */}
          <button className="nav-icon-button" title="Notifications">
            <span className="icon"><i className="bx bx-bell" /></span>
            <span className="badge">3</span>
          </button>

          {/* User Menu */}
          <div className="user-menu-wrapper">
            <button
              className="user-button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="user-avatar">
                {user?.username?.[0].toUpperCase()}
              </div>
              <span className="user-name">{user?.username}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <button onClick={() => {
                  window.history.pushState({}, '', '/settings');
                  window.dispatchEvent(new Event('voxkey:navigate'));
                  setUserMenuOpen(false);
                }} className="dropdown-item">
                  <span><i className="bx bx-user-circle" /></span> Profil
                </button>
                <button onClick={() => {
                  window.history.pushState({}, '', '/settings');
                  window.dispatchEvent(new Event('voxkey:navigate'));
                  setUserMenuOpen(false);
                }} className="dropdown-item">
                  <span><i className="bx bx-cog" /></span> Paramètres
                </button>
                <button onClick={() => {
                  window.location.href = '/help';
                  setUserMenuOpen(false);
                }} className="dropdown-item">
                  <span><i className="bx bx-info-circle" /></span> Aide
                </button>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item logout">
                  <span><i className="bx bx-arrow-from-left" /></span> Déconnexion
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
