import './Overview.css';
import { Icon } from '../../components/common/Icons';
import { 
  SchemeBarChart, 
  MonthlyTrendLineChart, 
  AssetDonutChart, 
  TransactionDistributionChart 
} from '../../components/common/dashboard/charts/InteractiveCharts';

export const Overview = ({ report, onNavigate }) => {
  if (!report) {
    return (
      <div className="overview-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>No Document Analyzed Yet</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '12px 0 20px' }}>
          Please upload or select a brokerage document to activate the dashboard.
        </p>
        <button className="btn-login-submit" onClick={() => onNavigate('upload')}>
          <Icon name="upload" size={16} color="#fff" />
          <span>Upload Document</span>
        </button>
      </div>
    );
  }

  const { summary, schemeList, returnAnalysis, biInsights } = report;

  const formatCurrency = (val) => {
    if (val === null || val === undefined) return "Not available";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };
  const formatNumber = (val) => val === null || val === undefined
    ? 'Not available'
    : Number(val).toLocaleString('en-IN');

  return (
    <div className="overview-container">
      {/* Dashboard Header */}
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>FundLens-AI Overview Dashboard</h1>
          <p className="overview-subtitle">
            Analyzed Document: <strong>{report.docName}</strong> ({report.source}) • Period: {summary.period}
          </p>
        </div>

        <div className="overview-actions">
          <button className="btn-secondary" onClick={() => onNavigate('reports')}>
            <Icon name="reports" size={15} />
            <span>View Full Report</span>
          </button>
          <button className="header-action-btn" onClick={() => onNavigate('chatbot')}>
            <Icon name="bot" size={15} color="#fff" />
            <span>Ask Document AI</span>
          </button>
        </div>
      </div>

      {/* Return Availability Notice */}
      {!returnAnalysis.hasSufficientData ? (
        <div className="badge badge-warning" style={{ padding: '14px 18px', fontSize: '13px', width: '100%', justifyContent: 'flex-start' }}>
          <Icon name="alert" size={18} />
          <span>
            <strong>Valuation Notice:</strong> {returnAnalysis.message}
          </span>
        </div>
      ) : (
        <div className="badge badge-success" style={{ padding: '14px 18px', fontSize: '13px', width: '100%', justifyContent: 'flex-start' }}>
          <Icon name="check" size={18} />
          <span>
            <strong>Deterministic Return:</strong> {returnAnalysis.absoluteReturn}% Absolute Return (Profit: {formatCurrency(returnAnalysis.totalProfit)}) calculated from the document's invested-total and current-value fields.
          </span>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">TOTAL RECORDS ANALYZED</span>
            <div className="metric-icon-wrap icon-blue">
              <Icon name="fileSpreadsheet" size={18} />
            </div>
          </div>
          <span className="metric-main-val">{summary.totalRecords}</span>
          <div className="metric-footer">
            <span>{formatNumber(summary.foliosCount)} Unique Folios</span>
            <span>{formatNumber(summary.investorsCount)} Investors</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">TOTAL INVESTMENT</span>
            <div className="metric-icon-wrap icon-emerald">
              <Icon name="wallet" size={18} />
            </div>
          </div>
          <span className="metric-main-val">{formatCurrency(summary.totalInvestment)}</span>
          <div className="metric-footer">
            <span>Total Units: {formatNumber(summary.totalUnits)}</span>
            <span>{summary.schemesCount} Schemes</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">TOTAL BROKERAGE EARNED</span>
            <div className="metric-icon-wrap icon-purple">
              <Icon name="brokerage" size={18} />
            </div>
          </div>
          <span className="metric-main-val">{formatCurrency(summary.totalBrokerage)}</span>
          <div className="metric-footer">
            <span>Avg Rate: {summary.avgBrokerageRate}</span>
            <span>Trail Regular</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">TOTAL ASSETS ANALYZED</span>
            <div className="metric-icon-wrap icon-amber">
              <Icon name="assets" size={18} />
            </div>
          </div>
          <span className="metric-main-val">{formatCurrency(summary.totalAssetsAnalyzed)}</span>
          <div className="metric-footer">
            <span>Recorded average assets</span>
            <span>Normalized</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE GRAPHS & VISUALIZATION SUITE */}
      <div className="charts-grid-container">
        {/* Graph 1: Scheme Bar Chart (Investment / Brokerage / Units toggle) */}
        <SchemeBarChart schemeList={schemeList} />

        {/* Graph 2: 6-Month Monthly Brokerage & AUM Revenue Area Curve */}
        <MonthlyTrendLineChart records={report.normalizedRecords} />

        {/* Graph 3: Asset Class Allocation Donut Ring */}
        <AssetDonutChart schemeList={schemeList} />

        {/* Graph 4: Transaction-Type Distribution Flow */}
        <TransactionDistributionChart records={report.normalizedRecords} />
      </div>

      {/* Business Intelligence Insights */}
      <div className="mfd-card" style={{ marginTop: '24px' }}>
        <div className="chart-card-header">
          <div>
            <h2 className="chart-card-title">
              <Icon name="insights" size={18} color="var(--secondary)" />
              AI Business Intelligence Findings
            </h2>
            <p className="overview-subtitle">Data-grounded patterns & revenue drivers extracted by BI Agent</p>
          </div>
          <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => onNavigate('insights')}>
            View All AI Insights
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          {biInsights.map((insight, idx) => (
            <div key={idx} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{insight.title}</span>
                <span className={`badge ${insight.type === 'CONCENTRATION' ? 'badge-warning' : insight.type === 'REVENUE' ? 'badge-primary' : 'badge-info'}`} style={{ fontSize: '9px' }}>
                  {insight.type}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {insight.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
