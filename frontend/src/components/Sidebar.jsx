import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = ({ setIsAuthenticated }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SS';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-text">SkillSphere AI</div>
        <div className="sidebar-logo-sub">Career Intelligence Platform</div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {/* Main */}
        <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          <span className="nav-icon">🏠</span>
          Dashboard
        </Link>
        <Link to="/profile" className={`nav-item ${isActive('/profile') ? 'active' : ''}`}>
          <span className="nav-icon">👤</span>
          Profile
        </Link>

        {/* Career Data */}
        <div className="sidebar-section-label">Career Data</div>
        <Link to="/skills" className={`nav-item ${isActive('/skills') ? 'active' : ''}`}>
          <span className="nav-icon">💡</span>
          Skills
        </Link>
        <Link to="/certifications" className={`nav-item ${isActive('/certifications') ? 'active' : ''}`}>
          <span className="nav-icon">🏆</span>
          Certifications
        </Link>
        <Link to="/projects" className={`nav-item ${isActive('/projects') ? 'active' : ''}`}>
          <span className="nav-icon">🔧</span>
          Projects
        </Link>
        <Link to="/resume" className={`nav-item ${isActive('/resume') ? 'active' : ''}`}>
          <span className="nav-icon">📄</span>
          Resume
        </Link>

        {/* AI Insights */}
        <div className="sidebar-section-label">AI Insights</div>
        <Link to="/career-match" className={`nav-item ${isActive('/career-match') ? 'active' : ''}`}>
          <span className="nav-icon">🎯</span>
          Career Match
          <span className="nav-ai-badge">AI</span>
        </Link>
        <Link to="/readiness" className={`nav-item ${isActive('/readiness') ? 'active' : ''}`}>
          <span className="nav-icon">📊</span>
          Readiness Report
          <span className="nav-ai-badge">AI</span>
        </Link>
        <Link to="/roadmap" className={`nav-item ${isActive('/roadmap') ? 'active' : ''}`}>
          <span className="nav-icon">📚</span>
          Learning Roadmap
          <span className="nav-ai-badge">AI</span>
        </Link>

        {/* Divider */}
        <div style={{ height: '1px', background: 'var(--border)', margin: '0.75rem 0' }} />

        <button className="nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
          <span className="nav-icon">🚪</span>
          Sign out
        </button>
      </nav>

      {/* User Footer */}
      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user.fullName || 'Student'}</div>
          <div className="user-role">Student · <span style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={handleLogout}>Sign out →</span></div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
