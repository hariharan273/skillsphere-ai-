import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';
import { Link } from 'react-router-dom';

const LearningRoadmap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
        <span>Building Your Learning Roadmap...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert warning">
        ⚠️ Could not load roadmap. Make sure the backend is running.{' '}
        <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload Resume →</Link>
      </div>
    );
  }

  if (!data.hasResume) {
    return (
      <div style={{ maxWidth: 700 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Learning Roadmap</h1>
        <div className="alert warning" style={{ marginTop: '1.5rem' }}>
          📄 Upload your resume first — your roadmap is generated based on the actual skill gaps found in your resume.{' '}
          <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload Resume →</Link>
        </div>
      </div>
    );
  }

  const score = Math.round(data.placementReadinessScore ?? 0);
  const totalSteps = data.learningRoadmap?.length ?? 0;

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Learning Roadmap</h1>
      <p style={{ color: 'var(--text-2)', marginBottom: '2rem' }}>
        Personalized action plan generated from skill gaps found in{' '}
        <strong style={{ color: 'var(--text-1)' }}>{data.resumeFileName}</strong>.
        Close these gaps to become a strong <strong style={{ color: 'var(--accent)' }}>{data.primaryRecommendedRole}</strong>.
      </p>

      {/* ── Progress summary ── */}
      <div className="report-hero" style={{ marginBottom: '2rem' }}>
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px var(--accent-glow)'
          }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}%</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>Ready</span>
          </div>
        </div>
        <div className="report-hero-info">
          <div className="report-hero-role" style={{ fontSize: '1.5rem' }}>
            Target: {data.primaryRecommendedRole}
          </div>
          <div className="report-hero-sub">
            Close these {data.missingSkills?.length ?? 0} skill gap{data.missingSkills?.length !== 1 ? 's' : ''} to reach 100% readiness
          </div>
          <div className="report-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: 'var(--accent)' }}>{totalSteps}</span>
              <span className="hero-stat-lbl">Roadmap Steps</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: '#ef4444' }}>{data.missingSkills?.length ?? 0}</span>
              <span className="hero-stat-lbl">Gaps to Close</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-val" style={{ color: '#10b981' }}>{data.matchingSkills?.length ?? 0}</span>
              <span className="hero-stat-lbl">Already Have</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Skill gaps (missing) ── */}
      {data.missingSkills?.length > 0 && (
        <div className="report-section" style={{ marginBottom: '1.5rem' }}>
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>📌</span>
            <span className="report-section-title">Skills to Learn for {data.primaryRecommendedRole}</span>
            <span className="report-section-count" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
              {data.missingSkills.length}
            </span>
          </div>
          <div className="badge-wrap" style={{ marginTop: '1rem' }}>
            {data.missingSkills.map(s => <span key={s} className="badge danger">{s}</span>)}
          </div>
        </div>
      )}

      {/* ── Roadmap steps ── */}
      <div className="report-section" style={{ marginBottom: '1.5rem' }}>
        <div className="report-section-header">
          <span className="report-section-icon" style={{ background: 'rgba(245,158,11,0.2)' }}>🗺️</span>
          <span className="report-section-title">Step-by-Step Action Plan</span>
          <span className="report-section-count" style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}>
            {totalSteps} steps
          </span>
        </div>

        {totalSteps > 0 ? (
          <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.learningRoadmap.map((step, idx) => (
              <div key={idx} style={{
                display: 'flex', alignItems: 'flex-start', gap: '1rem',
                padding: '1.2rem 1.4rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)',
                transition: 'all 0.25s'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(139,92,246,0.4)';
                  e.currentTarget.style.background = 'rgba(139,92,246,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#fff', fontSize: '0.9rem',
                  boxShadow: '0 4px 12px var(--accent-glow)'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', color: 'var(--text-1)', lineHeight: 1.6 }}>{step}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: 600 }}>
            🎉 No gaps detected! You have full coverage for {data.primaryRecommendedRole}.
          </div>
        )}
      </div>

      {/* ── What you already know ── */}
      {data.matchingSkills?.length > 0 && (
        <div className="report-section">
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</span>
            <span className="report-section-title">Skills You Already Have</span>
            <span className="report-section-count" style={{ borderColor: '#10b981', color: '#10b981' }}>
              {data.matchingSkills.length}
            </span>
          </div>
          <p style={{ color: 'var(--text-2)', fontSize: '0.88rem', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
            These are already in your resume — keep practising and showcasing them in projects.
          </p>
          <div className="badge-wrap">
            {data.matchingSkills.map(s => <span key={s} className="badge success">{s}</span>)}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningRoadmap;
