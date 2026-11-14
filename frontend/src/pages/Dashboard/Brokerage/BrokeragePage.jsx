import { useState } from 'react';
import { Icon } from '../../../components/common/Icons';
import { FIELD_DEFINITIONS } from '../../../services/agentPipeline';

export const BrokeragePage = ({ report, onNavigate }) => {
  const [selectedField, setSelectedField] = useState('BRKAGE_RATE');

  if (!report) {
    return (
      <div className="overview-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Please Upload a Brokerage Document First</h2>
        <button className="btn-login-submit" style={{ marginTop: '16px' }} onClick={() => onNavigate('upload')}>
          Upload Statement
        </button>
      </div>
    );
  }

  const { normalizedRecords } = report;
  const formatCurrency = (value) => value === null || value === undefined || value === ''
    ? 'Not available'
    : `₹${Number(value).toLocaleString('en-IN')}`;

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Brokerage Field & Commission Analysis</h1>
          <p className="overview-subtitle">
            Demystifying technical fee codes, trail rate splits, and AMC commission schedules
          </p>
        </div>
      </div>

      {/* Field Glossary Cards */}
      <div className="mfd-card">
        <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icon name="brokerage" size={18} color="var(--primary-light)" />
          Interactive Technical Field Dictionary
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {Object.entries(FIELD_DEFINITIONS).slice(0, 6).map(([field, desc]) => (
            <div
              key={field}
              onClick={() => setSelectedField(field)}
              style={{
                background: selectedField === field ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-input)',
                border: selectedField === field ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--primary-light)', fontSize: '13px' }}>
                  {field}
                </span>
                <span className="badge badge-primary" style={{ fontSize: '9px' }}>EXPLAINED</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Extracted Record-Level Brokerage Table */}
      <div className="mfd-card">
        <div className="chart-card-header">
          <div>
            <h2 className="chart-card-title">
              <Icon name="fileSpreadsheet" size={18} color="var(--secondary)" />
              Extracted Transaction Brokerage Details
            </h2>
            <p className="overview-subtitle">Showing fee rates, average assets, and trail component breakdowns</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="mfd-table">
            <thead>
              <tr>
                <th>Investor & Folio</th>
                <th>Scheme Name</th>
                <th>Avg Assets (AVG_ASSETS)</th>
                <th>Brokerage Rate (BRKAGE_RATE)</th>
                <th>AM / CAM / MAM Rates</th>
                <th>Brokerage Amount (BRKAGE_AMT)</th>
              </tr>
            </thead>
            <tbody>
              {normalizedRecords.map((r, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="scheme-name-cell">
                      <span className="scheme-title">{r.investorName || "Investor"}</span>
                      <span className="scheme-category-tag">{r.folioNumber || "Folio"}</span>
                    </div>
                  </td>
                  <td><strong>{r.schemeName || 'Not available'}</strong></td>
                  <td>{formatCurrency(r.averageAssets)}</td>
                  <td><span className="badge badge-primary">{r.brokerageRate || "Not available"}</span></td>
                  <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    AM: {r.amRate || "N/A"} | CAM: {r.camRate || "N/A"} | MAM: {r.mamRate || "N/A"}
                  </td>
                  <td style={{ color: 'var(--success)', fontWeight: '700' }}>
                    {formatCurrency(r.brokerageAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
