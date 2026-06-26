import React, { useState, useRef } from 'react';
import { uploadResume } from '../services/api';

// ─── Disabled Link Chip ────────────────────────────────────────────────────────
const DisabledLink = ({ url }) => {
  const display = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const isGithub   = url.includes('github.com');
  const isLinkedin = url.includes('linkedin.com');
  const icon = isGithub ? '🔗' : isLinkedin ? '💼' : '🌐';

  return (
    <span className="link-chip disabled" title="Link extracted from resume (disabled for security)">
      {icon} {display.length > 55 ? display.slice(0, 52) + '…' : display}
    </span>
  );
};

// ─── Score Ring ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score }) => {
  const radius = 54;
  const circ   = 2 * Math.PI * radius;
  const fill   = circ - (score / 100) * circ;
  const color  = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';

  return (
    <div className="score-ring-wrap">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
        <circle
          cx="70" cy="70" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(.25,.8,.25,1)' }}
        />
      </svg>
      <div className="score-ring-inner">
        <span className="score-ring-num" style={{ color }}>{Math.round(score)}%</span>
        <span className="score-ring-label">Match</span>
      </div>
    </div>
  );
};

// ─── Project Card ──────────────────────────────────────────────────────────────
const ProjectCard = ({ project, index }) => (
  <div className="project-card">
    <div className="project-card-header">
      <div className="project-num">P{index + 1}</div>
      <div>
        <div className="project-title">{project.title}</div>
        {project.description && (
          <div className="project-desc">{project.description}</div>
        )}
      </div>
    </div>

    {project.techUsed && project.techUsed.length > 0 && (
      <div className="badge-wrap" style={{ marginTop: '1rem' }}>
        {project.techUsed.map(t => (
          <span key={t} className="badge info">{t}</span>
        ))}
      </div>
    )}

    {project.links && project.links.length > 0 && (
      <div className="project-links">
        {project.links.map((link, i) => (
          <DisabledLink key={i} url={link} />
        ))}
      </div>
    )}
  </div>
);

// ─── Section Wrapper ───────────────────────────────────────────────────────────
const ReportSection = ({ icon, title, count, color, children }) => (
  <div className="report-section">
    <div className="report-section-header">
      <span className="report-section-icon" style={{ background: color }}>{icon}</span>
      <span className="report-section-title">{title}</span>
      {count !== undefined && (
        <span className="report-section-count" style={{ borderColor: color, color }}>{count}</span>
      )}
    </div>
    {children}
  </div>
);

