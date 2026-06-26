import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/api';

const Login = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let res;
      if (isLogin) {
        res = await login(form.email, form.password);
      } else {
        // /register now returns a JWT directly — no need for a second login call
        res = await register(form.fullName, form.email, form.password);
      }
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: res.data.id,
        fullName: res.data.fullName,
        email: res.data.email,
      }));
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || (isLogin ? 'Invalid credentials.' : 'Registration failed.');
      setError(typeof msg === 'string' ? msg : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb auth-bg-orb-1" />
      <div className="auth-bg-orb auth-bg-orb-2" />

      <div className="auth-card">
        <div className="auth-logo">SkillSphere AI</div>
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <div className="auth-sub">
          {isLogin ? 'Sign in to access your intelligence dashboard' : 'Join to get your free AI career analysis'}
        </div>

        {error && <div className="auth-error">⚠️ {error}</div>}

        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {!isLogin && (
            <div className="input-group">
              <label>Full Name</label>
              <input type="text" name="fullName" placeholder="John Doe" value={form.fullName} onChange={handleChange} required />
            </div>
          )}
          <div className="input-group">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" name="password" placeholder="••••••••" value={form.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In →' : 'Create Account →')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
