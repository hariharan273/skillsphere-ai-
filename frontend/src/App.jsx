import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Resume from './pages/Resume';
import CareerMatch from './pages/CareerMatch';
import ReadinessReport from './pages/ReadinessReport';
import LearningRoadmap from './pages/LearningRoadmap';
import './index.css';

// Simple Landing Page
const Landing = () => (
  <div className="landing-page">
    <div className="landing-orb-1" />
    <div className="landing-orb-2" />

    <div className="landing-badge">
      <span>🧠</span> AI-Powered Career Intelligence
    </div>

    <h1 className="landing-h1">
      Unlock Your True<br />
      <span className="gradient-text">Career Potential</span>
    </h1>

    <p className="landing-sub">
      Upload your resume and let AI instantly analyze your skills, match you to roles,
      identify gaps, and generate a personalized learning roadmap — no manual input needed.
    </p>

    <div className="landing-cta">
      <button className="btn-primary" onClick={() => window.location.href = '/login'}>
        🚀 Start Free Assessment
      </button>
      <button className="btn-secondary" onClick={() => window.location.href = '/login'}>
        View Demo
      </button>
    </div>
  </div>
);

// Layout wrapper with Sidebar + Topbar
const AppLayout = ({ children, setIsAuthenticated, pageTitle }) => {
  return (
    <div className="app-shell">
      <Sidebar setIsAuthenticated={setIsAuthenticated} />
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <span className="topbar-title">Your AI-powered placement intelligence hub</span>
          <div className="topbar-actions">
            <button className="icon-btn" title="Notifications">🔔</button>
          </div>
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) setIsAuthenticated(true);
  }, []);

  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={!isAuthenticated ? <Landing /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/dashboard" />} />

        {/* Protected – with sidebar layout */}
        <Route path="/dashboard" element={
          isAuthenticated
            ? <AppLayout setIsAuthenticated={setIsAuthenticated} pageTitle="Dashboard">
                <Dashboard />
              </AppLayout>
            : <Navigate to="/login" />
        } />
        <Route path="/profile" element={
          isAuthenticated
            ? <AppLayout setIsAuthenticated={setIsAuthenticated} pageTitle="Profile">
                <Profile />
              </AppLayout>
            : <Navigate to="/login" />
        } />
        <Route path="/resume" element={
          isAuthenticated
            ? <AppLayout setIsAuthenticated={setIsAuthenticated} pageTitle="Resume">
                <Resume />
              </AppLayout>
            : <Navigate to="/login" />
        } />
        <Route path="/career-match" element={
          isAuthenticated
            ? <AppLayout setIsAuthenticated={setIsAuthenticated} pageTitle="Career Match">
                <CareerMatch />
              </AppLayout>
            : <Navigate to="/login" />
        } />
        {/* Placeholder routes for sidebar items */}
        <Route path="/skills" element={isAuthenticated ? <AppLayout setIsAuthenticated={setIsAuthenticated}><Profile activeTab="skills" /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/certifications" element={isAuthenticated ? <AppLayout setIsAuthenticated={setIsAuthenticated}><Profile activeTab="certs" /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/projects" element={isAuthenticated ? <AppLayout setIsAuthenticated={setIsAuthenticated}><Profile activeTab="projects" /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/readiness" element={isAuthenticated ? <AppLayout setIsAuthenticated={setIsAuthenticated}><ReadinessReport /></AppLayout> : <Navigate to="/login" />} />
        <Route path="/roadmap" element={isAuthenticated ? <AppLayout setIsAuthenticated={setIsAuthenticated}><LearningRoadmap /></AppLayout> : <Navigate to="/login" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
