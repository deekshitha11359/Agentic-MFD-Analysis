import { Icon } from '../../components/common/Icons';

export const LandingPage = ({ onGetStarted, onSampleClick }) => {
  const agentModules = [
    { name: "Document Classification Agent", role: "Identifies file structure & broker origin (CAMS, Zerodha, Groww, ICICI)." },
    { name: "Document Extraction Agent", role: "Parses tabular streams, rows, and raw metadata without data loss." },
    { name: "Normalization Agent", role: "Maps technical fields (BRKAGE_RATE, AVG_ASSETS, CAM_RATE) to plain language." },
    { name: "Brokerage Analysis Agent", role: "Computes trail commission, gross/net splits, GST, and TDS." },
    { name: "Mutual Fund Analysis Agent", role: "Analyzes scheme allocation, units, NAVs, and AMC concentration." },
    { name: "Return Analysis Agent", role: "Deterministic calculation of absolute return, CAGR & XIRR with zero hallucinations." },
    { name: "Business Intelligence Agent", role: "Extracts revenue drivers, fee anomalies, and concentration risks." },
    { name: "Recommendation Agent", role: "Provides objective review points and data monitoring suggestions." },
    { name: "Report Generation Agent", role: "Synthesizes 10-section executive summaries ready for export." },
    { name: "Question Answering Agent", role: "Interactive natural language copilot grounded strictly in uploaded documents." }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '40px' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', paddingTop: '20px' }}>
        <span className="badge badge-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
          <Icon name="bot" size={15} /> Next-Gen Multi-Agent Financial Intelligence
        </span>

        <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px', lineHeight: '1.2', maxWidth: '850px' }}>
          MFD Brokerage Analytic AI Agent
        </h1>

        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', maxWidth: '720px', lineHeight: '1.6' }}>
          Autonomous Multi-Agent architecture for analyzing Mutual Fund Distributor (MFD) brokerage, 
          CAMS/KFintech feeds, Zerodha/Groww ledgers, and CAS statements with strict mathematical integrity.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '12px' }}>
          <button className="btn-login-submit" style={{ padding: '14px 28px', fontSize: '15px' }} onClick={onGetStarted}>
            <Icon name="upload" size={18} color="#fff" />
            <span>Upload Brokerage Document</span>
          </button>

          <button className="btn-secondary" style={{ padding: '14px 24px', fontSize: '15px' }} onClick={() => onSampleClick("doc-cams-01")}>
            <Icon name="fileSpreadsheet" size={18} color="var(--primary-light)" />
            <span>Load Demo CAMS Statement</span>
          </button>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="mfd-card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
            Multi-Agent Orchestrated Workflow Pipeline
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Every uploaded document passes through 10 coordinated autonomous agents with immutable traceability
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {agentModules.map((agent, idx) => (
            <div key={idx} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.2)', color: 'var(--primary-light)', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {idx + 1}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {agent.name}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {agent.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Supported Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div className="mfd-card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="shield" size={18} color="var(--primary)" /> Supported Formats
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            PDF statements, Excel (.xlsx, .xls), CSV feeds, TXT logs, CAMS DBF, Karvy MFS, and image scans (PNG, JPG).
          </p>
        </div>

        <div className="mfd-card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="assets" size={18} color="var(--secondary)" /> Multi-Platform Ingestion
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Flexible column mapping for CAMS, KFintech, Zerodha Coin, Groww, ICICI Direct, and direct AMC statements.
          </p>
        </div>

        <div className="mfd-card">
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="returns" size={18} color="var(--success)" /> Zero Hallucination Guarantee
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
            Returns and brokerage amounts are calculated strictly from verifiable data. Missing valuation is flagged explicitly.
          </p>
        </div>
      </div>
    </div>
  );
};
