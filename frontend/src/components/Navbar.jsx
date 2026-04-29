import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Shield, LogOut, User, Menu, X } from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  // All public links (visible to everyone)
  const publicLinks = [
    { path: '/', name: 'Home' },
    { path: '/ward-dashboard', name: 'Ward' },
    { path: '/public-dashboard', name: 'City Intel' },
    { path: '/community', name: 'Community' },
  ];

  // Auth required links (only for logged-in users)
  const authLinks = [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/report', name: 'Report Issue' },
  ];

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo" onClick={() => setMobileMenuOpen(false)}>
          <Activity className="logo-icon" />
          <span className="logo-text">CivicTrack</span>
        </Link>

        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          {/* Public Links */}
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Auth Required Links - Only show when logged in */}
          {user && authLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield size={16} />
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="nav-buttons">
          {/* Language Selector */}
          <LanguageSelector />
          
          {user ? (
            <>
              <div className="user-info">
                <User size={16} />
                <span>{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-login">Login</button>
              </Link>
              <Link to="/register">
                <button className="btn-signup">Sign Up</button>
              </Link>
            </>
          )}
        </div>

        <button
          className={`mobile-menu-btn ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-menu">
          {/* Public Links */}
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Auth Required Links - Only show when logged in */}
          {user && authLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          
          {/* Admin Link */}
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Shield size={16} />
              <span>Admin</span>
            </Link>
          )}
          
          {/* Language Selector for mobile */}
          <div className="mobile-language">
            <LanguageSelector />
          </div>
          
          {user ? (
            <>
              <div className="mobile-user-info">
                <div>{user.name}</div>
                <div className="mobile-user-role">{user.role}</div>
              </div>
              <button onClick={handleLogout} className="mobile-logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
