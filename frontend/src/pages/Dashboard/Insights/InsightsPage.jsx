import { Icon } from '../../../components/common/Icons';

export const InsightsPage = ({ report, onNavigate }) => {
  if (!report) {
    return (
      <div className="overview-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h1>AI Business Insights</h1>
        <p className="overview-subtitle" style={{ margin: '12px 0 20px' }}>
          Upload a document to generate insights from its extracted records.
        </p>
        <button className="btn-login-submit" onClick={() => onNavigate('upload')}>
          <Icon name="upload" size={16} color="#fff" />
          <span>Upload Document</span>
        </button>
      </div>
    );
  }

  const insights = report.biInsights || [];
  const recommendations = report.recommendations || [];

  return (
    <div className="overview-container">
      <div className="overview-header">
        <div className="overview-title-group">
          <h1>AI Business Insights</h1>
          <p className="overview-subtitle">
            Observations based only on extracted data from <strong>{report.docName}</strong>. These are decision-support prompts, not financial predictions.
          </p>
        </div>
        <div className="overview-actions">
          <button className="header-action-btn" onClick={() => onNavigate('chatbot')}>
            <Icon name="chatbot" size={15} color="#fff" />
            <span>Ask about this document</span>
          </button>
        </div>
      </div>

      <section className="mfd-card">
        <h2 className="chart-card-title">
          <Icon name="insights" size={18} color="var(--secondary)" />
          Extracted-data findings
        </h2>
        {insights.length === 0 ? (
          <p className="overview-subtitle" style={{ marginTop: '12px' }}>
            The document does not contain enough supported values to produce an insight.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '16px' }}>
            {insights.map((insight, index) => (
              <article key={`${insight.title}-${index}`} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span className={`badge ${insight.type === 'MISSING_DATA' ? 'badge-warning' : 'badge-info'}`}>{insight.type}</span>
                <h3 style={{ fontSize: '14px', margin: '10px 0 6px' }}>{insight.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{insight.detail}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mfd-card">
        <h2 className="chart-card-title">
          <Icon name="shield" size={18} color="var(--primary-light)" />
          Areas to review
        </h2>
        {recommendations.length === 0 ? (
          <p className="overview-subtitle" style={{ marginTop: '12px' }}>
            No data-supported review recommendations are available for this document.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px', marginTop: '16px' }}>
            {recommendations.map((recommendation, index) => (
              <article key={`${recommendation.tag}-${index}`} style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{recommendation.tag}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{recommendation.observation}</p>
                <p style={{ marginTop: '10px', fontSize: '12px' }}><strong>Possible follow-up:</strong> {recommendation.action}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
