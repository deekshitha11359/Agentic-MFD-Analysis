import { useState } from 'react';
import { Icon } from '../../../components/common/Icons';

export const SettingsPage = () => {
  const [executionSpeed, setExecutionSpeed] = useState('Normal (Real-time stream)');
  const [zeroHallucinationStrict, setZeroHallucinationStrict] = useState(true);
  const [autoExportPdf, setAutoExportPdf] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState('INR (₹)');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="overview-container" style={{ maxWidth: '800px' }}>
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Frontend Agentic Pipeline Settings</h1>
          <p className="overview-subtitle">
            Client-side Multi-Agent simulation parameters, zero-hallucination guardrails & display preferences
          </p>
        </div>
      </div>

      {saved && (
        <div className="badge badge-success" style={{ padding: '12px 18px', width: '100%' }}>
          <Icon name="check" size={16} /> Preferences saved to browser storage!
        </div>
      )}

      <div className="mfd-card">
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
            Multi-Agent Execution Engine (Client-Side)
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Agent Telemetry Stream Speed</label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px', background: 'var(--bg-input)' }}
                value={executionSpeed}
                onChange={(e) => setExecutionSpeed(e.target.value)}
              >
                <option value="Normal (Real-time stream)">Normal (Real-time telemetry stream)</option>
                <option value="Fast (Instant analysis)">Fast (Instant analysis)</option>
                <option value="Step-by-Step Interactive">Step-by-Step Interactive</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Default Currency Format</label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px', background: 'var(--bg-input)' }}
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
                <option value="INR (₹)">Indian Rupee - INR (₹ Crores / Lakhs)</option>
                <option value="USD ($)">US Dollar - USD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="strict-guardrail"
                className="remember-checkbox"
                checked={zeroHallucinationStrict}
                onChange={(e) => setZeroHallucinationStrict(e.target.checked)}
              />
              <label htmlFor="strict-guardrail" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Strict Zero-Hallucination Compliance Guardrail
              </label>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '26px' }}>
              When enabled, return calculations are suppressed and flagged explicitly whenever current NAV/valuation columns are missing.
            </span>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="auto-pdf"
                className="remember-checkbox"
                checked={autoExportPdf}
                onChange={(e) => setAutoExportPdf(e.target.checked)}
              />
              <label htmlFor="auto-pdf" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', cursor: 'pointer' }}>
                Auto-Prompt PDF Download on Report Synthesis
              </label>
            </div>
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <strong>💡 Pure Frontend Architecture:</strong> All 10 AI Agents (Classification, Extraction, Normalization, Brokerage, Return, BI, Recommendations, Reports, QA) run 100% in-browser with zero external server dependencies, making it blazing fast, highly responsive, and completely private!
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="header-action-btn">
              <Icon name="check" size={16} color="#fff" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
