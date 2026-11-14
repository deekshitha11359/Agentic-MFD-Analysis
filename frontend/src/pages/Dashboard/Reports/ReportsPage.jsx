import { useState } from 'react';
import { Icon } from '../../../components/common/Icons';

export const ReportsPage = ({ report, onNavigate }) => {
  const [shareModal, setShareModal] = useState(null); // 'email' | 'whatsapp' | 'link'

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

  const { summary, schemeList, returnAnalysis, biInsights, recommendations, missingDataFields, suggestedQuestions } = report;
  const formatCurrency = (value) => value === null || value === undefined
    ? 'Not available'
    : `₹${Number(value).toLocaleString('en-IN')}`;
  const formatNumber = (value) => value === null || value === undefined
    ? 'Not available'
    : Number(value).toLocaleString('en-IN');

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvRows = [
      ["Scheme Name", "AMC Code", "Invested Amount", "Units", "Current Value", "Brokerage Amount"],
      ...schemeList.map(s => [s.schemeName, s.amcCode, s.totalInvestment, s.totalUnits, s.currentValue, s.brokerageAmount])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${report.docName.replace(/\.[^/.]+$/, "")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="overview-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Action Header */}
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>Comprehensive Brokerage & Intelligence Report</h1>
          <p className="overview-subtitle">
            Generated autonomously by Report Generation Agent • Document: <strong>{report.docName}</strong>
          </p>
        </div>

        <div className="overview-actions">
          <button className="btn-secondary" onClick={handleDownloadCSV}>
            <Icon name="fileSpreadsheet" size={15} />
            <span>Download CSV</span>
          </button>
          <button className="btn-secondary" onClick={handleDownloadPDF}>
            <Icon name="download" size={15} />
            <span>Download / Print PDF</span>
          </button>
          <button className="header-action-btn" onClick={() => setShareModal('menu')}>
            <Icon name="send" size={15} color="#fff" />
            <span>Share Report</span>
          </button>
        </div>
      </div>

      {/* 10-SECTION FORMAL REPORT DOCUMENT */}
      <div className="mfd-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: '28px', background: 'var(--bg-card)' }}>
        
        {/* Section 1: Executive Summary */}
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 1</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>1. Executive Summary</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            This report summarizes the multi-agent financial extraction and brokerage analysis for <strong>{report.docName}</strong>. 
            The dataset comprises <strong>{summary.totalRecords} records</strong> and <strong>{formatCurrency(summary.totalInvestment)}</strong> in recorded investment
            across <strong>{summary.schemesCount} mutual fund schemes</strong>. Recorded brokerage: <strong>{formatCurrency(summary.totalBrokerage)}</strong>.
          </p>
        </div>

        {/* Section 2: Document Information */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 2</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>2. Document Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>File Name:</span> <div style={{ fontSize: '13px', fontWeight: '700' }}>{report.docName}</div></div>
            <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Document Type:</span> <div style={{ fontSize: '13px', fontWeight: '700' }}>{report.docType}</div></div>
            <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Detected Source:</span> <div style={{ fontSize: '13px', fontWeight: '700' }}>{report.source}</div></div>
            <div><span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Analysis Period:</span> <div style={{ fontSize: '13px', fontWeight: '700' }}>{summary.period}</div></div>
          </div>
        </div>

        {/* Section 3: Portfolio / Transaction Summary */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 3</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>3. Portfolio & Transaction Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Investment</span>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{formatCurrency(summary.totalInvestment)}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Units</span>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{formatNumber(summary.totalUnits)}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Brokerage</span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--success)' }}>{formatCurrency(summary.totalBrokerage)}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Schemes / Folios</span>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{summary.schemesCount} Schemes / {summary.foliosCount} Folios</div>
            </div>
          </div>
        </div>

        {/* Section 4: Brokerage Analysis */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 4</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>4. Brokerage Analysis</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Average Brokerage Rate: <strong>{summary.avgBrokerageRate}</strong> across a recorded average-asset base of <strong>{formatCurrency(summary.totalAssetsAnalyzed)}</strong>.
          </p>
          <ul style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.6' }}>
            <li><strong>AM_RATE / CAM_RATE / MAM_RATE</strong>: Granular distribution rates parsed into internal schema.</li>
            <li><strong>GST / TDS</strong>: TDS applicable @ 5% under Section 194H.</li>
          </ul>
        </div>

        {/* Section 5: Asset Analysis */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 5</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '10px' }}>5. Asset-Level Analysis</h2>
          <div className="table-responsive">
            <table className="mfd-table">
              <thead>
                <tr>
                  <th>Scheme</th>
                  <th>Investment</th>
                  <th>Units</th>
                  <th>Current Value</th>
                  <th>Brokerage</th>
                </tr>
              </thead>
              <tbody>
                {schemeList.map(s => (
                  <tr key={s.schemeName}>
                    <td>{s.schemeName}</td>
                    <td>{formatCurrency(s.totalInvestment)}</td>
                    <td>{formatNumber(s.totalUnits)}</td>
                    <td>{formatCurrency(s.currentValue)}</td>
                    <td style={{ color: 'var(--success)' }}>{formatCurrency(s.brokerageAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6: Return Analysis */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 6</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>6. Return Analysis</h2>
          {returnAnalysis.hasSufficientData ? (
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>Total Invested: <strong>{formatCurrency(returnAnalysis.totalInvested)}</strong></div>
                <div>Current Valuation: <strong>{formatCurrency(returnAnalysis.totalCurrentVal)}</strong></div>
                <div>Absolute Profit: <strong style={{ color: 'var(--success)' }}>{formatCurrency(returnAnalysis.totalProfit)}</strong></div>
                <div>Absolute Return %: <strong style={{ color: 'var(--success)' }}>+{returnAnalysis.absoluteReturn}%</strong></div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                Basis: {returnAnalysis.calculationBasis}
              </div>
            </div>
          ) : (
            <div className="badge badge-warning" style={{ padding: '10px 14px', width: '100%', justifyContent: 'flex-start' }}>
              <Icon name="alert" size={16} />
              <span>{returnAnalysis.message}</span>
            </div>
          )}
        </div>

        {/* Section 7: Business Intelligence */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 7</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>7. Business Intelligence & Pattern Recognition</h2>
          {biInsights.map((bi, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              • <strong>{bi.title}</strong>: {bi.detail}
            </div>
          ))}
        </div>

        {/* Section 8: Recommendations */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 8</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>8. Data-Supported Recommendations</h2>
          {recommendations.map((rec, i) => (
            <div key={i} style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              • <strong>{rec.tag}</strong>: {rec.observation}
            </div>
          ))}
        </div>

        {/* Section 9: Missing Data */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 9</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>9. Missing Data & Gap Identification</h2>
          {missingDataFields.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--success)' }}>
              All core transaction, valuation, and commission fields were successfully extracted.
            </p>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--warning)' }}>
              The following fields were not present in this document: {missingDataFields.join(', ')}.
            </div>
          )}
        </div>

        {/* Section 10: Suggested Questions */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>SECTION 10</span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>10. Suggested Questions for AI Copilot</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {suggestedQuestions.map((q, i) => (
              <span key={i} className="badge badge-info" style={{ padding: '6px 12px', fontSize: '12px' }}>
                {q}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="mfd-card" style={{ maxWidth: '440px', width: '100%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px' }}>Share Analysis Report</h3>
            
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              🔒 <strong>Privacy Guard</strong>: Financial data is sensitive. Ensure recipient authorization before sharing.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px' }} disabled title="A secure backend share link is not configured">
                <Icon name="shield" size={16} />
                <span>Copy Report Link — setup required</span>
              </button>

              <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px' }} disabled title="Download the report and attach it manually after verifying the recipient">
                <Icon name="send" size={16} />
                <span>Email Report — manual download required</span>
              </button>

              <button className="btn-secondary" style={{ justifyContent: 'flex-start', padding: '12px' }} disabled title="Download the report and share manually after verifying the recipient">
                <Icon name="chatbot" size={16} />
                <span>WhatsApp — manual download required</span>
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button className="btn-secondary" onClick={() => setShareModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
