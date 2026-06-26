import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer, Radar, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip
} from 'recharts';
import { getRecommendations } from '../services/api';
import { Link } from 'react-router-dom';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedStat, setExpandedStat] = useState(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const firstName = user.fullName ? user.fullName.split(' ')[0] : 'there';
  const initials = user.fullName
    ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRecommendations();
        setData(res.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <span>Loading AI Telemetry...</span>
      </div>
    );
  }

  // No backend / not logged in properly
  if (!data) {
    return (
      <div className="alert warning" style={{ marginTop: '2rem' }}>
        ⚠️ Could not load career data. Make sure the backend is running.{' '}
        <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>
          Upload your resume →
        </Link>
      </div>
    );
  }

  const radarData = Object.entries(data.alternativeRolesAndScores || {}).map(([k, v]) => ({
    subject: k.replace(' Developer', ' Dev').replace(' Engineer', ' Eng'),
    A: v, fullMark: 100,
  }));

  // Stats — only real numbers, no fake certifications or fake projects
  const stats = [
    {
      icon: '✅',
      value: data.matchingSkills?.length ?? 0,
      label: 'Skills Matched',
      color: 'var(--success)',
      details: data.matchingSkills?.length > 0
        ? data.matchingSkills
        : ['No matching skills yet — upload your resume to detect them.']
    },
    {
      icon: '⚠️',
      value: data.missingSkills?.length ?? 0,
      label: 'Skill Gaps',
      color: 'var(--danger)',
      details: data.missingSkills?.length > 0
        ? data.missingSkills
        : ['No gaps detected for your matched role — great coverage!']
    },
    {
      icon: '🗂️',
      value: data.resumeProjects?.length ?? 0,
      label: 'Projects Found',
      color: '#3b82f6',
      details: data.resumeProjects?.length > 0
        ? data.resumeProjects.map(p => p.title)
        : ['No projects detected in resume — add a Projects section to your resume.']
    },
    {
      icon: '🔗',
      value: data.resumeLinks?.length ?? 0,
      label: 'Links Detected',
      color: '#8b5cf6',
      details: data.resumeLinks?.length > 0
        ? data.resumeLinks.map(l => l.replace(/^https?:\/\//, ''))
        : ['No links detected — add your GitHub and LinkedIn to your resume.']
    },
  ];

  const score = Math.round(data.placementReadinessScore ?? 0);
  const scoreColor = score >= 70 ? 'var(--success)' : score >= 45 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div style={{ maxWidth: 1200 }}>

      {/* ── No Resume Banner ── */}
      {!data.hasResume && (
        <div className="alert warning" style={{ marginBottom: '1.5rem' }}>
          📄 No resume uploaded yet — scores below are based on manually added skills only.{' '}
          <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>
            Upload your resume →
          </Link>
        </div>
      )}

      {/* ── Welcome Banner ── */}
      <div className="welcome-banner">
        <div className="welcome-left">
          <div className="welcome-greeting">{greeting()}, {firstName}! 👋</div>
          <div className="welcome-sub">
            {data.hasResume
              ? <>Your AI career analysis is based on <strong>{data.resumeFileName}</strong>. Here's your placement intelligence.</>
              : 'Upload your resume to get your full AI-powered career analysis.'}
          </div>
          <div className="welcome-actions">
            <Link to="/resume" className="btn-white" style={{ textDecoration: 'none' }}>
              📄 {data.hasResume ? 'Re-upload Resume' : 'Upload Resume'}
            </Link>
            <Link to="/career-match" className="btn-pink" style={{ textDecoration: 'none' }}>
              🧠 Career Match Analysis
            </Link>
          </div>
        </div>
        <div className="score-circle">
          <div className="score-number" style={{ color: scoreColor }}>{score}</div>
          <div className="score-label">Readiness<br />Score</div>
        </div>
      </div>

      {/* ── How Analysis Works ── */}
      <div className="ai-flow-card">
        <div className="section-heading">
          <span>🧠</span> How Your AI Analysis Works
        </div>
        <div className="ai-steps">
          {[
            { icon: '📋', label: data.hasResume ? data.resumeFileName : 'Your resume PDF' },
            { icon: '🔍', label: `${(data.matchingSkills?.length ?? 0) + (data.missingSkills?.length ?? 0)} skills identified` },
            { icon: '📊', label: `Scored vs ${Object.keys(data.alternativeRolesAndScores || {}).length} job roles` },
            { icon: '🎯', label: `${score}% placement ready` },
            { icon: '🗺️', label: `${data.missingSkills?.length ?? 0} gaps to close` },
          ].map((step, i, arr) => (
            <React.Fragment key={i}>
              <div className="ai-step">
                <div className="ai-step-icon">{step.icon}</div>
                <div className="ai-step-label">{step.label}</div>
              </div>
              {i < arr.length - 1 && <div className="ai-step-arrow">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div
            className="stat-card"
            key={i}
            onClick={() => setExpandedStat(expandedStat === i ? null : i)}
            style={{ cursor: 'pointer' }}
            title={`Click to see ${s.label}`}
          >
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
            {expandedStat === i && (
              <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  {s.details.map((item, idx) => (
                    <li key={idx} style={{ marginBottom: 6, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ color: s.color }}>•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="dash-grid" style={{ marginBottom: '1rem' }}>
        {/* Readiness */}
        <div className="card">
          <div className="card-title">📊 Placement Readiness</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div>
              <div className="metric-big" style={{ color: scoreColor }}>{data.placementReadinessScore}%</div>
              <div className="metric-sub">Overall Readiness Score</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--danger)' }}>
                {data.skillGapPercentage}%
              </div>
              <div className="metric-sub">Skill Gap</div>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${data.placementReadinessScore}%` }} />
          </div>
          <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-2)' }}>
            {score >= 70
              ? '🟢 Strong profile — focus on advanced skills and portfolio quality'
              : score >= 45
              ? '🟡 Developing profile — close the skill gaps below to improve fast'
              : '🔴 Early stage — complete the roadmap steps to build a solid foundation'}
          </div>
        </div>

        {/* Best Match Role */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #4338ca, #7c3aed)', border: 'none' }}>
          <div className="card-title" style={{ color: 'rgba(255,255,255,0.7)' }}>🎯 Best Match Role</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', marginBottom: '0.75rem', lineHeight: 1.2 }}>
            {data.primaryRecommendedRole}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.87rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
            Matched {data.matchingSkills?.length ?? 0} of {(data.matchingSkills?.length ?? 0) + (data.missingSkills?.length ?? 0)} required skills.
            {data.missingSkills?.length > 0 && ` Missing: ${data.missingSkills.slice(0, 3).join(', ')}${data.missingSkills.length > 3 ? '...' : ''}.`}
          </p>
          <Link to="/career-match" style={{ textDecoration: 'none' }}>
            <button className="btn-white">View Full Analysis →</button>
          </Link>
        </div>
      </div>

      {/* ── Skill Analysis + Radar ── */}
      <div className="dash-grid">
        <div className="card">
          <div className="card-title">💡 Skill Analysis</div>
          {data.matchingSkills?.length > 0 ? (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ✅ You Have ({data.matchingSkills.length})
              </div>
              <div className="badge-wrap">
                {data.matchingSkills.map(s => <span key={s} className="badge success">{s}</span>)}
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-2)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              No skills matched yet.{' '}
              <Link to="/resume" style={{ color: 'var(--accent)' }}>Upload your resume →</Link>
            </div>
          )}
          <div className="divider" />
          {data.missingSkills?.length > 0 && (
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ❌ Skill Gaps ({data.missingSkills.length})
              </div>
              <div className="badge-wrap">
                {data.missingSkills.map(s => <span key={s} className="badge danger">{s}</span>)}
              </div>
            </div>
          )}
        </div>

        {/* Radar */}
        <div className="card">
          <div className="card-title">📡 Role Alignment Map</div>
          {radarData.length > 0 ? (
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-2)', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Match %" dataKey="A" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.5} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.82rem' }}
                    formatter={(v) => [`${v}%`, 'Match']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p style={{ color: 'var(--text-2)' }}>No data yet — upload your resume to see role alignment.</p>
          )}
        </div>
      </div>

      {/* ── Projects from Resume ── */}
      {data.resumeProjects?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <div className="card-title">🗂️ Projects Detected in Your Resume</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {data.resumeProjects.map((proj, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)', padding: '1.2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: 28, height: 28, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                    borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#60a5fa', fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
                  }}>P{i + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{proj.title}</span>
                </div>
                {proj.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-2)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
                    {proj.description.slice(0, 120)}{proj.description.length > 120 ? '…' : ''}
                  </p>
                )}
                {proj.techUsed?.length > 0 && (
                  <div className="badge-wrap">
                    {proj.techUsed.map(t => <span key={t} className="badge info" style={{ fontSize: '0.75rem' }}>{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Roadmap ── */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="card-title">🗺️ Personalized Learning Roadmap</div>
        {data.learningRoadmap?.length > 0 ? (
          <ul className="roadmap-list">
            {data.learningRoadmap.map((item, idx) => (
              <li key={idx} className="roadmap-item">
                <div className="roadmap-num">{idx + 1}</div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: 'var(--text-2)' }}>
            <Link to="/resume" style={{ color: 'var(--accent)' }}>Upload your resume</Link> to get a personalized learning roadmap.
          </p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
