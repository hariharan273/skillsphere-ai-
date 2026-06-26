import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ isDarkMode, setIsDarkMode, isAuthenticated, setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" style={{ textDecoration: 'none' }}>
        <div className="logo">SkillSphere AI</div>
      </Link>
      
      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/profile" className="nav-link">Profile</Link>
            <button className="nav-link" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
        <button className="theme-toggle" onClick={() => setIsDarkMode(!isDarkMode)}>
          {isDarkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
