import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

const ReadinessReport = () => {
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
        <span>Generating Readiness Report...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="alert warning">
        ⚠️ Could not load report. Make sure the backend is running.{' '}
        <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload Resume →</Link>
      </div>
    );
  }

  const score = Math.round(data.placementReadinessScore ?? 0);
  const gap = Math.round(data.skillGapPercentage ?? 0);
  const scoreColor = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const scoreLabel = score >= 70 ? 'Strong' : score >= 45 ? 'Developing' : 'Early Stage';

  const barData = Object.entries(data.alternativeRolesAndScores || {})
    .sort(([, a], [, b]) => b - a)
    .map(([role, val]) => ({ role: role.replace(' Developer', ' Dev').replace(' Engineer', ' Eng'), score: val }));

  const radius = 80;
  const circ = 2 * Math.PI * radius;
  const fillOffset = circ - (score / 100) * circ;

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Readiness Report</h1>
      {data.hasResume ? (
        <p style={{ color: 'var(--text-2)', marginBottom: '2rem' }}>
          Based on <strong style={{ color: 'var(--text-1)' }}>{data.resumeFileName}</strong> — 
          detailed breakdown of your placement readiness across all roles.
        </p>
      ) : (
        <div className="alert warning" style={{ marginBottom: '2rem' }}>
          📄 No resume yet. Scores below are based on manually added skills.{' '}
          <Link to="/resume" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upload Resume →</Link>
        </div>
      )}

      {/* ── Big Score ── */}
      <div className="report-hero" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
            <circle
              cx="100" cy="100" r={radius}
              fill="none" stroke={scoreColor} strokeWidth="14"
              strokeDasharray={circ} strokeDashoffset={fillOffset}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              style={{ transition: 'stroke-dashoffset 1.5s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            {/* SVG overlay handled below */}
          </div>
          {/* overlay via absolute positioning inside wrapper */}
          <div style={{ marginTop: '-118px', marginBottom: '90px', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}%</div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-2)', marginTop: 4 }}>Readiness</div>
          </div>
        </div>

        <div className="report-hero-info">
          <div className="report-hero-file" style={{ marginBottom: '1rem' }}>
            {data.hasResume ? `📄 ${data.resumeFileName}` : '📄 No resume uploaded'}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
            {[
              { label: 'Readiness Score', value: `${score}%`, color: scoreColor },
              { label: 'Skill Gap', value: `${gap}%`, color: '#ef4444' },
              { label: 'Level', value: scoreLabel, color: scoreColor },
              { label: 'Best Role', value: data.primaryRecommendedRole, color: '#8b5cf6' },
            ].map(s => (
              <div key={s.label} className="hero-stat">
                <span className="hero-stat-val" style={{ color: s.color, fontSize: '1.3rem' }}>{s.value}</span>
                <span className="hero-stat-lbl">{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '0.85rem 1.2rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
            {score >= 70
              ? `🟢 Strong profile — your skills align well with ${data.primaryRecommendedRole} requirements. Focus on portfolio quality, system design, and advanced certifications.`
              : score >= 45
              ? `🟡 Developing profile — you're on the right track for ${data.primaryRecommendedRole}. Close the ${data.missingSkills?.length ?? 0} skill gaps in the roadmap to boost your score significantly.`
              : `🔴 Early stage — start with the foundational skills listed in the Learning Roadmap. Consistent daily practice on 1–2 skills will get you to 50%+ within 2–3 months.`}
          </div>
        </div>
      </div>

      {/* ── Matched vs Gap breakdown ── */}
      <div className="skills-two-col" style={{ marginBottom: '1.5rem' }}>
        <div className="report-section">
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(16,185,129,0.2)' }}>✅</span>
            <span className="report-section-title">Skills You Have</span>
            <span className="report-section-count" style={{ borderColor: '#10b981', color: '#10b981' }}>
              {data.matchingSkills?.length ?? 0}
            </span>
          </div>
          <div className="badge-wrap" style={{ marginTop: '1rem' }}>
            {data.matchingSkills?.length > 0
              ? data.matchingSkills.map(s => <span key={s} className="badge success">{s}</span>)
              : <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                  No skills matched yet — <Link to="/resume" style={{ color: 'var(--accent)' }}>upload your resume</Link>.
                </span>
            }
          </div>
        </div>

        <div className="report-section">
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(239,68,68,0.2)' }}>📌</span>
            <span className="report-section-title">Skills Still Needed</span>
            <span className="report-section-count" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
              {data.missingSkills?.length ?? 0}
            </span>
          </div>
          <div className="badge-wrap" style={{ marginTop: '1rem' }}>
            {data.missingSkills?.length > 0
              ? data.missingSkills.map(s => <span key={s} className="badge danger">{s}</span>)
              : <span style={{ color: 'var(--success)', fontSize: '0.85rem' }}>🎉 Full coverage for {data.primaryRecommendedRole}!</span>
            }
          </div>
        </div>
      </div>

      {/* ── Bar chart of all role scores ── */}
      <div className="report-section" style={{ marginBottom: '1.5rem' }}>
        <div className="report-section-header">
          <span className="report-section-icon" style={{ background: 'rgba(139,92,246,0.2)' }}>📊</span>
          <span className="report-section-title">Readiness Score by Role</span>
        </div>
        <div style={{ width: '100%', height: 260, marginTop: '1.5rem' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} layout="vertical" margin={{ left: 20, right: 30 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
              <YAxis type="category" dataKey="role" tick={{ fill: 'var(--text-2)', fontSize: 11 }} width={120} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.82rem' }}
                formatter={(v) => [`${v}%`, 'Match Score']}
              />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.role.includes(data.primaryRecommendedRole.split(' ')[0])
                      ? 'url(#accentGrad)'
                      : entry.score >= 50 ? '#10b981'
                      : entry.score >= 25 ? '#f59e0b' : '#52525b'}
                  />
                ))}
              </Bar>
              <defs>
                <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Resume Links ── */}
      {data.resumeLinks?.length > 0 && (
        <div className="report-section">
          <div className="report-section-header">
            <span className="report-section-icon" style={{ background: 'rgba(139,92,246,0.2)' }}>🔗</span>
            <span className="report-section-title">Links Found in Your Resume</span>
            <span className="report-section-count" style={{ borderColor: '#8b5cf6', color: '#8b5cf6' }}>
              {data.resumeLinks.length}
            </span>
          </div>
          <div className="links-wrap" style={{ marginTop: '1rem' }}>
            {data.resumeLinks.map((l, i) => (
              <span key={i} className="link-chip disabled">
                {l.includes('github') ? '🔗' : l.includes('linkedin') ? '💼' : '🌐'}{' '}
                {l.replace(/^https?:\/\//, '').slice(0, 50)}
              </span>
            ))}
          </div>
          <p className="links-note">🔒 Links are displayed for reference only — not clickable.</p>
        </div>
      )}
    </div>
  );
};

export default ReadinessReport;
