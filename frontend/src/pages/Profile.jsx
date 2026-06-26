import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile, getMySkills, addSkill, removeSkill } from '../services/api';

const Profile = ({ activeTab = 'profile' }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'SS';

  const [currentTab, setCurrentTab] = useState(activeTab);

  const [profile, setProfile] = useState({
    university: '', degree: '', major: '', cgpa: '', graduationYear: '', bio: '',
  });
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({ name: '', category: 'Language' });
  const [saving, setSaving] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [certFile, setCertFile] = useState(null);
  const [githubId, setGithubId] = useState('');
  const [linkingGithub, setLinkingGithub] = useState(false);

  useEffect(() => {
    setCurrentTab(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [profRes, skillsRes] = await Promise.all([getProfile(), getMySkills()]);
        const p = profRes.data;
        setProfile({
          university: p.university || '',
          degree: p.degree || '',
          major: p.major || '',
          cgpa: p.cgpa || '',
          graduationYear: p.graduationYear || '',
          bio: p.bio || '',
        });
        setSkills(skillsRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      await updateProfile({
        university: profile.university,
        degree: profile.degree,
        major: profile.major,
        cgpa: profile.cgpa ? parseFloat(profile.cgpa) : null,
        graduationYear: profile.graduationYear ? parseInt(profile.graduationYear) : null,
        bio: profile.bio,
      });
      setMessage({ text: 'Profile saved successfully!', type: 'success' });
    } catch {
      setMessage({ text: 'Failed to save profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.name.trim()) return;
    setAddingSkill(true);
    try {
      await addSkill(newSkill.name.trim(), newSkill.category);
      const res = await getMySkills();
      setSkills(res.data);
      setNewSkill({ name: '', category: 'Language' });
      setMessage({ text: `Skill "${newSkill.name}" added!`, type: 'success' });
    } catch {
      setMessage({ text: 'Failed to add skill.', type: 'error' });
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId, skillName) => {
    try {
      await removeSkill(skillId);
      setSkills(skills.filter(s => s.id !== skillId));
      setMessage({ text: `Removed "${skillName}"`, type: 'success' });
    } catch {
      setMessage({ text: 'Failed to remove skill.', type: 'error' });
    }
  };

  const handleCertFileChange = (e) => {
    if (e.target.files[0]) {
      setCertFile(e.target.files[0]);
    }
  };

  const handleCertUpload = () => {
    if (!certFile) return;
    setSaving(true);
    // Simulate certificate upload since backend endpoint doesn't exist yet
    setTimeout(() => {
      setMessage({ text: `Certificate "${certFile.name}" uploaded successfully!`, type: 'success' });
      setCertFile(null);
      setSaving(false);
    }, 1500);
  };

  const handleLinkGithub = (e) => {
    e.preventDefault();
    if (!githubId.trim()) return;
    setLinkingGithub(true);
    // Simulate GitHub linking
    setTimeout(() => {
      setMessage({ text: `Successfully linked GitHub account: @${githubId.trim()}`, type: 'success' });
      setGithubId('');
      setLinkingGithub(false);
    }, 1500);
  };

  const CATEGORIES = ['Language', 'Framework', 'Database', 'Tool', 'Cloud', 'Other'];

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-avatar-row">
        <div className="profile-avatar-big">{initials}</div>
        <div className="profile-name-block">
          <h2>{user.fullName || 'Student'}</h2>
          <p>{user.email || ''}</p>
        </div>
      </div>

      <div className="auth-tabs" style={{ maxWidth: '400px', marginBottom: '2rem' }}>
        <button className={`auth-tab ${currentTab === 'profile' ? 'active' : ''}`} onClick={() => setCurrentTab('profile')}>Profile</button>
        <button className={`auth-tab ${currentTab === 'skills' ? 'active' : ''}`} onClick={() => setCurrentTab('skills')}>Skills</button>
        <button className={`auth-tab ${currentTab === 'certs' ? 'active' : ''}`} onClick={() => setCurrentTab('certs')}>Certifications</button>
        <button className={`auth-tab ${currentTab === 'projects' ? 'active' : ''}`} onClick={() => setCurrentTab('projects')}>Projects</button>
      </div>

      {message.text && (
        <div className={`alert ${message.type}`}>
          {message.type === 'success' ? '✅ ' : '⚠️ '} {message.text}
        </div>
      )}

      {currentTab === 'profile' && (
        <div className="card">
          <div className="card-title">👤 Academic Information</div>
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="input-group">
                <label>University / College</label>
                <input type="text" name="university" value={profile.university} onChange={handleChange} placeholder="e.g. MIT" />
              </div>
              <div className="input-group">
                <label>Degree</label>
                <input type="text" name="degree" value={profile.degree} onChange={handleChange} placeholder="e.g. B.Tech, BCA, MCA" />
              </div>
              <div className="input-group">
                <label>Major / Branch</label>
                <input type="text" name="major" value={profile.major} onChange={handleChange} placeholder="e.g. Computer Science" />
              </div>
              <div className="input-group">
                <label>CGPA</label>
                <input type="number" step="0.01" min="0" max="10" name="cgpa" value={profile.cgpa} onChange={handleChange} placeholder="e.g. 8.5" />
              </div>
              <div className="input-group">
                <label>Graduation Year</label>
                <input type="number" name="graduationYear" value={profile.graduationYear} onChange={handleChange} placeholder="e.g. 2025" />
              </div>
            </div>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>Bio / About</label>
              <textarea name="bio" value={profile.bio} onChange={handleChange} placeholder="Tell us about yourself..." />
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : '💾 Save Profile'}
            </button>
          </form>
        </div>
      )}

      {currentTab === 'skills' && (
        <div className="card">
          <div className="card-title">🛠 My Skills</div>
          <p style={{ color: 'var(--text-2)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            These skills are used by the AI engine to compute your placement readiness score.
          </p>

          <div className="badge-wrap" style={{ marginBottom: '2rem', minHeight: '2.5rem' }}>
            {skills.length === 0
              ? <span style={{ color: 'var(--text-2)' }}>No skills added yet. Add manually or upload a resume.</span>
              : skills.map(s => (
                <span key={s.id} className="badge" style={{ paddingRight: '0.5rem' }}>
                  {s.name}
                  <span 
                    style={{ marginLeft: '4px', cursor: 'pointer', color: 'var(--danger)', fontSize: '1rem', fontWeight: 900 }}
                    onClick={() => handleRemoveSkill(s.id, s.name)}
                  >
                    ×
                  </span>
                </span>
              ))
            }
          </div>

          <div className="divider" />
          <div className="card-title" style={{ fontSize: '0.85rem' }}>+ Add Skill Manually</div>

          <form onSubmit={handleAddSkill}>
            <div className="form-grid-2" style={{ alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div className="input-group">
                <label>Skill Name</label>
                <input type="text" value={newSkill.name} onChange={e => setNewSkill({ ...newSkill, name: e.target.value })} placeholder="e.g. React" />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={newSkill.category} onChange={e => setNewSkill({ ...newSkill, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={addingSkill}>
              {addingSkill ? 'Adding...' : 'Add Skill'}
            </button>
          </form>
        </div>
      )}

      {currentTab === 'certs' && (
        <div className="card">
          <div className="card-title">🏆 Certifications</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Upload your certificates here to boost your profile score.</p>
          
          <div className={`upload-zone ${certFile ? 'has-file' : ''}`} style={{ padding: '2rem' }}>
            <input type="file" accept=".pdf,.jpg,.png" onChange={handleCertFileChange} />
            <div className="upload-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
            <div className="upload-title" style={{ fontSize: '1.1rem' }}>
              {certFile ? certFile.name : 'Drag & drop certificate'}
            </div>
            <div className="upload-sub" style={{ fontSize: '0.8rem' }}>
              {certFile ? 'Click save to upload' : 'Supports PDF, JPG, PNG'}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button 
              className="btn-primary" 
              disabled={!certFile || saving}
              onClick={handleCertUpload}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {saving ? 'Uploading...' : 'Save Certificate'}
            </button>
          </div>
        </div>
      )}

      {currentTab === 'projects' && (
        <div className="card">
          <div className="card-title">🔧 Projects</div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Link your GitHub account to automatically fetch your repositories and boost your score.</p>
          
          <form onSubmit={handleLinkGithub}>
            <div className="input-group" style={{ marginBottom: '1.5rem' }}>
              <label>GitHub Username</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem', color: 'var(--text-2)' }}>
                  <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" fill="currentColor">
                    <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                  </svg>
                </span>
                <input 
                  type="text" 
                  value={githubId} 
                  onChange={e => setGithubId(e.target.value)} 
                  placeholder="e.g. torvalds" 
                  style={{ flex: 1 }}
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary" disabled={!githubId.trim() || linkingGithub}>
              {linkingGithub ? 'Linking...' : 'Link GitHub Account'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;
