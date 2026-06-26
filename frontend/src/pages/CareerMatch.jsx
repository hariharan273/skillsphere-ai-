import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';
import { Link } from 'react-router-dom';

const CareerMatch = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRecommendations();
        setData(res.data);
        setActiveRole(res.data.primaryRecommendedRole);
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
        <span>Computing Career Match...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div className="alert warning">
          ⚠️ No career data found. Make sure the backend is running and your resume is uploaded.{' '}
          <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload Resume →</Link>
        </div>
      </div>
    );
  }

  if (!data.hasResume) {
    return (
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>AI Career Match</h1>
        <div className="alert warning" style={{ marginTop: '1.5rem' }}>
          📄 No resume uploaded yet. Career Match analysis is based on your extracted resume skills.{' '}
          <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload your resume →</Link>
        </div>
      </div>
    );
  }

  const sortedRoles = Object.entries(data.alternativeRolesAndScores || {})
    .sort(([, a], [, b]) => b - a);

  const topScore = sortedRoles[0]?.[1] ?? 0;

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>AI Career Match</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '0.5rem' }}>
        Analysed from: <strong style={{ color: 'var(--text-1)' }}>{data.resumeFileName}</strong>
      </p>
      <p style={{ color: 'var(--text-2)', marginBottom: '2rem' }}>
        Your extracted skills were scored against {sortedRoles.length} tech roles. Click a role to see its skill breakdown.
      </p>

      {/* ── Top Match Hero ── */}
      <div className="report-hero" style={{ marginBottom: '2rem' }}>
        <div className="score-ring-wrap">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle cx="65" cy="65" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="65" cy="65" r="50"
              fill="none" stroke="#10b981" strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - topScore / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dashoffset 1.5s ease' }}
            />
          </svg>
          <div className="score-ring-inner">
            <span className="score-ring-num" style={{ color: '#10b981', fontSize: '1.7rem' }}>{Math.round(topScore)}%</span>
            <span className="score-ring-label">Match</span>
          </div>
        </div>
        <div className="report-hero-info">
          <div className="report-hero-file">🏆 Best Match</div>
          <div className="report-hero-role">{data.primaryRecommendedRole}</div>
          <div className="report-hero-sub">
            Based on your skills from <strong>{data.resumeFileName}</strong>
          </div>
          <div className="report-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: '#10b981' }}>{data.matchingSkills?.length ?? 0}</span>
              <span className="hero-stat-lbl">Skills Matched</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: '#ef4444' }}>{data.missingSkills?.length ?? 0}</span>
              <span className="hero-stat-lbl">Skill Gaps</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: '#8b5cf6' }}>{sortedRoles.length}</span>
              <span className="hero-stat-lbl">Roles Scored</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── All Role Bars ── */}
      <div className="report-section" style={{ marginBottom: '1.5rem' }}>
        <div className="report-section-header">
          <span className="report-section-icon" style={{ background: 'rgba(139,92,246,0.2)' }}>📊</span>
          <span className="report-section-title">Match Score Across All Roles</span>
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {sortedRoles.map(([role, score]) => {
            const isTop = role === data.primaryRecommendedRole;
            const isActive = role === activeRole;
            const barColor = isTop
              ? 'linear-gradient(90deg, var(--accent), var(--accent2))'
              : score >= 50 ? 'linear-gradient(90deg, #10b981, #34d399)'
              : score >= 25 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
              : 'var(--text-3)';

            return (
              <div
                key={role}
                onClick={() => setActiveRole(isActive ? null : role)}
                style={{
                  cursor: 'pointer',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
                  background: isActive ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.25s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ flex: 1, fontWeight: isTop ? 700 : 500, fontSize: '0.95rem', color: isTop ? 'var(--text-1)' : 'var(--text-2)' }}>
                    {role}
                    {isTop && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>BEST MATCH</span>}
                  </span>
                  <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1rem', color: isTop ? 'var(--accent)' : 'var(--text-1)' }}>
                    {score}%
                  </span>
                </div>
                <div style={{ width: '100%', height: 8, background: 'rgba(0,0,0,0.4)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${score}%`,
                    background: barColor, borderRadius: 99,
                    transition: 'width 1.2s cubic-bezier(.25,.8,.25,1)'
                  }} />
                </div>

                {/* Expanded breakdown */}
                {isActive && (
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                        ✅ You Have
                      </div>
                      <div className="badge-wrap">
                        {(data.matchingSkills ?? []).map(s => <span key={s} className="badge success">{s}</span>)}
                        {(data.matchingSkills?.length ?? 0) === 0 && <span style={{ color: 'var(--text-3)', fontSize: '0.82rem' }}>None yet</span>}
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.06em' }}>
                        ❌ Still Need
                      </div>
                      <div className="badge-wrap">
                        {(data.missingSkills ?? []).map(s => <span key={s} className="badge danger">{s}</span>)}
                        {(data.missingSkills?.length ?? 0) === 0 && <span style={{ color: 'var(--success)', fontSize: '0.82rem' }}>Full coverage! 🎉</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Skill-by-skill guidance ── */}
      {data.missingSkills?.length > 0 && (
        <div className="report-section" style={{ marginBottom: '1.5rem' }}>
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>📌</span>
            <span className="report-section-title">
              Skill Gaps to Close for {data.primaryRecommendedRole}
            </span>
            <span className="report-section-count" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
              {data.missingSkills.length}
            </span>
          </div>
          <div className="badge-wrap" style={{ marginTop: '1rem' }}>
            {data.missingSkills.map(s => <span key={s} className="badge danger">{s}</span>)}
          </div>
          <div style={{ marginTop: '1.2rem' }}>
            <Link to="/roadmap" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
              → View step-by-step learning roadmap to close these gaps
            </Link>
          </div>
        </div>
      )}

      {/* ── Detected Projects ── */}
      {data.resumeProjects?.length > 0 && (
        <div className="report-section">
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(59,130,246,0.2)' }}>🗂️</span>
            <span className="report-section-title">Projects Detected in Your Resume</span>
            <span className="report-section-count" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
              {data.resumeProjects.length}
            </span>
          </div>
          <div className="projects-grid" style={{ marginTop: '1.2rem' }}>
            {data.resumeProjects.map((proj, i) => (
              <div key={i} className="project-card">
                <div className="project-card-header">
                  <div className="project-num">P{i + 1}</div>
                  <div>
                    <div className="project-title">{proj.title}</div>
                    {proj.description && <div className="project-desc">{proj.description}</div>}
                  </div>
                </div>
                {proj.techUsed?.length > 0 && (
                  <div className="badge-wrap" style={{ marginTop: '0.75rem' }}>
                    {proj.techUsed.map(t => <span key={t} className="badge info">{t}</span>)}
                  </div>
                )}
                {proj.links?.length > 0 && (
                  <div className="project-links">
                    {proj.links.map((l, j) => (
                      <span key={j} className="link-chip disabled" title="Link from resume (disabled for security)">
                        🔗 {l.replace(/^https?:\/\//, '').slice(0, 40)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerMatch;