// ─── Main Resume Page ──────────────────────────────────────────────────────────
const Resume = () => {
  const [file, setFile]         = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');
  const fileInputRef            = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setResult(null); setError(''); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setError('');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await uploadResume(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="resume-page">
      <div className="resume-page-header">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem' }}>
            Resume Analysis
          </h1>
          <p style={{ color: 'var(--text-2)', maxWidth: '580px' }}>
            Upload your resume — our engine extracts your real skills, detects projects, 
            identifies skill gaps, and generates a targeted learning roadmap.
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      {!result && (
        <div
          className={`upload-zone ${file ? 'has-file' : ''} ${dragging ? 'drag-over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">{file ? '✅' : '📄'}</div>
          <div className="upload-title">
            {file ? file.name : 'Drag & drop your resume here'}
          </div>
          <div className="upload-sub">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB · Ready to analyze`
              : 'Supports PDF, DOCX, TXT · Max 5MB'}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {result && (
          <button
            className="btn-secondary"
            onClick={() => { setResult(null); setFile(null); setError(''); }}
          >
            ↩ Upload New Resume
          </button>
        )}
        {!result && (
          <button
            className="btn-primary"
            disabled={!file || uploading}
            onClick={handleUpload}
            style={{ width: '220px', justifyContent: 'center' }}
          >
            {uploading
              ? <><span className="spinner" /> Analyzing…</>
              : '🔍 Analyze Resume'}
          </button>
        )}
      </div>

      {error && (
        <div className="alert error" style={{ marginTop: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ─── Analysis Report ─────────────────────────────────────── */}
      {result && (
        <div className="analysis-report" style={{ marginTop: '3rem' }}>

          {/* ── Report Hero ── */}
          <div className="report-hero">
            <ScoreRing score={result.placementScore ?? 0} />
            <div className="report-hero-info">
              <div className="report-hero-file">
                📄 {result.fileName}
              </div>
              <div className="report-hero-role">{result.bestMatchRole}</div>
              <div className="report-hero-sub">Best matched role based on your resume</div>
              <div className="report-hero-stats">
                <div className="hero-stat">
                  <span className="hero-stat-val">{result.extractedSkills?.length ?? 0}</span>
                  <span className="hero-stat-lbl">Skills Found</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val" style={{ color: '#ef4444' }}>
                    {result.missingSkills?.length ?? 0}
                  </span>
                  <span className="hero-stat-lbl">Skill Gaps</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val" style={{ color: '#3b82f6' }}>
                    {result.projects?.length ?? 0}
                  </span>
                  <span className="hero-stat-lbl">Projects</span>
                </div>
                <div className="hero-stat">
                  <span className="hero-stat-val" style={{ color: '#8b5cf6' }}>
                    {result.links?.length ?? 0}
                  </span>
                  <span className="hero-stat-lbl">Links</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Skills & Gaps ── */}
          <div className="skills-two-col">
            {/* Skills Present */}
            <ReportSection
              icon="✅" title="Skills Present"
              count={result.extractedSkills?.length}
              color="rgba(16,185,129,0.25)"
            >
              {result.extractedSkills?.length > 0 ? (
                <div className="badge-wrap" style={{ marginTop: '1rem' }}>
                  {result.extractedSkills.map(s => (
                    <span key={s} className="badge success">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="report-empty">No recognizable tech skills detected in this resume.</p>
              )}
            </ReportSection>

            {/* Skill Gaps */}
            <ReportSection
              icon="📌" title={`Skill Gaps for ${result.bestMatchRole}`}
              count={result.missingSkills?.length}
              color="rgba(239,68,68,0.25)"
            >
              {result.missingSkills?.length > 0 ? (
                <div className="badge-wrap" style={{ marginTop: '1rem' }}>
                  {result.missingSkills.map(s => (
                    <span key={s} className="badge danger">{s}</span>
                  ))}
                </div>
              ) : (
                <p className="report-empty" style={{ color: 'var(--success)' }}>
                  🎉 Full skill coverage for this role!
                </p>
              )}
            </ReportSection>
          </div>

          {/* ── Projects ── */}
          {result.projects?.length > 0 && (
            <ReportSection
              icon="🗂️" title="Projects Extracted from Resume"
              count={result.projects.length}
              color="rgba(59,130,246,0.25)"
            >
              <div className="projects-grid" style={{ marginTop: '1.2rem' }}>
                {result.projects.map((proj, i) => (
                  <ProjectCard key={i} project={proj} index={i} />
                ))}
              </div>
            </ReportSection>
          )}

          {/* ── Links ── */}
          {result.links?.length > 0 && (
            <ReportSection
              icon="🔗" title="Links Found in Resume"
              count={result.links.length}
              color="rgba(139,92,246,0.25)"
            >
              <div className="links-wrap" style={{ marginTop: '1rem' }}>
                {result.links.map((link, i) => (
                  <DisabledLink key={i} url={link} />
                ))}
              </div>
              <p className="links-note">
                🔒 Links are displayed for reference only and are not clickable.
              </p>
            </ReportSection>
          )}

          {/* ── Learning Roadmap ── */}
          {result.learningRoadmap?.length > 0 && (
            <ReportSection
              icon="🗺️" title="Personalized Learning Roadmap"
              color="rgba(245,158,11,0.25)"
            >
              <ul className="roadmap-list" style={{ marginTop: '1.2rem' }}>
                {result.learningRoadmap.map((step, idx) => (
                  <li key={idx} className="roadmap-item">
                    <div className="roadmap-num">{idx + 1}</div>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </ReportSection>
          )}

        </div>
      )}
    </div>
  );
};

export default Resume;
